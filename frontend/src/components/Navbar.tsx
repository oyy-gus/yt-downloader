'use client';

import React from 'react';
import { Music, Sparkles, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0c0d12]/80 backdrop-blur-2xl border-b border-white/[0.07] px-4 sm:px-8 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1ed760] to-[#10b981] flex items-center justify-center text-black shadow-lg shadow-[#1ed760]/20">
            <Music className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                Maxistrong
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Studio Audio & Music Downloader
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-neutral-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SSRF Protected</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/25 text-xs text-emerald-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#1ed760]" />
            <span>Title Cleaner Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
}
