// 3D Voxel World Generation and Mesh Management
// Features procedural terrain, biomes, rivers, underground caverns,
// full landmark constructions, dynamic attribute-based physical evolution,
// and high-performance InstancedMesh rendering with hidden face culling.

import * as THREE from 'three';
import { BlockType, BLOCK_DEFS, VoxelCoord, VoxelBuildingDef } from './voxelTypes';
import { getBlockMaterial } from './voxelTextures';
import { AttributeType } from '../types';

export const WORLD_MIN_X = -36;
export const WORLD_MAX_X = 36;
export const WORLD_MIN_Z = -36;
export const WORLD_MAX_Z = 36;
export const WORLD_MAX_Y = 24;

// World Landmarks (Preserving existing lore and coordinates mapped into 3D)
export const VOXEL_BUILDINGS: VoxelBuildingDef[] = [
  {
    id: 'knowledge_tower',
    name: 'Knowledge Tower',
    attribute: 'intellect',
    attributeName: 'Intellect',
    center: { x: -18, y: 6, z: -18 },
    size: { x: 9, y: 16, z: 9 },
    interactRadius: 6.5,
    entrance: { x: -18, y: 6, z: -13 }
  },
  {
    id: 'village',
    name: 'Lantern Village',
    attribute: 'social',
    attributeName: 'Social',
    center: { x: -18, y: 5, z: 18 },
    size: { x: 14, y: 8, z: 14 },
    interactRadius: 7.5,
    entrance: { x: -18, y: 5, z: 12 }
  },
  {
    id: 'workshop',
    name: 'Creative Workshop',
    attribute: 'creativity',
    attributeName: 'Creativity',
    center: { x: 0, y: 5, z: -10 },
    size: { x: 10, y: 8, z: 10 },
    interactRadius: 6.5,
    entrance: { x: 0, y: 5, z: -5 }
  },
  {
    id: 'player_home',
    name: 'Player Homestead',
    attribute: 'all',
    attributeName: 'Homestead',
    center: { x: 0, y: 5, z: 14 },
    size: { x: 10, y: 8, z: 10 },
    interactRadius: 6.5,
    entrance: { x: 0, y: 5, z: 9 }
  },
  {
    id: 'sanctuary',
    name: 'Moonlit Garden',
    attribute: 'wellness',
    attributeName: 'Wellness',
    center: { x: 20, y: 5, z: -18 },
    size: { x: 12, y: 9, z: 12 },
    interactRadius: 7.0,
    entrance: { x: 20, y: 5, z: -12 }
  },
  {
    id: 'mine_training',
    name: 'Training Grounds & Mine',
    attribute: 'strength',
    attributeName: 'Strength',
    center: { x: 20, y: 5, z: 18 },
    size: { x: 14, y: 9, z: 14 },
    interactRadius: 7.5,
    entrance: { x: 20, y: 5, z: 12 }
  }
];

export class VoxelWorld {
  public scene: THREE.Scene;
  private blocks: Map<string, BlockType> = new Map();
  private instancedMeshes: Map<BlockType, THREE.InstancedMesh> = new Map();
  private blockMeshGroup: THREE.Group = new THREE.Group();
  private boxGeometry: THREE.BoxGeometry;
  private dummyMatrix: THREE.Matrix4 = new THREE.Matrix4();

  // Landmark progression state
  private landmarkTiers: Map<string, number> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.scene.add(this.blockMeshGroup);
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  }

  private key(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    return this.blocks.get(this.key(Math.floor(x), Math.floor(y), Math.floor(z))) || 'air';
  }

  public setBlock(x: number, y: number, z: number, type: BlockType): void {
    const k = this.key(Math.floor(x), Math.floor(y), Math.floor(z));
    if (type === 'air') {
      this.blocks.delete(k);
    } else {
      this.blocks.set(k, type);
    }
  }

  public isSolid(x: number, y: number, z: number): boolean {
    const type = this.getBlock(x, y, z);
    return BLOCK_DEFS[type]?.isSolid ?? false;
  }

  // =========================================================================
  // PROCEDURAL WORLD GENERATION
  // =========================================================================
  public generateInitialWorld(attributes: Record<AttributeType, number>): void {
    this.blocks.clear();

    // 1. Bedrock & Base Terrain with Rolling Hills and Riverbed
    for (let x = WORLD_MIN_X; x <= WORLD_MAX_X; x++) {
      for (let z = WORLD_MIN_Z; z <= WORLD_MAX_Z; z++) {
        // Bedrock layer
        this.setBlock(x, 0, z, 'stone');

        // Height formula: undulating hills + steep mountain on East (x > 18)
        let height = 5;
        const wave1 = Math.sin(x * 0.12) * 1.5;
        const wave2 = Math.cos(z * 0.14) * 1.5;
        const gentle = Math.floor(5 + wave1 + wave2);
        height = gentle;

        // Mountain on East edge (Training quarry / cliffs)
        if (x > 14 && z > 8) {
          const mountainRise = Math.min(10, Math.floor((x - 14) * 0.8 + (z - 8) * 0.4));
          height += mountainRise;
        }

        // River valley running roughly North to South around x = 8 to 12
        const riverCenter = 10 + Math.sin(z * 0.15) * 3;
        const distToRiver = Math.abs(x - riverCenter);
        const isRiver = distToRiver < 2.5;

        if (isRiver) {
          // River depth
          height = 3;
        }

        // Flatten areas around landmarks so buildings sit on solid ground
        for (const b of VOXEL_BUILDINGS) {
          const dx = Math.abs(x - b.center.x);
          const dz = Math.abs(z - b.center.z);
          if (dx <= Math.floor(b.size.x / 2) + 2 && dz <= Math.floor(b.size.z / 2) + 2) {
            height = b.center.y - 1; // standard ground level for building
          }
        }

        // Cobblestone roads connecting landmarks
        const isRoad = this.isRoadCoordinate(x, z);

        // Fill blocks from y=1 to height
        for (let y = 1; y <= height; y++) {
          if (y === height) {
            if (isRoad) {
              this.setBlock(x, y, z, 'cobble');
            } else if (isRiver) {
              this.setBlock(x, y, z, 'sand');
            } else {
              this.setBlock(x, y, z, 'grass');
            }
          } else if (y >= height - 2) {
            this.setBlock(x, y, z, isRiver ? 'sand' : 'dirt');
          } else {
            this.setBlock(x, y, z, 'stone');
          }
        }

        // River water layer
        if (isRiver) {
          this.setBlock(x, 4, z, 'water');
        }

        // Bridges crossing the river at z = -14 and z = 8
        if (isRiver && (Math.abs(z - (-14)) <= 1 || Math.abs(z - 8) <= 1)) {
          this.setBlock(x, 5, z, 'planks');
          if (Math.abs(x - riverCenter) > 2) {
            this.setBlock(x, 6, z, 'lantern');
          }
        }

        // Wild flora (Flowers and clover) on grass
        if (!isRiver && !isRoad && height === 5) {
          const rand = Math.abs(Math.sin(x * 37 + z * 53));
          if (rand < 0.04) {
            this.setBlock(x, height + 1, z, 'flower_red');
          } else if (rand > 0.96) {
            this.setBlock(x, height + 1, z, 'flower_blue');
          }
        }
      }
    }

    // 2. Underground Cavern & Mineshaft
    this.generateUndergroundCavern();

    // 3. Natural Trees
    this.generateForestTrees();

    // 4. Construct All 3D Landmarks
    this.buildPlayerHome();
    this.buildKnowledgeTower();
    this.buildTrainingGrounds();
    this.buildCreativeWorkshop();
    this.buildLanternVillage();
    this.buildMoonlitGarden();

    // 5. Apply progression tiers based on player attributes
    this.updateAllProgressionTiers(attributes);

    // 6. Build the visual instanced meshes
    this.rebuildAllMeshes();
  }

  private isRoadCoordinate(x: number, z: number): boolean {
    // East-West main highway along z = 0
    if (Math.abs(z) <= 1 && x >= -22 && x <= 22) return true;
    // Path to Knowledge Tower (x=-18, z from 0 to -14)
    if (Math.abs(x - (-18)) <= 1 && z <= 0 && z >= -14) return true;
    // Path to Lantern Village (x=-18, z from 0 to 14)
    if (Math.abs(x - (-18)) <= 1 && z >= 0 && z <= 14) return true;
    // Path to Workshop (x=0, z from 0 to -6)
    if (Math.abs(x) <= 1 && z <= 0 && z >= -6) return true;
    // Path to Player Home (x=0, z from 0 to 10)
    if (Math.abs(x) <= 1 && z >= 0 && z <= 10) return true;
    // Path to Moonlit Sanctuary (x=20, z from 0 to -14)
    if (Math.abs(x - 20) <= 1 && z <= 0 && z >= -14) return true;
    // Path to Training Grounds (x=20, z from 0 to 14)
    if (Math.abs(x - 20) <= 1 && z >= 0 && z <= 14) return true;

    return false;
  }

  // =========================================================================
  // UNDERGROUND MINESHAFT & CAVERN
  // =========================================================================
  private generateUndergroundCavern(): void {
    // Mineshaft entrance tunnel at x=28, z=14 (inside mountain)
    for (let x = 24; x <= 33; x++) {
      for (let z = 18; z <= 24; z++) {
        // Hollow out cave tunnel between y=1 and y=4
        for (let y = 1; y <= 4; y++) {
          this.setBlock(x, y, z, 'air');
        }

        // Stone floor
        this.setBlock(x, 1, z, 'cobble');

        // Wooden mine support archways every 3 blocks
        if (x % 3 === 0) {
          this.setBlock(x, 2, 18, 'wood_pine');
          this.setBlock(x, 3, 18, 'wood_pine');
          this.setBlock(x, 4, 18, 'wood_pine');
          this.setBlock(x, 4, 19, 'planks');
          this.setBlock(x, 4, 20, 'planks');
          this.setBlock(x, 4, 21, 'planks');
          this.setBlock(x, 4, 22, 'planks');
          this.setBlock(x, 4, 23, 'planks');
          this.setBlock(x, 4, 24, 'wood_pine');
          this.setBlock(x, 3, 24, 'wood_pine');
          this.setBlock(x, 2, 24, 'wood_pine');

          // Lantern hanging on support beam
          this.setBlock(x, 3, 21, 'lantern');
        }
      }
    }

    // Glowing crystal veins inside cave walls
    this.setBlock(33, 2, 20, 'crystal_amethyst');
    this.setBlock(33, 3, 20, 'crystal_amethyst');
    this.setBlock(33, 2, 21, 'crystal_amethyst');
    this.setBlock(32, 2, 24, 'crystal_lapis');
    this.setBlock(32, 3, 24, 'crystal_lapis');
    this.setBlock(28, 2, 18, 'crystal_amber');
    this.setBlock(28, 3, 18, 'iron_block');
    this.setBlock(30, 2, 18, 'gold_block');
  }

  // =========================================================================
  // NATURAL TREES
  // =========================================================================
  private generateForestTrees(): void {
    // Oak trees in green fields
    const oakSpots: [number, number][] = [
      [-10, -8], [-8, 6], [-28, -6], [-26, 8], [-12, -22], [-6, -24],
      [4, -18], [2, 22], [-6, 24], [-24, 24], [28, -8], [24, -4]
    ];

    oakSpots.forEach(([tx, tz]) => {
      this.buildOakTree(tx, 5, tz);
    });

    // Tall pine trees near mountain & training grounds
    const pineSpots: [number, number][] = [
      [16, 26], [22, 28], [28, 12], [32, 8], [30, -18], [26, -26]
    ];

    pineSpots.forEach(([tx, tz]) => {
      this.buildPineTree(tx, 5, tz);
    });

    // Sakura blossom trees in Moonlit Garden
    const blossomSpots: [number, number][] = [
      [16, -22], [24, -22], [16, -14], [24, -14]
    ];

    blossomSpots.forEach(([tx, tz]) => {
      this.buildBlossomTree(tx, 5, tz);
    });
  }

  private buildOakTree(x: number, y: number, z: number): void {
    // 4-block trunk
    for (let ty = y; ty < y + 4; ty++) {
      this.setBlock(x, ty, z, 'wood_oak');
    }
    // Leaf sphere
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = y + 3; ly <= y + 6; ly++) {
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === y + 6) continue;
          if (this.getBlock(x + lx, ly, z + lz) === 'air') {
            this.setBlock(x + lx, ly, z + lz, 'leaves_oak');
          }
        }
      }
    }
  }

  private buildPineTree(x: number, y: number, z: number): void {
    // 6-block trunk
    for (let ty = y; ty < y + 6; ty++) {
      this.setBlock(x, ty, z, 'wood_pine');
    }
    // Tiered conical leaves
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        if (Math.abs(lx) + Math.abs(lz) <= 3) {
          if (this.getBlock(x + lx, y + 4, z + lz) === 'air') {
            this.setBlock(x + lx, y + 4, z + lz, 'leaves_pine');
          }
        }
      }
    }
    for (let lx = -1; lx <= 1; lx++) {
      for (let lz = -1; lz <= 1; lz++) {
        if (this.getBlock(x + lx, y + 5, z + lz) === 'air') {
          this.setBlock(x + lx, y + 5, z + lz, 'leaves_pine');
        }
      }
    }
    this.setBlock(x, y + 6, z, 'leaves_pine');
    this.setBlock(x, y + 7, z, 'leaves_pine');
  }

  private buildBlossomTree(x: number, y: number, z: number): void {
    for (let ty = y; ty < y + 4; ty++) {
      this.setBlock(x, ty, z, 'wood_blossom');
    }
    // Pink blossom canopy
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = y + 3; ly <= y + 5; ly++) {
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === y + 5) continue;
          if (this.getBlock(x + lx, ly, z + lz) === 'air') {
            this.setBlock(x + lx, ly, z + lz, 'leaves_blossom');
          }
        }
      }
    }
    this.setBlock(x, y + 6, z, 'leaves_blossom');
  }

  // =========================================================================
  // LANDMARK 1: PLAYER HOME (HOMESTEAD)
  // =========================================================================
  private buildPlayerHome(): void {
    const cx = 0;
    const cy = 5;
    const cz = 14;

    // Cobblestone foundation & wooden walls
    for (let x = cx - 4; x <= cx + 4; x++) {
      for (let z = cz - 4; z <= cz + 4; z++) {
        this.setBlock(x, cy, z, 'planks'); // Floor
        // Walls
        const isWall = x === cx - 4 || x === cx + 4 || z === cz - 4 || z === cz + 4;
        if (isWall) {
          this.setBlock(x, cy + 1, z, 'wood_oak');
          this.setBlock(x, cy + 2, z, 'planks');
          this.setBlock(x, cy + 3, z, 'planks');
        }
      }
    }

    // Windows & Doorway (Front face at z = cz - 4)
    this.setBlock(cx, cy + 1, cz - 4, 'air'); // Door
    this.setBlock(cx, cy + 2, cz - 4, 'air');
    this.setBlock(cx - 2, cy + 2, cz - 4, 'glass'); // Front windows
    this.setBlock(cx + 2, cy + 2, cz - 4, 'glass');
    this.setBlock(cx - 4, cy + 2, cz, 'glass'); // Side windows
    this.setBlock(cx + 4, cy + 2, cz, 'glass');

    // Cozy interior furnishings
    this.setBlock(cx - 3, cy + 1, cz + 3, 'bookshelf');
    this.setBlock(cx + 3, cy + 1, cz + 3, 'crystal_amber'); // nightlight
    this.setBlock(cx, cy + 1, cz + 3, 'wood_oak'); // table

    // Pitched timber roof
    for (let r = 0; r <= 3; r++) {
      const zMin = cz - 4 + r;
      const zMax = cz + 4 - r;
      const ry = cy + 4 + r;
      for (let x = cx - 5; x <= cx + 5; x++) {
        this.setBlock(x, ry, zMin, 'wood_pine');
        this.setBlock(x, ry, zMax, 'wood_pine');
      }
    }

    // Stone Chimney
    for (let y = cy + 1; y <= cy + 8; y++) {
      this.setBlock(cx + 3, y, cz - 2, 'brick');
    }
    this.setBlock(cx + 3, cy + 9, cz - 2, 'cobble');

    // Porch Lanterns
    this.setBlock(cx - 1, cy + 3, cz - 5, 'lantern');
    this.setBlock(cx + 1, cy + 3, cz - 5, 'lantern');
  }

  // =========================================================================
  // LANDMARK 2: KNOWLEDGE TOWER (INTELLECT)
  // =========================================================================
  private buildKnowledgeTower(): void {
    const cx = -18;
    const cy = 6;
    const cz = -18;

    // Base Tier 1: Octagonal Stone Tower (Height: 10 blocks)
    for (let y = cy; y <= cy + 10; y++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        for (let z = cz - 3; z <= cz + 3; z++) {
          const corner = Math.abs(x - cx) === 3 && Math.abs(z - cz) === 3;
          if (corner) continue;

          const isWall = Math.abs(x - cx) >= 2 || Math.abs(z - cz) >= 2;
          if (y === cy) {
            this.setBlock(x, y, z, 'stone');
          } else if (isWall) {
            this.setBlock(x, y, z, 'stone');
          } else {
            // Interior hollow with bookshelves
            if (x === cx && z === cz) {
              this.setBlock(x, y, z, 'wood_oak'); // Central pillar
            } else if (y % 3 === 0) {
              this.setBlock(x, y, z, 'bookshelf');
            } else {
              this.setBlock(x, y, z, 'air');
            }
          }
        }
      }
    }

    // Entrance Archway
    this.setBlock(cx, cy + 1, cz + 3, 'air');
    this.setBlock(cx, cy + 2, cz + 3, 'air');
    this.setBlock(cx - 1, cy + 3, cz + 3, 'lantern');
    this.setBlock(cx + 1, cy + 3, cz + 3, 'lantern');

    // Glowing Lapis Crystal Inlays on exterior corners
    for (let y = cy + 2; y <= cy + 9; y += 3) {
      this.setBlock(cx - 2, y, cz - 2, 'crystal_lapis');
      this.setBlock(cx + 2, y, cz - 2, 'crystal_lapis');
      this.setBlock(cx - 2, y, cz + 2, 'crystal_lapis');
      this.setBlock(cx + 2, y, cz + 2, 'crystal_lapis');
    }

    // Tower Battlement Balcony
    for (let x = cx - 4; x <= cx + 4; x++) {
      for (let z = cz - 4; z <= cz + 4; z++) {
        if (Math.abs(x - cx) === 4 || Math.abs(z - cz) === 4) {
          if ((x + z) % 2 === 0) {
            this.setBlock(x, cy + 11, z, 'cobble');
          }
        }
      }
    }
  }

  // =========================================================================
  // LANDMARK 3: TRAINING GROUNDS (STRENGTH)
  // =========================================================================
  private buildTrainingGrounds(): void {
    const cx = 20;
    const cy = 5;
    const cz = 18;

    // Stone Arena Ring
    for (let x = cx - 5; x <= cx + 5; x++) {
      for (let z = cz - 5; z <= cz + 5; z++) {
        const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
        if (dist <= 4.8) {
          this.setBlock(x, cy, z, 'sand'); // Arena sparring floor
        }
        if (dist > 4.2 && dist <= 5.2) {
          this.setBlock(x, cy + 1, z, 'stone');
        }
      }
    }

    // 4 Grand Arena Corner Pillars
    const pillars = [
      [cx - 4, cz - 4], [cx + 4, cz - 4],
      [cx - 4, cz + 4], [cx + 4, cz + 4]
    ];

    pillars.forEach(([px, pz]) => {
      for (let y = cy + 1; y <= cy + 4; y++) {
        this.setBlock(px, y, pz, 'cobble');
      }
      this.setBlock(px, cy + 5, pz, 'torch');
    });

    // Training Target Dummies (Hay/Wood)
    this.setBlock(cx - 2, cy + 1, cz, 'wood_pine');
    this.setBlock(cx - 2, cy + 2, cz, 'glowstone');
    this.setBlock(cx + 2, cy + 1, cz, 'wood_pine');
    this.setBlock(cx + 2, cy + 2, cz, 'glowstone');

    // Weapon Racks & Anvil
    this.setBlock(cx, cy + 1, cz - 3, 'iron_block');
  }

  // =========================================================================
  // LANDMARK 4: CREATIVE WORKSHOP (CREATIVITY)
  // =========================================================================
  private buildCreativeWorkshop(): void {
    const cx = 0;
    const cy = 5;
    const cz = -10;

    // Brick & Timber Workshop
    for (let x = cx - 4; x <= cx + 4; x++) {
      for (let z = cz - 4; z <= cz + 4; z++) {
        this.setBlock(x, cy, z, 'planks');
        const isWall = x === cx - 4 || x === cx + 4 || z === cz - 4 || z === cz + 4;
        if (isWall) {
          this.setBlock(x, cy + 1, z, 'brick');
          this.setBlock(x, cy + 2, z, 'planks');
          this.setBlock(x, cy + 3, z, 'brick');
        }
      }
    }

    // Glass Skylight Roof
    for (let x = cx - 3; x <= cx + 3; x++) {
      for (let z = cz - 3; z <= cz + 3; z++) {
        if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
          this.setBlock(x, cy + 4, z, 'glass');
        } else {
          this.setBlock(x, cy + 4, z, 'wood_oak');
        }
      }
    }

    // Forge Chimney with Glowing Ember Core
    for (let y = cy + 1; y <= cy + 6; y++) {
      this.setBlock(cx - 3, y, cz - 3, 'brick');
    }
    this.setBlock(cx - 2, cy + 1, cz - 3, 'glowstone'); // glowing furnace

    // Workshop Entrance
    this.setBlock(cx, cy + 1, cz + 4, 'air');
    this.setBlock(cx, cy + 2, cz + 4, 'air');
    this.setBlock(cx - 1, cy + 3, cz + 5, 'lantern');
  }

  // =========================================================================
  // LANDMARK 5: LANTERN VILLAGE (SOCIAL)
  // =========================================================================
  private buildLanternVillage(): void {
    const cx = -18;
    const cy = 5;
    const cz = 18;

    // Village Town Square with Cobblestone & Lamp Posts
    for (let x = cx - 6; x <= cx + 6; x++) {
      for (let z = cz - 6; z <= cz + 6; z++) {
        if (Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 5) {
          this.setBlock(x, cy, z, 'cobble');
        }
      }
    }

    // Central Village Well / Fountain
    this.setBlock(cx - 1, cy + 1, cz - 1, 'cobble');
    this.setBlock(cx + 1, cy + 1, cz - 1, 'cobble');
    this.setBlock(cx - 1, cy + 1, cz + 1, 'cobble');
    this.setBlock(cx + 1, cy + 1, cz + 1, 'cobble');
    this.setBlock(cx, cy + 1, cz, 'water');
    this.setBlock(cx, cy + 2, cz, 'lantern');

    // Marketplace Stalls with Colored Wool/Plank Awnings
    const stalls = [
      { x: cx - 4, z: cz - 3 },
      { x: cx + 4, z: cz - 3 }
    ];

    stalls.forEach(s => {
      this.setBlock(s.x, cy + 1, s.z, 'wood_oak');
      this.setBlock(s.x + 1, cy + 1, s.z, 'wood_oak');
      this.setBlock(s.x, cy + 2, s.z, 'bookshelf');
      this.setBlock(s.x + 1, cy + 2, s.z, 'bookshelf');
      this.setBlock(s.x, cy + 3, s.z, 'planks');
      this.setBlock(s.x + 1, cy + 3, s.z, 'planks');
      this.setBlock(s.x, cy + 3, s.z + 1, 'lantern');
    });
  }

  // =========================================================================
  // LANDMARK 6: MOONLIT GARDEN (WELLNESS)
  // =========================================================================
  private buildMoonlitGarden(): void {
    const cx = 20;
    const cy = 5;
    const cz = -18;

    // Serene Stone Sanctuary with Glowing Water Pool
    for (let x = cx - 5; x <= cx + 5; x++) {
      for (let z = cz - 5; z <= cz + 5; z++) {
        const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
        if (dist <= 4.5) {
          if (dist <= 2.2) {
            this.setBlock(x, cy, z, 'water'); // Crystal healing pool
          } else {
            this.setBlock(x, cy, z, 'stone');
          }
        }
      }
    }

    // Sacred Central Moon Crystal in pool
    this.setBlock(cx, cy, cz, 'crystal_lapis');
    this.setBlock(cx, cy + 1, cz, 'crystal_amethyst');

    // Weeping Blossom Willow Pillars around fountain
    const gardenLanterns = [
      [cx - 3, cz - 3], [cx + 3, cz - 3],
      [cx - 3, cz + 3], [cx + 3, cz + 3]
    ];

    gardenLanterns.forEach(([gx, gz]) => {
      this.setBlock(gx, cy + 1, gz, 'cobble');
      this.setBlock(gx, cy + 2, gz, 'lantern');
      this.setBlock(gx, cy + 1, gz + 1, 'flower_blue');
    });
  }

  // =========================================================================
  // DYNAMIC LANDMARK PROGRESSION (REAL LIFE PROGRESS DRIVES THE 3D WORLD!)
  // =========================================================================
  public updateAllProgressionTiers(attributes: Record<AttributeType, number>): void {
    this.updateKnowledgeTowerTier(attributes.intellect || 0);
    this.updateTrainingGroundsTier(attributes.strength || 0);
    this.updateCreativeWorkshopTier(attributes.creativity || 0);
    this.updateLanternVillageTier(attributes.social || 0);
    this.updateMoonlitGardenTier(attributes.wellness || 0);
  }

  private updateKnowledgeTowerTier(intellect: number): void {
    const cx = -18;
    const cy = 6;
    const cz = -18;

    const tier = intellect >= 30 ? 4 : intellect >= 20 ? 3 : intellect >= 10 ? 2 : 1;
    this.landmarkTiers.set('knowledge_tower', tier);

    // Tier 2 (Intellect >= 10): Upper Observatory Dome & Telescope
    if (tier >= 2) {
      for (let y = cy + 12; y <= cy + 15; y++) {
        for (let x = cx - 2; x <= cx + 2; x++) {
          for (let z = cz - 2; z <= cz + 2; z++) {
            if (y === cy + 15 && (Math.abs(x - cx) === 2 || Math.abs(z - cz) === 2)) continue;
            this.setBlock(x, y, z, 'glass');
          }
        }
      }
      this.setBlock(cx, cy + 16, cz, 'glowstone');
    }

    // Tier 3 (Intellect >= 20): Floating Runic Mystic Ring
    if (tier >= 3) {
      const ringY = cy + 13;
      const ringOffsets = [
        [-4, 0], [4, 0], [0, -4], [0, 4],
        [-3, -3], [3, -3], [-3, 3], [3, 3]
      ];
      ringOffsets.forEach(([ox, oz]) => {
        this.setBlock(cx + ox, ringY, cz + oz, 'crystal_lapis');
      });
    }

    // Tier 4 (Intellect >= 30): Grand Astral Spire Beacon
    if (tier >= 4) {
      for (let y = cy + 17; y <= cy + 22; y++) {
        this.setBlock(cx, y, cz, 'crystal_lapis');
      }
      this.setBlock(cx, cy + 23, cz, 'gold_block');
    }
  }

  private updateTrainingGroundsTier(strength: number): void {
    const cx = 20;
    const cy = 5;
    const cz = 18;

    const tier = strength >= 30 ? 4 : strength >= 20 ? 3 : strength >= 10 ? 2 : 1;
    this.landmarkTiers.set('mine_training', tier);

    // Tier 2 (Strength >= 10): Stone Watchtower over quarry
    if (tier >= 2) {
      for (let y = cy + 1; y <= cy + 7; y++) {
        this.setBlock(cx + 6, y, cz - 4, 'cobble');
      }
      this.setBlock(cx + 6, cy + 8, cz - 4, 'torch');
    }

    // Tier 3 (Strength >= 20): Fortified Battlement Walls & Iron Armory
    if (tier >= 3) {
      this.setBlock(cx - 3, cy + 1, cz - 3, 'iron_block');
      this.setBlock(cx - 3, cy + 2, cz - 3, 'iron_block');
      this.setBlock(cx + 3, cy + 1, cz + 3, 'iron_block');
    }

    // Tier 4 (Strength >= 30): Golden Champion Colosseum Pillars
    if (tier >= 4) {
      const colosseumPillars = [
        [cx - 5, cz], [cx + 5, cz], [cx, cz - 5], [cx, cz + 5]
      ];
      colosseumPillars.forEach(([px, pz]) => {
        for (let y = cy + 1; y <= cy + 6; y++) {
          this.setBlock(px, y, pz, 'gold_block');
        }
        this.setBlock(px, cy + 7, pz, 'glowstone');
      });
    }
  }

  private updateCreativeWorkshopTier(creativity: number): void {
    const cx = 0;
    const cy = 5;
    const cz = -10;

    const tier = creativity >= 30 ? 4 : creativity >= 20 ? 3 : creativity >= 10 ? 2 : 1;
    this.landmarkTiers.set('workshop', tier);

    // Tier 2 (Creativity >= 10): Waterwheel & Expanded Forge
    if (tier >= 2) {
      for (let wy = cy; wy <= cy + 3; wy++) {
        this.setBlock(cx + 5, wy, cz, 'wood_oak');
      }
    }

    // Tier 3 (Creativity >= 20): Steam Pipes & Clockwork Tower
    if (tier >= 3) {
      for (let y = cy + 1; y <= cy + 7; y++) {
        this.setBlock(cx + 3, y, cz + 3, 'brick');
      }
      this.setBlock(cx + 3, cy + 8, cz + 3, 'lantern');
    }

    // Tier 4 (Creativity >= 30): Artificer Grand Laboratory with Crystal Antennas
    if (tier >= 4) {
      this.setBlock(cx, cy + 5, cz, 'crystal_amber');
      this.setBlock(cx, cy + 6, cz, 'crystal_amber');
      this.setBlock(cx, cy + 7, cz, 'glowstone');
    }
  }

  private updateLanternVillageTier(social: number): void {
    const cx = -18;
    const cy = 5;
    const cz = 18;

    const tier = social >= 30 ? 4 : social >= 20 ? 3 : social >= 10 ? 2 : 1;
    this.landmarkTiers.set('village', tier);

    // Tier 2 (Social >= 10): Grand Entry Archway & Welcome Lanterns
    if (tier >= 2) {
      for (let y = cy + 1; y <= cy + 5; y++) {
        this.setBlock(cx - 3, y, cz - 6, 'wood_oak');
        this.setBlock(cx + 3, y, cz - 6, 'wood_oak');
      }
      for (let x = cx - 3; x <= cx + 3; x++) {
        this.setBlock(x, cy + 5, cz - 6, 'wood_oak');
      }
      this.setBlock(cx, cy + 4, cz - 6, 'lantern');
    }

    // Tier 3 (Social >= 20): Town Hall Pavilion
    if (tier >= 3) {
      this.setBlock(cx, cy + 3, cz, 'glowstone');
      this.setBlock(cx, cy + 4, cz, 'gold_block');
    }

    // Tier 4 (Social >= 30): Festival Canopy of Lights
    if (tier >= 4) {
      const festivalLanterns = [
        [cx - 5, cz - 5], [cx + 5, cz - 5],
        [cx - 5, cz + 5], [cx + 5, cz + 5]
      ];
      festivalLanterns.forEach(([lx, lz]) => {
        this.setBlock(lx, cy + 4, lz, 'lantern');
      });
    }
  }

  private updateMoonlitGardenTier(wellness: number): void {
    const cx = 20;
    const cy = 5;
    const cz = -18;

    const tier = wellness >= 30 ? 4 : wellness >= 20 ? 3 : wellness >= 10 ? 2 : 1;
    this.landmarkTiers.set('sanctuary', tier);

    // Tier 2 (Wellness >= 10): Radiant Flower Petal Ring
    if (tier >= 2) {
      for (let x = cx - 4; x <= cx + 4; x++) {
        for (let z = cz - 4; z <= cz + 4; z++) {
          if (Math.abs(x - cx) === 4 || Math.abs(z - cz) === 4) {
            this.setBlock(x, cy + 1, z, (x + z) % 2 === 0 ? 'flower_red' : 'flower_blue');
          }
        }
      }
    }

    // Tier 3 (Wellness >= 20): Glowing Giant Sakura Bloom & Cascading Fountain
    if (tier >= 3) {
      this.setBlock(cx, cy + 2, cz, 'crystal_amethyst');
      this.setBlock(cx, cy + 3, cz, 'crystal_amethyst');
      this.setBlock(cx, cy + 4, cz, 'glowstone');
    }

    // Tier 4 (Wellness >= 30): Celestial Moon Shrine with Luminescent Crystals
    if (tier >= 4) {
      this.setBlock(cx - 2, cy + 2, cz, 'crystal_lapis');
      this.setBlock(cx + 2, cy + 2, cz, 'crystal_lapis');
      this.setBlock(cx, cy + 2, cz - 2, 'crystal_lapis');
      this.setBlock(cx, cy + 2, cz + 2, 'crystal_lapis');
    }
  }

  // =========================================================================
  // HIGH-PERFORMANCE INSTANCED MESH REBUILD
  // Only blocks with at least 1 exposed face are instanced!
  // =========================================================================
  public rebuildAllMeshes(): void {
    // 1. Dispose previous InstancedMeshes
    this.instancedMeshes.forEach(mesh => {
      this.blockMeshGroup.remove(mesh);
      mesh.geometry.dispose();
    });
    this.instancedMeshes.clear();

    // 2. Collect visible block coordinates per BlockType
    const visibleBlocksPerType: Map<BlockType, VoxelCoord[]> = new Map();

    const neighborOffsets = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ];

    this.blocks.forEach((type, key) => {
      if (type === 'air') return;

      const [sx, sy, sz] = key.split(',').map(Number);

      // Check if any neighboring face is exposed (air, transparent, or water if self is solid)
      let isExposed = false;
      for (const [ox, oy, oz] of neighborOffsets) {
        const neighborType = this.getBlock(sx + ox, sy + oy, sz + oz);
        if (neighborType === 'air') {
          isExposed = true;
          break;
        }
        const def = BLOCK_DEFS[neighborType];
        if (def && def.isTransparent && neighborType !== type) {
          isExposed = true;
          break;
        }
      }

      if (isExposed) {
        let list = visibleBlocksPerType.get(type);
        if (!list) {
          list = [];
          visibleBlocksPerType.set(type, list);
        }
        list.push({ x: sx, y: sy, z: sz });
      }
    });

    // 3. Create InstancedMesh for each block type
    visibleBlocksPerType.forEach((coords, type) => {
      const count = coords.length;
      if (count === 0) return;

      const material = getBlockMaterial(type);
      const mesh = new THREE.InstancedMesh(this.boxGeometry, material, count);
      mesh.castShadow = type !== 'water' && type !== 'glass';
      mesh.receiveShadow = true;

      for (let i = 0; i < count; i++) {
        const c = coords[i];
        this.dummyMatrix.setPosition(c.x + 0.5, c.y + 0.5, c.z + 0.5);
        mesh.setMatrixAt(i, this.dummyMatrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      this.instancedMeshes.set(type, mesh);
      this.blockMeshGroup.add(mesh);
    });
  }

  // Fast single-block update (rebuilds meshes)
  public updateBlock(x: number, y: number, z: number, type: BlockType): void {
    this.setBlock(x, y, z, type);
    this.rebuildAllMeshes();
  }

  public generate(): void {
    this.generateInitialWorld({
      intellect: 15,
      strength: 15,
      creativity: 15,
      social: 15,
      wellness: 15
    });
  }

  public createParticleBurst(x: number, y: number, z: number, colorHex: string, count: number): void {
    // Particle burst handled via environment or local debris
  }

  public updateParticles(delta: number): void {
    // Particle update hook
  }

  public getLandmarkTier(landmarkId: string): number {
    return this.landmarkTiers.get(landmarkId) || 1;
  }

  public dispose(): void {
    this.instancedMeshes.forEach(mesh => {
      this.blockMeshGroup.remove(mesh);
      mesh.geometry.dispose();
    });
    this.instancedMeshes.clear();
    this.boxGeometry.dispose();
  }
}
