import React, { useState } from 'react';
import { AppSettings, DependencyStatus, Language } from '../types';
import { api } from '../api';
import {
  Folder,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { translations } from '../i18n';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSelectDir: () => void;
  depsStatus: DependencyStatus | null;
  onCheckDeps: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onSelectDir,
  depsStatus,
  onCheckDeps,
}) => {
  const language = settings.language || 'tr';
  const themeMode = settings.themeMode || 'dark';
  const t = translations[language];

  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);

  const handleUpdateEngine = async () => {
    setIsUpdatingEngine(true);
    try {
      await api.updateYtDlp();
      await onCheckDeps();
    } catch (e) {
    } finally {
      setIsUpdatingEngine(false);
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>{t.settingsTitle}</span>
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* Theme Appearance Selection Card */}
        <div className="glass-card rounded-xl p-4 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                {themeMode === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">{t.themeSetting}</h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'tr' ? 'Karanlık (OLED) veya Aydınlık arayüz temasını seçin' : 'Switch between Dark and Light UI themes'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => onUpdateSettings({ themeMode: 'dark' })}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-purple-600 text-white shadow-glow-purple'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t.darkMode}</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ themeMode: 'light' })}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-purple-600 text-white shadow-glow-purple'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>{t.lightMode}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Language Selection Card */}
        <div className="glass-card rounded-xl p-4 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">{t.languageSetting}</h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'tr' ? 'Arayüz dilini Türkçe veya İngilizce olarak değiştirin' : 'Switch the UI language between Turkish and English'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => onUpdateSettings({ language: 'tr' })}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  language === 'tr'
                    ? 'bg-purple-600 text-white shadow-glow-purple'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇹🇷</span>
                <span>Türkçe</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  language === 'en'
                    ? 'bg-purple-600 text-white shadow-glow-purple'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          </div>
        </div>

        {/* Download Folder Settings */}
        <div className="glass-card rounded-xl p-4 border border-white/[0.06] space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-white">{t.downloadDirSetting}</h4>
            <p className="text-[10px] text-slate-400">
              {language === 'tr' ? 'İndirilen MP3, MP4 ve oynatma listelerinin kaydedileceği ana dizin.' : 'Main directory where all downloaded files and playlists will be saved.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate">
              {settings.downloadDir || 'Downloads'}
            </div>
            <button
              onClick={onSelectDir}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Folder className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.changeFolder}</span>
            </button>
          </div>
        </div>

        {/* Engine Performance & Download Defaults */}
        <div className="glass-card rounded-xl p-4 border border-white/[0.06] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {t.maxConcurrentSetting}
              </label>
              <select
                value={settings.maxConcurrent}
                onChange={(e) => onUpdateSettings({ maxConcurrent: parseInt(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
              >
                <option value={1}>1 (Sırayla İndir)</option>
                <option value={2}>2 (Dengeli)</option>
                <option value={3}>3 (Varsayılan - Hızlı)</option>
                <option value={5}>5 (Yüksek Hız)</option>
                <option value={8}>8 (Maksimum Performans)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {t.defaultAudioQualitySetting}
              </label>
              <select
                value={settings.defaultAudioQuality}
                onChange={(e) => onUpdateSettings({ defaultAudioQuality: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
              >
                <option value="320">320 kbps (Studio MP3)</option>
                <option value="256">256 kbps (High Quality)</option>
                <option value="192">192 kbps (Standard)</option>
                <option value="128">128 kbps (Compact)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {t.defaultVideoQualitySetting}
              </label>
              <select
                value={settings.defaultVideoQuality}
                onChange={(e) => onUpdateSettings({ defaultVideoQuality: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
              >
                <option value="2160">4K (2160p Ultra HD)</option>
                <option value="1440">2K (1440p QHD)</option>
                <option value="1080">1080p (Full HD 60fps)</option>
                <option value="720">720p (HD)</option>
                <option value="480">480p (SD)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoClipboard}
                onChange={(e) => onUpdateSettings({ autoClipboard: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
              <span>{t.autoClipboardSetting}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoOpenFolder}
                onChange={(e) => onUpdateSettings({ autoOpenFolder: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
              <span>{t.autoOpenFolderSetting}</span>
            </label>
          </div>
        </div>

        {/* Engine Status */}
        <div className="glass-card rounded-xl p-4 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">{t.engineStatus}</h4>
              <p className="text-[10px] text-slate-400">
                {language === 'tr' ? 'yt-dlp ve ffmpeg çekirdek bileşenlerinin durumu.' : 'Status of yt-dlp and ffmpeg core components.'}
              </p>
            </div>

            <button
              onClick={handleUpdateEngine}
              disabled={isUpdatingEngine}
              className="px-2.5 py-1 text-xs text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={t.checkUpdates}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingEngine ? 'animate-spin text-purple-400' : ''}`} />
              <span className="text-[11px] font-semibold">{isUpdatingEngine ? 'Güncelleniyor...' : 'Güncelle'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-white">yt-dlp</span>
                <p className="text-[10px] text-slate-500 font-mono">
                  {depsStatus?.ytDlpVersion || 'Checking...'}
                </p>
              </div>
              {depsStatus?.ytDlp ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-white">FFmpeg 7.0</span>
                <p className="text-[10px] text-slate-500 font-mono">
                  {depsStatus?.ffmpeg ? 'Audio/Video Muxer' : 'Checking...'}
                </p>
              </div>
              {depsStatus?.ffmpeg ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
