/**
 * Files Controller
 * Manages authorized file downloads for single tracks and ZIP exports.
 */

import fs from 'fs';
import path from 'path';
import { jobQueue } from './jobsController.js';

export function downloadTrackHandler(req, res) {
  const { jobId, trackId } = req.params;
  const job = jobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  const track = job.tracks.find(t => t.id === trackId);
  if (!track || track.status !== 'completed' || !track.filepath || !fs.existsSync(track.filepath)) {
    return res.status(404).json({ success: false, error: 'Requested track audio file is not available' });
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(track.filename)}"`);

  const stream = fs.createReadStream(track.filepath);
  stream.pipe(res);
}

export function downloadZipHandler(req, res) {
  const { jobId } = req.params;
  const job = jobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  if (!job.zipFilepath || !fs.existsSync(job.zipFilepath)) {
    return res.status(404).json({ success: false, error: 'ZIP export file is not ready or available' });
  }

  const filename = job.zipFilename || `Maxistrong_${job.id}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

  const stream = fs.createReadStream(job.zipFilepath);
  stream.pipe(res);
}
