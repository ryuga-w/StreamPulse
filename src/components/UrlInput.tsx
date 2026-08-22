import React, { useState, useEffect } from 'react';
import { Search, Clipboard, ArrowRight, Loader2, X, Music, Video } from 'lucide-react';

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
    <div className="w-full space-y-3 font-['Roboto','YouTube_Sans']">
      {/* Clipboard detected banner */}
      {copiedUrlDetected && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-xs text-[#f1f1f1] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 truncate">
            <Clipboard className="w-4 h-4 text-[#3ea6ff] shrink-0" />
            <span className="truncate">
              Panoda link algılandı: <span className="font-mono text-[#aaaaaa]">{copiedUrlDetected}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleApplyClipboard}
              className="px-3 py-1 bg-white text-[#0f0f0f] hover:bg-[#e5e5e5] font-semibold rounded-full text-xs transition-colors cursor-pointer"
            >
              İncele
            </button>
            <button
              onClick={() => setCopiedUrlDetected(null)}
              className="p-1 hover:bg-white/10 rounded-full text-[#aaaaaa] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* YouTube & Ambient Glow Liquid Aurora Search Bar */}
      <form onSubmit={handleSubmit} className="relative w-full group">
        {/* Soft Ambient Outer Aurora Glow Bloom */}
        <div className="absolute -inset-1 rounded-full gemini-border-glow ambient-outer-glow pointer-events-none"></div>

        {/* Seamless Flowing Gradient Border Wrapper */}
        <div className="relative p-[1.5px] rounded-full gemini-border-glow shadow-2xl transition-all duration-300">
          <div className="flex items-center bg-[#121212] rounded-full p-1 pl-4 backdrop-blur-2xl">
            <div className="text-[#aaaaaa] pr-2 group-focus-within:text-white transition-colors">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube video, şarkı veya oynatma listesi linki yapıştırın..."
              className="w-full bg-transparent text-sm text-[#f1f1f1] placeholder-[#717171] focus:outline-none py-1.5 font-normal"
              disabled={isLoading}
            />

            <div className="flex items-center gap-1.5 pr-1 shrink-0">
              {url ? (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Temizle"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#aaaaaa] hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                  title="Panodan Yapıştır"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Yapıştır</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#f1f1f1] hover:bg-white disabled:opacity-30 disabled:hover:bg-[#f1f1f1] text-[#0f0f0f] text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analiz Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <span>İncele</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Feature tags under input */}
      <div className="flex items-center justify-between text-[11px] text-[#717171] px-3 pt-0.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-[#aaaaaa]" />
            <span>MP3 (320kbps Stüdyo), FLAC, M4A</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-[#aaaaaa]" />
            <span>Video (4K, 1080p 60fps, 720p)</span>
          </div>
        </div>

        <div className="hidden sm:block text-[#717171]">
          YouTube, YouTube Music & Çalma Listeleri
        </div>
      </div>
    </div>
  );
};
