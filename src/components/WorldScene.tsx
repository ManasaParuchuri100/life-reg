// Dual-Mode Interactive RPG Game World for Hearthbound
// Mode 1 (Default): 2D Pixel RPG World (Phaser 3) with full-world navigation,
// seamless bridge connectivity, animated pixel sprites, dynamic building evolution, and ambient lighting.
// Mode 2: 3D Voxel Sandbox World (Three.js) with first/third person camera, mining, and block placing.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { BUILDINGS as BUILDINGS_2D, BuildingDef as BuildingDef2D, NpcDef as NpcDef2D } from '../game/worldData';
import * as THREE from 'three';
import { VoxelWorld, VOXEL_BUILDINGS } from '../game3d/voxelWorld';
import { PlayerController, CameraMode } from '../game3d/playerController';
import { VoxelEnvironment } from '../game3d/voxelEnvironment';
import { VoxelNpcManager } from '../game3d/voxelNpcs';
import { BlockType, BLOCK_DEFS, HotbarSlot, VoxelBuildingDef, VoxelNpcDef } from '../game3d/voxelTypes';
import { LocationId, PlayerStats, Quest, FloatingReward } from '../types';
import { soundSystem } from '../utils/sound';
import {
  Sun,
  Moon,
  Flame,
  Sparkles,
  BookOpen,
  Dumbbell,
  Palette,
  Users,
  Flower2,
  Home,
  MessageSquare,
  Eye,
  Pickaxe,
  Hammer,
  HelpCircle,
  Compass,
  ArrowUp,
  Layers
} from 'lucide-react';

interface WorldSceneProps {
  stats: PlayerStats;
  quests: Quest[];
  onSelectLocation: (locId: LocationId) => void;
  activeBuildingGlow: LocationId | null;
  floatingRewards: FloatingReward[];
  timeOfDay: 'day' | 'sunset' | 'night';
  setTimeOfDay: (time: 'day' | 'sunset' | 'night') => void;
}

const DEFAULT_HOTBAR: HotbarSlot[] = [
  { type: 'planks', name: 'Planks', count: 64, iconColor: '#b45309' },
  { type: 'cobble', name: 'Cobblestone', count: 64, iconColor: '#64748b' },
  { type: 'wood_oak', name: 'Oak Wood', count: 32, iconColor: '#854d0e' },
  { type: 'brick', name: 'Brick', count: 48, iconColor: '#b91c1c' },
  { type: 'glass', name: 'Glass', count: 32, iconColor: '#bae6fd' },
  { type: 'lantern', name: 'Lantern', count: 16, iconColor: '#fef08a' },
  { type: 'crystal_lapis', name: 'Lapis', count: 12, iconColor: '#38bdf8' },
  { type: 'leaves_blossom', name: 'Blossom', count: 24, iconColor: '#f472b6' }
];

export const WorldScene: React.FC<WorldSceneProps> = ({
  stats,
  quests,
  onSelectLocation,
  floatingRewards,
  timeOfDay,
  setTimeOfDay
}) => {
  // Game view mode: default is '2d' for the classic Life RPG experience
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // =========================================================================
  // 2D PHASER REFS & STATE
  // =========================================================================
  const phaserContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const gameSceneRef = useRef<GameScene | null>(null);
  const [nearbyBuilding2D, setNearbyBuilding2D] = useState<BuildingDef2D | null>(null);
  const [nearbyNpc2D, setNearbyNpc2D] = useState<NpcDef2D | null>(null);

  // =========================================================================
  // 3D THREE.JS REFS & STATE
  // =========================================================================
  const threeMountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const worldRef = useRef<VoxelWorld | null>(null);
  const envRef = useRef<VoxelEnvironment | null>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const npcManagerRef = useRef<VoxelNpcManager | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [cameraMode, setCameraMode] = useState<CameraMode>('third_person');
  const [nearbyBuilding3D, setNearbyBuilding3D] = useState<VoxelBuildingDef | null>(null);
  const [nearbyNpc3D, setNearbyNpc3D] = useState<VoxelNpcDef | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [miningProgress, setMiningProgress] = useState<number>(0);
  const [minedNotice, setMinedNotice] = useState<string | null>(null);
  const [showControlsHelp, setShowControlsHelp] = useState(false);
  const [hotbar, setHotbar] = useState<HotbarSlot[]>(DEFAULT_HOTBAR);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);

  // =========================================================================
  // MOBILE TOUCH CONTROLS (SHARED)
  // =========================================================================
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickActive, setJoystickActive] = useState(false);
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);
  const lookTouchLast = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Enter a location safely
  const handleEnterLocation = useCallback((locId: LocationId) => {
    soundSystem.playLocationEnter();
    onSelectLocation(locId);
  }, [onSelectLocation]);

  // Helper to check if 2D scene is safely active
  const is2DSceneActive = useCallback(() => {
    const scene = gameSceneRef.current;
    if (!scene || !scene.isReady) return false;
    try {
      return Boolean(scene.scene && typeof scene.scene.isActive === 'function' && scene.scene.isActive());
    } catch {
      return false;
    }
  }, []);

  // =========================================================================
  // 2D PHASER LIFECYCLE
  // =========================================================================
  useEffect(() => {
    if (viewMode !== '2d' || !phaserContainerRef.current) return;

    let game: Phaser.Game | null = null;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: phaserContainerRef.current,
      width: phaserContainerRef.current.clientWidth || 960,
      height: phaserContainerRef.current.clientHeight || 640,
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    game = new Phaser.Game(config);
    phaserGameRef.current = game;

    game.events.once('ready', () => {
      if (!game) return;
      const scene = game.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    });

    game.scene.start('GameScene', {
      stats,
      timeOfDay,
      bridge: {
        onNearBuilding: (b: BuildingDef2D | null) => setNearbyBuilding2D(b),
        onNearNpc: (n: NpcDef2D | null) => setNearbyNpc2D(n),
        onEnterBuilding: (locId: LocationId) => handleEnterLocation(locId)
      }
    });

    return () => {
      gameSceneRef.current = null;
      if (game) {
        game.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [viewMode, handleEnterLocation]);

  // Sync Stats to 2D Scene
  useEffect(() => {
    if (viewMode === '2d' && is2DSceneActive()) {
      gameSceneRef.current?.updateStats(stats);
    }
  }, [stats, viewMode, is2DSceneActive]);

  // Sync Time of Day to 2D Scene
  useEffect(() => {
    if (viewMode === '2d' && is2DSceneActive()) {
      gameSceneRef.current?.setTimeOfDay(timeOfDay);
    }
  }, [timeOfDay, viewMode, is2DSceneActive]);

  // Sync Floating Rewards / Celebrations to 2D Scene
  useEffect(() => {
    if (viewMode === '2d' && is2DSceneActive() && floatingRewards.length > 0) {
      const latest = floatingRewards[floatingRewards.length - 1];
      if (latest.type === 'levelup') {
        gameSceneRef.current?.triggerLevelUp();
      } else {
        gameSceneRef.current?.triggerQuestReward(latest.xp, latest.gold, latest.attribute, latest.attrValue);
      }
    }
  }, [floatingRewards, viewMode, is2DSceneActive]);

  // =========================================================================
  // 3D THREE.JS LIFECYCLE
  // =========================================================================
  useEffect(() => {
    if (viewMode !== '3d' || !threeMountRef.current) return;

    const container = threeMountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 300);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Voxel World
    const world = new VoxelWorld(scene);
    worldRef.current = world;
    world.generate();

    // 5. Sky & Environment
    const env = new VoxelEnvironment(scene);
    envRef.current = env;
    env.setTimeOfDay(timeOfDay);

    // 6. Player Controller
    const player = new PlayerController(camera, world, renderer.domElement);
    playerRef.current = player;
    player.setCameraMode(cameraMode);

    // 7. NPCs
    const npcManager = new VoxelNpcManager(scene, (npc) => {
      setNearbyNpc3D(npc);
    });
    npcManagerRef.current = npcManager;

    // Setup Block Interaction Callbacks
    player.onBlockMined = (blockType, pos) => {
      soundSystem.playVoxelMine();
      const def = BLOCK_DEFS[blockType];
      setMinedNotice(`+1 ${def.name}`);
      setTimeout(() => setMinedNotice(null), 1500);

      setHotbar(prev => {
        const next = [...prev];
        const existingIdx = next.findIndex(s => s.type === blockType);
        if (existingIdx !== -1) {
          next[existingIdx] = { ...next[existingIdx], count: next[existingIdx].count + 1 };
        } else {
          const emptyIdx = next.findIndex(s => s.count === 0);
          if (emptyIdx !== -1) {
            next[emptyIdx] = { type: blockType, name: def.name, count: 1, iconColor: def.color };
          }
        }
        return next;
      });

      world.createParticleBurst(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5, def.color, 12);
    };

    player.onBlockPlaced = (blockType, pos) => {
      soundSystem.playVoxelPlace();
      const def = BLOCK_DEFS[blockType];
      world.createParticleBurst(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5, def.color, 6);
    };

    player.onNearBuilding = (b) => setNearbyBuilding3D(b);
    player.onNearNpc = (n) => setNearbyNpc3D(n);

    // Render loop
    let lastTime = performance.now();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      player.update(delta);
      env.update(delta);
      npcManager.update(delta, player.getPosition());
      world.updateParticles(delta);

      setIsPointerLocked(player.isPointerLocked);
      setMiningProgress(player.getMiningProgress());

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      player.dispose();
      npcManager.dispose();
      world.dispose();
      env.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [viewMode, timeOfDay]);

  // Sync 3D Environment Time of Day
  useEffect(() => {
    if (viewMode === '3d' && envRef.current) {
      envRef.current.setTimeOfDay(timeOfDay);
    }
  }, [timeOfDay, viewMode]);

  // =========================================================================
  // TELEPORT & INTERACTION HANDLERS
  // =========================================================================
  const handleTeleport = (locId: LocationId) => {
    soundSystem.playClick();
    if (viewMode === '2d') {
      gameSceneRef.current?.teleportToBuilding(locId);
    } else {
      const b = VOXEL_BUILDINGS.find(v => v.id === locId);
      if (b && playerRef.current) {
        playerRef.current.teleportTo(b.entrance.x, b.entrance.y + 1, b.entrance.z + 2);
      }
    }
  };

  const handleInteractAction = () => {
    if (viewMode === '2d') {
      gameSceneRef.current?.interactCurrent();
    } else {
      if (nearbyBuilding3D) handleEnterLocation(nearbyBuilding3D.id);
      else if (nearbyNpc3D) {
        soundSystem.playClick();
        onSelectLocation(nearbyNpc3D.locationId);
      }
    }
  };

  const handleToggleCamera = () => {
    if (viewMode !== '3d' || !playerRef.current) return;
    const nextMode: CameraMode = cameraMode === 'first_person' ? 'third_person' : 'first_person';
    setCameraMode(nextMode);
    playerRef.current.setCameraMode(nextMode);
    soundSystem.playClick();
  };

  const handlePlaceActiveBlock = () => {
    if (viewMode !== '3d' || !playerRef.current) return;
    const activeSlot = hotbar[selectedSlotIndex];
    if (!activeSlot || activeSlot.count <= 0) return;

    playerRef.current.setActiveBlock(activeSlot.type);
    const placed = playerRef.current.placeBlock();
    if (placed) {
      setHotbar(prev => {
        const next = [...prev];
        next[selectedSlotIndex] = {
          ...next[selectedSlotIndex],
          count: next[selectedSlotIndex].count - 1
        };
        return next;
      });
    }
  };

  // =========================================================================
  // MOBILE JOYSTICK TOUCH LOGIC (WORKS SEAMLESSLY IN BOTH 2D & 3D)
  // =========================================================================
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchOrigin.current = { x: touch.clientX, y: touch.clientY };
    setJoystickActive(true);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchOrigin.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchOrigin.current.x;
    const dy = touch.clientY - touchOrigin.current.y;
    const maxRadius = 40;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;
    setJoystickPos({ x: clampedX, y: clampedY });

    const normX = clampedX / maxRadius;
    const normY = clampedY / maxRadius;

    if (viewMode === '2d') {
      gameSceneRef.current?.setJoystickVelocity(normX, normY);
    } else {
      playerRef.current?.setJoystickVelocity(normX, normY);
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    touchOrigin.current = null;
    setJoystickPos({ x: 0, y: 0 });
    setJoystickActive(false);

    if (viewMode === '2d') {
      gameSceneRef.current?.setJoystickVelocity(0, 0);
    } else {
      playerRef.current?.setJoystickVelocity(0, 0);
    }
  };

  // 3D Look Touch
  const handleLookTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lookTouchLast.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (!lookTouchLast.current || !playerRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - lookTouchLast.current.x;
    const dy = touch.clientY - lookTouchLast.current.y;
    lookTouchLast.current = { x: touch.clientX, y: touch.clientY };
    playerRef.current.applyTouchLook(dx, dy);
  };

  const handleLookTouchEnd = () => {
    lookTouchLast.current = null;
  };

  // Determine active nearby interaction
  const activeNearbyBuilding = viewMode === '2d' ? nearbyBuilding2D : nearbyBuilding3D;
  const activeNearbyNpc = viewMode === '2d' ? nearbyNpc2D : nearbyNpc3D;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* =================================================================== */}
      {/* CANVAS CONTAINER: 2D PHASER OR 3D THREE.JS */}
      {/* =================================================================== */}
      <div className="relative w-full h-full flex-1">
        {viewMode === '2d' ? (
          <div
            ref={phaserContainerRef}
            className="w-full h-full cursor-pointer relative bg-emerald-950"
          />
        ) : (
          <div
            ref={threeMountRef}
            onClick={() => {
              if (!isTouchDevice && playerRef.current && !isPointerLocked) {
                playerRef.current.lockPointer();
              }
            }}
            className="w-full h-full cursor-crosshair relative"
          />
        )}

        {/* =================================================================== */}
        {/* TOP CONTROLS: MODE TOGGLE, TIME OF DAY, LANDMARKS (BELOW HUD)        */}
        {/* =================================================================== */}
        <div className="absolute top-16 sm:top-20 inset-x-2 sm:inset-x-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
          {/* Left: View Mode Toggle & Compass */}
          <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
            <button
              onClick={() => {
                soundSystem.playClick();
                setViewMode(m => (m === '2d' ? '3d' : '2d'));
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === '2d'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{viewMode === '2d' ? '🎮 2D Pixel RPG' : '🧊 3D Voxel RPG'}</span>
            </button>

            {viewMode === '3d' && (
              <button
                onClick={handleToggleCamera}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-600 transition-colors"
                title="Toggle First/Third Person Camera (V)"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">
                  {cameraMode === 'first_person' ? '1st Person' : '3rd Person'}
                </span>
              </button>
            )}

            {viewMode === '3d' && (
              <button
                onClick={() => setShowControlsHelp(h => !h)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Controls & Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Center / Right: Landmarks Quick Navigation */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto bg-slate-900/80 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-700/80 shadow-lg overflow-x-auto max-w-full">
            <button
              onClick={() => handleTeleport('player_home')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
              title="Player Home"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Home</span>
            </button>

            <button
              onClick={() => handleTeleport('knowledge_tower')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition-colors whitespace-nowrap"
              title="Knowledge Tower (Intellect)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tower</span>
            </button>

            <button
              onClick={() => handleTeleport('mine_training')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors whitespace-nowrap"
              title="Training Grounds (Strength)"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Training</span>
            </button>

            <button
              onClick={() => handleTeleport('workshop')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-colors whitespace-nowrap"
              title="Creative Workshop (Creativity)"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Workshop</span>
            </button>

            <button
              onClick={() => handleTeleport('village')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
              title="Lantern Village (Social)"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Village</span>
            </button>

            <button
              onClick={() => handleTeleport('sanctuary')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-pink-300 hover:bg-pink-500/20 transition-colors whitespace-nowrap"
              title="Moonlit Garden (Vitality)"
            >
              <Flower2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Garden</span>
            </button>
          </div>

          {/* Right: Time of Day Selector */}
          <div className="flex items-center gap-1 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
            <button
              onClick={() => {
                soundSystem.playClick();
                setTimeOfDay('day');
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                timeOfDay === 'day' ? 'bg-amber-400 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Day"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundSystem.playClick();
                setTimeOfDay('sunset');
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                timeOfDay === 'sunset' ? 'bg-orange-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Sunset"
            >
              <Flame className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundSystem.playClick();
                setTimeOfDay('night');
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                timeOfDay === 'night' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Night"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3D CROSSHAIR & MINING PROGRESS (WHEN IN 3D MODE) */}
        {/* =================================================================== */}
        {viewMode === '3d' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Center Crosshair */}
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <div className="absolute w-4 h-0.5 bg-white/40" />
              <div className="absolute h-4 w-0.5 bg-white/40" />

              {/* Mining Progress Ring */}
              {miningProgress > 0 && (
                <div className="absolute -inset-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              )}
            </div>

            {/* Click to lock mouse notice on desktop */}
            {!isPointerLocked && !isTouchDevice && (
              <div className="absolute top-20 bg-slate-900/90 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-xl flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Click screen to control camera with mouse (Press ESC to release)</span>
              </div>
            )}

            {/* Mined Resource Notice */}
            {minedNotice && (
              <div className="absolute top-28 bg-emerald-900/90 text-emerald-200 border border-emerald-500/40 px-3 py-1 rounded-lg text-xs font-bold shadow-lg animate-bounce">
                {minedNotice}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* PROXIMITY INTERACTION BANNER (BUILDING & NPC) */}
        {/* =================================================================== */}
        {activeNearbyBuilding && (
          <div className="absolute bottom-20 sm:bottom-24 inset-x-0 flex justify-center pointer-events-none z-30 px-4">
            <div className="pointer-events-auto bg-[#0a1120]/95 backdrop-blur-md border-2 border-amber-400/90 px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 max-w-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300 shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                    {activeNearbyBuilding.name}
                  </h3>
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {activeNearbyBuilding.id === 'player_home' ? 'Character' : ('attributeName' in activeNearbyBuilding ? activeNearbyBuilding.attributeName : activeNearbyBuilding.attribute)}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 truncate mt-0.5">
                  {activeNearbyBuilding.id === 'player_home'
                    ? 'Manage character attributes & equipment'
                    : `${quests.filter(q => q.locationId === activeNearbyBuilding.id && !q.completed).length} active quests available`}
                </p>
              </div>

              <button
                onClick={() => handleEnterLocation(activeNearbyBuilding.id)}
                className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-pixel font-bold text-xs rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 uppercase tracking-wide cursor-pointer"
              >
                <span className="text-[10px] bg-slate-950/25 px-1.5 py-0.5 rounded font-mono font-bold">[E]</span>
                <span>ENTER {activeNearbyBuilding.name.toUpperCase()}</span>
              </button>
            </div>
          </div>
        )}

        {/* NPC Nearby Talk Banner */}
        {!activeNearbyBuilding && activeNearbyNpc && (
          <div className="absolute bottom-20 sm:bottom-24 inset-x-0 flex justify-center pointer-events-none z-30 px-4">
            <div className="pointer-events-auto bg-[#0a1120]/95 backdrop-blur-md border-2 border-sky-400/90 px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="p-2.5 bg-sky-500/20 border border-sky-400/40 rounded-xl text-sky-300 shrink-0">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  {activeNearbyNpc.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-sky-300/90 truncate font-medium mt-0.5">
                  {activeNearbyNpc.role}
                </p>
              </div>

              <button
                onClick={handleInteractAction}
                className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-slate-950 font-pixel font-bold text-xs rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 uppercase tracking-wide cursor-pointer"
              >
                <span className="text-[10px] bg-slate-950/25 px-1.5 py-0.5 rounded font-mono font-bold">[E]</span>
                <span>TALK</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3D VOXEL HOTBAR (WHEN IN 3D MODE) */}
        {/* =================================================================== */}
        {viewMode === '3d' && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-20 px-2">
            <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl overflow-x-auto max-w-full">
              {hotbar.map((slot, index) => {
                const isSelected = index === selectedSlotIndex;
                return (
                  <button
                    key={slot.type + index}
                    onClick={() => {
                      soundSystem.playClick();
                      setSelectedSlotIndex(index);
                    }}
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-amber-400/20 border-2 border-amber-400 scale-105 shadow-md shadow-amber-400/30'
                        : 'bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded shadow-sm"
                      style={{ backgroundColor: slot.iconColor }}
                    />
                    <span className="text-[10px] font-bold font-mono text-slate-200 mt-0.5">
                      {slot.count}
                    </span>
                    <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-400">
                      {index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* BOTTOM CONTROLS HINT BAR (2D MODE) */}
        {/* =================================================================== */}
        {viewMode === '2d' && (
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none z-20 text-[11px] text-slate-400">
            <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow flex items-center gap-2">
              <span className="font-semibold text-amber-300">🎮 Controls:</span>
              <span>
                <strong className="text-white">[W A S D / ARROWS]</strong> Move •{' '}
                <strong className="text-white">[E]</strong> Interact • Click ground to walk
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow text-emerald-400 font-medium">
              <span>🌉 Bridges & all regions 100% connected & walkable</span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* CONTROLS GUIDE MODAL (3D MODE) */}
        {/* =================================================================== */}
        {showControlsHelp && viewMode === '3d' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-40">
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  3D Voxel World Controls
                </h2>
                <button
                  onClick={() => setShowControlsHelp(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">W, A, S, D</span>
                  <span className="text-slate-400">Walk around the world</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">Spacebar</span>
                  <span className="text-slate-400">Jump over blocks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">Mouse Move</span>
                  <span className="text-slate-400">Rotate & look around (when locked)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">Hold Left Click</span>
                  <span className="text-slate-400">Mine & collect blocks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">Right Click</span>
                  <span className="text-slate-400">Place selected hotbar block</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">E</span>
                  <span className="text-slate-400">Enter nearby landmark / Talk to NPC</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">V</span>
                  <span className="text-slate-400">Toggle 1st / 3rd person camera</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-slate-300">1 - 8 / Scroll</span>
                  <span className="text-slate-400">Select active hotbar slot</span>
                </div>
              </div>

              <button
                onClick={() => setShowControlsHelp(false)}
                className="w-full mt-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MOBILE TOUCH CONTROLS (JOYSTICK, LOOK PAD, ACTION BUTTONS) */}
        {/* =================================================================== */}
        {isTouchDevice && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* 3D Look Pad (Right half, only in 3D) */}
            {viewMode === '3d' && (
              <div
                onTouchStart={handleLookTouchStart}
                onTouchMove={handleLookTouchMove}
                onTouchEnd={handleLookTouchEnd}
                onTouchCancel={handleLookTouchEnd}
                className="absolute top-0 right-0 w-1/2 h-3/4 pointer-events-auto"
              />
            )}

            {/* Virtual Joystick (Bottom-Left, works in both 2D and 3D) */}
            <div
              ref={joystickRef}
              onTouchStart={handleJoystickTouchStart}
              onTouchMove={handleJoystickTouchMove}
              onTouchEnd={handleJoystickTouchEnd}
              onTouchCancel={handleJoystickTouchEnd}
              className="absolute bottom-6 left-6 w-28 h-28 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-slate-700/80 pointer-events-auto flex items-center justify-center touch-none shadow-xl active:border-amber-400/80"
            >
              <div
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
                }}
                className={`w-12 h-12 rounded-full shadow-lg transition-transform duration-75 flex items-center justify-center ${
                  joystickActive
                    ? 'bg-amber-400 border-2 border-white shadow-amber-500/50'
                    : 'bg-slate-700/80 border border-slate-500'
                }`}
              >
                <Compass className={`w-5 h-5 ${joystickActive ? 'text-slate-950' : 'text-slate-300'}`} />
              </div>
            </div>

            {/* Mobile Action Buttons (Right side) */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
              {/* 3D Jump Button */}
              {viewMode === '3d' && (
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    playerRef.current?.jump();
                  }}
                  className="w-12 h-12 rounded-full bg-slate-800/90 border border-slate-600 text-white flex items-center justify-center shadow-lg active:bg-amber-500 active:text-slate-950"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              )}

              {/* Interact / Action Button (Works in both 2D and 3D) */}
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleInteractAction();
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 border-2 border-amber-300 text-slate-950 font-bold text-xs flex flex-col items-center justify-center shadow-xl active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-[9px] font-black">ACT</span>
              </button>

              {/* 3D Mine & Place Buttons */}
              {viewMode === '3d' && (
                <div className="flex items-center gap-2">
                  <button
                    onTouchStart={(e) => {
                      e.preventDefault();
                      if (playerRef.current) playerRef.current.isMining = true;
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (playerRef.current) {
                        playerRef.current.isMining = false;
                        playerRef.current.miningProgress = 0;
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-rose-600/90 border border-rose-400 text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
                  >
                    <Pickaxe className="w-4 h-4" />
                    <span className="text-[8px] font-bold">MINE</span>
                  </button>

                  <button
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handlePlaceActiveBlock();
                    }}
                    className="w-12 h-12 rounded-full bg-emerald-600/90 border border-emerald-400 text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
                  >
                    <Hammer className="w-4 h-4" />
                    <span className="text-[8px] font-bold">PLACE</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
