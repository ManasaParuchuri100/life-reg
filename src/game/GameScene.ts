// Main Phaser 3 Game Scene for Hearthbound 2D Pixel RPG
// Handles tilemap rendering, player movement, physics collisions, NPCs,
// dynamic world progression, environmental animation, and camera following.

import Phaser from 'phaser';
import { generateGameTextures } from './textures';
import {
  TILE_SIZE,
  WORLD_COLS,
  WORLD_ROWS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  BUILDINGS,
  BuildingDef,
  NPCS,
  NpcDef,
  generateWorldProps
} from './worldData';
import { PlayerStats, LocationId } from '../types';
import { getLocationTier } from '../utils/storage';
import { sounds } from '../utils/sound';

export interface GameSceneBridge {
  onNearBuilding: (building: BuildingDef | null) => void;
  onNearNpc: (npc: NpcDef | null) => void;
  onEnterBuilding: (locId: LocationId) => void;
}

export class GameScene extends Phaser.Scene {
  public isReady: boolean = false;
  private stats: PlayerStats | null = null;
  private timeOfDay: 'day' | 'sunset' | 'night' = 'day';
  private bridge: GameSceneBridge | null = null;

  // Game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  private petSprite: Phaser.GameObjects.Sprite | null = null;
  private hatSprite: Phaser.GameObjects.Sprite | null = null;
  private weaponSprite: Phaser.GameObjects.Sprite | null = null;
  private buildingSprites: Map<LocationId, Phaser.GameObjects.Sprite> = new Map();
  private buildingTiers: Map<LocationId, number> = new Map();
  private npcSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private npcBubbleMap: Map<string, Phaser.GameObjects.Container> = new Map();
  private obstacleGroup!: Phaser.Physics.Arcade.StaticGroup;
  private lanternGlows: Phaser.GameObjects.Sprite[] = [];
  private dayNightOverlay!: Phaser.GameObjects.Rectangle;

  // Controls & Movement
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };
  private joystickVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private clickTarget: { x: number; y: number } | null = null;
  private isMoving = false;
  private currentFacing: 'down' | 'up' | 'left' | 'right' = 'down';
  private lastFootstepTime = 0;

  // Proximity tracking
  private closestBuilding: BuildingDef | null = null;
  private closestNpc: NpcDef | null = null;

  // Water animation
  private waterTiles: Phaser.GameObjects.Sprite[] = [];
  private waterFrame = 1;

  constructor() {
    super({ key: 'GameScene' });
  }

  public init(data: { stats: PlayerStats; timeOfDay: 'day' | 'sunset' | 'night'; bridge: GameSceneBridge }) {
    this.stats = data.stats;
    this.timeOfDay = data.timeOfDay || 'day';
    this.bridge = data.bridge;
  }

  public preload() {
    // Generate all authentic pixel textures procedurally into Phaser TextureManager
    generateGameTextures(this);
  }

  public create() {
    // 1. Setup World & Physics
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.obstacleGroup = this.physics.add.staticGroup();

    // 2. Build World Terrain Grid
    this.createWorldTerrain();

    // 3. Place World Props & Nature (trees, rocks, lanterns)
    this.createWorldProps();

    // 4. Place Interactive Buildings with Dynamic Tiers
    this.createBuildings();

    // 5. Create Player Animations & Player Sprite
    this.createPlayer();

    // 6. Create NPCs with Patrol AI
    this.createNpcs();

    // 7. Setup Physics Colliders
    this.physics.add.collider(this.player, this.obstacleGroup);

    // 8. Setup Camera & Controls
    this.setupCamera();
    this.setupInput();

    // 9. Day / Night & Environmental FX
    this.setupAtmosphere();

    // 10. Water ripple animation timer
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.waterFrame = (this.waterFrame % 3) + 1;
        const tex = `tile_water_${this.waterFrame}`;
        this.waterTiles.forEach(tile => {
          if (tile.active) tile.setTexture(tex);
        });
      }
    });

    // 11. NPC gentle patrol loop
    this.time.addEvent({
      delay: 2400,
      loop: true,
      callback: () => {
        this.updateNpcPatrols();
      }
    });

    // Mark scene as fully initialized and ready for external bridge calls
    this.isReady = true;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.isReady = false;
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.isReady = false;
    });
  }

  // =========================================================================
  // TERRAIN & PATHS
  // =========================================================================
  private createWorldTerrain(): void {
    // River column definition: River flows from North to South around cols 28 to 31
    // Bridges cross at rows 13-16 (North Bridge) and rows 26-29 (South Bridge)
    const riverCols = new Set([28, 29, 30, 31]);
    const bridgeRowsNorth = new Set([13, 14, 15, 16]);
    const bridgeRowsSouth = new Set([26, 27, 28, 29]);

    for (let r = 0; r < WORLD_ROWS; r++) {
      for (let c = 0; c < WORLD_COLS; c++) {
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;

        const isRiver = riverCols.has(c);
        const isBridgeNorth = isRiver && bridgeRowsNorth.has(r);
        const isBridgeSouth = isRiver && bridgeRowsSouth.has(r);
        const isBridge = isBridgeNorth || isBridgeSouth;

        if (isBridge) {
          // Wooden Bridge across river: depth 1, strictly walkable without any collision body
          this.add.image(x, y, 'tile_bridge_h').setDepth(1);
          continue;
        }

        if (isRiver) {
          // Water tile visual sprite
          const waterTile = this.add.sprite(x, y, 'tile_water_1').setDepth(0);
          this.waterTiles.push(waterTile);

          // Water is solid obstacle (cannot walk on water).
          // Use precise Arcade static zones with exact boundaries.
          // Keep water collision bodies strictly inside the river channel so they NEVER
          // bleed onto bridge entrances, bridge spans, or opposite banks.
          let obsW = TILE_SIZE;
          let obsH = TILE_SIZE;
          let obsX = x;
          let obsY = y;

          // If adjacent to bridges, trim vertically so bridge remains 100% clear
          if (r === 12 || r === 25) {
            obsH = 26;
            obsY = y - 3;
          } else if (r === 17 || r === 30) {
            obsH = 26;
            obsY = y + 3;
          }

          // If on outer river columns, trim horizontally so riverbanks remain 100% clear
          if (c === 28) {
            obsW = 28;
            obsX = x + 2;
          } else if (c === 31) {
            obsW = 28;
            obsX = x - 2;
          }

          const zone = this.add.zone(obsX, obsY, obsW, obsH);
          this.physics.add.existing(zone, true);
          this.obstacleGroup.add(zone);
          continue;
        }

        // Check if on road/path network
        const isPath = this.isPathTile(c, r);
        if (isPath) {
          this.add.image(x, y, 'tile_cobble').setDepth(0);
          continue;
        }

        // Grassy meadows with flowers and clover variations
        const rand = (c * 17 + r * 31) % 100;
        let grassKey = 'tile_grass_1';
        if (rand < 15) grassKey = 'tile_grass_flowers';
        else if (rand < 40) grassKey = 'tile_grass_2';

        this.add.image(x, y, grassKey).setDepth(0);
      }
    }

    // World perimeter border collisions (clean, non-intrusive boundary zones)
    // Top border
    const topZone = this.add.zone(WORLD_WIDTH / 2, 8, WORLD_WIDTH, 16);
    this.physics.add.existing(topZone, true);
    this.obstacleGroup.add(topZone);

    // Bottom border
    const botZone = this.add.zone(WORLD_WIDTH / 2, WORLD_HEIGHT - 8, WORLD_WIDTH, 16);
    this.physics.add.existing(botZone, true);
    this.obstacleGroup.add(botZone);

    // Left border
    const leftZone = this.add.zone(8, WORLD_HEIGHT / 2, 16, WORLD_HEIGHT);
    this.physics.add.existing(leftZone, true);
    this.obstacleGroup.add(leftZone);

    // Right border
    const rightZone = this.add.zone(WORLD_WIDTH - 8, WORLD_HEIGHT / 2, 16, WORLD_HEIGHT);
    this.physics.add.existing(rightZone, true);
    this.obstacleGroup.add(rightZone);
  }

  private isPathTile(c: number, r: number): boolean {
    // 1. Upper East-West Highway (connecting Knowledge Tower -> North Bridge -> Moonlit Garden)
    if (r >= 13 && r <= 16 && c >= 6 && c <= 43) return true;

    // 2. Lower East-West Highway (connecting Lantern Village -> South Bridge -> Training Grounds)
    if (r >= 26 && r <= 29 && c >= 6 && c <= 43) return true;

    // 3. Central North-South Highway (connecting Creative Workshop -> Crossroads -> Player Home)
    if (c >= 23 && c <= 25 && r >= 12 && r <= 33) return true;

    // 4. Eastern North-South Highway (connecting the entire east side of the river from North Bridge to South Bridge!)
    if (c >= 33 && c <= 35 && r >= 12 && r <= 30) return true;

    // 5. Western North-South Highway (connecting Knowledge Tower to Lantern Village)
    if (c >= 8 && c <= 10 && r >= 10 && r <= 28) return true;

    // Direct access spurs into buildings:
    // Knowledge Tower
    if (c >= 8 && c <= 10 && r >= 8 && r <= 14) return true;
    // Lantern Village
    if (c >= 7 && c <= 9 && r >= 24 && r <= 29) return true;
    // Creative Workshop
    if (c >= 23 && c <= 25 && r >= 14 && r <= 18) return true;
    // Player Home
    if (c >= 23 && c <= 25 && r >= 28 && r <= 33) return true;
    // Training Grounds
    if (c >= 38 && c <= 40 && r >= 24 && r <= 29) return true;
    // Moonlit Garden
    if (c >= 38 && c <= 40 && r >= 9 && r <= 14) return true;

    return false;
  }

  // =========================================================================
  // PROPS & OBSTACLES
  // =========================================================================
  private createWorldProps(): void {
    const props = generateWorldProps();
    props.forEach(p => {
      const sprite = this.add.sprite(p.x, p.y, p.key);
      sprite.setDepth(p.y);

      if (p.isSolid) {
        const zone = this.add.zone(p.x, p.y + (p.solidOffsetY || 0), p.solidW || 24, p.solidH || 16);
        this.physics.add.existing(zone, true);
        this.obstacleGroup.add(zone);
      }

      // If lantern, add soft glow light
      if (p.key === 'prop_lantern') {
        const glow = this.add.sprite(p.x, p.y - 12, 'fx_lantern_glow');
        glow.setDepth(p.y + 2);
        glow.setAlpha(this.timeOfDay === 'night' ? 0.7 : this.timeOfDay === 'sunset' ? 0.45 : 0.15);
        this.lanternGlows.push(glow);
      }
    });
  }

  // =========================================================================
  // BUILDINGS & DYNAMIC WORLD PROGRESSION
  // =========================================================================
  private createBuildings(): void {
    BUILDINGS.forEach(b => {
      const tier = this.getBuildingTier(b.id);
      this.buildingTiers.set(b.id, tier);

      const texKey = this.getBuildingTextureKey(b.id, tier);
      const sprite = this.add.sprite(b.x, b.y, texKey);
      sprite.setDepth(b.y);
      this.buildingSprites.set(b.id, sprite);

      // Add solid collision body covering the upper roof/back wall of the building,
      // leaving doorway and entrance porch completely open and walkable
      const bodyW = b.width - 24;
      const bodyH = Math.min(36, b.height / 3);
      const zone = this.add.zone(b.x, b.y - 18, bodyW, bodyH);
      this.physics.add.existing(zone, true);
      this.obstacleGroup.add(zone);

      // Make building clickable directly as well!
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => {
        sounds.playClick();
        this.walkToAndEnter(b);
      });
    });
  }

  private getBuildingTier(locId: LocationId): number {
    if (!this.stats) return 1;
    switch (locId) {
      case 'knowledge_tower':
        return getLocationTier(this.stats.attributes.intellect).tier;
      case 'mine_training':
        return getLocationTier(this.stats.attributes.strength).tier;
      case 'workshop':
        return getLocationTier(this.stats.attributes.creativity).tier;
      case 'village':
        return getLocationTier(this.stats.attributes.social).tier;
      case 'sanctuary':
        return getLocationTier(this.stats.attributes.wellness).tier;
      case 'player_home':
        return Math.min(4, Math.max(1, Math.floor(this.stats.level / 2)));
      default:
        return 1;
    }
  }

  private getBuildingTextureKey(locId: LocationId, tier: number): string {
    switch (locId) {
      case 'knowledge_tower':
        return `building_knowledge_t${tier}`;
      case 'mine_training':
        return `building_training_t${tier}`;
      case 'workshop':
        return `building_workshop_t${tier}`;
      case 'village':
        return `building_village_t${tier}`;
      case 'sanctuary':
        return `building_sanctuary_t${tier}`;
      case 'player_home':
        return `building_home_t${tier}`;
    }
  }

  // =========================================================================
  // PLAYER CREATION & ANIMATIONS
  // =========================================================================
  private createPlayer(): void {
    // Register sprite sheet animations if not already created
    if (!this.anims.exists('walk_down')) {
      this.anims.create({
        key: 'walk_down',
        frames: [
          { key: 'player_sheet', frame: 0 },
          { key: 'player_sheet', frame: 1 },
          { key: 'player_sheet', frame: 2 },
          { key: 'player_sheet', frame: 3 }
        ],
        frameRate: 9,
        repeat: -1
      });

      this.anims.create({
        key: 'walk_up',
        frames: [
          { key: 'player_sheet', frame: 6 },
          { key: 'player_sheet', frame: 7 },
          { key: 'player_sheet', frame: 8 },
          { key: 'player_sheet', frame: 9 }
        ],
        frameRate: 9,
        repeat: -1
      });

      this.anims.create({
        key: 'walk_left',
        frames: [
          { key: 'player_sheet', frame: 12 },
          { key: 'player_sheet', frame: 13 },
          { key: 'player_sheet', frame: 14 },
          { key: 'player_sheet', frame: 15 }
        ],
        frameRate: 9,
        repeat: -1
      });

      this.anims.create({
        key: 'walk_right',
        frames: [
          { key: 'player_sheet', frame: 18 },
          { key: 'player_sheet', frame: 19 },
          { key: 'player_sheet', frame: 20 },
          { key: 'player_sheet', frame: 21 }
        ],
        frameRate: 9,
        repeat: -1
      });

      this.anims.create({
        key: 'idle_down',
        frames: [{ key: 'player_sheet', frame: 4 }],
        frameRate: 1,
        repeat: -1
      });

      this.anims.create({
        key: 'celebrate',
        frames: [{ key: 'player_sheet', frame: 5 }],
        frameRate: 2,
        repeat: -1
      });
    }

    // Spawn player in front of Player Home
    const spawnX = 768;
    const spawnY = 1010;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player_sheet', 4);
    this.player.setCollideWorldBounds(true);
    // Custom tight hit box at the player's feet for accurate top-down navigation
    this.player.body.setSize(16, 10);
    this.player.body.setOffset(8, 22);
    this.player.setDepth(spawnY);

    // Equipment overlays
    this.hatSprite = this.add.sprite(spawnX, spawnY - 14, 'equip_hat').setDepth(spawnY + 1);
    this.weaponSprite = this.add.sprite(spawnX - 10, spawnY - 4, 'equip_sword').setDepth(spawnY + 1);

    // Pet follower
    this.petSprite = this.add.sprite(spawnX + 22, spawnY + 6, 'pet_cat').setDepth(spawnY - 1);

    this.updateEquipmentAppearance();
  }

  private updateEquipmentAppearance(): void {
    if (!this.stats) return;

    // Check equipped headgear
    if (this.stats.equipped.headgear === 'item_crown') {
      this.hatSprite?.setTexture('equip_crown').setVisible(true);
    } else if (this.stats.equipped.headgear === 'wanderer_cap') {
      this.hatSprite?.setTexture('equip_hat').setVisible(true);
    } else {
      this.hatSprite?.setVisible(false);
    }

    // Check equipped weapon
    if (this.stats.equipped.weapon === 'item_wand') {
      this.weaponSprite?.setTexture('equip_wand').setVisible(true);
    } else if (this.stats.equipped.weapon === 'wood_sword') {
      this.weaponSprite?.setTexture('equip_sword').setVisible(true);
    } else {
      this.weaponSprite?.setVisible(false);
    }

    // Pet companion
    if (this.stats.equipped.pet) {
      this.petSprite?.setVisible(true);
    } else {
      this.petSprite?.setVisible(false);
    }
  }

  // =========================================================================
  // NPCS WITH PATROL & DIALOGUE
  // =========================================================================
  private createNpcs(): void {
    NPCS.forEach(n => {
      const npc = this.physics.add.sprite(n.homeX, n.homeY, n.spriteKey);
      npc.setCollideWorldBounds(true);
      npc.body.setSize(16, 12);
      npc.body.setOffset(8, 20);
      npc.setDepth(n.homeY);
      npc.setImmovable(true);

      // Talk speech bubble prompt
      const bubble = this.add.container(n.homeX, n.homeY - 26);
      const icon = this.add.sprite(0, 0, 'fx_prompt_e');
      bubble.add(icon);
      bubble.setDepth(n.homeY + 10);
      bubble.setVisible(false);

      this.npcSprites.set(n.id, npc);
      this.npcBubbleMap.set(n.id, bubble);

      // Clicking NPC triggers talk
      npc.setInteractive({ useHandCursor: true });
      npc.on('pointerdown', () => {
        sounds.playClick();
        this.talkToNpc(n);
      });
    });
  }

  private updateNpcPatrols(): void {
    NPCS.forEach(n => {
      const npc = this.npcSprites.get(n.id);
      if (!npc || !npc.active) return;

      // Only patrol if player is not talking to them
      if (this.closestNpc && this.closestNpc.id === n.id) {
        npc.setVelocity(0, 0);
        return;
      }

      // Random wander within radius
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * n.patrolRadius;
      const targetX = n.homeX + Math.cos(angle) * dist;
      const targetY = n.homeY + Math.sin(angle) * dist;

      this.physics.moveTo(npc, targetX, targetY, 20);

      // Stop after 1.2 seconds
      this.time.delayedCall(1200, () => {
        if (npc.active) npc.setVelocity(0, 0);
      });
    });
  }

  // =========================================================================
  // CAMERA & INPUT SETUP
  // =========================================================================
  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Responsive zoom: 1.35x for desktop, crisp pixel scaling
    const isMobile = window.innerWidth < 768;
    this.cameras.main.setZoom(isMobile ? 1.15 : 1.35);
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        E: Phaser.Input.Keyboard.KeyCodes.E,
        SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
      }) as unknown as {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        E: Phaser.Input.Keyboard.Key;
        SPACE: Phaser.Input.Keyboard.Key;
      };

      // Interact with [E] or [SPACE]
      this.wasdKeys.E.on('down', () => this.handleInteract());
      this.wasdKeys.SPACE.on('down', () => this.handleInteract());
    }

    // Click on ground to move
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // If clicking interactive object, pointerdown already handled
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.clickTarget = { x: worldPoint.x, y: worldPoint.y };
    });
  }

  private setupAtmosphere(): void {
    // Day / Sunset / Night color tint overlay
    this.dayNightOverlay = this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x000000);
    this.dayNightOverlay.setOrigin(0, 0);
    this.dayNightOverlay.setDepth(2000);
    this.updateTimeOfDayTint();

    // Floating particles (Pollen / Leaves in day, Fireflies at night)
    const particleKey = this.timeOfDay === 'night' ? 'fx_firefly' : 'fx_star';
    const particles = this.add.particles(0, 0, particleKey, {
      x: { min: 0, max: WORLD_WIDTH },
      y: { min: 0, max: WORLD_HEIGHT },
      speedX: { min: -15, max: 15 },
      speedY: { min: -10, max: 10 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 3500,
      frequency: 250,
      quantity: 1
    });
    particles.setDepth(1500);
  }

  public setTimeOfDay(time: 'day' | 'sunset' | 'night'): void {
    this.timeOfDay = time;
    if (!this.isReady) return;
    this.updateTimeOfDayTint();
  }

  private updateTimeOfDayTint(): void {
    if (!this.dayNightOverlay) return;

    if (this.timeOfDay === 'day') {
      this.dayNightOverlay.setAlpha(0);
      this.lanternGlows.forEach(g => g.setAlpha(0.1));
    } else if (this.timeOfDay === 'sunset') {
      this.dayNightOverlay.setFillStyle(0xfb923c); // warm amber
      this.dayNightOverlay.setAlpha(0.18);
      this.lanternGlows.forEach(g => g.setAlpha(0.45));
    } else {
      // Night: deep twilight blue
      this.dayNightOverlay.setFillStyle(0x0f172a);
      this.dayNightOverlay.setAlpha(0.45);
      this.lanternGlows.forEach(g => g.setAlpha(0.75));
    }
  }

  // =========================================================================
  // UPDATE LOOP (60 FPS)
  // =========================================================================
  public update(_time: number, _delta: number) {
    if (!this.player || !this.player.body) return;

    // Movement velocity calculation
    let vx = 0;
    let vy = 0;
    const speed = 140;

    // 1. Keyboard WASD / Arrows
    const left = this.cursors?.left?.isDown || this.wasdKeys?.A?.isDown;
    const right = this.cursors?.right?.isDown || this.wasdKeys?.D?.isDown;
    const up = this.cursors?.up?.isDown || this.wasdKeys?.W?.isDown;
    const down = this.cursors?.down?.isDown || this.wasdKeys?.S?.isDown;

    if (left || right || up || down) {
      this.clickTarget = null;
    }

    if (left) vx -= speed;
    if (right) vx += speed;
    if (up) vy -= speed;
    if (down) vy += speed;

    // 2. Mobile Virtual Joystick takes priority if active
    if (this.joystickVelocity.x !== 0 || this.joystickVelocity.y !== 0) {
      vx = this.joystickVelocity.x * speed;
      vy = this.joystickVelocity.y * speed;
      this.clickTarget = null; // cancel click to move
    }

    // 3. Click / Tap to move
    if (this.clickTarget && vx === 0 && vy === 0) {
      const dx = this.clickTarget.x - this.player.x;
      const dy = this.clickTarget.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 8) {
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
      } else {
        this.clickTarget = null;
      }
    }

    // Normalize diagonal velocity
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2;
      vx *= factor;
      vy *= factor;
    }

    this.player.setVelocity(vx, vy);

    // Update animations & facing
    this.isMoving = vx !== 0 || vy !== 0;

    if (this.isMoving) {
      if (Math.abs(vx) > Math.abs(vy)) {
        if (vx < 0) {
          this.currentFacing = 'left';
          this.player.anims.play('walk_left', true);
        } else {
          this.currentFacing = 'right';
          this.player.anims.play('walk_right', true);
        }
      } else {
        if (vy < 0) {
          this.currentFacing = 'up';
          this.player.anims.play('walk_up', true);
        } else {
          this.currentFacing = 'down';
          this.player.anims.play('walk_down', true);
        }
      }

      // Footstep sound timed with walking
      const now = performance.now();
      if (now - this.lastFootstepTime > 260) {
        sounds.playFootstep();
        this.lastFootstepTime = now;
      }
    } else {
      this.player.anims.play('idle_down', true);
    }

    // Depth sort player based on y position (2D perspective)
    this.player.setDepth(this.player.y);

    // Update Equipment overlays position to follow player
    if (this.hatSprite && this.hatSprite.visible) {
      this.hatSprite.setPosition(this.player.x, this.player.y - 12);
      this.hatSprite.setDepth(this.player.y + 1);
    }
    if (this.weaponSprite && this.weaponSprite.visible) {
      const wx = this.currentFacing === 'left' ? this.player.x - 10 : this.player.x + 10;
      this.weaponSprite.setPosition(wx, this.player.y - 2);
      this.weaponSprite.setDepth(this.player.y + 1);
    }

    // Pet companion follows player smoothly
    if (this.petSprite && this.petSprite.visible) {
      const targetPetX = this.player.x + (this.currentFacing === 'left' ? 22 : -22);
      const targetPetY = this.player.y + 6;
      this.petSprite.x += (targetPetX - this.petSprite.x) * 0.08;
      this.petSprite.y += (targetPetY - this.petSprite.y) * 0.08;
      this.petSprite.setDepth(this.petSprite.y);
    }

    // Proximity checks to buildings and NPCs
    this.checkProximities();
  }

  // =========================================================================
  // PROXIMITY & INTERACTION
  // =========================================================================
  private checkProximities(): void {
    // 1. Buildings
    let nearBuilding: BuildingDef | null = null;
    let closestDist = 999;

    BUILDINGS.forEach(b => {
      const dx = b.x + b.doorOffsetX - this.player.x;
      const dy = b.y + b.doorOffsetY - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.interactRadius && dist < closestDist) {
        closestDist = dist;
        nearBuilding = b;
      }
    });

    if (this.closestBuilding !== nearBuilding) {
      this.closestBuilding = nearBuilding;
      this.bridge?.onNearBuilding(nearBuilding);
    }

    // 2. NPCs
    let nearNpc: NpcDef | null = null;
    let closestNpcDist = 999;

    NPCS.forEach(n => {
      const npcSprite = this.npcSprites.get(n.id);
      const bubble = this.npcBubbleMap.get(n.id);
      if (!npcSprite) return;

      const dx = npcSprite.x - this.player.x;
      const dy = npcSprite.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 65 && dist < closestNpcDist) {
        closestNpcDist = dist;
        nearNpc = n;
        bubble?.setVisible(true);
        // Face the player
        if (dx < 0) npcSprite.setFlipX(false);
        else npcSprite.setFlipX(true);
      } else {
        bubble?.setVisible(false);
      }
    });

    if (this.closestNpc !== nearNpc) {
      this.closestNpc = nearNpc;
      this.bridge?.onNearNpc(nearNpc);
    }
  }

  private handleInteract(): void {
    if (this.closestBuilding) {
      this.enterBuilding(this.closestBuilding.id);
    } else if (this.closestNpc) {
      this.talkToNpc(this.closestNpc);
    }
  }

  private enterBuilding(locId: LocationId): void {
    sounds.playLocationEnter();
    this.bridge?.onEnterBuilding(locId);
  }

  private talkToNpc(npc: NpcDef): void {
    sounds.playClick();
    // Open the respective quest hub for this NPC
    this.bridge?.onEnterBuilding(npc.locationId);
  }

  private walkToAndEnter(b: BuildingDef): void {
    const targetX = b.x + b.doorOffsetX;
    const targetY = b.y + b.doorOffsetY + 8;
    this.clickTarget = { x: targetX, y: targetY };

    // When near, enter building
    this.time.addEvent({
      delay: 100,
      repeat: 20,
      callback: () => {
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          this.enterBuilding(b.id);
        }
      }
    });
  }

  // =========================================================================
  // PUBLIC EXTERNAL BRIDGE METHODS (CALLED FROM REACT)
  // =========================================================================

  public setJoystickVelocity(vx: number, vy: number): void {
    this.joystickVelocity = { x: vx, y: vy };
  }

  public interactCurrent(): void {
    this.handleInteract();
  }

  public teleportToBuilding(locId: LocationId): void {
    const building = BUILDINGS.find(b => b.id === locId);
    if (!building || !this.player) return;
    this.player.setPosition(building.x + building.doorOffsetX, building.y + building.doorOffsetY + 24);
    this.player.setVelocity(0, 0);
    this.clickTarget = null;
    this.cameras.main.pan(this.player.x, this.player.y, 350, 'Power2');
  }

  public updateStats(newStats: PlayerStats): void {
    this.stats = newStats;
    if (!this.isReady) return;
    this.updateEquipmentAppearance();

    // Check if any building progressed to a new tier!
    BUILDINGS.forEach(b => {
      const newTier = this.getBuildingTier(b.id);
      const oldTier = this.buildingTiers.get(b.id) || 1;
      if (newTier !== oldTier) {
        this.buildingTiers.set(b.id, newTier);
        const sprite = this.buildingSprites.get(b.id);
        if (sprite) {
          const newKey = this.getBuildingTextureKey(b.id, newTier);
          sprite.setTexture(newKey);
          // Sparkle explosion for world evolution!
          this.spawnCelebrationAt(b.x, b.y);
          sounds.playWorldEvolve();
        }
      }
    });
  }

  public triggerQuestReward(xp: number, gold: number, attr: string, attrVal: number): void {
    if (!this.isReady || !this.player) return;

    // Player celebrates
    this.player.anims.play('celebrate', true);
    this.time.delayedCall(1200, () => {
      if (this.player.active) this.player.anims.play('idle_down', true);
    });

    // Spawn floating numbers over player
    this.spawnFloatingText(this.player.x, this.player.y - 20, `+${xp} XP`, '#facc15');
    this.time.delayedCall(200, () => {
      this.spawnFloatingText(this.player.x, this.player.y - 30, `+${gold} GOLD`, '#eab308');
    });
    this.time.delayedCall(400, () => {
      this.spawnFloatingText(this.player.x, this.player.y - 40, `+${attrVal} ${attr.toUpperCase()}`, '#38bdf8');
    });

    // Particle burst
    this.spawnCelebrationAt(this.player.x, this.player.y - 10);
  }

  public triggerLevelUp(): void {
    if (!this.player) return;

    // Freeze player in golden glory
    this.player.anims.play('celebrate', true);
    this.cameras.main.shake(350, 0.006);

    // Fireworks particles
    this.spawnCelebrationAt(this.player.x, this.player.y - 20, 40);

    this.spawnFloatingText(this.player.x, this.player.y - 30, `⭐ LEVEL UP! ⭐`, '#facc15', 18);

    this.time.delayedCall(1800, () => {
      if (this.player.active) this.player.anims.play('idle_down', true);
    });
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string, size = 12): void {
    const txt = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: `${size}px`,
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5).setDepth(2100);

    this.tweens.add({
      targets: txt,
      y: y - 35,
      alpha: 0,
      duration: 1600,
      ease: 'Power1',
      onComplete: () => txt.destroy()
    });
  }

  private spawnCelebrationAt(x: number, y: number, count = 20): void {
    const emitter = this.add.particles(x, y, 'fx_star', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      quantity: count
    });
    emitter.setDepth(2050);
    this.time.delayedCall(1100, () => emitter.destroy());
  }
}
