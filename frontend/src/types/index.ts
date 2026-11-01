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

export interface TrackItem {
  id: string;
  originalTitle: string;
  cleanedTitle: string;
  filename?: string;
  proposedFilename?: string;
  artist?: string | null;
  detectedArtist?: string | null;
  composer?: string | null;
  detectedComposer?: string | null;
  album?: string | null;
  year?: string | null;
  genre?: string | null;
  trackNumber?: string | null;
  pitch?: string | number;
  robloxInfo?: RobloxInfo | null;
  robloxAssetId?: string | null;
  robloxAssetUrl?: string | null;
  robloxModeration?: string | null;
  isCustomMetadata?: boolean;
  version?: string | null;
  detectedVersion?: string | null;
  durationSec?: number | null;
  thumbnail?: string | null;
  channel?: string | null;
  url?: string;
  audioUrl?: string;
  isDirectAudio?: boolean;
  status?: TrackStatus;
  progressPct?: number;
  error?: string | null;
}

export interface AnalysisData {
  isDemo?: boolean;
  type?: 'track' | 'playlist' | 'mix';
  title?: string;
  channel?: string | null;
  thumbnail?: string | null;
  totalEntries?: number;
  cleanerMode?: CleanerMode;
  tracks?: TrackItem[];
}

export interface JobProgressData {
  id: string;
  type: 'track' | 'playlist' | 'mix';
  url: string;
  title: string;
  cleanerMode: CleanerMode;
  format: AudioFormat;
  quality: string;
  status: JobStatus;
  totalTracks: number;
  completedTracks: number;
  failedTracks: number;
  overallProgressPct: number;
  hasZip: boolean;
  targetAction?: TargetAction;
  tracks: TrackItem[];
  error?: string;
}

export interface AudioSettings {
  format: AudioFormat;
  quality: AudioQuality;
  cleanerMode: CleanerMode;
  pitch: string | number;
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
