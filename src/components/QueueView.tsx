import React from 'react';
import { DownloadItem } from '../types';
import {
  X,
  RefreshCw,
  Clock,
  Gauge,
  HardDrive,
  FileCheck,
  AlertCircle,
  Folder,
  Play,
  Music,
  Video,
  ListOrdered,
} from 'lucide-react';

interface QueueViewProps {
  queue: DownloadItem[];
  onCancel: (id: string) => void;
  onRetry: (item: DownloadItem) => void;
  onClearCompleted: () => void;
  onOpenFolder?: (filePath?: string) => void;
  onPlayItem?: (item: DownloadItem) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  onCancel,
  onRetry,
  onClearCompleted,
  onOpenFolder,
  onPlayItem,
}) => {
  const activeDownloads = queue.filter(
    (i) => i.status === 'downloading' || i.status === 'converting' || i.status === 'queued'
  );
  const completedOrFailed = queue.filter(
    (i) => i.status === 'completed' || i.status === 'error' || i.status === 'cancelled'
  );

  if (queue.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-center p-8 glass-panel rounded-2xl border border-white/[0.06]">
        <div className="empty-state-icon-box w-16 h-16 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-glow-purple/20">
          <ListOrdered className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Queue is Empty</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          No active or pending downloads. Paste a YouTube link in the Downloader tab to start fast downloading.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Download Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {activeDownloads.length} active
            </span>
          </h2>
        </div>

        {completedOrFailed.length > 0 && (
          <button
            onClick={onClearCompleted}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer"
          >
            Clear Finished
          </button>
        )}
      </div>

      {/* Active Downloads Section */}
      <div className="space-y-3">
        {queue.map((item) => {
          const isAudio = item.formatType !== 'video';
          const isDownloading = item.status === 'downloading';
          const isConverting = item.status === 'converting';
          const isCompleted = item.status === 'completed';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-4 border border-white/[0.06] space-y-3 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {isAudio ? <Music className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-white">
                      {isAudio ? item.formatType.toUpperCase() : `${item.quality}p`}
                    </span>
                  </div>

                  {/* Title and Uploader */}
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate max-w-md">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.uploader}
                    </p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted && (
                    <>
                      {onPlayItem && item.outputFile && (
                        <button
                          onClick={() => onPlayItem(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play</span>
                        </button>
                      )}
                      {onOpenFolder && (
                        <button
                          onClick={() => onOpenFolder(item.outputFile)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Open folder"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  {isError && (
                    <button
                      onClick={() => onRetry(item)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                      title="Retry"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  {(isDownloading || isConverting || item.status === 'queued') && (
                    <button
                      onClick={() => onCancel(item.id)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isError
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500'
                    }`}
                    style={{ width: `${item.percent}%` }}
                  >
                    {(isDownloading || isConverting) && (
                      <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                    )}
                  </div>
                </div>

                {/* Progress Details */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    {isConverting ? (
                      <span className="text-purple-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Converting to 320kbps...
                      </span>
                    ) : isDownloading ? (
                      <span className="text-purple-300">Downloading {item.percent}%</span>
                    ) : isCompleted ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Completed
                      </span>
                    ) : isError ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {item.error || 'Failed'}
                      </span>
                    ) : (
                      <span>Queued</span>
                    )}
                  </span>

                  {isDownloading && (
                    <div className="flex items-center gap-3">
                      {item.speed && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Gauge className="w-3 h-3 text-purple-400" /> {item.speed}
                        </span>
                      )}
                      {item.eta && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.eta}
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
