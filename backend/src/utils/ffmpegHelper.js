/**
 * FFmpeg Audio Conversion & Stream Processing Helper
 * Handles validated FFmpeg execution and yt-dlp audio stream extraction.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

// Valid output formats and bitrates
export const SUPPORTED_FORMATS = ['mp3', 'original'];
export const SUPPORTED_BITRATES = ['best', '320', '256', '192', '128'];

export function validateAudioSettings(format = 'mp3', quality = '320') {
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

function resolveExecutable(exeName) {
  const localExeWin = path.join(process.cwd(), `${exeName}.exe`);
  if (fsSync.existsSync(localExeWin)) return localExeWin;

  const localBin = path.join(process.cwd(), exeName);
  if (fsSync.existsSync(localBin)) return localBin;

  return exeName;
}

const ffmpegExe = resolveExecutable('ffmpeg');
const ytdlpExe = resolveExecutable('yt-dlp');

/**
 * Builds yt-dlp cookie authentication arguments.
 * Priority: COOKIES_FROM_BROWSER env > cookies.txt file
 */
function buildCookieArgs() {
  const browserCookie = (process.env.COOKIES_FROM_BROWSER || '').trim().toLowerCase();
  const cookiesFilePath = path.join(process.cwd(), 'cookies.txt');

  if (browserCookie && browserCookie.length > 0) {
    // Use yt-dlp native browser cookie extraction
    return ['--cookies-from-browser', browserCookie];
  }

  if (fsSync.existsSync(cookiesFilePath)) {
    return ['--cookies', cookiesFilePath];
  }

  return []; // No cookies configured
}

/**
 * Main Audio Processing logic:
 * Downloads source audio via yt-dlp then converts with FFmpeg.
 */
export async function processAudioTrack({ url, inputPath, outputPath, format, quality, metadata }) {
  const settings = validateAudioSettings(format, quality);
  if (!settings.isValid) {
    throw new Error(settings.reason);
  }

  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // 1. If pre-existing inputPath exists, convert directly
  if (inputPath && fsSync.existsSync(inputPath)) {
    return runFFmpegConversion(inputPath, outputPath, settings, metadata);
  }

  // 2. Extract live audio stream via yt-dlp
  if (url) {
    // Build a temp file base path — yt-dlp will append the real extension
    const tempBase = path.join(
      path.dirname(outputPath),
      `temp_src_${Date.now()}_${Math.random().toString(36).substring(7)}`
    );

    let downloadedPath = null;
    try {
      downloadedPath = await downloadAudioStream(url, tempBase);

      if (!downloadedPath || !fsSync.existsSync(downloadedPath)) {
        throw new Error('yt-dlp did not produce a valid audio file.');
      }

      const result = await runFFmpegConversion(downloadedPath, outputPath, settings, metadata);
      return result;
    } catch (err) {
      const isBotBlock = err.message.includes('Sign in to confirm') || err.message.includes('cookies');
      if (isBotBlock) {
        throw new Error(`YouTube stream access requires authentication. Please place your YouTube cookies.txt file inside the 'backend/' folder.`);
      }
      throw new Error(`Failed to extract/convert audio: ${err.message}`);
    } finally {
      // Always cleanup temp file
      if (downloadedPath) await safeUnlink(downloadedPath);
    }
  }

  throw new Error(`No audio source URL or file input provided for processing.`);
}

/**
 * Downloads the best available audio stream via yt-dlp.
 * Returns the actual path of the downloaded file (with resolved extension).
 */
async function downloadAudioStream(url, tempBase) {
  return new Promise((resolve, reject) => {
    const cookiesPath = path.join(process.cwd(), 'cookies.txt');

    // yt-dlp writes stdout line "[download] Destination: <path>" when done
    // We use --print filename after download to get the exact output path,
    // but a simpler approach: use a fixed temp path with a known extension.
    // We pass %(ext)s so yt-dlp fills in the correct extension.
    const tempOutputTemplate = `${tempBase}.%(ext)s`;

    const args = [
      '-f', 'bestaudio/best',
      '--no-warnings',
      '--no-playlist',
      '--print', 'after_move:filepath',  // prints actual output path after download
      '-o', tempOutputTemplate,
      ...buildCookieArgs()
    ];

    args.push(url);

    const proc = spawn(ytdlpExe, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => stdout += chunk);
    proc.stderr.on('data', chunk => stderr += chunk);

    proc.on('close', async code => {
      if (code === 0) {
        // Try to get path from stdout (printed by --print filepath)
        const printedPath = stdout.trim().split('\n').pop()?.trim();
        if (printedPath && fsSync.existsSync(printedPath)) {
          return resolve(printedPath);
        }

        // Fallback: scan directory for temp file matching our base prefix
        const dir = path.dirname(tempBase);
        const baseName = path.basename(tempBase);
        try {
          const files = await fs.readdir(dir);
          const match = files.find(f => f.startsWith(baseName) && f !== baseName);
          if (match) {
            return resolve(path.join(dir, match));
          }
        } catch (_) { /* ignore */ }

        reject(new Error('Could not locate downloaded audio file.'));
      } else {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
    });

    proc.on('error', err => reject(err));
  });
}

/**
 * Runs FFmpeg to convert inputPath -> outputPath with the given audio settings.
 * Embeds ID3/metadata tags.
 */
function runFFmpegConversion(inputPath, outputPath, settings, metadata) {
  return new Promise((resolve, reject) => {
    const args = ['-i', inputPath, '-y'];

    if (settings.format === 'mp3') {
      args.push('-vn'); // strip any video track
      args.push('-codec:a', 'libmp3lame');
      if (settings.quality !== 'best') {
        args.push('-b:a', `${settings.bitrateKbps}k`);
      } else {
        args.push('-qscale:a', '0');
      }
    } else {
      // 'original' - just copy audio stream without re-encode
      args.push('-vn');
      args.push('-codec:a', 'copy');
    }

    // Attach embedded ID3 metadata
    if (metadata) {
      if (metadata.title) args.push('-metadata', `title=${metadata.title}`);
      if (metadata.artist) args.push('-metadata', `artist=${metadata.artist}`);
      if (metadata.album) args.push('-metadata', `album=${metadata.album}`);
    }

    args.push(outputPath);

    const proc = spawn(ffmpegExe, args);
    let stderr = '';
    proc.stderr.on('data', chunk => stderr += chunk);

    proc.on('close', code => {
      if (code === 0) {
        resolve({ success: true, outputPath, settings });
      } else {
        reject(new Error(`FFmpeg processing failed (code ${code}): ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', err => reject(err));
  });
}

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (e) {
    // ignore
  }
}
