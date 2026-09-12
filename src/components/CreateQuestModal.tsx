import React, { useState } from 'react';
import { LocationId, AttributeType, Quest } from '../types';
import { WORLD_LOCATIONS } from '../utils/storage';
import { X, Plus, Sparkles, Flame, KeyRound, Star } from 'lucide-react';
import { sounds } from '../utils/sound';

interface CreateQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocationId?: LocationId;
  defaultAttribute?: AttributeType;
  onCreateQuest: (newQuest: Omit<Quest, 'id' | 'isCompleted'>) => void;
}

export const CreateQuestModal: React.FC<CreateQuestModalProps> = ({
  isOpen,
  onClose,
  defaultLocationId = 'knowledge_tower',
  defaultAttribute = 'intellect',
  onCreateQuest
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState<LocationId>(defaultLocationId);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'legendary'>('medium');
  const [isDaily, setIsDaily] = useState(true);

  const difficultyRewards = {
    easy: { xp: 45, gold: 15, attr: 2 },
    medium: { xp: 80, gold: 25, attr: 3 },
    hard: { xp: 160, gold: 50, attr: 5 },
    legendary: { xp: 320, gold: 100, attr: 8 }
  };

  const currentRewards = difficultyRewards[difficulty];
  const selectedMeta = WORLD_LOCATIONS[locationId];
  const attribute = selectedMeta.attribute === 'all' ? 'intellect' : (selectedMeta.attribute as AttributeType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    sounds.playCoin();
    onCreateQuest({
      title: title.trim(),
      description: description.trim() || `Real-world discipline for ${selectedMeta.name}`,
      attribute,
      locationId,
      xpReward: currentRewards.xp,
      goldReward: currentRewards.gold,
      attributeReward: currentRewards.attr,
      isDaily,
      difficulty
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#0a1120] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-800/80">
          <div>
            <h2 className="text-base sm:text-lg font-pixel font-bold tracking-wide text-slate-100 uppercase leading-none">
              COMMISSION NEW QUEST
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Transform a real-life habit into an RPG world milestone
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mission Title */}
          <div>
            <label className="block text-xs font-pixel text-slate-300 mb-1.5 font-bold">
              QUEST TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study algorithms for 2 hours, Morning 5k run..."
              className="w-full px-3.5 py-2.5 bg-[#070e1b] rounded-lg border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-pixel text-slate-300 mb-1.5 font-bold">
              NOTES & CRITERIA (OPTIONAL)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Focus timer, specific milestone or metric to conquer..."
              rows={2}
              className="w-full px-3.5 py-2 bg-[#070e1b] rounded-lg border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Location / Life Sector */}
          <div>
            <label className="block text-xs font-pixel text-slate-300 mb-1.5 font-bold">
              SECTOR & ATTRIBUTE
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(WORLD_LOCATIONS) as LocationId[])
                .filter(id => id !== 'player_home')
                .map((loc) => {
                  const meta = WORLD_LOCATIONS[loc];
                  const isSelected = locationId === loc;
                  return (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => {
                        sounds.playClick();
                        setLocationId(loc);
                      }}
                      className={`p-2 rounded-lg border text-left text-xs font-mono flex flex-col transition-all ${
                        isSelected
                          ? 'bg-[#132038] border-amber-400 text-amber-300 font-semibold shadow-sm'
                          : 'bg-[#070e1b] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[11px] font-pixel text-slate-200 truncate">{meta.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">+{meta.attribute}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Difficulty & Rewards Tier */}
          <div>
            <label className="block text-xs font-pixel text-slate-300 mb-1.5 font-bold">
              CHALLENGE INTENSITY
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'legendary'] as const).map((diff) => {
                const isSelected = difficulty === diff;
                return (
                  <button
                    type="button"
                    key={diff}
                    onClick={() => {
                      sounds.playClick();
                      setDifficulty(diff);
                    }}
                    className={`py-1.5 px-1 text-center rounded-lg border capitalize text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-[#070e1b] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculated Rewards Preview */}
          <div className="p-3 bg-[#070e1b] rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold text-[10px] uppercase">QUEST YIELD:</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-semibold">+{currentRewards.xp} XP</span>
              <span className="text-yellow-300 font-semibold">+{currentRewards.gold} G</span>
              <span className="text-sky-400 font-semibold">+{currentRewards.attr} {attribute.toUpperCase()}</span>
            </div>
          </div>

          {/* Daily Habit Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDaily}
              onChange={(e) => setIsDaily(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-amber-400 bg-slate-900 focus:ring-0"
            />
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Daily Habit (strengthens habit streak)
            </span>
          </label>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-pixel font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>COMMISSION QUEST</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
