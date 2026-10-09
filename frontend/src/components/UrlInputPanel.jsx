'use client';

import React, { useState } from 'react';
import { Search, Settings2, Sliders, Wand2, Loader2 } from 'lucide-react';

export default function UrlInputPanel({ onAnalyze, isLoading, settings, setSettings }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <div className="w-full glass-card rounded-2xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
      {/* Decorative Gradient Flare */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Target URL (Track, Playlist, or Mix)
          </label>
          <div className="relative flex items-center">
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube track, playlist, or mix URL (e.g. https://www.youtube.com/watch?v=...)"
              className="w-full bg-gray-900/80 border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="absolute right-2.5 px-5 py-2 rounded-lg gradient-bg text-white font-medium text-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audio Format & Processing Options Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5">
          {/* Format Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audio Format</span>
            </label>
            <select
              value={settings.format}
              onChange={(e) => setSettings({ ...settings, format: e.target.value })}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="mp3">MP3 Audio (.mp3)</option>
              <option value="original">Original Format</option>
            </select>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audio Quality</span>
            </label>
            <select
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: e.target.value })}
              disabled={settings.format !== 'mp3'}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="320">320 kbps (High Quality)</option>
              <option value="256">256 kbps (Standard High)</option>
              <option value="192">192 kbps (Balanced)</option>
              <option value="128">128 kbps (Compact)</option>
              <option value="best">Best Available Source</option>
            </select>
          </div>

          {/* Title Cleaner Mode */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Cleaner Mode</span>
            </label>
            <select
              value={settings.cleanerMode}
              onChange={(e) => setSettings({ ...settings, cleanerMode: e.target.value })}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Advanced">Advanced Cleaner (Recommended)</option>
              <option value="Standard">Standard Cleaner</option>
              <option value="Custom">Custom Rules</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
