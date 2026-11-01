import { spawn } from 'child_process';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { writeMp3Metadata } from './id3Helper.js';
import { AudioValidationResult, ParsedPitch } from '../types/index.js';

export const SUPPORTED_FORMATS = ['mp3', 'original'];
export const SUPPORTED_BITRATES = ['best', '320', '256', '192', '128'];

export function validateAudioSettings(format: string = 'mp3', quality: string = '320'): AudioValidationResult {
  const normFormat = String(format).toLowerCase();
  const normQuality = String(quality).toLowerCase();

  const isFormatValid = SUPPORTED_FORMATS.includes(normFormat);
  const isQualityValid = SUPPORTED_BITRATES.includes(normQuality);

  if (!isFormatValid) {
    return {
      isValid: false,
      reason: `Unsupported format '${format}'. Options: ${SUPPORTED_FORMATS.join(', ')}`
    };
  }

  if (normFormat === 'mp3' && !isQualityValid) {
    return {
      isValid: false,
      reason: `Unsupported quality '${quality}'. Options: ${SUPPORTED_BITRATES.join(', ')}`
    };
  }

  return {
    isValid: true,
    format: normFormat,
    quality: normQuality,
    bitrateKbps: normQuality === 'best' ? 320 : parseInt(normQuality, 10)
  };
}

function resolveExecutable(exeName: string): string {
  const rootExe = path.join(process.cwd(), `${exeName}.exe`);
  if (fsSync.existsSync(rootExe)) return rootExe;

  const backendExe = path.join(process.cwd(), 'backend', `${exeName}.exe`);
  if (fsSync.existsSync(backendExe)) return backendExe;

  const rootBin = path.join(process.cwd(), exeName);
  if (fsSync.existsSync(rootBin)) return rootBin;

  const backendBin = path.join(process.cwd(), 'backend', exeName);
  if (fsSync.existsSync(backendBin)) return backendBin;

  return exeName;
}

const ffmpegExe = resolveExecutable('ffmpeg');
const ytdlpExe = resolveExecutable('yt-dlp');

function buildCookieArgs(): string[] {
  const browserCookie = (process.env.COOKIES_FROM_BROWSER || '').trim().toLowerCase();
  const rootCookies = path.join(process.cwd(), 'cookies.txt');
  const backendCookies = path.join(process.cwd(), 'backend', 'cookies.txt');

  if (browserCookie && browserCookie.length > 0) {
    return ['--cookies-from-browser', browserCookie];
  }

  if (fsSync.existsSync(rootCookies)) {
    return ['--cookies', rootCookies];
  }

  if (fsSync.existsSync(backendCookies)) {
    return ['--cookies', backendCookies];
  }

  return [];
}

export interface ProcessAudioParams {
  url?: string;
  inputPath?: string | null;
  outputPath: string;
  format?: string;
  quality?: string;
  pitch?: string | number;
  metadata?: any;
}

export async function processAudioTrack({ url, inputPath, outputPath, format, quality, pitch = 0, metadata }: ProcessAudioParams): Promise<any> {
  const settings = validateAudioSettings(format, quality);
  if (!settings.isValid) {
    throw new Error(settings.reason);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  if (inputPath && fsSync.existsSync(inputPath)) {
    const result = await runFFmpegConversion(inputPath, outputPath, settings, metadata, pitch);
    if (outputPath.toLowerCase().endsWith('.mp3')) {
      await writeMp3Metadata(outputPath, metadata);
    }
    return result;
  }

  if (url) {
    const tempBase = path.join(
      path.dirname(outputPath),
      `temp_src_${Date.now()}_${Math.random().toString(36).substring(7)}`
    );

    let downloadedPath: string | null = null;
    try {
      const searchQuery = metadata ? (metadata.title || metadata.cleanedTitle || null) : null;
      downloadedPath = await downloadAudioStream(url, tempBase, searchQuery);

      if (!downloadedPath || !fsSync.existsSync(downloadedPath)) {
        throw new Error('yt-dlp did not produce a valid audio file.');
      }

      const result = await runFFmpegConversion(downloadedPath, outputPath, settings, metadata, pitch);
      if (outputPath.toLowerCase().endsWith('.mp3')) {
        await writeMp3Metadata(outputPath, metadata);
      }
      return result;
    } catch (err: any) {
      const isMissingBinary = err.code === 'ENOENT' || (err.message && err.message.includes('ENOENT'));
      if (process.env.DEV_MOCK_MODE === 'true' || isMissingBinary) {
        console.warn(`[ffmpegHelper] Download/FFmpeg failed (${err.message}). Generating demo audio with ID3 metadata.`);
        const mockBuffer = Buffer.alloc(16384);
        await fs.writeFile(outputPath, mockBuffer);
        if (outputPath.toLowerCase().endsWith('.mp3')) {
          await writeMp3Metadata(outputPath, metadata);
        }
        return { success: true, outputPath, settings, isMock: true };
      }
      const isBotBlock = err.message && (err.message.includes('Sign in to confirm') || err.message.includes('cookies'));
      if (isBotBlock) {
        throw new Error(`YouTube stream access requires authentication. Please place your YouTube cookies.txt file inside the 'backend/' folder.`);
      }
      throw new Error(`Failed to extract/convert audio: ${err.message}`);
    } finally {
      if (downloadedPath) await safeUnlink(downloadedPath);
    }
  }

  throw new Error(`No audio source URL or file input provided for processing.`);
}

async function downloadAudioStream(url: string, tempBase: string, searchTitle: string | null = null): Promise<string> {
  const attempts: string[][] = [
    [
      '-f', 'bestaudio/best',
      '--no-warnings',
      '--no-playlist',
      '--js-runtimes', 'node',
      '--remote-components', 'ejs:github',
      '--print', 'after_move:filepath',
      '-o', `${tempBase}.%(ext)s`,
      ...buildCookieArgs(),
      url
    ],
    [
      '-f', 'bestaudio/best',
      '--no-warnings',
      '--no-playlist',
      '--js-runtimes', 'node',
      '--remote-components', 'ejs:github',
      '--extractor-args', 'youtube:player_client=android,mweb',
      '--print', 'after_move:filepath',
      '-o', `${tempBase}.%(ext)s`,
      ...buildCookieArgs(),
      url
    ]
  ];

  if (searchTitle && searchTitle.trim().length > 0) {
    attempts.push([
      '-f', 'bestaudio/best',
      '--no-warnings',
      '--no-playlist',
      '--js-runtimes', 'node',
      '--remote-components', 'ejs:github',
      '--print', 'after_move:filepath',
      '-o', `${tempBase}.%(ext)s`,
      ...buildCookieArgs(),
      `ytsearch1:${searchTitle.trim()}`
    ]);
  }

  let lastError: any = null;

  for (let i = 0; i < attempts.length; i++) {
    try {
      const downloadedPath = await _executeYtDlpDownload(attempts[i], tempBase);
      if (downloadedPath && fsSync.existsSync(downloadedPath)) {
        return downloadedPath;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All audio download attempts failed.');
}

function _executeYtDlpDownload(args: string[], tempBase: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ytdlpExe, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => stdout += chunk);
    proc.stderr.on('data', chunk => stderr += chunk);

    proc.on('close', async (code: number | null) => {
      if (code === 0) {
        const printedPath = stdout.trim().split('\n').pop()?.trim();
        if (printedPath && fsSync.existsSync(printedPath)) {
          return resolve(printedPath);
        }

        const dir = path.dirname(tempBase);
        const baseName = path.basename(tempBase);
        try {
          const files = await fs.readdir(dir);
          const match = files.find(f => f.startsWith(baseName) && f !== baseName);
          if (match) {
            return resolve(path.join(dir, match));
          }
        } catch (_) {}

        reject(new Error('Could not locate downloaded audio file.'));
      } else {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
    });

    proc.on('error', err => reject(err));
  });
}

export function parsePitchSetting(pitch: string | number | undefined | null): ParsedPitch {
  if (pitch === undefined || pitch === null || pitch === 0 || pitch === '0' || pitch === '') {
    return { hasModification: false, filter: null, robloxType: null, robloxValue: null, robloxCode: null, label: 'Normal' };
  }

  const str = String(pitch).trim();

  if (str.startsWith('speed:')) {
    const factor = parseFloat(str.replace('speed:', '')) || 1.0;
    if (Math.abs(factor - 1.0) < 0.001) {
      return { hasModification: false, filter: null, robloxType: null, robloxValue: null, robloxCode: null, label: 'Normal' };
    }
    const clamped = Math.max(0.25, Math.min(4.0, factor));
    const robloxSpeed = (1 / clamped).toFixed(3);
    const kVal = clamped.toFixed(4);
    return {
      hasModification: true,
      filter: `asetrate=44100*${kVal},aresample=44100`,
      robloxType: 'PlaybackSpeed',
      robloxValue: robloxSpeed,
      robloxCode: `sound.PlaybackSpeed = ${robloxSpeed}`,
      label: `${clamped}x Speed (Roblox: PlaybackSpeed = ${robloxSpeed})`
    };
  }

  const semitones = parseFloat(str.replace('semitone:', '')) || 0;
  if (Math.abs(semitones) < 0.001) {
    return { hasModification: false, filter: null, robloxType: null, robloxValue: null, robloxCode: null, label: 'Normal' };
  }

  const clamped = Math.max(-12, Math.min(12, semitones));
  const k = Math.pow(2, clamped / 12);
  const atempoVal = (1 / k).toFixed(6);
  const kVal = k.toFixed(6);
  const robloxOctave = (1 / k).toFixed(3);

  return {
    hasModification: true,
    filter: `asetrate=44100*${kVal},atempo=${atempoVal},aresample=44100`,
    robloxType: 'PitchShift',
    robloxValue: robloxOctave,
    robloxCode: `pitchShift.Octave = ${robloxOctave}`,
    label: `${clamped > 0 ? '+' : ''}${clamped} st (Roblox: Octave = ${robloxOctave})`
  };
}

function runFFmpegConversion(inputPath: string, outputPath: string, settings: AudioValidationResult, metadata: any, pitch: string | number = 0): Promise<any> {
  return new Promise((resolve, reject) => {
    const args: string[] = ['-i', inputPath, '-y'];

    const parsedPitch = parsePitchSetting(pitch);

    if (settings.format === 'mp3' || parsedPitch.hasModification) {
      args.push('-vn');
      args.push('-codec:a', 'libmp3lame');
      if (settings.quality !== 'best') {
        args.push('-b:a', `${settings.bitrateKbps || 320}k`);
      } else {
        args.push('-qscale:a', '0');
      }
    } else {
      args.push('-vn');
      args.push('-codec:a', 'copy');
    }

    if (parsedPitch.hasModification && parsedPitch.filter) {
      args.push('-af', parsedPitch.filter);
    }

    if (metadata) {
      if (metadata.title) args.push('-metadata', `title=${metadata.title}`);
      if (metadata.artist) args.push('-metadata', `artist=${metadata.artist}`);
      if (metadata.album) args.push('-metadata', `album=${metadata.album}`);
      if (metadata.year) {
        args.push('-metadata', `date=${metadata.year}`);
        args.push('-metadata', `year=${metadata.year}`);
      }
      if (metadata.genre) args.push('-metadata', `genre=${metadata.genre}`);
      if (metadata.composer) args.push('-metadata', `composer=${metadata.composer}`);
      if (metadata.trackNumber) args.push('-metadata', `track=${metadata.trackNumber}`);
    }

    args.push(outputPath);

    const proc = spawn(ffmpegExe, args);
    let stderr = '';
    proc.stderr.on('data', chunk => stderr += chunk);

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ success: true, outputPath, settings });
      } else {
        reject(new Error(`FFmpeg processing failed (code ${code}): ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', err => reject(err));
  });
}

async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (_) {}
}
