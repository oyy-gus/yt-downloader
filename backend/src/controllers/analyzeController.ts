import type { Request, Response, NextFunction } from 'express';
import { validateUrl } from '../validators/urlValidator.js';
import { YouTubeProviderAdapter } from '../providers/youtubeProvider.js';
import { TitleCleanerEngine } from '../cleaner/titleCleanerEngine.js';
import type { CleanerMode } from '../types/index.js';

const youtubeProvider = new YouTubeProviderAdapter();

export async function analyzeUrlHandler(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { url, cleanerMode = 'Advanced' } = req.body;

    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: urlValidation.reason
      });
    }

    const metadata = await youtubeProvider.analyzeUrl(urlValidation);
    const cleaner = new TitleCleanerEngine();

    const tracksWithPreviews = (metadata.entries || []).map((entry, index) => {
      const cleanResult = cleaner.clean(entry.title, {
        mode: cleanerMode as CleanerMode,
        metadataArtist: entry.artist || entry.channel || null,
        format: 'mp3',
        index: metadata.entries.length > 1 ? index + 1 : null
      });

      return {
        id: entry.id,
        originalTitle: entry.title,
        cleanedTitle: cleanResult.cleanedTitle,
        proposedFilename: cleanResult.proposedFilename,
        detectedArtist: cleanResult.detectedArtist,
        detectedComposer: cleanResult.detectedComposer || entry.composer || null,
        composer: cleanResult.detectedComposer || entry.composer || null,
        detectedVersion: cleanResult.detectedVersion,
        cleaningMode: cleanResult.cleaningMode,
        durationSec: entry.durationSec,
        thumbnail: entry.thumbnail,
        channel: entry.channel,
        url: entry.url
      };
    });

    return res.json({
      success: true,
      data: {
        isDemo: metadata.isDemo,
        type: metadata.type,
        title: metadata.title,
        channel: metadata.channel,
        thumbnail: metadata.thumbnail,
        totalEntries: metadata.totalEntries,
        cleanerMode,
        tracks: tracksWithPreviews
      }
    });

  } catch (err) {
    next(err);
  }
}
