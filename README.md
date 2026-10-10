# 🎵 Maxistrong YouTube Music Downloader & Title Cleaner

Aplikasi web modern berkinerja tinggi untuk menganalisis metadata lagu/playlist YouTube, membersihkan judul dari spam promosi/viral secara otomatis, dan mengunduh audio berkualitas tinggi (MP3 320kbps atau Original Audio) baik dalam berkas individu maupun arsip streaming ZIP.

---

## 🌟 Fitur Utama

- **🧹 Title Cleaner Engine Canggih**:
  - Menghapus spam promosi (misal: `REMIX TIKTOK 2024`, `VIRAL TIKTOK`, `FULL BASS NONSTOP`, `TERBARU2026`, `|| DJ`, `- B24`).
  - Menjaga label versi resmi lagu (misal: `(Remix)`, `(DJ Remix)`).
  - Mode **Standard** & **Advanced** (`Artis - Judul Lagu (Versi)`).
- **🚀 Multi-Fallback Extraction Engine**:
  - Integrasi YouTube Data API v3 untuk ekstraksi playlist super cepat.
  - Penanganan bot challenge otomatis via Node.js runtime & JS remote solver (`ejs:github`).
  - **Automatic Search Fallback**: Jika lagu di playlist bernilai *Video Unavailable* / dihapus, sistem otomatis mencari versi aktif dari lagu tersebut.
- **⚡ Konversi Audio FFmpeg & ZIP Export**:
  - Konversi MP3 (320kbps, 256kbps, 192kbps, 128kbps) atau format *Original Audio*.
  - Embedding ID3 Metadata (Title, Artist, Album, Thumbnail).
  - Ekspor berkas ZIP otomatis untuk batch playlist.
- **📦 Single-Host Ready**:
  - Deploy seluruh aplikasi (Frontend Next.js + Express API) di **1 server / 1 URL** di Koyeb tanpa masalah CORS.
  - Auto-deteksi lingkungan: di localhost dev, API dipanggil ke `localhost:5000`; di produksi, menggunakan path relatif `/api`.

---

## 💻 Panduan Instalasi & Penggunaan di Localhost

### 1. Prasyarat Sistem

Pastikan sudah terpasang:
- **Node.js** (v20 atau v22+)
- **FFmpeg** (konversi & ID3 metadata audio)
- **yt-dlp** (ekstraksi stream media YouTube)
- **Python 3** (dibutuhkan oleh yt-dlp)

---

### 2. Cara Memasang FFmpeg & yt-dlp

#### ✅ Opsi A — Via PIP (Termudah, PATH otomatis diatur)

Buka Terminal / PowerShell:
```powershell
pip install yt-dlp
pip install ffmpeg-downloader
ffdl install
```

> Tidak perlu mengatur PATH Windows secara manual. Setelah `pip install`, kedua perintah `yt-dlp` dan `ffmpeg` langsung dikenali oleh sistem.

#### 📁 Opsi B — Taruh `.exe` Langsung di Folder `backend/`

1. Unduh [`yt-dlp.exe`](https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe)
2. Unduh [`ffmpeg.exe` + `ffprobe.exe`](https://github.com/BtbN/FFmpeg-Builds/releases) (pilih `ffmpeg-n*-win64-gpl.zip`, ekstrak folder `bin/`)
3. Taruh `yt-dlp.exe`, `ffmpeg.exe`, dan `ffprobe.exe` langsung di dalam folder `backend/`:

```text
youtube-downloader/
└── backend/
    ├── ffmpeg.exe      ← taruh di sini
    ├── ffprobe.exe     ← taruh di sini
    ├── yt-dlp.exe      ← taruh di sini
    └── src/
```

> Aplikasi secara otomatis mendeteksi file `.exe` di folder `backend/` tanpa perlu mengatur PATH Windows.

---

### 3. Instalasi Proyek

#### A. Kloning Repositori
```bash
git clone https://github.com/oyy-gus/youtube-downloader.git
cd youtube-downloader
```

#### B. Setup Backend
```bash
cd backend
npm install
```

Buat berkas `backend/.env` (salin dari `.env.example`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DEV_MOCK_MODE=false
YOUTUBE_API_KEY=               # Opsional: API Key YouTube Data API v3
COOKIES_FROM_BROWSER=          # Opsional: edge, chrome, atau firefox
```

*(Opsional tapi direkomendasikan)* **Siapkan YouTube Cookies** agar terhindar dari pembatasan bot YouTube:
1. Pasang ekstensi **Get cookies.txt LOCALLY** di browser.
2. Buka [youtube.com](https://www.youtube.com) dalam kondisi ter-login.
3. Klik ekstensi → Export cookies → simpan sebagai `backend/cookies.txt`.

#### C. Setup Frontend
```bash
cd ../frontend
npm install
```

---

### 4. Jalankan Aplikasi

**Terminal 1 — Backend (Port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (Port 3000):**
```bash
cd frontend
npm run dev
```

Buka browser di: **`http://localhost:3000`**

> Frontend akan otomatis mendeteksi lingkungan development dan mengarahkan semua request API ke `http://localhost:5000/api`.

---

### 🐳 Alternatif: Menjalankan via Docker (Single-Host Lokal)

Jika sudah memiliki **Docker Desktop**:
```bash
docker build -t maxistrong-downloader .
docker run -p 5000:5000 maxistrong-downloader
```

Buka browser di: **`http://localhost:5000`**

---

## ☁️ Panduan Deploy 1 Host ke Koyeb

Frontend dan Backend digabung dalam **1 Koyeb Web Service** menggunakan Dockerfile multi-stage. Tidak perlu Vercel.

### Langkah Deploy:

1. Login ke [Koyeb Dashboard](https://app.koyeb.com).
2. Buat **Web Service** baru → sambungkan repositori GitHub `oyy-gus/youtube-downloader`.
3. Konfigurasi deployment:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile` *(di root repositori)*
   - **Port**: `5000`
4. Masukkan **Environment Variables**:
   ```env
   PORT=5000
   NODE_ENV=production
   YOUTUBE_API_KEY=AIzaSy...   # Opsional, tapi mempercepat analisis playlist
   ```
5. Klik **Deploy** — Koyeb akan mem-build frontend Next.js dan backend Express menjadi 1 container Docker!

Setelah deploy selesai, seluruh aplikasi aktif di 1 URL Koyeb, misalnya:
```
https://maxistrong-downloader.koyeb.app
```

---

## 🛠️ API Reference (Endpoints)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck status server |
| `POST` | `/api/analyze` | Menganalisis URL playlist/video & menghasilkan preview judul clean |
| `POST` | `/api/jobs` | Membuat job antrean pengunduhan/konversi audio |
| `GET` | `/api/jobs/:jobId` | Mengambil status & kemajuan job |
| `GET` | `/api/jobs/:jobId/events` | Stream SSE (Server-Sent Events) untuk progress real-time |
| `GET` | `/api/files/:jobId/zip` | Mengunduh arsip ZIP playlist |
| `GET` | `/api/files/:jobId/track/:trackId` | Mengunduh satu berkas MP3 lagu |

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
│   ├── cookies.txt           # (Opsional) YouTube cookies untuk bypass bot check
│   ├── yt-dlp.exe            # (Opsional) Binary lokal jika tidak via PATH
│   ├── ffmpeg.exe            # (Opsional) Binary lokal jika tidak via PATH
│   └── package.json
├── frontend/                 # Aplikasi Web Client (Next.js 16)
│   ├── src/
│   │   ├── app/              # Next.js App Router & Layout
│   │   └── components/       # UI Components (UrlInput, Preview, JobProgress)
│   ├── postcss.config.mjs    # PostCSS config untuk Tailwind CSS v4
│   ├── package.json
│   └── next.config.mjs       # Next.js config (static export untuk single-host)
├── Dockerfile                # Multi-stage Dockerfile untuk Single-Host Koyeb
└── README.md
```

---

## 📄 Lisensi
[MIT License](LICENSE) - Bebas digunakan dan dikembangkan.
