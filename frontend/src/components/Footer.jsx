'use client';

import React from 'react';
import { ShieldCheck, Cpu, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 glass-card mt-16 py-8 px-4 lg:px-8 text-center text-xs text-gray-500 space-y-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-300">Maxistrong Music Processing</span>
          <span>•</span>
          <span>Production-Ready Web Application</span>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Node.js & Next.js</span>
          </div>
          <div className="flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Title Cleaner Engine</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SSRF Protected</span>
          </div>
        </div>
      </div>

      <p className="max-w-3xl mx-auto text-[11px] text-gray-600 leading-relaxed">
        Only process audio that you own, are licensed to download, is in the public domain, or is explicitly permitted to be downloaded.
        Maxistrong respects terms of service and access restrictions.
      </p>
    </footer>
  );
}
