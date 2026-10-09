'use client';

import React from 'react';
import { Loader2, CheckCircle2, XCircle, Ban, FileArchive, Download } from 'lucide-react';

export default function JobProgressCard({ job, onCancelJob, onDownloadTrack, onDownloadZip }) {
  if (!job) return null;

  const isFinished = ['completed', 'failed', 'cancelled'].includes(job.status);
  const completedTracksCount = job.tracks.filter(t => t.status === 'completed').length;

  return (
    <div className="w-full glass-card rounded-2xl p-6 border border-white/10 space-y-6">
      {/* Header & Status Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-100">
              Processing Queue
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              job.status === 'completed'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : job.status === 'active'
                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 animate-pulse'
                : job.status === 'cancelled'
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {job.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {job.title} • {job.format.toUpperCase()} ({job.quality} kbps)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!isFinished && (
            <button
              type="button"
              onClick={onCancelJob}
              className="px-4 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium text-xs flex items-center gap-1.5 transition"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Job</span>
            </button>
          )}

          {job.hasZip && (
            <button
              type="button"
              onClick={onDownloadZip}
              className="px-5 py-2 rounded-xl gradient-bg text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition shadow-lg shadow-indigo-500/25 flex items-center gap-2"
            >
              <FileArchive className="w-4 h-4" />
              <span>Export All as ZIP</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Overall Batch Progress</span>
          <span className="font-medium text-gray-200">{job.overallProgressPct || 0}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full gradient-bg transition-all duration-300 ease-out"
            style={{ width: `${job.overallProgressPct || 0}%` }}
          />
        </div>
      </div>

      {/* Track Progress Items */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {job.tracks.map((track) => (
          <div
            key={track.id}
            className="p-3 rounded-xl bg-gray-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Status Icon */}
              {track.status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {track.status === 'failed' && (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {['pending', 'cleaning', 'processing'].includes(track.status) && (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              )}

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-200 truncate">
                  {track.cleanedTitle}
                </p>
                <p className="text-[11px] text-gray-500 font-mono truncate">
                  {track.filename}
                </p>
              </div>
            </div>

            {/* Individual Download Button */}
            {track.status === 'completed' && (
              <button
                type="button"
                onClick={() => onDownloadTrack(track.id)}
                className="px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium flex items-center gap-1.5 transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
