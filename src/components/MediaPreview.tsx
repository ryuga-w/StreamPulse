import React, { useState, useMemo } from 'react';
import { VideoMetadata, FormatType, PlaylistEntry } from '../types';
import {
  Music,
  Video,
  Download,
  Clock,
  Eye,
  User,
  ListMusic,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  FolderPlus,
  Search,
  Hash,
  Film,
  Check,
} from 'lucide-react';

interface MediaPreviewProps {
  metadata: VideoMetadata;
  onDownload: (options: {
    url: string;
    title: string;
    uploader: string;
    thumbnail: string;
    duration: number;
    formatType: FormatType;
    quality: string;
  }) => void;
  onDownloadPlaylist?: (
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
  ) => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  metadata,
  onDownload,
  onDownloadPlaylist,
}) => {
  const [formatType, setFormatType] = useState<FormatType>('mp3');
  const [quality, setQuality] = useState<string>('320');
  const [createSubfolder, setCreateSubfolder] = useState(true);
  const [prependTrackNumber, setPrependTrackNumber] = useState(true);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(
    new Set((metadata.entries || []).map((e) => e.id))
  );

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatViews = (views: number) => {
    if (!views) return '0';
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return views.toLocaleString();
  };

  const audioQualities = [
    { label: '320 kbps (Extreme / Studio)', value: '320', format: 'mp3', badge: 'Ultra' },
    { label: '256 kbps (High Quality)', value: '256', format: 'mp3' },
    { label: '192 kbps (Standard)', value: '192', format: 'mp3' },
    { label: '128 kbps (Eco / Compact)', value: '128', format: 'mp3' },
    { label: 'FLAC (Lossless Hi-Res)', value: '0', format: 'flac', badge: 'Lossless' },
    { label: 'WAV (Uncompressed PCM)', value: '0', format: 'wav' },
    { label: 'M4A / AAC (Apple Compatible)', value: '256', format: 'm4a' },
  ];

  // Filtered playlist entries
  const filteredEntries = useMemo(() => {
    if (!metadata.entries) return [];
    if (!playlistSearch.trim()) return metadata.entries;
    const q = playlistSearch.toLowerCase();
    return metadata.entries.filter(
      (e) => e.title.toLowerCase().includes(q) || (e.uploader && e.uploader.toLowerCase().includes(q))
    );
  }, [metadata.entries, playlistSearch]);

  // Playlist stats
  const playlistStats = useMemo(() => {
    if (!metadata.entries) return { totalSeconds: 0, totalTracks: 0 };
    const selectedEntries = metadata.entries.filter((e) => selectedPlaylistIds.has(e.id));
    const totalSeconds = selectedEntries.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    return {
      totalSeconds,
      totalTracks: selectedEntries.length,
    };
  }, [metadata.entries, selectedPlaylistIds]);

  const handleStartDownload = () => {
    if (metadata.isPlaylist && metadata.entries && metadata.entries.length > 0) {
      const subfolderName = createSubfolder ? metadata.title : undefined;

      const itemsToDownload = metadata.entries
        .filter((entry) => selectedPlaylistIds.has(entry.id))
        .map((entry, idx) => {
          const trackNum = (idx + 1).toString().padStart(2, '0');
          const filenameTemplate = prependTrackNumber
            ? `${trackNum} - %(title)s.%(ext)s`
            : '%(title)s.%(ext)s';

          return {
            url: entry.url,
            title: entry.title,
            uploader: entry.uploader || metadata.uploader,
            thumbnail: entry.thumbnail || metadata.thumbnail,
            duration: entry.duration,
            formatType,
            quality,
            subfolderName,
            filenameTemplate,
          };
        });

      if (onDownloadPlaylist) {
        onDownloadPlaylist(itemsToDownload);
      }
    } else {
      onDownload({
        url: metadata.originalUrl,
        title: metadata.title,
        uploader: metadata.uploader,
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        formatType,
        quality,
      });
    }
  };

  const togglePlaylistSelectAll = () => {
    if (selectedPlaylistIds.size === (metadata.entries?.length || 0)) {
      setSelectedPlaylistIds(new Set());
    } else {
      setSelectedPlaylistIds(new Set((metadata.entries || []).map((e) => e.id)));
    }
  };

  const togglePlaylistEntry = (id: string) => {
    const next = new Set(selectedPlaylistIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPlaylistIds(next);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-6 border border-white/[0.08] shadow-2xl space-y-6">
      {/* Top Banner / Video & Playlist Header */}
      <div className="flex flex-col md:flex-row gap-5 items-start">
        <div className="relative w-full md:w-64 h-36 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 shadow-lg group">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Film className="w-10 h-10" />
            </div>
          )}

          {metadata.duration > 0 && !metadata.isPlaylist && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-mono text-white flex items-center gap-1 border border-white/10">
              <Clock className="w-3 h-3 text-purple-400" />
              <span>{formatDuration(metadata.duration)}</span>
            </div>
          )}

          {metadata.isPlaylist && (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5 shadow-glow-purple">
              <ListMusic className="w-4 h-4" />
              <span>{metadata.videoCount || metadata.entries?.length} Parça</span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2.5 min-w-0">
          <div className="flex items-center gap-2">
            {metadata.isPlaylist && (
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                Oynatma Listesi
              </span>
            )}
            <h2 className="text-base font-bold text-white leading-snug line-clamp-2">
              {metadata.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-purple-300 font-medium">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span className="truncate max-w-[180px]">{metadata.uploader}</span>
            </div>

            {metadata.isPlaylist ? (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Toplam Süre: {formatDuration(playlistStats.totalSeconds)}</span>
              </div>
            ) : (
              metadata.viewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatViews(metadata.viewCount)} görüntülenme</span>
                </div>
              )
            )}
          </div>

          <p className="text-xs text-slate-400/80 line-clamp-2 leading-relaxed">
            {metadata.description || (metadata.isPlaylist ? 'Toplu indirilebilir YouTube oynatma listesi.' : 'Açıklama bulunmuyor.')}
          </p>
        </div>
      </div>

      {/* Format & Quality Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Medya Türü</span>
          </label>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl border border-white/5">
            <button
              onClick={() => {
                setFormatType('mp3');
                setQuality('320');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                formatType !== 'video'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Ses (MP3 / Lossless)</span>
            </button>

            <button
              onClick={() => {
                setFormatType('video');
                setQuality(metadata.resolutions[0]?.toString() || '1080');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                formatType === 'video'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-glow-cyan/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video (MP4 / HD)</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Çıkış Kalitesi & Bitrate</span>
          </label>

          {formatType !== 'video' ? (
            <select
              value={`${formatType}:${quality}`}
              onChange={(e) => {
                const [fmt, q] = e.target.value.split(':');
                setFormatType(fmt as FormatType);
                setQuality(q);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
            >
              {audioQualities.map((q) => (
                <option key={`${q.format}:${q.value}`} value={`${q.format}:${q.value}`}>
                  {q.label} {q.badge ? `[${q.badge}]` : ''}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="best">En Yüksek Mevcut Kalite (Otomatik 4K/1080p)</option>
              {metadata.resolutions.map((res) => (
                <option key={res} value={res.toString()}>
                  {res}p {res >= 2160 ? '(4K Ultra HD)' : res >= 1080 ? '(Full HD 1080p 60fps)' : res >= 720 ? '(HD 720p)' : '(SD)'}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Playlist Controls & Batch Options */}
      {metadata.isPlaylist && metadata.entries && metadata.entries.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/[0.06] bg-slate-950/30 p-4 rounded-2xl border border-purple-500/15">
          {/* Subfolder & Track numbering checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2.5 bg-slate-900/80 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
              <input
                type="checkbox"
                checked={createSubfolder}
                onChange={(e) => setCreateSubfolder(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
              <div className="flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-purple-400" />
                <span>Oynatma Listesi İçin Özel Klasör Oluştur</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-2.5 bg-slate-900/80 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
              <input
                type="checkbox"
                checked={prependTrackNumber}
                onChange={(e) => setPrependTrackNumber(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
              <div className="flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span>Şarkı Numarası Ekle (01 - Şarkı Adı.mp3)</span>
              </div>
            </label>
          </div>

          {/* Search inside playlist & Bulk toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={playlistSearch}
                onChange={(e) => setPlaylistSearch(e.target.value)}
                placeholder="Liste içinde şarkı veya sanatçı ara..."
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-slate-400">
                Seçili: <strong className="text-purple-300 font-mono">{selectedPlaylistIds.size}</strong> / {metadata.entries.length}
              </span>

              <button
                onClick={togglePlaylistSelectAll}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-medium px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
              >
                {selectedPlaylistIds.size === metadata.entries.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Tümünü Kaldır</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Tümünü Seç ({metadata.entries.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Track list */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-2 bg-slate-950/60 p-2 rounded-xl border border-white/5">
            {filteredEntries.map((entry, index) => {
              const isSelected = selectedPlaylistIds.has(entry.id);
              const trackNum = (entry.index || index + 1).toString().padStart(2, '0');
              return (
                <div
                  key={entry.id}
                  onClick={() => togglePlaylistEntry(entry.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isSelected
                      ? 'bg-purple-950/50 border border-purple-500/30 text-white shadow-sm'
                      : 'hover:bg-white/5 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-glow-purple'
                          : 'bg-slate-800 text-slate-500 border border-white/5'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : trackNum}
                    </div>

                    {entry.thumbnail && (
                      <img
                        src={entry.thumbnail}
                        alt={entry.title}
                        className="w-10 h-7 rounded object-cover bg-slate-800 shrink-0"
                      />
                    )}

                    <div className="truncate">
                      <div className="font-medium text-white truncate">{entry.title}</div>
                      {entry.uploader && (
                        <div className="text-[10px] text-slate-400 truncate">{entry.uploader}</div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-purple-300 shrink-0 ml-3">
                    {formatDuration(entry.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Download Button */}
      <div className="pt-2">
        <button
          onClick={handleStartDownload}
          disabled={metadata.isPlaylist && selectedPlaylistIds.size === 0}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-sm shadow-glow-purple flex items-center justify-center gap-2.5 transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          <span>
            {metadata.isPlaylist
              ? `📁 Klasör Halinde İndir (${selectedPlaylistIds.size} Parça • ${formatType.toUpperCase()})`
              : `Hemen İndir (${formatType.toUpperCase()} - ${formatType === 'video' ? (quality === 'best' ? 'Best' : `${quality}p`) : `${quality === '0' ? 'Lossless' : `${quality}kbps`}`})`}
          </span>
        </button>
      </div>
    </div>
  );
};
