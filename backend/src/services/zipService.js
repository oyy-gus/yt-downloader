/**
 * Streaming ZIP Archive Export Service
 * Compiles completed tracks and a summary manifest into a ZIP file using archiver.
 */

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export class ZipExportService {
  /**
   * Creates a ZIP file containing all successful tracks in a job.
   * @param {string} zipOutputPath Absolute output filepath for .zip
   * @param {Array} tracks List of processed track objects [{ title, filename, filepath, artist, durationSec, status }]
   * @param {string} jobTitle Title of playlist or mix
   */
  static createJobZip(zipOutputPath, tracks, jobTitle = 'Maxistrong Export') {
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

      // Append completed track files
      const successfulTracks = tracks.filter(t => t.status === 'completed' && t.filepath && fs.existsSync(t.filepath));
      
      for (const track of successfulTracks) {
        archive.file(track.filepath, { name: track.filename });
      }

      // Generate download-summary.txt manifest
      const summaryText = generateDownloadSummary(jobTitle, tracks);
      archive.append(summaryText, { name: 'download-summary.txt' });

      archive.finalize();
    });
  }
}

function generateDownloadSummary(jobTitle, tracks) {
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
    
    content += `[${idx}] Status: ${statusStr}\n`;
    content += `      Title:    ${name}\n`;
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
