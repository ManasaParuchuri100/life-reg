import React from 'react';
import { PlayerStats } from '../types';
import { Heart, Flame, Star, Package, Volume2, VolumeX, Sparkles, SlidersHorizontal, LogOut, Cloud } from 'lucide-react';
import { sounds } from '../utils/sound';

interface HUDProps {
  stats: PlayerStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenAudioSettings: () => void;
  onOpenNewQuestModal: () => void;
  onOpenCharacterSheet: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  isCloudSynced?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onOpenInventory,
  onOpenAudioSettings,
  onOpenNewQuestModal,
  onOpenCharacterSheet,
  userEmail,
  onSignOut,
  isCloudSynced = true
}) => {
  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100));
  const energyPercent = Math.min(100, Math.round((stats.hp / stats.maxHp) * 100));

  return (
    <header className="w-full z-30 select-none pointer-events-none px-2 sm:px-4 pt-2.5 pb-1">
      <div className="w-full flex items-center justify-between gap-2 max-w-6xl mx-auto">
        
        {/* =================================================================== */}
        {/* TOP LEFT: ❤️ Energy / Health-style indicator + 🔥 Current Streak     */}
        {/* =================================================================== */}
        <div 
          onClick={() => {
            sounds.playClick();
            onOpenCharacterSheet();
          }}
          className="pointer-events-auto bg-[#0a1120]/90 hover:bg-[#0e172a] backdrop-blur-md border border-slate-700/80 hover:border-amber-400/70 rounded-xl px-3 py-2 shadow-xl flex items-center gap-3 cursor-pointer transition-all duration-150 active:scale-95 group"
          title="Click to view Character Profile"
        >
          {/* Energy / Health */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-pixel font-bold">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
              <span className="text-slate-100 uppercase tracking-wide group-hover:text-rose-200">
                {stats.hp} <span className="text-slate-500 text-[10px]">/ {stats.maxHp}</span>
              </span>
            </div>
            {/* Health Bar */}
            <div className="w-20 sm:w-24 h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden mt-1 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>

          <div className="w-px h-7 bg-slate-800" />

          {/* Current Streak */}
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 fill-orange-400 text-orange-400" />
            <div className="flex flex-col">
              <span className="font-pixel font-bold text-xs text-orange-300 leading-none">
                {stats.streak}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-none mt-0.5">
                STREAK
              </span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TOP CENTER: ⭐ LEVEL + XP Progress Bar                             */}
        {/* =================================================================== */}
        <div 
          onClick={() => {
            sounds.playClick();
            onOpenCharacterSheet();
          }}
          className="pointer-events-auto bg-[#0a1120]/90 hover:bg-[#0e172a] backdrop-blur-md border border-slate-700/80 hover:border-amber-400/70 rounded-xl px-4 py-2 shadow-xl flex flex-col items-center cursor-pointer transition-all duration-150 active:scale-95 group min-w-[170px] sm:min-w-[220px]"
          title="Click to view Level & Attributes"
        >
          <div className="flex items-center justify-between w-full text-xs font-pixel font-bold mb-1">
            <div className="flex items-center gap-1.5 text-amber-300 group-hover:text-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>LEVEL {stats.level}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              {stats.xp} / {stats.xpToNextLevel} XP
            </span>
          </div>

          {/* XP Progress Bar (Segmented Look) */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner relative">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-300 shadow"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* TOP RIGHT: 🟡 GOLD + 🎒 Inventory Shortcut (+ Settings)            */}
        {/* =================================================================== */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Gold Pill */}
          <div 
            onClick={() => {
              sounds.playClick();
              onOpenInventory();
            }}
            className="bg-[#0a1120]/90 hover:bg-[#0e172a] backdrop-blur-md border border-slate-700/80 hover:border-amber-400/70 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-95"
            title="Treasure Gold (Click for Inventory)"
          >
            <span className="text-base select-none">🟡</span>
            <div className="flex flex-col">
              <span className="font-pixel font-bold text-xs text-amber-300 leading-none">
                {stats.gold}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-none mt-0.5">
                GOLD
              </span>
            </div>
          </div>

          {/* 🎒 Inventory Shortcut */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenInventory();
            }}
            className="bg-[#0a1120]/90 hover:bg-amber-500/20 active:scale-95 backdrop-blur-md border border-slate-700/80 hover:border-amber-400/80 rounded-xl p-2.5 shadow-xl text-amber-300 transition-all flex items-center justify-center cursor-pointer"
            title="Open Inventory (Treasure Chest)"
          >
            <Package className="w-4 h-4" />
          </button>

          {/* Quick Audio Mute / Mixer */}
          <div className="hidden sm:flex items-center gap-1 bg-[#0a1120]/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
            <button
              onClick={() => {
                onToggleMute();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAudioSettings();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Audio Ambience Mixer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>

          {/* New Quest Commission Quick Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenNewQuestModal();
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-pixel font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            title="Commission Custom Real-Life Quest"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Quest</span>
          </button>

          {/* User Profile & Sign Out */}
          {onSignOut && (
            <div className="flex items-center gap-1 bg-[#0a1120]/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
              <div 
                className="hidden lg:flex items-center gap-1.5 px-2 py-1 text-slate-300 text-xs font-pixel"
                title={`Connected to Firebase Cloud as ${userEmail || stats.name}`}
              >
                <Cloud className={`w-3.5 h-3.5 ${isCloudSynced ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="truncate max-w-[100px] text-[11px] text-slate-300">
                  {stats.name || 'Hero'}
                </span>
              </div>
              <button
                id="hud-sign-out-btn"
                onClick={() => {
                  sounds.playClick();
                  onSignOut();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Sign Out from Firebase"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
