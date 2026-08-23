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
  themeMode?: 'dark' | 'light';
}

export const ExtensionTutorialModal: React.FC<ExtensionTutorialModalProps> = ({
  isOpen,
  onClose,
  language = 'tr',
  themeMode = 'dark',
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

  const isLight = themeMode === 'light';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-in fade-in duration-200`}>
      <div
        className={`relative w-full max-w-2xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-2xl shadow-purple-950/15'
            : 'bg-[#121214] border-[#2a2a30] text-[#e0e0e6] shadow-2xl'
        } border rounded-2xl overflow-hidden flex flex-col max-h-[90vh] select-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className={`relative px-6 py-5 ${
          isLight
            ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-b border-slate-200'
            : 'bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-pink-950/30 border-b border-[#282830]'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'} tracking-wide flex items-center gap-2`}>
                {t.extensionModalTitle}
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${
                  isLight
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  Manifest V3
                </span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-[#a0a0b0]'} mt-0.5`}>
                {t.extensionModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight
                ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                : 'text-[#888898] hover:text-white hover:bg-white/10'
            } transition-colors cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Steps */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Step 1 */}
          <div className={`p-4 rounded-xl ${
            isLight
              ? 'bg-slate-50/80 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
              : 'bg-[#18181c] border-[#26262e] hover:border-purple-500/30'
          } border transition-all flex items-start gap-4 group`}>
            <div className={`w-8 h-8 rounded-lg ${
              isLight
                ? 'bg-purple-100 border-purple-200 text-purple-700'
                : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
            } font-bold flex items-center justify-center shrink-0 text-sm group-hover:scale-105 transition-transform`}>
              1
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-[13px]`}>
                  {t.step1Title}
                </h3>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  isLight
                    ? 'bg-slate-200/80 border-slate-300 text-purple-700 font-semibold'
                    : 'bg-black/40 border-white/10 text-purple-300'
                } border`}>
                  chrome://extensions
                </span>
              </div>
              <p className={`${isLight ? 'text-slate-600' : 'text-[#9e9eb0]'} leading-relaxed`}>
                {t.step1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-xl ${
            isLight
              ? 'bg-slate-50/80 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
              : 'bg-[#18181c] border-[#26262e] hover:border-purple-500/30'
          } border transition-all flex items-start gap-4 group`}>
            <div className={`w-8 h-8 rounded-lg ${
              isLight
                ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
            } font-bold flex items-center justify-center shrink-0 text-sm group-hover:scale-105 transition-transform`}>
              2
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-[13px]`}>
                {t.step2Title}
              </h3>
              <p className={`${isLight ? 'text-slate-600' : 'text-[#9e9eb0]'} leading-relaxed`}>
                {t.step2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-xl ${
            isLight
              ? 'bg-slate-50/80 border-slate-200 hover:border-pink-300 hover:bg-pink-50/30'
              : 'bg-[#18181c] border-[#26262e] hover:border-purple-500/30'
          } border transition-all flex items-start gap-4 group`}>
            <div className={`w-8 h-8 rounded-lg ${
              isLight
                ? 'bg-pink-100 border-pink-200 text-pink-700'
                : 'bg-pink-500/10 border border-pink-500/20 text-pink-400'
            } font-bold flex items-center justify-center shrink-0 text-sm group-hover:scale-105 transition-transform`}>
              3
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-[13px]`}>
                {t.step3Title}
              </h3>
              <p className={`${isLight ? 'text-slate-600' : 'text-[#9e9eb0]'} leading-relaxed`}>
                {t.step3Desc}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className={`p-4 rounded-xl ${
            isLight
              ? 'bg-gradient-to-br from-purple-50/90 via-white to-pink-50/90 border-purple-200 shadow-sm'
              : 'bg-gradient-to-br from-[#1c1a24] to-[#16161c] border-purple-500/20'
          } border flex items-start gap-4`}>
            <div className={`w-8 h-8 rounded-lg ${
              isLight
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            } font-bold flex items-center justify-center shrink-0 text-sm`}>
              4
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-[13px] flex items-center gap-1.5`}>
                {t.step4Title}
              </h3>
              <p className={`${isLight ? 'text-slate-600' : 'text-[#a0a0b8]'} leading-relaxed`}>
                {t.step4Desc}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isLight
                    ? 'bg-purple-100/90 border border-purple-200 text-purple-800'
                    : 'bg-white/5 border border-white/10 text-neutral-300'
                }`}>
                  <Music2 className={`w-3 h-3 ${isLight ? 'text-purple-700' : 'text-purple-400'}`} /> Shazam AI Müzik Tanıma
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isLight
                    ? 'bg-pink-100/90 border border-pink-200 text-pink-800'
                    : 'bg-white/5 border border-white/10 text-pink-400'
                }`}>
                  <Zap className={`w-3 h-3 ${isLight ? 'text-pink-700' : 'text-pink-400'}`} /> 320kbps MP3 / 4K
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isLight
                    ? 'bg-indigo-100/90 border border-indigo-200 text-indigo-800'
                    : 'bg-white/5 border border-white/10 text-indigo-400'
                }`}>
                  <Sliders className={`w-3 h-3 ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`} /> Canlı Ses Spektrumu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141418] border-[#26262e]'} border-t flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFolder}
              disabled={folderOpening}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${
                isLight
                  ? 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-900 font-semibold'
                  : 'bg-purple-600/20 hover:bg-purple-600/35 border-purple-500/30 text-purple-200 font-medium'
              } border text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
            >
              <FolderOpen className={`w-4 h-4 ${isLight ? 'text-purple-700' : 'text-purple-400'}`} />
              {t.openExtFolderBtn}
            </button>

            <button
              onClick={handleCopyUrl}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 font-semibold'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 font-medium'
              } border text-xs transition-all cursor-pointer`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">{t.copiedText}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  {t.copyChromeUrlBtn}
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 hover:opacity-95 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {t.closeGuideBtn}
          </button>
        </div>
      </div>
    </div>
  );
};