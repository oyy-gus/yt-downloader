export function normalizeWhitespace(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanPunctuationAndBrackets(str: string | null | undefined): string {
  if (!str) return '';
  let cleaned = str;

  cleaned = cleaned.replace(/\(\s*\)|\[\s*\]|\{\s*\}/g, '');
  cleaned = cleaned.replace(/\s*\|\s*/g, ' - ');
  cleaned = cleaned.replace(/\s*•\s*/g, ' - ');
  cleaned = cleaned.replace(/\s*-\s*-\s*/g, ' - ');
  cleaned = cleaned.replace(/^[\s\-_|\•\:\,\!\?]+|[\s\-_|\•\:\,\!\?]+$/g, '');

  return normalizeWhitespace(cleaned);
}

export function sanitizeFilename(filename: string | null | undefined, extension: string = '.mp3', defaultName: string = 'Untitled Track'): string {
  let baseName = filename || defaultName;

  if (extension && baseName.toLowerCase().endsWith(extension.toLowerCase())) {
    baseName = baseName.slice(0, -extension.length);
  }

  let safeName = baseName.replace(/[\\/:*?"<>|]/g, '');
  safeName = normalizeWhitespace(safeName);
  safeName = cleanPunctuationAndBrackets(safeName);

  if (!safeName || safeName.length === 0) {
    safeName = defaultName;
  }

  if (safeName.length > 200) {
    safeName = safeName.substring(0, 200).trim();
  }

  safeName = safeName.replace(/\.\.+/g, '');

  const finalExt = extension.startsWith('.') ? extension : `.${extension}`;
  return `${safeName}${finalExt}`;
}

export function preventFilenameCollisions(existingNames: Set<string>, proposedName: string): string {
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
