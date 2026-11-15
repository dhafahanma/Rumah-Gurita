import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  detectFloor,
  distance3D,
  isInSafeZone,
  resolveGroundElevation,
  resolveHorizontalCollision,
} from './collision';
import { CHARACTERS, INITIAL_RUMORS, STORY_BEATS } from './data';
import { HorrorAudioEngine } from './audioEngine';
import {
  BILLBOARD_POS,
  buildLevelGeometry,
  CARPORT_VEHICLES,
  CART_PLACEMENTS,
  COMPOUND_GATE_Z,
  COURTYARD_POOL_POS,
  createInitialDoors,
  createInitialGhosts,
  createInitialInteractables,
  FLOOR_HEIGHT,
  FURNITURE_SPECS,
  HOUSE_FRONT_Z,
  LAMP_POSITIONS,
  MOSQUE_POS,
  NEIGHBORHOOD_HOUSES,
  PLAYER_SPAWN,
  PLAYER_SPAWN_YAW,
  POS_RONDA_POS,
  SAFE_ZONES,
  STAIR_ZONES,
  TREE_PLACEMENTS,
  WARUNG_POS,
} from './levelData';
import {
  createBillboardWindah,
  createCourtyardSwimmingPool,
  createDoorAssembly,
  createGhostModel,
  createHumanoidNPC,
  createKujangShrine,
  createMaterialLibrary,
  createMosque,
  createNeighborhoodHouseRoofAndFacade,
  createOctopusStatue,
  createParkedVehicle,
  createPlaque666,
  createPosRonda,
  createPropFurniture,
  createRadioTower,
  createRooftopSculptures,
  createRumahGuritaFacadeDetails,
  createRumahGuritaInteriorDetails,
  createStreetCart,
  createStreetLamp,
  createStreetTree,
  createWarungCeuTitin,
  type GhostRig,
  type HumanoidRig,
  type MaterialLibrary,
} from './proceduralModels';
import {
  BAG_COLOR_OPTIONS,
  DEFAULT_COSMETICS,
  type CoopActionEvent,
  type GhostSyncItem,
  type PlayerCosmetics,
  type RoomDifficulty,
  type RoomWorldState,
  type SquadSyncPayload,
  type WorldActionBroadcast,
} from '../shared/lobbyProtocol';
import {
  computeCompanionFollowTarget,
  computeCurrentObjective,
  computeGhostWeakeningFactor,
  countBrokenSegel,
  debunkRumor,
  evaluateEnding,
  getDoorClosedCollider,
  stepDualBatteries,
  stepGhostAI,
  tryInteractDoor,
} from './rules';
import type {
  AABB,
  CharacterId,
  DoorData,
  GameHUDState,
  GamePhase,
  GhostData,
  GraphicsQuality,
  InteractableItem,
  JumpscareEvent,
  PerspectiveMode,
  RumorEntry,
  RunSummary,
  Vec3,
} from './types';

// Pre-allocated scratch math objects (zero GC per frame)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

export interface WorldCallbacks {
  onHudUpdate: (hud: GameHUDState) => void;
  onToast: (message: string, tone?: 'info' | 'warn' | 'fact') => void;
  onOpenNpcDialog: (npcId: string) => void;
  onOpenRadioPuzzle: () => void;
  onRumorsChanged: (rumors: RumorEntry[]) => void;
  onJumpscare: (event: JumpscareEvent) => void;
  onGameOver: (summary: RunSummary) => void;
  onToggleJournal: () => void;
  onPauseRequest: () => void;
  onCoopAction?: (action: CoopActionEvent) => void;
}

export class HorrorWorld {
  private container: HTMLElement;
  private callbacks: WorldCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl = false;
  private mats!: MaterialLibrary;
  public audio = new HorrorAudioEngine();

  // Loop state
  private frameId = 0;
  private destroyed = false;
  private lastTime = performance.now();
  private hudEmitTimer = 0;
  private fpsCounter = 0;
  private fpsTimer = 0;
  private currentFps = 60;

  // World data & dynamic meshes
  private baseColliders: AABB[] = [];
  private activeColliders: AABB[] = [];
  private wallMeshes = new Map<string, THREE.Mesh>();
  private doors: DoorData[] = [];
  private doorRigs = new Map<
    string,
    { pivot: THREE.Group; lockPlateMat: THREE.MeshStandardMaterial }
  >();
  private interactables: InteractableItem[] = [];
  private itemMeshes = new Map<string, THREE.Object3D>();
  private ghosts: GhostData[] = [];
  private ghostRigs = new Map<string, GhostRig>();
  private npcAnimations: { id: string; rig: HumanoidRig }[] = [];
  private playerRig!: HumanoidRig;
  private kujangGroup!: THREE.Group;
  private beaconMesh!: THREE.Mesh;
  private octopusEyes: THREE.Mesh[] = [];
  private dustPoints!: THREE.Points;
  private poolWater!: THREE.Mesh;

  // Lights
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private flashlight!: THREE.SpotLight;
  private flashlightTarget = new THREE.Object3D();
  private uvLight!: THREE.SpotLight;
  private interiorBulbs: THREE.PointLight[] = [];

  // Player state
  private phase: GamePhase = 'title';
  private characterId: CharacterId = 'raka';
  private cosmetics: PlayerCosmetics = { ...DEFAULT_COSMETICS };
  private difficulty: RoomDifficulty = 'Normal';
  private isMultiplayer = false;
  private isHostAuthority = false;
  private isSpectator = false;
  private downed = false;
  private inputSuspended = false;
  private spawnSlot = 0;
  private aiCompanionCount = 0;
  private aiCompanions: {
    id: CharacterId;
    name: string;
    rig: HumanoidRig;
    pos: Vec3;
    yaw: number;
    phaseOffset: number;
  }[] = [];
  private remoteRigs = new Map<
    string,
    {
      rig: HumanoidRig;
      nameSprite: THREE.Sprite;
      beamLight: THREE.PointLight;
      charId: CharacterId;
      bagColor: string;
      accessory: string;
      nickname: string;
      targetPos: Vec3;
      targetYaw: number;
      flashlightOn: boolean;
      isCrouching: boolean;
      downed: boolean;
      micOn: boolean;
      role: 'player' | 'spectator';
    }
  >();
  private remoteGhostTargets = new Map<string, GhostSyncItem>();
  private quality: GraphicsQuality = 'medium';
  private playerPos: Vec3 = { ...PLAYER_SPAWN };
  private yaw = 0;
  private pitch = 0;
  private currentEyeHeight = 1.65;
  private headBobPhase = 0;
  private cameraRoll = 0;
  private bodyVisualYawOffset = 0;
  private perspective: PerspectiveMode = 'first-person';
  private flashlightOn = true;
  private uvMode = false;
  private isHiding = false;
  private hideOrigin: Vec3 = { ...PLAYER_SPAWN };
  private sanity = 100;
  private stamina = 100;
  private flashlightBattery = 100;
  private uvBattery = 100;
  private saltCount = 2;
  private collectedKeyIds: string[] = [];
  private collectedKeyLabels: string[] = [];
  private ghostHits = 0;
  private invulnTimer = 0;
  private cameraTrauma = 0;
  private elapsedSeconds = 0;
  private inDimensiGaib = false;
  private raniRescued = false;
  private kujangClaimed = false;
  private rumors: RumorEntry[] = INITIAL_RUMORS.map((r) => ({ ...r }));
  private talkedNpcIds = new Set<string>();
  private triggeredSecondBeat = false;
  private triggeredRooftopBeat = false;
  private facadeMaterials?: {
    facadeMat: THREE.MeshStandardMaterial;
    trimMat: THREE.MeshStandardMaterial;
    windowMat: THREE.MeshStandardMaterial;
  };

  // Input state
  private keys = new Set<string>();
  private isDraggingLook = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private pointerLockIgnoreMoves = 0;
  private lookTouchId: number | null = null;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private virtualForward = 0;
  private virtualRight = 0;
  private virtualCrouch = false;
  private virtualSprint = false;
  private resizeObserver?: ResizeObserver;

  constructor(container: HTMLElement, callbacks: WorldCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.initRendererAndScene();
    this.buildEnvironment();
    this.bindInput();
    this.startLoop();
  }

  private detectSoftwareGl(): boolean {
    try {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private initRendererAndScene(): void {
    this.isSoftwareGl = this.detectSoftwareGl();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.userSelect = 'none';
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d0c);
    this.scene.fog = new THREE.FogExp2(0x090d0c, 0.022);

    this.camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 130);

    if (!this.isSoftwareGl) {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.mats = createMaterialLibrary(maxAniso);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  private buildEnvironment(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // Warm/cool night lighting
    this.hemiLight = new THREE.HemisphereLight(
      0x556f7e,
      0x241d15,
      this.isSoftwareGl ? 0.78 : 0.58
    );
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xc2d4e8, 0.88);
    this.dirLight.position.set(18, 28, 22);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 75;
    const d = 28;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // PointLights strategis (Warung Ceu Titin, Baliho Windah, Pos Ronda/Pedagang, Masjid, & Rumah Gurita)
    const warungWarm = new THREE.PointLight(0xffbe70, 6.8, 22, 1.4);
    warungWarm.position.set(WARUNG_POS.x + 1.8, 2.75, WARUNG_POS.z + 0.4);
    this.scene.add(warungWarm);

    const billboardGlow = new THREE.PointLight(0xffe6b3, 5.8, 20, 1.35);
    billboardGlow.position.set(BILLBOARD_POS.x - 1.4, 5.2, BILLBOARD_POS.z + 2.4);
    this.scene.add(billboardGlow);

    const rondaWarm = new THREE.PointLight(0xffb45c, 4.4, 18, 1.5);
    rondaWarm.position.set(-7.0, 2.8, 32.8);
    this.scene.add(rondaWarm);

    const pecelWarm = new THREE.PointLight(0xffa952, 4.0, 16, 1.5);
    pecelWarm.position.set(5.8, 2.5, 31.8);
    this.scene.add(pecelWarm);

    const masjidGlow = new THREE.PointLight(0xbef5ce, 3.6, 18, 1.5);
    masjidGlow.position.set(MOSQUE_POS.x - 4.0, 3.2, MOSQUE_POS.z);
    this.scene.add(masjidGlow);

    const groundBulb = new THREE.PointLight(0xd99b52, 2.8, 18, 1.55);
    groundBulb.position.set(1.0, 3.2, 4.8);
    this.scene.add(groundBulb);
    this.interiorBulbs.push(groundBulb);

    const secondBulb = new THREE.PointLight(0xaab8b0, 2.2, 16, 1.6);
    secondBulb.position.set(-1.5, FLOOR_HEIGHT + 3.3, 0.5);
    this.scene.add(secondBulb);
    this.interiorBulbs.push(secondBulb);

    // Senter & Kamera UV pemain
    this.flashlight = new THREE.SpotLight(0xfff1d6, 6.8, 24, Math.PI / 5.0, 0.48, 1.35);
    this.uvLight = new THREE.SpotLight(0x8c5aff, 5.8, 19, Math.PI / 4.4, 0.5, 1.3);
    this.uvLight.visible = false;
    this.scene.add(this.flashlight, this.uvLight, this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.uvLight.target = this.flashlightTarget;

    // Geometri Rumah Gurita + Komplek Perumahan + Masjid + Jalan + Collider Solid Semua Objek
    const { visuals, colliders } = buildLevelGeometry();
    this.baseColliders = colliders;
    const tintedMats = new Map<string, THREE.MeshStandardMaterial>();

    for (const b of visuals) {
      let mat: THREE.Material = this.mats[b.mat];
      if (b.tint !== undefined) {
        const key = `${b.mat}:${b.tint}`;
        let cached = tintedMats.get(key);
        if (!cached) {
          cached = (this.mats[b.mat] as THREE.MeshStandardMaterial).clone();
          cached.color.setHex(b.tint);
          tintedMats.set(key, cached);
        }
        mat = cached;
      }
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
      mesh.position.set(b.x, b.y, b.z);
      mesh.receiveShadow = true;
      mesh.castShadow = b.y > 0.2 && b.solid !== false;
      this.scene.add(mesh);
      this.wallMeshes.set(b.id, mesh);
    }

    // Tangga visual 4.0m antar lantai (tangga rooftop berakhir di Z = -6.8 untuk ruang keluar luas)
    this.buildStairSteps(-1.65, 1.55, -2.0, -7.6, 0.0, FLOOR_HEIGHT, 16);
    this.buildStairSteps(1.85, 4.75, -2.0, -6.8, FLOOR_HEIGHT, FLOOR_HEIGHT * 2, 16);

    // Papan 666, Pagar Besi Halaman Depan, Fasad Putih Balkon Lengkung & Detail Interior Rumah Gurita
    const plaqueFront = createPlaque666(maxAniso);
    plaqueFront.position.set(-2.5, 2.75, HOUSE_FRONT_Z + 0.16);
    this.scene.add(plaqueFront);
    this.buildFrontIronFence();
    this.buildArchitecturalFacade(maxAniso);
    this.scene.add(createRumahGuritaInteriorDetails(maxAniso));

    // Halaman Dalam Pagar Rumah Gurita: Kolam Renang + Tempat Parkir (Sedan & Motor)
    const courtyardPool = createCourtyardSwimmingPool();
    courtyardPool.position.set(COURTYARD_POOL_POS.x, 0, COURTYARD_POOL_POS.z);
    this.scene.add(courtyardPool);

    for (const v of CARPORT_VEHICLES) {
      const veh = createParkedVehicle(v.kind);
      veh.position.set(v.x, 0, v.z);
      veh.rotation.y = v.rotY;
      this.scene.add(veh);
    }

    // Komplek Perumahan (Berdempetan & Terhalang Pohon)
    for (const h of NEIGHBORHOOD_HOUSES) {
      this.scene.add(createNeighborhoodHouseRoofAndFacade(h, maxAniso));
    }

    // Masjid Al-Ikhlas Komplek Sukajadi
    this.scene.add(createMosque(MOSQUE_POS.x, MOSQUE_POS.z, maxAniso));

    // Warung Ceu Titin & Baliho Windah Basudara di Jalan Sukajadi
    const warung = createWarungCeuTitin(maxAniso);
    warung.position.set(WARUNG_POS.x, 0, WARUNG_POS.z);
    this.scene.add(warung);

    const billboard = createBillboardWindah(maxAniso);
    billboard.position.set(BILLBOARD_POS.x, 0, BILLBOARD_POS.z);
    billboard.rotation.y = BILLBOARD_POS.rotY;
    this.scene.add(billboard);

    // Pos Ronda
    const posRonda = createPosRonda(maxAniso);
    posRonda.position.set(POS_RONDA_POS.x, 0, POS_RONDA_POS.z);
    this.scene.add(posRonda);

    // Gerobak Pedagang (solid collider sudah di buildLevelGeometry)
    for (const c of CART_PLACEMENTS) {
      const cart = createStreetCart(c.kind, maxAniso);
      cart.position.set(c.x, 0, c.z);
      cart.rotation.y = c.rotY;
      this.scene.add(cart);
    }

    // Lampu Jalan PJU & Pepohonan Beragam Jenis (Mangga, Pinus, Ketapang, Palem)
    this.buildStreetLamps();
    this.buildStreetTrees();

    // Furnitur interior (sinkron 1:1 dengan AABB solid) & penanda Zona Aman
    this.buildInteriorProps();
    this.buildSafeZoneMarkers();

    // Rooftop Hero Landmarks: Patung Gurita Hitam Bermata Merah (STATIS), Karang Seni, Kolam, Radio, Pusaka Kujang
    const octopus = createOctopusStatue();
    octopus.group.position.set(-6.8, FLOOR_HEIGHT * 2, 4.2);
    octopus.group.rotation.y = 0.2;
    this.octopusEyes = octopus.eyeMeshes;
    this.scene.add(octopus.group);

    const roofSculptures = createRooftopSculptures();
    roofSculptures.position.set(0, FLOOR_HEIGHT * 2, 0);
    this.scene.add(roofSculptures);

    this.poolWater = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 3.2),
      new THREE.MeshStandardMaterial({
        color: 0x162d36,
        roughness: 0.12,
        metalness: 0.55,
      })
    );
    this.poolWater.rotation.x = -Math.PI / 2;
    this.poolWater.position.set(-6.6, FLOOR_HEIGHT * 2 + 0.25, -5.0);
    this.scene.add(this.poolWater);

    const tower = createRadioTower();
    tower.group.position.set(-0.4, FLOOR_HEIGHT * 2, -6.4);
    this.beaconMesh = tower.beacon;
    this.scene.add(tower.group);

    const shrine = createKujangShrine();
    shrine.group.position.set(8.4, FLOOR_HEIGHT * 2, 0.8);
    this.kujangGroup = shrine.kujang;
    this.scene.add(shrine.group);

    // NPC Luar: Satpam Pos Ronda, Pedagang, Ceu Titin (Pemilik Warung) & 3 Anak Muda Warung Ceu Titin (masing-masing beranimasi!)
    this.npcAnimations = [];
    const registerNpc = (id: string, rig: HumanoidRig, x: number, y: number, z: number, ry: number) => {
      rig.group.position.set(x, y, z);
      rig.group.rotation.y = ry;
      this.scene.add(rig.group);
      this.npcAnimations.push({ id, rig });
    };

    registerNpc(
      'satpam',
      createHumanoidNPC({
        shirtColor: 0x1a2c4a,
        bottomColor: 0x142038,
        hasCap: true,
        capColor: 0x13223b,
        contactShadowTex: this.mats.contactShadowTex,
      }),
      -9.1,
      0,
      33.7,
      Math.PI * 0.45
    );

    registerNpc(
      'nasgor',
      createHumanoidNPC({
        shirtColor: 0x45494a,
        bottomColor: 0x2a353d,
        hasApron: true,
        prop: 'ladle',
        contactShadowTex: this.mats.contactShadowTex,
      }),
      -4.8,
      0,
      31.3,
      0.45
    );

    registerNpc(
      'pecel',
      createHumanoidNPC({
        shirtColor: 0x872f29,
        bottomColor: 0x383d3b,
        hasApron: true,
        hasCap: true,
        capColor: 0x3b3532,
        contactShadowTex: this.mats.contactShadowTex,
      }),
      4.8,
      0,
      31.3,
      -0.45
    );

    registerNpc(
      'warung_ibu',
      createHumanoidNPC({
        shirtColor: 0x99415e,
        bottomColor: 0x3d281c,
        isSkirt: true,
        hasApron: true,
        prop: 'ladle',
        contactShadowTex: this.mats.contactShadowTex,
      }),
      WARUNG_POS.x - 1.35,
      0,
      WARUNG_POS.z,
      Math.PI / 2
    );

    registerNpc(
      'warung_pemuda_1',
      createHumanoidNPC({
        shirtColor: 0x2a5070,
        bottomColor: 0x232930,
        isSeated: true,
        prop: 'coffee',
        contactShadowTex: this.mats.contactShadowTex,
      }),
      WARUNG_POS.x + 2.55,
      0,
      WARUNG_POS.z - 1.5,
      -Math.PI / 2
    );

    registerNpc(
      'warung_pemuda_2',
      createHumanoidNPC({
        shirtColor: 0x6b322e,
        bottomColor: 0x212428,
        hasCap: true,
        capColor: 0x1c1e24,
        isSeated: true,
        prop: 'phone',
        contactShadowTex: this.mats.contactShadowTex,
      }),
      WARUNG_POS.x + 2.55,
      0,
      WARUNG_POS.z + 1.2,
      -Math.PI / 2
    );

    registerNpc(
      'warung_pemuda_3',
      createHumanoidNPC({
        shirtColor: 0x2c4a38,
        bottomColor: 0x2c333a,
        contactShadowTex: this.mats.contactShadowTex,
      }),
      WARUNG_POS.x + 3.7,
      0,
      WARUNG_POS.z + 2.4,
      Math.PI * 0.35
    );

    this.rebuildPlayerMesh();
    this.buildDustParticles();
    this.resetWorldEntities();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private buildStreetLamps(): void {
    for (const l of LAMP_POSITIONS) {
      const lamp = createStreetLamp();
      lamp.position.set(l.x, 0, l.z);
      lamp.rotation.y = l.rotY;
      this.scene.add(lamp);
    }
  }

  private buildStreetTrees(): void {
    for (const t of TREE_PLACEMENTS) {
      const tree = createStreetTree(t.kind, t.scale, t.tint);
      tree.position.set(t.x, 0, t.z);
      tree.rotation.y = ((t.x * 0.7 + t.z * 0.3) % (Math.PI * 2));
      this.scene.add(tree);
    }
  }

  private buildFrontIronFence(): void {
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1a1e1d, roughness: 0.42, metalness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x454d47, roughness: 0.82 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd584 });
    const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6);
    const tipGeo = new THREE.ConeGeometry(0.042, 0.12, 4);
    const spans = [
      [-15.2, -13.2],
      [-11.4, -6.8],
      [-4.2, 15.2],
    ];
    for (const [startX, endX] of spans) {
      for (const ry of [1.22, 2.05]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(endX - startX, 0.06, 0.08), ironMat);
        rail.position.set((startX + endX) * 0.5, ry, COMPOUND_GATE_Z);
        this.scene.add(rail);
      }

      const coping = new THREE.Mesh(new THREE.BoxGeometry(endX - startX, 0.08, 0.36), capMat);
      coping.position.set((startX + endX) * 0.5, 1.12, COMPOUND_GATE_Z);
      this.scene.add(coping);

      for (let x = startX + 0.25; x <= endX - 0.25; x += 0.38) {
        const bar = new THREE.Mesh(barGeo, ironMat);
        bar.position.set(x, 1.58, COMPOUND_GATE_Z);
        const tip = new THREE.Mesh(tipGeo, ironMat);
        tip.position.set(x, 2.15, COMPOUND_GATE_Z);
        this.scene.add(bar, tip);
      }
    }

    for (const px of [-15.2, -13.2, -11.4, -6.8, -4.2, 5.5, 15.2]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 2.36, 0.46), this.mats.parapet);
      pillar.position.set(px, 1.18, COMPOUND_GATE_Z);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.14, 0.58), capMat);
      cap.position.set(px, 2.41, COMPOUND_GATE_Z);
      this.scene.add(pillar, cap);

      if (px === -6.8 || px === -4.2) {
        const cage = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), ironMat);
        cage.position.set(px, 2.64, COMPOUND_GATE_Z);
        const glow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), lampMat);
        glow.position.set(px, 2.64, COMPOUND_GATE_Z);
        this.scene.add(cage, glow);
      }
    }
  }

  private buildArchitecturalFacade(maxAniso = 4): void {
    const facade = createRumahGuritaFacadeDetails(maxAniso);
    this.facadeMaterials = {
      facadeMat: facade.facadeMat,
      trimMat: facade.trimMat,
      windowMat: facade.windowMat,
    };
    this.scene.add(facade.group);
  }

  private buildStairSteps(
    minX: number,
    maxX: number,
    startZ: number,
    endZ: number,
    startY: number,
    endY: number,
    steps: number
  ): void {
    const width = maxX - minX;
    const cx = (minX + maxX) * 0.5;
    const totalDepth = Math.abs(endZ - startZ);
    const stepDepth = totalDepth / steps;
    const stepHeight = (endY - startY) / steps;

    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const z = startZ + (endZ - startZ) * t;
      const y = startY + stepHeight * (i + 0.5);
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(width, stepHeight, stepDepth + 0.04),
        this.mats.floor_wood
      );
      step.position.set(cx, y, z);
      step.receiveShadow = true;
      this.scene.add(step);
    }
  }

  private buildInteriorProps(): void {
    for (const f of FURNITURE_SPECS) {
      const g = createPropFurniture(f.kind);
      g.position.set(f.x, f.y, f.z);
      g.rotation.y = f.ry ?? 0;
      this.scene.add(g);
    }
  }

  private buildSafeZoneMarkers(): void {
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x3b7a57,
      emissive: new THREE.Color(0x2d6b47),
      emissiveIntensity: 0.55,
      roughness: 0.6,
    });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffd699,
      emissive: new THREE.Color(0xe6a145),
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });

    const markers = [
      { x: -11.3, y: 0.02, z: 0.0 },
      { x: -11.3, y: FLOOR_HEIGHT + 0.02, z: 0.0 },
      { x: -0.05, y: FLOOR_HEIGHT + 0.02, z: -8.0 },
      { x: 3.3, y: FLOOR_HEIGHT * 2 + 0.02, z: -8.0 },
    ];
    for (const m of markers) {
      const mat = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.55, 24), ringMat);
      mat.rotation.x = -Math.PI / 2;
      mat.position.set(m.x, m.y, m.z);
      this.scene.add(mat);

      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8), lanternMat);
      lantern.position.set(m.x, m.y + 0.11, m.z);
      this.scene.add(lantern);
    }
  }

  private buildDustParticles(): void {
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = 0.4 + Math.random() * 11;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x9aa89e,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
    });
    this.dustPoints = new THREE.Points(geo, mat);
    this.scene.add(this.dustPoints);
  }

  private rebuildPlayerMesh(): void {
    if (this.playerRig) {
      this.scene.remove(this.playerRig.group);
    }
    const profile = this.getCharacter();
    const bagHex =
      BAG_COLOR_OPTIONS.find((b) => b.id === this.cosmetics.bagColor)?.colorNum ?? 0x2d312e;
    this.playerRig = createHumanoidNPC({
      shirtColor: new THREE.Color(profile.shirtColor).getHex(),
      bottomColor: new THREE.Color(profile.bottomColor).getHex(),
      isSkirt: profile.id === 'salsa' || profile.id === 'nadia',
      hasBackpack: true,
      bagColor: bagHex,
      accessory: this.cosmetics.accessory,
      contactShadowTex: this.mats.contactShadowTex,
    });
    this.playerRig.group.visible = this.perspective === 'third-person' && !this.isSpectator;
    this.scene.add(this.playerRig.group);
  }

  private rebuildAiCompanions(): void {
    for (const c of this.aiCompanions) {
      this.scene.remove(c.rig.group);
    }
    this.aiCompanions = [];
    if (this.isMultiplayer || this.aiCompanionCount <= 0) return;

    const others = CHARACTERS.filter((c) => c.id !== this.characterId).slice(0, this.aiCompanionCount);
    others.forEach((p, idx) => {
      const rig = createHumanoidNPC({
        shirtColor: new THREE.Color(p.shirtColor).getHex(),
        bottomColor: new THREE.Color(p.bottomColor).getHex(),
        isSkirt: p.id === 'salsa' || p.id === 'nadia',
        hasBackpack: true,
        bagColor: BAG_COLOR_OPTIONS[(idx + 1) % BAG_COLOR_OPTIONS.length].colorNum,
        accessory: idx === 0 ? 'walkie' : 'none',
        contactShadowTex: this.mats.contactShadowTex,
      });
      const rawTarget = computeCompanionFollowTarget(
        this.playerPos,
        this.yaw || PLAYER_SPAWN_YAW,
        idx,
        others.length
      );
      const safeStart = resolveHorizontalCollision(
        { x: rawTarget.x, y: this.playerPos.y, z: rawTarget.z },
        0.32,
        1.68,
        this.activeColliders
      );
      const startPos: Vec3 = {
        x: safeStart.x,
        y: this.playerPos.y,
        z: safeStart.z,
      };
      const initYaw = (this.yaw || PLAYER_SPAWN_YAW) + Math.PI;
      rig.group.position.set(startPos.x, startPos.y, startPos.z);
      rig.group.rotation.y = initYaw;
      this.scene.add(rig.group);
      this.aiCompanions.push({
        id: p.id,
        name: p.name,
        rig,
        pos: startPos,
        yaw: initYaw,
        phaseOffset: idx * 1.9,
      });
    });
  }

  private rebuildActiveColliders(): void {
    const next: AABB[] = [...this.baseColliders];
    for (const d of this.doors) {
      const dc = getDoorClosedCollider(d);
      if (dc) next.push(dc);
    }
    this.activeColliders = next;
  }

  private resetWorldEntities(): void {
    for (const m of this.itemMeshes.values()) this.scene.remove(m);
    this.itemMeshes.clear();
    for (const g of this.ghostRigs.values()) this.scene.remove(g.group);
    this.ghostRigs.clear();
    for (const r of this.doorRigs.values()) {
      this.scene.remove(r.pivot);
    }
    this.doorRigs.clear();

    for (const wallId of ['s_crumble_wall', 'r_crumble_wall']) {
      const m = this.wallMeshes.get(wallId);
      if (m) m.visible = true;
    }
    const { colliders } = buildLevelGeometry();
    this.baseColliders = colliders;

    // Pintu berengsel untuk semua ruangan
    this.doors = createInitialDoors();
    for (const d of this.doors) {
      const rig = createDoorAssembly(d);
      this.scene.add(rig.pivot);
      this.scene.add(rig.frameGroup);
      this.doorRigs.set(d.id, { pivot: rig.pivot, lockPlateMat: rig.lockPlateMat });
    }
    this.rebuildActiveColliders();

    // Item pickup (Bukti, Kunci, Baterai Senter, Baterai UV, Garam)
    this.interactables = createInitialInteractables();
    for (const item of this.interactables) {
      if (
        item.kind === 'evidence' ||
        item.kind === 'battery_flashlight' ||
        item.kind === 'battery_uv' ||
        item.kind === 'key' ||
        item.kind === 'salt'
      ) {
        const g = new THREE.Group();
        const color =
          item.kind === 'evidence'
            ? item.requiresUV
              ? 0x9966ff
              : 0xe6c367
            : item.kind === 'battery_flashlight'
              ? 0xf2b441
              : item.kind === 'battery_uv'
                ? 0x7b63ff
                : item.kind === 'key'
                  ? 0xe8d580
                  : 0xd9e0dc;

        if (item.kind === 'key') {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.08, 0.022, 6, 12),
            new THREE.MeshStandardMaterial({
              color,
              emissive: new THREE.Color(0xc49533),
              emissiveIntensity: 0.75,
              roughness: 0.25,
              metalness: 0.85,
            })
          );
          ring.position.y = 0.22;
          ring.rotation.x = Math.PI / 2;
          g.add(ring);
          const shaft = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.04, 0.22),
            ring.material as THREE.Material
          );
          shaft.position.set(0, 0.22, 0.14);
          g.add(shaft);
        } else {
          const orb = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.16, 0.22),
            new THREE.MeshStandardMaterial({
              color,
              emissive: new THREE.Color(color),
              emissiveIntensity: item.requiresUV ? 0.2 : 0.7,
              roughness: 0.35,
            })
          );
          orb.position.y = 0.18;
          g.add(orb);
        }

        g.position.set(item.position.x, item.position.y, item.position.z);
        this.scene.add(g);
        this.itemMeshes.set(item.id, g);
      }
    }

    // Hantu dengan Rig Artikulatif
    this.ghosts = createInitialGhosts();
    for (const g of this.ghosts) {
      const rig = createGhostModel(g.kind, this.mats.contactShadowTex);
      rig.group.position.set(g.position.x, g.position.y, g.position.z);
      this.scene.add(rig.group);
      this.ghostRigs.set(g.id, rig);
    }
  }

  public getCharacter() {
    return CHARACTERS.find((c) => c.id === this.characterId) ?? CHARACTERS[0];
  }

  public setCharacter(id: CharacterId): void {
    this.characterId = id;
    this.rebuildPlayerMesh();
  }

  public setCosmetics(cosmetics: PlayerCosmetics): void {
    this.cosmetics = { ...cosmetics };
    this.rebuildPlayerMesh();
  }

  public setSoloOptions(opts: { difficulty: RoomDifficulty; aiCompanionCount: number }): void {
    this.isMultiplayer = false;
    this.isHostAuthority = false;
    this.isSpectator = false;
    this.downed = false;
    this.inputSuspended = false;
    this.difficulty = opts.difficulty;
    this.aiCompanionCount = Math.max(0, Math.min(3, opts.aiCompanionCount));
    this.clearRemoteRigs();
  }

  public setMultiplayerConfig(opts: {
    isMultiplayer: boolean;
    isSpectator: boolean;
    isHost?: boolean;
    spawnSlot?: number;
    difficulty: RoomDifficulty;
  }): void {
    this.isMultiplayer = opts.isMultiplayer;
    this.isSpectator = opts.isSpectator;
    this.isHostAuthority = Boolean(opts.isHost);
    if (typeof opts.spawnSlot === 'number') {
      this.spawnSlot = opts.spawnSlot;
    }
    this.difficulty = opts.difficulty;
    if (opts.isMultiplayer) {
      this.aiCompanionCount = 0;
      this.rebuildAiCompanions();
    }
    this.playerRig.group.visible = this.perspective === 'third-person' && !this.isSpectator;
  }

  public enterFromCheckpoint(): void {
    this.isSpectator = false;
    this.downed = false;
    this.playerPos = { ...PLAYER_SPAWN };
    this.yaw = PLAYER_SPAWN_YAW;
    this.pitch = 0.02;
    this.sanity = 100;
    this.stamina = 100;
    this.inDimensiGaib = false;
    this.playerRig.group.visible = this.perspective === 'third-person';
    this.emitHud();
  }

  public setInputSuspended(suspended: boolean): void {
    this.inputSuspended = suspended;
    if (suspended) {
      this.keys.clear();
      this.isDraggingLook = false;
      this.lookTouchId = null;
      this.virtualForward = 0;
      this.virtualRight = 0;
      this.virtualSprint = false;
      if (document.pointerLockElement === this.renderer.domElement) {
        try {
          document.exitPointerLock?.();
        } catch {
          // ignore
        }
      }
    }
  }

  public getPlayerSyncPayload() {
    const floor = detectFloor(
      this.playerPos.y,
      this.playerPos.z,
      FLOOR_HEIGHT,
      FLOOR_HEIGHT * 2,
      HOUSE_FRONT_Z
    );
    return {
      position: { ...this.playerPos },
      yaw: this.yaw,
      floor,
      sanity: Math.round(this.sanity),
      flashlightOn: this.flashlightOn,
      isCrouching:
        this.virtualCrouch || this.keys.has('KeyC') || this.keys.has('ControlLeft'),
      downed: this.downed,
    };
  }

  public getRemotePlayerPositions(): { guestId: string; position: Vec3; micOn: boolean }[] {
    const list: { guestId: string; position: Vec3; micOn: boolean }[] = [];
    for (const [guestId, entry] of this.remoteRigs.entries()) {
      list.push({
        guestId,
        position: { ...entry.targetPos },
        micOn: entry.micOn,
      });
    }
    return list;
  }

  public getLocalPlayerPosition(): Vec3 {
    return { ...this.playerPos };
  }

  public getGhostSyncPayload(): GhostSyncItem[] {
    return this.ghosts.map((g) => ({
      id: g.id,
      position: { ...g.position },
      yaw: g.yaw,
      state: g.state,
      stunTimer: g.stunTimer,
      alertTimer: g.alertTimer,
    }));
  }

  public applyRemoteGhosts(ghosts: GhostSyncItem[]): void {
    for (const item of ghosts) {
      this.remoteGhostTargets.set(item.id, {
        ...item,
        position: { ...item.position },
      });
    }
  }

  public discoverRumor(rumorId: string): void {
    let changed = false;
    this.rumors = this.rumors.map((r) => {
      if (r.id === rumorId && !r.discoveredRumor) {
        changed = true;
        return { ...r, discoveredRumor: true };
      }
      return r;
    });
    if (changed) {
      this.callbacks.onRumorsChanged([...this.rumors]);
      if (this.isMultiplayer) {
        this.callbacks.onCoopAction?.({ type: 'rumor_discover', rumorId });
      }
    }
  }

  public applyRemoteWorldState(world: RoomWorldState): void {
    let doorDirty = false;
    for (let i = 0; i < this.doors.length; i++) {
      const d = this.doors[i];
      if (world.unlockedDoors.includes(d.id) && d.lockedKeyId) {
        d.lockedKeyId = undefined;
        d.lockedKeyLabel = undefined;
        const rig = this.doorRigs.get(d.id);
        if (rig) {
          rig.lockPlateMat.color.setHex(0x6b8f74);
          rig.lockPlateMat.emissive.setHex(0x16291c);
          rig.lockPlateMat.emissiveIntensity = 0.35;
        }
      }
      if (world.openDoors[d.id] !== undefined && d.isOpen !== world.openDoors[d.id]) {
        d.isOpen = world.openDoors[d.id];
        d.targetAngle = d.isOpen ? d.openAngle : d.closedAngle;
        d.currentAngle = d.targetAngle;
        const rig = this.doorRigs.get(d.id);
        if (rig) rig.pivot.rotation.y = d.currentAngle;
        doorDirty = true;
      }
    }

    for (const item of this.interactables) {
      if (world.collectedItemIds.includes(item.id) && !item.collected) {
        item.collected = true;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) mesh.visible = false;
      }
    }

    for (let i = 0; i < world.collectedKeyIds.length; i++) {
      const kid = world.collectedKeyIds[i];
      if (!this.collectedKeyIds.includes(kid)) {
        this.collectedKeyIds.push(kid);
        this.collectedKeyLabels.push(world.collectedKeyLabels[i] ?? kid);
      }
    }

    for (const wallId of world.brokenWalls) {
      const mesh = this.wallMeshes.get(wallId);
      if (mesh) mesh.visible = false;
      this.baseColliders = this.baseColliders.filter((c) => c.id !== wallId);
      doorDirty = true;
    }

    this.rumors = this.rumors.map((r) => ({
      ...r,
      discoveredRumor: r.discoveredRumor || world.discoveredRumorIds.includes(r.id),
      discoveredFact: r.discoveredFact || world.discoveredFactIds.includes(r.id),
      debunked: r.debunked || world.debunkedRumorIds.includes(r.id),
    }));
    this.callbacks.onRumorsChanged([...this.rumors]);

    if (world.raniRescued) this.raniRescued = true;
    if (world.kujangClaimed) {
      this.kujangClaimed = true;
      if (this.kujangGroup) this.kujangGroup.visible = false;
    }
    if (world.inDimensiGaib && !this.inDimensiGaib) {
      this.activateDimensiGaibAtmosphere();
    }

    if (doorDirty) this.rebuildActiveColliders();
    this.emitHud();
  }

  public applyRemoteWorldEvent(broadcast: WorldActionBroadcast, localGuestId: string): void {
    const isSelf = broadcast.actorGuestId === localGuestId;
    const { action, actorNickname } = broadcast;

    switch (action.type) {
      case 'door_toggle': {
        const idx = this.doors.findIndex((d) => d.id === action.doorId);
        if (idx >= 0) {
          const d = this.doors[idx];
          if (action.unlocked) {
            d.lockedKeyId = undefined;
            d.lockedKeyLabel = undefined;
            const rig = this.doorRigs.get(d.id);
            if (rig) {
              rig.lockPlateMat.color.setHex(0x6b8f74);
              rig.lockPlateMat.emissive.setHex(0x16291c);
              rig.lockPlateMat.emissiveIntensity = 0.35;
            }
          }
          if (d.isOpen !== action.isOpen) {
            d.isOpen = action.isOpen;
            d.targetAngle = action.isOpen ? d.openAngle : d.closedAngle;
            this.rebuildActiveColliders();
            if (!isSelf) this.audio.playDoorCreak(action.isOpen);
          }
        }
        break;
      }
      case 'item_pickup': {
        const item = this.interactables.find((it) => it.id === action.itemId);
        if (item && !item.collected) {
          item.collected = true;
          const mesh = this.itemMeshes.get(item.id);
          if (mesh) mesh.visible = false;
        }
        if (action.kind === 'key' && action.payloadId) {
          if (!this.collectedKeyIds.includes(action.payloadId)) {
            this.collectedKeyIds.push(action.payloadId);
            this.collectedKeyLabels.push(action.label);
            if (!isSelf) {
              this.audio.playPickup();
              this.callbacks.onToast(`${actorNickname} menemukan ${action.label} (dibagikan ke regu)!`, 'fact');
            }
          }
        } else if (action.kind === 'evidence' && action.payloadId) {
          this.rumors = this.rumors.map((r) =>
            r.id === action.payloadId ? { ...r, discoveredRumor: true, discoveredFact: true } : r
          );
          this.callbacks.onRumorsChanged([...this.rumors]);
          if (!isSelf) {
            this.audio.playPickup();
            this.callbacks.onToast(`${actorNickname} menemukan Bukti Fakta: ${action.label}!`, 'fact');
          }
        }
        break;
      }
      case 'rumor_discover': {
        this.rumors = this.rumors.map((r) =>
          r.id === action.rumorId ? { ...r, discoveredRumor: true } : r
        );
        this.callbacks.onRumorsChanged([...this.rumors]);
        break;
      }
      case 'rumor_debunk': {
        this.rumors = this.rumors.map((r) =>
          r.id === action.rumorId
            ? { ...r, discoveredRumor: true, discoveredFact: true, debunked: true }
            : r
        );
        this.callbacks.onRumorsChanged([...this.rumors]);
        if (!isSelf) {
          this.audio.playDebunkChime();
          this.sanity = Math.min(100, this.sanity + 10);
          this.callbacks.onToast(
            `${actorNickname} mematahkan Segel Rumor${action.title ? `: ${action.title}` : ''}!`,
            'fact'
          );
        }
        break;
      }
      case 'wall_break': {
        const item = this.interactables.find((it) => it.id === action.itemId);
        if (item) item.collected = true;
        const mesh = this.wallMeshes.get(action.wallId);
        if (mesh) mesh.visible = false;
        this.baseColliders = this.baseColliders.filter((c) => c.id !== action.wallId);
        this.rebuildActiveColliders();
        if (!isSelf) {
          this.cameraTrauma = 0.4;
          this.audio.playDoorCreak(true);
          this.callbacks.onToast(`${actorNickname} merobohkan Tembok Rapuh!`, 'fact');
        }
        break;
      }
      case 'radio_rescue': {
        if (!this.raniRescued) {
          this.raniRescued = true;
          this.rumors = this.rumors.map((r) =>
            r.id === 'rumor_gereja' ? { ...r, discoveredRumor: true, discoveredFact: true } : r
          );
          this.callbacks.onRumorsChanged([...this.rumors]);
          if (!isSelf) {
            this.audio.playDebunkChime();
            this.callbacks.onToast(`${actorNickname} menyelamatkan sinyal Rani di Menara Radio!`, 'fact');
          }
        }
        break;
      }
      case 'salt_stun': {
        if (!isSelf) {
          for (const g of this.ghosts) {
            if (distance3D(g.position, action.position) < 9.0) {
              g.stunTimer = 6.0;
              g.state = 'stunned';
            }
          }
          this.callbacks.onToast(`${actorNickname} menaburkan Garam Pengusir di sekitar hantu!`, 'info');
        }
        break;
      }
      case 'dimensi_enter': {
        if (!this.inDimensiGaib) {
          this.activateDimensiGaibAtmosphere();
          if (!isSelf) {
            this.audio.playDoorSlam();
            this.callbacks.onToast(`${actorNickname} memasuki Rumah Gurita — Dimensi Gaib aktif!`, 'warn');
          }
        }
        break;
      }
      case 'player_downed': {
        if (!isSelf) {
          this.callbacks.onToast(
            `${actorNickname} TUMBANG! Dekati dan tekan [E] untuk menolongnya!`,
            'warn'
          );
        }
        break;
      }
      case 'player_revive': {
        if (action.targetGuestId === localGuestId && this.downed) {
          this.downed = false;
          this.sanity = 45;
          this.invulnTimer = 3.0;
          this.audio.playDebunkChime();
          this.callbacks.onToast(`Kamu ditolong oleh ${actorNickname}! (+45 Sanity)`, 'fact');
        } else if (!isSelf) {
          this.callbacks.onToast(`${actorNickname} berhasil menolong rekannya!`, 'fact');
        }
        break;
      }
      case 'kujang_claim': {
        this.kujangClaimed = true;
        if (this.kujangGroup) this.kujangGroup.visible = false;
        if (!isSelf) {
          this.audio.playDebunkChime();
          this.finishRun(false);
        }
        break;
      }
    }
    this.emitHud();
  }

  private createNameplateSprite(nickname: string, downed: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = downed ? 'rgba(130, 24, 18, 0.92)' : 'rgba(12, 16, 14, 0.85)';
    ctx.fillRect(10, 12, 236, 40);
    ctx.strokeStyle = downed ? '#ff7c6e' : '#cfa15a';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 12, 236, 40);
    ctx.fillStyle = downed ? '#ffdcd8' : '#f3efe4';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = downed ? `${nickname} · TUMBANG!` : nickname;
    ctx.fillText(label.slice(0, 20), 128, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: !downed,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(0, 2.02, 0);
    sprite.scale.set(0.68, 0.17, 1);
    return sprite;
  }

  private clearRemoteRigs(): void {
    for (const entry of this.remoteRigs.values()) {
      (entry.nameSprite.material as THREE.SpriteMaterial).map?.dispose();
      entry.nameSprite.material.dispose();
      this.scene.remove(entry.rig.group);
    }
    this.remoteRigs.clear();
  }

  public syncRemotePlayers(squad: SquadSyncPayload[], localGuestId: string): void {
    const activeIds = new Set<string>();
    for (const member of squad) {
      if (member.guestId === localGuestId) continue;
      activeIds.add(member.guestId);
      const existing = this.remoteRigs.get(member.guestId);
      const bagColor = member.cosmetics?.bagColor ?? 'charcoal';
      const accessory = member.cosmetics?.accessory ?? 'none';

      if (
        !existing ||
        existing.charId !== member.characterId ||
        existing.bagColor !== bagColor ||
        existing.accessory !== accessory
      ) {
        if (existing) {
          (existing.nameSprite.material as THREE.SpriteMaterial).map?.dispose();
          existing.nameSprite.material.dispose();
          this.scene.remove(existing.rig.group);
        }
        const profile = CHARACTERS.find((c) => c.id === member.characterId) ?? CHARACTERS[0];
        const bagHex = BAG_COLOR_OPTIONS.find((b) => b.id === bagColor)?.colorNum ?? 0x2d312e;
        const rig = createHumanoidNPC({
          shirtColor: new THREE.Color(profile.shirtColor).getHex(),
          bottomColor: new THREE.Color(profile.bottomColor).getHex(),
          isSkirt: profile.id === 'salsa' || profile.id === 'nadia',
          hasBackpack: true,
          bagColor: bagHex,
          accessory,
          contactShadowTex: this.mats.contactShadowTex,
        });
        const nameSprite = this.createNameplateSprite(member.nickname, Boolean(member.downed));
        rig.group.add(nameSprite);

        const beamLight = new THREE.PointLight(0xfff1d6, member.flashlightOn ? 1.8 : 0, 12, 1.5);
        beamLight.position.set(0, 1.45, 0.55);
        rig.group.add(beamLight);

        rig.group.position.set(member.position.x, member.position.y, member.position.z);
        rig.group.visible = member.role === 'player';
        this.scene.add(rig.group);
        this.remoteRigs.set(member.guestId, {
          rig,
          nameSprite,
          beamLight,
          charId: member.characterId,
          bagColor,
          accessory,
          nickname: member.nickname,
          targetPos: { ...member.position },
          targetYaw: member.yaw,
          flashlightOn: Boolean(member.flashlightOn),
          isCrouching: Boolean(member.isCrouching),
          downed: Boolean(member.downed),
          micOn: Boolean(member.micOn),
          role: member.role,
        });
      } else {
        existing.targetPos = { ...member.position };
        existing.targetYaw = member.yaw;
        existing.flashlightOn = Boolean(member.flashlightOn);
        existing.isCrouching = Boolean(member.isCrouching);
        existing.micOn = Boolean(member.micOn);
        existing.role = member.role;
        existing.rig.group.visible = member.role === 'player';
        existing.beamLight.intensity = member.flashlightOn && !member.downed ? 1.8 : 0;

        if (existing.downed !== Boolean(member.downed)) {
          existing.downed = Boolean(member.downed);
          existing.rig.group.remove(existing.nameSprite);
          (existing.nameSprite.material as THREE.SpriteMaterial).map?.dispose();
          existing.nameSprite.material.dispose();
          existing.nameSprite = this.createNameplateSprite(member.nickname, existing.downed);
          existing.rig.group.add(existing.nameSprite);
        }
      }
    }

    for (const [id, entry] of this.remoteRigs.entries()) {
      if (!activeIds.has(id)) {
        (entry.nameSprite.material as THREE.SpriteMaterial).map?.dispose();
        entry.nameSprite.material.dispose();
        this.scene.remove(entry.rig.group);
        this.remoteRigs.delete(id);
      }
    }
  }

  public setQuality(q: GraphicsQuality): void {
    this.quality = q;
    if (this.isSoftwareGl) return;
    if (q === 'low') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    } else if (q === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
    }
  }

  public getRumors(): RumorEntry[] {
    return this.rumors;
  }

  public tryDebunkRumor(rumorId: string): boolean {
    const res = debunkRumor(this.rumors, rumorId);
    if (!res.success) {
      this.callbacks.onToast(res.reason ?? 'Belum bisa mematahkan segel.', 'warn');
      return false;
    }
    this.rumors = res.updated;
    const rumorItem = this.rumors.find((r) => r.id === rumorId);
    this.audio.playDebunkChime();
    this.sanity = Math.min(100, this.sanity + 14);
    this.callbacks.onRumorsChanged([...this.rumors]);
    const broken = countBrokenSegel(this.rumors);
    this.callbacks.onToast(
      `Segel Rumor dipatahkan dengan Fakta! (${broken}/${this.rumors.length}) Ambu Hideung melemah.`,
      'fact'
    );
    if (this.isMultiplayer) {
      this.callbacks.onCoopAction?.({
        type: 'rumor_debunk',
        rumorId,
        title: rumorItem?.title,
      });
    }
    this.emitHud();
    return true;
  }

  public completeRadioPuzzle(): void {
    this.raniRescued = true;
    this.rumors = this.rumors.map((r) =>
      r.id === 'rumor_gereja' ? { ...r, discoveredRumor: true, discoveredFact: true } : r
    );
    this.audio.playDebunkChime();
    this.audio.playNpcVoice('rani', 2);
    this.callbacks.onRumorsChanged([...this.rumors]);
    this.callbacks.onToast(
      'Sinyal Rani ditemukan! Rekaman suara Rani masuk ke Jurnal Mitos vs Fakta.',
      'fact'
    );
    if (this.isMultiplayer) {
      this.callbacks.onCoopAction?.({ type: 'radio_rescue' });
    }
    this.emitHud();
  }

  private activateDimensiGaibAtmosphere(): void {
    this.inDimensiGaib = true;
    this.mats.wall_out.color.setHex(0x636c66);
    if (this.facadeMaterials) {
      this.facadeMaterials.facadeMat.color.setHex(0x636c66);
      this.facadeMaterials.trimMat.color.setHex(0x7c857e);
    }
    this.scene.background = new THREE.Color(0x050706);
    (this.scene.fog as THREE.FogExp2).density = 0.044;
  }

  public startNewGame(): void {
    this.audio.unlock();
    this.resetWorldEntities();
    this.remoteGhostTargets.clear();
    if (this.kujangGroup) this.kujangGroup.visible = true;
    this.downed = false;
    const staggerOffsets = [
      { dx: 0, dz: 0 },
      { dx: 1.6, dz: -0.9 },
      { dx: 3.1, dz: -1.6 },
      { dx: 1.8, dz: 1.1 },
      { dx: 3.4, dz: 0.4 },
    ];
    const st = this.isMultiplayer
      ? staggerOffsets[Math.abs(this.spawnSlot) % staggerOffsets.length]
      : { dx: 0, dz: 0 };
    this.playerPos = {
      x: PLAYER_SPAWN.x + st.dx,
      y: PLAYER_SPAWN.y,
      z: PLAYER_SPAWN.z + st.dz,
    };
    this.yaw = PLAYER_SPAWN_YAW;
    this.pitch = 0.02;
    this.currentEyeHeight = 1.65;
    this.cameraRoll = 0;
    this.bodyVisualYawOffset = 0;
    this.perspective = 'first-person';
    this.playerRig.group.visible = false;
    this.flashlightOn = true;
    this.uvMode = false;
    this.isHiding = false;
    this.sanity = 100;
    this.stamina = 100;
    this.flashlightBattery = 100;
    this.uvBattery = 100;
    this.saltCount = 2;
    this.collectedKeyIds = [];
    this.collectedKeyLabels = [];
    this.ghostHits = 0;
    this.invulnTimer = 0;
    this.elapsedSeconds = 0;
    this.inDimensiGaib = false;
    this.talkedNpcIds.clear();
    this.triggeredSecondBeat = false;
    this.triggeredRooftopBeat = false;
    this.mats.wall_out.color.setHex(0xd0d4cc);
    if (this.facadeMaterials) {
      this.facadeMaterials.facadeMat.color.setHex(0xd4d8d0);
      this.facadeMaterials.trimMat.color.setHex(0xe3e6de);
    }
    this.scene.background = new THREE.Color(0x090d0c);
    (this.scene.fog as THREE.FogExp2).density = 0.02;
    this.raniRescued = false;
    this.kujangClaimed = false;
    this.rumors = INITIAL_RUMORS.map((r) => ({ ...r }));
    this.callbacks.onRumorsChanged([...this.rumors]);
    this.phase = 'playing';
    this.keys.clear();
    this.isDraggingLook = false;
    this.lookTouchId = null;
    this.virtualForward = 0;
    this.virtualRight = 0;
    this.virtualCrouch = false;
    this.virtualSprint = false;
    this.inputSuspended = false;
    this.rebuildAiCompanions();
    this.emitHud();
  }

  public setPhase(next: GamePhase): void {
    this.phase = next;
    if (next !== 'playing') {
      this.keys.clear();
      this.isDraggingLook = false;
      this.lookTouchId = null;
      this.virtualForward = 0;
      this.virtualRight = 0;
      this.virtualSprint = false;
      if (document.pointerLockElement === this.renderer.domElement) {
        try {
          document.exitPointerLock?.();
        } catch {
          // ignore
        }
      }
    }
    this.emitHud();
  }

  public setVirtualMove(forward: number, right: number): void {
    this.virtualForward = Math.max(-1, Math.min(1, forward));
    this.virtualRight = Math.max(-1, Math.min(1, right));
  }

  public setVirtualCrouch(crouch: boolean): void {
    this.virtualCrouch = crouch;
    this.emitHud();
  }

  public setVirtualSprint(sprint: boolean): void {
    this.virtualSprint = sprint;
    this.emitHud();
  }

  public requestPointerLock(): void {
    if (this.phase === 'playing' && document.pointerLockElement !== this.renderer.domElement) {
      try {
        const res = this.renderer.domElement.requestPointerLock?.() as unknown;
        if (res && typeof (res as Promise<void>).catch === 'function') {
          (res as Promise<void>).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }

  public toggleFlashlight(): void {
    if (this.flashlightBattery <= 0 && !this.flashlightOn) {
      this.callbacks.onToast('Baterai Senter habis! Cari Baterai Senter.', 'warn');
      return;
    }
    this.flashlightOn = !this.flashlightOn;
    this.audio.playClick(this.flashlightOn);
    this.emitHud();
  }

  public toggleUVMode(): void {
    if (this.uvBattery <= 0 && !this.uvMode) {
      this.callbacks.onToast('Baterai Kamera UV habis! Cari Baterai UV.', 'warn');
      return;
    }
    this.uvMode = !this.uvMode;
    this.audio.playClick(this.uvMode);
    this.emitHud();
  }

  public togglePerspective(): void {
    this.perspective = this.perspective === 'first-person' ? 'third-person' : 'first-person';
    this.playerRig.group.visible = this.perspective === 'third-person' && !this.isHiding;
    this.emitHud();
  }

  public useSalt(): void {
    if (this.saltCount <= 0 || this.phase !== 'playing' || this.downed || this.isSpectator) return;
    this.saltCount--;
    this.audio.playClick(false);
    let stunnedAny = false;
    for (const g of this.ghosts) {
      if (distance3D(g.position, this.playerPos) < 8.5) {
        g.stunTimer = 6.0;
        g.state = 'stunned';
        stunnedAny = true;
      }
    }
    if (this.isMultiplayer) {
      this.callbacks.onCoopAction?.({ type: 'salt_stun', position: { ...this.playerPos } });
    }
    this.callbacks.onToast(
      stunnedAny
        ? 'Garam ditaburkan! Hantu di sekitar terpukul mundur sementara!'
        : 'Garam ditaburkan, namun tidak ada hantu di jarak dekat.',
      stunnedAny ? 'fact' : 'info'
    );
    this.emitHud();
  }

  private findNearestDownedTeammate(): { guestId: string; nickname: string; dist: number } | null {
    let best: { guestId: string; nickname: string; dist: number } | null = null;
    let bestDist = 2.65;
    for (const [guestId, entry] of this.remoteRigs.entries()) {
      if (!entry.downed || entry.role !== 'player') continue;
      if (Math.abs(entry.targetPos.y - this.playerPos.y) > 2.2) continue;
      const d = distance3D(entry.targetPos, this.playerPos);
      if (d < bestDist) {
        bestDist = d;
        best = { guestId, nickname: entry.nickname, dist: d };
      }
    }
    return best;
  }

  private findNearestDoor(): DoorData | null {
    let best: DoorData | null = null;
    let bestDist = 2.55;
    for (const d of this.doors) {
      if (Math.abs(d.hingePos.y - this.playerPos.y) > 2.2) continue;
      const dist = distance3D(d.closedCenter, this.playerPos);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  private findNearestInteractable(): InteractableItem | null {
    let best: InteractableItem | null = null;
    let bestDist = 2.65;
    for (const item of this.interactables) {
      if (item.collected) continue;
      if (Math.abs(item.position.y - this.playerPos.y) > 2.2) continue;
      const d = distance3D(item.position, this.playerPos);
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    }
    return best;
  }

  public interactNearest(): void {
    if (this.phase !== 'playing' || this.downed || this.isSpectator) return;

    if (this.isHiding) {
      this.isHiding = false;
      this.playerPos = { ...this.hideOrigin };
      this.audio.playClick(false);
      this.callbacks.onToast('Keluar dari tempat persembunyian.', 'info');
      this.emitHud();
      return;
    }

    // Prioritaskan menolong rekan regu yang Tumbang
    const downedMate = this.findNearestDownedTeammate();
    if (downedMate && this.isMultiplayer) {
      const entry = this.remoteRigs.get(downedMate.guestId);
      if (entry) {
        entry.downed = false;
      }
      this.audio.playDebunkChime();
      this.callbacks.onCoopAction?.({
        type: 'player_revive',
        targetGuestId: downedMate.guestId,
      });
      this.callbacks.onToast(`Kamu menolong ${downedMate.nickname}! (+45 Sanity)`, 'fact');
      this.emitHud();
      return;
    }

    const nearestDoor = this.findNearestDoor();
    const nearestItem = this.findNearestInteractable();

    // Prioritaskan yang jaraknya paling dekat dengan pemain
    const doorDist = nearestDoor ? distance3D(nearestDoor.closedCenter, this.playerPos) : 999;
    const itemDist = nearestItem ? distance3D(nearestItem.position, this.playerPos) : 999;

    if (nearestDoor && doorDist <= itemDist) {
      const wasLocked = Boolean(nearestDoor.lockedKeyId);
      const res = tryInteractDoor(nearestDoor, this.collectedKeyIds);
      if (res.lockedBlocked) {
        this.audio.playLockedRattle();
        this.callbacks.onToast(res.message, 'warn');
        return;
      }
      if (res.changed) {
        const idx = this.doors.findIndex((d) => d.id === nearestDoor.id);
        if (idx >= 0) this.doors[idx] = res.door;
        this.rebuildActiveColliders();
        this.audio.playDoorCreak(res.door.isOpen);
        const rig = this.doorRigs.get(nearestDoor.id);
        if (rig) {
          rig.lockPlateMat.color.setHex(0x6b8f74);
          rig.lockPlateMat.emissive.setHex(0x16291c);
          rig.lockPlateMat.emissiveIntensity = 0.35;
        }
        if (this.isMultiplayer) {
          this.callbacks.onCoopAction?.({
            type: 'door_toggle',
            doorId: res.door.id,
            isOpen: res.door.isOpen,
            unlocked: wasLocked && !res.door.lockedKeyId,
          });
        }
        this.callbacks.onToast(res.message, 'info');
        this.emitHud();
      }
      return;
    }

    const item = nearestItem;
    if (!item) return;

    if (item.kind === 'npc' && item.payloadId) {
      this.talkedNpcIds.add(item.payloadId);
      this.emitHud();
      this.callbacks.onOpenNpcDialog(item.payloadId);
      return;
    }

    if (item.kind === 'key' && item.payloadId) {
      item.collected = true;
      const mesh = this.itemMeshes.get(item.id);
      if (mesh) mesh.visible = false;
      this.collectedKeyIds.push(item.payloadId);
      this.collectedKeyLabels.push(item.label);
      this.audio.playPickup();
      if (this.isMultiplayer) {
        this.callbacks.onCoopAction?.({
          type: 'item_pickup',
          itemId: item.id,
          kind: 'key',
          label: item.label,
          payloadId: item.payloadId,
        });
      }
      this.callbacks.onToast(`Mendapatkan ${item.label}! Gunakan pada pintu ruangan yang terkunci.`, 'fact');
      this.emitHud();
      return;
    }

    if (item.kind === 'evidence') {
      if (item.requiresUV && !this.uvMode) {
        this.callbacks.onToast('Nyalakan Kamera UV [Q] untuk membaca bukti tersembunyi ini!', 'warn');
        return;
      }
      item.collected = true;
      const mesh = this.itemMeshes.get(item.id);
      if (mesh) mesh.visible = false;
      this.audio.playPickup();
      if (item.payloadId) {
        this.rumors = this.rumors.map((r) =>
          r.id === item.payloadId ? { ...r, discoveredRumor: true, discoveredFact: true } : r
        );
        this.callbacks.onRumorsChanged([...this.rumors]);
      }
      if (this.isMultiplayer) {
        this.callbacks.onCoopAction?.({
          type: 'item_pickup',
          itemId: item.id,
          kind: 'evidence',
          label: item.label,
          payloadId: item.payloadId,
        });
      }
      this.callbacks.onToast(
        `Bukti Fakta ditemukan: ${item.label}. Tekan [J] untuk mematahkan Segel Rumor!`,
        'fact'
      );
      this.emitHud();
      return;
    }

    if (item.kind === 'battery_flashlight') {
      item.collected = true;
      const mesh = this.itemMeshes.get(item.id);
      if (mesh) mesh.visible = false;
      this.flashlightBattery = Math.min(100, this.flashlightBattery + 50);
      this.audio.playPickup();
      if (this.isMultiplayer) {
        this.callbacks.onCoopAction?.({
          type: 'item_pickup',
          itemId: item.id,
          kind: 'battery_flashlight',
          label: item.label,
        });
      }
      this.callbacks.onToast('Baterai Senter terisi +50%.', 'info');
      this.emitHud();
      return;
    }

    if (item.kind === 'battery_uv') {
      item.collected = true;
      const mesh = this.itemMeshes.get(item.id);
      if (mesh) mesh.visible = false;
      this.uvBattery = Math.min(100, this.uvBattery + 50);
      this.audio.playPickup();
      if (this.isMultiplayer) {
        this.callbacks.onCoopAction?.({
          type: 'item_pickup',
          itemId: item.id,
          kind: 'battery_uv',
          label: item.label,
        });
      }
      this.callbacks.onToast('Baterai Kamera UV terisi +50%.', 'info');
      this.emitHud();
      return;
    }

    if (item.kind === 'salt') {
      item.collected = true;
      const mesh = this.itemMeshes.get(item.id);
      if (mesh) mesh.visible = false;
      this.saltCount += 1;
      this.audio.playPickup();
      if (this.isMultiplayer) {
        this.callbacks.onCoopAction?.({
          type: 'item_pickup',
          itemId: item.id,
          kind: 'salt',
          label: item.label,
        });
      }
      this.callbacks.onToast('Mendapatkan Garam Pengusir (+1). Tekan [G] untuk menabur.', 'info');
      this.emitHud();
      return;
    }

    if (item.kind === 'hiding') {
      this.hideOrigin = { ...this.playerPos };
      this.isHiding = true;
      this.audio.playClick(false);
      this.callbacks.onToast(`Bersembunyi di ${item.label}. Tekan [E] untuk keluar.`, 'info');
      this.emitHud();
      return;
    }

    if (item.kind === 'crumbling_wall' && item.payloadId) {
      const broken = countBrokenSegel(this.rumors);
      const required = item.id === 'crumble_second' ? 2 : 3;
      if (broken < required) {
        this.callbacks.onToast(
          `Tembok Rapuh masih tertahan mitos! Bongkar minimal ${required} Segel Rumor di Jurnal [J] (Saat ini: ${broken}).`,
          'warn'
        );
        return;
      }
      item.collected = true;
      const mesh = this.wallMeshes.get(item.payloadId);
      if (mesh) mesh.visible = false;
      this.baseColliders = this.baseColliders.filter((c) => c.id !== item.payloadId);
      this.rebuildActiveColliders();
      this.cameraTrauma = 0.65;
      this.audio.playDoorCreak(true);
      if (this.isMultiplayer) {
        this.callbacks.onCoopAction?.({
          type: 'wall_break',
          itemId: item.id,
          wallId: item.payloadId,
        });
      }
      this.callbacks.onToast('Tembok Rapuh runtuh terbuka!', 'fact');
      this.emitHud();
      return;
    }

    if (item.kind === 'radio_tower') {
      this.callbacks.onOpenRadioPuzzle();
      return;
    }

    if (item.kind === 'kujang') {
      this.kujangClaimed = true;
      this.kujangGroup.visible = false;
      this.audio.playDebunkChime();
      this.finishRun(false);
    }
  }

  private finishRun(defeated: boolean): void {
    const segelBroken = countBrokenSegel(this.rumors);
    const ev = evaluateEnding({
      defeated,
      kujangClaimed: this.kujangClaimed,
      segelBroken,
      totalSegel: this.rumors.length,
      raniRescued: this.raniRescued,
    });
    if (this.isMultiplayer && !defeated) {
      this.callbacks.onCoopAction?.({
        type: 'kujang_claim',
        summaryTitle: ev.title,
        summarySubtitle: ev.subtitle,
        durationSec: Math.round(this.elapsedSeconds),
      });
    }
    this.setPhase('gameover');
    this.callbacks.onGameOver({
      ending: ev.ending,
      endingTitle: ev.title,
      endingSubtitle: ev.subtitle,
      endingMessage: ev.message,
      characterName: this.getCharacter().name,
      segelBroken,
      totalSegel: this.rumors.length,
      evidenceCount: this.rumors.filter((r) => r.discoveredFact).length,
      totalEvidence: this.rumors.length,
      elapsedSeconds: Math.round(this.elapsedSeconds),
      ghostHits: this.ghostHits,
      raniRescued: this.raniRescued,
    });
  }

  private bindInput(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onWindowBlur);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', this.onMouseDown);
    dom.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    dom.addEventListener('touchstart', this.onTouchStart, { passive: false });
    dom.addEventListener('touchmove', this.onTouchMove, { passive: false });
    dom.addEventListener('touchend', this.onTouchEnd, { passive: false });
    dom.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.phase !== 'playing' || this.inputSuspended) return;
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement && e.target.isContentEditable)
    ) {
      return;
    }
    this.audio.unlock(true);
    const isRepeat = this.keys.has(e.code);
    this.keys.add(e.code);
    if (isRepeat) return;

    if (e.code === 'KeyF') this.toggleFlashlight();
    else if (e.code === 'KeyQ') this.toggleUVMode();
    else if (e.code === 'KeyV') this.togglePerspective();
    else if (e.code === 'KeyE') this.interactNearest();
    else if (e.code === 'KeyG') this.useSalt();
    else if (e.code === 'KeyJ') this.callbacks.onToggleJournal();
    else if (e.code === 'Escape' || e.code === 'KeyP') this.callbacks.onPauseRequest();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onWindowBlur = (): void => {
    this.keys.clear();
    this.isDraggingLook = false;
    this.lookTouchId = null;
    this.virtualForward = 0;
    this.virtualRight = 0;
    this.virtualSprint = false;
  };

  private onPointerLockChange = (): void => {
    this.isDraggingLook = false;
    if (document.pointerLockElement === this.renderer.domElement) {
      this.pointerLockIgnoreMoves = 2;
    } else {
      this.pointerLockIgnoreMoves = 0;
    }
  };

  private onPointerLockError = (): void => {
    this.pointerLockIgnoreMoves = 0;
  };

  private onContextMenu = (e: MouseEvent): void => {
    if (this.phase === 'playing') {
      e.preventDefault();
      return;
    }
    this.isDraggingLook = false;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (this.phase !== 'playing') return;
    if (e.detail === 0 && (navigator.maxTouchPoints ?? 0) > 0 && this.lookTouchId !== null) return;
    this.audio.unlock(true);
    this.isDraggingLook = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    const isCoarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    if (e.button === 0 && !isCoarse && document.pointerLockElement !== this.renderer.domElement) {
      this.requestPointerLock();
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.phase !== 'playing') return;
    if (document.pointerLockElement === this.renderer.domElement) {
      if (this.pointerLockIgnoreMoves > 0) {
        this.pointerLockIgnoreMoves--;
        return;
      }
      if (Math.abs(e.movementX) > 240 || Math.abs(e.movementY) > 240) return;
      const dx = Math.max(-85, Math.min(85, e.movementX));
      const dy = Math.max(-85, Math.min(85, e.movementY));
      this.yaw -= dx * 0.0022;
      this.pitch -= dy * 0.0022;
      this.pitch = Math.max(-1.38, Math.min(1.38, this.pitch));
    } else if (this.isDraggingLook) {
      if ((e.buttons & 1) === 0 && (e.buttons & 2) === 0) {
        this.isDraggingLook = false;
        return;
      }
      const rawDx = e.clientX - this.lastPointerX;
      const rawDy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      const dx = Math.max(-95, Math.min(95, rawDx));
      const dy = Math.max(-95, Math.min(95, rawDy));
      this.yaw -= dx * 0.0036;
      this.pitch -= dy * 0.0036;
      this.pitch = Math.max(-1.38, Math.min(1.38, this.pitch));
    }
  };

  private onMouseUp = (): void => {
    this.isDraggingLook = false;
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (this.phase !== 'playing') return;
    if (e.target !== this.renderer.domElement) return;
    e.preventDefault();
    this.audio.unlock(true);
    if (this.lookTouchId === null && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      this.lookTouchId = t.identifier;
      this.lastTouchX = t.clientX;
      this.lastTouchY = t.clientY;
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (this.phase !== 'playing' || this.lookTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.lookTouchId) {
        e.preventDefault();
        const rawDx = t.clientX - this.lastTouchX;
        const rawDy = t.clientY - this.lastTouchY;
        this.lastTouchX = t.clientX;
        this.lastTouchY = t.clientY;
        const dx = Math.max(-95, Math.min(95, rawDx));
        const dy = Math.max(-95, Math.min(95, rawDy));
        this.yaw -= dx * 0.0045;
        this.pitch -= dy * 0.0045;
        this.pitch = Math.max(-1.38, Math.min(1.38, this.pitch));
        break;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (this.lookTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookTouchId) {
        this.lookTouchId = null;
        break;
      }
    }
  };

  private startLoop(): void {
    const tick = () => {
      if (this.destroyed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const totalDt = Math.min(Math.max(rawDt, 0.001), 0.25);
      const timeSec = now * 0.001;
      let remaining = totalDt;
      while (remaining > 0.0001) {
        const step = Math.min(remaining, 0.05);
        this.update(step, timeSec);
        remaining -= step;
      }
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.destroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private animateGhosts(ghost: GhostData, rig: GhostRig, dt: number, timeSec: number): void {
    const speedFactor = ghost.state === 'chase' ? 1.55 : ghost.state === 'investigate' ? 1.15 : 0.75;
    const bob =
      ghost.kind === 'pocong'
        ? Math.abs(Math.sin(timeSec * 6.2)) * 0.34
        : ghost.kind === 'genderuwo'
          ? Math.abs(Math.sin(timeSec * 4.2)) * 0.05
          : Math.sin(timeSec * 2.8 + ghost.homePos.x) * 0.07;

    rig.group.position.set(ghost.position.x, ghost.position.y + bob, ghost.position.z);
    rig.group.rotation.y = ghost.yaw;

    if (ghost.kind === 'boneka_uci' && ghost.state === 'stalk') {
      // Membeku kaku gaya Weeping Angel
      return;
    }

    // Animasi artikulasi kepala & tubuh sesuai jenis hantu
    if (ghost.kind === 'ambu_hideung') {
      rig.head.rotation.z = Math.sin(timeSec * 4.5) * 0.14;
      rig.head.rotation.x = ghost.state === 'chase' ? 0.15 : Math.sin(timeSec * 1.9) * 0.06;
      const armReach = ghost.state === 'chase' ? -Math.PI * 0.56 : -Math.PI * 0.32;
      if (rig.leftArm) {
        rig.leftArm.rotation.x = THREE.MathUtils.damp(
          rig.leftArm.rotation.x,
          armReach + Math.sin(timeSec * 5.2) * 0.22,
          8,
          dt
        );
      }
      if (rig.rightArm) {
        rig.rightArm.rotation.x = THREE.MathUtils.damp(
          rig.rightArm.rotation.x,
          armReach - Math.sin(timeSec * 5.2) * 0.22,
          8,
          dt
        );
      }
      if (rig.hairStrands) {
        rig.hairStrands.forEach((strand, idx) => {
          strand.rotation.y = Math.sin(timeSec * 3.8 + idx * 0.8) * 0.18;
          strand.rotation.z = Math.cos(timeSec * 3.1 + idx * 0.6) * 0.09;
        });
      }
    } else if (ghost.kind === 'kuntilanak') {
      rig.head.rotation.z = Math.sin(timeSec * 5.1) * 0.22;
      const sway = Math.sin(timeSec * 4.0 * speedFactor) * 0.25;
      if (rig.leftArm) rig.leftArm.rotation.x = -Math.PI * 0.44 + sway;
      if (rig.rightArm) rig.rightArm.rotation.x = -Math.PI * 0.44 - sway;
      if (rig.hairStrands) {
        rig.hairStrands.forEach((lock, idx) => {
          lock.rotation.x = 0.15 + Math.sin(timeSec * 4.4 + idx) * 0.16;
        });
      }
    } else if (ghost.kind === 'pocong') {
      rig.bodyGroup.rotation.x = Math.sin(timeSec * 6.2) * 0.14;
      rig.head.rotation.z = Math.sin(timeSec * 3.0) * 0.1;
    } else if (ghost.kind === 'genderuwo') {
      const stride = Math.sin(timeSec * 5.2 * speedFactor) * 0.55;
      if (rig.leftLeg) rig.leftLeg.rotation.x = stride;
      if (rig.rightLeg) rig.rightLeg.rotation.x = -stride;
      if (rig.leftArm) rig.leftArm.rotation.x = -stride * 0.8 - 0.35;
      if (rig.rightArm) rig.rightArm.rotation.x = stride * 0.8 - 0.35;
      rig.head.rotation.y = Math.sin(timeSec * 2.5) * 0.18;
    } else if (ghost.kind === 'boneka_uci') {
      rig.head.rotation.z = Math.sin(timeSec * 9.0) * 0.28;
      if (rig.leftArm) rig.leftArm.rotation.x = -0.7 + Math.sin(timeSec * 8) * 0.3;
      if (rig.rightArm) rig.rightArm.rotation.x = -0.7 - Math.sin(timeSec * 8) * 0.3;
    }
  }

  private animateNpcs(timeSec: number): void {
    for (const { id, rig } of this.npcAnimations) {
      if (id === 'satpam') {
        rig.bodyRoot.position.y = Math.sin(timeSec * 1.8) * 0.015;
        rig.head.rotation.y = Math.sin(timeSec * 0.9) * 0.44;
        rig.rightArm.rotation.x = -0.3 + Math.sin(timeSec * 1.4) * 0.14;
      } else if (id === 'nasgor') {
        rig.rightArm.rotation.x = -0.78 + Math.sin(timeSec * 6.4) * 0.28;
        rig.rightArm.rotation.z = Math.cos(timeSec * 6.4) * 0.18;
        rig.leftArm.rotation.x = -0.28 + Math.sin(timeSec * 3.2) * 0.1;
        rig.head.rotation.x = 0.14 + Math.sin(timeSec * 3.2) * 0.06;
      } else if (id === 'pecel') {
        rig.rightArm.rotation.x = -0.52 + Math.sin(timeSec * 4.8) * 0.3;
        rig.leftArm.rotation.x = -0.2 + Math.cos(timeSec * 2.4) * 0.12;
        rig.head.rotation.y = Math.sin(timeSec * 1.3) * 0.24;
      } else if (id === 'warung_ibu') {
        rig.rightArm.rotation.x = -0.46 + Math.sin(timeSec * 2.2) * 0.22;
        rig.leftArm.rotation.x = -0.32 + Math.cos(timeSec * 2.2) * 0.16;
        rig.head.rotation.y = Math.sin(timeSec * 1.1) * 0.3;
      } else if (id === 'warung_pemuda_1') {
        const sip = Math.max(0, Math.sin(timeSec * 1.25));
        rig.rightArm.rotation.x = -0.52 - sip * 0.72;
        rig.head.rotation.x = -0.04 + sip * 0.14;
        rig.head.rotation.y = Math.sin(timeSec * 0.7) * 0.22;
      } else if (id === 'warung_pemuda_2') {
        rig.leftArm.rotation.x = -0.62;
        rig.rightArm.rotation.x = -0.88 + Math.sin(timeSec * 4.6) * 0.08;
        rig.head.rotation.x = 0.26 + Math.sin(timeSec * 1.6) * 0.05;
      } else if (id === 'warung_pemuda_3') {
        rig.leftArm.rotation.x = -0.18 + Math.sin(timeSec * 2.1) * 0.14;
        rig.rightArm.rotation.x = -0.24 + Math.cos(timeSec * 2.4) * 0.22;
        rig.head.rotation.y = -0.18 + Math.sin(timeSec * 1.45) * 0.28;
        rig.leftLeg.rotation.x = Math.sin(timeSec * 4.0) * 0.08;
      }
    }
  }

  private update(dt: number, timeSec: number): void {
    this.fpsCounter++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.currentFps = Math.round(this.fpsCounter / this.fpsTimer);
      this.fpsCounter = 0;
      this.fpsTimer = 0;
    }

    // Animasi lingkungan + engsel pintu + gerakan khas tiap NPC
    this.animateNpcs(timeSec);
    for (const d of this.doors) {
      if (Math.abs(d.currentAngle - d.targetAngle) > 0.001) {
        d.currentAngle = THREE.MathUtils.damp(d.currentAngle, d.targetAngle, 9, dt);
        const rig = this.doorRigs.get(d.id);
        if (rig) rig.pivot.rotation.y = d.currentAngle;
      }
    }

    if (this.beaconMesh) {
      const pulse = Math.sin(timeSec * 4) > 0 ? 1 : 0.2;
      (this.beaconMesh.material as THREE.MeshBasicMaterial).color.setRGB(pulse, 0.1, 0.1);
    }
    if (this.kujangGroup && this.kujangGroup.visible) {
      this.kujangGroup.rotation.y = timeSec * 1.1;
      this.kujangGroup.position.y = 1.45 + Math.sin(timeSec * 2.4) * 0.08;
    }
    for (const eye of this.octopusEyes) {
      const mat = eye.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.6 + Math.sin(timeSec * 3.1) * 0.7;
    }
    if (this.dustPoints) {
      this.dustPoints.rotation.y = timeSec * 0.015;
    }

    // Kamera Title Screen: Live Sukajadi World Tour menampilkan Warung Ceu Titin, Baliho Windah, Pos Ronda, Masjid & Rumah Gurita
    if (this.phase === 'title') {
      const angle = timeSec * 0.14;
      this.camera.position.set(
        2.5 + Math.sin(angle) * 5.2,
        9.4 + Math.sin(angle * 1.3) * 0.45,
        39.5
      );
      this.camera.lookAt(-1.2, 4.0, 6.0);
      this.flashlight.visible = false;
      this.uvLight.visible = false;
      return;
    }

    if (this.phase !== 'playing') return;

    this.elapsedSeconds += dt;
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.cameraTrauma > 0) this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.6);

    // Update animasi remote squadmates di Multiplayer (termasuk jongkok, tumbang, & sinar senter)
    for (const entry of this.remoteRigs.values()) {
      if (entry.role !== 'player') continue;
      const cur = entry.rig.group.position;
      const dx = entry.targetPos.x - cur.x;
      const dz = entry.targetPos.z - cur.z;
      const moving = Math.hypot(dx, dz) > 0.03;
      cur.x = THREE.MathUtils.damp(cur.x, entry.targetPos.x, 12, dt);
      cur.y = THREE.MathUtils.damp(cur.y, entry.targetPos.y, 12, dt);
      cur.z = THREE.MathUtils.damp(cur.z, entry.targetPos.z, 12, dt);
      entry.rig.group.rotation.y = entry.targetYaw + Math.PI;
      entry.rig.bodyRoot.scale.y = entry.downed ? 0.48 : entry.isCrouching ? 0.72 : 1.0;
      entry.rig.bodyRoot.rotation.x = entry.downed ? 0.55 : 0;
      const swing = moving && !entry.downed ? Math.sin(timeSec * 8.5) * 0.52 : 0;
      entry.rig.leftLeg.rotation.x = THREE.MathUtils.damp(entry.rig.leftLeg.rotation.x, swing, 10, dt);
      entry.rig.rightLeg.rotation.x = THREE.MathUtils.damp(entry.rig.rightLeg.rotation.x, -swing, 10, dt);
      entry.rig.leftArm.rotation.x = THREE.MathUtils.damp(entry.rig.leftArm.rotation.x, -swing * 0.8, 10, dt);
      entry.rig.rightArm.rotation.x = THREE.MathUtils.damp(entry.rig.rightArm.rotation.x, swing * 0.8, 10, dt);

      const distToCam = Math.hypot(cur.x - this.playerPos.x, cur.z - this.playerPos.z);
      const tagScale = entry.downed
        ? THREE.MathUtils.clamp(distToCam * 0.16, 0.52, 1.35)
        : THREE.MathUtils.clamp(distToCam * 0.11, 0.38, 0.95);
      entry.nameSprite.scale.set(tagScale, tagScale * 0.25, 1);
      entry.nameSprite.position.y = entry.downed ? 1.45 : entry.isCrouching ? 1.68 : 2.02;
      entry.nameSprite.visible = distToCam > 0.35;
    }

    // Update AI Teman Solo (0-3 rekan selalu mengikuti di belakang pemain tanpa tembus dinding)
    for (let idx = 0; idx < this.aiCompanions.length; idx++) {
      const c = this.aiCompanions[idx];
      const followTarget = computeCompanionFollowTarget(
        this.playerPos,
        this.yaw,
        idx,
        this.aiCompanions.length
      );
      const dx = followTarget.x - c.pos.x;
      const dz = followTarget.z - c.pos.z;
      const dist = Math.hypot(dx, dz);
      let moved = false;
      if (dist > 0.35) {
        const step = Math.min(dist, 3.8 * dt);
        const nx = c.pos.x + (dx / dist) * step;
        const nz = c.pos.z + (dz / dist) * step;
        const resolved = resolveHorizontalCollision(
          { x: nx, y: this.playerPos.y, z: nz },
          0.32,
          1.68,
          this.activeColliders
        );
        const ny = resolveGroundElevation(
          resolved.x,
          resolved.z,
          this.playerPos.y,
          STAIR_ZONES,
          FLOOR_HEIGHT,
          FLOOR_HEIGHT * 2
        );
        moved = Math.hypot(resolved.x - c.pos.x, resolved.z - c.pos.z) > 0.002;
        c.pos = { x: resolved.x, y: ny, z: resolved.z };
        c.yaw = Math.atan2(dx, dz);
      } else {
        c.yaw = this.yaw + Math.PI;
      }
      c.rig.group.position.set(c.pos.x, c.pos.y, c.pos.z);
      c.rig.group.rotation.y = c.yaw;
      const swing = moved ? Math.sin(timeSec * 7.5 + c.phaseOffset) * 0.52 : 0;
      c.rig.leftLeg.rotation.x = THREE.MathUtils.damp(c.rig.leftLeg.rotation.x, swing, 10, dt);
      c.rig.rightLeg.rotation.x = THREE.MathUtils.damp(c.rig.rightLeg.rotation.x, -swing, 10, dt);
      c.rig.leftArm.rotation.x = THREE.MathUtils.damp(c.rig.leftArm.rotation.x, -swing * 0.75, 10, dt);
      c.rig.rightArm.rotation.x = THREE.MathUtils.damp(c.rig.rightArm.rotation.x, swing * 0.75, 10, dt);
    }

    const profile = this.getCharacter();
    const isCrouching =
      !this.inputSuspended &&
      (this.downed || this.virtualCrouch || this.keys.has('KeyC') || this.keys.has('ControlLeft'));
    let forward = this.inputSuspended ? 0 : this.virtualForward;
    let right = this.inputSuspended ? 0 : this.virtualRight;
    if (!this.inputSuspended) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) right += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) right -= 1;
    }
    forward = Math.max(-1, Math.min(1, forward));
    right = Math.max(-1, Math.min(1, right));

    const wantsMove =
      !this.inputSuspended &&
      !this.isHiding &&
      !this.isSpectator &&
      (Math.abs(forward) > 0.05 || Math.abs(right) > 0.05);
    const wantsSprint =
      wantsMove &&
      !this.downed &&
      !isCrouching &&
      (this.virtualSprint || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'));

    let isSprinting = false;
    if (wantsSprint && this.stamina > 1) {
      isSprinting = true;
      this.stamina = Math.max(0, this.stamina - 20 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 14 * dt);
    }

    // Gerak pemain & tabrakan AABB dinding + pintu tertutup + tangga
    let actualMoved = false;
    let moveSpeed = 0;
    if (wantsMove) {
      moveSpeed =
        (this.downed ? 1.05 : isCrouching ? 1.95 : isSprinting ? 5.8 : 3.55) * profile.speedMult;
      const fx = -Math.sin(this.yaw);
      const fz = -Math.cos(this.yaw);
      const rx = Math.cos(this.yaw);
      const rz = -Math.sin(this.yaw);
      let mx = fx * forward + rx * right;
      let mz = fz * forward + rz * right;
      const len = Math.hypot(mx, mz);
      if (len > 1e-4) {
        mx /= len;
        mz /= len;
      }

      const nextX = THREE.MathUtils.clamp(this.playerPos.x + mx * moveSpeed * dt, -86, 86);
      const nextZ = THREE.MathUtils.clamp(this.playerPos.z + mz * moveSpeed * dt, -30, 82);
      const resolved = resolveHorizontalCollision(
        { x: nextX, y: this.playerPos.y, z: nextZ },
        0.34,
        isCrouching ? 1.15 : 1.68,
        this.activeColliders
      );
      const newY = resolveGroundElevation(
        resolved.x,
        resolved.z,
        this.playerPos.y,
        STAIR_ZONES,
        FLOOR_HEIGHT,
        FLOOR_HEIGHT * 2
      );
      const steppedDist = Math.hypot(resolved.x - this.playerPos.x, resolved.z - this.playerPos.z);
      actualMoved = steppedDist > 0.001;
      this.playerPos = { x: resolved.x, y: newY, z: resolved.z };

      if (actualMoved) {
        this.headBobPhase += steppedDist * (isSprinting ? 2.5 : isCrouching ? 3.2 : 2.8);
      }
    }

    // Story Beat 1: Menyusup masuk ke Rumah Gurita -> Pintu depan membanting tutup & Dimensi Gaib aktif
    if (!this.inDimensiGaib && this.playerPos.z < HOUSE_FRONT_Z - 0.35 && Math.abs(this.playerPos.x) < 10.4) {
      const entryDoor = this.doors.find((d) => d.id === 'door_main_entry');
      if (entryDoor && entryDoor.isOpen) {
        entryDoor.isOpen = false;
        entryDoor.targetAngle = entryDoor.closedAngle;
        this.rebuildActiveColliders();
      }
      this.audio.playDoorSlam();
      this.audio.playNpcVoice('rani', 0);
      this.cameraTrauma = 0.55;
      this.activateDimensiGaibAtmosphere();
      if (this.isMultiplayer) {
        this.callbacks.onCoopAction?.({ type: 'dimensi_enter' });
      }
      this.callbacks.onToast(STORY_BEATS.enterDimensiGaib, 'warn');
    }

    // Story Beat 2 & 3: Lantai 2 & Rooftop
    if (!this.triggeredSecondBeat && this.playerPos.y >= FLOOR_HEIGHT - 0.45) {
      this.triggeredSecondBeat = true;
      this.audio.playEerieWhisper(0.7);
      this.callbacks.onToast(STORY_BEATS.enterSecondFloor, 'info');
    }
    if (!this.triggeredRooftopBeat && this.playerPos.y >= FLOOR_HEIGHT * 2 - 0.45) {
      this.triggeredRooftopBeat = true;
      this.audio.playNpcVoice('rani', 1);
      this.callbacks.onToast(STORY_BEATS.enterRooftop, 'warn');
    }

    // Konsumsi Baterai Independen: Senter vs Kamera UV
    const batStep = stepDualBatteries({
      flashlightBattery: this.flashlightBattery,
      uvBattery: this.uvBattery,
      flashlightOn: this.flashlightOn,
      uvMode: this.uvMode,
      drainMult: profile.batteryDrainMult,
      dt,
    });
    this.flashlightBattery = batStep.flashlightBattery;
    this.uvBattery = batStep.uvBattery;
    this.flashlightOn = batStep.flashlightOn;
    this.uvMode = batStep.uvMode;
    if (batStep.flashlightDepletedNow) {
      this.callbacks.onToast('Baterai Senter habis! Cari baterai senter cadangan.', 'warn');
    }
    if (batStep.uvDepletedNow) {
      this.callbacks.onToast('Baterai Kamera UV habis! Cari baterai UV cadangan.', 'warn');
    }

    // Kebisingan langkah
    const noiseLevel = !actualMoved
      ? 5
      : isCrouching
        ? Math.round(22 * profile.crouchNoiseMult)
        : isSprinting
          ? 92
          : 48;

    // Update AI Hantu (Authoritative di Solo / Host, atau interpolasi dari Host di Multiplayer non-host)
    const diffMult =
      this.difficulty === 'Santai' ? 0.78 : this.difficulty === 'Mimpi Buruk' ? 1.24 : 1.0;
    const segelBroken = countBrokenSegel(this.rumors);
    const weakFactor =
      computeGhostWeakeningFactor(segelBroken, this.rumors.length, profile) * diffMult;
    let nearestGhostDist = 999;
    let nearestGhostName: string | null = null;
    let totalSanityDrain = 0;

    const useRemoteGhosts =
      this.isMultiplayer && !this.isHostAuthority && this.remoteGhostTargets.size > 0;

    for (let i = 0; i < this.ghosts.length; i++) {
      let g = this.ghosts[i];
      if (useRemoteGhosts) {
        const synced = this.remoteGhostTargets.get(g.id);
        if (synced) {
          g.position.x = THREE.MathUtils.damp(g.position.x, synced.position.x, 12, dt);
          g.position.y = THREE.MathUtils.damp(g.position.y, synced.position.y, 12, dt);
          g.position.z = THREE.MathUtils.damp(g.position.z, synced.position.z, 12, dt);
          g.yaw = synced.yaw;
          g.state = synced.state;
          g.stunTimer = synced.stunTimer;
          g.alertTimer = synced.alertTimer;
        }
        const d = distance3D(g.position, this.playerPos);
        if (d < nearestGhostDist) {
          nearestGhostDist = d;
          nearestGhostName = g.name;
        }
        const activeSafe = isInSafeZone(this.playerPos, SAFE_ZONES);
        if (d < 6.5 && !activeSafe && !this.isSpectator && !this.downed) {
          totalSanityDrain += (1 - d / 6.5) * 4.5 * weakFactor;
        }
        if (
          d < 1.25 &&
          !activeSafe &&
          !this.isSpectator &&
          !this.downed &&
          !this.isHiding &&
          g.stunTimer <= 0 &&
          this.invulnTimer <= 0
        ) {
          this.ghostHits += 1;
          this.invulnTimer = 2.6;
          const dmgMult =
            this.difficulty === 'Santai' ? 0.7 : this.difficulty === 'Mimpi Buruk' ? 1.3 : 1.0;
          this.sanity = Math.max(0, this.sanity - 34 * profile.sanityResistMult * dmgMult);
          this.cameraTrauma = 1.0;
          this.audio.playJumpScare(g.kind);
          this.callbacks.onJumpscare({ kind: g.kind, name: g.name, timestamp: Date.now() });
          this.callbacks.onToast(
            `Diserang ${g.name}! Lari, sembunyi [E], atau tabur Garam [G]!`,
            'warn'
          );
        }
      } else {
        const res = stepGhostAI(
          g,
          this.playerPos,
          this.yaw,
          this.isHiding || this.isSpectator || this.downed,
          noiseLevel,
          this.flashlightOn,
          this.activeColliders,
          weakFactor,
          dt,
          SAFE_ZONES
        );
        g = res.ghost;
        this.ghosts[i] = g;
        totalSanityDrain += res.sanityDrainPerSec;

        const d = distance3D(g.position, this.playerPos);
        if (d < nearestGhostDist) {
          nearestGhostDist = d;
          nearestGhostName = g.name;
        }

        if (!this.isSpectator && !this.downed && res.caughtPlayer && this.invulnTimer <= 0) {
          this.ghostHits += 1;
          this.invulnTimer = 2.6;
          const dmgMult =
            this.difficulty === 'Santai' ? 0.7 : this.difficulty === 'Mimpi Buruk' ? 1.3 : 1.0;
          this.sanity = Math.max(0, this.sanity - 34 * profile.sanityResistMult * dmgMult);
          this.cameraTrauma = 1.0;
          this.audio.playJumpScare(g.kind);
          this.callbacks.onJumpscare({
            kind: g.kind,
            name: g.name,
            timestamp: Date.now(),
          });
          this.callbacks.onToast(
            `Diserang ${g.name}! Lari, sembunyi [E], atau tabur Garam [G]!`,
            'warn'
          );
        }
      }

      const rig = this.ghostRigs.get(g.id);
      if (rig) {
        this.animateGhosts(g, rig, dt, timeSec);
      }
    }

    // Update Sanity & Downed state
    const activeSafeZone = isInSafeZone(this.playerPos, SAFE_ZONES);
    if (this.isSpectator || this.downed) {
      if (this.isSpectator) this.sanity = 100;
    } else if (activeSafeZone) {
      this.sanity = Math.min(100, this.sanity + 2.5 * dt);
    } else if (this.inDimensiGaib) {
      const baseDrain = this.flashlightOn ? 0.25 : 0.75;
      this.sanity = Math.max(
        0,
        this.sanity - (baseDrain + totalSanityDrain) * profile.sanityResistMult * diffMult * dt
      );
    } else {
      this.sanity = Math.min(100, this.sanity + 3 * dt);
    }

    if (this.sanity <= 0 && !this.isSpectator && !this.downed) {
      const hasAliveTeammates =
        this.isMultiplayer &&
        Array.from(this.remoteRigs.values()).some((r) => r.role === 'player' && !r.downed);
      if (hasAliveTeammates) {
        this.downed = true;
        this.flashlightOn = false;
        this.uvMode = false;
        this.callbacks.onCoopAction?.({ type: 'player_downed' });
        this.callbacks.onToast(
          'Sanity habis! Kamu TUMBANG — tunggu rekan regu menekan [E] di dekatmu untuk menolong!',
          'warn'
        );
      } else {
        if (this.isMultiplayer) {
          this.downed = true;
          this.callbacks.onCoopAction?.({ type: 'player_downed' });
        }
        this.finishRun(true);
        return;
      }
    }

    // Update Audio Ambient
    this.audio.updateAmbience(
      dt,
      this.inDimensiGaib,
      this.sanity,
      nearestGhostDist,
      actualMoved,
      isSprinting,
      isCrouching
    );

    // Visual Gerak Kiri/Kanan/Lari/Jongkok (Camera Roll + Bob + FOV Kick + Third-Person Rig Gait)
    const targetRoll = actualMoved ? -right * (isSprinting ? 0.045 : 0.024) : 0;
    this.cameraRoll = THREE.MathUtils.damp(this.cameraRoll, targetRoll, 11, dt);

    const targetFov = isSprinting && actualMoved ? 79 : isCrouching ? 69 : 72;
    if (Math.abs(this.camera.fov - targetFov) > 0.08) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 8, dt);
      this.camera.updateProjectionMatrix();
    }

    const targetEye = this.downed ? 0.85 : this.isHiding ? 1.15 : isCrouching ? 1.05 : 1.65;
    this.currentEyeHeight = THREE.MathUtils.damp(this.currentEyeHeight, targetEye, 12, dt);
    const bobAmp = isSprinting ? 0.055 : isCrouching ? 0.018 : 0.032;
    const bobY = actualMoved ? Math.sin(this.headBobPhase) * bobAmp : 0;
    const bobX = actualMoved ? Math.cos(this.headBobPhase * 0.5) * bobAmp * 0.55 : 0;

    const shake = this.cameraTrauma * this.cameraTrauma * 0.08;
    const shakeYaw = (Math.random() - 0.5) * shake;
    const shakePitch = (Math.random() - 0.5) * shake;
    _euler.set(this.pitch + shakePitch, this.yaw + shakeYaw, this.cameraRoll, 'YXZ');
    this.camera.quaternion.setFromEuler(_euler);

    if (this.isSpectator) {
      this.camera.position.set(2.5, 11.5, 22.0);
      this.camera.lookAt(0, 3.0, 2.0);
      this.playerRig.group.visible = false;
    } else if (this.perspective === 'first-person' || this.isHiding) {
      const rightX = Math.cos(this.yaw);
      const rightZ = -Math.sin(this.yaw);
      this.camera.position.set(
        this.playerPos.x + rightX * bobX,
        this.playerPos.y + this.currentEyeHeight + bobY,
        this.playerPos.z + rightZ * bobX
      );
      this.playerRig.group.visible = false;
    } else {
      this.playerRig.group.visible = true;
      this.playerRig.group.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);

      // Arah badan karakter menghadap gerakan strafe/lari kiri-kanan secara mulus
      const desiredOffset =
        actualMoved && (Math.abs(right) > 0.05 || forward < -0.05)
          ? Math.atan2(-right, forward)
          : 0;
      this.bodyVisualYawOffset = THREE.MathUtils.damp(
        this.bodyVisualYawOffset,
        desiredOffset,
        10,
        dt
      );
      this.playerRig.group.rotation.y = this.yaw + Math.PI + this.bodyVisualYawOffset;
      this.playerRig.bodyRoot.scale.y = isCrouching ? 0.72 : 1.0;
      this.playerRig.bodyRoot.rotation.x = actualMoved ? (isSprinting ? 0.14 : 0.05) : 0;
      this.playerRig.bodyRoot.rotation.z = actualMoved ? -right * 0.07 : 0;

      // Animasi ayunan tangan & kaki sesuai langkah
      const swingAmp = actualMoved ? (isSprinting ? 0.85 : isCrouching ? 0.35 : 0.58) : 0;
      const swing = Math.sin(this.headBobPhase) * swingAmp;
      this.playerRig.leftLeg.rotation.x = THREE.MathUtils.damp(this.playerRig.leftLeg.rotation.x, swing, 14, dt);
      this.playerRig.rightLeg.rotation.x = THREE.MathUtils.damp(this.playerRig.rightLeg.rotation.x, -swing, 14, dt);
      this.playerRig.leftArm.rotation.x = THREE.MathUtils.damp(this.playerRig.leftArm.rotation.x, -swing * 0.85, 14, dt);
      this.playerRig.rightArm.rotation.x = THREE.MathUtils.damp(this.playerRig.rightArm.rotation.x, swing * 0.85, 14, dt);

      _euler.set(this.pitch, this.yaw, 0, 'YXZ');
      _v1.set(0, 0, 2.35).applyEuler(_euler);
      this.camera.position.set(
        this.playerPos.x + _v1.x,
        this.playerPos.y + this.currentEyeHeight + 0.35 + _v1.y,
        this.playerPos.z + _v1.z
      );
    }

    // Senter & UV mengikuti arah pandangan
    _v2.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlight.visible = this.flashlightOn;
    this.uvLight.visible = this.uvMode;
    this.flashlight.position.copy(this.camera.position);
    this.uvLight.position.copy(this.camera.position);
    this.flashlightTarget.position.copy(this.camera.position).addScaledVector(_v2, 6);

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.1) {
      this.hudEmitTimer = 0;
      this.emitHud(noiseLevel, nearestGhostDist, nearestGhostName);
    }
  }

  private emitHud(
    noiseLevel = 0,
    nearestGhostDist = 999,
    nearestGhostName: string | null = null
  ): void {
    const profile = this.getCharacter();
    let nearestPrompt: string | null = null;
    if (this.downed) {
      nearestPrompt = 'Tumbang · Tunggu rekan regu menolong dengan [E]';
    } else if (this.isHiding) {
      nearestPrompt = '[E] Keluar dari Persembunyian';
    } else {
      const downedMate = this.isMultiplayer ? this.findNearestDownedTeammate() : null;
      const door = this.findNearestDoor();
      const item = this.findNearestInteractable();
      const doorDist = door ? distance3D(door.closedCenter, this.playerPos) : 999;
      const itemDist = item ? distance3D(item.position, this.playerPos) : 999;
      if (downedMate) {
        nearestPrompt = `[E] Tolong ${downedMate.nickname} (+45 Sanity)`;
      } else if (door && doorDist <= itemDist) {
        if (!door.isOpen && door.lockedKeyId && !this.collectedKeyIds.includes(door.lockedKeyId)) {
          nearestPrompt = `[E] ${door.label} (Terkunci: Butuh ${door.lockedKeyLabel})`;
        } else {
          nearestPrompt = door.isOpen ? `[E] Tutup ${door.label}` : `[E] Buka ${door.label}`;
        }
      } else if (item) {
        nearestPrompt = item.prompt;
      }
    }

    const floor = detectFloor(
      this.playerPos.y,
      this.playerPos.z,
      FLOOR_HEIGHT,
      FLOOR_HEIGHT * 2,
      HOUSE_FRONT_Z
    );
    const activeSafeZone = isInSafeZone(this.playerPos, SAFE_ZONES);
    const segelBroken = countBrokenSegel(this.rumors);
    const evidenceCount = this.rumors.filter((r) => r.discoveredFact).length;
    const obj = computeCurrentObjective({
      floor,
      inDimensiGaib: this.inDimensiGaib,
      talkedNpcCount: this.talkedNpcIds.size,
      collectedKeyIds: this.collectedKeyIds,
      evidenceCount,
      segelBroken,
      totalSegel: this.rumors.length,
      raniRescued: this.raniRescued,
      kujangClaimed: this.kujangClaimed,
    });

    let ditoSenseHint: string | null = null;
    if (profile.canSenseGhosts && nearestGhostName && nearestGhostDist < 16) {
      ditoSenseHint = `Peka: ${nearestGhostName} (~${Math.round(nearestGhostDist)}m)`;
    }

    this.callbacks.onHudUpdate({
      phase: this.phase,
      floor,
      actNumber: obj.actNumber,
      currentObjective: obj.objective,
      inDimensiGaib: this.inDimensiGaib,
      inSafeZone: activeSafeZone !== null,
      safeZoneName: activeSafeZone?.name ?? null,
      sanity: Math.round(this.sanity),
      maxSanity: 100,
      stamina: Math.round(this.stamina),
      maxStamina: 100,
      flashlightBattery: Math.round(this.flashlightBattery),
      maxFlashlightBattery: 100,
      uvBattery: Math.round(this.uvBattery),
      maxUvBattery: 100,
      flashlightOn: this.flashlightOn,
      uvMode: this.uvMode,
      isCrouching:
        this.virtualCrouch || this.keys.has('KeyC') || this.keys.has('ControlLeft'),
      isSprinting:
        this.virtualSprint || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
      isHiding: this.isHiding,
      isDowned: this.downed,
      perspective: this.perspective,
      noiseLevel,
      saltCount: this.saltCount,
      keysInventory: [...this.collectedKeyLabels],
      segelBroken,
      totalSegel: this.rumors.length,
      evidenceCount,
      totalEvidence: this.rumors.length,
      kujangClaimed: this.kujangClaimed,
      raniRescued: this.raniRescued,
      nearestPrompt,
      nearestGhostDist: Math.round(nearestGhostDist),
      nearestGhostName,
      ditoSenseHint,
      elapsedSeconds: Math.round(this.elapsedSeconds),
      fps: this.currentFps,
    });
  }

  private handleResize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver?.disconnect();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onWindowBlur);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
    const dom = this.renderer.domElement;
    dom.removeEventListener('mousedown', this.onMouseDown);
    dom.removeEventListener('contextmenu', this.onContextMenu);
    dom.removeEventListener('touchstart', this.onTouchStart);
    dom.removeEventListener('touchmove', this.onTouchMove);
    dom.removeEventListener('touchend', this.onTouchEnd);
    dom.removeEventListener('touchcancel', this.onTouchEnd);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.audio.dispose();
    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
  }
}
