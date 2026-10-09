'use client';

import React from 'react';
import { ListMusic, User, Clock, Layers, Sparkles } from 'lucide-react';

export default function PreviewCard({ metadata }) {
  if (!metadata) return null;

  return (
    <div className="w-full glass-card rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row gap-5 items-center md:items-start relative overflow-hidden">
      {/* Thumbnail */}
      <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden bg-gray-900 border border-white/10 shrink-0">
        {metadata.thumbnail ? (
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <ListMusic className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
          {metadata.type}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-2 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          {metadata.isDemo && (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
              Dev Mode Sample
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold uppercase tracking-wider">
            {metadata.cleanerMode} Cleaning Mode
          </span>
        </div>

        <h2 className="text-lg font-bold text-gray-100 line-clamp-2">
          {metadata.title}
        </h2>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-400 pt-1">
          {metadata.channel && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>{metadata.channel}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{metadata.totalEntries} {metadata.totalEntries === 1 ? 'Track' : 'Tracks'} Discovered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
