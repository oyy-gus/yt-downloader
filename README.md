# 🎵 Maxistrong YouTube Music Downloader & Title Cleaner

Aplikasi web modern berkinerja tinggi untuk menganalisis, membersihkan judul lagu secara otomatis dari tag promosi/viral, dan mengunduh musik dari YouTube/Playlist dalam format MP3 berkualitas tinggi (hingga 320kbps) atau arsip ZIP streaming.

---

## 🌟 Fitur Utama

- **🧹 Title Cleaner Engine Canggih**:
  - Menghapus spam promosi (misal: `REMIX TIKTOK 2024`, `VIRAL TIKTOK`, `FULL BASS NONSTOP`, `TERBARU2026`, `|| DJ`, `- B24`).
  - Menjaga label versi resmi lagu (misal: `(Remix)`, `(DJ Remix)`).
  - Mode **Standard** & **Advanced** (`Artis - Judul Lagu (Versi)`).
- **🚀 YouTube Data API v3 + Multi-Fallback Engine**:
  - Integrasi resmi YouTube Data API v3 untuk analisis playlist super cepat.
  - Penanganan bot challenge otomatis via Node JS Runtime & solver JS remote (`ejs:github`).
  - **Automatic Search Fallback**: Jika lagu di playlist YouTube bernilai *Video Unavailable* / dihapus uploader, sistem secara otomatis mencari versi aktif dari lagu tersebut di YouTube.
- **⚡ Konversi Audio FFmpeg & ZIP Export**:
  - Konversi MP3 (320kbps, 256kbps, 192kbps, 128kbps) atau format *Original Audio*.
  - Penyusunan ID3 Metadata (Title, Artist, Album, Thumbnail).
  - Ekspor berkas ZIP otomatis untuk batch playlist.
- **💎 Antarmuka Modern**:
  - Dibuat dengan **Next.js 16 + React 19 + TailwindCSS**.
  - Desain *Dark Mode Glassmorphism* yang responsif & animasi mikro.

---

## 📁 Struktur Proyek

```text
youtube-downloader/
├── backend/                  # Server Node.js (Express API)
│   ├── src/
│   │   ├── cleaner/          # Title Cleaner Engine Logic
│   │   ├── controllers/      # Route Controllers (Analyze, Jobs, Files)
│   │   ├── providers/        # YouTube Provider & API v3 Adapter
│   │   ├── queue/            # Job Queue & SSE Event Stream
│   │   ├── services/         # ZIP Compression Service
│   │   ├── storage/          # Temp Storage Manager
│   │   └── utils/            # FFmpeg & yt-dlp Audio Conversion Helper
│   ├── .env                  # Konfigurasi Environment Backend
│   ├── Dockerfile            # Dockerfile untuk Deployment Koyeb/Cloud
│   └── package.json
├── frontend/                 # Aplikasi Web Client (Next.js)
│   ├── src/
│   │   ├── app/              # Next.js App Router & Layout
│   │   └── components/       # UI Components (UrlInput, Preview, JobProgress)
│   ├── package.json
│   └── next.config.mjs
└── README.md
```

---

## 💻 Panduan Instalasi & Penggunaan Lokal

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
- **Node.js** (v20 atau v22+)
- **FFmpeg** & **yt-dlp**
- **Python 3** (opsional)

### 2. Instalasi Backend
```bash
cd backend
npm install
```

Buat file `backend/.env` (atau salin dari `.env.example`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DEV_MOCK_MODE=false
YOUTUBE_API_KEY=               # Opsional: Masukkan API Key YouTube Data API v3
COOKIES_FROM_BROWSER=          # Opsional: edge, chrome, atau firefox
```

### 3. Menyiapkan YouTube Cookies (Opsional tetapi Direkomendasikan)
Jika pengunduhan stream media dibatasi oleh verifikasi bot YouTube:
1. Pasang ekstensi **Get cookies.txt LOCALLY** di browser Anda.
2. Buka [youtube.com](https://www.youtube.com) (posisi ter-login).
3. Klik ekstensi -> Klik **Export**.
4. Simpan berkas hasil ekspor ke `backend/cookies.txt`.

### 4. Instalasi Frontend
```bash
cd ../frontend
npm install
```

### 5. Jalankan Aplikasi di Lokal

**Jalankan Backend Server (Port 5000):**
```bash
cd backend
npm start
```

**Jalankan Frontend Dev Server (Port 3000):**
```bash
cd frontend
npm run dev
```

Buka browser Anda di `http://localhost:3000`.

---

## ☁️ Panduan Deploy ke Cloud (Vercel + Koyeb)

Kombinasi **Vercel** (Frontend) + **Koyeb** (Backend) adalah pilihan terbaik dan 100% gratis.

### 🔴 Step 1: Deploy Backend ke Koyeb

1. Login / Buat akun di [Koyeb](https://www.koyeb.com).
2. Klik **Create App** / **Create Web Service**.
3. Hubungkan repositori GitHub Anda: `oyy-gus/youtube-downloader`.
4. Konfigurasi Deployment:
   - **Builder Type**: `Dockerfile`
   - **Work Directory**: `backend`
5. Masukkan **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://nama-app-anda.vercel.app` (URL Vercel Anda)
   - `YOUTUBE_API_KEY`: *(opsional API Key)*
6. Klik **Deploy**. Koyeb akan membangun Docker container yang berisi Node.js, FFmpeg, dan yt-dlp secara otomatis.
7. Salin URL Backend publik yang diberikan oleh Koyeb (contoh: `https://youtube-downloader-backend-xxxx.koyeb.app`).

### 🔵 Step 2: Deploy Frontend ke Vercel

1. Login / Buat akun di [Vercel](https://vercel.com).
2. Klik **Add New Project** -> Impor repositori GitHub `oyy-gus/youtube-downloader`.
3. Konfigurasi Project:
   - **Root Directory**: `frontend`
4. Masukkan **Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: `https://youtube-downloader-backend-xxxx.koyeb.app/api` *(Gunakan URL Koyeb Backend Anda)*
5. Klik **Deploy**. Situs web Anda aktif secara publik dalam 1-2 menit!

---

## 🛠️ API Reference (Endpoints)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck status server |
| `POST` | `/api/analyze` | Menganalisis URL playlist/video & menghasilkan preview judul clean |
| `POST` | `/api/jobs` | Membuat job antrean pengunduhan/konversi audio |
| `GET` | `/api/jobs/:jobId` | Mengambil status & kemajuan job |
| `GET` | `/api/jobs/:jobId/events` | Stream Server-Sent Events (SSE) untuk progress real-time |
| `GET` | `/api/files/:jobId/zip` | Mengunduh arsip ZIP playlist |
| `GET` | `/api/files/:jobId/track/:trackId` | Mengunduh satu berkas MP3 lagu |

---

## 📄 Lisensi
[MIT License](LICENSE) - Bebas digunakan dan dikembangkan.
