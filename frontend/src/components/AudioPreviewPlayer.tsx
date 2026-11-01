'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  X, 
  Disc, 
  ExternalLink, 
  Loader2, 
  Gauge 
} from 'lucide-react';
import type { TrackItem } from '../types/index.js';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface AudioPreviewPlayerProps {
  track: TrackItem | null;
  initialPitch?: string | number;
  onClose: () => void;
}

export default function AudioPreviewPlayer({ track, initialPitch = '0', onClose }: AudioPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [embedError, setEmbedError] = useState(false);

  const [prevTrackId, setPrevTrackId] = useState<string | null>(null);
  const [prevPitch, setPrevPitch] = useState<string | number>(initialPitch);

  if (track && track.id !== prevTrackId) {
    setPrevTrackId(track.id);
    setIsLoading(true);
    setEmbedError(false);
    setCurrentTime(0);
  }

  if (initialPitch !== prevPitch) {
    setPrevPitch(initialPitch);
    if (typeof initialPitch === 'string' && initialPitch.startsWith('speed:')) {
      const f = parseFloat(initialPitch.replace('speed:', '')) || 1.0;
      setPlaybackRate(f);
    }
  }

  const rawId = useId();
  const domId = `yt-preview-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const playerRef = useRef<any>(null);
  const volumeRef = useRef(volume);
  const playbackRateRef = useRef(playbackRate);
  const trackRef = useRef(track);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch {}
    }
  }, [playbackRate]);

  useEffect(() => {
    const currentTrack = trackRef.current;
    if (!currentTrack || !currentTrack.id) return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }

      playerRef.current = new window.YT.Player(domId, {
        height: '0',
        width: '0',
        videoId: currentTrack.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event: any) => {
            setIsLoading(false);
            event.target.setVolume(volumeRef.current);
            if (playbackRateRef.current !== 1.0 && event.target.setPlaybackRate) {
              event.target.setPlaybackRate(playbackRateRef.current);
            }
            event.target.playVideo();
            setIsPlaying(true);
            setDuration(event.target.getDuration() || trackRef.current?.durationSec || 0);
          },
          onStateChange: (event: any) => {
            if (event.data === 1) {
              setIsPlaying(true);
              setIsLoading(false);
              setDuration(event.target.getDuration() || trackRef.current?.durationSec || 0);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 0) {
              setIsPlaying(false);
              setCurrentTime(0);
            } else if (event.data === 3) {
              setIsLoading(true);
            }
          },
          onError: () => {
            setIsLoading(false);
            setEmbedError(true);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      const previousOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousOnReady) previousOnReady();
        initPlayer();
      };
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }
    };
  }, [track?.id, domId]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const t = playerRef.current.getCurrentTime();
          if (typeof t === 'number') {
            setCurrentTime(t);
          }
        } catch {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch {}
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current && playerRef.current.seekTo) {
      try {
        playerRef.current.seekTo(newTime, true);
      } catch {}
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (playerRef.current && playerRef.current.setVolume) {
      try {
        playerRef.current.setVolume(newVol);
        if (newVol > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {}
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch {}
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      try {
        playerRef.current.setPlaybackRate(newRate);
      } catch {}
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-5 left-4 right-4 max-w-4xl mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div id={domId} className="hidden" />

      <div className="rounded-full bg-[#151620]/95 backdrop-blur-2xl border border-white/15 px-4 sm:px-6 py-3 shadow-2xl shadow-black/80 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0 w-full md:w-auto flex-1">
          <div className="relative w-11 h-11 rounded-full bg-[#202130] shrink-0 overflow-hidden shadow-md">
            {track.thumbnail ? (
              <img src={track.thumbnail} alt={track.cleanedTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                <Disc className="w-5 h-5" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-[#1ed760]/20 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-xs sm:text-sm text-white truncate">
              {track.cleanedTitle}
            </p>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
              {track.detectedArtist || track.artist || track.channel || 'Artis Musik'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 w-full md:w-80">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={isLoading || embedError}
              className="w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#1ed760]/20 disabled:opacity-40 disabled:hover:scale-100"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          </div>

          <div className="w-full flex items-center gap-2 text-[10px] text-neutral-400 tabular-nums">
            <span className="w-8 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              disabled={isLoading || embedError}
              className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1ed760]"
            />
            <span className="w-8">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-xs text-neutral-300">
            <Gauge className="w-3.5 h-3.5 text-[#1ed760]" />
            <select
              value={playbackRate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              aria-label="Kecepatan putar audio"
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value={0.75} className="bg-[#181926]">0.75x</option>
              <option value={0.80} className="bg-[#181926]">0.80x (Slowed)</option>
              <option value={0.85} className="bg-[#181926]">0.85x</option>
              <option value={0.90} className="bg-[#181926]">0.90x</option>
              <option value={1.00} className="bg-[#181926]">1.00x Normal</option>
              <option value={1.05} className="bg-[#181926]">1.05x</option>
              <option value={1.10} className="bg-[#181926]">1.10x</option>
              <option value={1.15} className="bg-[#181926]">1.15x</option>
              <option value={1.20} className="bg-[#181926]">1.20x (Speed Up)</option>
              <option value={1.25} className="bg-[#181926]">1.25x</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Batal Bisukan' : 'Bisukan'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume audio"
              className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1ed760]"
            />
          </div>

          {track.url && (
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Buka di YouTube"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Tutup Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {embedError && (
        <div className="mt-2 text-center">
          <span className="text-[11px] bg-red-950/80 text-red-300 border border-red-500/30 px-3 py-1 rounded-full">
            Video YouTube ini tidak mengizinkan pemutaran via embed langsung. Anda tetap dapat mengunduhnya secara penuh.
          </span>
        </div>
      )}
    </div>
  );
}
