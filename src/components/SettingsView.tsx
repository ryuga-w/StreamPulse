import React, { useState } from 'react';
import { AppSettings, DependencyStatus, Language, ThemeMode } from '../types';
import { api } from '../api';
import {
  Folder,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sliders,
  Globe,
  Sun,
  Moon,
  Monitor,
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
  const themeMode: ThemeMode = settings.themeMode || 'system';
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
    <div className="w-full max-w-3xl space-y-5 pb-20 font-['Roboto','YouTube_Sans']">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#aaaaaa]" />
            <span>{t.settingsTitle}</span>
          </h2>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* Theme Appearance Selection Card */}
        <div className="bg-[#212121] rounded-xl p-4 border border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-white/10 flex items-center justify-center text-[#aaaaaa] shrink-0">
                {themeMode === 'system' ? (
                  <Monitor className="w-4 h-4 text-purple-400" />
                ) : themeMode === 'dark' ? (
                  <Moon className="w-4 h-4 text-blue-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">{t.themeSetting}</h4>
                <p className="text-[11px] text-[#aaaaaa]">
                  {language === 'tr'
                    ? 'Windows sistem temanıza göre otomatik uyum sağlayın veya manuel tema seçin'
                    : 'Automatically match your Windows system theme or choose manually'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-[#181818] rounded-full border border-white/10 text-xs shrink-0 self-start sm:self-auto">
              <button
                onClick={() => onUpdateSettings({ themeMode: 'system' })}
                className={`px-3 py-1 rounded-full transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-sm'
                    : 'text-[#aaaaaa] hover:text-white'
                }`}
                title={language === 'tr' ? 'Windows Temasını Otomatik Takip Et' : 'Auto Follow Windows Theme'}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{language === 'tr' ? 'Sistem (Auto)' : 'System'}</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ themeMode: 'dark' })}
                className={`px-3 py-1 rounded-full transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-white text-[#0f0f0f] font-semibold'
                    : 'text-[#aaaaaa] hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{language === 'tr' ? 'Karanlık' : 'Dark'}</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ themeMode: 'light' })}
                className={`px-3 py-1 rounded-full transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-white text-[#0f0f0f] font-semibold'
                    : 'text-[#aaaaaa] hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{language === 'tr' ? 'Aydınlık' : 'Light'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Language Selection Card */}
        <div className="bg-[#212121] rounded-xl p-4 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-white/10 flex items-center justify-center text-[#3ea6ff]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">{t.languageSetting}</h4>
                <p className="text-[11px] text-[#aaaaaa]">
                  {language === 'tr' ? 'Arayüz dilini Türkçe veya İngilizce olarak değiştirin' : 'Switch the UI language between Turkish and English'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-0.5 bg-[#181818] rounded-full border border-white/10 text-xs">
              <button
                onClick={() => onUpdateSettings({ language: 'tr' })}
                className={`px-3 py-1 rounded-full transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                  language === 'tr'
                    ? 'bg-white text-[#0f0f0f] font-semibold'
                    : 'text-[#aaaaaa] hover:text-white'
                }`}
              >
                <span>Türkçe</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`px-3 py-1 rounded-full transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-[#0f0f0f] font-semibold'
                    : 'text-[#aaaaaa] hover:text-white'
                }`}
              >
                <span>English</span>
              </button>
            </div>
          </div>
        </div>

        {/* Download Folder Settings */}
        <div className="bg-[#212121] rounded-xl p-4 border border-white/5 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-white">{t.downloadDirSetting}</h4>
            <p className="text-[11px] text-[#aaaaaa]">
              {language === 'tr' ? 'İndirilen MP3, MP4 ve oynatma listelerinin kaydedileceği ana dizin.' : 'Main directory where all downloaded files and playlists will be saved.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#f1f1f1] truncate">
              {settings.downloadDir || 'Downloads'}
            </div>
            <button
              onClick={onSelectDir}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Folder className="w-3.5 h-3.5 text-[#3ea6ff]" />
              <span>{t.changeFolder}</span>
            </button>
          </div>
        </div>

        {/* Engine Performance & Download Defaults */}
        <div className="bg-[#212121] rounded-xl p-4 border border-white/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#aaaaaa]">
                {t.maxConcurrentSetting}
              </label>
              <select
                value={settings.maxConcurrent}
                onChange={(e) => onUpdateSettings({ maxConcurrent: parseInt(e.target.value) })}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono cursor-pointer"
              >
                <option value={1}>1 (Sırayla İndir)</option>
                <option value={2}>2 (Dengeli)</option>
                <option value={3}>3 (Varsayılan - Hızlı)</option>
                <option value={5}>5 (Yüksek Hız)</option>
                <option value={8}>8 (Maksimum Performans)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#aaaaaa]">
                {t.defaultAudioQualitySetting}
              </label>
              <select
                value={settings.defaultAudioQuality}
                onChange={(e) => onUpdateSettings({ defaultAudioQuality: e.target.value })}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono cursor-pointer"
              >
                <option value="320">320 kbps (Stüdyo MP3)</option>
                <option value="256">256 kbps (Yüksek Kalite)</option>
                <option value="192">192 kbps (Standart)</option>
                <option value="128">128 kbps (Kompakt)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#aaaaaa]">
                {t.defaultVideoQualitySetting}
              </label>
              <select
                value={settings.defaultVideoQuality}
                onChange={(e) => onUpdateSettings({ defaultVideoQuality: e.target.value })}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono cursor-pointer"
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
            <label className="flex items-center gap-2.5 text-xs text-[#f1f1f1] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoClipboard}
                onChange={(e) => onUpdateSettings({ autoClipboard: e.target.checked })}
                className="w-4 h-4 accent-[#ff0000] rounded cursor-pointer"
              />
              <span>{t.autoClipboardSetting}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#f1f1f1] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoOpenFolder}
                onChange={(e) => onUpdateSettings({ autoOpenFolder: e.target.checked })}
                className="w-4 h-4 accent-[#ff0000] rounded cursor-pointer"
              />
              <span>{t.autoOpenFolderSetting}</span>
            </label>
          </div>
        </div>

        {/* Engine Status */}
        <div className="bg-[#212121] rounded-xl p-4 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">{t.engineStatus}</h4>
              <p className="text-[11px] text-[#aaaaaa]">
                {language === 'tr' ? 'yt-dlp ve ffmpeg çekirdek bileşenlerinin durumu.' : 'Status of yt-dlp and ffmpeg core components.'}
              </p>
            </div>

            <button
              onClick={handleUpdateEngine}
              disabled={isUpdatingEngine}
              className="px-3 py-1.5 text-xs text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={t.checkUpdates}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingEngine ? 'animate-spin text-[#3ea6ff]' : ''}`} />
              <span className="text-[11px] font-medium">{isUpdatingEngine ? 'Güncelleniyor...' : 'Güncelle'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[#181818] rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-white">yt-dlp</span>
                <p className="text-[10px] text-[#aaaaaa] font-mono">
                  {depsStatus?.ytDlpVersion || 'Kontrol ediliyor...'}
                </p>
              </div>
              {depsStatus?.ytDlp ? (
                <CheckCircle className="w-4 h-4 text-[#2ba640]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#ff4e45]" />
              )}
            </div>

            <div className="p-3 bg-[#181818] rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-white">FFmpeg 7.0</span>
                <p className="text-[10px] text-[#aaaaaa] font-mono">
                  {depsStatus?.ffmpeg ? 'Audio/Video Muxer' : 'Kontrol ediliyor...'}
                </p>
              </div>
              {depsStatus?.ffmpeg ? (
                <CheckCircle className="w-4 h-4 text-[#2ba640]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#ff4e45]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
