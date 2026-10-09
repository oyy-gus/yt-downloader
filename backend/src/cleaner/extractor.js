/**
 * Extractor for Artist and Title separation from cleaned track titles
 */

import { normalizeWhitespace, cleanPunctuationAndBrackets } from './normalizer.js';

// Recognized separators in priority order
const SEPARATORS = [
  ' - ',
  ' – ',
  ' — ',
  ' | ',
  ' • ',
  ' _ ',
  ' : '
];

/**
 * Extracts artist and title using structured patterns and metadata hints.
 * Returns { artist, title, confidence }
 */
export function extractArtistAndTitle(rawTitle, metadataArtist = null) {
  let cleaned = normalizeWhitespace(rawTitle);

  // Clean metadata artist (strip "- Topic" suffixes from YouTube auto-generated channels)
  let cleanMetaArtist = null;
  if (metadataArtist && typeof metadataArtist === 'string' && metadataArtist.trim().length > 0) {
    cleanMetaArtist = normalizeWhitespace(metadataArtist)
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/\s*Official$/i, '')
      .trim();

    if (cleanMetaArtist.length === 0) cleanMetaArtist = null;
  }

  // 1. If cleanMetaArtist is provided, test if title starts or ends with artist name
  if (cleanMetaArtist) {
    for (const sep of SEPARATORS) {
      if (cleaned.toLowerCase().startsWith(cleanMetaArtist.toLowerCase() + sep.trim())) {
        const titlePart = cleaned.slice(cleanMetaArtist.length + sep.length).trim();
        return {
          artist: cleanMetaArtist,
          title: cleanPunctuationAndBrackets(titlePart),
          confidence: 'high'
        };
      }
      if (cleaned.toLowerCase().endsWith(sep.trim() + cleanMetaArtist.toLowerCase())) {
        const titlePart = cleaned.slice(0, -(cleanMetaArtist.length + sep.length)).trim();
        return {
          artist: cleanMetaArtist,
          title: cleanPunctuationAndBrackets(titlePart),
          confidence: 'high'
        };
      }
    }
  }

  // 2. Attempt pattern matching with separators in raw title (e.g. "Artist - Title" or "Title - Artist")
  for (const sep of SEPARATORS) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map(p => cleanPunctuationAndBrackets(p));
      if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
        // Check if cleanMetaArtist matches parts[1] (Title - Artist format)
        if (cleanMetaArtist && parts[1].toLowerCase() === cleanMetaArtist.toLowerCase()) {
          return {
            artist: parts[1],
            title: parts[0],
            confidence: 'high'
          };
        }

        // Default assumption: Left = Artist, Right = Title
        return {
          artist: parts[0],
          title: parts[1],
          confidence: 'medium'
        };
      }
    }
  }

  // 3. Fallback: Return title with cleanMetaArtist if reliable
  return {
    artist: cleanMetaArtist || null,
    title: cleanPunctuationAndBrackets(cleaned),
    confidence: 'low'
  };
}
