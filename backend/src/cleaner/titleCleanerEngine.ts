import {
  PROMOTIONAL_ALBUM_LABELS,
  VIDEO_TECHNICAL_LABELS,
  PROMOTIONAL_KEYWORDS,
  REGIONAL_MUSIC_PATTERNS,
  CHANNEL_PROMOTION_PATTERNS,
  PRESERVED_VERSIONS
} from './dictionary.js';

import { normalizeWhitespace, cleanPunctuationAndBrackets, sanitizeFilename } from './normalizer.js';
import { extractArtistAndTitle } from './extractor.js';
import { CleanResult, CleanerMode } from '../types/index.js';

export interface TitleCleanerOptions {
  mode?: CleanerMode;
  metadataArtist?: string | null;
  format?: string;
  index?: number | null;
}

export interface TitleCleanerConfig {
  customRemovalPhrases?: string[];
  protectedPhrases?: string[];
  filenameTemplate?: string;
  playlistPrefixFormat?: string;
}

export class TitleCleanerEngine {
  private customConfig: Required<TitleCleanerConfig>;

  constructor(customConfig: TitleCleanerConfig = {}) {
    this.customConfig = {
      customRemovalPhrases: customConfig.customRemovalPhrases || [],
      protectedPhrases: customConfig.protectedPhrases || [],
      filenameTemplate: customConfig.filenameTemplate || '{artist} - {title}',
      playlistPrefixFormat: customConfig.playlistPrefixFormat || '{index} - ',
      ...customConfig
    };
  }

  clean(rawTitle: string | null | undefined, options: TitleCleanerOptions = {}): CleanResult {
    const mode = options.mode || 'Advanced';
    const metadataArtist = options.metadataArtist || null;
    const outputFormat = options.format || 'mp3';
    const trackIndex = options.index !== undefined ? options.index : null;

    if (!rawTitle || typeof rawTitle !== 'string') {
      const defaultName = 'Untitled Track';
      return {
        originalTitle: rawTitle || '',
        cleanedTitle: defaultName,
        proposedFilename: `${defaultName}.${outputFormat}`,
        detectedArtist: null,
        detectedComposer: null,
        detectedVersion: null,
        cleaningMode: mode
      };
    }

    let workStr = normalizeWhitespace(rawTitle);

    const detectedComposer = this._detectComposer(workStr);
    if (detectedComposer) {
      workStr = workStr.replace(/[\(\[\{]\s*(?:cipt(?:aan)?|composer|composed\s*by|songwriter|written\s*by)\.?\s*[:\-]?\s*([^()\[\]{}]+)[\)\]\}]/gi, ' ');
      workStr = normalizeWhitespace(workStr);
    }

    const detectedVersion = this._detectPreservedVersion(workStr);

    workStr = this._removeUploadAnnotations(workStr);

    if (mode === 'Advanced' || mode === 'Custom') {
      workStr = this._removePhrases(workStr, PROMOTIONAL_ALBUM_LABELS);
      workStr = this._removePhrases(workStr, VIDEO_TECHNICAL_LABELS);
      workStr = this._removePhrases(workStr, PROMOTIONAL_KEYWORDS);
      workStr = this._removePhrases(workStr, REGIONAL_MUSIC_PATTERNS);
      workStr = this._removePhrases(workStr, CHANNEL_PROMOTION_PATTERNS);
    } else if (mode === 'Standard') {
      workStr = this._removePhrases(workStr, VIDEO_TECHNICAL_LABELS);
      workStr = this._removePhrases(workStr, CHANNEL_PROMOTION_PATTERNS);
    }

    if (mode === 'Custom' && this.customConfig.customRemovalPhrases.length > 0) {
      workStr = this._removePhrases(workStr, this.customConfig.customRemovalPhrases);
    }

    workStr = this._removeStandaloneYears(workStr);
    workStr = this._removeOrphanedTokens(workStr);
    workStr = cleanPunctuationAndBrackets(workStr);

    const extraction = extractArtistAndTitle(workStr, metadataArtist);
    
    let cleanedTitle = extraction.title;
    let artist = extraction.artist;

    if (artist && cleanedTitle) {
      if (!cleanedTitle.toLowerCase().includes(artist.toLowerCase())) {
        cleanedTitle = `${artist} - ${cleanedTitle}`;
      }
    } else if (!cleanedTitle && artist) {
      cleanedTitle = artist;
    } else if (!cleanedTitle && !artist) {
      cleanedTitle = 'Untitled Track';
    }

    cleanedTitle = cleanPunctuationAndBrackets(cleanedTitle);

    if (!cleanedTitle || cleanedTitle.trim().length < 2) {
      cleanedTitle = this._lastResortClean(rawTitle);
    }

    if (detectedVersion && !cleanedTitle.toLowerCase().includes(detectedVersion.toLowerCase())) {
      cleanedTitle = `${cleanedTitle} (${detectedVersion})`;
    }

    let filenameBase = cleanedTitle;
    if (trackIndex !== null && trackIndex !== undefined) {
      const paddedIndex = String(trackIndex).padStart(3, '0');
      filenameBase = `${paddedIndex} - ${cleanedTitle}`;
    }

    const ext = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`;
    const proposedFilename = sanitizeFilename(filenameBase, ext);

    return {
      originalTitle: rawTitle,
      cleanedTitle,
      proposedFilename,
      detectedArtist: artist,
      detectedComposer: detectedComposer || null,
      detectedVersion: detectedVersion || null,
      cleaningMode: mode
    };
  }

  private _detectComposer(title: string | null | undefined): string | null {
    if (!title || typeof title !== 'string') return null;
    const match = title.match(/[\(\[\{]\s*(?:cipt(?:aan)?|composer|composed\s*by|songwriter|written\s*by)\.?\s*[:\-]?\s*([^()\[\]{}]+)[\)\]\}]/i);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 1 && candidate.length < 50) {
        return candidate;
      }
    }
    return null;
  }

  private _detectPreservedVersion(str: string): string | null {
    const promoOnlyPattern = /^(DJ\s+)?REMIX\s+(VIRAL\s+)?(TIK\s*TOK|TIKTOK)\b/i;
    if (promoOnlyPattern.test(str.trim())) {
      return null;
    }

    for (const ver of PRESERVED_VERSIONS) {
      const escaped = this._escapeRegExp(ver);
      const regex = new RegExp(`(^|[^a-zA-Z])${escaped}([^a-zA-Z]|$)`, 'i');
      if (regex.test(str)) {
        return ver;
      }
    }
    return null;
  }

  private _removeUploadAnnotations(str: string): string {
    let result = str;

    result = result.replace(/\bDJ\s+REMIX\s+(VIRAL\s+)?TIK\s*TOK(\s*\d{4})?\b/gi, '');
    result = result.replace(/\bREMIX\s+(VIRAL\s+)?TIK\s*TOK(\s*\d{4})?\b/gi, '');
    result = result.replace(/\bVIRAL\s+TIK\s*TOK(\s*\d{4})?\b/gi, '');
    result = result.replace(/\bTIK\s*TOK(\s*\d{4})?\b/gi, '');
    result = result.replace(/\bTERBARU(19\d{2}|20\d{2})\b/gi, '');
    result = result.replace(/\b(LAGU\s+TERBARU|ALBUM\s+TERBARU|HITS|VIRAL|TRENDING|TERBARU|TERBARU\s+\d{4})\s*(19\d{2}|20\d{2})(!+)?\b/gi, '');
    result = result.replace(/\b(TERBARU)\s*(19\d{2}|20\d{2})\b/gi, '');
    result = result.replace(/\b(19\d{2}|20\d{2})(!{2,})\b/g, '');
    result = result.replace(/\(\s*BY\s+[A-Z0-9\s\_]+\)/gi, '');
    result = result.replace(/\bBY\s+[A-Z0-9\s\_]+(?=$|\-|\))/gi, '');
    result = result.replace(/\[\s*[A-Z][A-Z0-9\s]+\s*\]/g, '');
    result = result.replace(/\s+[-–]\s+[A-Z]\d+\s*$/gi, '');
    result = result.replace(/\s*\|\|\s*(DJ|HD|HQ|MV|OST|VJ)?\s*$/gi, '');
    result = result.replace(/\s*\|\s*(DJ|HD|HQ|MV|OST|VJ)?\s*$/gi, '');

    return result;
  }

  private _removeStandaloneYears(str: string): string {
    return str.replace(/(^|[\s\|\-\(\[,])(19\d{2}|20\d{2})(?=[\s\|\-\)\],]|$)/g, '$1');
  }

  private _removeOrphanedTokens(str: string): string {
    const ORPHANED_WORDS = new Set(['DJ', 'HD', 'HQ', 'MV', 'OST', 'VJ']);

    const parts = str.split(/\s*-\s*/);
    if (parts.length <= 1) {
      const trimmed = str.trim();
      if (ORPHANED_WORDS.has(trimmed.toUpperCase())) return '';
      return str;
    }

    const filtered = parts.filter(p => {
      const cleaned = p.trim();
      if (cleaned.length === 0) return false;
      if (cleaned.length <= 2 && /^[A-Z0-9]+$/.test(cleaned)) return false;
      if (ORPHANED_WORDS.has(cleaned.toUpperCase())) return false;
      if (/^[A-Z]\d+$/.test(cleaned)) return false;
      return true;
    });

    if (filtered.length === 0) return str;
    return filtered.join(' - ');
  }

  private _lastResortClean(rawTitle: string): string {
    let result = rawTitle
      .replace(/\b(OFFICIAL|VIDEO|AUDIO|LYRICS?|HD|HQ|MP3|DOWNLOAD|TIKTOK|VIRAL|TERBARU|NONSTOP|FULL\s+ALBUM)\b/gi, '')
      .replace(/\b(19\d{2}|20\d{2})(!+)?\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleanPunctuationAndBrackets(result) || rawTitle.slice(0, 60).trim();
  }

  private _removePhrases(str: string, phrases: string[]): string {
    let result = str;
    const sorted = [...phrases].sort((a, b) => b.length - a.length);

    for (const phrase of sorted) {
      if (this.customConfig.protectedPhrases.some(p => p.toLowerCase() === phrase.toLowerCase())) {
        continue;
      }

      const escaped = this._escapeRegExp(phrase);
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}(?=[^a-zA-Z0-9]|$)`, 'gi');
      result = result.replace(regex, (match, prefix) => prefix);
    }
    return result;
  }

  private _escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
