import React, { useState, useEffect } from 'react';
import { Search, Clipboard, ArrowRight, Loader2, X, Music, Video, Sparkles } from 'lucide-react';

interface UrlInputProps {
  onFetch: (url: string) => Promise<void>;
  isLoading: boolean;
  autoClipboard: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({
  onFetch,
  isLoading,
  autoClipboard,
}) => {
  const [url, setUrl] = useState('');
  const [copiedUrlDetected, setCopiedUrlDetected] = useState<string | null>(null);

  // Check clipboard periodically if autoClipboard is true
  useEffect(() => {
    if (!autoClipboard) return;

    const checkClip = async () => {
      if (window.electronAPI) {
        const clipUrl = await window.electronAPI.readClipboard();
        if (clipUrl && clipUrl !== url && clipUrl !== copiedUrlDetected) {
          setCopiedUrlDetected(clipUrl);
        }
      }
    };

    const interval = setInterval(checkClip, 2500);
    return () => clearInterval(interval);
  }, [autoClipboard, url, copiedUrlDetected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onFetch(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      let text = '';
      if (window.electronAPI) {
        text = (await window.electronAPI.readClipboard()) || '';
      }
      if (!text) {
        text = await navigator.clipboard.readText();
      }
      if (text) {
        setUrl(text.trim());
        setCopiedUrlDetected(null);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleApplyClipboard = () => {
    if (copiedUrlDetected) {
      setUrl(copiedUrlDetected);
      onFetch(copiedUrlDetected);
      setCopiedUrlDetected(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Clipboard detected banner */}
      {copiedUrlDetected && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/50 border border-purple-500/40 text-xs text-purple-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">
              Panoda link algılandı: <span className="font-mono text-purple-300">{copiedUrlDetected}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleApplyClipboard}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              Analiz Et
            </button>
            <button
              onClick={() => setCopiedUrlDetected(null)}
              className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Google Gemini Style Input Bar with Continuous Liquid Glow */}
      <form onSubmit={handleSubmit} className="relative group">
        {/* Soft Ambient Outer Aurora Glow */}
        <div className="absolute -inset-1 rounded-2xl gemini-border-glow blur-xl opacity-35 group-hover:opacity-65 group-focus-within:opacity-90 transition-opacity duration-500 pointer-events-none"></div>

        {/* Seamless Flowing Gemini Border Wrapper */}
        <div className="relative p-[1.5px] rounded-2xl gemini-border-glow shadow-2xl transition-all duration-300">
          <div className="url-input-container flex items-center bg-[#0d1322] rounded-[15px] p-1.5 backdrop-blur-2xl">
            <div className="pl-3.5 pr-2 text-slate-400">
              <Search className="w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
            </div>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube Video or Playlist link here... (e.g. https://www.youtube.com/watch?v=...)"
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none px-2 py-2 font-normal"
              disabled={isLoading}
            />

            <div className="flex items-center gap-1.5 pr-1 shrink-0">
              {url ? (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                  title="Temizle"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="paste-btn flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer"
                  title="Panodan Yapıştır"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Yapıştır</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:hover:from-purple-600 disabled:hover:to-pink-600 !text-white text-xs font-bold shadow-glow-purple transition-all duration-300 cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="text-white font-bold">Analiz Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <span className="text-white font-bold">Analiz Et</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Feature tags under input */}
      <div className="feature-tags-bar flex items-center justify-between text-[11px] text-slate-400 px-2 pt-0.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span className="tag-text">MP3 (320kbps Studio / FLAC / WAV / M4A)</span>
          </div>
          <span className="text-slate-600 dot-sep">•</span>
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span className="tag-text">Video (4K, 1440p, 1080p 60fps, 720p)</span>
          </div>
        </div>

        <div className="hidden sm:block text-slate-500 tag-secondary">
          YouTube / Music / Shorts / Playlists
        </div>
      </div>
    </div>
  );
};
