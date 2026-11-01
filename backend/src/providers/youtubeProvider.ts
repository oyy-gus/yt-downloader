import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { BaseProviderAdapter } from './adapter.js';
import { MockProviderAdapter } from './mockProvider.js';
import type { UrlInfo, ProviderMetadata } from '../types/index.js';

export class YouTubeProviderAdapter extends BaseProviderAdapter {
  private mockAdapter: MockProviderAdapter;
  private forceMock: boolean;
  private executable: string;

  constructor() {
    super('YouTubeProvider');
    this.mockAdapter = new MockProviderAdapter();
    this.forceMock = process.env.DEV_MOCK_MODE === 'true';
    this.executable = this._resolveYtDlpExecutable();
  }

  private _resolveYtDlpExecutable(): string {
    const localExe = path.join(process.cwd(), 'yt-dlp.exe');
    if (fs.existsSync(localExe)) return localExe;

    const backendExe = path.join(process.cwd(), 'backend', 'yt-dlp.exe');
    if (fs.existsSync(backendExe)) return backendExe;

    const localBin = path.join(process.cwd(), 'yt-dlp');
    if (fs.existsSync(localBin)) return localBin;

    const backendBin = path.join(process.cwd(), 'backend', 'yt-dlp');
    if (fs.existsSync(backendBin)) return backendBin;

    return 'yt-dlp';
  }

  async analyzeUrl(urlInfo: UrlInfo): Promise<ProviderMetadata> {
    if (this.forceMock) {
      return this.mockAdapter.analyzeUrl(urlInfo);
    }

    const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();
    if (apiKey) {
      try {
        const apiMetadata = await this._fetchWithYouTubeDataApi(urlInfo, apiKey);
        if (apiMetadata) {
          return apiMetadata;
        }
      } catch (apiErr: any) {
        console.warn(`[YouTubeProvider] YouTube Data API failed: ${apiErr?.message || apiErr}. Falling back to yt-dlp.`);
      }
    }

    try {
      const metadata = await this._executeYtDlpJson(urlInfo.normalizedUrl || '');
      if (!metadata) {
        throw new Error('Tidak ada metadata yang dikembalikan dari YouTube.');
      }
      return this._formatYtDlpMetadata(metadata, urlInfo);
    } catch (err: any) {
      const isMissingBinary = err.code === 'ENOENT' || (err.message && err.message.includes('ENOENT'));
      if (this.forceMock || isMissingBinary) {
        console.warn(`[YouTubeProvider] yt-dlp execution failed (${this.executable}). Falling back to Mock Mode: ${err.message}`);
        return this.mockAdapter.analyzeUrl(urlInfo);
      }
      throw new Error(`Gagal membaca informasi URL YouTube: ${err.message}`);
    }
  }

  private async _fetchWithYouTubeDataApi(urlInfo: UrlInfo, apiKey: string): Promise<ProviderMetadata | null> {
    const listId = urlInfo.playlistId;
    const videoId = urlInfo.videoId;

    if (listId) {
      const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${listId}&key=${apiKey}`);
      const plData = await plRes.json() as any;
      if (!plRes.ok || !plData.items || plData.items.length === 0) {
        throw new Error(plData.error?.message || 'Playlist not found via YouTube Data API');
      }

      const playlistSnippet = plData.items[0].snippet;

      const itemsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${listId}&maxResults=50&key=${apiKey}`);
      const itemsData = await itemsRes.json() as any;
      if (!itemsRes.ok || !itemsData.items) {
        throw new Error(itemsData.error?.message || 'Failed to fetch playlist items via YouTube Data API');
      }

      const entries = itemsData.items.map((item: any, idx: number) => {
        const vId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId;
        const thumbnails = item.snippet?.thumbnails;
        const bestThumb = thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

        return {
          id: vId || `track-${idx}`,
          title: item.snippet?.title || 'Untitled Track',
          artist: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || null,
          channel: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || null,
          durationSec: 0,
          thumbnail: bestThumb,
          url: vId ? `https://www.youtube.com/watch?v=${vId}` : null
        };
      });

      return {
        isDemo: false,
        type: 'playlist',
        title: playlistSnippet.title || 'YouTube Playlist',
        channel: playlistSnippet.channelTitle || 'YouTube Channel',
        thumbnail: playlistSnippet.thumbnails?.high?.url || entries[0]?.thumbnail || null,
        totalEntries: entries.length,
        entries
      };
    }

    if (videoId) {
      const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
      const vData = await vRes.json() as any;
      if (!vRes.ok || !vData.items || vData.items.length === 0) {
        throw new Error(vData.error?.message || 'Video not found via YouTube Data API');
      }

      const snippet = vData.items[0].snippet;
      const thumbnails = snippet.thumbnails;
      const bestThumb = thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        isDemo: false,
        type: 'track',
        title: snippet.title || 'YouTube Track',
        artist: snippet.channelTitle || null,
        channel: snippet.channelTitle || null,
        durationSec: 0,
        thumbnail: bestThumb,
        totalEntries: 1,
        entries: [
          {
            id: videoId,
            title: snippet.title || 'YouTube Track',
            artist: snippet.channelTitle || null,
            channel: snippet.channelTitle || null,
            durationSec: 0,
            thumbnail: bestThumb,
            url: urlInfo.normalizedUrl
          }
        ]
      };
    }

    return null;
  }

  private async _executeYtDlpJson(url: string): Promise<any> {
    const browserCookie = (process.env.COOKIES_FROM_BROWSER || '').trim().toLowerCase();
    const rootCookies = path.join(process.cwd(), 'cookies.txt');
    const backendCookies = path.join(process.cwd(), 'backend', 'cookies.txt');

    const cookieArgs: string[] = [];
    if (browserCookie && browserCookie.length > 0) {
      cookieArgs.push('--cookies-from-browser', browserCookie);
    } else if (fs.existsSync(rootCookies)) {
      cookieArgs.push('--cookies', rootCookies);
    } else if (fs.existsSync(backendCookies)) {
      cookieArgs.push('--cookies', backendCookies);
    }

    const attempts: string[][] = [
      [
        '--dump-single-json',
        '--flat-playlist',
        '--no-warnings',
        '--js-runtimes', 'node',
        '--remote-components', 'ejs:github',
        ...cookieArgs,
        url
      ],
      [
        '--dump-single-json',
        '--flat-playlist',
        '--no-warnings',
        '--js-runtimes', 'node',
        '--remote-components', 'ejs:github',
        '--extractor-args', 'youtube:player_client=android,mweb',
        ...cookieArgs,
        url
      ],
      [
        '--dump-single-json',
        '--flat-playlist',
        '--no-warnings',
        '--js-runtimes', 'node',
        '--remote-components', 'ejs:github',
        '--extractor-args', 'youtube:player_client=ios,web',
        ...cookieArgs,
        url
      ]
    ];

    let lastError: any = null;
    for (const args of attempts) {
      try {
        const result = await this._spawnYtDlpJson(args);
        if (result) return result;
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error('Gagal mengeksekusi yt-dlp.');
  }

  private _spawnYtDlpJson(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.executable, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', chunk => stdout += chunk);
      proc.stderr.on('data', chunk => stderr += chunk);

      proc.on('close', code => {
        if (code === 0 && stdout.trim()) {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new Error('Failed to parse yt-dlp JSON response'));
          }
        } else {
          reject(new Error(stderr || `yt-dlp exited with code ${code}`));
        }
      });

      proc.on('error', err => reject(err));
    });
  }

  private _formatYtDlpMetadata(data: any, urlInfo: UrlInfo): ProviderMetadata {
    if (data._type === 'playlist') {
      const entries = (data.entries || []).map((item: any, idx: number) => {
        const videoId = item.id || item.url?.match(/[?&]v=([^&]+)/)?.[1];
        const videoUrl = videoId
          ? `https://www.youtube.com/watch?v=${videoId}`
          : (item.url || null);

        const thumbnail = item.thumbnails?.[item.thumbnails.length - 1]?.url
          || item.thumbnail
          || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

        return {
          id: item.id || `track-${idx}`,
          title: item.title || 'Untitled Track',
          artist: item.artist || item.uploader || item.channel || null,
          composer: item.composer || item.creator || null,
          channel: item.uploader || item.channel || null,
          durationSec: item.duration || 0,
          thumbnail,
          url: videoUrl
        };
      });

      const playlistThumb = data.thumbnails?.[data.thumbnails.length - 1]?.url
        || entries[0]?.thumbnail
        || null;

      return {
        isDemo: false,
        type: (urlInfo.type === 'track' || urlInfo.type === 'mix' || urlInfo.type === 'playlist') ? urlInfo.type : 'playlist',
        title: data.title || 'YouTube Playlist',
        channel: data.uploader || data.channel || 'YouTube Channel',
        thumbnail: playlistThumb,
        totalEntries: entries.length,
        entries
      };
    }

    const videoId = data.id || urlInfo.videoId;
    const thumbnail = data.thumbnails?.[data.thumbnails.length - 1]?.url
      || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

    return {
      isDemo: false,
      type: 'track',
      title: data.title || 'YouTube Track',
      artist: data.artist || data.uploader || null,
      composer: data.composer || data.creator || null,
      channel: data.uploader || data.channel || null,
      durationSec: data.duration || 0,
      thumbnail,
      totalEntries: 1,
      entries: [
        {
          id: videoId || 'track-0',
          title: data.title || 'YouTube Track',
          artist: data.artist || data.uploader || null,
          composer: data.composer || data.creator || null,
          channel: data.uploader || null,
          durationSec: data.duration || 0,
          thumbnail,
          url: urlInfo.normalizedUrl || ''
        }
      ]
    };
  }
}
