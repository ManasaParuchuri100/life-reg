import React, { useState } from 'react';
import { sounds, AudioVolumes } from '../utils/sound';
import { X, Volume2, VolumeX, Music, Bell, Wind, Sliders } from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVolumeChange?: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  onVolumeChange
}) => {
  const [volumes, setVolumes] = useState<AudioVolumes>(() => sounds.getVolumes());

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const isMuted = sounds.toggleMute();
    setVolumes(prev => ({ ...prev, isMuted }));
    if (!isMuted) sounds.playClick();
    onVolumeChange?.();
  };

  const handleMasterChange = (val: number) => {
    sounds.setMasterVolume(val);
    setVolumes(prev => ({ ...prev, master: val }));
    onVolumeChange?.();
  };

  const handleMusicChange = (val: number) => {
    sounds.setMusicVolume(val);
    setVolumes(prev => ({ ...prev, music: val }));
    onVolumeChange?.();
  };

  const handleSfxChange = (val: number) => {
    sounds.setSfxVolume(val);
    setVolumes(prev => ({ ...prev, sfx: val }));
    sounds.playClick();
    onVolumeChange?.();
  };

  const handleAmbientChange = (val: number) => {
    sounds.setAmbientVolume(val);
    setVolumes(prev => ({ ...prev, ambient: val }));
    onVolumeChange?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-md bg-slate-900 border-3 border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-800 border-b-2 border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-retro text-amber-400 block uppercase">SOUND UX</span>
              <h3 className="text-xl font-pixel font-bold text-white leading-tight">
                Audio & Atmosphere
              </h3>
            </div>
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

        {/* Sliders Container */}
        <div className="p-5 space-y-4 font-mono">
          {/* Master Mute Toggle Card */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {volumes.isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <div className="text-xs font-pixel font-bold text-white">
                  {volumes.isMuted ? 'ALL AUDIO MUTED' : 'AUDIO ACTIVE'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {volumes.isMuted ? 'Silence realm music, SFX and ambience' : 'Enjoy full nostalgic 8-bit soundscape'}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleMute}
              className={`px-3 py-1.5 rounded-xl font-pixel text-xs font-bold transition-all pixel-btn ${
                volumes.isMuted 
                  ? 'bg-rose-500 text-white hover:bg-rose-400' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {volumes.isMuted ? 'UNMUTE' : 'MUTE ALL'}
            </button>
          </div>

          {/* 1. Master Volume */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-pixel flex items-center gap-1.5 text-sm">
                <Volume2 className="w-4 h-4 text-amber-400" /> Master Volume
              </span>
              <span className="text-amber-300 font-bold">
                {Math.round(volumes.master * 100)}%
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes.master}
              onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* 2. Music Volume */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-pixel flex items-center gap-1.5 text-sm">
                <Music className="w-4 h-4 text-indigo-400" /> Procedural Music
              </span>
              <span className="text-indigo-300 font-bold">
                {Math.round(volumes.music * 100)}%
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes.music}
              onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Peaceful sandbox piano & gentle pentatonic exploration chimes
            </div>
          </div>

          {/* 3. SFX Volume */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-pixel flex items-center gap-1.5 text-sm">
                <Bell className="w-4 h-4 text-emerald-400" /> Sound Effects (SFX)
              </span>
              <span className="text-emerald-300 font-bold">
                {Math.round(volumes.sfx * 100)}%
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes.sfx}
              onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Footsteps, UI blips, XP sparkles, coins & quest completion
            </div>
          </div>

          {/* 4. Ambient Volume */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-pixel flex items-center gap-1.5 text-sm">
                <Wind className="w-4 h-4 text-sky-400" /> Ambient Realm Nature
              </span>
              <span className="text-sky-300 font-bold">
                {Math.round(volumes.ambient * 100)}%
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes.ambient}
              onChange={(e) => handleAmbientChange(parseFloat(e.target.value))}
              className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Subtle mountain wind, forest rustle, and evening crickets
            </div>
          </div>

          {/* Test Sound Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                sounds.playQuestComplete();
                setTimeout(() => sounds.playCoin(), 250);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-pixel rounded-xl border border-slate-700 transition-colors"
            >
              🎵 Test Sound FX
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-pixel font-bold text-xs rounded-xl pixel-btn shadow"
            >
              DONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
