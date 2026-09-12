// Comprehensive Web Audio Synthesizer for Pixel Sandbox RPG
// Provides nostalgic block-based sandbox game feel with 100% original synthesis
// Zero external sound asset dependencies to guarantee instant, reliable playback

export interface AudioVolumes {
  master: number;
  music: number;
  sfx: number;
  ambient: number;
  isMuted: boolean;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Volumes (0.0 to 1.0)
  private masterVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.8;
  private ambientVolume: number = 0.6;
  private isMuted: boolean = false;

  // Music & Ambient loop timers/nodes
  private isMusicPlaying: boolean = false;
  private isAmbientPlaying: boolean = false;
  private musicTimer: number | null = null;
  private ambientNodes: { noise?: AudioNode; filter?: BiquadFilterNode; lfo?: OscillatorNode } = {};
  private lastFootstepTime: number = 0;

  constructor() {
    // Load volume settings from localStorage
    try {
      const saved = localStorage.getItem('pixelrealm_audio_config_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.masterVolume = parsed.master ?? 0.8;
        this.musicVolume = parsed.music ?? 0.5;
        this.sfxVolume = parsed.sfx ?? 0.8;
        this.ambientVolume = parsed.ambient ?? 0.6;
        this.isMuted = parsed.isMuted ?? false;
      }
    } catch {}
  }

  private initAudio(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Setup Audio Bus Architecture: Source -> Category Gain -> Master Gain -> Destination
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);

        // Start ambient background
        this.startAmbient();
        this.startMusic();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('pixelrealm_audio_config_v2', JSON.stringify({
        master: this.masterVolume,
        music: this.musicVolume,
        sfx: this.sfxVolume,
        ambient: this.ambientVolume,
        isMuted: this.isMuted,
      }));
    } catch {}
  }

  // ==========================================
  // VOLUME & MUTING CONTROLS
  // ==========================================

  public getVolumes(): AudioVolumes {
    return {
      master: this.masterVolume,
      music: this.musicVolume,
      sfx: this.sfxVolume,
      ambient: this.ambientVolume,
      isMuted: this.isMuted
    };
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    this.saveConfig();
  }

  public setMusicVolume(val: number): void {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    this.saveConfig();
  }

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    this.saveConfig();
  }

  public setAmbientVolume(val: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, val));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
    }
    this.saveConfig();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    this.saveConfig();
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ==========================================
  // AMBIENT SOUND GENERATOR (WIND / CRICKETS)
  // ==========================================

  public startAmbient(): void {
    if (this.isAmbientPlaying) return;
    const ctx = this.initAudio();
    if (!ctx || !this.ambientGain) return;

    try {
      // Create continuous pink noise for soft mountain breeze
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.012;
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Lowpass filter with subtle modulation to emulate breathing wind
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // slow wave
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(140, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noiseSource.connect(filter);
      filter.connect(this.ambientGain);

      noiseSource.start();
      lfo.start();

      this.ambientNodes = { noise: noiseSource, filter, lfo };
      this.isAmbientPlaying = true;
    } catch {}
  }

  // ==========================================
  // PROCEDURAL PEACEFUL BACKGROUND MUSIC
  // ==========================================
  // Spaced-out, gentle pentatonic piano/chime notes inspired by peaceful sandbox exploration

  public startMusic(): void {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    const playNextNote = () => {
      if (!this.isMusicPlaying) return;
      const ctx = this.initAudio();
      if (ctx && this.musicGain && !this.isMuted && this.musicVolume > 0.05) {
        // Pentatonic scale frequencies: C4, D4, E4, G4, A4, C5, D5, E5
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
        const freq = scale[Math.floor(Math.random() * scale.length)];
        this.playGentleChime(freq);
      }

      // Random peaceful spacing: 3.5 to 7.5 seconds between notes
      const nextDelay = 3500 + Math.random() * 4000;
      this.musicTimer = window.setTimeout(playNextNote, nextDelay);
    };

    this.musicTimer = window.setTimeout(playNextNote, 2000);
  }

  private playGentleChime(freq: number): void {
    const ctx = this.initAudio();
    if (!ctx || !this.musicGain) return;

    try {
      const now = ctx.currentTime;
      // Dual oscillator for rich, warm marimba/rhodes timbre
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now); // soft octave harmonic

      // Soft envelope: quick gentle attack, long tranquil decay
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.musicGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.8);
      osc2.stop(now + 2.8);
    } catch {}
  }

  // ==========================================
  // REQUIRED SOUND EFFECTS (ORIGINAL 8-BIT/CHIP SYNTHESIS)
  // ==========================================

  // 1. Footsteps (gentle low-pass filtered click/thud on grass/cobble)
  public playFootstep(): void {
    const now = performance.now();
    if (now - this.lastFootstepTime < 180) return; // debounce footsteps
    this.lastFootstepTime = now;

    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Pitch variation for natural walking feel
      const baseFreq = 95 + Math.random() * 30;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.06);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, t);

      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  // 1b. Block Hit / Dig (Crunchy punch sound)
  public playDig(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const freq = 110 + Math.random() * 40;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  // 1c. Block Break (Satisfying crumble / pop)
  public playBlockBreak(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const t = ctx.currentTime;
      // Low thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.12);

      // High debris crackle
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(520, t + 0.02);
      osc2.frequency.exponentialRampToValueAtTime(140, t + 0.14);

      gain2.gain.setValueAtTime(0.09, t + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc2.start(t + 0.02);
      osc2.stop(t + 0.14);
    } catch {}
  }

  // 1d. Block Place (Thump / snap placement)
  public playBlockPlace(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.07);
    } catch {}
  }

  // 1e. Jump (Springy upward swoop)
  public playJump(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.1);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  // 1f. Land (Gentle floor impact)
  public playLand(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  // 2. UI Clicks (crisp tactile 8-bit blip)
  public playClick(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // 2b. Quest Accepted (Encouraging brass/bell two-tone fanfare)
  public playQuestAccepted(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      [440, 554.37].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.12, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.22);
      });
    } catch {}
  }

  // 3. Quest Completion (Joyous ascending 4-note chord arpeggio)
  public playQuestComplete(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.14, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.28);
      });
    } catch {}
  }

  // 4. XP Gain (Sparkling upward pitch chirp)
  public playXpGain(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // 5. Gold Gain (Classic metallic coin ping)
  public playCoin(): void {
    this.playGoldGain();
  }

  public playGoldGain(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // 6. Level Up (Triumphant multi-voice fanfare)
  public playLevelUp(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.1, t: 0 },
        { f: 659.25, d: 0.1, t: 0.1 },
        { f: 783.99, d: 0.1, t: 0.2 },
        { f: 1046.5, d: 0.2, t: 0.3 },
        { f: 880.00, d: 0.15, t: 0.5 },
        { f: 1046.5, d: 0.5, t: 0.65 }
      ];

      melody.forEach(item => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(item.f, now + item.t);

        gain.gain.setValueAtTime(0.16, now + item.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + item.d);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + item.t);
        osc.stop(now + item.t + item.d);
      });
    } catch {}
  }

  // 7. Achievement Unlock (Grand heraldic fanfare)
  public playAchievementUnlock(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {}
  }

  // 8. Item Pickup (Subtle wood/glass pop)
  public playItemPickup(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  // 9. Item Equip (Armor / weapon equip swoosh)
  public playEquip(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // 10. Building Unlock (Deep stone rumble followed by mystic chord)
  public playBuildingUnlock(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      // Stone resonance
      const oscBass = ctx.createOscillator();
      const gainBass = ctx.createGain();
      oscBass.type = 'sawtooth';
      oscBass.frequency.setValueAtTime(120, now);
      oscBass.frequency.exponentialRampToValueAtTime(60, now + 0.3);

      gainBass.gain.setValueAtTime(0.15, now);
      gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      oscBass.connect(gainBass);
      gainBass.connect(this.sfxGain);

      oscBass.start(now);
      oscBass.stop(now + 0.35);

      // Chimes
      [523.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + 0.2 + i * 0.08);

        gain.gain.setValueAtTime(0.12, now + 0.2 + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + 0.2 + i * 0.08);
        osc.stop(now + 0.2 + i * 0.08 + 0.4);
      });
    } catch {}
  }

  // 11. Location Enter (Ambient doorway swoosh and warm chime)
  public playLocationEnter(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      // Door latch / entrance tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.14); // E5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.22);

      // Warm interior harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(493.88, now + 0.04); // B4
      osc2.frequency.exponentialRampToValueAtTime(987.77, now + 0.18); // B5

      gain2.gain.setValueAtTime(0.08, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc2.start(now + 0.04);
      osc2.stop(now + 0.28);
    } catch {}
  }

  // 11. World Upgrade (Glorious tier ascension sweep)
  public playWorldUpgrade(): void {
    this.playWorldEvolve();
  }

  public playWorldEvolve(): void {
    const ctx = this.initAudio();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.11, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.35);
      });
    } catch {}
  }

  public playVoxelMine(): void {
    this.playItemPickup();
  }

  public playVoxelPlace(): void {
    this.playBlockPlace();
  }
}

export const sounds = new SoundManager();
export const soundSystem = sounds;
