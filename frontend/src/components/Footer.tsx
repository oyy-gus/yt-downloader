'use client';

import React from 'react';
import { Heart, Music } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.07] bg-[#0c0d12]/90 mt-20 py-10 px-4 sm:px-8 text-neutral-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <div className="w-6 h-6 rounded-lg bg-[#1ed760]/20 flex items-center justify-center text-[#1ed760]">
            <Music className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="font-bold text-white">Maxistrong Music Studio</span>
          <span>&bull;</span>
          <span>Pengunduh & Pembersih Judul Audio</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span>Kualitas 320 kbps</span>
          <span>&bull;</span>
          <span>Tag ID3v2</span>
          <span>&bull;</span>
          <span>Roblox Open Cloud</span>
        </div>
      </div>

      <p className="max-w-3xl mx-auto text-center text-xs text-neutral-500 mt-4 leading-relaxed">
        Gunakan aplikasi ini hanya untuk konten musik yang Anda miliki lisensinya atau berada dalam domain publik. Maxistrong menghormati hak cipta kreator dan ketentuan platform.
      </p>
    </footer>
  );
}
