'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UrlInputPanel from '../components/UrlInputPanel';
import PreviewCard from '../components/PreviewCard';
import TrackSelectionList from '../components/TrackSelectionList';
import JobProgressCard from '../components/JobProgressCard';
import Footer from '../components/Footer';
import { AlertCircle } from 'lucide-react';

function getNormalizedApiUrl() {
  // In development (npm run dev), frontend runs on :3000 and backend on :5000
  // In production (single-host Koyeb), both are served from the same server
  if (process.env.NEXT_PUBLIC_API_URL) {
    let rawUrl = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    if (!rawUrl.endsWith('/api')) rawUrl = `${rawUrl}/api`;
    return rawUrl;
  }
  // Auto-detect: if running in browser on port 3000, point to backend port 5000
  if (typeof window !== 'undefined' && window.location.port === '3000') {
    return 'http://localhost:5000/api';
  }
  // Production single-host: use relative path
  return '/api';
}

async function apiFetch(endpoint, options = {}) {
  const url = `${getNormalizedApiUrl()}${endpoint}`;
  return fetch(url, options);
}

export default function Home() {
  const [settings, setSettings] = useState({
    format: 'mp3',
    quality: '320',
    cleanerMode: 'Advanced'
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isStartingJob, setIsStartingJob] = useState(false);
  const [activeJob, setActiveJob] = useState(null);

  // Re-run cleaner preview when cleanerMode changes
  useEffect(() => {
    if (analysisResult && analysisResult.url) {
      handleAnalyzeUrl(analysisResult.url);
    }
  }, [settings.cleanerMode]);

  const handleAnalyzeUrl = async (url) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const res = await apiFetch(`/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cleanerMode: settings.cleanerMode })
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to analyze URL');
      }

      setAnalysisResult({ ...json.data, url });
      // Default select all discovered tracks
      setSelectedTrackIds((json.data.tracks || []).map(t => t.id));

    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while analyzing the target URL.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleSelectTrack = (trackId) => {
    if (selectedTrackIds.includes(trackId)) {
      setSelectedTrackIds(selectedTrackIds.filter(id => id !== trackId));
    } else {
      setSelectedTrackIds([...selectedTrackIds, trackId]);
    }
  };

  const handleSelectAll = () => {
    if (analysisResult) {
      setSelectedTrackIds(analysisResult.tracks.map(t => t.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedTrackIds([]);
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
          url: analysisResult.url,
          format: settings.format,
          quality: settings.quality,
          cleanerMode: settings.cleanerMode,
          selectedTrackIds
        })
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to start processing job');
      }

      const jobId = json.data.jobId;
      connectSseStream(jobId);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to start processing job.');
    } finally {
      setIsStartingJob(false);
    }
  };

  const connectSseStream = (jobId) => {
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
        console.error('SSE JSON parse error:', e);
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
      console.error('Cancel job error:', e);
    }
  };

  const handleDownloadTrack = (trackId) => {
    if (!activeJob) return;
    window.open(`${getNormalizedApiUrl()}/files/${activeJob.id}/track/${trackId}`, '_blank');
  };

  const handleDownloadZip = () => {
    if (!activeJob) return;
    window.open(`${getNormalizedApiUrl()}/files/${activeJob.id}/zip`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-gray-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-3 pt-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            High-Performance <span className="gradient-text">Music Downloader</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
            Analyze track metadata, choose audio quality, automatically clean promotional titles, and export individual files or streaming ZIP archives.
          </p>
        </div>

        {/* URL Input Form */}
        <UrlInputPanel
          onAnalyze={handleAnalyzeUrl}
          isLoading={isAnalyzing}
          settings={settings}
          setSettings={setSettings}
        />

        {/* Error Alert */}
        {errorMsg && (
          <div className="w-full glass-card rounded-2xl p-4 border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Metadata Preview */}
        {analysisResult && (
          <PreviewCard metadata={analysisResult} />
        )}

        {/* Track Selection & Cleaner Preview */}
        {analysisResult && analysisResult.tracks && (
          <TrackSelectionList
            tracks={analysisResult.tracks}
            selectedIds={selectedTrackIds}
            onToggleSelect={handleToggleSelectTrack}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onStartJob={handleStartJob}
            isStartingJob={isStartingJob}
          />
        )}

        {/* Active Job Progress Queue */}
        {activeJob && (
          <JobProgressCard
            job={activeJob}
            onCancelJob={handleCancelJob}
            onDownloadTrack={handleDownloadTrack}
            onDownloadZip={handleDownloadZip}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
