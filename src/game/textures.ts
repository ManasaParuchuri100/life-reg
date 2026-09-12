// Procedural Pixel Art Texture Generator for Hearthbound 2D Game World
// Generates authentic 16-bit / 32-bit pixel art textures using HTML5 Canvas
// Zero external network dependencies for instant, rock-solid offline & online rendering

import Phaser from 'phaser';
import { LocationId } from '../types';

/**
 * Creates an offscreen canvas with nearest-neighbor rendering
 */
function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
  }
  return canvas;
}

/**
 * Fill a pixel rect helper
 */
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

/**
 * Register all game textures in Phaser scene
 */
export function generateGameTextures(scene: Phaser.Scene): void {
  // Check if already registered
  if (scene.textures.exists('tile_grass_1')) return;

  generateTerrainTiles(scene);
  generatePropsAndNature(scene);
  generateCharacterSprites(scene);
  generateNpcSprites(scene);
  generateBuildingSprites(scene);
  generateEffectTextures(scene);
}

// =========================================================================
// 1. TERRAIN TILES (32x32)
// =========================================================================
function generateTerrainTiles(scene: Phaser.Scene): void {
  // Grass 1 (Base lush green)
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#3b9249');
    // pixel grass blades
    const blades = [
      [4, 6], [14, 4], [22, 8], [8, 18], [24, 20], [12, 26], [28, 28]
    ];
    blades.forEach(([x, y]) => {
      px(ctx, x, y, 2, 3, '#4eb85f');
      px(ctx, x + 1, y - 1, 2, 2, '#64d276');
      px(ctx, x, y + 3, 2, 1, '#2c7338');
    });
    scene.textures.addCanvas('tile_grass_1', canvas);
  }

  // Grass 2 (Variation with small clovers)
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#358742');
    const spots = [[6, 8], [18, 14], [10, 22], [24, 26]];
    spots.forEach(([x, y]) => {
      px(ctx, x, y, 2, 2, '#50c262');
      px(ctx, x + 2, y, 2, 2, '#50c262');
      px(ctx, x + 1, y - 2, 2, 2, '#50c262');
      px(ctx, x + 1, y + 2, 1, 2, '#286b33');
    });
    scene.textures.addCanvas('tile_grass_2', canvas);
  }

  // Grass with Wildflowers
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#3b9249');
    // Yellow & Blue flowers
    px(ctx, 8, 10, 3, 3, '#facc15');
    px(ctx, 9, 11, 1, 1, '#f97316');
    px(ctx, 22, 18, 3, 3, '#60a5fa');
    px(ctx, 23, 19, 1, 1, '#ffffff');
    px(ctx, 12, 24, 3, 3, '#f472b6');
    px(ctx, 13, 25, 1, 1, '#ffffff');
    scene.textures.addCanvas('tile_grass_flowers', canvas);
  }

  // Cobblestone Path
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#475569'); // mortar base
    // Stones
    const stones = [
      { x: 2, y: 2, w: 12, h: 8, c: '#94a3b8' },
      { x: 16, y: 2, w: 14, h: 8, c: '#64748b' },
      { x: 2, y: 12, w: 16, h: 8, c: '#64748b' },
      { x: 20, y: 12, w: 10, h: 8, c: '#94a3b8' },
      { x: 2, y: 22, w: 12, h: 8, c: '#94a3b8' },
      { x: 16, y: 22, w: 14, h: 8, c: '#64748b' }
    ];
    stones.forEach(s => {
      px(ctx, s.x, s.y, s.w, s.h, s.c);
      // Highlights on top/left
      px(ctx, s.x, s.y, s.w, 1, '#cbd5e1');
      px(ctx, s.x, s.y, 1, s.h, '#cbd5e1');
      // Shadow on bottom/right
      px(ctx, s.x, s.y + s.h - 1, s.w, 1, '#334155');
      px(ctx, s.x + s.w - 1, s.y, 1, s.h, '#334155');
    });
    scene.textures.addCanvas('tile_cobble', canvas);
  }

  // Dirt Path
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#8d6e63');
    px(ctx, 4, 4, 8, 6, '#795548');
    px(ctx, 16, 12, 10, 8, '#a1887f');
    px(ctx, 6, 20, 12, 6, '#6d4c41');
    px(ctx, 22, 22, 6, 6, '#bcaaa4');
    scene.textures.addCanvas('tile_dirt', canvas);
  }

  // Animated Water (Frames 1, 2, 3)
  for (let f = 1; f <= 3; f++) {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#1e40af'); // deep water
    // Wave shimmer lines with offset per frame
    const offset = (f - 1) * 5;
    px(ctx, (4 + offset) % 32, 6, 10, 2, '#3b82f6');
    px(ctx, (18 + offset) % 32, 14, 12, 2, '#60a5fa');
    px(ctx, (8 + offset) % 32, 22, 14, 2, '#3b82f6');
    px(ctx, (22 + offset) % 32, 28, 8, 2, '#93c5fd');
    // sparkle dot
    px(ctx, (12 + offset * 2) % 32, 10, 2, 2, '#ffffff');
    px(ctx, (24 + offset * 2) % 32, 24, 2, 2, '#ffffff');
    scene.textures.addCanvas(`tile_water_${f}`, canvas);
  }

  // Wooden Bridge Horizontal
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#5d4037'); // support
    // Wood planks
    for (let x = 1; x < 32; x += 6) {
      px(ctx, x, 2, 5, 28, '#8d6e63');
      px(ctx, x, 2, 5, 1, '#bcaaa4'); // highlight
      px(ctx, x + 4, 2, 1, 28, '#4e342e'); // shadow
      // Nails
      px(ctx, x + 2, 4, 1, 1, '#271c19');
      px(ctx, x + 2, 27, 1, 1, '#271c19');
    }
    // Ropes / handrails
    px(ctx, 0, 2, 32, 2, '#3e2723');
    px(ctx, 0, 28, 32, 2, '#3e2723');
    scene.textures.addCanvas('tile_bridge_h', canvas);
  }

  // Wooden Bridge Vertical
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#5d4037');
    for (let y = 1; y < 32; y += 6) {
      px(ctx, 2, y, 28, 5, '#8d6e63');
      px(ctx, 2, y, 28, 1, '#bcaaa4');
      px(ctx, 2, y + 4, 28, 1, '#4e342e');
      px(ctx, 4, y + 2, 1, 1, '#271c19');
      px(ctx, 27, y + 2, 1, 1, '#271c19');
    }
    px(ctx, 2, 0, 2, 32, '#3e2723');
    px(ctx, 28, 0, 2, 32, '#3e2723');
    scene.textures.addCanvas('tile_bridge_v', canvas);
  }

  // Mountain Cliff Face
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#475569');
    // Crags & rock ledges
    px(ctx, 0, 0, 32, 6, '#388e3c'); // grass top
    px(ctx, 0, 6, 32, 2, '#1e5a28'); // grass overhang shadow
    px(ctx, 4, 10, 10, 12, '#64748b');
    px(ctx, 16, 14, 14, 10, '#334155');
    px(ctx, 4, 10, 10, 1, '#94a3b8');
    px(ctx, 2, 24, 28, 8, '#1e293b');
    scene.textures.addCanvas('tile_cliff', canvas);
  }

  // Shore Sand
  {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 0, 0, 32, 32, '#eab308');
    px(ctx, 2, 4, 6, 4, '#fde047');
    px(ctx, 14, 12, 8, 6, '#ca8a04');
    px(ctx, 20, 22, 6, 4, '#fef08a');
    scene.textures.addCanvas('tile_sand', canvas);
  }
}

// =========================================================================
// 2. PROPS & NATURE
// =========================================================================
function generatePropsAndNature(scene: Phaser.Scene): void {
  // Lush Oak Tree (48x64)
  {
    const canvas = makeCanvas(48, 64);
    const ctx = canvas.getContext('2d')!;
    // Shadow
    px(ctx, 8, 52, 32, 10, '#1c4524');
    // Trunk
    px(ctx, 20, 36, 8, 22, '#5c3a21');
    px(ctx, 22, 36, 4, 22, '#784e2d'); // highlight
    px(ctx, 18, 54, 4, 4, '#432714'); // roots
    px(ctx, 26, 54, 4, 4, '#432714');

    // Foliage Clusters
    const circles = [
      { x: 12, y: 14, r: 16, c: '#237332', hi: '#38a14b', sh: '#154b20' },
      { x: 26, y: 10, r: 18, c: '#2e8b3e', hi: '#4fc463', sh: '#185925' },
      { x: 34, y: 22, r: 14, c: '#237332', hi: '#38a14b', sh: '#154b20' },
      { x: 16, y: 28, r: 15, c: '#1f692d', hi: '#349945', sh: '#13441c' }
    ];
    circles.forEach(c => {
      ctx.fillStyle = c.c;
      ctx.beginPath();
      ctx.arc(c.x + c.r, c.y + c.r, c.r, 0, Math.PI * 2);
      ctx.fill();

      // Top highlight
      ctx.fillStyle = c.hi;
      ctx.beginPath();
      ctx.arc(c.x + c.r - 2, c.y + c.r - 3, c.r * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Bottom shadow
      ctx.fillStyle = c.sh;
      ctx.beginPath();
      ctx.arc(c.x + c.r + 2, c.y + c.r + 3, c.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    });
    scene.textures.addCanvas('prop_tree_oak', canvas);
  }

  // Pine Tree (40x60)
  {
    const canvas = makeCanvas(40, 60);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 10, 52, 20, 6, '#14381b');
    px(ctx, 17, 44, 6, 12, '#4e342e');

    // Tiered triangles
    const tiers = [
      { top: 6, w: 16, h: 16, c: '#2d6a4f', hi: '#40916c' },
      { top: 16, w: 26, h: 18, c: '#1b4332', hi: '#2d6a4f' },
      { top: 28, w: 36, h: 20, c: '#081c15', hi: '#1b4332' }
    ];
    tiers.forEach(t => {
      ctx.fillStyle = t.c;
      ctx.beginPath();
      ctx.moveTo(20, t.top);
      ctx.lineTo(20 - t.w / 2, t.top + t.h);
      ctx.lineTo(20 + t.w / 2, t.top + t.h);
      ctx.closePath();
      ctx.fill();

      // Left light side
      ctx.fillStyle = t.hi;
      ctx.beginPath();
      ctx.moveTo(20, t.top);
      ctx.lineTo(20 - t.w / 2, t.top + t.h);
      ctx.lineTo(20, t.top + t.h);
      ctx.closePath();
      ctx.fill();
    });
    scene.textures.addCanvas('prop_tree_pine', canvas);
  }

  // Sakura / Moon Blossom Tree (Wellness Sanctuary)
  {
    const canvas = makeCanvas(48, 64);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 8, 52, 32, 10, '#1c4524');
    px(ctx, 20, 36, 8, 22, '#4a2c20');
    px(ctx, 22, 36, 4, 22, '#664030');

    const pinkBlobs = [
      { x: 10, y: 12, r: 16, c: '#f472b6', hi: '#fbcfe8', sh: '#db2777' },
      { x: 24, y: 8, r: 18, c: '#ec4899', hi: '#fce7f3', sh: '#be185d' },
      { x: 30, y: 22, r: 14, c: '#f472b6', hi: '#fbcfe8', sh: '#db2777' },
      { x: 14, y: 26, r: 15, c: '#db2777', hi: '#f472b6', sh: '#9d174d' }
    ];
    pinkBlobs.forEach(c => {
      ctx.fillStyle = c.c;
      ctx.beginPath();
      ctx.arc(c.x + c.r, c.y + c.r, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.hi;
      ctx.beginPath();
      ctx.arc(c.x + c.r - 2, c.y + c.r - 3, c.r * 0.65, 0, Math.PI * 2);
      ctx.fill();
    });
    scene.textures.addCanvas('prop_tree_sakura', canvas);
  }

  // Street Lantern Post (16x36)
  {
    const canvas = makeCanvas(16, 36);
    const ctx = canvas.getContext('2d')!;
    // Base & Pole
    px(ctx, 5, 30, 6, 4, '#1e293b');
    px(ctx, 7, 10, 2, 22, '#334155');
    // Lamp Bracket
    px(ctx, 5, 8, 6, 2, '#475569');
    // Glass Lantern Body
    px(ctx, 4, 10, 8, 9, '#fef08a');
    px(ctx, 5, 11, 6, 7, '#fde047');
    px(ctx, 6, 12, 4, 5, '#ffffff'); // filament glow
    // Cap
    px(ctx, 3, 7, 10, 3, '#0f172a');
    px(ctx, 6, 5, 4, 2, '#0f172a');
    scene.textures.addCanvas('prop_lantern', canvas);
  }

  // Boulder / Rock
  {
    const canvas = makeCanvas(32, 24);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 2, 14, 28, 8, '#1e293b'); // shadow
    px(ctx, 4, 4, 24, 16, '#64748b');
    px(ctx, 6, 6, 12, 6, '#94a3b8'); // highlight
    px(ctx, 16, 12, 10, 8, '#475569'); // dark crevice
    px(ctx, 4, 16, 24, 4, '#334155');
    scene.textures.addCanvas('prop_rock', canvas);
  }

  // Village Bench
  {
    const canvas = makeCanvas(32, 20);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 2, 4, 28, 4, '#8d6e63');
    px(ctx, 2, 10, 28, 4, '#6d4c41');
    px(ctx, 4, 14, 3, 5, '#3e2723');
    px(ctx, 25, 14, 3, 5, '#3e2723');
    scene.textures.addCanvas('prop_bench', canvas);
  }

  // Training Dummy (Strength Grounds)
  {
    const canvas = makeCanvas(24, 36);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 10, 24, 4, 12, '#5d4037'); // post
    px(ctx, 6, 12, 12, 14, '#d97706'); // straw torso
    px(ctx, 8, 4, 8, 8, '#b45309'); // head
    px(ctx, 9, 6, 6, 5, '#fef3c7');
    px(ctx, 2, 14, 20, 3, '#78350f'); // wooden arms
    px(ctx, 8, 16, 8, 2, '#ef4444'); // red target belt
    scene.textures.addCanvas('prop_dummy', canvas);
  }

  // Creative Easel (Workshop)
  {
    const canvas = makeCanvas(28, 36);
    const ctx = canvas.getContext('2d')!;
    // Legs
    px(ctx, 6, 4, 3, 30, '#8d6e63');
    px(ctx, 19, 4, 3, 30, '#8d6e63');
    px(ctx, 13, 10, 2, 24, '#6d4c41');
    // Canvas board
    px(ctx, 4, 8, 20, 16, '#f8fafc');
    // Painting on canvas
    px(ctx, 6, 10, 8, 8, '#38bdf8'); // sky
    px(ctx, 6, 16, 16, 6, '#4ade80'); // hill
    px(ctx, 16, 10, 4, 4, '#facc15'); // sun
    // Shelf
    px(ctx, 3, 24, 22, 2, '#5d4037');
    scene.textures.addCanvas('prop_easel', canvas);
  }

  // Moonlit Garden Lotus Pond / Fountain (48x48)
  {
    const canvas = makeCanvas(48, 48);
    const ctx = canvas.getContext('2d')!;
    // Stone rim
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(24, 24, 22, 0, Math.PI * 2);
    ctx.fill();

    // Water basin
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(24, 24, 18, 0, Math.PI * 2);
    ctx.fill();

    // Shimmer water
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(24, 24, 14, 0, Math.PI * 2);
    ctx.fill();

    // Blooming lotus flower
    px(ctx, 20, 20, 8, 8, '#ec4899');
    px(ctx, 22, 22, 4, 4, '#fbcfe8');
    px(ctx, 23, 23, 2, 2, '#facc15');
    scene.textures.addCanvas('prop_pond', canvas);
  }
}

// =========================================================================
// 3. ORIGINAL PLAYER CHARACTER SPRITESHEET (32x32)
// =========================================================================
function generateCharacterSprites(scene: Phaser.Scene): void {
  // Generate multi-frame character sprite sheet:
  // 6 columns (Walk 1, Walk 2, Walk 3, Walk 4, Idle 1, Celebrate)
  // 4 rows (Down, Up, Left, Right)
  const fw = 32;
  const fh = 32;
  const canvas = makeCanvas(fw * 6, fh * 4);
  const ctx = canvas.getContext('2d')!;

  // Direction row: 0=Down, 1=Up, 2=Left, 3=Right
  for (let dir = 0; dir < 4; dir++) {
    for (let frame = 0; frame < 6; frame++) {
      const ox = frame * fw;
      const oy = dir * fh;

      // Draw shadow
      px(ctx, ox + 8, oy + 26, 16, 5, 'rgba(0,0,0,0.3)');

      // Leg animation offsets
      let legL = 0;
      let legR = 0;
      let bob = 0;

      if (frame === 0) { legL = -2; legR = 2; bob = 1; }
      else if (frame === 1) { legL = 0; legR = 0; bob = 0; }
      else if (frame === 2) { legL = 2; legR = -2; bob = 1; }
      else if (frame === 3) { legL = 0; legR = 0; bob = 0; }
      else if (frame === 4) { legL = 0; legR = 0; bob = 0; } // idle
      else if (frame === 5) { legL = -1; legR = 1; bob = -3; } // celebrate jump

      // LEGS (Dark navy pants)
      if (dir === 0 || dir === 1) {
        // Front or Back
        px(ctx, ox + 11, oy + 20 + legL + bob, 4, 7 - legL, '#1e293b');
        px(ctx, ox + 17, oy + 20 + legR + bob, 4, 7 - legR, '#1e293b');
        // Boots (Brown leather)
        px(ctx, ox + 10, oy + 25 + legL + bob, 5, 3, '#78350f');
        px(ctx, ox + 17, oy + 25 + legR + bob, 5, 3, '#78350f');
      } else if (dir === 2 || dir === 3) {
        // Side profile
        px(ctx, ox + 13 + (dir === 2 ? -legL : legL), oy + 20 + bob, 6, 7, '#1e293b');
        px(ctx, ox + 12 + (dir === 2 ? -legL : legL), oy + 25 + bob, 7, 3, '#78350f');
      }

      // BODY / TUNIC (Heroic Sky/Teal with gold trim)
      px(ctx, ox + 10, oy + 12 + bob, 12, 9, '#0284c7');
      px(ctx, ox + 12, oy + 13 + bob, 8, 7, '#0ea5e9'); // chest light
      px(ctx, ox + 10, oy + 19 + bob, 12, 2, '#b45309'); // brown leather belt
      px(ctx, ox + 15, oy + 19 + bob, 2, 2, '#facc15'); // gold buckle

      // ARMS & HANDS
      if (frame === 5) {
        // Celebrate hands up!
        px(ctx, ox + 7, oy + 8 + bob, 3, 7, '#0284c7');
        px(ctx, ox + 22, oy + 8 + bob, 3, 7, '#0284c7');
        px(ctx, ox + 7, oy + 6 + bob, 3, 3, '#fbcfe8'); // hands
        px(ctx, ox + 22, oy + 6 + bob, 3, 3, '#fbcfe8');
      } else if (dir === 0) {
        // Front
        px(ctx, ox + 8, oy + 13 + bob - legL, 3, 7, '#0284c7');
        px(ctx, ox + 21, oy + 13 + bob - legR, 3, 7, '#0284c7');
        px(ctx, ox + 8, oy + 18 + bob - legL, 3, 3, '#fed7aa');
        px(ctx, ox + 21, oy + 18 + bob - legR, 3, 3, '#fed7aa');
      } else if (dir === 1) {
        // Back
        px(ctx, ox + 8, oy + 13 + bob + legL, 3, 7, '#0369a1');
        px(ctx, ox + 21, oy + 13 + bob + legR, 3, 7, '#0369a1');
      } else if (dir === 2) {
        // Left
        px(ctx, ox + 14 - legL, oy + 13 + bob, 3, 7, '#0284c7');
        px(ctx, ox + 14 - legL, oy + 18 + bob, 3, 3, '#fed7aa');
      } else {
        // Right
        px(ctx, ox + 15 + legL, oy + 13 + bob, 3, 7, '#0284c7');
        px(ctx, ox + 15 + legL, oy + 18 + bob, 3, 3, '#fed7aa');
      }

      // HEAD & FACE
      px(ctx, ox + 11, oy + 5 + bob, 10, 8, '#fed7aa'); // peach skin
      // Auburn / Chestnut hair
      px(ctx, ox + 9, oy + 3 + bob, 14, 5, '#92400e');
      px(ctx, ox + 11, oy + 2 + bob, 10, 2, '#b45309');

      if (dir === 0) {
        // Front face: eyes & smile
        px(ctx, ox + 13, oy + 8 + bob, 2, 2, '#1e293b');
        px(ctx, ox + 17, oy + 8 + bob, 2, 2, '#1e293b');
        px(ctx, ox + 13, oy + 8 + bob, 1, 1, '#ffffff'); // catchlight
        px(ctx, ox + 17, oy + 8 + bob, 1, 1, '#ffffff');
        px(ctx, ox + 14, oy + 11 + bob, 4, 1, '#ea580c'); // smile
      } else if (dir === 1) {
        // Back head: full hair
        px(ctx, ox + 10, oy + 5 + bob, 12, 7, '#92400e');
      } else if (dir === 2) {
        // Left profile face
        px(ctx, ox + 11, oy + 8 + bob, 2, 2, '#1e293b');
        px(ctx, ox + 10, oy + 6 + bob, 4, 4, '#92400e');
      } else if (dir === 3) {
        // Right profile face
        px(ctx, ox + 19, oy + 8 + bob, 2, 2, '#1e293b');
        px(ctx, ox + 18, oy + 6 + bob, 4, 4, '#92400e');
      }
    }
  }

  scene.textures.addSpriteSheet('player_sheet', canvas as unknown as HTMLImageElement, {
    frameWidth: fw,
    frameHeight: fh
  });

  // Also create equipment overlay sprites:
  // 1. Wood Sword
  {
    const c = makeCanvas(16, 16);
    const ctx = c.getContext('2d')!;
    px(ctx, 2, 12, 4, 2, '#78350f'); // hilt
    px(ctx, 4, 10, 3, 3, '#f59e0b'); // guard
    px(ctx, 6, 4, 3, 7, '#e2e8f0'); // blade
    px(ctx, 7, 2, 2, 3, '#ffffff'); // tip
    scene.textures.addCanvas('equip_sword', c);
  }

  // 2. Starlight Wand
  {
    const c = makeCanvas(16, 16);
    const ctx = c.getContext('2d')!;
    px(ctx, 2, 12, 6, 2, '#92400e');
    px(ctx, 6, 8, 3, 5, '#b45309');
    px(ctx, 8, 4, 4, 4, '#38bdf8'); // crystal star
    px(ctx, 9, 3, 2, 6, '#ffffff');
    scene.textures.addCanvas('equip_wand', c);
  }

  // 3. Wanderer Cap
  {
    const c = makeCanvas(24, 16);
    const ctx = c.getContext('2d')!;
    px(ctx, 4, 8, 16, 4, '#15803d');
    px(ctx, 6, 4, 12, 5, '#16a34a');
    px(ctx, 16, 2, 2, 5, '#dc2626'); // red feather
    scene.textures.addCanvas('equip_hat', c);
  }

  // 4. Gold Crown
  {
    const c = makeCanvas(20, 12);
    const ctx = c.getContext('2d')!;
    px(ctx, 2, 6, 16, 4, '#facc15');
    px(ctx, 3, 2, 3, 5, '#facc15');
    px(ctx, 9, 1, 3, 6, '#facc15');
    px(ctx, 15, 2, 3, 5, '#facc15');
    px(ctx, 9, 4, 3, 2, '#ef4444'); // ruby
    scene.textures.addCanvas('equip_crown', c);
  }

  // 5. Pet Companion: Midnight Cat (16x16)
  {
    const c = makeCanvas(16, 16);
    const ctx = c.getContext('2d')!;
    px(ctx, 4, 8, 8, 6, '#1e1b4b'); // black fur
    px(ctx, 2, 4, 6, 5, '#1e1b4b'); // head
    px(ctx, 2, 2, 2, 3, '#312e81'); // ears
    px(ctx, 6, 2, 2, 3, '#312e81');
    px(ctx, 3, 5, 2, 2, '#22c55e'); // green eyes
    px(ctx, 5, 5, 2, 2, '#22c55e');
    px(ctx, 12, 7, 2, 5, '#1e1b4b'); // tail wag
    px(ctx, 13, 6, 2, 2, '#312e81');
    scene.textures.addCanvas('pet_cat', c);
  }
}

// =========================================================================
// 4. NPC SPRITES (32x32)
// =========================================================================
function generateNpcSprites(scene: Phaser.Scene): void {
  const npcs = [
    { key: 'npc_sage', robe: '#1d4ed8', trim: '#60a5fa', hair: '#e2e8f0', item: 'book' },
    { key: 'npc_trainer', robe: '#dc2626', trim: '#f87171', hair: '#172554', item: 'belt' },
    { key: 'npc_artisan', robe: '#d97706', trim: '#fbbf24', hair: '#7c2d12', item: 'brush' },
    { key: 'npc_elder', robe: '#059669', trim: '#34d399', hair: '#cbd5e1', item: 'lantern' },
    { key: 'npc_healer', robe: '#db2777', trim: '#f472b6', hair: '#064e3b', item: 'flower' }
  ];

  npcs.forEach(n => {
    const canvas = makeCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    // Shadow
    px(ctx, 8, 26, 16, 4, 'rgba(0,0,0,0.3)');
    // Robe / Body
    px(ctx, 10, 14, 12, 12, n.robe);
    px(ctx, 12, 14, 8, 12, n.trim);
    // Head & Hair
    px(ctx, 11, 6, 10, 8, '#fed7aa');
    px(ctx, 9, 4, 14, 5, n.hair);
    // Eyes
    px(ctx, 13, 9, 2, 2, '#0f172a');
    px(ctx, 17, 9, 2, 2, '#0f172a');
    // Held item
    if (n.item === 'book') {
      px(ctx, 6, 16, 5, 6, '#38bdf8');
      px(ctx, 7, 17, 3, 4, '#ffffff');
    } else if (n.item === 'brush') {
      px(ctx, 6, 15, 2, 8, '#92400e');
      px(ctx, 6, 13, 2, 3, '#f59e0b');
    } else if (n.item === 'lantern') {
      px(ctx, 6, 16, 4, 6, '#fde047');
    } else if (n.item === 'flower') {
      px(ctx, 6, 16, 4, 4, '#ec4899');
    }

    scene.textures.addCanvas(n.key, canvas);
  });
}

// =========================================================================
// 5. BUILDINGS WITH DYNAMIC PROGRESSION TIERS
// =========================================================================
function generateBuildingSprites(scene: Phaser.Scene): void {
  // Knowledge Tower (Tiers 1 to 4)
  for (let tier = 1; tier <= 4; tier++) {
    const w = 96;
    const h = 112 + (tier - 1) * 16;
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    // Foundation stone
    px(ctx, 12, h - 36, 72, 36, '#334155');
    px(ctx, 16, h - 32, 64, 30, '#475569');
    // Doorway
    px(ctx, 38, h - 28, 20, 28, '#1e293b');
    px(ctx, 42, h - 26, 12, 24, '#f59e0b'); // glowing interior

    // Tower Body (Levels based on tier)
    const stories = tier;
    for (let s = 1; s <= stories; s++) {
      const sy = h - 36 - s * 22;
      const sw = 56 - (s - 1) * 4;
      const sx = 48 - sw / 2;
      px(ctx, sx, sy, sw, 22, '#475569');
      px(ctx, sx + 2, sy + 2, sw - 4, 18, '#64748b');
      // Arched stained glass windows
      px(ctx, sx + 8, sy + 6, 8, 12, '#38bdf8');
      px(ctx, sx + sw - 16, sy + 6, 8, 12, '#38bdf8');
    }

    // Spire Roof
    const roofY = h - 36 - stories * 22 - 24;
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(48, roofY);
    ctx.lineTo(24, roofY + 24);
    ctx.lineTo(72, roofY + 24);
    ctx.closePath();
    ctx.fill();

    // Arcane Crystal on top (Tier 2+)
    if (tier >= 2) {
      px(ctx, 45, roofY - 8, 6, 10, '#38bdf8');
      px(ctx, 46, roofY - 10, 4, 4, '#ffffff');
    }
    // Floating magical runes (Tier 3+)
    if (tier >= 3) {
      px(ctx, 22, roofY - 4, 4, 4, '#60a5fa');
      px(ctx, 70, roofY - 4, 4, 4, '#60a5fa');
    }

    scene.textures.addCanvas(`building_knowledge_t${tier}`, canvas);
  }

  // Training Grounds (Tiers 1 to 4)
  for (let tier = 1; tier <= 4; tier++) {
    const canvas = makeCanvas(96, 80);
    const ctx = canvas.getContext('2d')!;
    // Ring arena floor
    px(ctx, 8, 20, 80, 56, '#78350f');
    px(ctx, 12, 24, 72, 48, '#92400e');
    // Wooden fence posts
    for (let x = 8; x <= 84; x += 16) {
      px(ctx, x, 16, 4, 16, '#451a03');
    }
    px(ctx, 8, 20, 80, 3, '#78350f');

    // Training gear inside
    px(ctx, 24, 36, 16, 18, '#d97706'); // target
    px(ctx, 28, 32, 8, 8, '#ef4444');

    if (tier >= 2) {
      // Weapon rack & anvil
      px(ctx, 56, 32, 16, 14, '#475569');
      px(ctx, 60, 26, 8, 8, '#cbd5e1'); // swords
    }
    if (tier >= 3) {
      // Flaming brazier
      px(ctx, 74, 44, 10, 14, '#1e293b');
      px(ctx, 76, 38, 6, 8, '#f97316');
      px(ctx, 78, 36, 2, 4, '#fef08a');
    }
    scene.textures.addCanvas(`building_training_t${tier}`, canvas);
  }

  // Creative Workshop (Tiers 1 to 4)
  for (let tier = 1; tier <= 4; tier++) {
    const canvas = makeCanvas(96, 80);
    const ctx = canvas.getContext('2d')!;
    // Timber walls
    px(ctx, 16, 28, 64, 48, '#854d0e');
    px(ctx, 20, 32, 56, 40, '#a16207');
    // Stone chimney with puff of smoke
    px(ctx, 22, 10, 12, 22, '#475569');
    px(ctx, 24, 4, 8, 6, '#cbd5e1');
    // Sloped roof
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(48, 12);
    ctx.lineTo(12, 32);
    ctx.lineTo(84, 32);
    ctx.closePath();
    ctx.fill();
    // Warm window & Door
    px(ctx, 40, 48, 16, 24, '#451a03');
    px(ctx, 42, 50, 12, 20, '#fef08a');
    px(ctx, 62, 40, 12, 12, '#fde047');

    if (tier >= 2) {
      // Artisan gear / waterwheel beside house
      px(ctx, 80, 40, 12, 28, '#5d4037');
    }
    scene.textures.addCanvas(`building_workshop_t${tier}`, canvas);
  }

  // Lantern Village (Tiers 1 to 4)
  for (let tier = 1; tier <= 4; tier++) {
    const canvas = makeCanvas(104, 84);
    const ctx = canvas.getContext('2d')!;
    // Main Cottage
    px(ctx, 12, 30, 44, 48, '#065f46');
    px(ctx, 16, 34, 36, 40, '#047857');
    // Roof
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(34, 14);
    ctx.lineTo(8, 34);
    ctx.lineTo(60, 34);
    ctx.closePath();
    ctx.fill();
    // Door & window
    px(ctx, 26, 48, 16, 26, '#fef3c7');
    px(ctx, 40, 42, 10, 10, '#fef08a');

    // Secondary cottage or market stall
    px(ctx, 60, 38, 36, 40, '#047857');
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(78, 24);
    ctx.lineTo(56, 40);
    ctx.lineTo(100, 40);
    ctx.closePath();
    ctx.fill();

    // Village hanging lanterns
    px(ctx, 4, 38, 4, 8, '#fde047');
    px(ctx, 52, 38, 4, 8, '#fde047');
    scene.textures.addCanvas(`building_village_t${tier}`, canvas);
  }

  // Moonlit Garden Sanctuary (Tiers 1 to 4)
  for (let tier = 1; tier <= 4; tier++) {
    const canvas = makeCanvas(96, 80);
    const ctx = canvas.getContext('2d')!;
    // Pagoda / Gazebo shrine
    px(ctx, 24, 36, 48, 40, '#831843');
    px(ctx, 28, 40, 40, 32, '#be185d');
    // Arched Shrine Roof with curved tips
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(48, 14);
    ctx.lineTo(16, 38);
    ctx.lineTo(80, 38);
    ctx.closePath();
    ctx.fill();
    // Altar with glowing water or crystal
    px(ctx, 40, 48, 16, 20, '#fbcfe8');
    px(ctx, 44, 42, 8, 8, '#67e8f9'); // crystal wisp
    scene.textures.addCanvas(`building_sanctuary_t${tier}`, canvas);
  }

  // Player Home (Tiers 1 to 4)
  for (let tier = 1; tier <= 4; tier++) {
    const canvas = makeCanvas(96, 80);
    const ctx = canvas.getContext('2d')!;
    // Homestead stone base
    px(ctx, 16, 30, 64, 46, '#475569');
    px(ctx, 20, 34, 56, 38, '#64748b');
    // Timber frame
    px(ctx, 16, 30, 64, 4, '#78350f');
    // Roof (Terracotta shingles)
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(48, 12);
    ctx.lineTo(12, 34);
    ctx.lineTo(84, 34);
    ctx.closePath();
    ctx.fill();
    // Warm wooden door with brass knocker
    px(ctx, 40, 46, 16, 26, '#78350f');
    px(ctx, 42, 48, 12, 22, '#9a3412');
    px(ctx, 50, 56, 2, 2, '#facc15');
    // Windows with warm light and shutters
    px(ctx, 24, 44, 10, 12, '#fef08a');
    px(ctx, 62, 44, 10, 12, '#fef08a');
    // Chimney with cozy smoke
    px(ctx, 64, 12, 10, 18, '#334155');
    px(ctx, 66, 6, 6, 6, '#cbd5e1');

    if (tier >= 2) {
      // Flower window boxes
      px(ctx, 22, 56, 14, 3, '#ec4899');
      px(ctx, 60, 56, 14, 3, '#ec4899');
    }
    scene.textures.addCanvas(`building_home_t${tier}`, canvas);
  }
}

// =========================================================================
// 6. EFFECT & PARTICLE TEXTURES
// =========================================================================
function generateEffectTextures(scene: Phaser.Scene): void {
  // 1. XP Star Particle
  {
    const canvas = makeCanvas(12, 12);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 5, 0, 2, 12, '#facc15');
    px(ctx, 0, 5, 12, 2, '#facc15');
    px(ctx, 3, 3, 6, 6, '#fef08a');
    px(ctx, 4, 4, 4, 4, '#ffffff');
    scene.textures.addCanvas('fx_star', canvas);
  }

  // 2. Gold Coin Particle
  {
    const canvas = makeCanvas(10, 10);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 2, 1, 6, 8, '#eab308');
    px(ctx, 1, 2, 8, 6, '#eab308');
    px(ctx, 3, 3, 4, 4, '#fef08a');
    scene.textures.addCanvas('fx_coin', canvas);
  }

  // 3. Firefly Particle
  {
    const canvas = makeCanvas(8, 8);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 2, 2, 4, 4, '#a3e635');
    px(ctx, 3, 3, 2, 2, '#ffffff');
    scene.textures.addCanvas('fx_firefly', canvas);
  }

  // 4. Radial Lantern Light Mask
  {
    const canvas = makeCanvas(128, 128);
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.2)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    scene.textures.addCanvas('fx_lantern_glow', canvas);
  }

  // 5. Interact Prompt Indicator Bubble
  {
    const canvas = makeCanvas(36, 20);
    const ctx = canvas.getContext('2d')!;
    px(ctx, 2, 2, 32, 14, '#0f172a');
    px(ctx, 3, 3, 30, 12, '#1e293b');
    // [E] text in pixel art
    px(ctx, 14, 6, 2, 6, '#facc15');
    px(ctx, 14, 6, 6, 2, '#facc15');
    px(ctx, 14, 8, 5, 2, '#facc15');
    px(ctx, 14, 10, 6, 2, '#facc15');
    // Pointer notch
    px(ctx, 16, 16, 4, 2, '#0f172a');
    scene.textures.addCanvas('fx_prompt_e', canvas);
  }
}
