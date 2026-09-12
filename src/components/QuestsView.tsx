import React, { useState } from 'react';
import { Quest, AttributeType, LocationId } from '../types';
import { WORLD_LOCATIONS } from '../utils/storage';
import { CheckCircle2, Plus, Sparkles, Filter, Search, Flame } from 'lucide-react';
import { sounds } from '../utils/sound';

interface QuestsViewProps {
  quests: Quest[];
  onCompleteQuest: (quest: Quest) => void;
  onOpenCreateQuest: (locationId?: LocationId, attribute?: AttributeType) => void;
}

export const QuestsView: React.FC<QuestsViewProps> = ({
  quests,
  onCompleteQuest,
  onOpenCreateQuest
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState<string>('all');
  const [filterType, setFilterType] = useState<'active' | 'completed' | 'daily'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const attributeIcons: Record<string, string> = {
    all: '✨',
    intellect: '🧠',
    strength: '💪',
    creativity: '🎨',
    social: '👥',
    wellness: '🌿'
  };

  const filteredQuests = quests.filter((q) => {
    // Attribute filter
    if (selectedAttribute !== 'all' && q.attribute !== selectedAttribute) {
      return false;
    }
    // Status filter
    if (filterType === 'active' && q.isCompleted) return false;
    if (filterType === 'completed' && !q.isCompleted) return false;
    if (filterType === 'daily' && (!q.isDaily || q.isCompleted)) return false;
    // Search query
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(qLower) ||
        q.description.toLowerCase().includes(qLower) ||
        q.attribute.toLowerCase().includes(qLower)
      );
    }
    return true;
  });

  const activeCount = quests.filter(q => !q.isCompleted).length;
  const completedCount = quests.filter(q => q.isCompleted).length;
  const dailyCount = quests.filter(q => q.isDaily && !q.isCompleted).length;

  return (
    <div className="w-full max-w-5xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 border-3 border-slate-700 rounded-3xl p-5 sm:p-6 mb-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-retro text-amber-400">REALM MISSION BOARD</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                {activeCount} active missions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-pixel font-bold text-white">
              Life Quests & Daily Rituals
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
              Every real-life goal completed grants XP, Gold, and evolves your realm's buildings.
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenCreateQuest();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-pixel font-bold text-xs rounded-xl pixel-btn shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>CREATE NEW MISSION</span>
          </button>
        </div>

        {/* Status Filters & Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-2 w-full md:w-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => {
                sounds.playClick();
                setFilterType('active');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel whitespace-nowrap transition-all ${
                filterType === 'active'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ACTIVE ({activeCount})
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setFilterType('daily');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel whitespace-nowrap transition-all ${
                filterType === 'daily'
                  ? 'bg-orange-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔥 DAILY RITUALS ({dailyCount})
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setFilterType('completed');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel whitespace-nowrap transition-all ${
                filterType === 'completed'
                  ? 'bg-emerald-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ACCOMPLISHED ({completedCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search missions..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Attribute Pills Filter */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">AREA:</span>
          {['all', 'intellect', 'strength', 'creativity', 'social', 'wellness'].map((attr) => {
            const isSelected = selectedAttribute === attr;
            return (
              <button
                key={attr}
                onClick={() => {
                  sounds.playClick();
                  setSelectedAttribute(attr);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-pixel transition-all whitespace-nowrap flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-slate-800 text-amber-300 border-amber-400/80 font-bold'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{attributeIcons[attr]}</span>
                <span className="capitalize">{attr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quests Grid / List */}
      <div className="space-y-3.5">
        {filteredQuests.length === 0 ? (
          <div className="bg-slate-900/60 border-2 border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl mb-3 border border-slate-700">
              🧭
            </div>
            <h3 className="text-lg font-pixel text-slate-200 font-bold">No Missions Found</h3>
            <p className="text-xs text-slate-400 font-sans max-w-sm mt-1 mb-4">
              There are no quests matching your current filter. Create a new real-life quest to level up!
            </p>
            <button
              onClick={() => {
                sounds.playClick();
                onOpenCreateQuest();
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-pixel font-bold text-xs rounded-xl pixel-btn shadow"
            >
              + Create Your Own Quest
            </button>
          </div>
        ) : (
          filteredQuests.map((quest) => {
            const locationMeta = WORLD_LOCATIONS[quest.locationId];
            return (
              <div
                key={quest.id}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-md ${
                  quest.isCompleted
                    ? 'bg-slate-900/50 border-slate-800 opacity-75'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-700 hover:border-amber-400/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left info */}
                  <div className="flex items-start gap-3">
                    <div className="text-2xl pt-0.5">⚔️</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-retro text-amber-400 uppercase tracking-wider">
                          QUEST
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                          <span>{attributeIcons[quest.attribute]}</span>
                          <span className="capitalize">{quest.attribute}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{locationMeta?.name}</span>
                        </span>
                        {quest.isDaily && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-950/60 border border-orange-600/50 text-orange-300 font-bold flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" /> DAILY
                          </span>
                        )}
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {quest.difficulty}
                        </span>
                      </div>

                      <h3 className={`text-base sm:text-lg font-pixel font-bold ${
                        quest.isCompleted ? 'text-slate-400 line-through' : 'text-white'
                      }`}>
                        "{quest.title}"
                      </h3>
                      <p className="text-xs text-slate-300 font-sans mt-0.5 leading-relaxed max-w-2xl">
                        {quest.description}
                      </p>
                    </div>
                  </div>

                  {/* Status if completed */}
                  {quest.isCompleted && (
                    <span className="self-start px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                    </span>
                  )}
                </div>

                {/* Footer Rewards & Action */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      REWARD:
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      ⭐ +{quest.xpReward} XP
                    </span>
                    <span className="flex items-center gap-1 text-yellow-400 font-bold">
                      🟡 +{quest.goldReward} GOLD
                    </span>
                    <span className="flex items-center gap-1 text-sky-400 font-bold">
                      {attributeIcons[quest.attribute]} +{quest.attributeReward} {quest.attribute.toUpperCase()}
                    </span>
                  </div>

                  {!quest.isCompleted && (
                    <button
                      onClick={() => onCompleteQuest(quest)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-pixel font-bold text-xs rounded-xl pixel-btn shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>COMPLETE QUEST</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
