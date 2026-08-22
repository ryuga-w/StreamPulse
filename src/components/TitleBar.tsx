import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Globe, Sun, Moon, Monitor } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import appIcon from '../../build/icon.png';

interface TitleBarProps {
  queueCount: number;
  language?: Language;
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
  onToggleLanguage?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  queueCount,
  language = 'tr',
  themeMode = 'dark',
  onToggleLanguage,
  onToggleTheme,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) window.electronAPI.minimizeWindow();
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
      const maximized = await window.electronAPI.isMaximized();
      setIsMaximized(maximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) window.electronAPI.closeWindow();
  };

  return (
    <header className="h-10 w-full bg-[#0f0f0f] border-b border-[#282828] flex items-center justify-between px-3 select-none titlebar-drag-region z-50 shrink-0">
      {/* StreamPulse Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-md flex items-center justify-center overflow-hidden shrink-0 shadow-sm bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 p-0.5">
          <img
            src={appIcon}
            alt="StreamPulse"
            className="w-full h-full object-contain rounded-sm"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent font-['Roboto','YouTube_Sans']">
            StreamPulse
          </span>
          <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
            MUSIC & VIDEO
          </span>
        </div>
      </div>

      {/* Center status / info */}
      <div className="hidden md:flex items-center gap-2 text-[11px] text-[#aaaaaa]">
        {queueCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-medium animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>{queueCount} {language === 'tr' ? 'indirme aktif' : 'active downloads'}</span>
          </div>
        )}
      </div>

      {/* Controls & Switchers */}
      <div className="flex items-center gap-1.5 titlebar-no-drag">
        {/* Theme Switcher Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
            title={
              language === 'tr'
                ? themeMode === 'system'
                  ? 'Sistem Teması (Windows)'
                  : themeMode === 'dark'
                  ? 'Karanlık Mod'
                  : 'Aydınlık Mod'
                : themeMode === 'system'
                ? 'System Theme (Windows)'
                : themeMode === 'dark'
                ? 'Dark Mode'
                : 'Light Mode'
            }
          >
            {themeMode === 'system' ? (
              <>
                <Monitor className="w-3 h-3 text-purple-400" />
                <span>{language === 'tr' ? 'Sistem' : 'System'}</span>
              </>
            ) : themeMode === 'dark' ? (
              <>
                <Moon className="w-3 h-3 text-blue-400" />
                <span>{language === 'tr' ? 'Karanlık' : 'Dark'}</span>
              </>
            ) : (
              <>
                <Sun className="w-3 h-3 text-amber-400" />
                <span>{language === 'tr' ? 'Aydınlık' : 'Light'}</span>
              </>
            )}
          </button>
        )}

        {/* Global Language Switcher Button */}
        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
            title="Dili Değiştir / Change Language"
          >
            <Globe className="w-3 h-3 text-indigo-400" />
            <span className="uppercase font-bold tracking-wider">{language}</span>
          </button>
        )}

        {/* Window Action Buttons */}
        <div className="flex items-center ml-2 border-l border-[#282828] pl-2">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
            title="Simge Durumuna Küçült"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
            title={isMaximized ? 'Önceki Boyut' : 'Ekranı Kapla'}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>

          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-rose-600 rounded text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
