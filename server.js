const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs');
const engine = require('./electron/engine');
const usbManager = require('./electron/usbManager');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const sseClients = new Set();

function broadcastEvent(type, data) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function resolvePlayableFile(targetPath, title) {
  try {
    if (!targetPath) return null;
    const resolved = path.resolve(targetPath);
    if (fs.existsSync(resolved)) {
      const stat = fs.statSync(resolved);
      if (!stat.isDirectory()) return resolved;

      const files = fs.readdirSync(resolved);
      const mediaExts = ['.mp3', '.m4a', '.flac', '.wav', '.mp4', '.webm', '.mkv'];
      const mediaFiles = files.filter(f => mediaExts.includes(path.extname(f).toLowerCase()));
      if (mediaFiles.length > 0) return path.join(resolved, mediaFiles[0]);
    }

    // Try finding in Downloads folder
    const defaultDownloads = path.join(os.homedir(), 'Downloads');
    const baseName = path.basename(targetPath);
    const inDownloads = path.join(defaultDownloads, baseName);
    if (fs.existsSync(inDownloads)) {
      const stat = fs.statSync(inDownloads);
      if (!stat.isDirectory()) return inDownloads;
    }

    // Search by title or partial filename in Downloads
    if (fs.existsSync(defaultDownloads)) {
      const allEntries = fs.readdirSync(defaultDownloads, { withFileTypes: true });
      const searchKey = (title || baseName).toLowerCase().replace(/[^a-z0-9]/g, '');
      
      for (const entry of allEntries) {
        if (entry.isFile()) {
          const cleanName = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanName.includes(searchKey) || searchKey.includes(cleanName)) {
            return path.join(defaultDownloads, entry.name);
          }
        } else if (entry.isDirectory()) {
          const subDir = path.join(defaultDownloads, entry.name);
          try {
            const subFiles = fs.readdirSync(subDir);
            for (const sf of subFiles) {
              const cleanSf = sf.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (cleanSf.includes(searchKey) || searchKey.includes(cleanSf)) {
                return path.join(subDir, sf);
              }
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
  return null;
}

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('\n');
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/api/stream', (req, res) => {
  const rawPath = req.query.file;
  if (!rawPath) {
    return res.status(400).send('File parameter missing');
  }

  const inputPath = path.resolve(rawPath);
  const filePath = resolvePlayableFile(inputPath);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'audio/mpeg';
  if (ext === '.mp4') contentType = 'video/mp4';
  else if (ext === '.webm') contentType = 'video/webm';
  else if (ext === '.m4a') contentType = 'audio/mp4';
  else if (ext === '.wav') contentType = 'audio/wav';
  else if (ext === '.flac') contentType = 'audio/flac';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// USB Flash Sync APIs
app.get('/api/usb/drives', async (_req, res) => {
  const drives = await usbManager.getUsbDrives();
  res.json({ success: true, drives });
});

app.post('/api/usb/copy', async (req, res) => {
  const options = req.body;
  usbManager.copyTracksToUsb({
    ...options,
    onProgress: (progress) => {
      broadcastEvent('usb-progress', progress);
    },
    onComplete: (data) => {
      broadcastEvent('usb-complete', data);
    },
    onError: (err) => {
      broadcastEvent('usb-error', { error: err.message });
    },
  });
  res.json({ success: true });
});

app.post('/api/usb/cancel', (_req, res) => {
  usbManager.cancelCopy();
  res.json({ success: true });
});

app.post('/api/fetch-info', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const data = await engine.fetchMetadata(url);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/download', async (req, res) => {
  const options = req.body;
  if (!options || !options.url) {
    return res.status(400).json({ success: false, error: 'Invalid download options' });
  }

  try {
    engine.startDownload({
      ...options,
      onProgress: (progress) => {
        broadcastEvent('download-progress', progress);
      },
      onComplete: (data) => {
        broadcastEvent('download-complete', data);
      },
      onError: (err) => {
        broadcastEvent('download-error', err);
      },
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/cancel', (req, res) => {
  const { id } = req.body;
  const result = engine.cancelDownload(id);
  res.json({ success: result });
});

app.get('/api/default-dir', (_req, res) => {
  res.json({ path: path.join(os.homedir(), 'Downloads') });
});

app.post('/api/open-folder', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ success: false, error: 'filePath is required' });
  }

  try {
    const resolvedPath = path.resolve(filePath);
    if (fs.existsSync(resolvedPath)) {
      const isDir = fs.statSync(resolvedPath).isDirectory();
      if (isDir) {
        exec(`explorer.exe "${resolvedPath}"`);
      } else {
        exec(`explorer.exe /select,"${resolvedPath}"`);
      }
    } else {
      const parentDir = path.dirname(resolvedPath);
      if (fs.existsSync(parentDir)) {
        exec(`explorer.exe "${parentDir}"`);
      } else {
        exec(`explorer.exe "${path.join(os.homedir(), 'Downloads')}"`);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/open-file', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ success: false, error: 'filePath is required' });
  }

  try {
    const resolvedPath = path.resolve(filePath);
    const playable = resolvePlayableFile(resolvedPath) || resolvedPath;
    if (fs.existsSync(playable)) {
      exec(`start "" "${playable}"`);
    } else {
      exec(`explorer.exe "${path.join(os.homedir(), 'Downloads')}"`);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/deps', async (_req, res) => {
  const ffmpeg = await engine.checkFfmpeg();
  let ytDlp = false;
  let ytDlpVersion = 'Unknown';

  try {
    const { cmd, argsPrefix } = await engine.getYtDlpCommand();
    const ver = await new Promise((resolve) => {
      exec(`${cmd} ${argsPrefix.join(' ')} --version`, (err, stdout) => {
        if (!err && stdout) resolve(stdout.trim());
        else resolve(null);
      });
    });
    if (ver) {
      ytDlp = true;
      ytDlpVersion = ver;
    }
  } catch (e) {}

  res.json({ ytDlp, ytDlpVersion, ffmpeg });
});

app.post('/api/scan-history', (req, res) => {
  try {
    const targetDir = req.body?.dir || path.join(os.homedir(), 'Downloads');
    if (!fs.existsSync(targetDir)) {
      return res.json({ success: true, items: [] });
    }

    const results = [];
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        try {
          const subFiles = fs.readdirSync(fullPath, { withFileTypes: true });
          for (const sub of subFiles) {
            if (sub.isFile()) {
              const ext = path.extname(sub.name).toLowerCase();
              if (['.mp3', '.m4a', '.wav', '.flac', '.mp4', '.mkv'].includes(ext)) {
                const subFilePath = path.join(fullPath, sub.name);
                const stat = fs.statSync(subFilePath);
                const isVid = ['.mp4', '.mkv'].includes(ext);
                const cleanTitle = path.basename(sub.name, ext).replace(/^\d+\s*-\s*/, '');
                results.push({
                  id: 'scan_' + Buffer.from(subFilePath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-16),
                  url: '',
                  title: cleanTitle,
                  uploader: entry.name,
                  thumbnail: '',
                  duration: 0,
                  formatType: isVid ? 'video' : (ext.replace('.', '') || 'mp3'),
                  quality: isVid ? '1080' : '320',
                  status: 'completed',
                  percent: 100,
                  outputFile: subFilePath,
                  createdAt: stat.birthtimeMs || stat.mtimeMs,
                  completedAt: stat.mtimeMs,
                  subfolderName: entry.name,
                });
              }
            }
          }
        } catch (e) {}
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.mp3', '.m4a', '.wav', '.flac', '.mp4'].includes(ext)) {
          const stat = fs.statSync(fullPath);
          const isVid = ext === '.mp4';
          const cleanTitle = path.basename(entry.name, ext);
          results.push({
            id: 'scan_' + Buffer.from(fullPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-16),
            url: '',
            title: cleanTitle,
            uploader: 'Downloads',
            thumbnail: '',
            duration: 0,
            formatType: isVid ? 'video' : (ext.replace('.', '') || 'mp3'),
            quality: isVid ? '1080' : '320',
            status: 'completed',
            percent: 100,
            outputFile: fullPath,
            createdAt: stat.birthtimeMs || stat.mtimeMs,
            completedAt: stat.mtimeMs,
          });
        }
      }
    }

    results.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    res.json({ success: true, items: results });
  } catch (err) {
    res.json({ success: false, error: err.message, items: [] });
  }
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[StreamPulse API Engine] Running on http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[StreamPulse API Engine] Port ${PORT} already active, continuing.`);
  } else {
    console.error('[StreamPulse API Engine] Error:', err);
  }
});

module.exports = { app, server };
