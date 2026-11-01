'use client';

import React from 'react';
import { User, Layers } from 'lucide-react';
import type { AnalysisData } from '../types/index.js';

interface PreviewCardProps {
  metadata: AnalysisData | null;
}

export default function PreviewCard({ metadata }: PreviewCardProps) {
  if (!metadata) return null;

  return (
    <div className="w-full music-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
      <div className="relative w-full sm:w-48 h-32 rounded-2xl overflow-hidden bg-[#161722] border border-white/10 shrink-0 shadow-xl shadow-black/50">
        {metadata.thumbnail ? (
          <img
            src={metadata.thumbnail}
            alt={metadata.title || 'Artwork'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600">
            <span className="text-2xl">🎵</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 music-pill bg-black/75 backdrop-blur-md text-white border border-white/10 text-[10px]">
          {metadata.type?.toUpperCase()}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {metadata.isDemo && (
            <span className="music-pill bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Demo Sample
            </span>
          )}
          <span className="music-pill bg-[#1ed760]/15 text-emerald-300 border border-[#1ed760]/30">
            Mode Pembersih: {metadata.cleanerMode}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight line-clamp-2">
          {metadata.title}
        </h2>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-neutral-400">
          {metadata.channel && (
            <div className="flex items-center gap-1.5 font-medium text-neutral-300">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{metadata.channel}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>{metadata.totalEntries} {metadata.totalEntries === 1 ? 'Lagu' : 'Lagu Ditemukan'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
