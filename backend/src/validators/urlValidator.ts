import { URL } from 'url';

const ALLOWED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be'
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
  'metadata.google.internal'
];

export interface ValidatedUrl {
  isValid: boolean;
  reason?: string;
  type?: 'track' | 'playlist' | 'mix' | 'unsupported';
  normalizedUrl?: string;
  domain?: string;
  videoId?: string | null;
  playlistId?: string | null;
}

export function validateUrl(rawUrl: string | null | undefined): ValidatedUrl {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      reason: 'URL is required',
      type: 'unsupported'
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl.trim());
  } catch (_) {
    return {
      isValid: false,
      reason: 'Invalid URL format',
      type: 'unsupported'
    };
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      reason: 'Only HTTP and HTTPS protocols are supported',
      type: 'unsupported'
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname) || isPrivateIp(hostname)) {
    return {
      isValid: false,
      reason: 'Access to internal or restricted IP addresses is strictly forbidden',
      type: 'unsupported'
    };
  }

  const isAllowedDomain = ALLOWED_DOMAINS.some(allowed => 
    hostname === allowed || hostname.endsWith('.' + allowed)
  );

  if (!isAllowedDomain) {
    return {
      isValid: false,
      reason: `Domain '${hostname}' is not supported. Supported domains: YouTube, YouTube Music, youtu.be`,
      type: 'unsupported'
    };
  }

  const listParam = parsedUrl.searchParams.get('list');
  const hasVideo = parsedUrl.pathname.includes('/watch') || hostname === 'youtu.be' || parsedUrl.searchParams.has('v');

  let type: 'track' | 'playlist' | 'mix' = 'track';
  if (listParam) {
    if (listParam.startsWith('RD') || listParam.startsWith('ULRD')) {
      type = 'mix';
    } else {
      type = 'playlist';
    }
  } else if (!hasVideo && parsedUrl.pathname.includes('/playlist')) {
    type = 'playlist';
  }

  return {
    isValid: true,
    normalizedUrl: parsedUrl.href,
    domain: hostname,
    type,
    videoId: extractVideoId(parsedUrl),
    playlistId: listParam || null
  };
}

function extractVideoId(parsedUrl: URL): string | null {
  if (parsedUrl.hostname === 'youtu.be') {
    return parsedUrl.pathname.slice(1);
  }
  return parsedUrl.searchParams.get('v') || null;
}

function isPrivateIp(hostname: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./
  ];

  return privateRanges.some(regex => regex.test(hostname));
}
