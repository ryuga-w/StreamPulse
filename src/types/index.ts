export type FormatType = 'mp3' | 'm4a' | 'wav' | 'flac' | 'video';
export type Language = 'tr' | 'en';
export type ThemeMode = 'dark' | 'light';

export interface UsbDriveInfo {
  driveLetter: string;
  label: string;
  fileSystem: string;
  isRemovable: boolean;
  freeSpaceBytes: number;
  totalSizeBytes: number;
  freeSpaceFormatted: string;
  totalSizeFormatted: string;
  percentUsed: number;
}

export interface UsbCopyProgress {
  currentTrackIndex: number;
  totalTracks: number;
  currentFileName: string;
  percent: number;
  speedFormatted: string;
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  uploader?: string;
  index?: number;
}

export interface VideoMetadata {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  viewCount: number;
  uploadDate?: string;
  thumbnail: string;
  description?: string;
  originalUrl: string;
  resolutions: number[];
  isPlaylist?: boolean;
  videoCount?: number;
  entries?: PlaylistEntry[];
}

export type DownloadStatus = 'queued' | 'downloading' | 'converting' | 'completed' | 'error' | 'cancelled';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  uploader: string;
  thumbnail: string;
  duration: number;
  formatType: FormatType;
  quality: string;
  status: DownloadStatus;
  percent: number;
  speed?: string;
  eta?: string;
  totalSize?: string;
  outputFile?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  subfolderName?: string;
  filenameTemplate?: string;
}

export interface AppSettings {
  downloadDir: string;
  maxConcurrent: number;
  defaultAudioQuality: string;
  defaultVideoQuality: string;
  defaultFormat: FormatType;
  autoClipboard: boolean;
  autoOpenFolder: boolean;
  themeAccent: string;
  themeMode: ThemeMode;
  language: Language;
}

export interface DependencyStatus {
  ytDlp: boolean;
  ytDlpVersion: string;
  ffmpeg: boolean;
}
