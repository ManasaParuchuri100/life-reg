import React from 'react';
import { PlayerStats, LocationId } from '../types';
import { WORLD_LOCATIONS, getLocationTier } from '../utils/storage';
import { X, Sparkles, Flame, Trophy, TrendingUp, Compass, CheckCircle2, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/sound';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onSelectLocation: (locId: LocationId) => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  onClose,
  stats,
  onSelectLocation
}) => {
  if (!isOpen) return null;

  const locationsList = Object.keys(WORLD_LOCATIONS) as LocationId[];

  const attributeIcons: Record<string, string> = {
    intellect: '🧠',
    strength: '💪',
    creativity: '🎨',
    social: '🫂',
    wellness: '🌿',
    all: '⭐'
  };

  const getScoreForLocation = (locId: LocationId) => {
    if (locId === 'player_home') {
      return Math.floor(
        (stats.attributes.intellect +
          stats.attributes.strength +
          stats.attributes.creativity +
          stats.attributes.social +
          stats.attributes.wellness) /
          5
      );
    }
    const meta = WORLD_LOCATIONS[locId];
    return stats.attributes[meta.attribute as keyof typeof stats.attributes] || 0;
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0a1120] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-800/80">
          <div>
            <h2 className="text-base sm:text-lg font-pixel font-bold tracking-wide text-slate-100 uppercase leading-none">
              REALM HARMONY & HABIT ANALYTICS
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Your real-life momentum directly shapes the vitality of Hearthbound
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-[#070e1b] border border-slate-800 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                WORLD STATE
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 text-emerald-400 font-pixel font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Growing · 32%</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Sustained ecosystem</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#070e1b] border border-slate-800 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ACTIVE STREAK
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 text-orange-400 font-pixel font-bold text-sm">
                <Flame className="w-4 h-4 fill-orange-400" />
                <span>{stats.streak} Days</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Disciplined routine</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#070e1b] border border-slate-800 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                COMPLETED
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 text-amber-400 font-pixel font-bold text-sm">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{stats.completedQuestsCount} Quests</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Real-life milestones</span>
            </div>
          </div>

          {/* 7-Day Habit Consistency Grid */}
          <div className="p-4 rounded-lg bg-[#0d1728]/70 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-pixel font-bold text-slate-200">
                7-DAY HABIT CONSISTENCY
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                6 / 7 Days Active (86%)
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, idx) => {
                const isActive = idx < stats.streak;
                return (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <div 
                      className={`w-full aspect-square rounded-md border flex items-center justify-center text-xs transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 font-bold shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isActive ? '✓' : '·'}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* World Locations Settlement Progress */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              SETTLEMENT EVOLUTION STAGES
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {locationsList.map((locId) => {
                const meta = WORLD_LOCATIONS[locId];
                const score = getScoreForLocation(locId);
                const tierInfo = getLocationTier(score);

                return (
                  <div
                    key={locId}
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                      onSelectLocation(locId);
                    }}
                    className="p-3 rounded-lg bg-[#070e1b] hover:bg-[#0c1626] border border-slate-800 hover:border-amber-400/70 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{attributeIcons[meta.attribute]}</span>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-200">
                          {meta.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {tierInfo.badge} · {score} pts
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#070e1b]/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>"I don't have a to-do list. I have a World."</span>
          <span className="text-slate-500 text-[11px]">Hearthbound v2.0</span>
        </div>

      </div>
    </div>
  );
};
