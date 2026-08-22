const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, protocol, net, Notification } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const urlModule = require('url');
const engine = require('./engine');
const usbManager = require('./usbManager');
const { exec } = require('child_process');

let mainWindow = null;

// Set Application Name & User Model ID for Windows Notifications
app.setName('StreamPulse Downloader');
app.name = 'StreamPulse Downloader';
if (process.platform === 'win32') {
  app.setAppUserModelId(app.isPackaged ? 'com.streampulse.downloader' : process.execPath);
}

// Suppress security warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const recentNotificationCache = new Map();

function showWindowsNotification({ title, body, source = 'app' }) {
  try {
    const cacheKey = `${title}_${body}`;
    const now = Date.now();
    if (recentNotificationCache.has(cacheKey) && (now - recentNotificationCache.get(cacheKey) < 5000)) {
      return; // Deduplicate notification within 5 seconds window
    }
    recentNotificationCache.set(cacheKey, now);

    // Clean old entries
    for (const [k, time] of recentNotificationCache.entries()) {
      if (now - time > 10000) recentNotificationCache.delete(k);
    }

    if (Notification.isSupported()) {
      const defaultTitle = source === 'extension' 
        ? '⚡ Tarayıcı Eklentisinden İndirildi' 
        : '✅ StreamPulse İndirme Tamamlandı';

      const notif = new Notification({
        title: title || defaultTitle,
        body: body || 'Medya başarıyla kütüphanenize eklendi.',
        icon: path.join(__dirname, '../build/icon.png'),
        silent: false,
      });

      notif.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      });

      notif.show();
    }
  } catch (e) {
    console.error('Notification error:', e);
  }
}

global.showNotification = showWindowsNotification;

// Register streampulse:// custom protocol client
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('streampulse', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('streampulse');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      const deepLink = commandLine.find(arg => arg.startsWith('streampulse://'));
      if (deepLink) {
        handleDeepLinkUrl(deepLink);
      }
    }
  });
}

function handleDeepLinkUrl(rawDeepUrl) {
  try {
    const urlObj = new URL(rawDeepUrl);
    const targetUrl = urlObj.searchParams.get('url');
    const formatType = urlObj.searchParams.get('format') || 'mp3';
    const quality = urlObj.searchParams.get('quality') || '320';

    if (targetUrl) {
      engine.startDownload({
        url: targetUrl,
        formatType,
        quality,
        onProgress: (p) => mainWindow?.webContents.send('download-progress', p),
        onComplete: (d) => mainWindow?.webContents.send('download-complete', d),
        onError: (e) => mainWindow?.webContents.send('download-error', e),
      });
    }
  } catch (e) {
    console.log('Deep link error:', e.message);
  }
}

// Register media:// custom protocol
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
      bypassCSP: true,
    },
  },
]);

function findMatchingMediaFile(targetPath, title) {
  try {
    if (!targetPath) return null;
    const resolved = path.resolve(targetPath);
    if (!fs.existsSync(resolved)) {
      const defaultDownloads = path.join(os.homedir(), 'Downloads');
      const inDownloads = path.join(defaultDownloads, path.basename(targetPath));
      if (fs.existsSync(inDownloads)) return findMatchingMediaFile(inDownloads, title);
      return null;
    }

    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) return resolved;

    const files = fs.readdirSync(resolved);
    const mediaExts = ['.mp3', '.m4a', '.flac', '.wav', '.mp4', '.webm', '.mkv'];
    const mediaFiles = files.filter(f => mediaExts.includes(path.extname(f).toLowerCase()));

    if (mediaFiles.length === 0) return null;

    if (title) {
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const mf of mediaFiles) {
        const cleanMf = mf.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanMf.includes(cleanTitle) || cleanTitle.includes(cleanMf)) {
          return path.join(resolved, mf);
        }
      }
    }

    return path.join(resolved, mediaFiles[0]);
  } catch (e) {
    return null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 880,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    show: false,
  });

  global.electronMainWindow = mainWindow;

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    global.electronMainWindow = mainWindow;
    mainWindow.show();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
      mainWindow.reload();
    }
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start internal Express backend streaming server
  try {
    require('../server');
  } catch (e) {
    console.log('[Main] Server startup note:', e.message);
  }

  protocol.handle('media', (request) => {
    try {
      let rawUrl = request.url.replace(/^media:\/\/*/i, '');
      let decodedPath = decodeURIComponent(rawUrl);
      if (process.platform === 'win32' && !/^[a-zA-Z]:/.test(decodedPath) && decodedPath.startsWith('/')) {
        decodedPath = decodedPath.slice(1);
      }
      const normalized = path.normalize(decodedPath);
      const playableFile = findMatchingMediaFile(normalized) || normalized;

      return net.fetch(urlModule.pathToFileURL(playableFile).toString());
    } catch (e) {
      return new Response('File stream error: ' + e.message, { status: 500 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('get-default-download-dir', () => {
  return path.join(os.homedir(), 'Downloads');
});

ipcMain.handle('select-download-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Download Folder',
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('resolve-media-file', (_event, targetPath, title) => {
  return findMatchingMediaFile(targetPath, title);
});

// USB Flash Sync IPC
ipcMain.handle('get-usb-drives', async () => {
  return await usbManager.getUsbDrives();
});

ipcMain.handle('copy-to-usb', async (_event, options) => {
  try {
    usbManager.copyTracksToUsb({
      ...options,
      onProgress: (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('usb-progress', progress);
        }
      },
      onComplete: (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('usb-complete', data);
        }
      },
      onError: (err) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('usb-error', { error: err.message });
        }
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cancel-usb-copy', () => {
  usbManager.cancelCopy();
  return true;
});

ipcMain.handle('open-folder', async (_event, rawPath) => {
  if (!rawPath) return false;
  try {
    const resolvedPath = path.resolve(rawPath);
    if (fs.existsSync(resolvedPath)) {
      if (fs.statSync(resolvedPath).isDirectory()) {
        shell.openPath(resolvedPath);
      } else {
        shell.showItemInFolder(resolvedPath);
      }
      return true;
    } else {
      const parentDir = path.dirname(resolvedPath);
      if (fs.existsSync(parentDir)) {
        shell.openPath(parentDir);
      } else {
        shell.openPath(path.join(os.homedir(), 'Downloads'));
      }
      return true;
    }
  } catch (e) {
    exec(`explorer.exe "${path.join(os.homedir(), 'Downloads')}"`);
    return false;
  }
});

ipcMain.handle('open-file', async (_event, rawPath) => {
  if (!rawPath) return false;
  try {
    const resolvedPath = path.resolve(rawPath);
    const playable = findMatchingMediaFile(resolvedPath) || resolvedPath;
    if (fs.existsSync(playable)) {
      shell.openPath(playable);
      return true;
    } else {
      shell.openPath(path.join(os.homedir(), 'Downloads'));
      return false;
    }
  } catch (e) {
    exec(`explorer.exe "${path.join(os.homedir(), 'Downloads')}"`);
    return false;
  }
});

ipcMain.handle('scan-history', async (_event, customDir) => {
  try {
    const targetDir = customDir || path.join(os.homedir(), 'Downloads');
    if (!fs.existsSync(targetDir)) {
      return { success: true, items: [] };
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
    return { success: true, items: results };
  } catch (err) {
    return { success: false, error: err.message, items: [] };
  }
});

ipcMain.handle('read-clipboard', () => {
  const text = clipboard.readText() || '';
  const ytRegex = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/i;
  if (ytRegex.test(text.trim())) {
    return text.trim();
  }
  return null;
});

ipcMain.handle('fetch-info', async (_event, url) => {
  try {
    const metadata = await engine.fetchMetadata(url);
    return { success: true, data: metadata };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-download', async (_event, options) => {
  try {
    const downloadId = options.id || ('dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    const cleanTitle = options.title || 'İndirilen Medya';
    const source = options.source || 'app';

    const itemPayload = {
      ...options,
      id: downloadId,
      title: cleanTitle,
      source,
      status: 'downloading',
      percent: 0,
      createdAt: Date.now(),
    };

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-started', itemPayload);
    }

    engine.startDownload({
      ...options,
      id: downloadId,
      onProgress: (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            ...progress,
            id: downloadId,
            url: options.url,
            title: cleanTitle,
            thumbnail: options.thumbnail,
            formatType: options.formatType,
            quality: options.quality,
            source,
          });
        }
      },
      onComplete: (data) => {
        const fileName = data.outputFile ? path.basename(data.outputFile, path.extname(data.outputFile)) : cleanTitle;
        const completeTitle = (cleanTitle && cleanTitle !== 'İndirilen Medya') ? cleanTitle : fileName;
        const completePayload = {
          ...data,
          id: downloadId,
          url: options.url,
          title: completeTitle,
          thumbnail: options.thumbnail,
          formatType: options.formatType,
          quality: options.quality,
          playlistId: options.playlistId,
          playlistTitle: options.playlistTitle,
          source,
          completedAt: Date.now(),
        };

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-complete', completePayload);
        }
      },
      onError: (err) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-error', {
            id: downloadId,
            error: err?.message || err,
            source,
          });
        }
      },
    });
    return { success: true, id: downloadId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-notification', (_event, opts) => {
  showWindowsNotification(opts || {});
  return true;
});

ipcMain.handle('cancel-download', (_event, downloadId) => {
  return engine.cancelDownload(downloadId);
});

ipcMain.handle('check-dependencies', async () => {
  const ffmpegAvailable = await engine.checkFfmpeg();
  let ytDlpAvailable = false;
  let ytDlpVersion = 'Unknown';

  try {
    const { cmd, argsPrefix } = await engine.getYtDlpCommand();
    const ver = await new Promise((res) => {
      exec(`${cmd} ${argsPrefix.join(' ')} --version`, (err, stdout) => {
        if (!err && stdout) res(stdout.trim());
        else res(null);
      });
    });
    if (ver) {
      ytDlpAvailable = true;
      ytDlpVersion = ver;
    }
  } catch (e) {
    ytDlpAvailable = false;
  }

  return {
    ytDlp: ytDlpAvailable,
    ytDlpVersion,
    ffmpeg: ffmpegAvailable,
  };
});

ipcMain.handle('update-ytdlp', async () => {
  return new Promise((resolve) => {
    exec('python -m pip install --upgrade yt-dlp', (err, stdout, stderr) => {
      if (!err) {
        resolve({ success: true, message: 'yt-dlp successfully updated to latest version!' });
      } else {
        exec('yt-dlp -U', (err2, stdout2) => {
          if (!err2) {
            resolve({ success: true, message: 'yt-dlp successfully updated!' });
          } else {
            resolve({ success: false, error: err.message || stderr });
          }
        });
      }
    });
  });
});
