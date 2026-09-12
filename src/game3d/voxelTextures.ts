// Procedural 16x16 Pixel Art Textures for Original 3D Voxel RPG
// Created completely with Canvas 2D API for authentic retro voxel look
import * as THREE from 'three';
import { BlockType } from './voxelTypes';

type FaceName = 'top' | 'bottom' | 'side';

const textureCache: Map<string, THREE.CanvasTexture> = new Map();
const materialCache: Map<string, THREE.Material | THREE.Material[]> = new Map();

function createPixelCanvas(drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx);
  return canvas;
}

function noise(x: number, y: number, seed: number = 1): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function tint(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

// Draw patterns for individual block faces
function generateCanvasForBlock(type: BlockType, face: FaceName): HTMLCanvasElement {
  return createPixelCanvas(ctx => {
    switch (type) {
      case 'grass': {
        if (face === 'top') {
          // Lush emerald grass with soft clover variations
          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              const n = noise(x, y, 42);
              let c = '#4ade80';
              if (n < 0.25) c = '#22c55e';
              else if (n > 0.75) c = '#86efac';
              ctx.fillStyle = c;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        } else if (face === 'bottom') {
          // Rich soil
          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              const n = noise(x, y, 101);
              let c = '#78350f';
              if (n < 0.3) c = '#451a03';
              else if (n > 0.7) c = '#92400e';
              ctx.fillStyle = c;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        } else {
          // Grass side with natural hanging fringe
          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              const n = noise(x, y, 88);
              const fringeDepth = 3 + Math.floor(noise(x, 0, 7) * 3);
              if (y < fringeDepth) {
                ctx.fillStyle = n > 0.5 ? '#4ade80' : '#22c55e';
              } else {
                let c = '#78350f';
                if (n < 0.3) c = '#451a03';
                else if (n > 0.7) c = '#92400e';
                ctx.fillStyle = c;
              }
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'dirt': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const n = noise(x, y, 13);
            let c = '#78350f';
            if (n < 0.25) c = '#451a03';
            else if (n > 0.75) c = '#92400e';
            ctx.fillStyle = c;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'stone': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const n = noise(x, y, 99);
            let c = '#64748b';
            if (n < 0.2) c = '#475569';
            else if (n > 0.8) c = '#94a3b8';
            ctx.fillStyle = c;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'cobble': {
        // Interlocking cobblestones with dark mortar lines
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const isBorder = x % 4 === 0 || y % 4 === 0;
            if (!isBorder) {
              const n = noise(x, y, 55);
              ctx.fillStyle = n > 0.5 ? '#64748b' : '#475569';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'wood_oak': {
        if (face === 'top' || face === 'bottom') {
          // Tree rings
          ctx.fillStyle = '#b45309';
          ctx.fillRect(0, 0, 16, 16);
          ctx.fillStyle = '#78350f';
          ctx.strokeRect(2.5, 2.5, 11, 11);
          ctx.strokeRect(5.5, 5.5, 5, 5);
          ctx.fillRect(7, 7, 2, 2);
        } else {
          // Vertical bark ridges
          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              const isGroove = x % 4 === 0;
              const n = noise(x, y, 31);
              if (isGroove) {
                ctx.fillStyle = '#451a03';
              } else {
                ctx.fillStyle = n > 0.5 ? '#92400e' : '#78350f';
              }
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'leaves_oak': {
        // Semi-transparent leaf clusters
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const n = noise(x, y, 77);
            if (n < 0.2) {
              ctx.fillStyle = '#14532d';
              ctx.fillRect(x, y, 1, 1);
            } else if (n > 0.75) {
              ctx.fillStyle = '#4ade80';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'wood_pine': {
        if (face === 'top' || face === 'bottom') {
          ctx.fillStyle = '#92400e';
          ctx.fillRect(0, 0, 16, 16);
          ctx.fillStyle = '#451a03';
          ctx.strokeRect(3.5, 3.5, 9, 9);
        } else {
          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              const n = noise(x, y, 22);
              ctx.fillStyle = n > 0.5 ? '#5c2d10' : '#451a03';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'leaves_pine': {
        ctx.fillStyle = '#14532d';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const n = noise(x, y, 64);
            if (n > 0.6) {
              ctx.fillStyle = '#166534';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'wood_blossom': {
        // Purplish mystical trunk
        ctx.fillStyle = '#581c87';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const n = noise(x, y, 81);
            if (n > 0.55) {
              ctx.fillStyle = '#7e22ce';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'leaves_blossom': {
        // Radiant pink cherry blossom canopy
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const n = noise(x, y, 38);
            if (n < 0.25) {
              ctx.fillStyle = '#db2777';
              ctx.fillRect(x, y, 1, 1);
            } else if (n > 0.7) {
              ctx.fillStyle = '#fbcfe8';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'water': {
        // Clear azure with subtle shimmer
        ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(2, 3, 5, 1);
        ctx.fillRect(9, 10, 4, 1);
        break;
      }

      case 'sand': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const n = noise(x, y, 19);
            ctx.fillStyle = n > 0.5 ? '#fef08a' : '#fde047';
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'glass': {
        // Clear pane with faint reflection streaks
        ctx.fillStyle = 'rgba(186, 230, 253, 0.3)';
        ctx.fillRect(0, 0, 16, 16);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, 15, 15);
        ctx.beginPath();
        ctx.moveTo(3, 13);
        ctx.lineTo(13, 3);
        ctx.stroke();
        break;
      }

      case 'bookshelf': {
        // Oak frame with colorful bound books
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(1, 1, 14, 6);
        ctx.fillRect(1, 9, 14, 6);
        // Books top shelf
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = colors[i % colors.length];
          ctx.fillRect(2 + i * 2.5, 2, 2, 5);
        }
        // Books bottom shelf
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = colors[(i + 2) % colors.length];
          ctx.fillRect(2 + i * 2.5, 10, 2, 5);
        }
        break;
      }

      case 'crystal_lapis': {
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, 16, 16);
        // Glowing cyan gems embedded
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(3, 4, 3, 3);
        ctx.fillRect(9, 8, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, 5, 1, 1);
        ctx.fillRect(10, 9, 1, 1);
        break;
      }

      case 'crystal_amethyst': {
        ctx.fillStyle = '#4a044e';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(4, 3, 4, 4);
        ctx.fillRect(9, 9, 3, 3);
        ctx.fillStyle = '#f5d0fe';
        ctx.fillRect(5, 4, 1, 1);
        ctx.fillRect(10, 10, 1, 1);
        break;
      }

      case 'crystal_amber': {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(3, 5, 4, 4);
        ctx.fillRect(10, 3, 3, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(4, 6, 1, 1);
        ctx.fillRect(11, 4, 1, 1);
        break;
      }

      case 'planks': {
        // Wood planks with nail rivets
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, 4, 16, 1);
        ctx.fillRect(0, 9, 16, 1);
        ctx.fillRect(0, 14, 16, 1);
        ctx.fillRect(8, 0, 1, 4);
        ctx.fillRect(4, 5, 1, 4);
        ctx.fillRect(12, 10, 1, 4);
        break;
      }

      case 'brick': {
        // Clay brick masonry
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#fecaca';
        ctx.fillRect(0, 5, 16, 1);
        ctx.fillRect(0, 11, 16, 1);
        ctx.fillRect(6, 0, 1, 5);
        ctx.fillRect(13, 6, 1, 5);
        ctx.fillRect(5, 12, 1, 4);
        break;
      }

      case 'lantern': {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(3, 3, 10, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(5, 5, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(7, 7, 2, 2);
        break;
      }

      case 'torch': {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(7, 6, 2, 9);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(6, 2, 4, 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(7, 3, 2, 2);
        break;
      }

      case 'flower_red': {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0, 0, 16, 16);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(7, 8, 2, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(5, 4, 6, 5);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(7, 6, 2, 2);
        break;
      }

      case 'flower_blue': {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0, 0, 16, 16);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(7, 8, 2, 8);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(5, 4, 6, 5);
        ctx.fillStyle = '#e0e7ff';
        ctx.fillRect(7, 6, 2, 2);
        break;
      }

      case 'iron_block': {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, 16, 16);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(0.5, 0.5, 15, 15);
        break;
      }

      case 'gold_block': {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(0, 0, 16, 16);
        ctx.strokeStyle = '#fef08a';
        ctx.strokeRect(0.5, 0.5, 15, 15);
        break;
      }

      case 'glowstone': {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const n = noise(x, y, 33);
            if (n > 0.6) {
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      default: {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 0, 16, 16);
        break;
      }
    }
  });
}

export function getBlockTexture(type: BlockType, face: FaceName = 'side'): THREE.CanvasTexture {
  const key = `${type}_${face}`;
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = generateCanvasForBlock(type, face);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  textureCache.set(key, texture);
  return texture;
}

// Builds Three.js material for a block type.
// Multi-faced blocks (e.g. grass, wood) return an array of 6 materials [px, nx, py, ny, pz, nz]
export function getBlockMaterial(type: BlockType): THREE.Material | THREE.Material[] {
  if (materialCache.has(type)) {
    return materialCache.get(type)!;
  }

  if (type === 'grass') {
    const top = getBlockTexture('grass', 'top');
    const bottom = getBlockTexture('grass', 'bottom');
    const side = getBlockTexture('grass', 'side');

    const sideMat = new THREE.MeshLambertMaterial({ map: side });
    const topMat = new THREE.MeshLambertMaterial({ map: top });
    const botMat = new THREE.MeshLambertMaterial({ map: bottom });

    // Order: px, nx, py, ny, pz, nz
    const mats = [sideMat, sideMat, topMat, botMat, sideMat, sideMat];
    materialCache.set(type, mats);
    return mats;
  }

  if (type === 'wood_oak' || type === 'wood_pine' || type === 'wood_blossom') {
    const top = getBlockTexture(type, 'top');
    const side = getBlockTexture(type, 'side');

    const sideMat = new THREE.MeshLambertMaterial({ map: side });
    const endMat = new THREE.MeshLambertMaterial({ map: top });

    const mats = [sideMat, sideMat, endMat, endMat, sideMat, sideMat];
    materialCache.set(type, mats);
    return mats;
  }

  if (type === 'water') {
    const tex = getBlockTexture('water', 'top');
    const mat = new THREE.MeshLambertMaterial({
      map: tex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });
    materialCache.set(type, mat);
    return mat;
  }

  if (type === 'glass') {
    const tex = getBlockTexture('glass', 'side');
    const mat = new THREE.MeshLambertMaterial({
      map: tex,
      transparent: true,
      opacity: 0.45
    });
    materialCache.set(type, mat);
    return mat;
  }

  if (type.startsWith('crystal_') || type === 'glowstone' || type === 'lantern' || type === 'torch') {
    const tex = getBlockTexture(type, 'side');
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(type === 'crystal_lapis' ? 0x0284c7 : type === 'crystal_amethyst' ? 0x9333ea : 0xf59e0b),
      emissiveIntensity: 0.45,
      roughness: 0.3
    });
    materialCache.set(type, mat);
    return mat;
  }

  // Standard solid block
  const tex = getBlockTexture(type, 'side');
  const mat = new THREE.MeshLambertMaterial({ map: tex });
  materialCache.set(type, mat);
  return mat;
}
