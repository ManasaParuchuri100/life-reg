import React, { useState } from 'react';
import { InventoryItem, ItemRarity, PlayerStats } from '../types';
import { Coins, Sparkles, Check, ShoppingBag, Shield, Tag, Sparkle } from 'lucide-react';
import { sounds } from '../utils/sound';

interface InventoryViewProps {
  stats: PlayerStats;
  inventory: InventoryItem[];
  onEquipItem: (item: InventoryItem) => void;
  onBuyItem: (item: InventoryItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  stats,
  inventory,
  onEquipItem,
  onBuyItem
}) => {
  const [viewMode, setViewMode] = useState<'owned' | 'shop'>('owned');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem>(inventory[0]);

  const rarityColors: Record<ItemRarity, { border: string; bg: string; text: string; glow: string }> = {
    common: { border: 'border-slate-700', bg: 'bg-slate-900', text: 'text-slate-300', glow: '' },
    uncommon: { border: 'border-emerald-600', bg: 'bg-emerald-950/40', text: 'text-emerald-400', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
    rare: { border: 'border-blue-500', bg: 'bg-blue-950/40', text: 'text-blue-400', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.25)]' },
    epic: { border: 'border-purple-500', bg: 'bg-purple-950/40', text: 'text-purple-400', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' },
    legendary: { border: 'border-amber-400', bg: 'bg-amber-950/40', text: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.35)]' }
  };

  const filteredItems = inventory.filter((item) => {
    if (viewMode === 'owned' && !item.isOwned) return false;
    if (viewMode === 'shop' && item.isOwned) return false;
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    return true;
  });

  const isEquipped = (item: InventoryItem) => {
    return (
      stats.equipped.weapon === item.id ||
      stats.equipped.headgear === item.id ||
      stats.equipped.armor === item.id ||
      stats.equipped.pet === item.id
    );
  };

  const handleSelectItem = (item: InventoryItem) => {
    sounds.playItemPickup();
    setSelectedItem(item);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 font-sans">
      {/* Top Header with Gold Wallet */}
      <div className="bg-slate-900 border-3 border-slate-700 rounded-3xl p-5 sm:p-6 mb-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-retro text-amber-400 uppercase tracking-widest">[ VOXEL VAULT ]</span>
          <h1 className="text-2xl sm:text-3xl font-pixel font-bold text-white mt-0.5">
            Inventory & Village Market
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Collect tools, headgear, robes, and companions forged through real-life productivity.
          </p>
        </div>

        {/* Treasury Pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-amber-950/60 rounded-2xl border-2 border-amber-500/60 shadow-lg">
          <Coins className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce-slow" />
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-amber-300/80 leading-none">GOLD COINS</span>
            <span className="font-retro text-sm text-amber-300 font-bold leading-tight">
              {stats.gold}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid & Inspector Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* ========================================================= */}
        {/* LEFT: 5-COLUMN VOXEL INVENTORY GRID (5x3 / 5x4)          */}
        {/* ========================================================= */}
        <div className="md:col-span-7 bg-slate-900 border-3 border-slate-700 rounded-3xl p-5 shadow-xl flex flex-col">
          
          {/* Sub Navigation Bar: Bag vs Shop */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  sounds.playClick();
                  setViewMode('owned');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-pixel transition-all ${
                  viewMode === 'owned'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎒 MY BAG ({inventory.filter(i => i.isOwned).length})
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setViewMode('shop');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-pixel transition-all ${
                  viewMode === 'shop'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏪 SHOP ({inventory.filter(i => !i.isOwned).length})
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-pixel">
              {['all', 'weapon', 'headgear', 'armor', 'pet'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedType(type);
                  }}
                  className={`px-2 py-1 rounded-lg capitalize transition-colors ${
                    selectedType === type
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
          </div>

          {/* 5-Column Sandbox Inventory Grid: ┌────┬────┬────┬────┬────┐ */}
          <div className="grid grid-cols-5 gap-2 sm:gap-2.5 flex-1 min-h-[320px] bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            {filteredItems.map((item) => {
              const rarityStyle = rarityColors[item.rarity];
              const isSelected = selectedItem?.id === item.id;
              const equippedStatus = isEquipped(item);

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedItem(item)}
                  className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1.5 cursor-pointer transition-all ${
                    rarityStyle.border
                  } ${rarityStyle.bg} ${rarityStyle.glow} ${
                    isSelected 
                      ? 'ring-3 ring-amber-400 scale-105 z-10' 
                      : 'hover:scale-102 opacity-95 hover:opacity-100 hover:border-amber-400/60'
                  }`}
                >
                  {/* Equipped Indicator */}
                  {equippedStatus && (
                    <div className="absolute top-1 left-1 px-1 py-0.2 bg-amber-400 text-slate-950 font-retro text-[8px] font-bold rounded shadow">
                      EQUIP
                    </div>
                  )}

                  {/* Icon */}
                  <div className="text-2xl sm:text-3xl filter drop-shadow">
                    {item.icon}
                  </div>

                  {/* Tiny Item Name */}
                  <div className="text-[9px] font-pixel text-center text-slate-300 truncate w-full mt-1">
                    {item.name}
                  </div>

                  {/* Cost badge for shop mode */}
                  {viewMode === 'shop' && (
                    <div className="text-[8px] font-mono font-bold text-amber-300 flex items-center gap-0.5">
                      🟡{item.cost}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty slots placeholders to keep 5-column grid look */}
            {[...Array(Math.max(0, 15 - filteredItems.length))].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-800/80 bg-slate-950/40 flex items-center justify-center text-slate-700 text-xs font-mono"
              >
                —
              </div>
            ))}
          </div>

          <div className="mt-3 text-[10px] font-mono text-slate-500 text-center">
            Tip: Hover or tap any slot to inspect item stats and details
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT: ITEM INSPECTOR PANEL                               */}
        {/* ITEM NAME / Description / Rarity / Effect / Price         */}
        {/* ========================================================= */}
        <div className="md:col-span-5 bg-slate-900 border-3 border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          {selectedItem ? (
            <>
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-retro uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    rarityColors[selectedItem.rarity].text
                  } ${rarityColors[selectedItem.rarity].border} bg-slate-950`}>
                    {selectedItem.rarity} {selectedItem.type.toUpperCase()}
                  </span>

                  {selectedItem.isOwned && isEquipped(selectedItem) && (
                    <span className="text-xs font-pixel text-amber-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  )}
                </div>

                {/* Big Preview Stage */}
                <div className="w-full py-7 bg-slate-950/80 rounded-2xl border-2 border-slate-800 flex flex-col items-center justify-center mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-amber-400/5 to-transparent pointer-events-none" />
                  
                  <span className="text-6xl filter drop-shadow-xl animate-float">
                    {selectedItem.icon}
                  </span>
                  
                  {/* ITEM NAME */}
                  <h3 className="text-xl font-pixel font-bold text-white mt-3 tracking-wide">
                    {selectedItem.name}
                  </h3>
                  
                  <span className="text-xs font-mono text-slate-400 capitalize mt-0.5">
                    Slot: {selectedItem.type}
                  </span>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <span className="text-[10px] font-pixel text-slate-400 block mb-1">DESCRIPTION</span>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    "{selectedItem.description}"
                  </p>
                </div>

                {/* Effect / Stat Boost */}
                <div className="mb-3">
                  <span className="text-[10px] font-pixel text-slate-400 block mb-1">EFFECT & BOOST</span>
                  {selectedItem.attributeBonus ? (
                    <div className="p-3 bg-indigo-950/50 rounded-xl border border-indigo-700/50 flex items-center justify-between">
                      <span className="text-xs font-mono text-indigo-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Attribute Power Boost:
                      </span>
                      <span className="text-xs font-retro text-amber-300 font-bold">
                        +{selectedItem.attributeBonus.value} {selectedItem.attributeBonus.attribute.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
                      Cosmetic flair with realm prestige.
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono mb-4">
                  <span className="text-slate-400">MARKET VALUE:</span>
                  <span className="font-retro text-amber-300 font-bold flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-400" />
                    {selectedItem.cost} GOLD
                  </span>
                </div>
              </div>

              {/* Action Buttons: Equip, Unequip, Buy */}
              <div className="pt-3 border-t border-slate-800">
                {selectedItem.isOwned ? (
                  isEquipped(selectedItem) ? (
                    <button 
                      disabled 
                      className="w-full py-3 bg-slate-800 text-slate-400 font-pixel font-bold text-xs rounded-xl cursor-default"
                    >
                      CURRENTLY EQUIPPED ON HERO
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playEquip();
                        onEquipItem(selectedItem);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-pixel font-bold text-xs rounded-xl pixel-btn shadow-lg transition-all active:scale-95"
                    >
                      EQUIP ON HERO
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      sounds.playGoldGain();
                      onBuyItem(selectedItem);
                    }}
                    disabled={stats.gold < selectedItem.cost}
                    className={`w-full py-3 font-pixel font-bold text-xs rounded-xl pixel-btn shadow-lg transition-all flex items-center justify-center gap-2 ${
                      stats.gold >= selectedItem.cost
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>
                      {stats.gold >= selectedItem.cost 
                        ? `PURCHASE FOR ${selectedItem.cost} GOLD` 
                        : `NEED ${selectedItem.cost - stats.gold} MORE GOLD`}
                    </span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
              Select an item to inspect
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
