import { normalizeWhitespace, cleanPunctuationAndBrackets } from './normalizer.js';

const SEPARATORS = [
  ' - ',
  ' – ',
  ' — ',
  ' | ',
  ' • ',
  ' _ ',
  ' : '
];

export interface ExtractionResult {
  artist: string | null;
  title: string;
  confidence: 'high' | 'medium' | 'low';
}

export function extractArtistAndTitle(rawTitle: string, metadataArtist: string | null = null): ExtractionResult {
  let cleaned = normalizeWhitespace(rawTitle);

  let cleanMetaArtist: string | null = null;
  if (metadataArtist && typeof metadataArtist === 'string' && metadataArtist.trim().length > 0) {
    cleanMetaArtist = normalizeWhitespace(metadataArtist)
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/\s*Official$/i, '')
      .trim();

    if (cleanMetaArtist.length === 0) cleanMetaArtist = null;
  }

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

  for (const sep of SEPARATORS) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map(p => cleanPunctuationAndBrackets(p));
      if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
        if (cleanMetaArtist && parts[1].toLowerCase() === cleanMetaArtist.toLowerCase()) {
          return {
            artist: parts[1],
            title: parts[0],
            confidence: 'high'
          };
        }

        return {
          artist: parts[0],
          title: parts[1],
          confidence: 'medium'
        };
      }
    }
  }

  return {
    artist: cleanMetaArtist || null,
    title: cleanPunctuationAndBrackets(cleaned),
    confidence: 'low'
  };
}
