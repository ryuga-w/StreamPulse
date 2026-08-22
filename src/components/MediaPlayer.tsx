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
  Maximize2,
  Minimize2,
  PictureInPicture,
  Film,
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
  const [videoMode, setVideoMode] = useState<'mini' | 'theater'>('mini');
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

  const toggleNativePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.log('PiP note:', e);
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

      {/* ========================================================================= */}
      {/* MODERN FLOATING PiP & THEATER VIDEO PLAYER (Responsive & Dockable)       */}
      {/* ========================================================================= */}
      {isVideo && (
        <>
          {/* EXPANDED THEATER / MODAL VIDEO MODE */}
          {videoMode === 'theater' && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="relative w-full max-w-4xl bg-[#212121] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                <div className="p-3 bg-[#181818] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Film className="w-4 h-4 text-[#3ea6ff] shrink-0" />
                    <span className="text-xs font-semibold text-white truncate">{currentItem.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={toggleNativePip}
                      className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                      title="Resim İçinde Resim (Native PiP)"
                    >
                      <PictureInPicture className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setVideoMode('mini')}
                      className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                      title="Küçük Kayan Pencereye Küçült"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                      title="Kapat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative bg-black aspect-video max-h-[70vh] flex items-center justify-center">
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

          {/* FLOATING MINI-PLAYER (PiP DOCK ON BOTTOM-RIGHT) */}
          {videoMode === 'mini' && (
            <div className="fixed bottom-20 right-6 z-40 w-80 sm:w-96 bg-[#212121] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-150">
              <div className="p-2.5 px-3 bg-[#181818] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <Film className="w-3.5 h-3.5 text-[#3ea6ff] shrink-0" />
                  <span className="text-[11px] font-semibold text-white truncate max-w-[180px]">
                    {currentItem.title}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleNativePip}
                    className="p-1 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Masaüstü PiP Modu"
                  >
                    <PictureInPicture className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setVideoMode('theater')}
                    className="p-1 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Genişlet (Sinema Modu)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Kapat"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative bg-black aspect-video max-h-56 flex items-center justify-center">
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
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* RIGHT SIDE UP NEXT QUEUE DRAWER                                          */}
      {/* ========================================================================= */}
      {showQueueDrawer && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-h-[520px] bg-[#212121] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-150">
          <div className="p-3 bg-[#181818] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-[#3ea6ff]" />
              <h3 className="text-xs font-semibold text-white">
                {language === 'tr' ? 'Sıradaki Parçalar' : 'Up Next Queue'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                {currentIndex + 1} / {playlist.length}
              </span>
            </div>

            <button
              onClick={() => setShowQueueDrawer(false)}
              className="p-1 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
            {playlist.map((track, idx) => {
              const isCurrent = idx === currentIndex;
              const trackThumb = getTrackThumbnail(track, idx);
              return (
                <div
                  key={track.id || idx}
                  onClick={() => onIndexChange(idx)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all text-xs group ${
                    isCurrent
                      ? 'bg-white/10 text-white'
                      : 'hover:bg-white/5 text-[#aaaaaa]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 text-center shrink-0">
                      {isCurrent ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <div className="w-0.5 h-3 bg-[#ff0000] rounded-full animate-bounce"></div>
                          <div className="w-0.5 h-4 bg-[#3ea6ff] rounded-full animate-bounce [animation-delay:0.15s]"></div>
                          <div className="w-0.5 h-2 bg-[#ff0000] rounded-full animate-bounce [animation-delay:0.3s]"></div>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] text-[#717171]">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#181818] shrink-0">
                      <img src={trackThumb} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`truncate text-xs ${
                          isCurrent ? 'font-semibold text-white' : 'font-normal text-white/90'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-[#aaaaaa] truncate mt-0.5">{track.uploader}</p>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-[#aaaaaa] shrink-0 ml-2">
                    {isCurrent ? formatTime(currentTime) : '320k'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM DOCKED YOUTUBE MUSIC PLAYER BAR                                   */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 px-4 bg-[#212121] border-t border-white/10 shadow-2xl select-none font-['Roboto','YouTube_Sans']">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Thumbnail & Info */}
          <div
            onClick={() => {
              if (isVideo) {
                setVideoMode(videoMode === 'mini' ? 'theater' : 'mini');
              } else {
                setShowQueueDrawer(!showQueueDrawer);
              }
            }}
            className="flex items-center gap-3 w-full md:w-1/4 min-w-0 cursor-pointer group"
            title={isVideo ? 'Video Boyutunu Değiştir' : 'Sıradaki Parçalar Listesini Aç/Kapat'}
          >
            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#181818] border border-white/10 shrink-0">
              <img
                src={currentThumbnail}
                alt={currentItem.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && !hasError && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                  <div className="w-0.5 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-0.5 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-0.5 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate">
                {currentItem.title}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-[#aaaaaa] mt-0.5">
                <span className="truncate">{currentItem.uploader}</span>
                {currentItem.subfolderName && (
                  <>
                    <span>•</span>
                    <span className="truncate text-purple-400 font-medium">{currentItem.subfolderName}</span>
                  </>
                )}
                <span>•</span>
                <span className="font-mono uppercase text-[#717171]">
                  {currentItem.formatType} ({currentItem.quality}{isVideo ? 'p' : 'k'})
                </span>
              </div>
              {hasError && (
                <div className="text-[10px] text-[#ff4e45] flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>Dosya yüklenemedi.</span>
                </div>
              )}
            </div>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="flex-1 w-full max-w-xl space-y-1 flex flex-col items-center">
            <div className="flex items-center gap-3">
              {/* Shuffle Button */}
              <button
                onClick={() => setIsShuffled(!isShuffled)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isShuffled ? 'text-purple-400 bg-purple-500/20' : 'text-[#aaaaaa] hover:text-white'
                }`}
                title={isShuffled ? 'Karışık Çalma: Açık' : 'Karışık Çalma: Kapalı'}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              {/* Previous Track Button */}
              <button
                onClick={handlePrev}
                className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Önceki Parça"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* 10s Rewind */}
              <button
                onClick={() => skipTime(-10)}
                className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="10s Geri"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-md"
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
                className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="10s İleri"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Next Track Button */}
              <button
                onClick={handleNext}
                className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Sonraki Parça"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Loop Mode Toggle */}
              <button
                onClick={cycleLoopMode}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  loopMode !== 'off' ? 'text-purple-400 bg-purple-500/20' : 'text-[#aaaaaa] hover:text-white'
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
                className="px-2 py-0.5 rounded-full text-[10px] font-mono text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 transition-colors cursor-pointer"
                title="Oynatma Hızı"
              >
                {playbackRate}x
              </button>
            </div>

            {/* Progress Slider */}
            <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-[#aaaaaa]">
              <span>{formatTime(currentTime)}</span>
              <div className="relative flex-1 group flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || currentItem.duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-[#303030] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <span>{formatTime(duration || currentItem.duration || 0)}</span>
            </div>
          </div>

          {/* Right: Queue / Mode Toggle, Volume & Close */}
          <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
            {/* Up Next Drawer Toggle Button */}
            {playlist.length > 1 && (
              <button
                onClick={() => setShowQueueDrawer(!showQueueDrawer)}
                className={`px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                  showQueueDrawer
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
                title="Sıradaki Parçalar Listesini Göster"
              >
                <ListMusic className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-mono">{currentIndex + 1}/{playlist.length}</span>
                {showQueueDrawer ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {/* Volume */}
            <div className="flex items-center gap-1.5 text-[#aaaaaa]">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#ff4e45]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-purple-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-[#303030] rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title={t.closePlayer}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
