// 3D Voxel RPG Type Definitions
import { LocationId, AttributeType } from '../types';

export type BlockType =
  | 'air'
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'cobble'
  | 'wood_oak'
  | 'leaves_oak'
  | 'wood_pine'
  | 'leaves_pine'
  | 'wood_blossom'
  | 'leaves_blossom'
  | 'water'
  | 'sand'
  | 'glass'
  | 'bookshelf'
  | 'crystal_lapis'
  | 'crystal_amethyst'
  | 'crystal_amber'
  | 'planks'
  | 'brick'
  | 'lantern'
  | 'torch'
  | 'flower_red'
  | 'flower_blue'
  | 'iron_block'
  | 'gold_block'
  | 'glowstone';

export interface VoxelCoord {
  x: number;
  y: number;
  z: number;
}

export interface BlockDef {
  type: BlockType;
  name: string;
  isSolid: boolean;
  isTransparent: boolean;
  lightEmission?: number; // 0 to 1
  hardness: number; // mining time in seconds (0.15 to 1.2)
  dropItem: string;
  dropXp: number;
  color: string;
}

export interface HotbarSlot {
  type: BlockType;
  name: string;
  count: number;
  iconColor: string;
}

export interface VoxelBuildingDef {
  id: LocationId;
  name: string;
  attribute: AttributeType | 'all';
  attributeName: string;
  center: VoxelCoord;
  size: VoxelCoord;
  interactRadius: number;
  entrance: VoxelCoord;
}

export interface VoxelNpcDef {
  id: string;
  name: string;
  role: string;
  locationId: LocationId;
  colorScheme: {
    robe: string;
    trim: string;
    hair: string;
    skin: string;
    accessory?: string;
  };
  pos: VoxelCoord;
  patrolRadius: number;
  dialogue: string;
  questHint: string;
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  air: {
    type: 'air',
    name: 'Air',
    isSolid: false,
    isTransparent: true,
    hardness: 0,
    dropItem: '',
    dropXp: 0,
    color: '#000000'
  },
  grass: {
    type: 'grass',
    name: 'Grass Block',
    isSolid: true,
    isTransparent: false,
    hardness: 0.35,
    dropItem: 'Earth Clod',
    dropXp: 2,
    color: '#4ade80'
  },
  dirt: {
    type: 'dirt',
    name: 'Rich Dirt',
    isSolid: true,
    isTransparent: false,
    hardness: 0.3,
    dropItem: 'Earth Clod',
    dropXp: 1,
    color: '#78350f'
  },
  stone: {
    type: 'stone',
    name: 'Granite Stone',
    isSolid: true,
    isTransparent: false,
    hardness: 0.7,
    dropItem: 'Cobblestone',
    dropXp: 3,
    color: '#64748b'
  },
  cobble: {
    type: 'cobble',
    name: 'Cobblestone',
    isSolid: true,
    isTransparent: false,
    hardness: 0.65,
    dropItem: 'Cobblestone',
    dropXp: 2,
    color: '#475569'
  },
  wood_oak: {
    type: 'wood_oak',
    name: 'Oak Log',
    isSolid: true,
    isTransparent: false,
    hardness: 0.5,
    dropItem: 'Oak Timber',
    dropXp: 3,
    color: '#854d0e'
  },
  leaves_oak: {
    type: 'leaves_oak',
    name: 'Oak Foliage',
    isSolid: true,
    isTransparent: true,
    hardness: 0.15,
    dropItem: 'Oak Sapling',
    dropXp: 1,
    color: '#16a34a'
  },
  wood_pine: {
    type: 'wood_pine',
    name: 'Pine Log',
    isSolid: true,
    isTransparent: false,
    hardness: 0.55,
    dropItem: 'Pine Timber',
    dropXp: 3,
    color: '#713f12'
  },
  leaves_pine: {
    type: 'leaves_pine',
    name: 'Pine Needles',
    isSolid: true,
    isTransparent: true,
    hardness: 0.18,
    dropItem: 'Pine Cone',
    dropXp: 1,
    color: '#15803d'
  },
  wood_blossom: {
    type: 'wood_blossom',
    name: 'Blossom Log',
    isSolid: true,
    isTransparent: false,
    hardness: 0.5,
    dropItem: 'Blossom Wood',
    dropXp: 3,
    color: '#581c87'
  },
  leaves_blossom: {
    type: 'leaves_blossom',
    name: 'Sakura Blossom',
    isSolid: true,
    isTransparent: true,
    hardness: 0.15,
    dropItem: 'Enchanted Petals',
    dropXp: 2,
    color: '#f472b6'
  },
  water: {
    type: 'water',
    name: 'Stream Water',
    isSolid: false,
    isTransparent: true,
    hardness: 999,
    dropItem: '',
    dropXp: 0,
    color: '#38bdf8'
  },
  sand: {
    type: 'sand',
    name: 'River Sand',
    isSolid: true,
    isTransparent: false,
    hardness: 0.25,
    dropItem: 'River Sand',
    dropXp: 1,
    color: '#fef08a'
  },
  glass: {
    type: 'glass',
    name: 'Crystal Glass',
    isSolid: true,
    isTransparent: true,
    hardness: 0.2,
    dropItem: 'Glass Shard',
    dropXp: 1,
    color: '#bae6fd'
  },
  bookshelf: {
    type: 'bookshelf',
    name: 'Tome Bookshelf',
    isSolid: true,
    isTransparent: false,
    hardness: 0.45,
    dropItem: 'Ancient Tome',
    dropXp: 5,
    color: '#a16207'
  },
  crystal_lapis: {
    type: 'crystal_lapis',
    name: 'Lapis Intellect Crystal',
    isSolid: true,
    isTransparent: false,
    lightEmission: 0.85,
    hardness: 0.8,
    dropItem: 'Lapis Shard',
    dropXp: 8,
    color: '#38bdf8'
  },
  crystal_amethyst: {
    type: 'crystal_amethyst',
    name: 'Amethyst Mystic Crystal',
    isSolid: true,
    isTransparent: false,
    lightEmission: 0.85,
    hardness: 0.85,
    dropItem: 'Amethyst Shard',
    dropXp: 8,
    color: '#c084fc'
  },
  crystal_amber: {
    type: 'crystal_amber',
    name: 'Amber Solar Crystal',
    isSolid: true,
    isTransparent: false,
    lightEmission: 0.9,
    hardness: 0.8,
    dropItem: 'Amber Shard',
    dropXp: 8,
    color: '#fbbf24'
  },
  planks: {
    type: 'planks',
    name: 'Timber Planks',
    isSolid: true,
    isTransparent: false,
    hardness: 0.4,
    dropItem: 'Timber Planks',
    dropXp: 2,
    color: '#b45309'
  },
  brick: {
    type: 'brick',
    name: 'Kiln Brick',
    isSolid: true,
    isTransparent: false,
    hardness: 0.65,
    dropItem: 'Kiln Brick',
    dropXp: 2,
    color: '#b91c1c'
  },
  lantern: {
    type: 'lantern',
    name: 'Brass Lantern',
    isSolid: false,
    isTransparent: true,
    lightEmission: 1.0,
    hardness: 0.3,
    dropItem: 'Brass Lantern',
    dropXp: 4,
    color: '#fef08a'
  },
  torch: {
    type: 'torch',
    name: 'Ember Torch',
    isSolid: false,
    isTransparent: true,
    lightEmission: 0.9,
    hardness: 0.1,
    dropItem: 'Ember Torch',
    dropXp: 2,
    color: '#f97316'
  },
  flower_red: {
    type: 'flower_red',
    name: 'Crimson Rose',
    isSolid: false,
    isTransparent: true,
    hardness: 0.05,
    dropItem: 'Crimson Petals',
    dropXp: 1,
    color: '#ef4444'
  },
  flower_blue: {
    type: 'flower_blue',
    name: 'Azure Bluebell',
    isSolid: false,
    isTransparent: true,
    hardness: 0.05,
    dropItem: 'Azure Flower',
    dropXp: 1,
    color: '#3b82f6'
  },
  iron_block: {
    type: 'iron_block',
    name: 'Forged Iron',
    isSolid: true,
    isTransparent: false,
    hardness: 0.9,
    dropItem: 'Iron Ingot',
    dropXp: 6,
    color: '#cbd5e1'
  },
  gold_block: {
    type: 'gold_block',
    name: 'Gilded Gold',
    isSolid: true,
    isTransparent: false,
    hardness: 0.85,
    dropItem: 'Gold Ingot',
    dropXp: 10,
    color: '#eab308'
  },
  glowstone: {
    type: 'glowstone',
    name: 'Sunfire Glowstone',
    isSolid: true,
    isTransparent: false,
    lightEmission: 1.0,
    hardness: 0.4,
    dropItem: 'Glow Dust',
    dropXp: 6,
    color: '#facc15'
  }
};
