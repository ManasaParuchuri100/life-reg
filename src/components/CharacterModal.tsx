import React from 'react';
import { PlayerStats, InventoryItem, AttributeType } from '../types';
import { PixelCharacter } from './PixelCharacter';
import { X, Shield, Heart, Star, Sparkles, BookOpen, Dumbbell, Palette, Users, Flower2, KeyRound, Flame, Award } from 'lucide-react';
import { sounds } from '../utils/sound';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  inventory: InventoryItem[];
  onOpenInventory: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  stats,
  inventory,
  onOpenInventory
}) => {
  if (!isOpen) return null;

  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100));
  const energyPercent = Math.min(100, Math.round((stats.hp / stats.maxHp) * 100));

  const attributesConfig: { key: AttributeType; label: string; value: number; icon: React.ReactNode; color: string; bg: string; location: string }[] = [
    { 
      key: 'intellect', 
      label: 'Intellect', 
      value: stats.attributes.intellect, 
      icon: <BookOpen className="w-4 h-4 text-sky-400" />, 
      color: 'text-sky-400',
      bg: 'bg-sky-500',
      location: 'Knowledge Tower' 
    },
    { 
      key: 'strength', 
      label: 'Strength', 
      value: stats.attributes.strength, 
      icon: <Dumbbell className="w-4 h-4 text-rose-400" />, 
      color: 'text-rose-400',
      bg: 'bg-rose-500',
      location: 'Training Grounds' 
    },
    { 
      key: 'creativity', 
      label: 'Creativity', 
      value: stats.attributes.creativity, 
      icon: <Palette className="w-4 h-4 text-amber-400" />, 
      color: 'text-amber-400',
      bg: 'bg-amber-500',
      location: 'Creative Workshop' 
    },
    { 
      key: 'social', 
      label: 'Social', 
      value: stats.attributes.social, 
      icon: <Users className="w-4 h-4 text-emerald-400" />, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-500',
      location: 'Lantern Village' 
    },
    { 
      key: 'wellness', 
      label: 'Wellness', 
      value: stats.attributes.wellness, 
      icon: <Flower2 className="w-4 h-4 text-pink-400" />, 
      color: 'text-pink-400',
      bg: 'bg-pink-500',
      location: 'Moonlit Garden' 
    },
  ];

  const equippedWeapon = inventory.find(i => i.id === stats.equipped.weapon) || { name: 'Practice Wooden Sword', icon: '🗡️' };
  const equippedHeadgear = inventory.find(i => i.id === stats.equipped.headgear) || { name: 'Wanderer Cap', icon: '🧢' };
  const equippedArmor = inventory.find(i => i.id === stats.equipped.armor) || { name: 'Sturdy Linen Tunic', icon: '🥋' };
  const equippedPet = inventory.find(i => i.id === stats.equipped.pet) || { name: 'Midnight Familiar', icon: '🐈‍⬛' };

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
        <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-800 bg-[#070e1b]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl select-none">👤</span>
              <h2 className="text-base sm:text-lg font-pixel font-bold tracking-wide text-slate-100 uppercase leading-none">
                [ CHARACTER ]
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Level {stats.level} {stats.title} · Life RPG Progression
            </p>
          </div>

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

        {/* Content Body: Two columns */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Avatar & Vitals */}
          <div className="md:col-span-5 flex flex-col items-center">
            
            {/* Pixel Character Frame */}
            <div className="w-full py-6 px-4 bg-[#070e1b] rounded-lg border border-slate-800 flex flex-col items-center justify-center shadow-inner relative">
              <div className="my-3">
                <PixelCharacter 
                  size="lg"
                  animationState="idle"
                  facingLeft={false}
                  equipped={stats.equipped}
                />
              </div>

              <div className="mt-2 text-center">
                <span className="font-pixel font-bold text-xs text-amber-300 uppercase tracking-wide">
                  ARI · {stats.title.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Vitals Progress */}
            <div className="w-full mt-4 space-y-3">
              {/* Level & XP */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold font-pixel text-[11px]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>LEVEL {stats.level}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {stats.xp} / {stats.xpToNextLevel} XP
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-300 shadow"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>

              {/* Energy / HP */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold font-pixel text-[11px]">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>ENERGY</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {stats.hp} / {stats.maxHp}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow"
                    style={{ width: `${energyPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Equipped Gear Slots */}
            <div className="w-full mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-pixel font-bold text-slate-300 uppercase tracking-wider">
                  EQUIPMENT
                </span>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenInventory();
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-pixel underline cursor-pointer"
                >
                  Change Gear →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* [ Head ] Slot */}
                <div 
                  onClick={() => {
                    sounds.playClick();
                    onOpenInventory();
                  }}
                  className="p-2.5 rounded-xl bg-[#070e1b] border border-slate-800 hover:border-amber-400/60 cursor-pointer transition-all flex items-center gap-2 group shadow-inner"
                  title="Headgear Slot"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-lg shrink-0">
                    {equippedHeadgear.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block leading-none">
                      [ Head ]
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5 group-hover:text-amber-300">
                      {equippedHeadgear.name}
                    </span>
                  </div>
                </div>

                {/* [ Body ] Slot */}
                <div 
                  onClick={() => {
                    sounds.playClick();
                    onOpenInventory();
                  }}
                  className="p-2.5 rounded-xl bg-[#070e1b] border border-slate-800 hover:border-amber-400/60 cursor-pointer transition-all flex items-center gap-2 group shadow-inner"
                  title="Armor / Body Slot"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-lg shrink-0">
                    {equippedArmor.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block leading-none">
                      [ Body ]
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5 group-hover:text-amber-300">
                      {equippedArmor.name}
                    </span>
                  </div>
                </div>

                {/* [ Weapon ] Slot */}
                <div 
                  onClick={() => {
                    sounds.playClick();
                    onOpenInventory();
                  }}
                  className="p-2.5 rounded-xl bg-[#070e1b] border border-slate-800 hover:border-amber-400/60 cursor-pointer transition-all flex items-center gap-2 group shadow-inner"
                  title="Weapon / Tool Slot"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-lg shrink-0">
                    {equippedWeapon.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block leading-none">
                      [ Weapon ]
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5 group-hover:text-amber-300">
                      {equippedWeapon.name}
                    </span>
                  </div>
                </div>

                {/* [ Accessory ] Slot */}
                <div 
                  onClick={() => {
                    sounds.playClick();
                    onOpenInventory();
                  }}
                  className="p-2.5 rounded-xl bg-[#070e1b] border border-slate-800 hover:border-amber-400/60 cursor-pointer transition-all flex items-center gap-2 group shadow-inner"
                  title="Accessory / Familiar Slot"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-lg shrink-0">
                    {equippedPet.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block leading-none">
                      [ Accessory ]
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5 group-hover:text-amber-300">
                      {equippedPet.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Realm Attributes & Milestones */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            
            {/* Attributes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-pixel font-bold text-slate-300 uppercase tracking-wider">
                  ATTRIBUTES
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  MAX 25 PTS
                </span>
              </div>

              <div className="space-y-2">
                {attributesConfig.map((attr) => {
                  const maxDisplay = 25;
                  const percent = Math.min(100, Math.round((attr.value / maxDisplay) * 100));
                  // Calculate 10-block visual meter (e.g. ███████░░░)
                  const totalBlocks = 10;
                  const filledBlocks = Math.min(totalBlocks, Math.round((attr.value / maxDisplay) * totalBlocks));
                  const emptyBlocks = totalBlocks - filledBlocks;
                  const blockString = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

                  return (
                    <div 
                      key={attr.key}
                      className="p-2.5 rounded-xl bg-[#0d1728]/80 border border-slate-800 flex flex-col gap-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base select-none">
                            {attr.key === 'intellect' ? '🧠' :
                             attr.key === 'strength' ? '💪' :
                             attr.key === 'creativity' ? '🎨' :
                             attr.key === 'social' ? '🫂' : '🌿'}
                          </span>
                          <span className="font-pixel font-bold text-slate-100 text-[11px] uppercase tracking-wide">
                            {attr.label}
                          </span>
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            ({attr.location})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Visual Block Meter */}
                          <span className={`font-mono text-xs tracking-tighter ${attr.color}`}>
                            {blockString}
                          </span>
                          <span className="font-mono font-bold text-slate-200 text-xs w-8 text-right">
                            {attr.value}
                          </span>
                        </div>
                      </div>

                      {/* Smooth Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full ${attr.bg} rounded-full transition-all duration-300`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestones Card */}
            <div className="p-3.5 rounded-lg bg-[#070e1b] border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                LIFETIME ACHIEVEMENTS
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <div className="flex items-center justify-center gap-1 text-orange-400 font-bold font-pixel text-sm">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    <span>{stats.streak}d</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Active Streak</span>
                </div>

                <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <div className="flex items-center justify-center gap-1 text-amber-400 font-bold font-pixel text-sm">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{stats.gold}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Gold Stashed</span>
                </div>

                <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold font-pixel text-sm">
                    <Award className="w-3.5 h-3.5" />
                    <span>{stats.completedQuestsCount}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Quests Done</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#070e1b]/80 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Equip new artifacts in your Treasure Chest to raise stats
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenInventory();
            }}
            className="text-amber-300 hover:text-amber-200 font-semibold transition-colors underline"
          >
            Open Treasure Chest →
          </button>
        </div>

      </div>
    </div>
  );
};
