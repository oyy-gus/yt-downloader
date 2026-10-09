/**
 * Analyze Controller
 * Handles URL validation, source analysis, and title cleaner previews.
 */

import { validateUrl } from '../validators/urlValidator.js';
import { YouTubeProviderAdapter } from '../providers/youtubeProvider.js';
import { TitleCleanerEngine } from '../cleaner/titleCleanerEngine.js';

const youtubeProvider = new YouTubeProviderAdapter();

export async function analyzeUrlHandler(req, res, next) {
  try {
    const { url, cleanerMode = 'Advanced' } = req.body;

    // 1. Validate URL and SSRF Protection
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: urlValidation.reason
      });
    }

    // 2. Analyze URL with Provider (YouTube / Mock Fallback)
    const metadata = await youtubeProvider.analyzeUrl(urlValidation);

    // 3. Generate Cleaner Previews for all discovered tracks
    const cleaner = new TitleCleanerEngine();

    const tracksWithPreviews = (metadata.entries || []).map((entry, index) => {
      const cleanResult = cleaner.clean(entry.title, {
        mode: cleanerMode,
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
