import React, { useState } from 'react';
import {
  Download,
  ListOrdered,
  Library,
  Settings,
  Puzzle,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';
import { ExtensionTutorialModal } from './ExtensionTutorialModal';

export type TabType = 'downloader' | 'queue' | 'history' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  queueCount: number;
  historyCount: number;
  language?: Language;
  themeMode?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  historyCount,
  language = 'tr',
  themeMode = 'dark',
}) => {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const isLight = themeMode === 'light';
  const t = translations[language];

  const menuItems = [
    {
      id: 'downloader' as TabType,
      label: t.downloader,
      subtitle: t.downloaderSub,
      icon: Download,
      count: 0,
    },
    {
      id: 'queue' as TabType,
      label: t.activeQueue,
      subtitle: t.activeQueueSub,
      icon: ListOrdered,
      count: queueCount,
    },
    {
      id: 'history' as TabType,
      label: t.library,
      subtitle: t.librarySub,
      icon: Library,
      count: historyCount,
    },
    {
      id: 'settings' as TabType,
      label: t.settings,
      subtitle: t.settingsSub,
      icon: Settings,
      count: 0,
    },
  ];

  return (
    <aside className="w-60 h-full bg-[#0f0f0f] border-r border-[#282828] flex flex-col justify-between p-3 select-none shrink-0 font-['Roboto','YouTube_Sans']">
      <div className="space-y-1.5">
        <div className="px-3 py-1.5 text-[11px] font-bold text-[#717171] uppercase tracking-wider">
          MENÜ
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 group text-left cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/20 via-indigo-600/15 to-pink-600/20 border border-purple-500/30 text-white font-medium shadow-sm'
                  : 'text-[#aaaaaa] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isActive
                      ? 'text-purple-400'
                      : 'text-[#aaaaaa] group-hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className={`text-[13px] truncate leading-tight ${isActive ? 'font-semibold text-white' : 'font-normal'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-[#717171] truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {item.count > 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                      : 'bg-white/10 text-[#f1f1f1]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="pt-2 space-y-2">
        {/* Extension Tutorial Card */}
        <div className={`p-3 rounded-xl ${
          isLight
            ? 'bg-gradient-to-br from-purple-50 via-indigo-50/50 to-pink-50 border-purple-200 shadow-sm'
            : 'bg-gradient-to-br from-purple-950/30 via-[#18181f] to-pink-950/20 border-purple-500/20'
        } border space-y-2 group hover:border-purple-400 transition-all`}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg ${
              isLight
                ? 'bg-purple-100 border-purple-200 text-purple-700'
                : 'bg-purple-500/20 border-purple-500/30 text-purple-400'
            } border flex items-center justify-center shrink-0`}>
              <Puzzle className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[12px] font-semibold ${isLight ? 'text-slate-900' : 'text-white'} truncate flex items-center gap-1`}>
                {t.extensionCardTitle}
                <Sparkles className="w-3 h-3 text-pink-500" />
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-500 font-medium' : 'text-[#8e8e9e]'} truncate`}>
                {t.extensionCardSub}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsTutorialOpen(true)}
            className={`w-full py-1.5 px-2.5 rounded-lg ${
              isLight
                ? 'bg-purple-100/90 hover:bg-purple-200/90 border-purple-300 text-purple-900 font-semibold'
                : 'bg-purple-600/20 hover:bg-purple-600/35 border-purple-500/30 text-purple-200 hover:text-white font-medium'
            } border text-[11px] flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
          >
            <HelpCircle className={`w-3.5 h-3.5 ${isLight ? 'text-purple-700' : 'text-purple-400'}`} />
            <span>{t.extensionGuideBtn}</span>
          </button>
        </div>

        {/* Engine Status Card */}
        <div className={`p-3 rounded-xl ${isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#181818] border-[#282828]'} border space-y-1.5`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t.engineBadge}</span>
            </div>
            <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-[#717171]'} font-mono`}>v1.2.0</span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#aaaaaa]'} leading-relaxed`}>
            {t.engineBadgeDesc}
          </p>
        </div>
      </div>

      <ExtensionTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        language={language}
        themeMode={themeMode}
      />
    </aside>
  );
};

