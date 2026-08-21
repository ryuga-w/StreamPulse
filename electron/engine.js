const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class YtDlpEngine {
  constructor() {
    this.activeProcesses = new Map();
  }

  async getYtDlpCommand() {
    return new Promise((resolve) => {
      exec('yt-dlp --version', (err) => {
        if (!err) {
          resolve({ cmd: 'yt-dlp', argsPrefix: [] });
        } else {
          exec('python -m yt_dlp --version', (pyErr) => {
            if (!pyErr) {
              resolve({ cmd: 'python', argsPrefix: ['-m', 'yt_dlp'] });
            } else {
              resolve({ cmd: 'python', argsPrefix: ['-m', 'yt_dlp'] });
            }
          });
        }
      });
    });
  }

  getFfmpegDir() {
    const candidateDirs = [
      path.resolve(__dirname, '../bin'),
      path.resolve(process.cwd(), 'bin'),
      path.resolve(__dirname, '../../bin'),
      path.resolve(__dirname, '../node_modules/@ffmpeg-installer/win32-x64'),
    ];

    for (const dir of candidateDirs) {
      if (fs.existsSync(path.join(dir, 'ffmpeg.exe'))) {
        return dir;
      }
    }

    return null;
  }

  async checkFfmpeg() {
    const ffmpegDir = this.getFfmpegDir();
    if (ffmpegDir && fs.existsSync(path.join(ffmpegDir, 'ffmpeg.exe'))) {
      return true;
    }
    return new Promise((resolve) => {
      exec('ffmpeg -version', (err) => {
        resolve(!err);
      });
    });
  sanitizeUrl(rawUrl) {
    let cleanUrl = rawUrl.trim();

    // 1. YouTube Music Search URLs (e.g. https://music.youtube.com/search?q=...)
    const musicSearchMatch = cleanUrl.match(/music\.youtube\.com\/search\?q=([^&]+)/i);
    if (musicSearchMatch) {
      const query = decodeURIComponent(musicSearchMatch[1].replace(/\+/g, ' '));
      return `ytsearch1:${query}`;
    }

    // 2. Standard YouTube Search URLs (e.g. https://www.youtube.com/results?search_query=...)
    const ytSearchMatch = cleanUrl.match(/youtube\.com\/results\?search_query=([^&]+)/i);
    if (ytSearchMatch) {
      const query = decodeURIComponent(ytSearchMatch[1].replace(/\+/g, ' '));
      return `ytsearch1:${query}`;
    }

    // 3. Raw search text (user entered song name instead of URL)
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('ytsearch')) {
      return `ytsearch1:${cleanUrl}`;
    }

    // 4. YouTube Music track or album/playlist URLs
    cleanUrl = cleanUrl.replace(/music\.youtube\.com/gi, 'www.youtube.com');

    // Strip radio playlist IDs (RD, RDAM) on single tracks
    if (cleanUrl.includes('watch?v=') && cleanUrl.includes('list=RD')) {
      cleanUrl = cleanUrl.replace(/[?&]list=RD[^&]*/g, '');
    }

    // Strip tracking/share parameters
    cleanUrl = cleanUrl.replace(/&si=[^&]*/g, '').replace(/&feature=[^&]*/g, '');

    return cleanUrl;
  }

  sanitizeFolderName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim().slice(0, 80) || 'Playlist';
  }

  async fetchMetadata(rawUrl) {
    const url = this.sanitizeUrl(rawUrl);
    const { cmd, argsPrefix } = await this.getYtDlpCommand();

    const isPlaylistExplicit = (url.includes('list=') || url.includes('/playlist?')) && !url.includes('watch?v=');

    const args = [
      ...argsPrefix,
      '--dump-single-json',
      '--no-warnings',
      '--no-check-certificates',
      isPlaylistExplicit ? '--flat-playlist' : '--no-playlist',
      url,
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { windowsHide: true });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            resolve(this.normalizeMetadata(data, rawUrl));
          } catch (e) {
            reject(new Error('Failed to parse metadata: ' + e.message));
          }
        } else {
          let cleanErr = stderr
            .split('\n')
            .filter((l) => l.includes('ERROR:'))
            .map((l) => l.replace('ERROR:', '').trim())
            .join(' ') || stderr || `yt-dlp exited with error code ${code}`;

          if (cleanErr.includes('This playlist type is unviewable')) {
            cleanErr = 'Bu bağlantı bir YouTube Music sonsuz radyo mix\'idir (RDAT). Toplu oynatma listesi indirmek için standart listeleri (list=PL... veya list=OLAK...) kullanabilirsiniz.';
          }

          reject(new Error(cleanErr));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  normalizeMetadata(rawData, originalUrl) {
    let data = rawData;

    // If result was from ytsearch1: single search, unwrap entries[0]
    if (data.entries && Array.isArray(data.entries) && data.entries.length === 1 && !data.id) {
      data = data.entries[0];
    }

    const isPlaylist =
      data._type === 'playlist' ||
      (Array.isArray(data.entries) && data.entries.length > 1 && !data.id);

    if (isPlaylist && data.entries) {
      const validEntries = (data.entries || []).filter(e => e && e.title);
      return {
        isPlaylist: true,
        id: data.id || 'playlist',
        title: data.title || 'YouTube Oynatma Listesi',
        uploader: data.uploader || data.channel || 'Oynatma Listesi',
        thumbnail: data.thumbnails?.[0]?.url || validEntries[0]?.thumbnails?.[0]?.url || '',
        videoCount: validEntries.length,
        originalUrl,
        entries: validEntries.map((entry, idx) => ({
          id: entry.id || `entry_${idx}`,
          title: entry.title,
          url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
          duration: entry.duration || 0,
          thumbnail: entry.thumbnails?.[0]?.url || entry.thumbnail || '',
          uploader: entry.uploader || entry.channel || data.uploader || '',
          index: idx + 1,
        })),
        resolutions: [1080, 720, 480],
      };
    }

    const formats = data.formats || [];
    const videoResolutions = new Set();
    formats.forEach((f) => {
      if (f.vcodec !== 'none' && f.height) {
        videoResolutions.add(f.height);
      }
    });

    const sortedResolutions = Array.from(videoResolutions).sort((a, b) => b - a);

    return {
      isPlaylist: false,
      id: data.id,
      title: data.title || 'Untitled',
      uploader: data.uploader || data.channel || data.artist || 'Unknown Artist',
      duration: data.duration || 0,
      viewCount: data.view_count || 0,
      uploadDate: data.upload_date || '',
      thumbnail:
        data.thumbnail ||
        (data.thumbnails && data.thumbnails[data.thumbnails.length - 1]?.url) ||
        '',
      description: (data.description || '').slice(0, 300),
      originalUrl,
      resolutions: sortedResolutions.length > 0 ? sortedResolutions : [1080, 720, 480, 360],
    };
  }

  async startDownload({
    id,
    url: rawUrl,
    formatType,
    quality,
    outputDir,
    subfolderName,
    filenameTemplate = '%(title)s.%(ext)s',
    onProgress,
    onComplete,
    onError,
  }) {
    const url = this.sanitizeUrl(rawUrl);
    const { cmd, argsPrefix } = await this.getYtDlpCommand();
    const ffmpegDir = this.getFfmpegDir();

    let targetDir = outputDir || path.join(require('os').homedir(), 'Downloads');
    if (subfolderName) {
      targetDir = path.join(targetDir, this.sanitizeFolderName(subfolderName));
    }

    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (e) {}
    }

    const outputPath = path.join(targetDir, filenameTemplate);
    let formatArgs = [];

    const ffmpegArgs = ffmpegDir ? ['--ffmpeg-location', ffmpegDir] : [];

    if (formatType === 'mp3' || formatType === 'm4a' || formatType === 'wav' || formatType === 'flac') {
      formatArgs = [
        ...ffmpegArgs,
        '-x',
        '--audio-format',
        formatType,
        '--audio-quality',
        quality && quality !== '0' ? `${quality}k` : '0',
        '--embed-thumbnail',
        '--add-metadata',
      ];
    } else {
      if (quality && quality !== 'best') {
        formatArgs = [
          ...ffmpegArgs,
          '-f',
          `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]/best`,
          '--merge-output-format',
          'mp4',
        ];
      } else {
        formatArgs = [
          ...ffmpegArgs,
          '-f',
          'bestvideo+bestaudio/best',
          '--merge-output-format',
          'mp4',
        ];
      }
    }

    const args = [
      ...argsPrefix,
      '--newline',
      '--progress-template',
      'P:%(progress._percent_str)s|S:%(progress._speed_str)s|E:%(progress._eta_str)s|T:%(progress._total_bytes_str)s|ST:%(progress.status)s',
      '-o',
      outputPath,
      ...formatArgs,
      '--no-mtime',
      '--no-playlist',
      url,
    ];

    const proc = spawn(cmd, args, { windowsHide: true });
    this.activeProcesses.set(id, proc);

    let lastProgress = {
      id,
      percent: 0,
      speed: '0 MB/s',
      eta: '--:--',
      totalSize: 'Calculating...',
      status: 'downloading',
    };

    let destinationFile = '';
    const outputFilesDetected = new Set();

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const lines = text.split(/\r?\n/);

      for (const line of lines) {
        if (line.startsWith('P:')) {
          const parts = line.split('|');
          const percentStr = parts[0]?.replace('P:', '').replace('%', '').trim();
          const speedStr = parts[1]?.replace('S:', '').trim();
          const etaStr = parts[2]?.replace('E:', '').trim();
          const totalStr = parts[3]?.replace('T:', '').trim();

          const percent = parseFloat(percentStr) || lastProgress.percent;
          lastProgress = {
            id,
            percent,
            speed: speedStr || lastProgress.speed,
            eta: etaStr || lastProgress.eta,
            totalSize: totalStr || lastProgress.totalSize,
            status: 'downloading',
          };
          onProgress?.(lastProgress);
        } else if (line.includes('[download] Destination:')) {
          const file = line.replace('[download] Destination:', '').trim();
          destinationFile = file;
          outputFilesDetected.add(file);
        } else if (line.includes('[ExtractAudio] Destination:')) {
          const file = line.replace('[ExtractAudio] Destination:', '').trim();
          destinationFile = file;
          outputFilesDetected.add(file);
        } else if (line.includes('[Merger] Merging formats into')) {
          const file = line.replace('[Merger] Merging formats into', '').replace(/"/g, '').trim();
          destinationFile = file;
          outputFilesDetected.add(file);
        } else if (line.includes('has already been downloaded')) {
          const match = line.match(/\[download\]\s+(.*?)\s+has already been downloaded/);
          if (match && match[1]) {
            destinationFile = match[1].trim();
            outputFilesDetected.add(destinationFile);
          }
          lastProgress.percent = 100;
          lastProgress.status = 'completed';
          onProgress?.(lastProgress);
        }
      }
    });

    let errorOutput = '';
    proc.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    proc.on('close', (code) => {
      this.activeProcesses.delete(id);
      if (code === 0) {
        let finalFile = destinationFile;
        if (formatType !== 'video') {
          for (const f of outputFilesDetected) {
            if (f.endsWith(`.${formatType}`)) {
              finalFile = f;
              break;
            }
          }
        }

        if (finalFile && !path.isAbsolute(finalFile)) {
          finalFile = path.resolve(targetDir, finalFile);
        }

        if (!finalFile || !fs.existsSync(finalFile)) {
          finalFile = targetDir;
        }

        onComplete?.({
          id,
          status: 'completed',
          percent: 100,
          outputFile: finalFile,
        });
      } else {
        const cleanErr = errorOutput
          .split('\n')
          .filter((l) => l.includes('ERROR:'))
          .join(' ') || errorOutput || `Process exited with code ${code}`;
        onError?.({
          id,
          status: 'error',
          error: cleanErr,
        });
      }
    });

    proc.on('error', (err) => {
      this.activeProcesses.delete(id);
      onError?.({
        id,
        status: 'error',
        error: err.message,
      });
    });
  }

  cancelDownload(id) {
    const proc = this.activeProcesses.get(id);
    if (proc) {
      try {
        proc.kill('SIGKILL');
      } catch (e) {}
      this.activeProcesses.delete(id);
      return true;
    }
    return false;
  }
}

module.exports = new YtDlpEngine();
