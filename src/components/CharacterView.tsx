import React from 'react';
import { PlayerStats, InventoryItem, AttributeType } from '../types';
import { PixelCharacter } from './PixelCharacter';
import { Star, Shield, Sparkles, Award, Check, UserCheck } from 'lucide-react';
import { sounds } from '../utils/sound';

interface CharacterViewProps {
  stats: PlayerStats;
  inventory: InventoryItem[];
  onEquipItem: (item: InventoryItem) => void;
  onOpenInventoryTab: () => void;
}

export const CharacterView: React.FC<CharacterViewProps> = ({
  stats,
  inventory,
  onEquipItem,
  onOpenInventoryTab
}) => {
  const attributesList: { key: AttributeType; name: string; icon: string; location: string }[] = [
    { key: 'intellect', name: 'INTELLECT', icon: '🧠', location: 'Knowledge Tower' },
    { key: 'strength', name: 'STRENGTH', icon: '💪', location: 'Training Mine' },
    { key: 'creativity', name: 'CREATIVITY', icon: '🎨', location: 'Creative Workshop' },
    { key: 'social', name: 'SOCIAL', icon: '🫂', location: 'Community Village' },
    { key: 'wellness', name: 'WELLNESS', icon: '🌿', location: 'Garden Sanctuary' },
  ];

  // Owned equipment
  const ownedWeapons = inventory.filter(i => i.isOwned && i.type === 'weapon');
  const ownedHeadgears = inventory.filter(i => i.isOwned && i.type === 'headgear');
  const ownedArmors = inventory.filter(i => i.isOwned && i.type === 'armor');
  const ownedPets = inventory.filter(i => i.isOwned && i.type === 'pet');

  const currentlyEquippedWeapon = inventory.find(i => i.id === stats.equipped.weapon);
  const currentlyEquippedHeadgear = inventory.find(i => i.id === stats.equipped.headgear);
  const currentlyEquippedArmor = inventory.find(i => i.id === stats.equipped.armor);
  const currentlyEquippedPet = inventory.find(i => i.id === stats.equipped.pet);

  const totalAttributePoints = (Object.values(stats.attributes) as number[]).reduce((acc, curr) => acc + curr, 0);

  // Helper to render discrete 10-block voxel bar: ███████░░░
  const renderVoxelBlocks = (score: number, maxScore: number = 30) => {
    const totalBlocks = 10;
    const filledCount = Math.min(totalBlocks, Math.max(1, Math.round((score / maxScore) * totalBlocks)));
    return (
      <div className="flex items-center gap-1">
        {[...Array(totalBlocks)].map((_, idx) => {
          const isFilled = idx < filledCount;
          return (
            <div
              key={idx}
              className={`w-3.5 sm:w-4 h-5 rounded-xs border transition-all ${
                isFilled
                  ? 'bg-amber-400 border-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 opacity-60'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24">
      {/* Top Title */}
      <div className="text-center mb-5">
        <span className="text-xs font-retro text-amber-400 uppercase tracking-widest">[ HERO CODEX ]</span>
        <h1 className="text-3xl font-pixel font-bold text-white tracking-wide mt-1">
          [ CHARACTER ]
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Real-life achievements physically sculpt your hero's attributes and realm standing.
        </p>
      </div>

      {/* Main Character Showcase Card */}
      <div className="bg-slate-900 border-3 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-950/40 via-transparent to-transparent pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* ========================================================= */}
          {/* LEFT: Pixel Character Preview + Level Info                */}
          {/* ========================================================= */}
          <div className="md:col-span-5 flex flex-col items-center text-center">
            {/* Pixel Character Preview Box */}
            <div className="w-full py-8 px-6 bg-slate-950/85 rounded-3xl border-3 border-slate-800 shadow-inner flex flex-col items-center justify-center relative">
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800 text-[10px] font-mono text-slate-400">
                ACTIVE HERO
              </div>

              <div className="my-2">
                <PixelCharacter
                  size="xl"
                  animationState="idle"
                  equipped={stats.equipped}
                />
              </div>

              <div className="text-lg font-pixel font-bold text-white mt-3">
                {stats.name}
              </div>
              <div className="text-xs font-mono text-amber-300 font-semibold">
                "{stats.title}"
              </div>
            </div>

            {/* LEVEL & XP METER */}
            <div className="w-full mt-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <div className="text-xl font-pixel font-bold text-amber-300 tracking-wider">
                LEVEL {stats.level}
              </div>
              <div className="text-xs font-mono text-slate-300 mt-1 flex items-center justify-center gap-1.5 font-bold">
                <span>⭐ {stats.xp} / {stats.xpToNextLevel} XP</span>
              </div>
              {/* XP Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700 mt-2.5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100))}%` }}
                />
              </div>
            </div>

            {/* Summary counters */}
            <div className="w-full grid grid-cols-2 gap-2 mt-3 text-center text-xs font-mono">
              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">TOTAL POWER</span>
                <span className="text-amber-300 font-bold">{totalAttributePoints} pts</span>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">STREAK</span>
                <span className="text-orange-400 font-bold">{stats.streak} Days</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: ATTRIBUTES (VOXEL BARS) & EQUIPMENT SLOTS          */}
          {/* ========================================================= */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* ATTRIBUTES SECTION */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-pixel font-bold text-amber-400 tracking-wider">
                  ATTRIBUTES
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Visual Mastery Indicator
                </span>
              </div>

              <div className="space-y-3">
                {attributesList.map(attr => {
                  const score = stats.attributes[attr.key];
                  return (
                    <div 
                      key={attr.key}
                      className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-[150px]">
                        <span className="text-xl">{attr.icon}</span>
                        <div>
                          <div className="text-xs font-pixel font-bold text-white tracking-wide">
                            {attr.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {attr.location}
                          </div>
                        </div>
                      </div>

                      {/* Discrete Voxel Blocks + Score */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        {renderVoxelBlocks(score, 30)}
                        <span className="text-xs font-mono font-bold text-amber-300 min-w-[44px] text-right">
                          {score} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EQUIPMENT SLOTS SECTION */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-pixel font-bold text-amber-400 tracking-wider">
                  EQUIPMENT
                </h3>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenInventoryTab();
                  }}
                  className="text-xs font-pixel text-amber-300 hover:text-amber-200 underline"
                >
                  Open Backpack →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <EquipmentSlotItem
                  slotName="[ Head ]"
                  item={currentlyEquippedHeadgear}
                  fallbackIcon="🧢"
                  onClick={onOpenInventoryTab}
                />
                <EquipmentSlotItem
                  slotName="[ Body ]"
                  item={currentlyEquippedArmor}
                  fallbackIcon="🥋"
                  onClick={onOpenInventoryTab}
                />
                <EquipmentSlotItem
                  slotName="[ Weapon ]"
                  item={currentlyEquippedWeapon}
                  fallbackIcon="🗡️"
                  onClick={onOpenInventoryTab}
                />
                <EquipmentSlotItem
                  slotName="[ Pet ]"
                  item={currentlyEquippedPet}
                  fallbackIcon="🐱"
                  onClick={onOpenInventoryTab}
                />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Quick Wardrobe Swapper */}
      <div className="mt-6 bg-slate-900 border-3 border-slate-700 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-pixel font-bold text-white">
            Quick Wardrobe Change
          </h4>
          <span className="text-xs font-mono text-slate-400">
            Click any owned cosmetic to equip
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <WardrobeCategory title="WEAPONS" items={ownedWeapons} equippedId={stats.equipped.weapon} onEquip={onEquipItem} />
          <WardrobeCategory title="HEADGEAR" items={ownedHeadgears} equippedId={stats.equipped.headgear} onEquip={onEquipItem} />
          <WardrobeCategory title="OUTFITS" items={ownedArmors} equippedId={stats.equipped.armor} onEquip={onEquipItem} />
          <WardrobeCategory title="PETS" items={ownedPets} equippedId={stats.equipped.pet} onEquip={onEquipItem} />
        </div>
      </div>
    </div>
  );
};

const EquipmentSlotItem: React.FC<{
  slotName: string;
  item?: InventoryItem;
  fallbackIcon: string;
  onClick: () => void;
}> = ({ slotName, item, fallbackIcon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-3 bg-slate-950/80 hover:bg-slate-950 rounded-2xl border border-slate-800 hover:border-amber-400/70 transition-all cursor-pointer flex flex-col items-center text-center group"
    >
      <span className="text-[10px] font-pixel text-slate-400 group-hover:text-amber-300 transition-colors">
        {slotName}
      </span>
      <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl my-1.5 shadow-inner group-hover:scale-105 transition-transform">
        {item?.icon || fallbackIcon}
      </div>
      <span className="text-[11px] font-mono text-slate-200 font-bold truncate max-w-[90px]">
        {item?.name || 'Default'}
      </span>
    </div>
  );
};

const WardrobeCategory: React.FC<{
  title: string;
  items: InventoryItem[];
  equippedId: string;
  onEquip: (item: InventoryItem) => void;
}> = ({ title, items, equippedId, onEquip }) => {
  return (
    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
      <div className="text-[10px] font-pixel text-amber-400/90 font-bold mb-2 uppercase">{title}</div>
      <div className="space-y-1.5">
        {items.map(item => {
          const isEquipped = item.id === equippedId;
          return (
            <button
              key={item.id}
              onClick={() => {
                sounds.playEquip();
                onEquip(item);
              }}
              className={`w-full p-2 rounded-xl border text-left text-xs font-mono flex items-center justify-between gap-2 transition-all ${
                isEquipped
                  ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span>{item.icon}</span>
                <span className="truncate text-[11px]">{item.name}</span>
              </div>
              {isEquipped ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                  EQUIPPED
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 hover:text-white">
                  EQUIP
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
