import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats } from '../types';
import { PixelCharacter } from './PixelCharacter';
import { Star, Sparkles, Heart, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/sound';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  stats
}) => {
  useEffect(() => {
    if (isOpen) {
      sounds.playLevelUp();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#0a1120] border border-amber-400/80 rounded-xl shadow-[0_0_40px_rgba(251,191,36,0.3)] overflow-hidden text-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/50 text-amber-300 font-pixel text-xs rounded-full font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>VICTORY ACHIEVED</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-pixel font-bold text-amber-300 tracking-wide">
          LEVEL UP!
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Your real-life dedication has elevated your standing in Hearthbound.
        </p>

        {/* Character Celebration Animation */}
        <div className="my-5 py-4 px-6 bg-[#070e1b] rounded-lg border border-slate-800 shadow-inner flex flex-col items-center">
          <PixelCharacter
            size="lg"
            animationState="celebrate"
            equipped={stats.equipped}
          />
          <div className="mt-3 font-pixel text-sm text-slate-100 font-bold">
            HERO LEVEL {stats.level}
          </div>
          <div className="text-xs font-mono text-amber-400">
            "{stats.title}"
          </div>
        </div>

        {/* Level Perks / Rewards Unlocked */}
        <div className="space-y-2 mb-5 text-left text-xs font-mono">
          <div className="p-2.5 bg-[#070e1b] rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Vitality Fully Restored:
            </span>
            <span className="text-emerald-400 font-bold">{stats.maxHp} / {stats.maxHp} HP</span>
          </div>
          <div className="p-2.5 bg-[#070e1b] rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Settlement Evolution:
            </span>
            <span className="text-amber-300 font-bold">UNLOCKED</span>
          </div>
        </div>

        {/* Close / Continue Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-pixel font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>CONTINUE EXPLORING</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
