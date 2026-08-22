import { VideoMetadata, DownloadItem, DependencyStatus, FormatType, UsbDriveInfo, UsbCopyProgress } from './types';

const API_BASE = 'http://127.0.0.1:3001/api';

function clientSanitizeUrl(rawUrl: string): string {
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

export const api = {
  fetchInfo: async (rawUrl: string): Promise<{ success: boolean; data?: VideoMetadata; error?: string }> => {
    const url = clientSanitizeUrl(rawUrl);
    let res: { success: boolean; data?: any; error?: string };

    if (window.electronAPI) {
      res = await window.electronAPI.fetchInfo(url);
    } else {
      try {
        const fetchRes = await fetch(`${API_BASE}/fetch-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        res = await fetchRes.json();
      } catch (e: any) {
        return { success: false, error: 'Cannot connect to backend: ' + e.message };
      }
    }

    if (res && res.success && res.data) {
      let data = res.data;
      // If ytsearch1 returned as playlist with 1 entry, convert to single video preview
      if (data.isPlaylist && data.entries && data.entries.length === 1) {
        const entry = data.entries[0];
        data = {
          isPlaylist: false,
          id: entry.id,
          title: entry.title,
          uploader: entry.uploader || data.uploader || 'YouTube Music',
          duration: entry.duration || 0,
          viewCount: 0,
          thumbnail: entry.thumbnail || data.thumbnail || '',
          originalUrl: entry.url || rawUrl,
          resolutions: [1080, 720, 480],
        };
      }
      return { success: true, data };
    }

    return res;
  },

  startDownload: async (options: {
    id: string;
    url: string;
    formatType: FormatType;
    quality: string;
    outputDir?: string;
    subfolderName?: string;
    filenameTemplate?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const sanitizedOptions = {
      ...options,
      url: clientSanitizeUrl(options.url),
    };

    if (window.electronAPI) {
      return await window.electronAPI.startDownload(sanitizedOptions);
    }
    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedOptions),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  cancelDownload: async (id: string): Promise<boolean> => {
    if (window.electronAPI) {
      return await window.electronAPI.cancelDownload(id);
    }
    try {
      const res = await fetch(`${API_BASE}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  },

  getDefaultDownloadDirectory: async (): Promise<string> => {
    if (window.electronAPI) {
      return await window.electronAPI.getDefaultDownloadDirectory();
    }
    try {
      const res = await fetch(`${API_BASE}/default-dir`);
      const data = await res.json();
      return data.path || 'Downloads';
    } catch (e) {
      return 'Downloads';
    }
  },

  resolveMediaFile: async (filePath: string, title?: string): Promise<string | null> => {
    if (window.electronAPI && window.electronAPI.resolveMediaFile) {
      return await window.electronAPI.resolveMediaFile(filePath, title);
    }
    return filePath;
  },

  openFolder: async (filePath?: string): Promise<boolean> => {
    if (!filePath) return false;
    if (window.electronAPI) {
      return await window.electronAPI.openFolder(filePath);
    }
    try {
      const res = await fetch(`${API_BASE}/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  },

  openFile: async (filePath?: string): Promise<boolean> => {
    if (!filePath) return false;
    if (window.electronAPI) {
      return await window.electronAPI.openFile(filePath);
    }
    try {
      const res = await fetch(`${API_BASE}/open-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  },

  // USB Sync APIs
  getUsbDrives: async (): Promise<UsbDriveInfo[]> => {
    if (window.electronAPI && window.electronAPI.getUsbDrives) {
      return await window.electronAPI.getUsbDrives();
    }
    try {
      const res = await fetch(`${API_BASE}/usb/drives`);
      const data = await res.json();
      return data.drives || [];
    } catch (e) {
      return [];
    }
  },

  copyToUsb: async (options: {
    tracks: DownloadItem[];
    targetDrive: string;
    subfolderName?: string;
    carAudioPreset?: boolean;
    skipExisting?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    if (window.electronAPI && window.electronAPI.copyToUsb) {
      return await window.electronAPI.copyToUsb(options);
    }
    try {
      const res = await fetch(`${API_BASE}/usb/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  cancelUsbCopy: async (): Promise<boolean> => {
    if (window.electronAPI && window.electronAPI.cancelUsbCopy) {
      return await window.electronAPI.cancelUsbCopy();
    }
    try {
      const res = await fetch(`${API_BASE}/usb/cancel`, { method: 'POST' });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  },

  scanHistory: async (dir?: string): Promise<DownloadItem[]> => {
    try {
      if (window.electronAPI && window.electronAPI.scanHistory) {
        const res = await window.electronAPI.scanHistory(dir);
        if (res && res.success && Array.isArray(res.items)) {
          return res.items;
        }
      }
    } catch (e) {
      // IPC not yet loaded in running Electron instance, gracefully fallback to HTTP
    }

    try {
      const res = await fetch(`${API_BASE}/scan-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir }),
      });
      const data = await res.json();
      return data.success && Array.isArray(data.items) ? data.items : [];
    } catch (e) {
      return [];
    }
  },

  checkDependencies: async (): Promise<DependencyStatus> => {
    if (window.electronAPI) {
      return await window.electronAPI.checkDependencies();
    }
    try {
      const res = await fetch(`${API_BASE}/deps`);
      return await res.json();
    } catch (e) {
      return { ytDlp: false, ytDlpVersion: 'Offline', ffmpeg: false };
    }
  },

  updateYtDlp: async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (window.electronAPI && window.electronAPI.updateYtDlp) {
      return await window.electronAPI.updateYtDlp();
    }
    try {
      const res = await fetch(`${API_BASE}/update-ytdlp`, { method: 'POST' });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  subscribeToEvents: (callbacks: {
    onStarted?: (data: any) => void;
    onProgress: (data: any) => void;
    onComplete: (data: any) => void;
    onError: (data: any) => void;
    onUsbProgress?: (data: UsbCopyProgress) => void;
    onUsbComplete?: (data: any) => void;
  }) => {
    const cleanups: (() => void)[] = [];

    if (window.electronAPI) {
      if (window.electronAPI.onDownloadStarted && callbacks.onStarted) {
        cleanups.push(window.electronAPI.onDownloadStarted(callbacks.onStarted));
      }
      cleanups.push(window.electronAPI.onDownloadProgress(callbacks.onProgress));
      cleanups.push(window.electronAPI.onDownloadComplete(callbacks.onComplete));
      cleanups.push(window.electronAPI.onDownloadError(callbacks.onError));
      if (callbacks.onUsbProgress && window.electronAPI.onUsbProgress) {
        cleanups.push(window.electronAPI.onUsbProgress(callbacks.onUsbProgress));
      }
      if (callbacks.onUsbComplete && window.electronAPI.onUsbComplete) {
        cleanups.push(window.electronAPI.onUsbComplete(callbacks.onUsbComplete));
      }
    }

    try {
      const eventSource = new EventSource(`${API_BASE}/events`);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'download-started' && callbacks.onStarted) callbacks.onStarted(parsed.data);
          if (parsed.type === 'download-progress') callbacks.onProgress(parsed.data);
          if (parsed.type === 'download-complete') callbacks.onComplete(parsed.data);
          if (parsed.type === 'download-error') callbacks.onError(parsed.data);
          if (parsed.type === 'usb-progress' && callbacks.onUsbProgress) callbacks.onUsbProgress(parsed.data);
          if (parsed.type === 'usb-complete' && callbacks.onUsbComplete) callbacks.onUsbComplete(parsed.data);
        } catch (e) {}
      };
      cleanups.push(() => eventSource.close());
    } catch (e) {}

    return () => {
      cleanups.forEach((c) => {
        try {
          c();
        } catch (e) {}
      });
    };
  },
};
