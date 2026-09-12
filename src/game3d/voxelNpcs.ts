// 3D Voxel NPC System with Animated Block Characters, Proximity Detection, & Dialogue
import * as THREE from 'three';
import { VoxelNpcDef } from './voxelTypes';
import { LocationId } from '../types';

export const VOXEL_NPCS: VoxelNpcDef[] = [
  {
    id: 'npc_sage',
    name: 'Sage Eldrin',
    role: 'Grand Scholar',
    locationId: 'knowledge_tower',
    colorScheme: {
      robe: '#1e3a8a', // deep sapphire blue
      trim: '#38bdf8', // sky cyan
      hair: '#e2e8f0', // silver scholar hair
      skin: '#fed7aa',
      accessory: '#fbbf24' // gold tome trim
    },
    pos: { x: -18, y: 6, z: -11 },
    patrolRadius: 2.5,
    dialogue: 'Greetings, seeker of truth. Wisdom grows through consistent daily learning.',
    questHint: 'Ready to study for 2 hours or read today?'
  },
  {
    id: 'npc_elder',
    name: 'Elder Lin',
    role: 'Village Warden',
    locationId: 'village',
    colorScheme: {
      robe: '#15803d', // forest emerald green
      trim: '#facc15', // lantern gold
      hair: '#cbd5e1',
      skin: '#fbcfe8',
      accessory: '#ea580c'
    },
    pos: { x: -18, y: 5, z: 15 },
    patrolRadius: 3.0,
    dialogue: 'Welcome to Lantern Village! Friendship and community warm the soul.',
    questHint: 'Catch up with a friend or do a good deed today!'
  },
  {
    id: 'npc_artisan',
    name: 'Artisan Maya',
    role: 'Master Maker',
    locationId: 'workshop',
    colorScheme: {
      robe: '#9a3412', // warm rust / leather
      trim: '#fb923c', // copper
      hair: '#451a03', // dark chestnut
      skin: '#fed7aa',
      accessory: '#cbd5e1'
    },
    pos: { x: 0, y: 5, z: -6 },
    patrolRadius: 2.5,
    dialogue: 'Every blank canvas is an open door. Channel your imagination!',
    questHint: 'Work on your passion project or journal your ideas.'
  },
  {
    id: 'npc_healer',
    name: 'Caretaker Lyra',
    role: 'Garden Keeper',
    locationId: 'sanctuary',
    colorScheme: {
      robe: '#831843', // deep rose
      trim: '#f472b6', // blossom pink
      hair: '#a855f7', // violet
      skin: '#fed7aa',
      accessory: '#38bdf8'
    },
    pos: { x: 20, y: 5, z: -13 },
    patrolRadius: 2.5,
    dialogue: 'Breathe deeply. True strength begins with mindful stillness and hydration.',
    questHint: 'Complete a 15-minute meditation or hit your water goal.'
  },
  {
    id: 'npc_trainer',
    name: 'Trainer Jax',
    role: 'Iron Vanguard',
    locationId: 'mine_training',
    colorScheme: {
      robe: '#991b1b', // crimson warrior tunic
      trim: '#ef4444', // flame red
      hair: '#1e293b', // obsidian black
      skin: '#fde047',
      accessory: '#64748b'
    },
    pos: { x: 20, y: 5, z: 14 },
    patrolRadius: 3.0,
    dialogue: 'Sweat now, conquer tomorrow! Physical endurance is your shield.',
    questHint: 'Hit the 30-min heavy lift or run 5 kilometers!'
  }
];

export interface NpcInstance {
  def: VoxelNpcDef;
  group: THREE.Group;
  head: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  nametagSprite: THREE.Sprite;
  interactPromptSprite: THREE.Sprite;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  isNearPlayer: boolean;
}

export class VoxelNpcManager {
  private scene: THREE.Scene;
  private npcs: NpcInstance[] = [];
  private onTalkCallback: (npc: VoxelNpcDef) => void;

  constructor(scene: THREE.Scene, onTalk: (npc: VoxelNpcDef) => void) {
    this.scene = scene;
    this.onTalkCallback = onTalk;
    this.initAllNpcs();
  }

  private initAllNpcs(): void {
    VOXEL_NPCS.forEach(def => {
      const instance = this.createNpcMesh(def);
      this.npcs.push(instance);
      this.scene.add(instance.group);
    });
  }

  private createNpcMesh(def: VoxelNpcDef): NpcInstance {
    const group = new THREE.Group();
    group.position.set(def.pos.x + 0.5, def.pos.y, def.pos.z + 0.5);

    // Shared materials with crisp colors
    const robeMat = new THREE.MeshLambertMaterial({ color: def.colorScheme.robe });
    const trimMat = new THREE.MeshLambertMaterial({ color: def.colorScheme.trim });
    const skinMat = new THREE.MeshLambertMaterial({ color: def.colorScheme.skin });
    const hairMat = new THREE.MeshLambertMaterial({ color: def.colorScheme.hair });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.6, 0.25);
    const torso = new THREE.Mesh(torsoGeo, robeMat);
    torso.position.y = 0.9;
    torso.castShadow = true;
    group.add(torso);

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.4;
    head.castShadow = true;
    group.add(head);

    // Hair / Hat top
    const hairGeo = new THREE.BoxGeometry(0.44, 0.16, 0.44);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.16;
    head.add(hair);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    leftEye.position.set(-0.1, 0, 0.21);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    rightEye.position.set(0.1, 0, 0.21);
    head.add(leftEye, rightEye);

    // 3. Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    const leftArm = new THREE.Mesh(armGeo, trimMat);
    leftArm.position.set(-0.38, 0.85, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, trimMat);
    rightArm.position.set(0.38, 0.85, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // 4. Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const leftLeg = new THREE.Mesh(legGeo, robeMat);
    leftLeg.position.set(-0.14, 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, robeMat);
    rightLeg.position.set(0.14, 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // 5. Billboard Nametag
    const nametagSprite = this.createNametagSprite(def.name, def.role, def.colorScheme.trim);
    nametagSprite.position.set(0, 2.0, 0);
    group.add(nametagSprite);

    // 6. Proximity Talk Prompt Billboard
    const interactPromptSprite = this.createInteractPromptSprite();
    interactPromptSprite.position.set(0, 2.45, 0);
    interactPromptSprite.visible = false;
    group.add(interactPromptSprite);

    return {
      def,
      group,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      nametagSprite,
      interactPromptSprite,
      currentPos: new THREE.Vector3(def.pos.x + 0.5, def.pos.y, def.pos.z + 0.5),
      targetPos: new THREE.Vector3(def.pos.x + 0.5, def.pos.y, def.pos.z + 0.5),
      isNearPlayer: false
    };
  }

  private createNametagSprite(name: string, role: string, color: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Rounded background pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 48, 12);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Name text
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(name, 128, 30);

    // Role text
    ctx.font = '13px sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(role, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 0.4, 1);
    return sprite;
  }

  private createInteractPromptSprite(): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(4, 4, 152, 40, 10);
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#1e1b4b';
    ctx.textAlign = 'center';
    ctx.fillText('[E] Talk', 80, 28);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.1, 0.33, 1);
    return sprite;
  }

  public update(delta: number, playerPos: THREE.Vector3): VoxelNpcDef | null {
    const time = performance.now() * 0.003;
    let closestNpc: VoxelNpcDef | null = null;
    let closestDist = 4.5;

    this.npcs.forEach(npc => {
      // 1. Distance check to player
      const dist = npc.group.position.distanceTo(playerPos);
      const isNear = dist <= 4.0;
      npc.isNearPlayer = isNear;
      npc.interactPromptSprite.visible = isNear;

      if (isNear && dist < closestDist) {
        closestDist = dist;
        closestNpc = npc.def;
      }

      // 2. Head look at player when close
      if (isNear) {
        npc.group.lookAt(playerPos.x, npc.group.position.y, playerPos.z);
        // Subtle floating prompt bob
        npc.interactPromptSprite.position.y = 2.45 + Math.sin(time * 3) * 0.06;
      }

      // 3. Idle breathing & gentle limbs oscillation
      const bob = Math.sin(time + npc.def.pos.x) * 0.03;
      npc.head.position.y = 1.4 + bob;
      npc.leftArm.rotation.x = Math.sin(time * 1.5 + npc.def.pos.z) * 0.1;
      npc.rightArm.rotation.x = -Math.sin(time * 1.5 + npc.def.pos.z) * 0.1;
    });

    return closestNpc;
  }

  public getClosestNpc(playerPos: THREE.Vector3, maxDist: number = 4.0): VoxelNpcDef | null {
    let closest: VoxelNpcDef | null = null;
    let minDist = maxDist;

    for (const npc of this.npcs) {
      const dist = npc.group.position.distanceTo(playerPos);
      if (dist < minDist) {
        minDist = dist;
        closest = npc.def;
      }
    }

    return closest;
  }

  public dispose(): void {
    this.npcs.forEach(npc => {
      this.scene.remove(npc.group);
    });
    this.npcs = [];
  }
}
