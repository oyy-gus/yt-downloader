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
- **📦 Single-Host Ready Architecture**:
  - Dapat di-deploy sebagai **1 Single Server / 1 Host** di Koyeb (Frontend Next.js & Express API menyatu dalam 1 URL & port tanpa masalah CORS).

---

## 💻 Panduan Instalasi & Penggunaan di Localhost

### 1. Prasyarat Sistem
Pastikan perangkat komputer Anda telah terpasang:
- **Node.js** (v20 atau v22+)
- **FFmpeg** (Untuk konversi & ID3 metadata audio)
- **yt-dlp** (Untuk ekstraksi stream media YouTube)
- **Python 3** (Dibutuhkan oleh yt-dlp)

---

### 2. Cara Memasang FFmpeg & yt-dlp di Windows (Localhost)

#### Opsi A: Otomatis via PIP (Direkomendasikan)
Buka Terminal / PowerShell sebagai Administrator:

```powershell
# 1. Install yt-dlp
pip install yt-dlp

# 2. Install ffmpeg
pip install ffmpeg-downloader
ffdl install
```

#### Opsi B: Menyimpan Executable Langsung di Folder `backend/`
Jika tidak ingin mengatur PATH Windows:
1. Unduh `ffmpeg.exe` dan `yt-dlp.exe`.
2. Taruh berkas `ffmpeg.exe` dan `yt-dlp.exe` langsung di dalam folder `backend/`.

---

### 3. Langkah Instalasi Proyek

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

Buat berkas `backend/.env` (atau salin dari `.env.example`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DEV_MOCK_MODE=false
YOUTUBE_API_KEY=               # Opsional: API Key YouTube Data API v3
COOKIES_FROM_BROWSER=          # Opsional: edge, chrome, atau firefox
```

*(Opsional tetapi Direkomendasikan)* **Menyiapkan YouTube Cookies**:
1. Pasang ekstensi browser **Get cookies.txt LOCALLY**.
2. Buka [youtube.com](https://www.youtube.com) (posisi login akun).
3. Export cookies dan simpan dengan nama `cookies.txt` di dalam folder `backend/cookies.txt`.

#### C. Setup Frontend
```bash
cd ../frontend
npm install
```

---

### 4. Menjalankan Aplikasi di Localhost

#### Jalankan Backend (Port 5000):
```bash
cd backend
npm run dev
```

#### Jalankan Frontend (Port 3000):
```bash
cd frontend
npm run dev
```

Buka browser Anda di: **`http://localhost:3000`**

---

### 🐳 Alternatif: Menjalankan Lokal via Docker

Jika Anda memiliki **Docker Desktop** di komputer Anda, Anda dapat menjalankan seluruh aplikasi (Frontend + Backend + FFmpeg + yt-dlp) hanya dengan 1 perintah:

```bash
docker build -t maxistrong-downloader .
docker run -p 5000:5000 maxistrong-downloader
```

Buka browser di **`http://localhost:5000`**.

---

## ☁️ Panduan Deploy 1 Host di Koyeb (Single Host)

Anda **tidak memerlukan Vercel** lagi. Aplikasi Frontend & Backend dapat disatukan di **1 Koyeb Web Service**:

1. Login ke [Koyeb Dashboard](https://app.koyeb.com).
2. Buat **Web Service Baru** dan sambungkan ke repositori GitHub `oyy-gus/youtube-downloader`.
3. Atur konfigurasi deployment:
   - **Builder Type**: `Dockerfile`
   - **Work Directory**: `/` (Root directory)
   - **Port**: `5000`
4. Masukkan **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `YOUTUBE_API_KEY`: *(opsional API key)*
5. Klik **Deploy**. Koyeb akan mem-build frontend Next.js dan backend Express menjadi 1 URL terpadu!

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
│   ├── Dockerfile            # Dockerfile Backend
│   └── package.json
├── frontend/                 # Aplikasi Web Client (Next.js 16)
│   ├── src/
│   │   ├── app/              # Next.js App Router & Layout
│   │   └── components/       # UI Components (UrlInput, Preview, JobProgress)
│   ├── package.json
│   └── next.config.mjs
├── Dockerfile                # Multi-stage Dockerfile untuk Single-Host Deployment
└── README.md
```

---

## 📄 Lisensi
[MIT License](LICENSE) - Bebas digunakan dan dikembangkan.
