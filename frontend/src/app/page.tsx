'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UrlInputPanel from '../components/UrlInputPanel';
import PreviewCard from '../components/PreviewCard';
import TrackSelectionList from '../components/TrackSelectionList';
import JobProgressCard from '../components/JobProgressCard';
import AudioPreviewPlayer from '../components/AudioPreviewPlayer';
import Footer from '../components/Footer';
import { AlertCircle, Sparkles } from 'lucide-react';
import type { AudioSettings, AnalysisData, JobProgressData, TrackItem, TrackOverride, TargetAction, RobloxConfig } from '../types/index.js';

function getNormalizedApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    let rawUrl = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    if (!rawUrl.endsWith('/api')) rawUrl = `${rawUrl}/api`;
    return rawUrl;
  }
  if (typeof window !== 'undefined' && window.location.port === '3000') {
    return 'http://localhost:5000/api';
  }
  return '/api';
}

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${getNormalizedApiUrl()}${endpoint}`;
  return fetch(url, options);
}

export default function Home() {
  const [settings, setSettings] = useState<AudioSettings>({
    format: 'mp3',
    quality: '320',
    cleanerMode: 'Advanced',
    pitch: 0
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isStartingJob, setIsStartingJob] = useState(false);
  const [activeJob, setActiveJob] = useState<JobProgressData | null>(null);
  const [customMetadata, setCustomMetadata] = useState<Record<string, TrackOverride>>({});
  const [previewTrack, setPreviewTrack] = useState<TrackItem | null>(null);
  const [targetAction, setTargetAction] = useState<TargetAction>('download');
  const [robloxConfig, setRobloxConfig] = useState<RobloxConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('maxistrong_roblox_config');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {}
    }
    return {
      apiKey: '',
      creatorId: '',
      creatorType: 'user'
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && robloxConfig) {
      try {
        localStorage.setItem('maxistrong_roblox_config', JSON.stringify(robloxConfig));
      } catch {}
    }
  }, [robloxConfig]);

  const handleAnalyzeUrl = async (url: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);
    setCustomMetadata({});

    try {
      const res = await apiFetch(`/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cleanerMode: settings.cleanerMode })
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Gagal menganalisis URL.');
      }

      setAnalysisResult({ ...json.data, url });
      setSelectedTrackIds((json.data.tracks || []).map((t: TrackItem) => t.id));

    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memeriksa URL.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleSelectTrack = (trackId: string) => {
    if (selectedTrackIds.includes(trackId)) {
      setSelectedTrackIds(selectedTrackIds.filter(id => id !== trackId));
    } else {
      setSelectedTrackIds([...selectedTrackIds, trackId]);
    }
  };

  const handleSelectAll = () => {
    if (analysisResult?.tracks) {
      setSelectedTrackIds(analysisResult.tracks.map(t => t.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedTrackIds([]);
  };

  const handleUpdateTrackMetadata = (trackId: string, values: Partial<TrackOverride>) => {
    setCustomMetadata(prev => ({
      ...prev,
      [trackId]: {
        ...(prev[trackId] || {}),
        ...values
      }
    }));
  };

  const handleResetTrackMetadata = (trackId: string) => {
    setCustomMetadata(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
  };

  const handleBatchApplyMetadata = (batchData: any) => {
    if (!analysisResult?.tracks) return;
    setCustomMetadata(prev => {
      const next = { ...prev };
      selectedTrackIds.forEach((id, index) => {
        const existing = next[id] || {};
        next[id] = {
          ...existing,
          ...(batchData.album ? { album: batchData.album } : {}),
          ...(batchData.artist ? { artist: batchData.artist } : {}),
          ...(batchData.composer ? { composer: batchData.composer } : {}),
          ...(batchData.pitch !== undefined && batchData.pitch !== '' ? { pitch: batchData.pitch } : {}),
          ...(batchData.year ? { year: batchData.year } : {}),
          ...(batchData.genre ? { genre: batchData.genre } : {}),
          ...(batchData.autoNumber ? { trackNumber: String(index + 1) } : {})
        };
      });
      return next;
    });
  };

  const handleResetAllMetadata = () => {
    setCustomMetadata({});
  };

  const handleStartJob = async () => {
    if (!analysisResult || selectedTrackIds.length === 0) return;

    setIsStartingJob(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch(`/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: (analysisResult as any).url,
          format: settings.format,
          quality: settings.quality,
          cleanerMode: settings.cleanerMode,
          pitch: settings.pitch,
          targetAction,
          robloxConfig: targetAction === 'roblox' ? robloxConfig : undefined,
          selectedTrackIds,
          customMetadata: Object.keys(customMetadata).length > 0 ? customMetadata : undefined
        })
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Gagal memulai proses unduhan');
      }

      const jobId = json.data.jobId;
      connectSseStream(jobId);

    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses lagu.');
    } finally {
      setIsStartingJob(false);
    }
  };

  const connectSseStream = (jobId: string) => {
    const eventSource = new EventSource(`${getNormalizedApiUrl()}/jobs/${jobId}/events`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.job) {
          setActiveJob(payload.job);

          if (['completed', 'failed', 'cancelled'].includes(payload.job.status)) {
            eventSource.close();
          }
        }
      } catch (e) {
        console.error('SSE error:', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  const handleCancelJob = async () => {
    if (!activeJob) return;
    try {
      await fetch(`${getNormalizedApiUrl()}/jobs/${activeJob.id}/cancel`, { method: 'POST' });
    } catch (e) {
      console.error('Cancel error:', e);
    }
  };

  const handleDownloadTrack = (trackId: string) => {
    if (!activeJob) return;
    window.open(`${getNormalizedApiUrl()}/files/${activeJob.id}/track/${trackId}`, '_blank');
  };

  const handleDownloadZip = () => {
    if (!activeJob) return;
    window.open(`${getNormalizedApiUrl()}/files/${activeJob.id}/zip`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d12] text-white font-sans antialiased selection:bg-[#1ed760] selection:text-black relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#1ed760]/10 via-[#10b981]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-7">
        <div className="text-center space-y-3 pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-[#1ed760]" />
            <span>Pembersih Judul & Tag Musik Otomatis</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Unduh Musik Bersih & Kualitas Tinggi
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Hapus teks promosi pada judul otomatis, atur nada & pitch sinkronisasi Roblox, dengarkan pratinjau audio, dan unduh MP3 atau kirim langsung ke cloud.
          </p>
        </div>

        <UrlInputPanel
          onAnalyze={handleAnalyzeUrl}
          isLoading={isAnalyzing}
          settings={settings}
          setSettings={setSettings}
          targetAction={targetAction}
          setTargetAction={setTargetAction}
          robloxConfig={robloxConfig}
          setRobloxConfig={setRobloxConfig}
        />

        {errorMsg && (
          <div className="w-full rounded-2xl p-4 border border-rose-500/30 bg-rose-500/10 text-rose-200 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {analysisResult && (
          <PreviewCard metadata={analysisResult} />
        )}

        {analysisResult && analysisResult.tracks && (
          <TrackSelectionList
            tracks={analysisResult.tracks}
            selectedIds={selectedTrackIds}
            onToggleSelect={handleToggleSelectTrack}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onStartJob={handleStartJob}
            isStartingJob={isStartingJob}
            customMetadata={customMetadata}
            onUpdateMetadata={handleUpdateTrackMetadata}
            onResetMetadata={handleResetTrackMetadata}
            onBatchApplyMetadata={handleBatchApplyMetadata}
            onResetAllMetadata={handleResetAllMetadata}
            playlistTitle={analysisResult.title || ''}
            settings={settings}
            targetAction={targetAction}
            onPlayPreview={(track) => setPreviewTrack(prev => (prev?.id === track.id ? null : track))}
            currentPreviewId={previewTrack?.id}
          />
        )}

        {activeJob && (
          <JobProgressCard
            job={activeJob}
            onCancelJob={handleCancelJob}
            onDownloadTrack={handleDownloadTrack}
            onDownloadZip={handleDownloadZip}
          />
        )}
      </main>

      {previewTrack && (
        <AudioPreviewPlayer
          track={previewTrack}
          initialPitch={settings.pitch}
          onClose={() => setPreviewTrack(null)}
        />
      )}

      <Footer />
    </div>
  );
}
