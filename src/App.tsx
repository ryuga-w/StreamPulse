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
  themeMode: 'system',
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

  // System OS theme detection (Dark / Light) with real-time listener
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const language = settings.language || 'tr';
  const themeMode: ThemeMode = settings.themeMode || 'system';
  const effectiveTheme: 'dark' | 'light' = themeMode === 'system' ? systemTheme : themeMode;
  const t = translations[language];

  useEffect(() => {
    api.syncSettings({ language, themeMode });
  }, [language, themeMode]);

  // Active playlist and current playing track index for YouTube Music style player
  const [activePlaylist, setActivePlaylist] = useState<DownloadItem[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);

  const isProcessingQueueRef = useRef(false);
  const notifiedIdsRef = useRef(new Set<string>());

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
    setSettings((prev) => {
      const currentMode = prev.themeMode || 'system';
      let nextMode: ThemeMode;
      if (currentMode === 'system') {
        nextMode = 'dark';
      } else if (currentMode === 'dark') {
        nextMode = 'light';
      } else {
        nextMode = 'system';
      }
      const msg =
        nextMode === 'system'
          ? (language === 'tr' ? 'Sistem Teması Aktif (Windows Otomatik)' : 'System Theme Active (Windows Auto)')
          : nextMode === 'dark'
          ? (language === 'tr' ? 'Karanlık Tema Aktif' : 'Dark Theme Active')
          : (language === 'tr' ? 'Aydınlık Tema Aktif' : 'Light Theme Active');
      showToast(msg, 'info');
      return { ...prev, themeMode: nextMode };
    });
  };

  const queueRef = useRef<DownloadItem[]>([]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

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
          playlistId: data.playlistId,
          playlistTitle: data.playlistTitle,
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
              playlistId: data.playlistId,
              playlistTitle: data.playlistTitle,
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

        const existingItem = queueRef.current.find((i) => i.id === data.id);
        const rawTitle = data.title || existingItem?.title || (data.outputFile ? data.outputFile.split(/[/\\]/).pop().replace(/\.[^/.]+$/, '') : 'İndirilen Medya');
        const isExt = data.source === 'extension' || existingItem?.source === 'extension';
        const playlistId = data.playlistId || existingItem?.playlistId;
        const playlistTitle = data.playlistTitle || existingItem?.playlistTitle;

        let completedItem: DownloadItem = {
          id: data.id || ('dl_' + Date.now()),
          url: data.url || existingItem?.url || '',
          title: rawTitle,
          uploader: existingItem?.uploader || 'YouTube',
          thumbnail: data.thumbnail || existingItem?.thumbnail || '',
          duration: existingItem?.duration || 0,
          formatType: data.formatType || existingItem?.formatType || 'mp3',
          quality: data.quality || existingItem?.quality || '320',
          status: 'completed',
          percent: 100,
          outputFile: data.outputFile,
          playlistId,
          playlistTitle,
          playlistIndex: existingItem?.playlistIndex,
          playlistTotal: existingItem?.playlistTotal,
          createdAt: existingItem?.createdAt || Date.now(),
          completedAt: Date.now(),
          source: isExt ? 'extension' : (existingItem?.source || 'app'),
        };

        setQueue((prev) => {
          const item = prev.find((i) => i.id === data.id);
          if (item) {
            completedItem = {
              ...item,
              ...completedItem,
              status: 'completed',
              percent: 100,
              outputFile: data.outputFile,
              completedAt: Date.now(),
              source: isExt ? 'extension' : (item.source || 'app'),
            };
          }
          return prev.map((i) => (i.id === data.id ? { ...i, status: 'completed', percent: 100, outputFile: data.outputFile } : i));
        });

        setHistory((hist) => {
          const nextHist = [
            completedItem,
            ...hist.filter((h) => h.id !== completedItem.id && h.outputFile !== completedItem.outputFile),
          ];
          try {
            localStorage.setItem('streampulse_history', JSON.stringify(nextHist));
          } catch (e) {}
          return nextHist;
        });

        if (settings.autoOpenFolder && completedItem.outputFile) {
          api.openFolder(completedItem.outputFile);
        }

        if (!notifiedIdsRef.current.has(completedItem.id)) {
          notifiedIdsRef.current.add(completedItem.id);

          const isTr = language === 'tr';
          const isPartOfPlaylist = Boolean(completedItem.playlistId);

          if (!isPartOfPlaylist) {
            const toastMsg = isExt
              ? (isTr ? `⚡ Tarayıcı eklentisinden "${completedItem.title}" kütüphaneye eklendi!` : `⚡ "${completedItem.title}" from browser extension was added to library!`)
              : (isTr ? `✅ "${completedItem.title}" kütüphaneye eklendi!` : `✅ "${completedItem.title}" added to library!`);

            showToast(toastMsg, 'success');

            api.showNotification({
              title: isExt 
                ? (isTr ? '⚡ Tarayıcı Eklentisinden İndirildi' : '⚡ Downloaded from Extension')
                : (isTr ? '✅ İndirme Tamamlandı' : '✅ Download Completed'),
              body: isExt 
                ? (isTr ? `Eklentiden indirdiğiniz "${completedItem.title}" kütüphaneye eklendi!` : `"${completedItem.title}" downloaded from extension!`)
                : (isTr ? `"${completedItem.title}" başarıyla indirildi.` : `"${completedItem.title}" downloaded successfully.`),
              source: isExt ? 'extension' : 'app',
            });
          } else if (completedItem.playlistId) {
            // Aggregated single notification when entire playlist is finished
            setTimeout(() => {
              const currentQueue = queueRef.current;
              const plId = completedItem.playlistId!;
              const plItems = currentQueue.filter((q) => q.playlistId === plId);
              const unfinished = plItems.filter((q) => q.status !== 'completed' && q.status !== 'error');

              if (plItems.length > 0 && unfinished.length === 0 && !notifiedIdsRef.current.has(plId)) {
                notifiedIdsRef.current.add(plId);
                const plTitle = completedItem.playlistTitle || 'Çalma Listesi';
                const count = plItems.length;

                showToast(isTr ? `🎉 "${plTitle}" (${count} parça) tamamlandı!` : `🎉 "${plTitle}" (${count} tracks) completed!`, 'success');

                api.showNotification({
                  title: isTr ? '🎉 Çalma Listesi İndirildi' : '🎉 Playlist Download Completed',
                  body: isTr ? `"${plTitle}" listesindeki ${count} parça kütüphanenize eklendi.` : `All ${count} tracks from "${plTitle}" added to library.`,
                  source: 'app',
                });
              }
            }, 600);
          }
        }
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
        playlistId: nextItem.playlistId,
        playlistTitle: nextItem.playlistTitle,
        title: nextItem.title,
        thumbnail: nextItem.thumbnail,
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
      playlistId?: string;
      playlistTitle?: string;
      playlistIndex?: number;
      playlistTotal?: number;
    }[]
  ) => {
    const plId = items[0]?.playlistId || ('pl_' + Date.now());
    const plTitle = items[0]?.playlistTitle || currentMetadata?.title || 'Çalma Listesi';
    const plTotal = items.length;

    const newItems: DownloadItem[] = items.map((item, idx) => ({
      id: 'dl_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 7),
      ...item,
      playlistId: item.playlistId || plId,
      playlistTitle: item.playlistTitle || plTitle,
      playlistIndex: item.playlistIndex || (idx + 1),
      playlistTotal: item.playlistTotal || plTotal,
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
    <div className={`h-screen w-screen flex flex-col bg-[#030303] text-[#f1f1f1] select-none overflow-hidden font-['Roboto','YouTube_Sans'] ${effectiveTheme === 'light' ? 'light-theme' : ''}`}>
      <TitleBar
        queueCount={queue.filter((i) => i.status === 'downloading' || i.status === 'queued').length}
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

        <main className="flex-1 overflow-y-auto p-6 relative bg-[#030303]">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

          {activeTab === 'downloader' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
              <div className="text-center space-y-2 pt-2">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-medium shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t.heroBadge}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                  {t.heroTitle}
                </h1>
                <p className="text-xs text-[#aaaaaa] max-w-lg mx-auto">
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
            <div className="max-w-4xl mx-auto animate-in fade-in duration-150">
              <QueueView
                queue={queue}
                themeMode={effectiveTheme}
                onCancel={handleCancelDownload}
                onRetry={handleRetryDownload}
                onClearCompleted={handleClearCompleted}
                onOpenFolder={handleOpenFolder}
                onPlayItem={handlePlayItem}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-150">
              <HistoryView
                history={history}
                downloadDir={settings.downloadDir}
                onOpenFolder={handleOpenFolder}
                onPlayItem={handlePlayItem}
                onPlayPlaylist={handlePlayPlaylist}
                onClearHistory={() => {
                  setHistory([]);
                  showToast(language === 'tr' ? 'İndirme geçmişi temizlendi.' : 'Download history cleared.', 'info');
                }}
                onDeleteItem={(id) => setHistory((prev) => prev.filter((i) => i.id !== id))}
                onDeleteMultiple={handleDeleteMultiple}
                onRestoreHistory={(items) => {
                  setHistory(items);
                  showToast(
                    language === 'tr'
                      ? `${items.length} parça başarıyla geri yüklendi!`
                      : `${items.length} tracks restored successfully!`,
                    'success'
                  );
                }}
                language={language}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-150">
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

      {/* YouTube Style Snackbar Notification Container */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#212121] border border-white/10 shadow-2xl text-white animate-in slide-in-from-bottom-3 duration-150 font-['Roboto','YouTube_Sans']">
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-[#2ba640] shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#ff4e45] shrink-0" />}
          {toast.type === 'info' && <span className="w-2 h-2 rounded-full bg-[#3ea6ff] shrink-0"></span>}
          <span className="text-xs font-medium text-white">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
