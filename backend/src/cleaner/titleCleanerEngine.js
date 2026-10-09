/**
 * Advanced Track Title Cleaner Engine
 * Implements Standard, Advanced (default), and Custom cleaning modes.
 * Handles Indonesian, TikTok-viral, DJ/Remix, and global music title patterns.
 */

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

export class TitleCleanerEngine {
  constructor(customConfig = {}) {
    this.customConfig = {
      customRemovalPhrases: customConfig.customRemovalPhrases || [],
      protectedPhrases: customConfig.protectedPhrases || [],
      filenameTemplate: customConfig.filenameTemplate || '{artist} - {title}',
      playlistPrefixFormat: customConfig.playlistPrefixFormat || '{index} - ',
      ...customConfig
    };
  }

  /**
   * Main cleaning entry point.
   * @param {string} rawTitle 
   * @param {Object} options { mode: 'Advanced' | 'Standard' | 'Custom', metadataArtist?: string, format?: string, index?: number }
   */
  clean(rawTitle, options = {}) {
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
        detectedVersion: null,
        cleaningMode: mode
      };
    }

    let workStr = normalizeWhitespace(rawTitle);

    // 1. Detect Genuine Version (e.g. Slow Remix, Live Version, Acoustic) before scrubbing
    const detectedVersion = this._detectPreservedVersion(workStr);

    // 2. Remove Dynamic Year+promo annotations FIRST (before phrase matching)
    workStr = this._removeUploadAnnotations(workStr);

    // 3. Remove Promotional and Technical Dictionary terms based on mode
    if (mode === 'Advanced' || mode === 'Custom') {
      workStr = this._removePhrases(workStr, PROMOTIONAL_ALBUM_LABELS);
      workStr = this._removePhrases(workStr, VIDEO_TECHNICAL_LABELS);
      workStr = this._removePhrases(workStr, PROMOTIONAL_KEYWORDS);
      workStr = this._removePhrases(workStr, REGIONAL_MUSIC_PATTERNS);
      workStr = this._removePhrases(workStr, CHANNEL_PROMOTION_PATTERNS);
    } else if (mode === 'Standard') {
      // Conservative mode: remove only obvious promo & video tags
      workStr = this._removePhrases(workStr, VIDEO_TECHNICAL_LABELS);
      workStr = this._removePhrases(workStr, CHANNEL_PROMOTION_PATTERNS);
    }

    // Apply Custom mode additional removals
    if (mode === 'Custom' && this.customConfig.customRemovalPhrases.length > 0) {
      workStr = this._removePhrases(workStr, this.customConfig.customRemovalPhrases);
    }

    // 4. Remove leftover standalone year tokens (e.g. " 2024 ", " 2026 " remaining after phrase removal)
    workStr = this._removeStandaloneYears(workStr);

    // 5. Remove orphaned 2–3 letter uppercase tokens that are not valid artist/title context
    workStr = this._removeOrphanedTokens(workStr);

    // 6. Clean punctuation & normalize brackets
    workStr = cleanPunctuationAndBrackets(workStr);

    // 7. Extract Artist and Title
    const extraction = extractArtistAndTitle(workStr, metadataArtist);
    
    // Assemble final clean title
    let cleanedTitle = extraction.title;
    let artist = extraction.artist;

    if (artist && cleanedTitle) {
      // Check if title already contains artist
      if (!cleanedTitle.toLowerCase().includes(artist.toLowerCase())) {
        cleanedTitle = `${artist} - ${cleanedTitle}`;
      }
    } else if (!cleanedTitle && artist) {
      cleanedTitle = artist;
    } else if (!cleanedTitle && !artist) {
      cleanedTitle = 'Untitled Track';
    }

    // Clean punctuation once more after artist assembly
    cleanedTitle = cleanPunctuationAndBrackets(cleanedTitle);

    // Fallback: if still empty, use a sanitized version of original
    if (!cleanedTitle || cleanedTitle.trim().length < 2) {
      cleanedTitle = this._lastResortClean(rawTitle);
    }

    // If a genuine version was preserved and isn't already inside cleanedTitle, append it nicely
    if (detectedVersion && !cleanedTitle.toLowerCase().includes(detectedVersion.toLowerCase())) {
      cleanedTitle = `${cleanedTitle} (${detectedVersion})`;
    }

    // 8. Generate final safe filename
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
      detectedVersion: detectedVersion || null,
      cleaningMode: mode
    };
  }

  _detectPreservedVersion(str) {
    // Skip version detection if the string is predominantly promotional
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

  _removeUploadAnnotations(str) {
    let result = str;

    // 1. Remove "REMIX TIKTOK [YEAR]", "REMIX VIRAL TIKTOK [YEAR]", "REMIX TIK TOK" (with or without year)
    //    Must run BEFORE generic DJ prefix removal so "DJ REMIX VIRAL TIKTOK" collapses fully
    result = result.replace(/\bDJ\s+REMIX\s+(VIRAL\s+)?TIK\s*TOK(\s*\d{4})?\b/gi, '');
    result = result.replace(/\bREMIX\s+(VIRAL\s+)?TIK\s*TOK(\s*\d{4})?\b/gi, '');
    result = result.replace(/\bVIRAL\s+TIK\s*TOK(\s*\d{4})?\b/gi, '');
    result = result.replace(/\bTIK\s*TOK(\s*\d{4})?\b/gi, '');

    // 1b. Remove TERBARU immediately followed by year (no space): TERBARU2026
    result = result.replace(/\bTERBARU(19\d{2}|20\d{2})\b/gi, '');

    // 2. Remove year patterns explicitly tied to promo context
    result = result.replace(/\b(LAGU\s+TERBARU|ALBUM\s+TERBARU|HITS|VIRAL|TRENDING|TERBARU|TERBARU\s+\d{4})\s*(19\d{2}|20\d{2})(!+)?\b/gi, '');
    result = result.replace(/\b(TERBARU)\s*(19\d{2}|20\d{2})\b/gi, '');
    
    // 3. Remove standalone year followed by multiple exclamation marks
    result = result.replace(/\b(19\d{2}|20\d{2})(!{2,})\b/g, '');
    
    // 4. Remove "BY <PRODUCER/REMIXER>" annotations
    result = result.replace(/\(\s*BY\s+[A-Z0-9\s\_]+\)/gi, '');
    result = result.replace(/\bBY\s+[A-Z0-9\s\_]+(?=$|\-|\))/gi, '');

    // 5. Remove source channel attribution patterns like "[NDOO LIFE]"
    result = result.replace(/\[\s*[A-Z][A-Z0-9\s]+\s*\]/g, '');

    // 6. Remove trailing short codes like " - B24", " - V2" at end of title
    result = result.replace(/\s+[-–]\s+[A-Z]\d+\s*$/gi, '');

    // 7. Remove double-pipe || followed by an orphaned short word (e.g. "|| DJ" after viral/tiktok removal)
    //    These become "- DJ" after punctuation normalization — catch them early
    result = result.replace(/\s*\|\|\s*(DJ|HD|HQ|MV|OST|VJ)?\s*$/gi, '');
    result = result.replace(/\s*\|\s*(DJ|HD|HQ|MV|OST|VJ)?\s*$/gi, '');

    return result;
  }

  _removeStandaloneYears(str) {
    // Only remove years when they appear as isolated tokens (not part of an artist name or actual content)
    // We remove if surrounded by non-alphanumeric chars or at start/end
    return str.replace(/(^|[\s\|\-\(\[,])(19\d{2}|20\d{2})(?=[\s\|\-\)\],]|$)/g, '$1');
  }

  _removeOrphanedTokens(str) {
    // Split by separator '-' and filter out segments that are only meaningless short tokens
    // e.g. after heavy cleaning: "DJ" alone, or "HD" alone, or "B24" (channel code)
    const ORPHANED_WORDS = new Set(['DJ', 'HD', 'HQ', 'MV', 'OST', 'VJ']);

    const parts = str.split(/\s*-\s*/);
    if (parts.length <= 1) {
      // Also handle trailing orphaned word at the very end (no dash)
      const trimmed = str.trim();
      if (ORPHANED_WORDS.has(trimmed.toUpperCase())) return '';
      return str;
    }

    const filtered = parts.filter(p => {
      const cleaned = p.trim();
      if (cleaned.length === 0) return false;
      // Remove segments that are ONLY 1-2 uppercase chars
      if (cleaned.length <= 2 && /^[A-Z0-9]+$/.test(cleaned)) return false;
      // Remove segments that are a single known orphaned word
      if (ORPHANED_WORDS.has(cleaned.toUpperCase())) return false;
      // Remove segment that looks like a channel code: single letter + digits (e.g. B24, V2)
      if (/^[A-Z]\d+$/.test(cleaned)) return false;
      return true;
    });

    if (filtered.length === 0) return str; // safety fallback — return original
    return filtered.join(' - ');
  }

  _lastResortClean(rawTitle) {
    // Minimal cleaning: just normalize whitespace and remove the most obvious promo tags
    let result = rawTitle
      .replace(/\b(OFFICIAL|VIDEO|AUDIO|LYRICS?|HD|HQ|MP3|DOWNLOAD|TIKTOK|VIRAL|TERBARU|NONSTOP|FULL\s+ALBUM)\b/gi, '')
      .replace(/\b(19\d{2}|20\d{2})(!+)?\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleanPunctuationAndBrackets(result) || rawTitle.slice(0, 60).trim();
  }

  _removePhrases(str, phrases) {
    let result = str;
    // Sort by length descending so longer phrases match first
    const sorted = [...phrases].sort((a, b) => b.length - a.length);

    for (const phrase of sorted) {
      // Protect phrases if present in protected list
      if (this.customConfig.protectedPhrases.some(p => p.toLowerCase() === phrase.toLowerCase())) {
        continue;
      }

      const escaped = this._escapeRegExp(phrase);
      
      // Use a simpler approach: replace phrase surrounded by non-alphanumeric chars or at string edges
      // This avoids lookbehind compatibility issues across Node versions
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}(?=[^a-zA-Z0-9]|$)`, 'gi');
      result = result.replace(regex, (match, prefix) => prefix);
    }
    return result;
  }

  _escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
