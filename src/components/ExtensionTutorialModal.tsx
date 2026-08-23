import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Copy,
  Check,
  Puzzle,
  Zap,
  Sliders,
  Music2,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';
import { api } from '../api';

interface ExtensionTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const ExtensionTutorialModal: React.FC<ExtensionTutorialModalProps> = ({
  isOpen,
  onClose,
  language = 'tr',
}) => {
  const [copied, setCopied] = useState(false);
  const [folderOpening, setFolderOpening] = useState(false);
  const t = translations[language];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText('chrome://extensions');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {}
  };

  const handleOpenFolder = async () => {
    setFolderOpening(true);
    try {
      await api.openExtensionFolder();
    } finally {
      setTimeout(() => setFolderOpening(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#121214] border border-[#2a2a30] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#e0e0e6] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-pink-950/30 border-b border-[#282830] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                {t.extensionModalTitle}
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Manifest V3
                </span>
              </h2>
              <p className="text-xs text-[#a0a0b0] mt-0.5">
                {t.extensionModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#888898] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Steps */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-[#18181c] border border-[#26262e] hover:border-purple-500/30 transition-all flex items-start gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 text-sm group-hover:scale-105 transition-transform">
              1
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-[13px]">
                  {t.step1Title}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-purple-300">
                  chrome://extensions
                </span>
              </div>
              <p className="text-[#9e9eb0] leading-relaxed">
                {t.step1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-[#18181c] border border-[#26262e] hover:border-purple-500/30 transition-all flex items-start gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-sm group-hover:scale-105 transition-transform">
              2
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-semibold text-white text-[13px]">
                {t.step2Title}
              </h3>
              <p className="text-[#9e9eb0] leading-relaxed">
                {t.step2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-[#18181c] border border-[#26262e] hover:border-purple-500/30 transition-all flex items-start gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0 text-sm group-hover:scale-105 transition-transform">
              3
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-semibold text-white text-[13px]">
                {t.step3Title}
              </h3>
              <p className="text-[#9e9eb0] leading-relaxed">
                {t.step3Desc}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#1c1a24] to-[#16161c] border border-purple-500/20 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm">
              4
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-semibold text-white text-[13px] flex items-center gap-1.5">
                {t.step4Title}
              </h3>
              <p className="text-[#a0a0b8] leading-relaxed">
                {t.step4Desc}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                  <Music2 className="w-3 h-3 text-purple-400" /> Shazam AI Müzik Tanıma
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-pink-400">
                  <Zap className="w-3 h-3 text-pink-400" /> 320kbps MP3 / 4K
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-indigo-400">
                  <Sliders className="w-3 h-3 text-indigo-400" /> Canlı Ses Spektrumu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#141418] border-t border-[#26262e] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFolder}
              disabled={folderOpening}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 font-medium text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-purple-400" />
              {t.openExtFolderBtn}
            </button>

            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 font-medium text-xs transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">{t.copiedText}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-400" />
                  {t.copyChromeUrlBtn}
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 hover:opacity-95 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {t.closeGuideBtn}
          </button>
        </div>
      </div>
    </div>
  );
};