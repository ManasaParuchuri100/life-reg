import React from 'react';
import { PlayerStats, LocationId } from '../types';
import { WORLD_LOCATIONS, getLocationTier } from '../utils/storage';
import { Sparkles, ArrowRight, Trophy, Flame, Compass, ChevronRight, Star } from 'lucide-react';

interface ProgressViewProps {
  stats: PlayerStats;
  onSelectLocation: (locId: LocationId) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  stats,
  onSelectLocation
}) => {
  const locationsList = Object.keys(WORLD_LOCATIONS) as LocationId[];

  const attributeIcons: Record<string, string> = {
    intellect: '🧠',
    strength: '💪',
    creativity: '🎨',
    social: '👥',
    wellness: '🌿',
    all: '⭐'
  };

  const getScoreForLocation = (locId: LocationId) => {
    if (locId === 'player_home') {
      return Math.floor((stats.attributes.intellect + stats.attributes.strength + stats.attributes.creativity + stats.attributes.social + stats.attributes.wellness) / 5);
    }
    const meta = WORLD_LOCATIONS[locId];
    return stats.attributes[meta.attribute as keyof typeof stats.attributes] || 0;
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-24">
      {/* Visual Mental Model Banner */}
      <div className="bg-slate-900 border-3 border-slate-700 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col mb-6">
          <span className="text-xs font-retro text-amber-400">THE REALM LIFE CYCLE</span>
          <h2 className="text-2xl sm:text-3xl font-pixel font-bold text-white mt-1">
            "I don't have a to-do list. I have a WORLD."
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1 max-w-2xl">
            Every real-life action directly fuels your world progression. Observe how daily habits physically expand your kingdom.
          </p>
        </div>

        {/* The 6-Step Visual Cycle Diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <DiagramStep step="1" title="REAL LIFE" desc="Workout, Code, Meditate" icon="🌱" />
          <DiagramStep step="2" title="QUEST" desc="Complete RPG Mission" icon="⚔️" />
          <DiagramStep step="3" title="XP & GOLD" desc="+80 XP, +25 Gold" icon="⭐" />
          <DiagramStep step="4" title="ATTRIBUTE" desc="+3 Intellect / Strength" icon="🧠" />
          <DiagramStep step="5" title="HERO LVL" desc="Character Evolves" icon="🧍" />
          <DiagramStep step="6" title="WORLD EVOLVES" desc="Buildings Expand" icon="🏰" isLast />
        </div>
      </div>

      {/* World Locations Evolution Status Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-retro text-amber-400">EXPANSION REPORT</span>
            <h3 className="text-xl font-pixel font-bold text-white">
              Current World Settlement Stages
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Click any sector to view or fast travel
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationsList.map((locId) => {
            const meta = WORLD_LOCATIONS[locId];
            const score = getScoreForLocation(locId);
            const tierInfo = getLocationTier(score);
            const nextReq = tierInfo.tier === 1 ? 12 : tierInfo.tier === 2 ? 25 : tierInfo.tier === 3 ? 45 : 100;
            const percent = Math.min(100, Math.round((score / nextReq) * 100));

            return (
              <div
                key={locId}
                onClick={() => onSelectLocation(locId)}
                className="bg-slate-900 hover:bg-slate-850 border-2 border-slate-700 hover:border-amber-400/80 rounded-2xl p-5 cursor-pointer transition-all shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-2xl">{attributeIcons[meta.attribute]}</span>
                    <span className="text-[10px] font-retro text-amber-300 px-2 py-0.5 rounded bg-black/40 border border-slate-700">
                      {tierInfo.badge}
                    </span>
                  </div>

                  <h4 className="text-lg font-pixel font-bold text-white group-hover:text-amber-300 transition-colors">
                    {meta.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-sans mt-0.5 line-clamp-2">
                    {meta.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400">{meta.attribute.toUpperCase()} POWER:</span>
                    <span className="text-amber-300 font-bold">{score} pts</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className={`h-full bg-gradient-to-r ${meta.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Current: Tier {tierInfo.tier}</span>
                    <span className="text-amber-400/90 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Enter Area <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* World Progression Stages Guide */}
      <div className="bg-slate-900 border-3 border-slate-700 rounded-3xl p-6 shadow-xl">
        <span className="text-xs font-retro text-amber-400">DEVELOPMENT TIERS EXPLAINED</span>
        <h3 className="text-xl font-pixel font-bold text-white mt-0.5 mb-4">
          How Your Actions Reshape The Realm
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StageCard
            tier="EARLY GAME (Level 1-2)"
            badge="Tier I: Starter Settlement"
            desc="Small wooden house, starter study tower, basic sparring dummy, tiny workshop, quiet village with a lone friendly NPC."
            color="border-slate-700 bg-slate-950/60"
          />
          <StageCard
            tier="MID GAME (Level 3-4)"
            badge="Tier II: Developed Outpost"
            desc="Brick manor with smoking chimney, double-height study tower, deep iron mine with ore carts, clockwork workshop, village market stalls."
            color="border-blue-900/60 bg-blue-950/20"
          />
          <StageCard
            tier="HIGH LEVEL (Level 5+)"
            badge="Tier III+: Grand Citadel"
            desc="Stone castle citadel with royal flags, mystical spire with floating mana crystals, colosseum arena, inventor observatory, Great Sacred Sakura Tree."
            color="border-amber-700/60 bg-amber-950/20"
          />
        </div>
      </div>
    </div>
  );
};

const DiagramStep: React.FC<{ step: string; title: string; desc: string; icon: string; isLast?: boolean }> = ({
  step,
  title,
  desc,
  icon,
  isLast = false
}) => {
  return (
    <div className="flex flex-col items-center text-center p-2 relative">
      <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-lg mb-1.5 shadow">
        {icon}
      </div>
      <span className="text-[9px] font-retro text-amber-400">{step}. {title}</span>
      <span className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">{desc}</span>
    </div>
  );
};

const StageCard: React.FC<{ tier: string; badge: string; desc: string; color: string }> = ({
  tier,
  badge,
  desc,
  color
}) => {
  return (
    <div className={`p-4 rounded-2xl border-2 ${color}`}>
      <span className="text-[10px] font-retro text-amber-300 block">{tier}</span>
      <h5 className="text-sm font-pixel font-bold text-white mt-1 mb-2">{badge}</h5>
      <p className="text-xs text-slate-300 font-sans leading-relaxed">{desc}</p>
    </div>
  );
};
