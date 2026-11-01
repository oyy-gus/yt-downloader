import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validateUrl } from '../validators/urlValidator.js';
import { YouTubeProviderAdapter } from '../providers/youtubeProvider.js';
import { validateAudioSettings } from '../utils/ffmpegHelper.js';
import { JobQueue } from '../queue/inMemoryQueue.js';
import type { AudioFormat, CleanerMode } from '../types/index.js';

const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_JOBS || '3', 10) || 3;
export const jobQueue = new JobQueue(maxConcurrent);
const youtubeProvider = new YouTubeProviderAdapter();

export async function createJobHandler(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { 
      url, 
      format = 'mp3', 
      quality = '320', 
      cleanerMode = 'Advanced', 
      pitch = 0, 
      selectedTrackIds, 
      customMetadata, 
      settings: bodySettings,
      targetAction = 'download',
      robloxConfig = null
    } = req.body;

    const effectivePitch = (pitch !== undefined && pitch !== 0 && pitch !== '0') 
      ? pitch 
      : (bodySettings?.pitch !== undefined ? bodySettings.pitch : (pitch || 0));

    if (targetAction === 'roblox') {
      if (!robloxConfig || !robloxConfig.apiKey || !robloxConfig.apiKey.trim()) {
        return res.status(400).json({ success: false, error: 'Roblox API Key wajib diisi untuk mode upload ke Roblox.' });
      }
      if (!robloxConfig.creatorId || !robloxConfig.creatorId.trim()) {
        return res.status(400).json({ success: false, error: 'Roblox Creator ID (User ID atau Group ID) wajib diisi.' });
      }
    }

    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      return res.status(400).json({ success: false, error: urlValidation.reason });
    }

    const audioValidation = validateAudioSettings(format, quality);
    if (!audioValidation.isValid) {
      return res.status(400).json({ success: false, error: audioValidation.reason });
    }

    const metadata = await youtubeProvider.analyzeUrl(urlValidation);

    if (targetAction === 'roblox') {
      const rawEntries = metadata.entries || [];
      const requested = selectedTrackIds && selectedTrackIds.length > 0
        ? rawEntries.filter((e: any) => selectedTrackIds.includes(e.id))
        : rawEntries;
      const eligible = requested.filter((e: any) => !e.durationSec || e.durationSec <= 420);
      if (eligible.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Tidak ada lagu yang dapat diunggah ke Roblox karena seluruh lagu yang dipilih melebihi batas durasi 7 menit.'
        });
      }
    }

    const jobId = uuidv4();
    const job = jobQueue.createJob({
      id: jobId,
      type: metadata.type,
      url: urlValidation.normalizedUrl || '',
      metadata,
      settings: {
        format: audioValidation.format as AudioFormat,
        quality: audioValidation.quality,
        cleanerMode: cleanerMode as CleanerMode,
        pitch: effectivePitch
      },
      targetAction,
      robloxConfig,
      selectedTrackIds,
      customMetadata
    });

    return res.status(201).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        totalTracks: job.totalTracks
      }
    });

  } catch (err) {
    next(err);
  }
}

export function getJobHandler(req: Request, res: Response): any {
  const jobId = String(req.params.jobId);
  const job = jobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  return res.json({
    success: true,
    data: jobQueue.sanitizeJobForSse(job)
  });
}

export function cancelJobHandler(req: Request, res: Response): any {
  const jobId = String(req.params.jobId);
  const cancelled = jobQueue.cancelJob(jobId);

  if (!cancelled) {
    return res.status(400).json({ success: false, error: 'Job could not be cancelled or does not exist' });
  }

  return res.json({ success: true, message: 'Job successfully cancelled' });
}

export function sseJobEventsHandler(req: Request, res: Response): any {
  const jobId = String(req.params.jobId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const added = jobQueue.addSseClient(jobId, res);
  if (!added) {
    return res.status(404).end();
  }

  req.on('close', () => {
    jobQueue.removeSseClient(jobId, res);
  });
}
