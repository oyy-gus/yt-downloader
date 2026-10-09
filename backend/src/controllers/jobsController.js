/**
 * Jobs Controller
 * Handles job submission, status queries, cancellation, and SSE streams.
 */

import { v4 as uuidv4 } from 'uuid';
import { validateUrl } from '../validators/urlValidator.js';
import { YouTubeProviderAdapter } from '../providers/youtubeProvider.js';
import { validateAudioSettings } from '../utils/ffmpegHelper.js';
import { JobQueue } from '../queue/inMemoryQueue.js';

const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_JOBS, 10) || 3;
export const jobQueue = new JobQueue(maxConcurrent);
const youtubeProvider = new YouTubeProviderAdapter();

export async function createJobHandler(req, res, next) {
  try {
    const { url, format = 'mp3', quality = '320', cleanerMode = 'Advanced', selectedTrackIds } = req.body;

    // 1. Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      return res.status(400).json({ success: false, error: urlValidation.reason });
    }

    // 2. Validate Audio Settings
    const audioValidation = validateAudioSettings(format, quality);
    if (!audioValidation.isValid) {
      return res.status(400).json({ success: false, error: audioValidation.reason });
    }

    // 3. Fetch metadata for job creation
    const metadata = await youtubeProvider.analyzeUrl(urlValidation);

    // 4. Create Job in Queue
    const jobId = uuidv4();
    const job = jobQueue.createJob({
      id: jobId,
      type: metadata.type,
      url: urlValidation.normalizedUrl,
      metadata,
      settings: {
        format: audioValidation.format,
        quality: audioValidation.quality,
        cleanerMode
      },
      selectedTrackIds
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

export function getJobHandler(req, res) {
  const { jobId } = req.params;
  const job = jobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  return res.json({
    success: true,
    data: jobQueue._sanitizeJobForSse(job)
  });
}

export function cancelJobHandler(req, res) {
  const { jobId } = req.params;
  const cancelled = jobQueue.cancelJob(jobId);

  if (!cancelled) {
    return res.status(400).json({ success: false, error: 'Job could not be cancelled or does not exist' });
  }

  return res.json({ success: true, message: 'Job successfully cancelled' });
}

export function sseJobEventsHandler(req, res) {
  const { jobId } = req.params;

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
