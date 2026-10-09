/**
 * Title & Filename Normalization utilities
 */

/**
 * Normalizes zero-width characters, control characters, and multiple spaces.
 */
export function normalizeWhitespace(str) {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width characters
    .replace(/[\x00-\x1F\x7F]/g, '')     // remove control characters
    .replace(/\s+/g, ' ')                // replace multiple spaces with single space
    .trim();
}

/**
 * Cleans empty brackets, parentheses, and trailing/leading punctuation.
 */
export function cleanPunctuationAndBrackets(str) {
  if (!str) return '';
  let cleaned = str;

  // Remove empty or whitespace-only brackets/parentheses: (), [], {}, ( ), [ ]
  cleaned = cleaned.replace(/\(\s*\)|\[\s*\]|\{\s*\}/g, '');
  
  // Convert pipe | and bullet • to standard dash separator
  cleaned = cleaned.replace(/\s*\|\s*/g, ' - ');
  cleaned = cleaned.replace(/\s*•\s*/g, ' - ');

  // Clean double or multiple separators like - -, - - -, etc.
  cleaned = cleaned.replace(/\s*-\s*-\s*/g, ' - ');

  // Clean leading/trailing separators and punctuation
  cleaned = cleaned.replace(/^[\s\-_|\•\:\,\!\?]+|[\s\-_|\•\:\,\!\?]+$/g, '');

  return normalizeWhitespace(cleaned);
}

/**
 * Generates a safe, sanitized filename with path traversal prevention and filesystem character sanitization.
 */
export function sanitizeFilename(filename, extension = '.mp3', defaultName = 'Untitled Track') {
  let baseName = filename || defaultName;

  // Strip extension if included in filename
  if (extension && baseName.toLowerCase().endsWith(extension.toLowerCase())) {
    baseName = baseName.slice(0, -extension.length);
  }

  // Remove illegal characters for Windows/Linux filesystems: \ / : * ? " < > |
  let safeName = baseName.replace(/[\\/:*?"<>|]/g, '');

  // Normalize whitespace
  safeName = normalizeWhitespace(safeName);
  safeName = cleanPunctuationAndBrackets(safeName);

  if (!safeName || safeName.length === 0) {
    safeName = defaultName;
  }

  // Truncate excessively long filenames (max 200 chars to stay safe under OS path limits)
  if (safeName.length > 200) {
    safeName = safeName.substring(0, 200).trim();
  }

  // Sanitize any remaining path traversal syntax
  safeName = safeName.replace(/\.\.+/g, '');

  const finalExt = extension.startsWith('.') ? extension : `.${extension}`;
  return `${safeName}${finalExt}`;
}

/**
 * Ensures unique filenames in a batch list to prevent collisions.
 */
export function preventFilenameCollisions(existingNames, proposedName) {
  if (!existingNames.has(proposedName.toLowerCase())) {
    existingNames.add(proposedName.toLowerCase());
    return proposedName;
  }

  const dotIdx = proposedName.lastIndexOf('.');
  const base = dotIdx !== -1 ? proposedName.slice(0, dotIdx) : proposedName;
  const ext = dotIdx !== -1 ? proposedName.slice(dotIdx) : '';

  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;
  while (existingNames.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${base} (${counter})${ext}`;
  }

  existingNames.add(candidate.toLowerCase());
  return candidate;
}
