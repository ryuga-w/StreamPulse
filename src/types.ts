export type FormatType = 'mp3' | 'm4a' | 'flac' | 'wav' | 'video';

export interface VideoMetadata {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  viewCount: number;
  uploadDate: string;
  thumbnail: string;
  description: string;
  originalUrl: string;
  resolutions: number[];
  isPlaylist?: boolean;
  videoCount?: number;
  entries?: PlaylistEntry[];
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  selected?: boolean;
}

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  uploader: string;
  thumbnail: string;
  duration: number;
  formatType: FormatType;
  quality: string;
  status: 'queued' | 'downloading' | 'converting' | 'completed' | 'error' | 'cancelled';
  percent: number;
  speed: string;
  eta: string;
  totalSize: string;
  outputFile?: string;
  error?: string;
  source?: 'app' | 'extension';
  playlistId?: string;
  playlistTitle?: string;
  playlistIndex?: number;
  playlistTotal?: number;
  subfolderName?: string;
  createdAt: number;
  completedAt?: number;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type Language = 'tr' | 'en';

export interface AppSettings {
  downloadDir: string;
  maxConcurrent: number;
  defaultAudioQuality: string;
  defaultVideoQuality: string;
  defaultFormat: FormatType;
  autoClipboard: boolean;
  autoOpenFolder: boolean;
  themeAccent: 'purple' | 'cyan' | 'rose' | 'emerald';
  themeMode?: ThemeMode;
  language?: Language;
}

export interface DependencyStatus {
  ytDlp: boolean;
  ytDlpVersion: string;
  ffmpeg: boolean;
}

declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      isMaximized: () => Promise<boolean>;
      fetchInfo: (url: string) => Promise<{ success: boolean; data?: VideoMetadata; error?: string }>;
      startDownload: (options: any) => Promise<{ success: boolean; error?: string }>;
      cancelDownload: (id: string) => Promise<boolean>;
      selectDownloadDirectory: () => Promise<string | null>;
      getDefaultDownloadDirectory: () => Promise<string>;
      openFolder: (filePath: string) => Promise<boolean>;
      openFile: (filePath: string) => Promise<boolean>;
      readClipboard: () => Promise<string | null>;
      checkDependencies: () => Promise<DependencyStatus>;
      updateYtDlp: () => Promise<{ success: boolean; message?: string; error?: string }>;
      showNotification?: (options: { title: string; body: string; source?: 'app' | 'extension' }) => Promise<boolean>;
      onDownloadStarted?: (callback: (data: any) => void) => () => void;
      onDownloadProgress: (callback: (data: any) => void) => () => void;
      onDownloadComplete: (callback: (data: any) => void) => () => void;
      onDownloadError: (callback: (data: any) => void) => () => void;
    };
  }
}
