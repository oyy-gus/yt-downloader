import EventEmitter from 'events';
import path from 'path';
import fs from 'fs/promises';
import type { Response } from 'express';
import { TitleCleanerEngine } from '../cleaner/titleCleanerEngine.js';
import { TempStorageManager } from '../storage/tempManager.js';
import { processAudioTrack, parsePitchSetting } from '../utils/ffmpegHelper.js';
import { ZipExportService } from '../services/zipService.js';
import { uploadAudioAsset } from '../services/robloxService.js';
import type { Job, JobData, TrackItem } from '../types/index.js';

export class JobQueue extends EventEmitter {
  private concurrency: number;
  private activeCount: number;
  private waitingQueue: string[];
  private jobs: Map<string, Job>;

  constructor(concurrency = 3) {
    super();
    this.concurrency = concurrency;
    this.activeCount = 0;
    this.waitingQueue = [];
    this.jobs = new Map<string, Job>();
  }

  createJob(jobData: JobData): Job {
    const { 
      id, 
      type, 
      url, 
      metadata, 
      settings, 
      selectedTrackIds, 
      customMetadata,
      targetAction = 'download',
      robloxConfig = null
    } = jobData;

    const cleaner = new TitleCleanerEngine();
    const rawEntries = metadata.entries || [];
    let entriesToProcess = selectedTrackIds && selectedTrackIds.length > 0
      ? rawEntries.filter(e => selectedTrackIds.includes(e.id))
      : rawEntries;

    if (targetAction === 'roblox') {
      entriesToProcess = entriesToProcess.filter(e => !e.durationSec || e.durationSec <= 420);
    }

    const tracks: TrackItem[] = entriesToProcess.map((entry, index) => {
      const cleanResult = cleaner.clean(entry.title, {
        mode: settings.cleanerMode || 'Advanced',
        metadataArtist: entry.artist || entry.channel || null,
        format: settings.format || 'mp3',
        index: entriesToProcess.length > 1 ? index + 1 : null
      });

      const override = (customMetadata && customMetadata[entry.id]) || {};

      const finalTitle = (override.title && String(override.title).trim()) 
        ? String(override.title).trim() 
        : cleanResult.cleanedTitle;

      const finalArtist = (override.artist && String(override.artist).trim()) 
        ? String(override.artist).trim() 
        : (cleanResult.detectedArtist || entry.artist || entry.channel || null);

      const finalComposer = (override.composer && String(override.composer).trim())
        ? String(override.composer).trim()
        : (cleanResult.detectedComposer || entry.composer ? String(cleanResult.detectedComposer || entry.composer).trim() : null);

      const finalAlbum = (override.album && String(override.album).trim()) 
        ? String(override.album).trim() 
        : (metadata.title || finalTitle);

      const finalYear = (override.year && String(override.year).trim()) 
        ? String(override.year).trim() 
        : null;

      const finalGenre = (override.genre && String(override.genre).trim()) 
        ? String(override.genre).trim() 
        : null;

      const finalTrackNumber = (override.trackNumber && String(override.trackNumber).trim()) 
        ? String(override.trackNumber).trim() 
        : (entriesToProcess.length > 1 ? String(index + 1) : null);

      const finalPitch = (override.pitch !== undefined && override.pitch !== '')
        ? override.pitch
        : (settings.pitch !== undefined ? settings.pitch : 0);

      const parsedPitch = parsePitchSetting(finalPitch);
      const isCustomPitch = (override.pitch !== undefined && override.pitch !== '' && String(override.pitch) !== String(settings.pitch || 0));

      const isCustom = !!(
        (override.title && String(override.title).trim() !== cleanResult.cleanedTitle) ||
        (override.artist && String(override.artist).trim() !== (cleanResult.detectedArtist || '')) ||
        (override.composer && String(override.composer).trim()) ||
        (override.album && String(override.album).trim()) ||
        (override.year && String(override.year).trim()) ||
        (override.genre && String(override.genre).trim()) ||
        (override.trackNumber && String(override.trackNumber).trim()) ||
        isCustomPitch
      );

      let filename = cleanResult.proposedFilename;
      if (override.title || override.artist) {
        const safeArtist = finalArtist ? finalArtist.replace(/[/\\?%*:|"<>]/g, '').trim() : '';
        const safeTitle = finalTitle.replace(/[/\\?%*:|"<>]/g, '').trim();
        const ext = settings.format === 'original' ? '' : `.${settings.format || 'mp3'}`;
        const base = safeArtist ? `${safeArtist} - ${safeTitle}` : safeTitle;
        const indexPrefix = entriesToProcess.length > 1 ? `${String(index + 1).padStart(3, '0')} - ` : '';
        filename = `${indexPrefix}${base}${ext}`;
      }

      return {
        id: entry.id,
        originalTitle: entry.title,
        cleanedTitle: finalTitle,
        filename,
        artist: finalArtist,
        composer: finalComposer,
        album: finalAlbum,
        year: finalYear,
        genre: finalGenre,
        trackNumber: finalTrackNumber,
        pitch: finalPitch,
        robloxInfo: parsedPitch.hasModification ? {
          type: parsedPitch.robloxType,
          value: parsedPitch.robloxValue,
          code: parsedPitch.robloxCode,
          label: parsedPitch.label
        } : null,
        robloxAssetId: null,
        robloxAssetUrl: null,
        robloxModeration: null,
        isCustomMetadata: isCustom,
        version: cleanResult.detectedVersion,
        durationSec: entry.durationSec,
        thumbnail: entry.thumbnail,
        url: entry.url,
        status: 'pending',
        progressPct: 0,
        filepath: null,
        error: null
      };
    });

    const job: Job = {
      id,
      type,
      url,
      title: metadata.title,
      cleanerMode: settings.cleanerMode || 'Advanced',
      format: settings.format || 'mp3',
      quality: settings.quality || '320',
      pitch: (settings.pitch !== undefined && settings.pitch !== null) ? settings.pitch : 0,
      targetAction,
      robloxConfig,
      status: 'queued',
      totalTracks: tracks.length,
      completedTracks: 0,
      failedTracks: 0,
      overallProgressPct: 0,
      tracks,
      zipFilepath: null,
      zipFilename: null,
      createdAt: new Date().toISOString(),
      sseClients: new Set<Response>()
    };

    this.jobs.set(id, job);
    this.waitingQueue.push(id);
    this._next();

    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (['queued', 'active'].includes(job.status)) {
      job.status = 'cancelled';
      this.broadcastJobEvent(job, { event: 'cancelled', message: 'Job was cancelled by user' });
      return true;
    }
    return false;
  }

  addSseClient(jobId: string, res: Response): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'init', job: this.sanitizeJobForSse(job) })}\n\n`);
    return true;
  }

  removeSseClient(jobId: string, res: Response): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.sseClients.delete(res);
    }
  }

  broadcastJobEvent(job: Job, payload: Record<string, any>): void {
    const data = JSON.stringify({ ...payload, job: this.sanitizeJobForSse(job) });
    for (const client of job.sseClients) {
      try {
        client.write(`data: ${data}\n\n`);
      } catch {
        job.sseClients.delete(client);
      }
    }
  }

  sanitizeJobForSse(job: Job): Record<string, any> {
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
      targetAction: job.targetAction || 'download',
      tracks: job.tracks.map(t => ({
        id: t.id,
        originalTitle: t.originalTitle,
        cleanedTitle: t.cleanedTitle,
        filename: t.filename,
        artist: t.artist,
        composer: t.composer,
        album: t.album,
        year: t.year,
        genre: t.genre,
        trackNumber: t.trackNumber,
        pitch: t.pitch,
        robloxInfo: t.robloxInfo,
        robloxAssetId: t.robloxAssetId,
        robloxAssetUrl: t.robloxAssetUrl,
        robloxModeration: t.robloxModeration,
        isCustomMetadata: t.isCustomMetadata,
        version: t.version,
        durationSec: t.durationSec,
        thumbnail: t.thumbnail,
        status: t.status,
        progressPct: t.progressPct,
        error: t.error
      }))
    };
  }

  private async _next(): Promise<void> {
    if (this.activeCount >= this.concurrency || this.waitingQueue.length === 0) {
      return;
    }

    const jobId = this.waitingQueue.shift();
    if (!jobId) return;
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
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message;
      this.broadcastJobEvent(job, { event: 'error', message: err.message });
    } finally {
      this.activeCount--;
      this._next();
    }
  }

  private async _processJob(job: Job): Promise<void> {
    const jobDir = await TempStorageManager.createJobDir(job.id);

    for (let i = 0; i < job.tracks.length; i++) {
      if (job.status === 'cancelled') break;

      const track = job.tracks[i];
      if (job.targetAction === 'roblox' && track.durationSec && track.durationSec > 420) {
        track.status = 'failed';
        track.error = 'Dilewati: Durasi lagu melebihi batas 7 menit untuk Roblox';
        track.progressPct = 100;
        job.failedTracks++;
        this.broadcastJobEvent(job, { event: 'track_error', trackId: track.id, error: track.error });
        continue;
      }
      track.status = 'processing';
      track.progressPct = 25;
      this.broadcastJobEvent(job, { event: 'track_progress', trackId: track.id });

      try {
        const targetFilename = track.filename;
        const outputPath = path.join(jobDir, targetFilename);

        await processAudioTrack({
          url: track.url,
          inputPath: null,
          outputPath,
          format: job.format,
          quality: job.quality,
          pitch: track.pitch !== undefined ? track.pitch : (job.pitch || 0),
          metadata: {
            title: track.cleanedTitle,
            artist: track.artist,
            composer: track.composer,
            album: track.album || job.title,
            year: track.year,
            genre: track.genre,
            trackNumber: track.trackNumber,
            thumbnailUrl: track.thumbnail
          }
        });

        track.filepath = outputPath;

        if (job.targetAction === 'roblox') {
          track.progressPct = 75;
          this.broadcastJobEvent(job, { event: 'track_progress', trackId: track.id, message: 'Mengunggah ke Roblox Open Cloud...' });

          const uploadResult = await uploadAudioAsset({
            filePath: outputPath,
            displayName: track.cleanedTitle,
            description: `Audio: ${track.cleanedTitle}${track.artist ? ' - ' + track.artist : ''}`,
            apiKey: job.robloxConfig?.apiKey,
            creatorId: job.robloxConfig?.creatorId,
            creatorType: job.robloxConfig?.creatorType || 'user',
            durationSec: track.durationSec
          });

          track.robloxAssetId = uploadResult.assetId;
          track.robloxAssetUrl = uploadResult.assetUrl;
          track.robloxModeration = uploadResult.moderationState;

          try {
            await fs.unlink(outputPath);
          } catch {}
          track.filepath = null;
        }

        track.status = 'completed';
        track.progressPct = 100;
        job.completedTracks++;
      } catch (err: any) {
        track.status = 'failed';
        track.error = err.message;
        job.failedTracks++;
      }

      job.overallProgressPct = Math.round(((i + 1) / job.tracks.length) * 100);
      this.broadcastJobEvent(job, { event: 'track_complete', trackId: track.id });
    }

    if (job.status === 'cancelled') return;

    if (job.targetAction === 'download') {
      const completedTracks = job.tracks.filter(t => t.status === 'completed');
      if (completedTracks.length > 0) {
        const safeTitle = (job.title || 'Playlist').replace(/[^a-zA-Z0-9_-]/g, '_');
        const zipName = `Maxistrong_${safeTitle}.zip`;
        const zipPath = path.join(jobDir, zipName);

        await ZipExportService.createJobZip(zipPath, job.tracks, job.title);
        job.zipFilepath = zipPath;
        job.zipFilename = zipName;
      }
    }

    job.status = job.completedTracks > 0 ? 'completed' : 'failed';
    this.broadcastJobEvent(job, { event: 'job_complete', message: 'Job finished successfully' });
  }
}
