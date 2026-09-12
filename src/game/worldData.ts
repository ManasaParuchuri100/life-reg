// World Layout & Data Definitions for Hearthbound 2D Game
// Defines the 50x40 tile grid, landmark coordinates, collision objects, and NPC definitions

import { LocationId } from '../types';

export const TILE_SIZE = 32;
export const WORLD_COLS = 50;
export const WORLD_ROWS = 40;
export const WORLD_WIDTH = WORLD_COLS * TILE_SIZE; // 1600 px
export const WORLD_HEIGHT = WORLD_ROWS * TILE_SIZE; // 1280 px

export interface BuildingDef {
  id: LocationId;
  name: string;
  attributeName: string;
  x: number; // pixel center x
  y: number; // pixel center y
  width: number;
  height: number;
  interactRadius: number;
  doorOffsetX: number;
  doorOffsetY: number;
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'knowledge_tower',
    name: 'Knowledge Tower',
    attributeName: 'Intellect',
    x: 288,
    y: 288,
    width: 96,
    height: 120,
    interactRadius: 85,
    doorOffsetX: 0,
    doorOffsetY: 48
  },
  {
    id: 'village',
    name: 'Lantern Village',
    attributeName: 'Social',
    x: 256,
    y: 840,
    width: 104,
    height: 84,
    interactRadius: 85,
    doorOffsetX: 0,
    doorOffsetY: 40
  },
  {
    id: 'workshop',
    name: 'Creative Workshop',
    attributeName: 'Creativity',
    x: 768,
    y: 512,
    width: 96,
    height: 80,
    interactRadius: 85,
    doorOffsetX: 0,
    doorOffsetY: 38
  },
  {
    id: 'player_home',
    name: 'Player Home',
    attributeName: 'Homestead',
    x: 768,
    y: 960,
    width: 96,
    height: 80,
    interactRadius: 85,
    doorOffsetX: 0,
    doorOffsetY: 38
  },
  {
    id: 'sanctuary',
    name: 'Moonlit Garden',
    attributeName: 'Wellness',
    x: 1248,
    y: 320,
    width: 96,
    height: 80,
    interactRadius: 85,
    doorOffsetX: 0,
    doorOffsetY: 38
  },
  {
    id: 'mine_training',
    name: 'Training Grounds',
    attributeName: 'Strength',
    x: 1248,
    y: 832,
    width: 96,
    height: 80,
    interactRadius: 85,
    doorOffsetX: 0,
    doorOffsetY: 38
  }
];

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  locationId: LocationId;
  spriteKey: string;
  homeX: number;
  homeY: number;
  patrolRadius: number;
  dialogue: string;
  questHint: string;
}

export const NPCS: NpcDef[] = [
  {
    id: 'npc_sage',
    name: 'Sage Eldrin',
    role: 'Grand Scholar',
    locationId: 'knowledge_tower',
    spriteKey: 'npc_sage',
    homeX: 360,
    homeY: 340,
    patrolRadius: 36,
    dialogue: 'Greetings, seeker of truth. Wisdom grows through consistent daily learning.',
    questHint: 'Ready to study for 2 hours or read today?'
  },
  {
    id: 'npc_elder',
    name: 'Elder Lin',
    role: 'Village Warden',
    locationId: 'village',
    spriteKey: 'npc_elder',
    homeX: 330,
    homeY: 880,
    patrolRadius: 40,
    dialogue: 'Welcome to Lantern Village! Friendship and community warm the soul.',
    questHint: 'Catch up with a friend or do a good deed today!'
  },
  {
    id: 'npc_artisan',
    name: 'Artisan Maya',
    role: 'Master Maker',
    locationId: 'workshop',
    spriteKey: 'npc_artisan',
    homeX: 840,
    homeY: 560,
    patrolRadius: 45,
    dialogue: 'Every blank canvas is an open door. Channel your imagination!',
    questHint: 'Work on your passion project or journal your ideas.'
  },
  {
    id: 'npc_healer',
    name: 'Caretaker Lyra',
    role: 'Garden Keeper',
    locationId: 'sanctuary',
    spriteKey: 'npc_healer',
    homeX: 1180,
    homeY: 360,
    patrolRadius: 35,
    dialogue: 'Breathe deeply. True strength begins with mindful stillness and hydration.',
    questHint: 'Complete a 15-minute meditation or hit your water goal.'
  },
  {
    id: 'npc_trainer',
    name: 'Trainer Jax',
    role: 'Iron Vanguard',
    locationId: 'mine_training',
    spriteKey: 'npc_trainer',
    homeX: 1170,
    homeY: 870,
    patrolRadius: 40,
    dialogue: 'Sweat now, conquer tomorrow! Physical endurance is your shield.',
    questHint: 'Hit the 30-min heavy lift or run 5 kilometers!'
  }
];

export interface PropDef {
  key: string;
  x: number;
  y: number;
  isSolid: boolean;
  solidW?: number;
  solidH?: number;
  solidOffsetY?: number;
}

export function generateWorldProps(): PropDef[] {
  const props: PropDef[] = [];

  // Trees in forest areas
  const oakPositions = [
    // North forest
    [120, 140], [180, 120], [420, 130], [500, 160], [600, 120],
    // West forest near village
    [90, 600], [130, 700], [80, 800], [90, 960], [140, 1080],
    // Central grove
    [580, 680], [630, 780], [600, 900], [620, 1020],
    // East grove
    [1100, 620], [1160, 700], [1100, 980], [1180, 1060],
    // South perimeter
    [320, 1150], [480, 1180], [720, 1160], [880, 1150], [1160, 1160]
  ];
  oakPositions.forEach(([x, y]) => {
    props.push({
      key: 'prop_tree_oak',
      x,
      y,
      isSolid: true,
      solidW: 24,
      solidH: 14,
      solidOffsetY: 24
    });
  });

  // Pine trees in Northern mountain area
  const pinePositions = [
    [100, 240], [160, 320], [400, 260], [480, 290],
    [680, 140], [760, 120], [840, 160], [920, 130]
  ];
  pinePositions.forEach(([x, y]) => {
    props.push({
      key: 'prop_tree_pine',
      x,
      y,
      isSolid: true,
      solidW: 20,
      solidH: 12,
      solidOffsetY: 20
    });
  });

  // Sakura Blossom trees in Moonlit Garden
  const sakuraPositions = [
    [1140, 240], [1360, 230], [1140, 420], [1380, 400], [1280, 460]
  ];
  sakuraPositions.forEach(([x, y]) => {
    props.push({
      key: 'prop_tree_sakura',
      x,
      y,
      isSolid: true,
      solidW: 24,
      solidH: 14,
      solidOffsetY: 24
    });
  });

  // Boulders & Rocks
  const rockPositions = [
    [220, 200], [460, 220], [540, 400], [1120, 180], [1400, 720], [1420, 960]
  ];
  rockPositions.forEach(([x, y]) => {
    props.push({
      key: 'prop_rock',
      x,
      y,
      isSolid: true,
      solidW: 28,
      solidH: 16,
      solidOffsetY: 4
    });
  });

  // Lantern posts along village & paths
  const lanternPositions = [
    [200, 760], [320, 760], [200, 920], [340, 960],
    [520, 520], [700, 460], [860, 460], [1060, 480],
    [700, 900], [850, 900], [1140, 760], [1360, 760]
  ];
  lanternPositions.forEach(([x, y]) => {
    props.push({
      key: 'prop_lantern',
      x,
      y,
      isSolid: true,
      solidW: 10,
      solidH: 8,
      solidOffsetY: 12
    });
  });

  // Benches
  props.push({ key: 'prop_bench', x: 260, y: 760, isSolid: true, solidW: 28, solidH: 12, solidOffsetY: 4 });
  props.push({ key: 'prop_bench', x: 1248, y: 440, isSolid: true, solidW: 28, solidH: 12, solidOffsetY: 4 });

  // Strength training dummy & gear
  props.push({ key: 'prop_dummy', x: 1180, y: 760, isSolid: true, solidW: 16, solidH: 14, solidOffsetY: 10 });
  props.push({ key: 'prop_dummy', x: 1320, y: 760, isSolid: true, solidW: 16, solidH: 14, solidOffsetY: 10 });

  // Creative Workshop easel
  props.push({ key: 'prop_easel', x: 700, y: 550, isSolid: true, solidW: 20, solidH: 14, solidOffsetY: 8 });

  // Lotus pond in Sanctuary
  props.push({ key: 'prop_pond', x: 1248, y: 220, isSolid: true, solidW: 40, solidH: 36, solidOffsetY: 0 });

  return props;
}
