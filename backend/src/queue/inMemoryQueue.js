/**
 * In-Memory Bounded Job Queue with SSE Event Emitter
 */

import EventEmitter from 'events';
import path from 'path';
import { TitleCleanerEngine } from '../cleaner/titleCleanerEngine.js';
import { TempStorageManager } from '../storage/tempManager.js';
import { processAudioTrack } from '../utils/ffmpegHelper.js';
import { ZipExportService } from '../services/zipService.js';

export class JobQueue extends EventEmitter {
  constructor(concurrency = 3) {
    super();
    this.concurrency = concurrency;
    this.activeCount = 0;
    this.waitingQueue = [];
    this.jobs = new Map(); // jobId -> job object
  }

  createJob(jobData) {
    const { id, type, url, metadata, settings, selectedTrackIds } = jobData;

    const cleaner = new TitleCleanerEngine();

    // Filter selected entries for playlist/mix batch processing
    const rawEntries = metadata.entries || [];
    const entriesToProcess = selectedTrackIds && selectedTrackIds.length > 0
      ? rawEntries.filter(e => selectedTrackIds.includes(e.id))
      : rawEntries;

    const tracks = entriesToProcess.map((entry, index) => {
      const cleanResult = cleaner.clean(entry.title, {
        mode: settings.cleanerMode || 'Advanced',
        metadataArtist: entry.artist || entry.channel || null,
        format: settings.format || 'mp3',
        index: entriesToProcess.length > 1 ? index + 1 : null
      });

      return {
        id: entry.id,
        originalTitle: entry.title,
        cleanedTitle: cleanResult.cleanedTitle,
        filename: cleanResult.proposedFilename,
        artist: cleanResult.detectedArtist,
        version: cleanResult.detectedVersion,
        durationSec: entry.durationSec,
        thumbnail: entry.thumbnail,
        url: entry.url,
        status: 'pending', // pending, cleaning, processing, completed, failed
        progressPct: 0,
        filepath: null,
        error: null
      };
    });

    const job = {
      id,
      type, // 'track' | 'playlist' | 'mix'
      url,
      title: metadata.title,
      cleanerMode: settings.cleanerMode || 'Advanced',
      format: settings.format || 'mp3',
      quality: settings.quality || '320',
      status: 'queued', // queued, active, completed, cancelled, failed
      totalTracks: tracks.length,
      completedTracks: 0,
      failedTracks: 0,
      overallProgressPct: 0,
      tracks,
      zipFilepath: null,
      zipFilename: null,
      createdAt: new Date().toISOString(),
      sseClients: new Set()
    };

    this.jobs.set(id, job);
    this.waitingQueue.push(id);
    this._next();

    return job;
  }

  getJob(id) {
    return this.jobs.get(id);
  }

  cancelJob(id) {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (['queued', 'active'].includes(job.status)) {
      job.status = 'cancelled';
      this.broadcastJobEvent(job, { event: 'cancelled', message: 'Job was cancelled by user' });
      return true;
    }
    return false;
  }

  addSseClient(jobId, res) {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.sseClients.add(res);
    
    // Send immediate initial status
    res.write(`data: ${JSON.stringify({ type: 'init', job: this._sanitizeJobForSse(job) })}\n\n`);
    
    return true;
  }

  removeSseClient(jobId, res) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.sseClients.delete(res);
    }
  }

  broadcastJobEvent(job, payload) {
    const data = JSON.stringify({ ...payload, job: this._sanitizeJobForSse(job) });
    for (const client of job.sseClients) {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (e) {
        job.sseClients.delete(client);
      }
    }
  }

  _sanitizeJobForSse(job) {
    // Exclude internal file paths from client SSE broadcasts
    return {
      id: job.id,
      type: job.type,
      url: job.url,
      title: job.title,
      cleanerMode: job.cleanerMode,
      format: job.format,
      quality: job.quality,
      status: job.status,
      totalTracks: job.totalTracks,
      completedTracks: job.completedTracks,
      failedTracks: job.failedTracks,
      overallProgressPct: job.overallProgressPct,
      hasZip: !!job.zipFilepath,
      tracks: job.tracks.map(t => ({
        id: t.id,
        originalTitle: t.originalTitle,
        cleanedTitle: t.cleanedTitle,
        filename: t.filename,
        artist: t.artist,
        version: t.version,
        durationSec: t.durationSec,
        thumbnail: t.thumbnail,
        status: t.status,
        progressPct: t.progressPct,
        error: t.error
      }))
    };
  }

  async _next() {
    if (this.activeCount >= this.concurrency || this.waitingQueue.length === 0) {
      return;
    }

    const jobId = this.waitingQueue.shift();
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'cancelled') {
      this._next();
      return;
    }

    this.activeCount++;
    job.status = 'active';
    this.broadcastJobEvent(job, { event: 'start', message: 'Job processing started' });

    try {
      await this._processJob(job);
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
      this.broadcastJobEvent(job, { event: 'error', message: err.message });
    } finally {
      this.activeCount--;
      this._next();
    }
  }

  async _processJob(job) {
    const jobDir = await TempStorageManager.createJobDir(job.id);

    for (let i = 0; i < job.tracks.length; i++) {
      if (job.status === 'cancelled') break;

      const track = job.tracks[i];
      track.status = 'processing';
      track.progressPct = 25;
      this.broadcastJobEvent(job, { event: 'track_progress', trackId: track.id });

      try {
        const targetFilename = track.filename;
        const outputPath = path.join(jobDir, targetFilename);

        // Process audio track conversion/synthesis
        const result = await processAudioTrack({
          url: track.url,
          inputPath: null,
          outputPath,
          format: job.format,
          quality: job.quality,
          metadata: {
            title: track.cleanedTitle,
            artist: track.artist,
            album: job.title
          }
        });

        track.filepath = outputPath;
        track.status = 'completed';
        track.progressPct = 100;
        job.completedTracks++;
      } catch (err) {
        track.status = 'failed';
        track.error = err.message;
        job.failedTracks++;
      }

      job.overallProgressPct = Math.round(((i + 1) / job.tracks.length) * 100);
      this.broadcastJobEvent(job, { event: 'track_complete', trackId: track.id });
    }

    if (job.status === 'cancelled') return;

    // Create ZIP archive if playlist/mix or multiple tracks completed
    const completedTracks = job.tracks.filter(t => t.status === 'completed');
    if (completedTracks.length > 0) {
      const safeTitle = (job.title || 'Playlist').replace(/[^a-zA-Z0-9_-]/g, '_');
      const zipName = `Maxistrong_${safeTitle}.zip`;
      const zipPath = path.join(jobDir, zipName);

      await ZipExportService.createJobZip(zipPath, job.tracks, job.title);
      job.zipFilepath = zipPath;
      job.zipFilename = zipName;
    }

    job.status = job.completedTracks > 0 ? 'completed' : 'failed';
    this.broadcastJobEvent(job, { event: 'job_complete', message: 'Job finished successfully' });
  }
}
