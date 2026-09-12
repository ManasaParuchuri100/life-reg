import React, { useState } from 'react';
import { Quest, AttributeType, LocationId, PlayerStats } from '../types';
import { X, Plus, Check, Sparkles, Flame, ChevronDown, ChevronUp, BookOpen, Dumbbell, Palette, Users, Flower2, Home } from 'lucide-react';
import { sounds } from '../utils/sound';
import { getLocationTier } from '../utils/storage';
import { BUILDINGS } from '../game/worldData';

interface QuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  stats?: PlayerStats;
  onCompleteQuest: (quest: Quest) => void;
  onOpenCreateQuest: (locationId?: LocationId, attr?: AttributeType) => void;
  selectedLocationId?: LocationId | null;
  onSelectLocationFilter?: (locId: LocationId | null) => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  isOpen,
  onClose,
  quests,
  stats,
  onCompleteQuest,
  onOpenCreateQuest,
  selectedLocationId,
  onSelectLocationFilter
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState<string>('all');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Active location info if filtered to one landmark
  const activeBuilding = BUILDINGS.find(b => b.id === selectedLocationId);

  // Landmark progression status
  const currentAttr = activeBuilding ? (
    activeBuilding.id === 'knowledge_tower' ? 'intellect' :
    activeBuilding.id === 'mine_training' ? 'strength' :
    activeBuilding.id === 'workshop' ? 'creativity' :
    activeBuilding.id === 'village' ? 'social' :
    activeBuilding.id === 'sanctuary' ? 'wellness' : null
  ) : null;

  const currentAttrPoints = stats && currentAttr ? stats.attributes[currentAttr] : 0;
  const tierInfo = getLocationTier(currentAttrPoints);
  const currentTier = tierInfo.tier;
  const nextTierPoints = currentTier === 1 ? 12 : currentTier === 2 ? 25 : currentTier === 3 ? 45 : 60;
  const tierProgressPercent = Math.min(100, Math.round((currentAttrPoints / nextTierPoints) * 100));

  const categories: { id: string; label: string; icon?: React.ReactNode; locationId?: LocationId }[] = [
    { id: 'all', label: 'ALL REALM', locationId: undefined },
    { id: 'knowledge_tower', label: 'KNOWLEDGE TOWER', icon: <BookOpen className="w-3.5 h-3.5" />, locationId: 'knowledge_tower' },
    { id: 'mine_training', label: 'TRAINING GROUNDS', icon: <Dumbbell className="w-3.5 h-3.5" />, locationId: 'mine_training' },
    { id: 'workshop', label: 'WORKSHOP', icon: <Palette className="w-3.5 h-3.5" />, locationId: 'workshop' },
    { id: 'village', label: 'LANTERN VILLAGE', icon: <Users className="w-3.5 h-3.5" />, locationId: 'village' },
    { id: 'sanctuary', label: 'MOONLIT GARDEN', icon: <Flower2 className="w-3.5 h-3.5" />, locationId: 'sanctuary' },
  ];

  const filteredQuests = quests.filter((q) => {
    if (selectedLocationId && q.locationId !== selectedLocationId && selectedLocationId !== 'player_home') {
      return false;
    }
    if (selectedAttribute !== 'all' && q.attribute !== selectedAttribute) {
      return false;
    }
    return true;
  });

  const getAttributeIcon = (attr: AttributeType) => {
    switch (attr) {
      case 'intellect': return '🧠';
      case 'strength': return '💪';
      case 'creativity': return '🎨';
      case 'social': return '🫂';
      case 'wellness': return '🌿';
      default: return '✨';
    }
  };

  const getAttributeColor = (attr: AttributeType) => {
    switch (attr) {
      case 'intellect': return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
      case 'strength': return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      case 'creativity': return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'social': return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'wellness': return 'text-pink-400 bg-pink-950/60 border-pink-800/60';
      default: return 'text-amber-300 bg-amber-950/60 border-amber-800/60';
    }
  };

  const toggleQuestExpand = (questId: string) => {
    setExpandedQuestId(prev => (prev === questId ? null : questId));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0a1120] border-2 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =================================================================== */}
        {/* MODAL HEADER: Title, Location Tag, and Actions                     */}
        {/* =================================================================== */}
        <div className="px-5 sm:px-6 pt-5 pb-3.5 flex items-start justify-between border-b border-slate-800 bg-[#070e1b]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl select-none">
                {activeBuilding ? (
                  activeBuilding.id === 'knowledge_tower' ? '📚' :
                  activeBuilding.id === 'mine_training' ? '⚔️' :
                  activeBuilding.id === 'workshop' ? '🎨' :
                  activeBuilding.id === 'village' ? '🏮' :
                  activeBuilding.id === 'sanctuary' ? '🌿' : '🏠'
                ) : '⚔️'}
              </span>
              <h2 className="text-base sm:text-lg font-pixel font-bold tracking-wide text-slate-100 uppercase leading-none">
                {activeBuilding ? activeBuilding.name.toUpperCase() : 'REALM QUEST BOARD'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              {activeBuilding 
                ? `Complete ${activeBuilding.attributeName} quests to evolve this landmark in the world.`
                : 'Complete real-life habits to harvest XP, gold, and elevate your attributes.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                onOpenCreateQuest(selectedLocationId || undefined, currentAttr || undefined);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400/80 bg-amber-400/10 hover:bg-amber-400/25 text-amber-300 font-pixel text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">New Quest</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* LANDMARK WORLD PROGRESS CARD (WHAT CHANGED / PROGRESSION PREVIEW)   */}
        {/* =================================================================== */}
        {activeBuilding && currentAttr && stats && (
          <div className="px-5 sm:px-6 py-2.5 bg-[#0f172a]/90 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-pixel font-bold uppercase px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/40 text-amber-300">
                TIER {currentTier}
              </span>
              <span className="text-slate-200 font-medium">
                {activeBuilding.name}: <span className="text-amber-300 font-mono font-bold">{currentAttrPoints}</span> / {nextTierPoints} {activeBuilding.attributeName.toUpperCase()}
              </span>
            </div>

            <div className="w-full sm:w-48 flex items-center gap-2">
              <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${tierProgressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {tierProgressPercent}%
              </span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* LOCATION / HUB SELECTOR TABS                                        */}
        {/* =================================================================== */}
        <div className="px-4 py-2 bg-[#070e1b]/95 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto select-none scrollbar-none">
          {categories.map((cat) => {
            const isSelected = (!cat.locationId && !selectedLocationId) || (cat.locationId && selectedLocationId === cat.locationId);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sounds.playClick();
                  if (onSelectLocationFilter) {
                    onSelectLocationFilter(cat.locationId || null);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-pixel transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400/15 border border-amber-400/70 text-amber-300 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50'
                }`}
              >
                {cat.icon && <span className="opacity-85">{cat.icon}</span>}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* QUEST LIST (GAME-STYLE INTERFACE WITH PROGRESSIVE DISCLOSURE)       */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs font-pixel font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>DAILY QUESTS</span>
            <span className="font-mono text-slate-500 text-[11px]">
              {filteredQuests.filter(q => !q.isCompleted).length} AVAILABLE
            </span>
          </div>

          {filteredQuests.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center bg-[#070e1b]/40 rounded-xl border border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-2xl mb-3">
                ⚔️
              </div>
              <p className="text-sm font-pixel text-slate-300">No active quests in this location</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Click "+ New Quest" above to commission a custom habit!
              </p>
            </div>
          ) : (
            filteredQuests.map((quest) => {
              const isExpanded = expandedQuestId === quest.id;
              return (
                <div
                  key={quest.id}
                  className={`rounded-xl border transition-all ${
                    quest.isCompleted
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-65'
                      : 'bg-[#0d1728]/90 hover:bg-[#111f36] border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Primary Row: Title, Tag, Rewards, and Complete Button */}
                  <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Left: Quest Title & Attribute Tag */}
                    <div 
                      onClick={() => toggleQuestExpand(quest.id)}
                      className="flex items-start gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <span className="text-lg select-none shrink-0 mt-0.5">⚔️</span>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm sm:text-base font-semibold leading-tight ${
                            quest.isCompleted ? 'text-slate-400 line-through' : 'text-slate-100 group-hover:text-amber-200'
                          }`}>
                            {quest.title}
                          </h4>
                          {quest.isDaily && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-950/60 border border-orange-500/40 text-orange-400 text-[10px] font-pixel flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-orange-400" />
                              <span>DAILY</span>
                            </span>
                          )}
                        </div>

                        {/* Attribute Badge & Reward Summary */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${getAttributeColor(quest.attribute)}`}>
                            <span>{getAttributeIcon(quest.attribute)}</span>
                            <span>{quest.attribute.toUpperCase()}</span>
                          </span>

                          <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                            ⭐ +{quest.xpReward} XP
                          </span>

                          <span className="text-xs font-mono font-bold text-yellow-300 flex items-center gap-1">
                            🟡 +{quest.goldReward} GOLD
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      {/* Expand / Details Toggle Button */}
                      <button
                        onClick={() => toggleQuestExpand(quest.id)}
                        className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title={isExpanded ? 'Hide Details' : 'Show Details'}
                      >
                        <span className="text-[11px] font-sans">Details</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Complete Action Button */}
                      {quest.isCompleted ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 text-xs font-pixel font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>COMPLETED</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onCompleteQuest(quest);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-pixel text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer uppercase tracking-wide"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>COMPLETE</span>
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Progressive Disclosure: Details Drawer (The 3 Questions) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-[#070e1b]/60 rounded-b-xl space-y-2.5 animate-in fade-in duration-150 text-xs">
                      {/* 1. WHAT CAN I DO? */}
                      <div className="flex items-start gap-2">
                        <span className="font-pixel font-bold text-amber-300 uppercase shrink-0 text-[10px] w-28">
                          1. WHAT CAN I DO?
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {quest.description || 'Focus on completing this real-life task.'}
                        </p>
                      </div>

                      {/* 2. WHAT WILL I GET? */}
                      <div className="flex items-start gap-2">
                        <span className="font-pixel font-bold text-sky-300 uppercase shrink-0 text-[10px] w-28">
                          2. WHAT WILL I GET?
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          Gain <strong className="text-amber-300 font-mono">+{quest.xpReward} XP</strong>, <strong className="text-yellow-300 font-mono">+{quest.goldReward} Gold</strong>, and <strong className="text-sky-300 font-mono">+{quest.attributeReward} {quest.attribute.toUpperCase()}</strong> points.
                        </p>
                      </div>

                      {/* 3. WHAT CHANGED? */}
                      <div className="flex items-start gap-2">
                        <span className="font-pixel font-bold text-emerald-300 uppercase shrink-0 text-[10px] w-28">
                          3. WHAT CHANGED?
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          Advances your character level and physically evolves the <strong className="text-slate-100">{quest.locationId.replace('_', ' ')}</strong> in the playable world!
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* =================================================================== */}
        {/* FOOTER NOTE                                                         */}
        {/* =================================================================== */}
        <div className="px-5 sm:px-6 py-3 bg-[#070e1b] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Every real-life task transforms the realm around you</span>
          </span>
          <span className="font-mono text-slate-500 text-[11px]">
            {quests.filter(q => q.isCompleted).length} completed today
          </span>
        </div>

      </div>
    </div>
  );
};
