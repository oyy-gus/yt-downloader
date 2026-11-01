import fs from 'fs';
import * as archiverPkg from 'archiver';
const archiver = ((archiverPkg as any).default || archiverPkg) as any;
import { TrackItem } from '../types/index.js';

export interface ZipResult {
  zipPath: string;
  totalBytes: number;
  fileCount: number;
}

export class ZipExportService {
  static createJobZip(zipOutputPath: string, tracks: TrackItem[], jobTitle: string = 'Maxistrong Export'): Promise<ZipResult> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipOutputPath);
      const archive = archiver('zip', { zlib: { level: 6 } });

      output.on('close', () => {
        resolve({
          zipPath: zipOutputPath,
          totalBytes: archive.pointer(),
          fileCount: tracks.filter(t => t.status === 'completed').length
        });
      });

      archive.on('error', err => reject(err));

      archive.pipe(output);

      const successfulTracks = tracks.filter(t => t.status === 'completed' && t.filepath && fs.existsSync(t.filepath));
      
      for (const track of successfulTracks) {
        if (track.filepath) {
          archive.file(track.filepath, { name: track.filename });
        }
      }

      const summaryText = generateDownloadSummary(jobTitle, tracks);
      archive.append(summaryText, { name: 'download-summary.txt' });

      archive.finalize();
    });
  }
}

function generateDownloadSummary(jobTitle: string, tracks: TrackItem[]): string {
  const now = new Date().toISOString();
  let content = `==================================================\n`;
  content += ` MAXISTRONG MUSIC DOWNLOAD SUMMARY\n`;
  content += ` Generated: ${now}\n`;
  content += ` Batch Title: ${jobTitle}\n`;
  content += `==================================================\n\n`;

  content += `TRACK LISTING (${tracks.length} items processed):\n`;
  content += `--------------------------------------------------\n`;

  tracks.forEach((t, i) => {
    const idx = String(i + 1).padStart(3, '0');
    const statusStr = (t.status || 'unknown').toUpperCase();
    const name = t.cleanedTitle || t.originalTitle || 'Untitled Track';
    const filename = t.filename || 'N/A';
    
    content += `[${idx}] Status:   ${statusStr}\n`;
    content += `      Title:    ${name}\n`;
    if (t.artist)   content += `      Artist:   ${t.artist}\n`;
    if (t.composer) content += `      Composer: ${t.composer}\n`;
    if (t.album)    content += `      Album:    ${t.album}\n`;
    if (t.genre)    content += `      Genre:    ${t.genre}\n`;
    if (t.robloxInfo) {
      content += `      Pitch/Speed: ${t.robloxInfo.label}\n`;
      content += `      Roblox Normalization:\n`;
      content += `        -> Studio Property : ${t.robloxInfo.type === 'PlaybackSpeed' ? 'Sound.PlaybackSpeed' : 'PitchShiftSoundEffect.Octave'} = ${t.robloxInfo.value}\n`;
      content += `        -> Luau Script     : ${t.robloxInfo.code}\n`;
    } else if (t.pitch && t.pitch !== 0) {
      content += `      Pitch:    ${t.pitch}\n`;
    }
    content += `      Filename: ${filename}\n`;
    if (t.error) {
      content += `      Error:    ${t.error}\n`;
    }
    content += `\n`;
  });

  content += `--------------------------------------------------\n`;
  content += `Processed cleanly with Maxistrong Title Cleaner.\n`;

  return content;
}
