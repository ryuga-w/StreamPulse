import React, { useState, useRef, useEffect } from 'react';
import { DownloadItem, Language } from '../types';
import { api } from '../api';
import { translations } from '../i18n';
import { getTrackThumbnail } from './HistoryView';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  Music,
  Video,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

interface MediaPlayerProps {
  playlist: DownloadItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  language?: Language;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  playlist,
  currentIndex,
  onIndexChange,
  onClose,
  language = 'tr',
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<'off' | 'all' | 'one'>('all');
  const [isShuffled, setIsShuffled] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [resolvedPath, setResolvedPath] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentItem = playlist[currentIndex] || null;
  const isVideo = currentItem?.formatType === 'video';
  const activeMedia = isVideo ? videoRef.current : audioRef.current;
  const t = translations[language];

  // Resolve exact file path when current item changes
  useEffect(() => {
    let isMounted = true;
    if (currentItem && currentItem.outputFile) {
      setIsPlaying(true);
      setCurrentTime(0);
      setHasError(false);

      api.resolveMediaFile(currentItem.outputFile, currentItem.title).then((exactPath) => {
        if (isMounted && exactPath) {
          setResolvedPath(exactPath);
        } else if (isMounted) {
          setResolvedPath(currentItem.outputFile || '');
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [currentItem?.id, currentItem?.outputFile]);

  if (!currentItem || !currentItem.outputFile || playlist.length === 0) {
    return null;
  }

  const effectivePath = resolvedPath || currentItem.outputFile;
  const streamUrl = `http://127.0.0.1:3001/api/stream?file=${encodeURIComponent(effectivePath)}`;

  const hasNext = currentIndex < playlist.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (isShuffled && playlist.length > 1) {
      const nextIdx = Math.floor(Math.random() * playlist.length);
      onIndexChange(nextIdx);
    } else if (hasNext) {
      onIndexChange(currentIndex + 1);
    } else if (loopMode === 'all') {
      onIndexChange(0);
    }
  };

  const handlePrev = () => {
    if (currentTime > 3) {
      if (activeMedia) activeMedia.currentTime = 0;
    } else if (hasPrev) {
      onIndexChange(currentIndex - 1);
    } else if (loopMode === 'all') {
      onIndexChange(playlist.length - 1);
    }
  };

  const togglePlay = () => {
    if (!activeMedia) return;
    if (isPlaying) {
      activeMedia.pause();
    } else {
      activeMedia.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (activeMedia) {
      activeMedia.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (activeMedia) {
      activeMedia.volume = vol;
      activeMedia.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (activeMedia) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      activeMedia.muted = nextMute;
    }
  };

  const skipTime = (seconds: number) => {
    if (activeMedia) {
      activeMedia.currentTime = Math.max(0, Math.min(duration || 100, activeMedia.currentTime + seconds));
    }
  };

  const handleTimeUpdate = () => {
    if (activeMedia) {
      setCurrentTime(activeMedia.currentTime);
      if (activeMedia.duration && !isNaN(activeMedia.duration)) {
        setDuration(activeMedia.duration);
      }
    }
  };

  const handleEnded = () => {
    if (loopMode === 'one') {
      if (activeMedia) {
        activeMedia.currentTime = 0;
        activeMedia.play().catch(() => {});
      }
    } else {
      handleNext();
    }
  };

  const cycleLoopMode = () => {
    if (loopMode === 'off') setLoopMode('all');
    else if (loopMode === 'all') setLoopMode('one');
    else setLoopMode('off');
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (activeMedia) {
      activeMedia.playbackRate = nextRate;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentThumbnail = getTrackThumbnail(currentItem, currentIndex);

  return (
    <>
      {/* Audio Element */}
      {!isVideo && (
        <audio
          ref={audioRef}
          src={streamUrl}
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onCanPlay={() => {
            setHasError(false);
            if (activeMedia && isPlaying) activeMedia.play().catch(() => {});
          }}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Video Modal Player */}
      {isVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border-b border-white/5">
              <div className="flex items-center gap-2.5 truncate">
                <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-semibold text-white truncate">{currentItem.title}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                src={streamUrl}
                autoPlay
                controls
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onEnded={handleEnded}
                onError={() => setHasError(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RIGHT SIDE UP NEXT (SIRADAKİ) QUEUE DRAWER                                */}
      {/* ========================================================================= */}
      {showQueueDrawer && (
        <div className="up-next-drawer-panel fixed bottom-20 right-6 z-50 w-96 max-h-[520px] bg-[#0c1222]/95 border border-purple-500/30 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Drawer Header */}
          <div className="drawer-header p-3.5 bg-purple-950/40 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-purple-400" />
              <h3 className="drawer-title text-xs font-bold text-white">
                {language === 'tr' ? 'Sıradaki Parçalar' : 'Up Next Queue'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                {currentIndex + 1} / {playlist.length}
              </span>
            </div>

            <button
              onClick={() => setShowQueueDrawer(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Drawer Track List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/[0.03]">
            {playlist.map((track, idx) => {
              const isCurrent = idx === currentIndex;
              const trackThumb = getTrackThumbnail(track, idx);
              return (
                <div
                  key={track.id || idx}
                  onClick={() => onIndexChange(idx)}
                  className={`drawer-item flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all text-xs group ${
                    isCurrent
                      ? 'bg-purple-600/20 border border-purple-500/40 text-white shadow-sm'
                      : 'hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 text-center shrink-0">
                      {isCurrent ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <div className="w-0.5 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-0.5 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                          <div className="w-0.5 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-300">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                      <img src={trackThumb} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`truncate text-xs ${
                          isCurrent ? 'font-bold text-purple-300' : 'font-medium text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{track.uploader}</p>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 shrink-0 ml-2">
                    {isCurrent ? formatTime(currentTime) : '320k'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM DOCKED GLASSMORHPIC AUDIO PLAYER BAR */}
      {/* ========================================================================= */}
      {!isVideo && (
        <div className="media-player-dock fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#0a0f1e]/95 backdrop-blur-2xl border-t border-purple-500/30 shadow-[0_-10px_35px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom duration-300 select-none">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Left: Thumbnail & Info - Clicking toggles Right-Side Up Next Drawer */}
            <div
              onClick={() => setShowQueueDrawer(!showQueueDrawer)}
              className="flex items-center gap-3 w-full md:w-1/4 min-w-0 cursor-pointer group"
              title="Sıradaki Parçalar Listesini Aç/Kapat"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0 shadow-glow-purple/30 group-hover:border-purple-500/50 transition-colors">
                <img
                  src={currentThumbnail}
                  alt={currentItem.title}
                  className={`w-full h-full object-cover ${isPlaying ? 'scale-105' : ''} transition-transform duration-500`}
                />
                {isPlaying && !hasError && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                    <div className="w-1 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                    <div className="w-1 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="player-track-title text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                  {currentItem.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-purple-300 mt-0.5 player-track-meta">
                  <span className="truncate">{currentItem.uploader}</span>
                  {currentItem.subfolderName && (
                    <>
                      <span>•</span>
                      <span className="truncate text-indigo-300 font-semibold">📁 {currentItem.subfolderName}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="font-mono uppercase font-semibold text-purple-400">
                    {currentItem.formatType} ({currentItem.quality}k)
                  </span>
                </div>
                {hasError && (
                  <div className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    <span>Dosya yüklenemedi.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center: Controls & Scrubber */}
            <div className="flex-1 w-full max-w-xl space-y-1.5 flex flex-col items-center">
              <div className="flex items-center gap-3">
                {/* Shuffle Button */}
                <button
                  onClick={() => setIsShuffled(!isShuffled)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isShuffled ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                  title={isShuffled ? 'Karışık Çalma: Açık' : 'Karışık Çalma: Kapalı'}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                {/* Previous Track Button */}
                <button
                  onClick={handlePrev}
                  className="player-control-btn p-1.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Önceki Parça (Previous Track)"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                {/* 10s Rewind */}
                <button
                  onClick={() => skipTime(-10)}
                  className="player-control-btn p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="10s Geri"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Play / Pause Primary Button */}
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-glow-purple transition-all duration-200 cursor-pointer"
                  title={isPlaying ? 'Durdur' : 'Oynat'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* 10s Forward */}
                <button
                  onClick={() => skipTime(10)}
                  className="player-control-btn p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="10s İleri"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Next Track Button */}
                <button
                  onClick={handleNext}
                  className="player-control-btn p-1.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Sonraki Parça (Next Track)"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>

                {/* Loop Mode Toggle */}
                <button
                  onClick={cycleLoopMode}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    loopMode !== 'off' ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                  title={
                    loopMode === 'one'
                      ? 'Tek Şarkı Tekrarı'
                      : loopMode === 'all'
                      ? 'Tüm Listeyi Tekrarla'
                      : 'Tekrar Kapalı'
                  }
                >
                  {loopMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                </button>

                {/* Playback Speed Selector */}
                <button
                  onClick={cyclePlaybackRate}
                  className="player-speed-btn px-2 py-0.5 rounded text-[10px] font-mono text-purple-300 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Oynatma Hızı"
                >
                  {playbackRate}x
                </button>
              </div>

              {/* Progress Slider */}
              <div className="w-full flex items-center gap-2.5 text-[10px] font-mono text-slate-400">
                <span className="player-time">{formatTime(currentTime)}</span>
                <div className="relative flex-1 group flex items-center">
                  <input
                    type="range"
                    min="0"
                    max={duration || currentItem.duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                <span className="player-time">{formatTime(duration || currentItem.duration || 0)}</span>
              </div>
            </div>

            {/* Right: Queue Drawer Toggle, Volume & Close */}
            <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
              {/* Up Next Drawer Toggle Button */}
              {playlist.length > 1 && (
                <button
                  onClick={() => setShowQueueDrawer(!showQueueDrawer)}
                  className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    showQueueDrawer
                      ? 'bg-purple-600 border-purple-400 text-white shadow-glow-purple'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-purple-300 hover:text-white'
                  }`}
                  title="Sıradaki Şarkılar Listesini Göster"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">{currentIndex + 1}/{playlist.length}</span>
                  {showQueueDrawer ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>
              )}

              {/* Volume */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <button
                  onClick={toggleMute}
                  className="player-control-btn p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="player-control-btn p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title={t.closePlayer}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
