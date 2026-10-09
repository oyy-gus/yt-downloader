'use client';

import React from 'react';
import { CheckSquare, Square, Wand2, PlayCircle, Clock } from 'lucide-react';

export default function TrackSelectionList({ tracks, selectedIds, onToggleSelect, onSelectAll, onDeselectAll, onStartJob, isStartingJob }) {
  if (!tracks || tracks.length === 0) return null;

  const allSelected = tracks.length > 0 && selectedIds.length === tracks.length;

  return (
    <div className="w-full glass-card rounded-2xl p-6 border border-white/10 space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <span>Title Cleaner Preview & Track Selection</span>
          </h3>
          <p className="text-xs text-gray-400">
            Verify cleaned titles and select tracks for batch processing.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-300 border border-white/10 transition"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>

          <button
            type="button"
            disabled={selectedIds.length === 0 || isStartingJob}
            onClick={onStartJob}
            className="px-5 py-2 rounded-xl gradient-bg text-white font-semibold text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Process Selected ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {tracks.map((track) => {
          const isSelected = selectedIds.includes(track.id);

          return (
            <div
              key={track.id}
              onClick={() => onToggleSelect(track.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center gap-3.5 ${
                isSelected
                  ? 'bg-indigo-950/20 border-indigo-500/40'
                  : 'bg-gray-900/40 border-white/5 opacity-60 hover:opacity-100'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                className="text-indigo-400 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(track.id);
                }}
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Square className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Thumbnail */}
              {track.thumbnail && (
                <img
                  src={track.thumbnail}
                  alt={track.originalTitle}
                  className="w-12 h-12 rounded-lg object-cover bg-gray-900 shrink-0 border border-white/10"
                />
              )}

              {/* Title & Cleaner Comparison */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Proposed Clean Title */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-100 truncate">
                    {track.cleanedTitle}
                  </span>
                  {track.detectedVersion && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium shrink-0">
                      {track.detectedVersion}
                    </span>
                  )}
                </div>

                {/* Original Source Title */}
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <span className="text-gray-600 font-medium">Original:</span>
                  <span>{track.originalTitle}</span>
                </p>

                {/* Proposed Output Filename */}
                <p className="text-[11px] text-indigo-400/80 font-mono truncate">
                  Output: {track.proposedFilename}
                </p>
              </div>

              {/* Duration */}
              {track.durationSec > 0 && (
                <div className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{Math.floor(track.durationSec / 60)}:{String(track.durationSec % 60).padStart(2, '0')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
