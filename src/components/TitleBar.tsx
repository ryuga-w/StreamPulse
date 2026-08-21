import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Globe, Sun, Moon } from 'lucide-react';
import { Language, ThemeMode } from '../types';

interface TitleBarProps {
  queueCount: number;
  language?: Language;
  themeMode?: ThemeMode;
  onToggleLanguage?: () => void;
  onToggleTheme?: () => void;
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
    <header className="h-10 w-full bg-[#070a12] border-b border-white/5 flex items-center justify-between px-3 select-none titlebar-drag-region z-50 shrink-0">
      {/* Brand Title */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-glow-purple"></div>
        <span className="text-xs font-bold tracking-wider bg-gradient-to-r from-purple-400 via-indigo-300 to-white bg-clip-text text-transparent">
          STREAMPULSE
        </span>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
          PRO
        </span>
      </div>

      {/* Center status / info */}
      <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-medium">
        {queueCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <span>{queueCount} active download{queueCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Controls & Switchers */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        {/* Theme Switcher Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={themeMode === 'dark' ? 'Aydınlık Mod (Light Theme)' : 'Karanlık Mod (Dark Theme)'}
          >
            {themeMode === 'dark' ? (
              <>
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Aydınlık</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-indigo-400" />
                <span>Karanlık</span>
              </>
            )}
          </button>
        )}

        {/* Global Language Switcher Button */}
        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Dili Değiştir / Change Language"
          >
            <Globe className="w-3 h-3 text-purple-400" />
            <span className="uppercase font-mono">{language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}</span>
          </button>
        )}

        {/* Window Action Buttons */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isMaximized ? (
              <Copy className="w-3 h-3" />
            ) : (
              <Square className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
