const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Downloads & Engine
  fetchInfo: (url) => ipcRenderer.invoke('fetch-info', url),
  startDownload: (options) => ipcRenderer.invoke('start-download', options),
  cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id),
  getDefaultDownloadDirectory: () => ipcRenderer.invoke('get-default-download-dir'),
  selectDownloadDirectory: () => ipcRenderer.invoke('select-download-dir'),
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  resolveMediaFile: (filePath, title) => ipcRenderer.invoke('resolve-media-file', filePath, title),
  scanHistory: (dir) => ipcRenderer.invoke('scan-history', dir),

  // USB Sync Engine
  getUsbDrives: () => ipcRenderer.invoke('get-usb-drives'),
  copyToUsb: (options) => ipcRenderer.invoke('copy-to-usb', options),
  cancelUsbCopy: () => ipcRenderer.invoke('cancel-usb-copy'),
  onUsbProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('usb-progress', handler);
    return () => ipcRenderer.removeListener('usb-progress', handler);
  },
  onUsbComplete: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('usb-complete', handler);
    return () => ipcRenderer.removeListener('usb-complete', handler);
  },

  // Clipboard & dependencies
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  checkDependencies: () => ipcRenderer.invoke('check-dependencies'),
  updateYtDlp: () => ipcRenderer.invoke('update-ytdlp'),

  // Events
  onDownloadProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  onDownloadComplete: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download-complete', handler);
    return () => ipcRenderer.removeListener('download-complete', handler);
  },
  onDownloadError: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download-error', handler);
    return () => ipcRenderer.removeListener('download-error', handler);
  },
});
