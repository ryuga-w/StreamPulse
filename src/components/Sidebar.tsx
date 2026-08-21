import React from 'react';
import {
  Download,
  ListOrdered,
  History,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';

export type TabType = 'downloader' | 'queue' | 'history' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  queueCount: number;
  historyCount: number;
  language?: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  historyCount,
  language = 'tr',
}) => {
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
      icon: History,
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
    <aside className="w-56 h-full bg-[#070a12]/80 border-r border-white/5 flex flex-col justify-between p-3.5 select-none shrink-0">
      <div className="space-y-1">
        <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider sidebar-menu-header">
          MENU
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group text-left cursor-pointer ${
                isActive
                  ? 'sidebar-nav-active bg-gradient-to-r from-purple-600/20 to-indigo-600/10 border border-purple-500/30 text-white shadow-glow-purple/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`nav-icon-box w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-glow-purple'
                      : 'bg-white/5 text-slate-400 group-hover:text-purple-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0">
                  <div className="nav-label text-xs font-semibold truncate leading-none">
                    {item.label}
                  </div>
                  <div className="nav-subtitle text-[9px] text-slate-500 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {item.count > 0 && (
                <span
                  className={`nav-badge text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-purple-300'
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
      <div>
        {/* Engine Status Pill */}
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 engine-title">
              <Zap className="w-3.5 h-3.5 text-purple-400 fill-current" />
              <span>{t.engineBadge}</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">v1.0.0</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight engine-desc">
            {t.engineBadgeDesc}
          </p>
        </div>
      </div>
    </aside>
  );
};
