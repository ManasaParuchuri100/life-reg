// 3D Voxel Environment: Day/Night Celestial Orbit, Dynamic Lighting, Point Lights, & Particle Systems
import * as THREE from 'three';

export class VoxelEnvironment {
  private scene: THREE.Scene;
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemisphereLight: THREE.HemisphereLight;

  // Celestial bodies
  private celestialGroup: THREE.Group = new THREE.Group();
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;

  // Ambient particles (Dust motes in day, Fireflies at night)
  private ambientParticleSystem!: THREE.Points;
  private particlePositions!: Float32Array;
  private particleColors!: Float32Array;

  // Celebration fireworks
  private fireworksList: {
    points: THREE.Points;
    velocities: THREE.Vector3[];
    life: number;
    maxLife: number;
  }[] = [];

  // Voxel clouds
  private cloudsGroup: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Ambient & Hemisphere Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0xbae6fd, 0x334155, 0.5);
    this.scene.add(this.hemisphereLight);

    // 2. Directional Sunlight / Moonlight
    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.dirLight.position.set(30, 45, 25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 120;
    const d = 40;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // 3. Sun and Moon Meshes
    this.scene.add(this.celestialGroup);

    // Voxel Sun
    const sunGeo = new THREE.BoxGeometry(4, 4, 4);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(0, 50, -50);
    this.celestialGroup.add(this.sunMesh);

    // Voxel Moon
    const moonGeo = new THREE.BoxGeometry(3.2, 3.2, 3.2);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e7ff });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(0, -50, 50);
    this.celestialGroup.add(this.moonMesh);

    // 4. Point Lights at Key Landmarks
    this.setupLandmarkPointLights();

    // 5. Stylized Voxel Clouds
    this.setupVoxelClouds();

    // 6. Ambient Particle System
    this.setupAmbientParticles();
  }

  private setupLandmarkPointLights(): void {
    const lights = [
      // Knowledge Tower beacon
      { pos: new THREE.Vector3(-18, 12, -18), color: 0x38bdf8, intensity: 2.0, dist: 18 },
      // Workshop forge
      { pos: new THREE.Vector3(0, 7, -10), color: 0xf97316, intensity: 2.2, dist: 16 },
      // Lantern Village square
      { pos: new THREE.Vector3(-18, 7, 18), color: 0xfacc15, intensity: 2.2, dist: 18 },
      // Moonlit Garden fountain
      { pos: new THREE.Vector3(20, 7, -18), color: 0xc084fc, intensity: 2.2, dist: 18 },
      // Player Home porch
      { pos: new THREE.Vector3(0, 7, 10), color: 0xfde047, intensity: 1.8, dist: 14 },
      // Underground Mine entrance / cavern
      { pos: new THREE.Vector3(28, 4, 20), color: 0xc084fc, intensity: 2.5, dist: 15 }
    ];

    lights.forEach(l => {
      const pl = new THREE.PointLight(l.color, l.intensity, l.dist, 1.5);
      pl.position.copy(l.pos);
      this.scene.add(pl);
    });
  }

  private setupVoxelClouds(): void {
    this.scene.add(this.cloudsGroup);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });

    // Create 6 fluffy voxel cloud clusters
    const cloudClusters = [
      { x: -25, y: 28, z: -20, sx: 14, sz: 8 },
      { x: 10, y: 29, z: -25, sx: 16, sz: 9 },
      { x: -10, y: 27, z: 15, sx: 12, sz: 7 },
      { x: 25, y: 30, z: 10, sx: 15, sz: 8 },
      { x: -30, y: 28, z: 0, sx: 14, sz: 8 },
      { x: 5, y: 31, z: -5, sx: 18, sz: 10 }
    ];

    cloudClusters.forEach(c => {
      const geo = new THREE.BoxGeometry(c.sx, 2.5, c.sz);
      const mesh = new THREE.Mesh(geo, cloudMat);
      mesh.position.set(c.x, c.y, c.z);
      this.cloudsGroup.add(mesh);
    });
  }

  private setupAmbientParticles(): void {
    const count = 250;
    const geometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(count * 3);
    this.particleColors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      this.particlePositions[i3] = (Math.random() - 0.5) * 60;
      this.particlePositions[i3 + 1] = 2 + Math.random() * 12;
      this.particlePositions[i3 + 2] = (Math.random() - 0.5) * 60;

      // Golden pollen / yellow-green
      this.particleColors[i3] = 0.98;
      this.particleColors[i3 + 1] = 0.95;
      this.particleColors[i3 + 2] = 0.45;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    this.ambientParticleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.ambientParticleSystem);
  }

  public setTimeOfDay(time: 'day' | 'sunset' | 'night'): void {
    if (time === 'day') {
      // Golden daytime sky
      this.scene.background = new THREE.Color(0x38bdf8);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.012);

      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 1.45;
      this.dirLight.position.set(25, 45, 20);

      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.75;

      this.hemisphereLight.color.setHex(0xbae6fd);
      this.hemisphereLight.groundColor.setHex(0x22c55e);

      this.celestialGroup.rotation.x = 0;
    } else if (time === 'sunset') {
      // Warm amber sunset sky
      this.scene.background = new THREE.Color(0xf97316);
      this.scene.fog = new THREE.FogExp2(0xfdba74, 0.015);

      this.dirLight.color.setHex(0xfb923c);
      this.dirLight.intensity = 1.2;
      this.dirLight.position.set(45, 15, 25);

      this.ambientLight.color.setHex(0xfdba74);
      this.ambientLight.intensity = 0.55;

      this.hemisphereLight.color.setHex(0xfb923c);
      this.hemisphereLight.groundColor.setHex(0x78350f);

      this.celestialGroup.rotation.x = Math.PI * 0.28;
    } else {
      // Deep twilight blue starlit night
      this.scene.background = new THREE.Color(0x070b14);
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.018);

      this.dirLight.color.setHex(0x93c5fd);
      this.dirLight.intensity = 0.45;
      this.dirLight.position.set(-25, 35, -20);

      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.4;

      this.hemisphereLight.color.setHex(0x38bdf8);
      this.hemisphereLight.groundColor.setHex(0x020617);

      this.celestialGroup.rotation.x = Math.PI * 0.75;
    }
  }

  // Trigger celebration fireworks fountain at a landmark
  public triggerCelebrationAt(x: number, y: number, z: number): void {
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];

    const palette = [
      new THREE.Color(0xfacc15), // Gold
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0xf472b6), // Pink
      new THREE.Color(0x4ade80), // Emerald
      new THREE.Color(0xc084fc)  // Amethyst
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = x;
      positions[i3 + 1] = y + 1;
      positions[i3 + 2] = z;

      const c = palette[i % palette.length];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Burst upwards in all directions
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7;
      const upSpeed = 6 + Math.random() * 8;
      velocities.push(
        new THREE.Vector3(
          Math.cos(angle) * speed,
          upSpeed,
          Math.sin(angle) * speed
        )
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 1.0
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.fireworksList.push({
      points,
      velocities,
      life: 0,
      maxLife: 2.2
    });
  }

  public update(delta: number): void {
    const time = performance.now() * 0.001;

    // 1. Drift clouds across the sky
    this.cloudsGroup.children.forEach(cloud => {
      cloud.position.x += delta * 0.8;
      if (cloud.position.x > 45) {
        cloud.position.x = -45;
      }
    });

    // 2. Animate ambient particles (gentle float)
    if (this.ambientParticleSystem) {
      const posAttr = this.ambientParticleSystem.geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const count = posArray.length / 3;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        posArray[i3] += Math.sin(time + i) * 0.015;
        posArray[i3 + 1] += Math.cos(time * 0.8 + i) * 0.012;
        posArray[i3 + 2] += Math.cos(time + i) * 0.015;

        // Wrap around bounds
        if (posArray[i3 + 1] > 14) posArray[i3 + 1] = 2;
        if (posArray[i3 + 1] < 2) posArray[i3 + 1] = 14;
      }
      posAttr.needsUpdate = true;
    }

    // 3. Update active fireworks
    for (let f = this.fireworksList.length - 1; f >= 0; f--) {
      const fw = this.fireworksList[f];
      fw.life += delta;

      const posAttr = fw.points.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const progress = fw.life / fw.maxLife;

      (fw.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - progress);

      for (let i = 0; i < fw.velocities.length; i++) {
        const i3 = i * 3;
        const v = fw.velocities[i];
        arr[i3] += v.x * delta;
        arr[i3 + 1] += v.y * delta;
        arr[i3 + 2] += v.z * delta;

        // Gravity pulls celebration sparks down
        v.y -= 9.8 * delta;
      }
      posAttr.needsUpdate = true;

      if (fw.life >= fw.maxLife) {
        this.scene.remove(fw.points);
        fw.points.geometry.dispose();
        (fw.points.material as THREE.Material).dispose();
        this.fireworksList.splice(f, 1);
      }
    }
  }

  public dispose(): void {
    this.scene.remove(this.celestialGroup);
    this.scene.remove(this.cloudsGroup);
    if (this.ambientParticleSystem) {
      this.scene.remove(this.ambientParticleSystem);
      this.ambientParticleSystem.geometry.dispose();
      (this.ambientParticleSystem.material as THREE.Material).dispose();
    }
    this.fireworksList.forEach(fw => {
      this.scene.remove(fw.points);
      fw.points.geometry.dispose();
      (fw.points.material as THREE.Material).dispose();
    });
    this.fireworksList = [];
  }
}
