import React, { useState } from 'react';
import { LocationId, Quest, PlayerStats, AttributeType } from '../types';
import { WORLD_LOCATIONS, getLocationTier } from '../utils/storage';
import { X, Plus, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Flame, Clock, CheckSquare } from 'lucide-react';
import { sounds } from '../utils/sound';

interface LocationModalProps {
  locationId: LocationId | null;
  onClose: () => void;
  quests: Quest[];
  stats: PlayerStats;
  onCompleteQuest: (quest: Quest) => void;
  onOpenCreateQuest: (locationId: LocationId, attribute: AttributeType) => void;
  onSwitchLocation: (locId: LocationId) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  locationId,
  onClose,
  quests,
  stats,
  onCompleteQuest,
  onOpenCreateQuest,
  onSwitchLocation
}) => {
  if (!locationId) return null;

  const meta = WORLD_LOCATIONS[locationId];
  const attributeScore = locationId === 'player_home' 
    ? Math.floor((stats.attributes.intellect + stats.attributes.strength + stats.attributes.creativity + stats.attributes.social + stats.attributes.wellness) / 5)
    : stats.attributes[meta.attribute as AttributeType];

  const tierInfo = getLocationTier(attributeScore);
  const locationQuests = quests.filter(q => locationId === 'player_home' || q.locationId === locationId);
  
  // Group into Daily Quests vs Other Active Quests vs Completed
  const dailyQuests = locationQuests.filter(q => q.isDaily && !q.isCompleted);
  const regularQuests = locationQuests.filter(q => !q.isDaily && !q.isCompleted);
  const completedQuests = locationQuests.filter(q => q.isCompleted);

  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'completed'>('all');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  const attributeIcons: Record<string, string> = {
    intellect: '🧠',
    strength: '💪',
    creativity: '🎨',
    social: '👥',
    wellness: '🌿',
    all: '⭐'
  };

  const nextTierRequirement = tierInfo.tier === 1 ? 12 : tierInfo.tier === 2 ? 25 : tierInfo.tier === 3 ? 45 : 100;
  const progressPercent = Math.min(100, Math.round((attributeScore / nextTierRequirement) * 100));

  const toggleExpand = (id: string) => {
    sounds.playClick();
    setExpandedQuestId(prev => prev === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border-3 border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* HEADER: Location Title & Attribute Info                  */}
        {/* ========================================================= */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${meta.color} relative overflow-hidden border-b-2 border-slate-700`}>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-black/40 text-amber-300 font-retro text-[9px] rounded uppercase tracking-wider">
                  {tierInfo.badge}
                </span>
                <span className="text-white/85 font-mono text-xs font-semibold">
                  {meta.tagline}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-pixel font-bold text-white drop-shadow flex items-center gap-2">
                <span>{attributeIcons[meta.attribute]}</span>
                <span>{meta.name.toUpperCase()}</span>
              </h2>
              <p className="text-xs sm:text-sm text-white/90 font-sans mt-0.5 max-w-md">
                {meta.description}
              </p>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-colors border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Building Progression Meter */}
          <div className="mt-3 pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-white/90 font-mono flex items-center gap-2">
              <span className="font-bold">{attributeIcons[meta.attribute]} {meta.attribute.toUpperCase()} POWER:</span>
              <span className="text-amber-200 font-retro text-xs">{attributeScore} pts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28 sm:w-40 h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/30">
                <div 
                  className="h-full bg-amber-300 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-white/80 whitespace-nowrap">
                {tierInfo.tier < 4 ? `${attributeScore}/${nextTierRequirement} to Next Stage` : 'CITADEL STAGE'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ACTION BAR & TABS                                         */}
        {/* ========================================================= */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-pixel transition-all ${
                activeTab === 'all'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL MISSIONS ({locationQuests.filter(q => !q.isCompleted).length})
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('daily');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-pixel transition-all ${
                activeTab === 'daily'
                  ? 'bg-orange-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔥 DAILY ({dailyQuests.length})
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('completed');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-pixel transition-all ${
                activeTab === 'completed'
                  ? 'bg-emerald-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              COMPLETED ({completedQuests.length})
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenCreateQuest(locationId, meta.attribute === 'all' ? 'intellect' : meta.attribute as AttributeType);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-pixel text-xs font-bold rounded-xl pixel-btn transition-all shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>COMMISSION QUEST</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* QUEST LIST WITH PROGRESSIVE DISCLOSURE                   */}
        {/* ========================================================= */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 min-h-[260px]">
          {activeTab === 'completed' ? (
            completedQuests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-sans text-xs flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-slate-600 mb-2" />
                No completed missions recorded here yet. Finish a quest to see your triumphs!
              </div>
            ) : (
              completedQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs opacity-75"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-pixel text-slate-300 font-bold line-through text-sm">
                        {quest.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Claimed: +{quest.xpReward} XP • +{quest.goldReward} Gold • +{quest.attributeReward} {quest.attribute.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800">
                    CLAIMED
                  </span>
                </div>
              ))
            )
          ) : (
            <>
              {/* Daily Quests Section Header if on 'all' tab */}
              {activeTab === 'all' && dailyQuests.length > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-retro text-orange-400 tracking-wider">
                    🔥 DAILY QUESTS & HABIT RITUALS
                  </span>
                  <div className="h-px bg-slate-800 flex-1" />
                </div>
              )}

              {/* Render Daily Quests first */}
              {(activeTab === 'daily' ? dailyQuests : activeTab === 'all' ? dailyQuests : []).map(quest => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  isExpanded={expandedQuestId === quest.id}
                  onToggleExpand={() => toggleExpand(quest.id)}
                  onComplete={() => onCompleteQuest(quest)}
                  attributeIcons={attributeIcons}
                />
              ))}

              {/* Regular Quests Section Header if on 'all' tab */}
              {activeTab === 'all' && regularQuests.length > 0 && (
                <div className="flex items-center gap-2 mt-4 mb-1">
                  <span className="text-xs font-retro text-amber-400 tracking-wider">
                    ⚔️ ACTIVE MILESTONE MISSIONS
                  </span>
                  <div className="h-px bg-slate-800 flex-1" />
                </div>
              )}

              {activeTab === 'all' && regularQuests.map(quest => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  isExpanded={expandedQuestId === quest.id}
                  onToggleExpand={() => toggleExpand(quest.id)}
                  onComplete={() => onCompleteQuest(quest)}
                  attributeIcons={attributeIcons}
                />
              ))}

              {/* Empty state */}
              {locationQuests.filter(q => !q.isCompleted).length === 0 && (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl mb-3 border border-slate-700">
                    ⚔️
                  </div>
                  <h4 className="text-base font-pixel text-slate-200 font-bold">All Quests Conquered!</h4>
                  <p className="text-xs text-slate-400 font-sans max-w-xs mt-1">
                    You have cleared all active missions here. Add a new real-life goal or daily habit to fuel the realm!
                  </p>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onOpenCreateQuest(locationId, meta.attribute === 'all' ? 'intellect' : meta.attribute as AttributeType);
                    }}
                    className="mt-4 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-pixel font-bold text-xs rounded-xl pixel-btn shadow"
                  >
                    + Add New Goal for {meta.name}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Realm Jump Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-pixel">
          <span className="text-slate-400 text-[10px] font-mono uppercase whitespace-nowrap pl-1">TRAVEL TO:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(Object.keys(WORLD_LOCATIONS) as LocationId[]).map((id) => {
              const itemMeta = WORLD_LOCATIONS[id];
              const isSelected = id === locationId;
              return (
                <button
                  key={id}
                  onClick={() => {
                    sounds.playClick();
                    onSwitchLocation(id);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-bold shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{attributeIcons[itemMeta.attribute]}</span>
                  <span>{itemMeta.name}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

// =========================================================================
// QUEST CARD COMPONENT (WITH PROGRESSIVE DISCLOSURE)
// =========================================================================
interface QuestCardProps {
  quest: Quest;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: () => void;
  attributeIcons: Record<string, string>;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  isExpanded,
  onToggleExpand,
  onComplete,
  attributeIcons
}) => {
  return (
    <div className="p-4 bg-slate-800/85 hover:bg-slate-800 rounded-2xl border-2 border-slate-700 hover:border-amber-400/70 transition-all shadow-md flex flex-col gap-3 group">
      {/* Primary Row: Title, Attribute Badge, Quick Action */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={onToggleExpand}>
          <span className="text-2xl pt-0.5">⚔️</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-300 font-bold flex items-center gap-1">
                <span>{attributeIcons[quest.attribute]}</span>
                <span className="uppercase">{quest.attribute}</span>
              </span>

              {quest.isDaily && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] font-mono rounded border border-orange-500/40 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" /> DAILY RITUAL
                </span>
              )}

              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                {quest.difficulty}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-pixel font-bold text-white group-hover:text-amber-200 transition-colors leading-snug">
              {quest.title}
            </h3>

            {/* Collapsed summary description or prompt to expand */}
            {!isExpanded && quest.description && (
              <p className="text-xs text-slate-300 font-sans mt-0.5 line-clamp-1">
                {quest.description}
              </p>
            )}
          </div>
        </div>

        {/* Expand Details Trigger */}
        <button 
          onClick={onToggleExpand}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          title={isExpanded ? "Collapse details" : "Expand details"}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Progressive Disclosure Section */}
      {isExpanded && (
        <div className="pt-2 pb-1 border-t border-slate-700/60 font-sans text-xs text-slate-200 space-y-2 animate-in fade-in">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <div className="font-pixel text-amber-300 font-bold text-xs mb-1">
              MISSION DETAILS & OBJECTIVES
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {quest.description || 'Focus on completing this task today. Once finished, claim your rewards!'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
            <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Type: {quest.isDaily ? 'Daily Habit Loop' : 'Single Milestone'}</span>
            </div>
            <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Difficulty: {quest.difficulty.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Row & Complete Button (The exact visual prompt requirement) */}
      <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        {/* Reward Pill Counters */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">REWARD:</span>
          <span className="flex items-center gap-1 text-amber-300 font-bold">
            ⭐ +{quest.xpReward} XP
          </span>
          <span className="flex items-center gap-1 text-yellow-400 font-bold">
            🟡 +{quest.goldReward} GOLD
          </span>
          <span className="flex items-center gap-1 text-sky-300 font-bold">
            {attributeIcons[quest.attribute]} +{quest.attributeReward} {quest.attribute.toUpperCase()}
          </span>
        </div>

        {/* The Action Button */}
        <button
          onClick={onComplete}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-pixel font-bold text-xs rounded-xl pixel-btn shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>COMPLETE</span>
        </button>
      </div>
    </div>
  );
};
