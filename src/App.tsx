import React, { useState, useEffect, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, TabType } from './components/Sidebar';
import { UrlInput } from './components/UrlInput';
import { MediaPreview } from './components/MediaPreview';
import { QueueView } from './components/QueueView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { MediaPlayer } from './components/MediaPlayer';
import {
  VideoMetadata,
  DownloadItem,
  AppSettings,
  DependencyStatus,
  FormatType,
  Language,
  ThemeMode,
} from './types';
import { api } from './api';
import { translations } from './i18n';
import { INITIAL_RESTORE_TRACKS } from './defaultHistory';
import { getTrackThumbnail } from './components/HistoryView';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  Zap,
} from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  downloadDir: '',
  maxConcurrent: 3,
  defaultAudioQuality: '320',
  defaultVideoQuality: '1080',
  defaultFormat: 'mp3',
  autoClipboard: true,
  autoOpenFolder: false,
  themeAccent: 'purple',
  themeMode: 'dark',
  language: 'tr',
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('downloader');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState<VideoMetadata | null>(null);
  const [queue, setQueue] = useState<DownloadItem[]>([]);
  const [history, setHistory] = useState<DownloadItem[]>(() => {
    const saved = localStorage.getItem('streampulse_history');
    if (!saved) return [];
    try {
      const parsed: DownloadItem[] = JSON.parse(saved);
      const uniqueMap = new Map<string, DownloadItem>();
      parsed.forEach((item, idx) => {
        if (!item.thumbnail || !item.thumbnail.trim()) {
          item.thumbnail = getTrackThumbnail(item, idx);
        }
        uniqueMap.set(item.id, item);
      });
      return Array.from(uniqueMap.values());
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('streampulse_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [depsStatus, setDepsStatus] = useState<DependencyStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Active playlist and current playing track index for YouTube Music style player
  const [activePlaylist, setActivePlaylist] = useState<DownloadItem[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);

  const language = settings.language || 'tr';
  const themeMode: ThemeMode = settings.themeMode || 'dark';
  const t = translations[language];
  const isProcessingQueueRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      let currentDir = settings.downloadDir;
      if (!currentDir) {
        currentDir = await api.getDefaultDownloadDirectory();
        setSettings((prev) => ({ ...prev, downloadDir: currentDir }));
      }
      const deps = await api.checkDependencies();
      setDepsStatus(deps);

      // Auto-restore downloads if history is empty
      if (history.length === 0) {
        try {
          let scanned = await api.scanHistory(currentDir);
          if (!scanned || scanned.length === 0) {
            scanned = INITIAL_RESTORE_TRACKS;
          }
          if (scanned && scanned.length > 0) {
            setHistory(scanned);
          }
        } catch (e) {
          setHistory(INITIAL_RESTORE_TRACKS);
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('streampulse_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('streampulse_settings', JSON.stringify(settings));
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleToggleLanguage = () => {
    const nextLang: Language = language === 'tr' ? 'en' : 'tr';
    setSettings((prev) => ({ ...prev, language: nextLang }));
    showToast(nextLang === 'tr' ? 'Dil Türkçe olarak ayarlandı' : 'Language switched to English', 'success');
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setSettings((prev) => ({ ...prev, themeMode: nextTheme }));
    showToast(nextTheme === 'light' ? 'Aydınlık Tema Aktif' : 'Karanlık Tema Aktif', 'info');
  };

  useEffect(() => {
    const cleanup = api.subscribeToEvents({
      onStarted: (data) => {
        const isExt = data.source === 'extension';
        const msg = isExt
          ? `⚡ Tarayıcı Eklentisi: "${(data.title || 'Medya').slice(0, 35)}" indirilmeye başlandı`
          : `🚀 İndirme Başlatıldı: "${(data.title || 'Medya').slice(0, 35)}"`;
        showToast(msg, 'info');

        const newItem: DownloadItem = {
          id: data.id,
          url: data.url || '',
          title: data.title || 'YouTube Medyası',
          uploader: data.uploader || 'YouTube',
          thumbnail: data.thumbnail || '',
          duration: data.duration || 0,
          formatType: data.formatType || 'mp3',
          quality: data.quality || '320',
          source: data.source || 'app',
          status: 'downloading',
          percent: 0,
          speed: '0 MB/s',
          eta: '--:--',
          totalSize: '',
          createdAt: data.createdAt || Date.now(),
        };

        setQueue((prev) => {
          if (prev.some((i) => i.id === data.id || (i.url && data.url && i.url === data.url))) {
            return prev.map((i) => (i.id === data.id ? { ...i, ...newItem } : i));
          }
          return [newItem, ...prev];
        });
      },
      onProgress: (data) => {
        setQueue((prev) => {
          const exists = prev.some((item) => item.id === data.id);
          if (!exists) {
            const newItem: DownloadItem = {
              id: data.id,
              url: data.url || '',
              title: data.title || 'İndiriliyor...',
              uploader: data.uploader || 'YouTube',
              thumbnail: data.thumbnail || '',
              duration: 0,
              formatType: data.formatType || 'mp3',
              quality: data.quality || '320',
              source: data.source || 'app',
              status: data.percent >= 99 ? 'converting' : 'downloading',
              percent: data.percent || 0,
              speed: data.speed || '0 MB/s',
              eta: data.eta || '--:--',
              totalSize: data.totalSize || '',
              createdAt: Date.now(),
            };
            return [newItem, ...prev];
          }
          return prev.map((item) => {
            if (item.id === data.id) {
              return {
                ...item,
                percent: data.percent,
                speed: data.speed,
                eta: data.eta,
                totalSize: data.totalSize,
                status: data.percent >= 99 && item.formatType !== 'video' ? 'converting' : 'downloading',
              };
            }
            return item;
          });
        });
      },
      onComplete: (data) => {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });

        setQueue((prev) => {
          const item = prev.find((i) => i.id === data.id);
          const rawTitle = data.title || (data.outputFile ? data.outputFile.split(/[/\\]/).pop().replace(/\.[^/.]+$/, '') : 'İndirilen Medya');
          const isExt = data.source === 'extension' || item?.source === 'extension';

          const completedItem: DownloadItem = item
            ? {
                ...item,
                status: 'completed',
                percent: 100,
                outputFile: data.outputFile,
                completedAt: Date.now(),
                source: isExt ? 'extension' : (item.source || 'app'),
              }
            : {
                id: data.id || ('dl_' + Date.now()),
                url: data.url || '',
                title: rawTitle,
                uploader: 'YouTube',
                thumbnail: data.thumbnail || '',
                duration: 0,
                formatType: data.formatType || 'mp3',
                quality: data.quality || '320',
                status: 'completed',
                percent: 100,
                outputFile: data.outputFile,
                createdAt: Date.now(),
                completedAt: Date.now(),
                source: isExt ? 'extension' : 'app',
              };

          setHistory((hist) => [
            completedItem,
            ...hist.filter((h) => h.id !== completedItem.id && h.outputFile !== completedItem.outputFile),
          ]);

          if (settings.autoOpenFolder && completedItem.outputFile) {
            api.openFolder(completedItem.outputFile);
          }

          const successMsg = isExt
            ? `⚡ Eklenti İndirmesi Tamamlandı: "${completedItem.title.slice(0, 30)}..."`
            : `"${completedItem.title.slice(0, 30)}..." ${t.downloadSuccess}`;

          showToast(successMsg, 'success');
          return prev.map((i) => (i.id === data.id ? { ...i, status: 'completed', percent: 100, outputFile: data.outputFile } : i));
        });
      },
      onError: (data) => {
        setQueue((prev) =>
          prev.map((item) =>
            item.id === data.id ? { ...item, status: 'error', error: data.error } : item
          )
        );
        showToast(t.downloadFailed, 'error');
      },
    });

    return cleanup;
  }, [settings.autoOpenFolder, language]);

  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingQueueRef.current) return;

      const activeCount = queue.filter(
        (i) => i.status === 'downloading' || i.status === 'converting'
      ).length;

      if (activeCount >= settings.maxConcurrent) return;

      const nextItem = queue.find((i) => i.status === 'queued');
      if (!nextItem) return;

      isProcessingQueueRef.current = true;

      setQueue((prev) =>
        prev.map((i) => (i.id === nextItem.id ? { ...i, status: 'downloading' } : i))
      );

      await api.startDownload({
        id: nextItem.id,
        url: nextItem.url,
        formatType: nextItem.formatType,
        quality: nextItem.quality,
        outputDir: settings.downloadDir,
        subfolderName: nextItem.subfolderName,
        filenameTemplate: nextItem.filenameTemplate,
      });

      isProcessingQueueRef.current = false;
    };

    processQueue();
  }, [queue, settings.maxConcurrent, settings.downloadDir]);

  const handleFetchUrl = async (url: string) => {
    setIsLoadingMetadata(true);
    setCurrentMetadata(null);
    try {
      const res = await api.fetchInfo(url);
      if (res.success && res.data) {
        setCurrentMetadata(res.data);
      } else {
        showToast(res.error || 'Video / Playlist info could not be fetched.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Engine connection error', 'error');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleStartDownload = (options: {
    url: string;
    title: string;
    uploader: string;
    thumbnail: string;
    duration: number;
    formatType: FormatType;
    quality: string;
    subfolderName?: string;
    filenameTemplate?: string;
  }) => {
    const newItem: DownloadItem = {
      id: 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...options,
      status: 'queued',
      percent: 0,
      speed: '0 MB/s',
      eta: '--:--',
      totalSize: 'Starting...',
      createdAt: Date.now(),
    };

    setQueue((prev) => [newItem, ...prev.filter((q) => q.id !== newItem.id)]);
    setActiveTab('queue');
    showToast(t.queueAdded, 'success');
  };

  const handleDownloadPlaylist = (
    items: {
      url: string;
      title: string;
      uploader: string;
      thumbnail: string;
      duration: number;
      formatType: FormatType;
      quality: string;
      subfolderName?: string;
      filenameTemplate?: string;
    }[]
  ) => {
    const newItems: DownloadItem[] = items.map((item, idx) => ({
      id: 'dl_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 7),
      ...item,
      status: 'queued',
      percent: 0,
      speed: '0 MB/s',
      eta: '--:--',
      totalSize: 'Queued...',
      createdAt: Date.now() + idx,
    }));

    setQueue((prev) => [...newItems, ...prev]);
    setActiveTab('queue');
    showToast(`${items.length} ${t.playlistAdded}`, 'success');
  };

  const handleCancelDownload = (id: string) => {
    api.cancelDownload(id);
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRetryDownload = (item: DownloadItem) => {
    const freshId = 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    setQueue((prev) => [
      { ...item, id: freshId, status: 'queued', percent: 0, error: undefined },
      ...prev.filter((i) => i.id !== item.id),
    ]);
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((i) => i.status !== 'completed' && i.status !== 'error'));
  };

  const handleSelectDownloadDir = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectDownloadDirectory();
      if (selected) {
        setSettings((prev) => ({ ...prev, downloadDir: selected }));
        showToast('Download directory updated!', 'success');
      }
    }
  };

  const handleOpenFolder = (filePath?: string) => {
    if (filePath) {
      api.openFolder(filePath);
    } else if (settings.downloadDir) {
      api.openFolder(settings.downloadDir);
    }
  };

  const handlePlayItem = (item: DownloadItem) => {
    setActivePlaylist([item]);
    setActiveTrackIndex(0);
  };

  const handlePlayPlaylist = (items: DownloadItem[], startIndex = 0) => {
    setActivePlaylist(items);
    setActiveTrackIndex(startIndex);
  };

  const handleDeleteMultiple = (ids: string[]) => {
    const idSet = new Set(ids);
    setHistory((prev) => prev.filter((i) => !idSet.has(i.id)));
    showToast(`${ids.length} parça geçmişten silindi.`, 'info');
  };

  const handleCheckDeps = async () => {
    const deps = await api.checkDependencies();
    setDepsStatus(deps);
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col font-sans select-none relative overflow-hidden transition-colors duration-300 ${
        themeMode === 'light' ? 'light-theme bg-[#f8fafc] text-slate-800' : 'bg-[#090d16] text-slate-100'
      }`}
    >
      <TitleBar
        queueCount={queue.filter((i) => i.status === 'downloading').length}
        language={language}
        themeMode={themeMode}
        onToggleLanguage={handleToggleLanguage}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          queueCount={queue.filter((i) => i.status === 'downloading' || i.status === 'queued').length}
          historyCount={history.length}
          language={language}
        />

        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

          {activeTab === 'downloader' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2 pt-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-600 font-medium shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{t.heroBadge}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                  {t.heroTitle}
                </h1>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  {t.heroSubtitle}
                </p>
              </div>

              <UrlInput
                onFetch={handleFetchUrl}
                isLoading={isLoadingMetadata}
                autoClipboard={settings.autoClipboard}
              />

              {currentMetadata && (
                <MediaPreview
                  metadata={currentMetadata}
                  onDownload={handleStartDownload}
                  onDownloadPlaylist={handleDownloadPlaylist}
                />
              )}
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-200">
              <QueueView
                queue={queue}
                onCancel={handleCancelDownload}
                onRetry={handleRetryDownload}
                onClearCompleted={handleClearCompleted}
                onOpenFolder={handleOpenFolder}
                onPlayItem={handlePlayItem}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-200">
              <HistoryView
                history={history}
                downloadDir={settings.downloadDir}
                onOpenFolder={handleOpenFolder}
                onPlayItem={handlePlayItem}
                onPlayPlaylist={handlePlayPlaylist}
                onClearHistory={() => {
                  setHistory([]);
                  showToast('İndirme geçmişi temizlendi.', 'info');
                }}
                onDeleteItem={(id) => setHistory((prev) => prev.filter((i) => i.id !== id))}
                onDeleteMultiple={handleDeleteMultiple}
                onRestoreHistory={(items) => {
                  setHistory(items);
                  showToast(`${items.length} parça başarıyla geri yüklendi!`, 'success');
                }}
                language={language}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-200">
              <SettingsView
                settings={settings}
                onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
                onSelectDir={handleSelectDownloadDir}
                depsStatus={depsStatus}
                onCheckDeps={handleCheckDeps}
              />
            </div>
          )}
        </main>
      </div>

      {/* YouTube Music Style Media Player */}
      <MediaPlayer
        playlist={activePlaylist}
        currentIndex={activeTrackIndex}
        onIndexChange={(idx) => setActiveTrackIndex(idx)}
        onClose={() => setActivePlaylist([])}
        language={language}
      />

      {/* Modern Toast Notification Container */}
      {toast && (
        <div className="app-toast-container fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-950/95 border border-purple-500/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Zap className="w-4 h-4 text-purple-400 shrink-0" />}
          <span className="toast-text text-xs font-semibold !text-white">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
