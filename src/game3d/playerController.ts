// 3D Voxel Player Controller: Physics, First/Third Person Camera,
// Raycasting Voxel Targeting, Mining with Sound & Particles, and Block Placement
import * as THREE from 'three';
import { VoxelWorld, VOXEL_BUILDINGS } from './voxelWorld';
import { BlockType, BLOCK_DEFS, VoxelCoord, VoxelBuildingDef } from './voxelTypes';
import { soundSystem } from '../utils/sound';

export type CameraMode = 'first_person' | 'third_person';

export interface RaycastHit {
  target: VoxelCoord;
  adjacent: VoxelCoord;
  type: BlockType;
}

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  private world: VoxelWorld;
  private domElement: HTMLElement;

  // Camera & View
  public cameraMode: CameraMode = 'third_person';
  public yaw: number = 0;
  public pitch: number = 0;

  // Player Body & Physics
  public position: THREE.Vector3 = new THREE.Vector3(0, 7, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public onGround: boolean = false;
  public isSprinting: boolean = false;
  private readonly playerRadius = 0.32;
  private readonly playerHeight = 1.75;
  private readonly eyeHeight = 1.6;

  // 3D Player Mesh (shown in 3rd person)
  public playerMeshGroup: THREE.Group = new THREE.Group();
  private headMesh!: THREE.Mesh;
  private torsoMesh!: THREE.Mesh;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;

  // Targeted Voxel Box Highlight
  private selectionBox: THREE.LineSegments;
  public currentTarget: RaycastHit | null = null;

  // Mining State
  public isMining: boolean = false;
  public miningProgress: number = 0; // 0 to 1
  private lastDigSoundTime: number = 0;
  private onBlockMinedCallback?: (type: BlockType, name: string, xp: number) => void;
  public onBlockMined?: (type: BlockType, pos: VoxelCoord) => void;
  public onBlockPlaced?: (type: BlockType, pos: VoxelCoord) => void;
  public onNearBuilding?: (b: VoxelBuildingDef | null) => void;
  public onNearNpc?: (n: any | null) => void;

  // Controls input
  private keys: Record<string, boolean> = {};
  private touchMoveVector: THREE.Vector2 = new THREE.Vector2(0, 0);
  public isPointerLocked: boolean = false;

  // Debris Particles
  private debrisGroup: THREE.Group = new THREE.Group();
  private debrisParticles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];

  constructor(
    camera: THREE.PerspectiveCamera,
    world: VoxelWorld,
    domElement: HTMLElement,
    onBlockMined?: (type: BlockType, name: string, xp: number) => void
  ) {
    this.camera = camera;
    this.world = world;
    this.domElement = domElement;
    this.onBlockMinedCallback = onBlockMined;

    // Build Player Mesh
    this.createPlayerMesh();
    this.world.scene.add(this.playerMeshGroup);
    this.world.scene.add(this.debrisGroup);

    // Build Selection Wireframe
    const boxGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const wireframeGeo = new THREE.WireframeGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
      depthTest: true
    });
    this.selectionBox = new THREE.LineSegments(wireframeGeo, lineMat);
    this.selectionBox.visible = false;
    this.world.scene.add(this.selectionBox);

    // Bind Event Listeners
    this.setupInputs();
  }

  private createPlayerMesh(): void {
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xfed7aa });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x2563eb }); // Azure adventurer tunic
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Slate pants
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x78350f });

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.y = 1.45;
    this.headMesh.castShadow = true;
    this.playerMeshGroup.add(this.headMesh);

    // Hair cap
    const hairGeo = new THREE.BoxGeometry(0.44, 0.16, 0.44);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.16;
    this.headMesh.add(hair);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    leftEye.position.set(-0.1, 0, 0.21);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    rightEye.position.set(0.1, 0, 0.21);
    this.headMesh.add(leftEye, rightEye);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.6, 0.28);
    this.torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
    this.torsoMesh.position.y = 0.95;
    this.torsoMesh.castShadow = true;
    this.playerMeshGroup.add(this.torsoMesh);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.38, 0.9, 0);
    this.leftArm.castShadow = true;
    this.playerMeshGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.38, 0.9, 0);
    this.rightArm.castShadow = true;
    this.playerMeshGroup.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.22);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.14, 0.3, 0);
    this.leftLeg.castShadow = true;
    this.playerMeshGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.14, 0.3, 0);
    this.rightLeg.castShadow = true;
    this.playerMeshGroup.add(this.rightLeg);
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyV') {
        this.toggleCameraMode();
      }
      if (e.code === 'Space' && this.onGround) {
        this.jump();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse look with pointer lock
    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.domElement.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.addLookDelta(e.movementX * 0.0024, e.movementY * 0.0024);
      }
    });

    // Mouse down / up for mining & placing
    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // Left click: Mine
        this.isMining = true;
      } else if (e.button === 2) {
        // Right click: Place block (handled by parent or hotbar)
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMining = false;
        this.miningProgress = 0;
      }
    });

    this.domElement.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // prevent browser right-click context menu
    });
  }

  public addLookDelta(dx: number, dy: number): void {
    this.yaw -= dx;
    this.pitch -= dy;
    // Clamp pitch between -85 and 85 degrees
    const maxPitch = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public setTouchMoveVector(x: number, z: number): void {
    this.touchMoveVector.set(x, z);
  }

  public toggleCameraMode(): void {
    this.cameraMode = this.cameraMode === 'third_person' ? 'first_person' : 'third_person';
    soundSystem.playClick();
  }

  public jump(): void {
    if (this.onGround) {
      this.velocity.y = 8.5;
      this.onGround = false;
      soundSystem.playJump();
    }
  }

  // =========================================================================
  // VOXEL COLLISION & STEP CLIMBING
  // =========================================================================
  private checkCollisionAt(pos: THREE.Vector3): boolean {
    const minX = Math.floor(pos.x - this.playerRadius);
    const maxX = Math.floor(pos.x + this.playerRadius);
    const minZ = Math.floor(pos.z - this.playerRadius);
    const maxZ = Math.floor(pos.z + this.playerRadius);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + this.playerHeight);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let y = minY; y <= maxY; y++) {
          if (this.world.isSolid(x, y, z)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public update(delta: number): void {
    const clampedDelta = Math.min(delta, 0.08);

    // 1. Gather Directional Movement from Keys or Touch
    let moveForward = 0;
    let moveRight = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

    // Add touch joystick input
    if (this.touchMoveVector.lengthSq() > 0.01) {
      moveRight += this.touchMoveVector.x;
      moveForward -= this.touchMoveVector.y;
    }

    this.isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const speed = (this.isSprinting ? 6.5 : 4.2);

    // Compute forward & right vectors on XZ ground plane
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const desiredMove = new THREE.Vector3();
    if (moveForward !== 0 || moveRight !== 0) {
      desiredMove.addScaledVector(forward, moveForward);
      desiredMove.addScaledVector(right, moveRight);
      desiredMove.normalize().multiplyScalar(speed);

      // Play footstep sound periodically
      if (this.onGround) {
        soundSystem.playFootstep();
      }
    }

    // Horizontal acceleration & friction
    this.velocity.x += (desiredMove.x - this.velocity.x) * (this.onGround ? 14 : 4) * clampedDelta;
    this.velocity.z += (desiredMove.z - this.velocity.z) * (this.onGround ? 14 : 4) * clampedDelta;

    // Gravity
    this.velocity.y -= 25.0 * clampedDelta;
    // Terminal velocity
    if (this.velocity.y < -30) this.velocity.y = -30;

    // 2. Physical Axis-by-Axis Movement & Step Climbing
    // Move X
    const newPosX = this.position.clone();
    newPosX.x += this.velocity.x * clampedDelta;
    if (!this.checkCollisionAt(newPosX)) {
      this.position.x = newPosX.x;
    } else {
      // Try step climb up 1 block
      const stepUpPos = newPosX.clone();
      stepUpPos.y += 1.05;
      if (this.onGround && !this.checkCollisionAt(stepUpPos)) {
        this.position.x = newPosX.x;
        this.position.y += 1.05;
      } else {
        this.velocity.x = 0;
      }
    }

    // Move Z
    const newPosZ = this.position.clone();
    newPosZ.z += this.velocity.z * clampedDelta;
    if (!this.checkCollisionAt(newPosZ)) {
      this.position.z = newPosZ.z;
    } else {
      // Try step climb up 1 block
      const stepUpPos = newPosZ.clone();
      stepUpPos.y += 1.05;
      if (this.onGround && !this.checkCollisionAt(stepUpPos)) {
        this.position.z = newPosZ.z;
        this.position.y += 1.05;
      } else {
        this.velocity.z = 0;
      }
    }

    // Move Y (Vertical)
    const newPosY = this.position.clone();
    newPosY.y += this.velocity.y * clampedDelta;
    if (!this.checkCollisionAt(newPosY)) {
      this.position.y = newPosY.y;
      this.onGround = false;
    } else {
      if (this.velocity.y < 0) {
        // Landing on floor
        if (!this.onGround) {
          soundSystem.playLand();
        }
        this.onGround = true;
        // Snap to grid floor
        this.position.y = Math.floor(newPosY.y) + 1;
      } else {
        // Hit ceiling
      }
      this.velocity.y = 0;
    }

    // World boundary safety floor
    if (this.position.y < 1) {
      this.position.set(0, 7, 0);
      this.velocity.set(0, 0, 0);
    }

    // 3. Update 3D Player Mesh (Position, Rotation & Walking Animation)
    this.playerMeshGroup.position.copy(this.position);
    this.playerMeshGroup.rotation.y = this.yaw;

    // Toggle player mesh visibility based on camera mode
    this.playerMeshGroup.visible = this.cameraMode === 'third_person';

    // Limb animations while walking
    const isMoving = this.velocity.lengthSq() > 0.1 && this.onGround;
    const walkCycle = performance.now() * 0.012 * (this.isSprinting ? 1.4 : 1.0);

    if (isMoving) {
      this.leftArm.rotation.x = Math.sin(walkCycle) * 0.6;
      this.rightArm.rotation.x = -Math.sin(walkCycle) * 0.6;
      this.leftLeg.rotation.x = -Math.sin(walkCycle) * 0.6;
      this.rightLeg.rotation.x = Math.sin(walkCycle) * 0.6;
    } else {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }

    // Mining arm animation
    if (this.isMining) {
      this.rightArm.rotation.x = -Math.PI * 0.4 + Math.sin(performance.now() * 0.025) * 0.6;
    }

    // 4. Update Camera Position and Orbit
    if (this.cameraMode === 'first_person') {
      this.camera.position.set(
        this.position.x,
        this.position.y + this.eyeHeight,
        this.position.z
      );
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    } else {
      // Third-person over the shoulder
      const orbitDistance = 4.2;
      const targetLookAt = new THREE.Vector3(
        this.position.x,
        this.position.y + this.eyeHeight - 0.2,
        this.position.z
      );

      const cx = targetLookAt.x + Math.sin(this.yaw) * Math.cos(this.pitch) * orbitDistance;
      const cy = targetLookAt.y - Math.sin(this.pitch) * orbitDistance;
      const cz = targetLookAt.z + Math.cos(this.yaw) * Math.cos(this.pitch) * orbitDistance;

      this.camera.position.set(cx, Math.max(this.position.y + 0.3, cy), cz);
      this.camera.lookAt(targetLookAt);
    }

    // 5. Raycast Voxel Target & Mining Update
    this.updateVoxelRaycast();
    this.updateMining(clampedDelta);
    this.updateDebrisParticles(clampedDelta);
  }

  // =========================================================================
  // VOXEL RAYCASTING (DDA Voxel Traversal)
  // =========================================================================
  private updateVoxelRaycast(): void {
    const rayOrigin = this.camera.position.clone();
    const rayDir = new THREE.Vector3();
    this.camera.getWorldDirection(rayDir);

    const maxReach = 5.8;
    let step = 0.08;
    let hit: RaycastHit | null = null;
    let lastAirCoord: VoxelCoord = {
      x: Math.floor(rayOrigin.x),
      y: Math.floor(rayOrigin.y),
      z: Math.floor(rayOrigin.z)
    };

    const currentPos = rayOrigin.clone();

    for (let dist = 0; dist < maxReach; dist += step) {
      currentPos.addScaledVector(rayDir, step);
      const bx = Math.floor(currentPos.x);
      const by = Math.floor(currentPos.y);
      const bz = Math.floor(currentPos.z);

      const blockType = this.world.getBlock(bx, by, bz);

      if (blockType !== 'air' && blockType !== 'water') {
        hit = {
          target: { x: bx, y: by, z: bz },
          adjacent: { ...lastAirCoord },
          type: blockType
        };
        break;
      } else {
        lastAirCoord = { x: bx, y: by, z: bz };
      }
    }

    this.currentTarget = hit;

    if (hit) {
      this.selectionBox.position.set(hit.target.x + 0.5, hit.target.y + 0.5, hit.target.z + 0.5);
      this.selectionBox.visible = true;
    } else {
      this.selectionBox.visible = false;
      this.isMining = false;
      this.miningProgress = 0;
    }
  }

  // =========================================================================
  // MINING LOGIC & BLOCK BREAKING
  // =========================================================================
  private updateMining(delta: number): void {
    if (!this.isMining || !this.currentTarget) {
      this.miningProgress = 0;
      return;
    }

    const def = BLOCK_DEFS[this.currentTarget.type];
    if (!def || def.hardness >= 999) {
      this.miningProgress = 0;
      return;
    }

    // Accumulate mining progress
    const mineRate = 1.0 / Math.max(0.1, def.hardness);
    this.miningProgress += mineRate * delta;

    // Play punch / dig sound at regular interval
    const now = performance.now();
    if (now - this.lastDigSoundTime > 160) {
      this.lastDigSoundTime = now;
      soundSystem.playDig();
      // Spawn small hit sparks/debris
      this.spawnDebrisAt(this.currentTarget.target, def.color, 2);
    }

    // Block completely broken!
    if (this.miningProgress >= 1.0) {
      const { x, y, z } = this.currentTarget.target;
      const minedType = this.currentTarget.type;

      // Break block in world
      this.world.updateBlock(x, y, z, 'air');

      // Play break sound
      soundSystem.playBlockBreak();

      // Big debris burst
      this.spawnDebrisAt({ x, y, z }, def.color, 12);

      // Trigger reward callback
      if (this.onBlockMinedCallback) {
        this.onBlockMinedCallback(minedType, def.name, def.dropXp);
      }

      // Reset
      this.miningProgress = 0;
      this.isMining = false;
    }
  }

  public placeBlock(type: BlockType): boolean {
    if (!this.currentTarget) return false;

    const { x, y, z } = this.currentTarget.adjacent;

    // Check if target placement coordinates overlap player bounding box
    const minX = this.position.x - this.playerRadius;
    const maxX = this.position.x + this.playerRadius;
    const minZ = this.position.z - this.playerRadius;
    const maxZ = this.position.z + this.playerRadius;
    const minY = this.position.y;
    const maxY = this.position.y + this.playerHeight;

    if (x + 1 > minX && x < maxX && z + 1 > minZ && z < maxZ && y + 1 > minY && y < maxY) {
      return false; // cannot place inside player
    }

    // Place block in world
    this.world.updateBlock(x, y, z, type);

    // Audio & subtle dust
    soundSystem.playBlockPlace();
    const def = BLOCK_DEFS[type];
    this.spawnDebrisAt({ x, y, z }, def?.color || '#ffffff', 4);

    return true;
  }

  // =========================================================================
  // DEBRIS PARTICLES
  // =========================================================================
  private spawnDebrisAt(pos: VoxelCoord, colorHex: string, count: number): void {
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + 0.5 + (Math.random() - 0.5) * 0.5,
        pos.y + 0.5 + (Math.random() - 0.5) * 0.5,
        pos.z + 0.5 + (Math.random() - 0.5) * 0.5
      );
      this.debrisGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 3
      );

      this.debrisParticles.push({ mesh, vel, life: 0 });
    }
  }

  private updateDebrisParticles(delta: number): void {
    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const p = this.debrisParticles[i];
      p.life += delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      p.vel.y -= 12 * delta; // particle gravity

      if (p.life >= 0.6) {
        this.debrisGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.debrisParticles.splice(i, 1);
      }
    }
  }

  // Check proximity to landmarks
  public getClosestLandmark(maxDist: number = 7.0): VoxelBuildingDef | null {
    let closest: VoxelBuildingDef | null = null;
    let minDist = maxDist;

    for (const b of VOXEL_BUILDINGS) {
      const dist = this.position.distanceTo(
        new THREE.Vector3(b.entrance.x, b.entrance.y, b.entrance.z)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = b;
      }
    }

    return closest;
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }

  public getPosition(): THREE.Vector3 {
    return this.position;
  }

  public getMiningProgress(): number {
    return this.miningProgress;
  }

  public teleportTo(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
  }

  public dispose(): void {
    this.world.scene.remove(this.playerMeshGroup);
    this.world.scene.remove(this.selectionBox);
    this.world.scene.remove(this.debrisGroup);
    this.debrisParticles.forEach(p => {
      this.debrisGroup.remove(p.mesh);
      p.mesh.geometry.dispose();
    });
    this.debrisParticles = [];
  }
}
