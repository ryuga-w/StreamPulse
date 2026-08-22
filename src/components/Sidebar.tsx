import React from 'react';
import {
  Download,
  ListOrdered,
  Library,
  Settings,
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
      <div className="pt-2">
        <div className="p-3 rounded-xl bg-[#181818] border border-[#282828] space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{t.engineBadge}</span>
            </div>
            <span className="text-[10px] text-[#717171] font-mono">v1.0.0</span>
          </div>
          <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
            {t.engineBadgeDesc}
          </p>
        </div>
      </div>
    </aside>
  );
};
