/**
 * Modular YouTube Provider Adapter with yt-dlp binary integration & Mock Fallback
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { BaseProviderAdapter } from './adapter.js';
import { MockProviderAdapter } from './mockProvider.js';

export class YouTubeProviderAdapter extends BaseProviderAdapter {
  constructor(options = {}) {
    super('YouTubeProvider');
    this.mockAdapter = new MockProviderAdapter();
    this.forceMock = process.env.DEV_MOCK_MODE === 'true';
    this.executable = this._resolveYtDlpExecutable();
  }

  _resolveYtDlpExecutable() {
    const localExe = path.join(process.cwd(), 'yt-dlp.exe');
    if (fs.existsSync(localExe)) return localExe;

    const localBin = path.join(process.cwd(), 'yt-dlp');
    if (fs.existsSync(localBin)) return localBin;

    return 'yt-dlp';
  }

  async analyzeUrl(urlInfo) {
    if (this.forceMock) {
      return this.mockAdapter.analyzeUrl(urlInfo);
    }

    try {
      const metadata = await this._executeYtDlpJson(urlInfo.normalizedUrl);
      if (!metadata) {
        return this.mockAdapter.analyzeUrl(urlInfo);
      }
      return this._formatYtDlpMetadata(metadata, urlInfo);
    } catch (err) {
      console.warn(`[YouTubeProvider] yt-dlp execution failed (${this.executable}). Falling back to Mock Mode: ${err.message}`);
      return this.mockAdapter.analyzeUrl(urlInfo);
    }
  }

  _executeYtDlpJson(url) {
    return new Promise((resolve, reject) => {
      const browserCookie = (process.env.COOKIES_FROM_BROWSER || '').trim().toLowerCase();
      const cookiesFilePath = path.join(process.cwd(), 'cookies.txt');

      const args = ['--dump-single-json', '--flat-playlist', '--no-warnings'];

      if (browserCookie && browserCookie.length > 0) {
        args.push('--cookies-from-browser', browserCookie);
      } else if (fs.existsSync(cookiesFilePath)) {
        args.push('--cookies', cookiesFilePath);
      }

      args.push(url);

      const proc = spawn(this.executable, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', chunk => stdout += chunk);
      proc.stderr.on('data', chunk => stderr += chunk);

      proc.on('close', code => {
        if (code === 0 && stdout.trim()) {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            reject(new Error('Failed to parse yt-dlp JSON response'));
          }
        } else {
          reject(new Error(stderr || `yt-dlp exited with code ${code}`));
        }
      });

      proc.on('error', err => reject(err));
    });
  }

  _formatYtDlpMetadata(data, urlInfo) {
    if (data._type === 'playlist') {
      const entries = (data.entries || []).map((item, idx) => {
        // --flat-playlist only returns id and title, not full URL
        const videoId = item.id || item.url?.match(/[?&]v=([^&]+)/)?.[1];
        const videoUrl = videoId
          ? `https://www.youtube.com/watch?v=${videoId}`
          : (item.url || null);

        // Best thumbnail available
        const thumbnail = item.thumbnails?.[item.thumbnails.length - 1]?.url
          || item.thumbnail
          || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

        return {
          id: item.id || `track-${idx}`,
          title: item.title || 'Untitled Track',
          artist: item.artist || item.uploader || item.channel || null,
          channel: item.uploader || item.channel || null,
          durationSec: item.duration || 0,
          thumbnail,
          url: videoUrl
        };
      });

      // Playlist-level thumbnail: prefer first entry's thumbnail
      const playlistThumb = data.thumbnails?.[data.thumbnails.length - 1]?.url
        || entries[0]?.thumbnail
        || null;

      return {
        isDemo: false,
        type: urlInfo.type,
        title: data.title || 'YouTube Playlist',
        channel: data.uploader || data.channel || 'YouTube Channel',
        thumbnail: playlistThumb,
        totalEntries: entries.length,
        entries
      };
    }

    // Single video entry
    const videoId = data.id || urlInfo.videoId;
    const thumbnail = data.thumbnails?.[data.thumbnails.length - 1]?.url
      || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

    return {
      isDemo: false,
      type: 'track',
      title: data.title || 'YouTube Track',
      artist: data.artist || data.uploader || null,
      channel: data.uploader || data.channel || null,
      durationSec: data.duration || 0,
      thumbnail,
      totalEntries: 1,
      entries: [
        {
          id: videoId,
          title: data.title || 'YouTube Track',
          artist: data.artist || data.uploader || null,
          channel: data.uploader || null,
          durationSec: data.duration || 0,
          thumbnail,
          url: urlInfo.normalizedUrl
        }
      ]
    };
  }
}
