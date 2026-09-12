import React, { useState } from 'react';
import { InventoryItem, PlayerStats } from '../types';
import { X, KeyRound, Check, Sparkles, Lock, Shield, Package, Sparkle } from 'lucide-react';
import { sounds } from '../utils/sound';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  inventory: InventoryItem[];
  onEquipItem: (item: InventoryItem) => void;
  onBuyItem: (item: InventoryItem) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  stats,
  inventory,
  onEquipItem,
  onBuyItem
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(inventory[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const selectedItem = inventory.find(i => i.id === selectedItemId) || inventory[0];

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
    setSelectedItemId(item.id);
  };

  const filteredItems = inventory.filter(item => {
    if (filterType === 'equipment') {
      return item.type === 'weapon' || item.type === 'headgear' || item.type === 'armor';
    }
    if (filterType === 'decoration') {
      return item.type === 'decoration';
    }
    if (filterType === 'pet') {
      return item.type === 'pet';
    }
    return true;
  });

  // Sandbox 5x4 grid matrix (20 total slots)
  const TOTAL_SLOTS = 20;
  const emptySlotsCount = Math.max(0, TOTAL_SLOTS - filteredItems.length);

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-amber-300 bg-amber-950/80 border-amber-500/60 shadow-amber-500/20 shadow-sm';
      case 'rare':
        return 'text-purple-300 bg-purple-950/80 border-purple-500/60 shadow-purple-500/20 shadow-sm';
      case 'uncommon':
        return 'text-sky-300 bg-sky-950/80 border-sky-500/60 shadow-sky-500/20 shadow-sm';
      default:
        return 'text-slate-300 bg-slate-800/80 border-slate-600/60';
    }
  };

  const canAfford = selectedItem ? stats.gold >= selectedItem.cost : false;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0a1120] border-2 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =================================================================== */}
        {/* HEADER: Title, Gold Counter, and Close Button                      */}
        {/* =================================================================== */}
        <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-800 bg-[#070e1b]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl select-none">🎒</span>
              <h2 className="text-base sm:text-lg font-pixel font-bold tracking-wide text-slate-100 uppercase leading-none">
                BACKPACK & VAULT
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Collect and equip real-life rewards and sandbox artifacts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Gold balance pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-300 font-pixel font-bold text-xs shadow-sm">
              <KeyRound className="w-3.5 h-3.5" />
              <span>{stats.gold} GOLD</span>
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
        </div>

        {/* Filter categories */}
        <div className="px-5 py-2 bg-[#070e1b]/95 border-b border-slate-800/80 flex items-center gap-1.5 text-xs font-pixel overflow-x-auto select-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-400/15 border border-amber-400/70 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            ALL ITEMS
          </button>
          <button
            onClick={() => setFilterType('equipment')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'equipment'
                ? 'bg-amber-400/15 border border-amber-400/70 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            EQUIPMENT
          </button>
          <button
            onClick={() => setFilterType('decoration')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'decoration'
                ? 'bg-amber-400/15 border border-amber-400/70 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            HOME DECOR
          </button>
          <button
            onClick={() => setFilterType('pet')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'pet'
                ? 'bg-amber-400/15 border border-amber-400/70 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            COMPANIONS
          </button>
        </div>

        {/* =================================================================== */}
        {/* 5x4 SANDBOX INVENTORY GRID                                          */}
        {/* =================================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-[#070e1b] p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-inner">
            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              {/* Populated Slots */}
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const equipped = isEquipped(item);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`aspect-square relative rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all border select-none group ${
                      isSelected
                        ? 'bg-[#1a2942] border-amber-400 shadow-lg ring-2 ring-amber-400/30 scale-[1.03] z-10'
                        : item.isOwned
                        ? 'bg-[#0f172a] hover:bg-[#162238] border-slate-700/80 hover:border-slate-500'
                        : 'bg-[#0b1220]/80 hover:bg-[#111a2e] border-slate-800/80 opacity-75'
                    }`}
                    title={`${item.name} (${item.rarity.toUpperCase()})`}
                  >
                    {/* Equipped Badge (Top Left Green Dot) */}
                    {equipped && (
                      <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-emerald-400/80 shadow-sm animate-pulse" />
                    )}

                    {/* Lock Badge (Top Right) */}
                    {!item.isOwned && (
                      <div className="absolute top-1.5 right-1.5 text-slate-500">
                        <Lock className="w-3 h-3" />
                      </div>
                    )}

                    {/* Item Icon */}
                    <span className="text-2xl sm:text-3xl select-none filter drop-shadow group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>

                    {/* Item Type / Cost Tag */}
                    <div className="mt-1">
                      {item.isOwned ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 leading-none">
                          {equipped ? 'EQ' : 'OWN'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-amber-400/90 leading-none">
                          {item.cost}g
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Empty Sandbox Slots */}
              {Array.from({ length: emptySlotsCount }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="aspect-square rounded-xl bg-[#080d18]/40 border border-dashed border-slate-800/60 flex items-center justify-center select-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800/60" />
                </div>
              ))}
            </div>
          </div>

          {/* =================================================================== */}
          {/* ITEM INSPECTION PANEL                                               */}
          {/* =================================================================== */}
          {selectedItem && (
            <div className="p-4 rounded-xl bg-[#0c1524] border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Left: Icon & Description details */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-[#070e1b] border-2 border-slate-700/80 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  {selectedItem.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 font-pixel">
                      {selectedItem.name.toUpperCase()}
                    </h3>

                    {/* Rarity badge */}
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border font-bold ${getRarityBadge(selectedItem.rarity)}`}>
                      {selectedItem.rarity}
                    </span>

                    {/* Attribute bonus tag */}
                    {selectedItem.attributeBonus && (
                      <span className="text-[10px] font-mono font-bold text-sky-300 px-2 py-0.5 rounded-md bg-sky-950/70 border border-sky-600/40">
                        +{selectedItem.attributeBonus.value} {selectedItem.attributeBonus.attribute.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {selectedItem.description}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
                    <span className="text-slate-400">
                      TYPE: <strong className="text-slate-200 uppercase">{selectedItem.type}</strong>
                    </span>
                    <span className="text-slate-400">
                      STATUS: <strong className={selectedItem.isOwned ? 'text-emerald-400' : 'text-amber-400'}>
                        {selectedItem.isOwned ? (isEquipped(selectedItem) ? 'EQUIPPED' : 'IN BAG') : `${selectedItem.cost} GOLD`}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Equip / Buy Action Button */}
              <div className="shrink-0 w-full sm:w-auto">
                {selectedItem.isOwned ? (
                  isEquipped(selectedItem) ? (
                    <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-pixel text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>EQUIPPED</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onEquipItem(selectedItem);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 text-slate-100 font-pixel text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>EQUIP ARTIFACT</span>
                    </button>
                  )
                ) : (
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      if (canAfford) {
                        sounds.playLevelUp();
                        onBuyItem(selectedItem);
                      }
                    }}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-pixel text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                      canAfford
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer active:scale-95 shadow-amber-400/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>BUY FOR {selectedItem.cost} GOLD</span>
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* FOOTER NOTE                                                         */}
        {/* =================================================================== */}
        <div className="px-5 sm:px-6 py-3 bg-[#070e1b] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Complete real-life habits to mine gold and equip your character</span>
          </span>
          <span className="font-mono text-slate-500 text-[11px]">
            {inventory.filter(i => i.isOwned).length} / {inventory.length} Discovered
          </span>
        </div>

      </div>
    </div>
  );
};
