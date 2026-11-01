export type CleanerMode = 'Standard' | 'Advanced' | 'Custom';
export type AudioFormat = 'mp3' | 'original';
export type AudioQuality = 'best' | '320' | '256' | '192' | '128';
export type TargetAction = 'download' | 'roblox';
export type JobStatus = 'queued' | 'active' | 'completed' | 'cancelled' | 'failed';
export type TrackStatus = 'pending' | 'cleaning' | 'processing' | 'completed' | 'failed';

export interface RobloxConfig {
  apiKey: string;
  creatorId: string;
  creatorType?: 'user' | 'group';
}

export interface RobloxInfo {
  type: 'PlaybackSpeed' | 'PitchShift' | 'Octave';
  value: string;
  code: string;
  label: string;
}

export interface RobloxUploadResult {
  assetId: string;
  assetUrl: string;
  moderationState: string;
}

export interface RawEntry {
  id: string;
  title: string;
  artist?: string | null;
  composer?: string | null;
  channel?: string | null;
  durationSec?: number | null;
  thumbnail?: string | null;
  url?: string;
  audioUrl?: string;
  isDirectAudio?: boolean;
}

export interface ProviderMetadata {
  isDemo: boolean;
  type: 'track' | 'playlist' | 'mix';
  title: string;
  artist?: string | null;
  composer?: string | null;
  channel?: string | null;
  durationSec?: number | null;
  thumbnail?: string | null;
  totalEntries: number;
  entries: RawEntry[];
}

export interface UrlInfo {
  isValid: boolean;
  type?: 'track' | 'playlist' | 'mix' | 'unsupported';
  normalizedUrl?: string;
  videoId?: string;
  playlistId?: string;
  reason?: string;
  domain?: string;
}

export interface CleanResult {
  originalTitle: string;
  cleanedTitle: string;
  detectedArtist: string | null;
  detectedComposer: string | null;
  detectedVersion: string | null;
  proposedFilename: string;
  cleaningMode: CleanerMode;
  appliedRules?: string[];
}

export interface TrackOverride {
  title?: string;
  artist?: string;
  composer?: string;
  album?: string;
  year?: string;
  genre?: string;
  trackNumber?: string;
  pitch?: string | number;
}

export interface TrackItem {
  id: string;
  originalTitle: string;
  cleanedTitle: string;
  filename: string;
  artist: string | null;
  composer: string | null;
  album: string | null;
  year: string | null;
  genre: string | null;
  trackNumber: string | null;
  pitch: string | number;
  robloxInfo: RobloxInfo | null;
  robloxAssetId: string | null;
  robloxAssetUrl: string | null;
  robloxModeration: string | null;
  isCustomMetadata: boolean;
  version: string | null;
  durationSec: number | null;
  thumbnail: string | null;
  url?: string;
  status: TrackStatus;
  progressPct: number;
  filepath: string | null;
  error: string | null;
}

export interface JobSettings {
  format?: AudioFormat;
  quality?: string;
  cleanerMode?: CleanerMode;
  pitch?: string | number;
}

export interface JobData {
  id: string;
  type: 'track' | 'playlist' | 'mix';
  url: string;
  metadata: ProviderMetadata;
  settings: JobSettings;
  targetAction?: TargetAction;
  robloxConfig?: RobloxConfig | null;
  selectedTrackIds?: string[];
  customMetadata?: Record<string, TrackOverride>;
}

export interface Job {
  id: string;
  type: 'track' | 'playlist' | 'mix';
  url: string;
  title: string;
  cleanerMode: CleanerMode;
  format: string;
  quality: string;
  pitch: string | number;
  targetAction: TargetAction;
  robloxConfig: RobloxConfig | null;
  status: JobStatus;
  totalTracks: number;
  completedTracks: number;
  failedTracks: number;
  overallProgressPct: number;
  tracks: TrackItem[];
  zipFilepath: string | null;
  zipFilename: string | null;
  createdAt: string;
  error?: string;
  sseClients: Set<any>;
}

export interface UrlValidationResult {
  isValid: boolean;
  type?: 'track' | 'playlist' | 'mix';
  normalizedUrl?: string;
  reason?: string;
  id?: string;
  videoId?: string;
  playlistId?: string;
}

export interface AudioValidationResult {
  isValid: boolean;
  reason?: string;
  format?: string;
  quality?: string;
  bitrateKbps?: number;
}

export interface ParsedPitch {
  hasModification: boolean;
  filter: string | null;
  robloxType: 'PlaybackSpeed' | 'PitchShift' | null;
  robloxValue: string | null;
  robloxCode: string | null;
  label: string;
}
