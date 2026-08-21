<div align="center">

# ⚡ StreamPulse Downloader Pro

**Ultra Hızlı, Modern ve Yüksek Performanslı YouTube & YouTube Music MP3 & 4K Video İndirici**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-43.4-47848F?logo=electron&logoColor=white)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![yt-dlp](https://img.shields.io/badge/Engine-yt--dlp-FF0000?logo=youtube&logoColor=white)](https://github.com/yt-dlp/yt-dlp)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-7.0-007808?logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)

<p align="center">
  <b>Geliştirici:</b> <a href="https://github.com">Yüksel Bilgin</a> (AI-Driven Full Stack Developer)
</p>

</div>

---

## 🌟 Genel Bakış (Overview)

**StreamPulse Downloader Pro**, YouTube ve YouTube Music platformlarından tekli parçaları, albümleri ve 50+ parçalık dev oynatma listelerini **320kbps stüdyo ses kalitesinde** ve **4K 60FPS kayıpsız video formatında** indiren modern, yeni nesil bir masaüstü uygulamasıdır.

Gelişmiş **Google Gemini akışkan parıltı (Aurora Flowing Glow) arayüzü**, **Dahili YouTube Music tarzı Medya Oynatıcısı**, **Tek Tıkla USB / Araç Belleğine Senkronizasyon Motoru** ve **Karanlık / Aydınlık mod** desteğiyle donatılmıştır.

---

## 🚀 Öne Çıkan Özellikler (Key Features)

### 🎵 1. Ultra Yüksek Kalite Ses & Video İndirme
- **Stüdyo Kalitesinde MP3:** 320 kbps CBR/V0, 48.000 Hz örnekleme oranıyla stüdyo netliğinde ses.
- **Kayıpsız Formatlar:** FLAC, WAV, M4A (AAC) formatlarında sıfır yeniden kodlama kaybı.
- **4K 60FPS Ultra HD Video:** 2160p (4K), 1440p (2K), 1080p (Full HD) ve 720p video desteği.
- **Otomatik ID3 & Kapak Resmi Gömme:** Şarkı adı, sanatçı, albüm bilgisi ve orijinal HD kapak resmi dosyanın içine otomatik işlenir.

### 💽 2. Akıllı Oynatma Listesi & Klasörleme Motoru
- 50+ parçalık YouTube ve YouTube Music çalma listelerini algılar.
- Parçaları `Downloads/Albüm Adı/` şeklinde özel alt klasörde numaralandırarak (`01 - Şarkı.mp3`) düzenler.

### 🚗 3. Tek Tıkla USB & Araç Müzik Belleği Senkronizasyonu
- Bilgisayara takılı USB bellekleri ve harici diskleri anında tanır (`FAT32 / exFAT / NTFS`).
- İndirilen tüm albümü veya seçili parçaları tek tıkla USB'ye aktarır.
- **Araç Teybi Uyumluluk Modu:** Eski model otomobil teypleri için özel dosya adı ve FAT32 optimizasyonu uygular.

### 🎧 4. Dahili Medya Oynatıcı & Canlı Sıradaki Parçalar Çekmecesi
- İndirdiğiniz parçaları uygulamadan çıkmadan dinleyin.
- Çalan şarkıya tıklandığında sağ alt köşeden açılan **Sıradaki Parçalar (Up Next Queue)** çekmecesi.
- Canlı ekolayzır animasyonu, 10s ileri/geri sarma, hız ayarı (`0.75x - 2x`), karışık ve tekrar modları.

### 🔍 5. Akıllı Arama & YouTube Music Arama Çözücü
- YouTube Music arama linklerini (`music.youtube.com/search?q=...`) veya doğrudan şarkı isimlerini (`ara beni lütfen`) anında analiz edip en doğru parçayı getirir.
- Sonsuz radyo mikslerini (`list=RD...`) temizleyerek tekli şarkı olarak ayıklar.

### 🎨 6. Yeni Nesil Arayüz (UI & UX)
- **Google Gemini Aurora Akışkan Işıma:** Arama kutusunda kesintisiz sıvı gradyan animasyonu.
- **Canlı Yanıp Sönen Çok Renkli Neon İmleç:** Klavyede gezinirken renk değiştiren neon caret.
- **Karanlık (OLED Dark) & Aydınlık (Clean Light) Temalar:** Göz yormayan, yüksek kontrastlı tasarım.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji | Açıklama |
|---|---|---|
| **Masaüstü Çatısı** | [Electron 43](https://electronjs.org/) | Yerel Windows IPC, USB sürücü algılama ve dosya sistemi yönetimi |
| **Ön Yüz (Frontend)** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Hızlı, tip güvenli modern bileşen mimarisi |
| **Stil & Animasyon** | [Tailwind CSS 4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Glassmorphism, CSS neon parıltıları ve mikro etkileşimler |
| **İndirme Motoru** | [yt-dlp](https://github.com/yt-dlp/yt-dlp) | YouTube / YouTube Music medya ayrıştırma motoru |
| **Medya Çevirici** | [FFmpeg 7.0](https://ffmpeg.org/) | 320kbps MP3 dönüşümü, muxing ve ID3 kapak resmi gömücü |
| **Yerel Sunucu** | [Node.js Express](https://expressjs.com/) | Canlı ses akışı (Audio Streaming) ve SSE ilerleme bildirimleri |
| **Derleyici (Bundler)** | [Vite 8](https://vitejs.dev/) | Anlık HMR (Hot Module Replacement) geliştirme ortamı |

---

## 📥 Kurulum ve Geliştirme (Installation & Development)

### Gereksinimler
- **Node.js** (v18 veya üzeri)
- **Python 3** (yt-dlp için)
- **Git**

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/kullaniciadi/streampulse-downloader.git
cd streampulse-downloader
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Geliştirme Modunda Çalıştırın (Dev Mode)
```bash
npm run dev
```

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
