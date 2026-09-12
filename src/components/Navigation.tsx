import React from 'react';
import { sounds } from '../utils/sound';
import { MapPin, Swords, User, Package, Trophy } from 'lucide-react';

export type NavTab = 'world' | 'quests' | 'character' | 'inventory' | 'progress';

interface NavigationProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  activeQuestCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onChangeTab,
  activeQuestCount
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'world', label: 'WORLD', icon: <MapPin className="w-4 h-4" /> },
    { id: 'quests', label: 'QUESTS', icon: <Swords className="w-4 h-4" />, badge: activeQuestCount },
    { id: 'character', label: 'CHARACTER', icon: <User className="w-4 h-4" /> },
    { id: 'inventory', label: 'INVENTORY', icon: <Package className="w-4 h-4" /> },
    { id: 'progress', label: 'PROGRESS', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-40 select-none flex flex-col items-center">
      <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 bg-[#0a1120]/95 backdrop-blur-md rounded-lg border border-slate-700/80 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                onChangeTab(tab.id);
              }}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-pixel text-xs sm:text-sm transition-all duration-150 ${
                isActive
                  ? 'border-2 border-amber-400 bg-amber-400/10 text-amber-300 font-bold shadow-md'
                  : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="tracking-wide font-medium">{tab.label}</span>

              {/* Active Badge Counter for Quests */}
              {tab.badge && tab.badge > 0 && !isActive ? (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-rose-600 text-white font-mono text-[9px] font-bold rounded-full shadow animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400/90 mt-1.5 font-medium tracking-wide">
        Every real-life action leaves a mark.
      </p>
    </nav>
  );
};
