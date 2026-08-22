import React, { useState } from 'react';
import { DownloadItem } from '../types';
import {
  X,
  RefreshCw,
  Clock,
  Gauge,
  FileCheck,
  AlertCircle,
  Folder,
  Play,
  Music,
  Video,
  ListOrdered,
  ListMusic,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface QueueViewProps {
  queue: DownloadItem[];
  themeMode?: 'dark' | 'light';
  onCancel: (id: string) => void;
  onRetry: (item: DownloadItem) => void;
  onClearCompleted: () => void;
  onOpenFolder?: (filePath?: string) => void;
  onPlayItem?: (item: DownloadItem) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  themeMode = 'dark',
  onCancel,
  onRetry,
  onClearCompleted,
  onOpenFolder,
  onPlayItem,
}) => {
  const isLight = themeMode === 'light';
  const [expandedPlaylists, setExpandedPlaylists] = useState<Record<string, boolean>>({});

  const togglePlaylistExpand = (playlistId: string) => {
    setExpandedPlaylists((prev) => ({
      ...prev,
      [playlistId]: !prev[playlistId],
    }));
  };

  const activeDownloads = queue.filter(
    (i) => i.status === 'downloading' || i.status === 'converting' || i.status === 'queued'
  );
  const completedOrFailed = queue.filter(
    (i) => i.status === 'completed' || i.status === 'error' || i.status === 'cancelled'
  );

  if (queue.length === 0) {
    return (
      <div
        className={`w-full h-96 flex flex-col items-center justify-center text-center p-8 rounded-2xl border font-['Roboto','YouTube_Sans'] transition-colors ${
          isLight
            ? 'bg-white border-slate-200/80 shadow-sm text-slate-800'
            : 'bg-[#212121] border-white/5 text-white'
        }`}
      >
        <div
          className={`w-14 h-14 rounded-full border flex items-center justify-center mb-3 ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-500'
              : 'bg-[#181818] border-white/10 text-[#aaaaaa]'
          }`}
        >
          <ListOrdered className="w-6 h-6" />
        </div>
        <h3 className={`text-sm font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          İndirme Kuyruğu Boş
        </h3>
        <p className={`text-xs max-w-sm leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#aaaaaa]'}`}>
          Aktif veya bekleyen indirme bulunmuyor. İndirici sekmesine bir YouTube linki yapıştırarak indirmeyi başlatabilirsiniz.
        </p>
      </div>
    );
  }

  // Group queue into standalone items and playlist groups
  type QueueGroup =
    | { type: 'single'; item: DownloadItem }
    | {
        type: 'playlist';
        playlistId: string;
        playlistTitle: string;
        items: DownloadItem[];
        totalTracks: number;
        completedTracks: number;
        inProgressTracks: number;
        errorTracks: number;
        overallPercent: number;
        currentSpeed: string;
        currentEta: string;
        thumbnail: string;
      };

  const groups: QueueGroup[] = [];
  const processedPlaylistIds = new Set<string>();

  for (const item of queue) {
    if (item.playlistId) {
      if (processedPlaylistIds.has(item.playlistId)) continue;
      processedPlaylistIds.add(item.playlistId);

      const plItems = queue.filter((q) => q.playlistId === item.playlistId);
      const total = plItems.length;
      const completed = plItems.filter((q) => q.status === 'completed').length;
      const inProgress = plItems.filter((q) => q.status === 'downloading' || q.status === 'converting').length;
      const errors = plItems.filter((q) => q.status === 'error').length;

      const sumPercent = plItems.reduce((acc, curr) => acc + (curr.percent || 0), 0);
      const overallPercent = total > 0 ? Math.round(sumPercent / total) : 0;

      const activeItem = plItems.find((q) => q.status === 'downloading' || q.status === 'converting');
      const currentSpeed = activeItem?.speed || '';
      const currentEta = activeItem?.eta || '';
      const thumbnail = plItems.find((q) => q.thumbnail)?.thumbnail || item.thumbnail || '';

      groups.push({
        type: 'playlist',
        playlistId: item.playlistId,
        playlistTitle: item.playlistTitle || 'Çalma Listesi',
        items: plItems,
        totalTracks: total,
        completedTracks: completed,
        inProgressTracks: inProgress,
        errorTracks: errors,
        overallPercent,
        currentSpeed,
        currentEta,
        thumbnail,
      });
    } else {
      groups.push({ type: 'single', item });
    }
  }

  return (
    <div className="w-full space-y-3 pb-20 font-['Roboto','YouTube_Sans']">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <span>İndirme Kuyruğu</span>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-medium ${
                isLight ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-white/10 text-white'
              }`}
            >
              {activeDownloads.length} aktif
            </span>
          </h2>
        </div>

        {completedOrFailed.length > 0 && (
          <button
            onClick={onClearCompleted}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors border cursor-pointer font-medium ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                : 'text-[#aaaaaa] hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            Tamamlananları Temizle
          </button>
        )}
      </div>

      {/* Queue Items List */}
      <div className="space-y-3">
        {groups.map((group) => {
          if (group.type === 'playlist') {
            const isExpanded = expandedPlaylists[group.playlistId] ?? false;
            const isAllCompleted = group.completedTracks === group.totalTracks;
            const hasError = group.errorTracks > 0;

            return (
              <div
                key={group.playlistId}
                className={`rounded-2xl p-4 border transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    : 'bg-[#212121] border-white/10 shadow-lg'
                }`}
              >
                {/* Playlist Header Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Thumbnail with Playlist Badge */}
                    <div
                      className={`relative w-16 h-14 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center ${
                        isLight ? 'bg-purple-50 border-purple-200' : 'bg-[#181818] border-white/10'
                      }`}
                    >
                      {group.thumbnail ? (
                        <img src={group.thumbnail} alt={group.playlistTitle} className="w-full h-full object-cover" />
                      ) : (
                        <ListMusic className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <ListMusic className="w-5 h-5 text-white drop-shadow" />
                      </div>
                      <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[9px] font-mono font-bold text-white">
                        {group.totalTracks}
                      </span>
                    </div>

                    {/* Title & Stats */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white uppercase tracking-wider">
                          ÇALMA LİSTESİ
                        </span>
                        <h4 className={`text-sm font-bold truncate max-w-md ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {group.playlistTitle}
                        </h4>
                      </div>

                      <div className={`flex items-center gap-3 text-xs mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-[#aaaaaa]'}`}>
                        <span>
                          {group.completedTracks} / {group.totalTracks} Parça Tamamlandı
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-purple-500">%{group.overallPercent}</span>
                        {group.currentSpeed && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3.5 h-3.5" /> {group.currentSpeed}
                            </span>
                          </>
                        )}
                        {group.currentEta && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {group.currentEta}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePlaylistExpand(group.playlistId)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{isExpanded ? 'Gizle' : 'Parçaları Göster'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {!isAllCompleted && (
                      <button
                        onClick={() => {
                          group.items.forEach((it) => onCancel(it.id));
                        }}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isLight
                            ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                            : 'text-rose-400 border-rose-500/20 hover:bg-rose-500/10'
                        }`}
                        title="Tüm Listeyi İptal Et"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div
                    className={`h-2.5 w-full rounded-full overflow-hidden border relative p-0.5 ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181818] border-white/10'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAllCompleted
                          ? 'bg-emerald-500'
                          : hasError
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500'
                      }`}
                      style={{ width: `${Math.max(2, group.overallPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Collapsible Track Items */}
                {isExpanded && (
                  <div
                    className={`mt-4 pt-3 border-t space-y-2 max-h-96 overflow-y-auto pr-1 ${
                      isLight ? 'border-slate-200' : 'border-white/10'
                    }`}
                  >
                    {group.items.map((track, idx) => (
                      <div
                        key={track.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                          isLight ? 'bg-slate-50 border-slate-200/80 text-slate-800' : 'bg-[#181818] border-white/5 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 text-center text-[11px] font-mono font-bold ${
                              isLight ? 'text-slate-400' : 'text-[#717171]'
                            }`}
                          >
                            {idx + 1}
                          </span>

                          <div className="min-w-0">
                            <h5 className={`text-xs font-medium truncate max-w-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {track.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                              <span className={isLight ? 'text-slate-500' : 'text-[#aaaaaa]'}>
                                {track.uploader}
                              </span>
                              <span className="font-mono text-purple-500 font-semibold">
                                %{track.percent}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {track.status === 'completed' && (
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5" /> İndi
                            </span>
                          )}
                          {track.status === 'downloading' && (
                            <span className="text-[10px] font-bold text-purple-500 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> İndiriliyor
                            </span>
                          )}
                          {track.status === 'converting' && (
                            <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Dönüştürülüyor
                            </span>
                          )}
                          {track.status === 'queued' && (
                            <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-[#717171]'}`}>
                              Sırada
                            </span>
                          )}
                          {track.status === 'error' && (
                            <button
                              onClick={() => onRetry(track)}
                              className="text-rose-500 hover:text-rose-600 p-1"
                              title="Tekrar Dene"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(track.status === 'downloading' || track.status === 'queued') && (
                            <button
                              onClick={() => onCancel(track.id)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="İptal Et"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Single Download Item Card
          const item = group.item;
          const isAudio = item.formatType !== 'video';
          const isDownloading = item.status === 'downloading';
          const isConverting = item.status === 'converting';
          const isCompleted = item.status === 'completed';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              className={`rounded-2xl p-4 border transition-all duration-200 space-y-3 group ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  : 'bg-[#212121] border-white/5 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Thumbnail */}
                  <div
                    className={`relative w-16 h-12 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181818] border-white/10'
                    }`}
                  >
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={isLight ? 'text-slate-400' : 'text-[#717171]'}>
                        {isAudio ? <Music className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[9px] font-mono font-bold text-white">
                      {isAudio ? item.formatType.toUpperCase() : `${item.quality}p`}
                    </span>
                  </div>

                  {/* Title and Uploader */}
                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold truncate max-w-md ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-[11px] truncate ${isLight ? 'text-slate-500 font-medium' : 'text-[#aaaaaa]'}`}>
                        {item.uploader}
                      </p>
                      {item.source === 'extension' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-[#3ea6ff] font-bold">
                          Eklenti
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isCompleted && (
                    <>
                      {onPlayItem && item.outputFile && (
                        <button
                          onClick={() => onPlayItem(item)}
                          className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:opacity-95 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Çal</span>
                        </button>
                      )}
                      {onOpenFolder && (
                        <button
                          onClick={() => onOpenFolder(item.outputFile)}
                          className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                            isLight
                              ? 'text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                              : 'text-[#aaaaaa] border-white/10 hover:text-white hover:bg-white/10'
                          }`}
                          title="Klasörde Göster"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  {isError && (
                    <button
                      onClick={() => onRetry(item)}
                      className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Tekrar Dene"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  {(isDownloading || isConverting || item.status === 'queued') && (
                    <button
                      onClick={() => onCancel(item.id)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        isLight ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-[#aaaaaa] hover:text-[#ff4e45] hover:bg-white/10'
                      }`}
                      title="İptal Et"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar & Details */}
              <div className="space-y-1.5">
                <div
                  className={`h-2.5 w-full rounded-full overflow-hidden border relative p-0.5 ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181818] border-white/5'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isError
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(item.percent, 3))}%` }}
                  />
                </div>

                {/* Progress Details */}
                <div className={`flex items-center justify-between text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-[#aaaaaa]'}`}>
                  <span className="flex items-center gap-1">
                    {isConverting ? (
                      <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1 font-semibold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dönüştürülüyor...
                      </span>
                    ) : isDownloading ? (
                      <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        İndiriliyor: %{item.percent}
                      </span>
                    ) : isCompleted ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <FileCheck className="w-3.5 h-3.5" /> Tamamlandı
                      </span>
                    ) : isError ? (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> {item.error || 'Hata Oluştu'}
                      </span>
                    ) : (
                      <span>Kuyrukta</span>
                    )}
                  </span>

                  {isDownloading && (
                    <div className="flex items-center gap-3">
                      {item.speed && (
                        <span className={`flex items-center gap-1 font-mono ${isLight ? 'text-slate-700' : 'text-[#f1f1f1]'}`}>
                          <Gauge className="w-3.5 h-3.5" /> {item.speed}
                        </span>
                      )}
                      {item.eta && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" /> {item.eta}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
