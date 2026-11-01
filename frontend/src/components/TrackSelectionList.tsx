'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Disc,
  Calendar,
  PenTool,
  X,
  Play,
  Volume2,
  CloudUpload,
  Download,
  Music,
  Sliders
} from 'lucide-react';
import type { TrackItem, TrackOverride, AudioSettings, TargetAction } from '../types/index.js';

const COMMON_GENRES = [
  'Pop',
  'Rock',
  'Dangdut',
  'Koplo',
  'Acoustic',
  'EDM',
  'Lo-Fi',
  'R&B',
  'Hip-Hop',
  'Indie',
  'Jazz'
];

function getRobloxNormalizationHint(pitchVal: string | number) {
  if (!pitchVal || pitchVal === 0 || pitchVal === '0') return null;
  const str = String(pitchVal).trim();
  if (str.startsWith('speed:')) {
    const f = parseFloat(str.replace('speed:', '')) || 1.0;
    if (Math.abs(f - 1.0) < 0.001) return null;
    const robloxSpeed = (1 / f).toFixed(3);
    return {
      type: 'PlaybackSpeed',
      value: robloxSpeed,
      text: `Roblox Speed = ${robloxSpeed}`,
      code: `sound.PlaybackSpeed = ${robloxSpeed}`
    };
  }
  const s = parseFloat(str.replace('semitone:', '')) || 0;
  if (Math.abs(s) < 0.001) return null;
  const k = Math.pow(2, s / 12);
  const robloxOctave = (1 / k).toFixed(3);
  return {
    type: 'Octave',
    value: robloxOctave,
    text: `Roblox Octave = ${robloxOctave}`,
    code: `pitchShift.Octave = ${robloxOctave}`
  };
}

interface TrackSelectionListProps {
  tracks: TrackItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStartJob: () => void;
  isStartingJob: boolean;
  customMetadata?: Record<string, TrackOverride>;
  onUpdateMetadata: (id: string, override: Partial<TrackOverride>) => void;
  onResetMetadata: (id: string) => void;
  onBatchApplyMetadata?: (batch: any) => void;
  onResetAllMetadata?: () => void;
  playlistTitle?: string;
  settings?: AudioSettings;
  targetAction?: TargetAction;
  onPlayPreview?: (track: TrackItem) => void;
  currentPreviewId?: string | null;
}

export default function TrackSelectionList({
  tracks,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onStartJob,
  isStartingJob,
  customMetadata = {},
  onUpdateMetadata,
  onResetMetadata,
  onBatchApplyMetadata,
  onResetAllMetadata,
  playlistTitle = '',
  settings = { format: 'mp3', quality: '320', cleanerMode: 'Advanced', pitch: 0 },
  targetAction = 'download',
  onPlayPreview,
  currentPreviewId
}: TrackSelectionListProps) {
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

  const [batchForm, setBatchForm] = useState({
    album: playlistTitle || '',
    artist: '',
    composer: '',
    pitch: '',
    year: '',
    genre: '',
    autoNumber: true
  });

  if (!tracks || tracks.length === 0) return null;

  const allSelected = tracks.length > 0 && selectedIds.length === tracks.length;
  const customCount = Object.keys(customMetadata).length;

  const handleApplyBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onBatchApplyMetadata) {
      onBatchApplyMetadata(batchForm);
    }
  };

  const getEffectiveTrackData = (track: TrackItem, index: number) => {
    const override = customMetadata[track.id] || {};
    const title = (override.title && override.title.trim()) ? override.title.trim() : track.cleanedTitle;
    const artist = (override.artist && override.artist.trim()) ? override.artist.trim() : (track.detectedArtist || track.channel || '');
    const composer = (override.composer !== undefined && override.composer.trim())
      ? override.composer.trim()
      : (track.composer || track.detectedComposer || '');
    const pitch = (override.pitch !== undefined && override.pitch !== '')
      ? override.pitch
      : (settings.pitch !== undefined ? settings.pitch : 0);
    const robloxHint = getRobloxNormalizationHint(pitch);
    const album = (override.album && override.album.trim()) ? override.album.trim() : (playlistTitle || title);
    const year = (override.year && override.year.trim()) ? override.year.trim() : '';
    const genre = (override.genre && override.genre.trim()) ? override.genre.trim() : '';
    const trackNumber = (override.trackNumber && override.trackNumber.trim()) ? override.trackNumber.trim() : (tracks.length > 1 ? String(index + 1) : '');

    const isCustom = !!(
      (override.title && override.title.trim() !== track.cleanedTitle) ||
      (override.artist && override.artist.trim() !== (track.detectedArtist || '')) ||
      (override.composer && override.composer.trim() !== (track.composer || track.detectedComposer || '')) ||
      (override.pitch !== undefined && override.pitch !== '' && String(override.pitch) !== String(settings.pitch || 0)) ||
      (override.album && override.album.trim()) ||
      (override.year && override.year.trim()) ||
      (override.genre && override.genre.trim()) ||
      (override.trackNumber && override.trackNumber.trim())
    );

    const safeArtist = artist ? artist.replace(/[/\\?%*:|"<>]/g, '').trim() : '';
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '').trim();
    const prefix = tracks.length > 1 ? `${String(index + 1).padStart(2, '0')}. ` : '';
    const base = safeArtist ? `${safeArtist} - ${safeTitle}` : safeTitle;
    const liveFilename = `${prefix}${base}.mp3`;

    return {
      title,
      artist,
      composer,
      pitch,
      robloxHint,
      album,
      year,
      genre,
      trackNumber,
      isCustom,
      liveFilename
    };
  };

  return (
    <div className="w-full music-card rounded-3xl p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Daftar Lagu Terdeteksi ({tracks.length})</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Periksa judul bersih, atur tag ID3, dan dengarkan pratinjau sebelum diproses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-toggle-metadata-editor"
            onClick={() => setShowMetadataEditor(!showMetadataEditor)}
            className={`btn-glass px-3.5 py-1.5 text-xs flex items-center gap-1.5 font-medium ${
              showMetadataEditor || customCount > 0
                ? 'bg-[#1ed760]/15 text-emerald-300 border-[#1ed760]/40'
                : ''
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit Tag Batch</span>
            {customCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#1ed760]/30 text-emerald-300 text-[10px] font-bold">
                {customCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="btn-glass px-3.5 py-1.5 text-xs text-neutral-300"
          >
            {allSelected ? 'Batal Pilih' : 'Pilih Semua'}
          </button>

          <button
            type="button"
            id="btn-process-selected"
            disabled={selectedIds.length === 0 || isStartingJob}
            onClick={onStartJob}
            className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer ${
              targetAction === 'roblox'
                ? 'bg-[#f59e0b] hover:bg-[#d97706] text-black shadow-lg shadow-[#f59e0b]/25'
                : 'btn-spotify'
            }`}
          >
            {targetAction === 'roblox' ? (
              <CloudUpload className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {targetAction === 'roblox'
                ? `Upload ke Roblox (${selectedIds.length})`
                : `Unduh Terpilih (${selectedIds.length})`}
            </span>
          </button>
        </div>
      </div>

      {showMetadataEditor && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#12131b] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white tracking-wide">
                Penerapan Metadata Sekaligus (Batch)
              </h4>
            </div>
            <p className="text-xs text-neutral-400">
              Otomatis mengisi tag yang sama ke {selectedIds.length} lagu yang sedang dicentang.
            </p>
          </div>

          <form onSubmit={handleApplyBatch} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 block font-medium">Nama Album</label>
                <input
                  type="text"
                  placeholder="Nama Album"
                  value={batchForm.album}
                  onChange={(e) => setBatchForm({ ...batchForm, album: e.target.value })}
                  className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 block font-medium">Artis / Penyanyi</label>
                <input
                  type="text"
                  placeholder="Nama Artis"
                  value={batchForm.artist}
                  onChange={(e) => setBatchForm({ ...batchForm, artist: e.target.value })}
                  className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 block font-medium">Pencipta (Composer)</label>
                <input
                  type="text"
                  placeholder="Contoh: Denny Caknan"
                  value={batchForm.composer}
                  onChange={(e) => setBatchForm({ ...batchForm, composer: e.target.value })}
                  className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 block font-medium">Pitch / Kecepatan</label>
                <select
                  value={batchForm.pitch}
                  onChange={(e) => setBatchForm({ ...batchForm, pitch: e.target.value })}
                  className="w-full music-input rounded-xl px-2.5 py-1.5 text-xs text-neutral-200"
                >
                  <option value="" className="bg-[#181922]">Ikuti Pengaturan Global</option>
                  <option value="0" className="bg-[#181922]">Normal (Nada Asli)</option>
                  <optgroup label="🎮 Roblox PlaybackSpeed" className="bg-[#181922]">
                    <option value="speed:1.25">Roblox 1.25x (Speed 0.800)</option>
                    <option value="speed:1.33">Roblox 1.33x (Speed 0.750)</option>
                    <option value="speed:1.50">Roblox 1.50x (Speed 0.667)</option>
                    <option value="speed:2.00">Roblox 2.00x (Speed 0.500)</option>
                    <option value="speed:0.80">Roblox 0.80x (Speed 1.250)</option>
                    <option value="speed:0.50">Roblox 0.50x (Speed 2.000)</option>
                  </optgroup>
                  <optgroup label="🎵 Semitone Pitch Shift" className="bg-[#181922]">
                    <option value="semitone:1">+1 Semitone (Octave 0.944)</option>
                    <option value="semitone:2">+2 Semitones (Octave 0.891)</option>
                    <option value="semitone:3">+3 Semitones (Octave 0.841)</option>
                    <option value="semitone:4">+4 Semitones (Octave 0.794)</option>
                    <option value="semitone:6">+6 Semitones (Octave 0.707)</option>
                    <option value="semitone:12">+12 Semitones (Octave 0.500)</option>
                    <option value="semitone:-1">-1 Semitone (Octave 1.059)</option>
                    <option value="semitone:-2">-2 Semitones (Octave 1.122)</option>
                    <option value="semitone:-3">-3 Semitones (Octave 1.189)</option>
                    <option value="semitone:-6">-6 Semitones (Octave 1.414)</option>
                    <option value="semitone:-12">-12 Semitones (Octave 2.000)</option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 block font-medium">Tahun</label>
                <input
                  type="text"
                  placeholder="2026"
                  value={batchForm.year}
                  onChange={(e) => setBatchForm({ ...batchForm, year: e.target.value })}
                  className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 block font-medium">Genre</label>
                <input
                  type="text"
                  placeholder="Pop / Dangdut"
                  value={batchForm.genre}
                  onChange={(e) => setBatchForm({ ...batchForm, genre: e.target.value })}
                  className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-neutral-500 mr-1">Rekomendasi Genre:</span>
              {COMMON_GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBatchForm({ ...batchForm, genre: g })}
                  className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 border border-white/[0.06] transition"
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/[0.06]">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchForm.autoNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, autoNumber: e.target.checked })}
                  className="rounded border-white/20 text-[#1ed760] focus:ring-0 bg-[#0d0e12]"
                />
                <span>Urutkan nomor trek otomatis (Track 1..N)</span>
              </label>

              <div className="flex items-center gap-2">
                {customCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAllMetadata}
                    className="btn-glass px-3.5 py-1.5 text-xs text-rose-300 hover:text-rose-200 border-rose-500/30 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Semua Tag</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={selectedIds.length === 0}
                  className="btn-spotify px-4 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terapkan ke {selectedIds.length} Lagu</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {tracks.map((track, index) => {
          const isSelected = selectedIds.includes(track.id);
          const isExpanded = expandedTrackId === track.id;
          const effective = getEffectiveTrackData(track, index);
          const override = customMetadata[track.id] || {};

          return (
            <div
              key={track.id}
              className={`rounded-2xl border transition flex flex-col ${
                isSelected
                  ? 'bg-white/[0.04] border-white/[0.12]'
                  : 'bg-white/[0.015] border-white/[0.04] opacity-75 hover:opacity-100'
              }`}
            >
              <div
                onClick={() => onToggleSelect(track.id)}
                className="p-3.5 flex items-center gap-3.5 cursor-pointer"
              >
                <button
                  type="button"
                  className="text-neutral-400 hover:text-white shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(track.id);
                  }}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-[#1ed760]" />
                  ) : (
                    <Square className="w-5 h-5 text-neutral-600" />
                  )}
                </button>

                <div className="relative w-12 h-12 rounded-xl bg-[#14151e] shrink-0 border border-white/[0.08] overflow-hidden group shadow-md shadow-black/40">
                  {track.thumbnail ? (
                    <img
                      src={track.thumbnail}
                      alt={track.originalTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <Music className="w-5 h-5" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPlayPreview) onPlayPreview(track);
                    }}
                    className={`absolute inset-0 flex items-center justify-center transition ${
                      currentPreviewId === track.id
                        ? 'bg-emerald-600/90 text-white'
                        : 'bg-black/60 opacity-0 group-hover:opacity-100 text-white'
                    }`}
                    title={currentPreviewId === track.id ? "Jeda Audio" : "Putar Pratinjau Lagu"}
                  >
                    {currentPreviewId === track.id ? (
                      <Volume2 className="w-5 h-5 text-white animate-pulse" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-neutral-500 font-semibold">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-semibold text-white tracking-tight truncate">
                      {effective.title}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPlayPreview) onPlayPreview(track);
                      }}
                      className={`music-pill transition ${
                        currentPreviewId === track.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/[0.05] text-neutral-400 hover:text-white border border-white/[0.08]'
                      }`}
                    >
                      {currentPreviewId === track.id ? (
                        <>
                          <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span>Diputar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Dengarkan</span>
                        </>
                      )}
                    </button>

                    {track.detectedVersion && (
                      <span className="music-pill bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                        {track.detectedVersion}
                      </span>
                    )}

                    {effective.isCustom && (
                      <span className="music-pill bg-[#1ed760]/15 text-emerald-300 border border-[#1ed760]/30">
                        Tag Khusus
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-400 truncate flex items-center gap-2 flex-wrap">
                    {effective.artist && (
                      <span>Artis: <strong className="text-neutral-200">{effective.artist}</strong></span>
                    )}
                    {effective.composer && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <PenTool className="w-3 h-3" />
                        <span>Cipt: {effective.composer}</span>
                      </span>
                    )}
                    {effective.album && (
                      <span className="text-neutral-500">&bull; {effective.album}</span>
                    )}
                    {effective.robloxHint ? (
                      <span className="music-pill bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        🎮 {effective.robloxHint.text}
                      </span>
                    ) : (effective.pitch && effective.pitch !== '0' && effective.pitch !== 0) ? (
                      <span className="music-pill bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Pitch: {effective.pitch}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-neutral-500 truncate">
                    Nama file: {effective.liveFilename}
                  </p>
                </div>

                {track.durationSec && track.durationSec > 0 && (
                  <div className="text-xs text-neutral-500 flex items-center gap-1 shrink-0 hidden sm:flex">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {Math.floor(track.durationSec / 60)}:{String(track.durationSec % 60).padStart(2, '0')}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {effective.isCustom && (
                    <button
                      type="button"
                      title="Kembalikan metadata ke otomatis"
                      onClick={() => onResetMetadata(track.id)}
                      className="p-1.5 rounded-full btn-glass text-neutral-400 hover:text-rose-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    id={`btn-edit-track-${track.id}`}
                    onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
                    className={`btn-glass px-3 py-1 text-xs flex items-center gap-1 ${
                      isExpanded
                        ? 'bg-[#1ed760] text-black border-[#1ed760] font-bold'
                        : ''
                    }`}
                  >
                    <span>{isExpanded ? 'Tutup' : 'Ubah Tag'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div
                  className="px-5 pb-5 pt-3 border-t border-white/[0.08] bg-[#10111a] space-y-3.5 rounded-b-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                    <span className="text-xs font-semibold text-neutral-200">
                      Ubah Tag Metadata Lagu #{index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedTrackId(null)}
                      className="text-neutral-400 hover:text-white text-xs font-medium"
                    >
                      Selesai
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-neutral-400 block font-medium">Judul Lagu</label>
                      <input
                        type="text"
                        value={override.title !== undefined ? override.title : track.cleanedTitle}
                        onChange={(e) => onUpdateMetadata(track.id, { title: e.target.value })}
                        className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 block font-medium">Artis / Penyanyi</label>
                      <input
                        type="text"
                        value={override.artist !== undefined ? override.artist : (track.detectedArtist || track.channel || '')}
                        onChange={(e) => onUpdateMetadata(track.id, { artist: e.target.value })}
                        className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 block font-medium">Pencipta (Composer)</label>
                      <input
                        type="text"
                        value={override.composer !== undefined ? override.composer : (track.composer || track.detectedComposer || '')}
                        onChange={(e) => onUpdateMetadata(track.id, { composer: e.target.value })}
                        placeholder="Contoh: Denny Caknan"
                        className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 block font-medium">Nama Album</label>
                      <input
                        type="text"
                        value={override.album !== undefined ? override.album : (playlistTitle || track.cleanedTitle)}
                        onChange={(e) => onUpdateMetadata(track.id, { album: e.target.value })}
                        className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 block font-medium">Tahun</label>
                      <input
                        type="text"
                        value={override.year || ''}
                        onChange={(e) => onUpdateMetadata(track.id, { year: e.target.value })}
                        placeholder="2026"
                        className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 block font-medium">Genre</label>
                      <input
                        type="text"
                        value={override.genre || ''}
                        onChange={(e) => onUpdateMetadata(track.id, { genre: e.target.value })}
                        className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 block font-medium">Pitch / Roblox</label>
                      <select
                        value={override.pitch !== undefined ? String(override.pitch) : (settings.pitch !== undefined ? String(settings.pitch) : '0')}
                        onChange={(e) => onUpdateMetadata(track.id, { pitch: e.target.value })}
                        className="w-full music-input rounded-xl px-2.5 py-1.5 text-xs text-neutral-200"
                      >
                        <option value="0" className="bg-[#181922]">Normal (Nada Asli)</option>
                        <optgroup label="🎮 Roblox PlaybackSpeed" className="bg-[#181922]">
                          <option value="speed:1.25">Roblox 1.25x (Speed 0.800)</option>
                          <option value="speed:1.33">Roblox 1.33x (Speed 0.750)</option>
                          <option value="speed:1.50">Roblox 1.50x (Speed 0.667)</option>
                          <option value="speed:2.00">Roblox 2.00x (Speed 0.500)</option>
                          <option value="speed:0.80">Roblox 0.80x (Speed 1.250)</option>
                          <option value="speed:0.50">Roblox 0.50x (Speed 2.000)</option>
                        </optgroup>
                        <optgroup label="🎵 Semitone Pitch Shift" className="bg-[#181922]">
                          <option value="semitone:1">+1 Semitone (Octave 0.944)</option>
                          <option value="semitone:2">+2 Semitones (Octave 0.891)</option>
                          <option value="semitone:3">+3 Semitones (Octave 0.841)</option>
                          <option value="semitone:4">+4 Semitones (Octave 0.794)</option>
                          <option value="semitone:6">+6 Semitones (Octave 0.707)</option>
                          <option value="semitone:12">+12 Semitones (Octave 0.500)</option>
                          <option value="semitone:-1">-1 Semitone (Octave 1.059)</option>
                          <option value="semitone:-2">-2 Semitones (Octave 1.122)</option>
                          <option value="semitone:-3">-3 Semitones (Octave 1.189)</option>
                          <option value="semitone:-6">-6 Semitones (Octave 1.414)</option>
                          <option value="semitone:-12">-12 Semitones (Octave 2.000)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 block font-medium">Nomor Trek</label>
                      <input
                        type="text"
                        value={override.trackNumber !== undefined ? override.trackNumber : String(index + 1)}
                        onChange={(e) => onUpdateMetadata(track.id, { trackNumber: e.target.value })}
                        className="w-full music-input rounded-xl px-3 py-1.5 text-xs text-neutral-100"
                      />
                    </div>
                  </div>

                  {effective.robloxHint && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                      <span>Kode Luau Roblox: </span>
                      <code className="text-white font-mono bg-black/40 px-2 py-0.5 rounded">{effective.robloxHint.code}</code>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onResetMetadata(track.id)}
                      className="text-xs text-neutral-400 hover:text-rose-300 flex items-center gap-1.5 font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Kembalikan ke Nilai Otomatis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedTrackId(null)}
                      className="btn-spotify px-4 py-1 text-xs"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
