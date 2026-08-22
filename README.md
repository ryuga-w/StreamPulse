<div align="center">

# ⚡ StreamPulse Downloader Pro

**Next-Generation, High-Performance YouTube & YouTube Music MP3 & 4K 60FPS Video Downloader with Real-Time AI Audio Recognition**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-43.4-47848F?logo=electron&logoColor=white)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![yt-dlp](https://img.shields.io/badge/Engine-yt--dlp-FF0000?logo=youtube&logoColor=white)](https://github.com/yt-dlp/yt-dlp)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-7.0-007808?logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
[![AI Engine](https://img.shields.io/badge/AI%20Core-Shazam%20Audio%20Fingerprint-8b5cf6?logo=shazam&logoColor=white)](https://github.com/ryuga-w/StreamPulse)

<p align="center">
  <b>Developer:</b> <a href="https://github.com/ryuga-w">Yüksel Bilgin</a> (AI-Driven Full Stack Developer)
</p>

<p align="center">
  <a href="README.md"><b>English</b></a> • <a href="README.tr.md"><b>Türkçe</b></a>
</p>

</div>

---

## 🌟 Overview

**StreamPulse Downloader Pro** is a modern, ultra-fast desktop application and companion Chrome Extension designed to download single tracks, albums, and massive 200+ track playlists from YouTube and YouTube Music in **320kbps studio audio quality** and **up to 4K 60FPS lossless video**.

Engineered with a **Google Material 3 Expressive UI**, **Real-Time Equalizer-Reactive Quantum Fluid AI Music Recognition**, an **Accordion-Grouped Playlist Queue**, an **Integrated YouTube Music-style Media Player**, and **One-Click Flash Drive / Car Audio Sync**.

---

## 🚀 Key Features

### 🎵 1. Ultra High-Fidelity Audio & Video Engine
- **Studio-Grade MP3:** 320 kbps CBR/V0, 48,000 Hz sample rate with crystal-clear acoustic fidelity.
- **Lossless Formats:** FLAC, WAV, and M4A (AAC) without re-encoding loss.
- **4K 60FPS Ultra HD Video:** 2160p (4K), 1440p (2K), 1080p (Full HD), and 720p with dynamic format muxing.
- **Automatic ID3 Tagging & HD Artwork:** Track title, artist, album, and full-resolution cover art are embedded directly into each file.

### 🔮 2. Chrome Extension & Live Quantum AI Music Recognition
- **Tab Audio Capture:** Identify any song playing on TikTok, Instagram Reels, Twitter/X, YouTube, or any browser tab using acoustic fingerprinting.
- **Live Equalizer-Reactive Aurora Fluid Visualizer:** Real-time Web Audio FFT analysis that dances to live bass, mids, and treble bands with Google Gemini-tier silky light ribbons and cosmic star dust.
- **One-Click Desktop Handoff:** Instantly send identified tracks or browser video downloads directly to the desktop queue over local IPC.

### 📦 3. Grouped Accordion Playlist Queue
- Massive 200+ track playlists are bundled into a sleek **Playlist Container Card** instead of flooding the queue.
- Shows overall playlist progress bar, live aggregate speed, remaining ETA, and a collapsible **"Show/Hide Tracks"** accordion.
- Sends **a single summary Windows notification** upon playlist completion instead of hundreds of individual alerts.

### 🚗 4. One-Click USB & Car Stereo Sync
- Automatically detects connected USB flash drives and external hard drives (`FAT32 / exFAT / NTFS`).
- Export entire downloaded libraries or selected albums with one click.
- **Car Stereo Compatibility Mode:** Applies FAT32-safe filenames and numbering (`01 - Title.mp3`) for older automobile audio headunits.

### 🎧 5. Built-in Media Player & Up Next Drawer
- Listen to your downloads directly inside the application.
- Interactive slide-out **Up Next Queue Drawer** with live audio equalizer animations, 10s seek, speed controls (`0.75x - 2.0x`), and shuffle/repeat modes.

### 🎨 6. Material 3 Expressive Dual Themes
- **Adaptive Contrast:** Sleek OLED Dark and Clean High-Contrast Light themes.
- **Dual-Language:** Instant 1-click toggle between English and Turkish.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Description |
|---|---|---|
| **Desktop Framework** | [Electron 43](https://electronjs.org/) | Native Windows IPC, USB drive detection & filesystem management |
| **Frontend** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe, component-driven reactive interface |
| **Browser Extension** | [Chrome Manifest V3](https://developer.chrome.com/docs/extensions/) | Web Audio AnalyserNode + Offscreen Document live FFT capture |
| **Styling & Motion** | [Tailwind CSS 4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Glassmorphism, CSS neon glow effects & spring physics |
| **Downloader Core** | [yt-dlp](https://github.com/yt-dlp/yt-dlp) | YouTube / YouTube Music stream resolver engine |
| **Media Transcoder** | [FFmpeg 7.0](https://ffmpeg.org/) | 320kbps MP3 encoding, video muxing & ID3 metadata embedding |
| **AI Audio Engine** | [StreamPulse AI Core](https://github.com/ryuga-w/StreamPulse) | Raw PCM FFT frequency peak hashing & acoustic fingerprint matching |
| **Local Bridge Server** | [Node.js Express](https://expressjs.com/) | Extension-to-Desktop IPC bridge, audio streaming & SSE progress |
| **Bundler** | [Vite 8](https://vitejs.dev/) | Instant HMR development & optimized production bundling |

---

## 📥 Installation & Development

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Python 3** (required for yt-dlp)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/ryuga-w/StreamPulse.git
cd StreamPulse
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build Production Executables (Windows)
```bash
npm run build:win
```

---

## 🧩 Chrome Eklentisini Yükleme (Chrome Extension)
1. Chrome'da `chrome://extensions/` adresine gidin.
2. Sağ üstteki **Geliştirici Modu (Developer mode)** anahtarını açın.
3. **Paketlenmemiş öğe yükle (Load unpacked)** butonuna basarak projedeki `extension/` klasörünü seçin.

---

## 📦 Kurulum Dosyası Hazırlama (Build & Package)

Windows için modern NSIS kurulum sihirbazını veya Portable sürümü oluşturmak için:

```bash
# Standart Windows Kurulum Paketi (NSIS Setup .exe)
npm run dist

# Tek Tıklamalı Taşınabilir Sürüm (Portable .exe)
npm run dist:portable

# Hem Kurulum Sihirbazı Hem Portable Sürümü Derle
npm run dist:all
```

Derlenen kurulum dosyaları otomatik olarak **`release/`** klasörüne kaydedilir.

---

## 📄 Lisans (License)

Bu proje [MIT Lisansı](LICENSE) kapsamında açık kaynak olarak yayımlanmıştır.

---

<div align="center">
  <sub>Geliştirici: <b>Yüksel Bilgin</b> • Made with ❤️ for Music Lovers</sub>
</div>
