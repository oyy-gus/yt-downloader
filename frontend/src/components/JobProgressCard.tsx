'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Ban, Archive, Download, Copy, Check, ExternalLink, CloudUpload } from 'lucide-react';
import type { JobProgressData } from '../types/index.js';

interface JobProgressCardProps {
  job: JobProgressData | null;
  onCancelJob: () => void;
  onDownloadTrack: (trackId: string) => void;
  onDownloadZip: () => void;
}

export default function JobProgressCard({ job, onCancelJob, onDownloadTrack, onDownloadZip }: JobProgressCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!job) return null;

  const isFinished = ['completed', 'failed', 'cancelled'].includes(job.status);
  const completedTracksCount = job.tracks.filter(t => t.status === 'completed').length;
  const failedTracksCount = job.tracks.filter(t => t.status === 'failed').length;

  return (
    <div className="w-full music-card rounded-3xl p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Proses Antrean Lagu
            </h3>
            <span className={`music-pill ${
              job.status === 'completed'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : job.status === 'active'
                ? 'bg-[#1ed760]/15 border border-[#1ed760]/30 text-emerald-300 animate-pulse'
                : job.status === 'cancelled'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}>
              {job.status === 'completed' ? 'Selesai' : job.status === 'active' ? 'Memproses' : job.status}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {job.title} &bull; Format {job.format.toUpperCase()} ({job.quality} kbps)
          </p>
        </div>

        {!isFinished && (
          <button
            type="button"
            onClick={onCancelJob}
            className="btn-glass px-4 py-1.5 text-xs text-rose-400 hover:text-rose-300 border-rose-500/30 flex items-center gap-1.5 font-medium"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Batalkan Proses</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-neutral-400 font-medium">
          <span>Kemajuan Keseluruhan</span>
          <span className="text-white font-bold">{job.overallProgressPct || 0}%</span>
        </div>
        <div className="w-full h-2 bg-[#171822] rounded-full overflow-hidden border border-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-[#1ed760] to-[#10b981] rounded-full transition-all duration-300 ease-out shadow-sm shadow-[#1ed760]/50"
            style={{ width: `${job.overallProgressPct || 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {job.tracks.map((track, idx) => (
          <div
            key={track.id}
            className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {track.status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {track.status === 'failed' && (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {['pending', 'cleaning', 'processing'].includes(track.status || '') && (
                <Loader2 className="w-4 h-4 text-[#1ed760] animate-spin shrink-0" />
              )}

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 font-medium">{idx + 1}.</span>
                  <span className="font-semibold text-white truncate">
                    {track.cleanedTitle}
                  </span>
                  {track.isCustomMetadata && (
                    <span className="music-pill bg-[#1ed760]/15 text-emerald-300 border border-[#1ed760]/30 text-[10px]">
                      Tag Khusus
                    </span>
                  )}
                </div>

                {(track.artist || track.composer || track.album || track.robloxInfo || (track.pitch && track.pitch !== 0 && track.pitch !== '0')) && (
                  <div className="text-[11px] text-neutral-400 truncate flex items-center gap-2 flex-wrap">
                    {track.artist && <span>{track.artist}</span>}
                    {track.composer && <span className="text-amber-400">&bull; Cipt: {track.composer}</span>}
                    {track.robloxInfo ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px]">
                        <span>Roblox: {track.robloxInfo.value}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard && track.robloxInfo) {
                              navigator.clipboard.writeText(track.robloxInfo.code);
                              setCopiedId(track.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }
                          }}
                          className="px-1.5 py-0.2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[9px] flex items-center gap-0.5"
                        >
                          {copiedId === track.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Luau</span>
                            </>
                          )}
                        </button>
                      </span>
                    ) : (track.pitch && track.pitch !== 0 && track.pitch !== '0') ? (
                      <span className="text-amber-400">&bull; Pitch: {track.pitch}</span>
                    ) : null}
                  </div>
                )}

                <p className="text-[11px] text-neutral-500 truncate">
                  {track.filename}
                </p>

                {track.error && (
                  <p className="text-[11px] text-rose-400 font-medium truncate" title={track.error}>
                    Gagal: {track.error}
                  </p>
                )}
              </div>
            </div>

            {track.robloxAssetId ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(`rbxassetid://${track.robloxAssetId}`);
                      setCopiedId(`asset-${track.id}`);
                      setTimeout(() => setCopiedId(null), 2000);
                    }
                  }}
                  className="px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  {copiedId === `asset-${track.id}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>ID: {track.robloxAssetId}</span>
                    </>
                  )}
                </button>

                {track.robloxAssetUrl && (
                  <a
                    href={track.robloxAssetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full btn-glass"
                    title="Buka di Dashboard Roblox"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : track.status === 'completed' ? (
              <button
                type="button"
                onClick={() => onDownloadTrack(track.id)}
                className="btn-glass px-3.5 py-1 text-xs flex items-center gap-1.5 shrink-0 text-white font-medium"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unduh</span>
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {isFinished && job.targetAction === 'roblox' && completedTracksCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-sm font-bold text-amber-300 flex items-center gap-2 justify-center sm:justify-start">
              <CloudUpload className="w-4 h-4" />
              <span>Semua Lagu Berhasil Di-upload ke Roblox!</span>
            </span>
            <p className="text-xs text-neutral-300">
              {completedTracksCount} audio telah aktif di akun Anda. File lokal otomatis dibersihkan (Zero Storage).
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                const combinedScript = job.tracks
                  .filter(t => t.robloxAssetId)
                  .map((t, idx) => {
                    const normCode = t.robloxInfo ? t.robloxInfo.code.replace('sound.', `sound${idx + 1}.`) : '';
                    return `local sound${idx + 1} = Instance.new("Sound")\nsound${idx + 1}.Name = "${(t.cleanedTitle || 'Audio').replace(/["\\]/g, '')}"\nsound${idx + 1}.SoundId = "rbxassetid://${t.robloxAssetId}"\n${normCode}\nsound${idx + 1}.Parent = workspace\n`;
                  })
                  .join('\n');
                navigator.clipboard.writeText(combinedScript);
                setCopiedId('all-roblox');
                setTimeout(() => setCopiedId(null), 2500);
              }
            }}
            className="px-5 py-2.5 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#f59e0b]/25"
          >
            {copiedId === 'all-roblox' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Semua Skrip Luau Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Semua Skrip Luau</span>
              </>
            )}
          </button>
        </div>
      )}

      {isFinished && job.targetAction !== 'roblox' && job.hasZip && completedTracksCount > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <Archive className="w-4 h-4 text-[#1ed760]" />
              <span>Semua Lagu Siap Diunduh!</span>
            </span>
            <p className="text-xs text-neutral-300">
              {completedTracksCount} lagu telah dikemas ke dalam satu file arsip ZIP beserta ringkasan ID3 tags.
            </p>
          </div>

          <button
            type="button"
            id="btn-download-all-zip"
            onClick={onDownloadZip}
            className="btn-spotify px-6 py-2.5 text-xs flex items-center gap-2 font-bold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Semua File (ZIP)</span>
          </button>
        </div>
      )}
    </div>
  );
}
