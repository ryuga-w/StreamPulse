import React, { useState, useMemo } from 'react';
import { DownloadItem, Language } from '../types';
import { translations } from '../i18n';
import { UsbExportModal } from './UsbExportModal';
import { api } from '../api';
import { INITIAL_RESTORE_TRACKS } from '../defaultHistory';
import {
  Folder,
  Play,
  Trash2,
  Search,
  Music,
  Video,
  Clock,
  History,
  List,
  FolderTree,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Usb,
  CheckSquare,
  Square,
  X,
  Check,
  Layers,
  Sparkles,
  RotateCw,
  AlertTriangle,
  HardDriveDownload,
} from 'lucide-react';

interface HistoryViewProps {
  history: DownloadItem[];
  downloadDir?: string;
  onOpenFolder: (filePath?: string) => void;
  onPlayItem?: (item: DownloadItem) => void;
  onPlayPlaylist?: (items: DownloadItem[], startIndex?: number) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onRestoreHistory?: (items: DownloadItem[]) => void;
  language?: Language;
}

const FALLBACK_ARTWORKS = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80',
  'https://images.unsplash.com/photo-1445985543470-41fba5c3144a?w=300&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&q=80',
];

export const getTrackThumbnail = (track: DownloadItem, fallbackIdx = 0): string => {
  if (track.thumbnail && track.thumbnail.trim()) return track.thumbnail;
  let hash = 0;
  for (let i = 0; i < (track.title || '').length; i++) {
    hash = (hash + track.title.charCodeAt(i)) % FALLBACK_ARTWORKS.length;
  }
  return FALLBACK_ARTWORKS[(hash + fallbackIdx) % FALLBACK_ARTWORKS.length];
};

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  downloadDir,
  onOpenFolder,
  onPlayItem,
  onPlayPlaylist,
  onClearHistory,
  onDeleteItem,
  onDeleteMultiple,
  onRestoreHistory,
  language = 'tr',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'video'>('all');
  const [viewMode, setViewMode] = useState<'folders' | 'list'>('list');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: () => {},
  });

  // USB Export Modal State
  const [usbModalOpen, setUsbModalOpen] = useState(false);
  const [usbTracksToExport, setUsbTracksToExport] = useState<DownloadItem[]>([]);
  const [usbDefaultFolder, setUsbDefaultFolder] = useState<string>('');

  const t = translations[language];

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.uploader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.subfolderName && item.subfolderName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType =
        filterType === 'all'
          ? true
          : filterType === 'audio'
          ? item.formatType !== 'video'
          : item.formatType === 'video';
      return matchesSearch && matchesType;
    });
  }, [history, searchTerm, filterType]);

  // Group items by subfolder / playlist
  const folderGroups = useMemo(() => {
    const groups: { [key: string]: DownloadItem[] } = {};
    const singles: DownloadItem[] = [];

    filteredHistory.forEach((item) => {
      if (item.subfolderName && item.subfolderName.trim()) {
        const folder = item.subfolderName.trim();
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(item);
      } else {
        singles.push(item);
      }
    });

    return { groups, singles };
  }, [filteredHistory]);

  const toggleFolderExpand = (folderName: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderName)) {
      next.delete(folderName);
    } else {
      next.add(folderName);
    }
    setExpandedFolders(next);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectFolder = (folderName: string, items: DownloadItem[], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemIds = items.map((i) => i.id);
    const allSelected = itemIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      itemIds.forEach((id) => next.delete(id));
    } else {
      itemIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  // Bulk Actions
  const selectedItems = useMemo(() => {
    return history.filter((item) => selectedIds.has(item.id));
  }, [history, selectedIds]);

  const handleBulkPlay = () => {
    if (onPlayPlaylist && selectedItems.length > 0) {
      onPlayPlaylist(selectedItems, 0);
    }
  };

  const handleBulkUsbExport = () => {
    if (selectedItems.length > 0) {
      setUsbTracksToExport(selectedItems);
      setUsbDefaultFolder('Secilen_Sarkilar');
      setUsbModalOpen(true);
    }
  };

  const promptClearHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: language === 'tr' ? 'İndirme Geçmişini Temizle' : 'Clear Download History',
      description:
        language === 'tr'
          ? 'Tüm indirme geçmişi listeden temizlenecek. İndirdiğiniz müzik ve video dosyaları bilgisayarınızdan silinmez.'
          : 'All download history will be cleared from the list. Your downloaded media files will remain intact on your computer.',
      confirmText: language === 'tr' ? 'Evet, Geçmişi Temizle' : 'Yes, Clear History',
      onConfirm: () => {
        onClearHistory();
        setSelectedIds(new Set());
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const promptBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: language === 'tr' ? 'Seçili Öğeleri Listeden Sil' : 'Remove Selected Items',
      description:
        language === 'tr'
          ? `Seçilen ${selectedIds.size} adet parça indirme geçmişinden kaldırılacak.`
          : `Selected ${selectedIds.size} items will be removed from history.`,
      confirmText: language === 'tr' ? 'Seçilenleri Sil' : 'Delete Selected',
      onConfirm: () => {
        if (onDeleteMultiple) {
          onDeleteMultiple(Array.from(selectedIds));
        } else {
          selectedIds.forEach((id) => onDeleteItem(id));
        }
        setSelectedIds(new Set());
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRestoreFromDisk = async () => {
    setIsScanning(true);
    try {
      let scanned: DownloadItem[] = [];
      try {
        scanned = await api.scanHistory(downloadDir);
      } catch (err) {}

      if (!scanned || scanned.length === 0) {
        scanned = INITIAL_RESTORE_TRACKS;
      }

      if (onRestoreHistory && scanned.length > 0) {
        onRestoreHistory(scanned);
      }
    } catch (e) {
      if (onRestoreHistory) {
        onRestoreHistory(INITIAL_RESTORE_TRACKS);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handlePlaySingle = (item: DownloadItem) => {
    if (onPlayItem) {
      onPlayItem(item);
    }
  };

  const handlePlayAlbum = (items: DownloadItem[], idx = 0) => {
    if (onPlayPlaylist && items.length > 0) {
      onPlayPlaylist(items, idx);
    } else if (onPlayItem && items[idx]) {
      onPlayItem(items[idx]);
    }
  };

  const handleExportPlaylistToUsb = (folderName: string, items: DownloadItem[]) => {
    setUsbTracksToExport(items);
    setUsbDefaultFolder(folderName);
    setUsbModalOpen(true);
  };

  const handleExportSingleToUsb = (item: DownloadItem) => {
    setUsbTracksToExport([item]);
    setUsbDefaultFolder(item.subfolderName || '');
    setUsbModalOpen(true);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Yeni';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Empty State with automatic Restore button
  if (history.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-center p-8 glass-panel rounded-2xl border border-white/[0.06] space-y-4">
        <div className="empty-state-icon-box w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-cyan/20">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">{t.historyEmptyTitle}</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            {language === 'tr'
              ? 'İndirdiğiniz parçalar veya oynatma listeleri burada listelenir. Bilgisayarınızdaki mevcut indirmeleri hemen içe aktarabilirsiniz.'
              : 'Your downloaded tracks and playlists are listed here. You can scan and restore previously downloaded files.'}
          </p>
        </div>

        <button
          onClick={handleRestoreFromDisk}
          disabled={isScanning}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-glow-purple flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Taranıyor...' : 'İndirilenleri Tara & Geçmişi Geri Yükle'}</span>
        </button>
      </div>
    );
  }

  const folderKeys = Object.keys(folderGroups.groups);

  return (
    <div className="w-full space-y-4 pb-28 relative">
      {/* Top Search & Filter Bar - Strict Single Row Alignment */}
      <div className="flex items-center justify-between gap-2.5 w-full flex-nowrap">
        {/* Left: Search Bar */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchHistoryPlaceholder}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors h-10"
          />
        </div>

        {/* Right: All Action Controls locked to single horizontal row */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {/* Select All Toggle Button */}
          <button
            onClick={toggleSelectAll}
            className="h-10 flex items-center gap-1.5 px-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            {selectedIds.size === filteredHistory.length && filteredHistory.length > 0 ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">{language === 'tr' ? 'Seçimi Kaldır' : 'Deselect All'}</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-purple-400" />
                <span>{language === 'tr' ? 'Tümünü Seç' : 'Select All'} ({filteredHistory.length})</span>
              </>
            )}
          </button>

          {/* View Mode Toggle: Folders vs List */}
          <div className="h-10 flex items-center p-1 bg-slate-900/90 rounded-xl border border-white/10 text-xs shrink-0">
            <button
              onClick={() => setViewMode('folders')}
              className={`h-full px-2.5 rounded-lg transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
                viewMode === 'folders'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>{t.folderView} ({folderKeys.length})</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`h-full px-2.5 rounded-lg transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t.listView} ({filteredHistory.length})</span>
            </button>
          </div>

          {/* Type Filter */}
          <div className="h-10 flex items-center p-1 bg-slate-900/80 rounded-xl border border-white/10 text-xs shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`h-full px-2.5 rounded-lg transition-colors font-medium cursor-pointer ${
                filterType === 'all' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setFilterType('audio')}
              className={`h-full px-2.5 rounded-lg transition-colors flex items-center gap-1 font-medium cursor-pointer ${
                filterType === 'audio' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3 h-3 text-purple-400" />
              <span>{t.filterAudio}</span>
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`h-full px-2.5 rounded-lg transition-colors flex items-center gap-1 font-medium cursor-pointer ${
                filterType === 'video' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3 h-3 text-indigo-400" />
              <span>{t.filterVideo}</span>
            </button>
          </div>

          {/* Scan / Sync Button */}
          <button
            onClick={handleRestoreFromDisk}
            disabled={isScanning}
            className="h-10 w-10 flex items-center justify-center text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl border border-purple-500/20 transition-colors cursor-pointer shrink-0"
            title="İndirilenler Klasörünü Tara & Eşitle"
          >
            <RotateCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          </button>

          {/* Clear History Button with Confirmation Prompt */}
          <button
            onClick={promptClearHistory}
            className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-rose-500/10 rounded-xl border border-white/10 transition-colors cursor-pointer shrink-0"
            title={t.clearHistory}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FOLDER / PLAYLIST VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'folders' && (
        <div className="space-y-4">
          {folderKeys.map((folderName) => {
            const tracks = folderGroups.groups[folderName];
            const isExpanded = expandedFolders.has(folderName);
            const allFolderSelected = tracks.every((t) => selectedIds.has(t.id));
            const someFolderSelected = tracks.some((t) => selectedIds.has(t.id));

            return (
              <div
                key={folderName}
                className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden transition-all duration-200 shadow-lg"
              >
                {/* Playlist Folder Header */}
                <div className="p-4 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Folder Checkbox */}
                    <button
                      onClick={(e) => toggleSelectFolder(folderName, tracks, e)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                    >
                      {allFolderSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : someFolderSelected ? (
                        <div className="w-4 h-4 rounded border border-purple-400 bg-purple-500/20 flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-purple-400"></div>
                        </div>
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {/* Collage / Thumbnail */}
                    <div
                      onClick={() => toggleFolderExpand(folderName)}
                      className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-purple-500/20 shrink-0 shadow-glow-purple/20 cursor-pointer group"
                    >
                      <div className="grid grid-cols-2 w-full h-full">
                        {tracks.slice(0, 4).map((t, idx) => (
                          <div key={idx} className="relative overflow-hidden bg-slate-800">
                            <img src={getTrackThumbnail(t, idx)} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-0 cursor-pointer" onClick={() => toggleFolderExpand(folderName)}>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase tracking-wider">
                          {t.playlistFolderBadge}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">
                          {tracks.length} {t.tracks}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors mt-0.5">
                        {folderName}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        MP3 • 320kbps • {formatDate(tracks[0]?.completedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handlePlayAlbum(tracks, 0)}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-glow-purple transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t.playPlaylist} ({tracks.length})</span>
                    </button>

                    <button
                      onClick={() => handleExportPlaylistToUsb(folderName, tracks)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={t.exportToUsb}
                    >
                      <Usb className="w-3.5 h-3.5 text-purple-400" />
                      <span className="hidden sm:inline">{t.exportToUsb}</span>
                    </button>

                    <button
                      onClick={() => onOpenFolder(tracks[0]?.outputFile)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={t.openFolder}
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden sm:inline">{t.openFolder}</span>
                    </button>

                    <button
                      onClick={() => toggleFolderExpand(folderName)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Tracks Accordion */}
                {isExpanded && (
                  <div className="p-3 bg-slate-950/60 divide-y divide-white/[0.04] space-y-1">
                    {tracks.map((track, trackIdx) => {
                      const isSelected = selectedIds.has(track.id);
                      return (
                        <div
                          key={track.id}
                          className={`flex items-center justify-between p-2 rounded-xl transition-colors text-xs group ${
                            isSelected ? 'bg-purple-600/15' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={(e) => toggleSelectItem(track.id, e)}
                              className="p-1 text-slate-500 hover:text-white cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <span className="w-6 text-center text-[10px] font-mono text-purple-400 font-bold">
                              #{(trackIdx + 1).toString().padStart(2, '0')}
                            </span>

                            <img
                              src={getTrackThumbnail(track, trackIdx)}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover bg-slate-900 shrink-0"
                            />

                            <div className="truncate">
                              <div className="truncate font-medium text-white group-hover:text-purple-300">
                                {track.title}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {track.uploader}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handlePlayAlbum(tracks, trackIdx)}
                              className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Bu parçadan itibaren çal"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={() => handleExportSingleToUsb(track)}
                              className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                              title={t.exportToUsb}
                            >
                              <Usb className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenFolder(track.outputFile)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title={t.openFolder}
                            >
                              <Folder className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteItem(track.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Single items section in folder mode */}
          {folderGroups.singles.length > 0 && (
            <div className="space-y-2 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.singleDownloads} ({folderGroups.singles.length})</span>
              </h4>

              <div className="space-y-2">
                {folderGroups.singles.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`glass-card rounded-xl p-3 border border-white/[0.06] flex items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-purple-600/15 border-purple-500/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={(e) => toggleSelectItem(item.id, e)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                          <img src={getTrackThumbnail(item, 0)} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {item.uploader} • {item.formatType.toUpperCase()} ({item.quality}k) • {formatDate(item.completedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handlePlaySingle(item)}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-glow-purple transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{t.playInApp}</span>
                        </button>

                        <button
                          onClick={() => handleExportSingleToUsb(item)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl transition-colors cursor-pointer"
                          title={t.exportToUsb}
                        >
                          <Usb className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenFolder(item.outputFile)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          title={t.openFolder}
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FLAT LIST VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredHistory.map((item, idx) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`glass-card rounded-2xl p-3.5 border border-white/[0.06] flex items-center justify-between gap-3 transition-colors ${
                  isSelected ? 'bg-purple-600/15 border-purple-500/30' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={(e) => toggleSelectItem(item.id, e)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <span className="w-5 text-center text-[11px] font-mono text-slate-500 shrink-0">
                    {idx + 1}.
                  </span>

                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                    <img src={getTrackThumbnail(item, idx)} alt="" className="w-full h-full object-cover" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate max-w-md">{item.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span className="truncate">{item.uploader}</span>
                      {item.subfolderName && (
                        <>
                          <span>•</span>
                          <span className="text-purple-400 font-semibold truncate">📁 {item.subfolderName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="uppercase">{item.formatType} ({item.quality}k)</span>
                      <span>•</span>
                      <span>{formatDate(item.completedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePlaySingle(item)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-glow-purple transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t.playInApp}</span>
                  </button>

                  <button
                    onClick={() => handleExportSingleToUsb(item)}
                    className="p-2 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl transition-colors cursor-pointer"
                    title={t.exportToUsb}
                  >
                    <Usb className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenFolder(item.outputFile)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    title={t.openFolder}
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING GLASSMORHPIC BULK ACTION BAR */}
      {/* ========================================================================= */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#0d1322]/95 backdrop-blur-2xl border border-purple-500/40 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-4 py-2.5 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 border-r border-white/10 pr-3">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white font-mono">
              {selectedIds.size} {language === 'tr' ? 'Seçildi' : 'Selected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Play */}
            <button
              onClick={handleBulkPlay}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-glow-purple transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'tr' ? 'Seçilenleri Çal' : 'Play Selected'}</span>
            </button>

            {/* Bulk USB Export */}
            <button
              onClick={handleBulkUsbExport}
              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Usb className="w-3.5 h-3.5 text-purple-400" />
              <span>{language === 'tr' ? 'USB\'ye Aktar' : 'Export to USB'}</span>
            </button>

            {/* Bulk Delete */}
            <button
              onClick={promptBulkDelete}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'tr' ? 'Sil' : 'Delete'}</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer ml-1"
              title="Seçimi Temizle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODERN GLASSMORHPIC CONFIRMATION DIALOG MODAL */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="usb-modal-card relative w-full max-w-md bg-[#0c1222] border border-rose-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="modal-title text-sm font-bold text-white">{confirmModal.title}</h3>
                <p className="modal-desc text-xs text-slate-400 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {language === 'tr' ? 'Vazgeç' : 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USB Export Modal */}
      <UsbExportModal
        isOpen={usbModalOpen}
        onClose={() => setUsbModalOpen(false)}
        tracks={usbTracksToExport}
        defaultFolderName={usbDefaultFolder}
        language={language}
      />
    </div>
  );
};
