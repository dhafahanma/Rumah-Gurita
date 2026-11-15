import type {
  AABB,
  DoorData,
  GhostData,
  InteractableItem,
  SafeZone,
  StairZone,
  TreeKind,
  Vec3,
} from './types';
import type { FurnitureKind } from './proceduralModels';

export interface BoxVisual {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  mat:
    | 'wall_out'
    | 'wall_in'
    | 'floor_wood'
    | 'floor_tile'
    | 'floor_roof'
    | 'street'
    | 'parapet'
    | 'metal'
    | 'crumble'
    | 'glass';
  solid?: boolean;
  blocksVision?: boolean;
  tint?: number;
}

export interface NeighborhoodHouseSpec {
  id: string;
  x: number;
  z: number;
  rotY: number; // 0 faces +Z, Math.PI/2 faces +X, -Math.PI/2 faces -X, Math.PI faces -Z
  roofColor: number;
  wallColor: number;
  w: number;
  d: number;
}

export interface TreePlacement {
  x: number;
  z: number;
  kind: TreeKind;
  scale: number;
  tint: number;
}

export interface FurnitureSpec {
  id: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  z: number;
  ry?: number;
  w: number;
  h: number;
  d: number;
}

export const FLOOR_HEIGHT = 4.0;
export const HOUSE_FRONT_Z = 7.5;
export const COMPOUND_GATE_Z = 18.0;

export const STAIR_ZONES: StairZone[] = [
  {
    id: 'stair_ground_to_second',
    minX: -1.65,
    maxX: 1.55,
    minZ: -7.6,
    maxZ: -2.0,
    startZ: -2.0,
    endZ: -7.6,
    startY: 0.0,
    endY: FLOOR_HEIGHT,
  },
  {
    id: 'stair_second_to_roof',
    minX: 1.85,
    maxX: 4.75,
    minZ: -6.8,
    maxZ: -2.0,
    startZ: -2.0,
    endZ: -6.8,
    startY: FLOOR_HEIGHT,
    endY: FLOOR_HEIGHT * 2,
  },
];

// Titik spawn & respawn diperbarui tepat di depan-kanan Warung Ceu Titin di Jalan Sukajadi
export const PLAYER_SPAWN: Vec3 = { x: -2.4, y: 0.0, z: 53.2 };
export const PLAYER_SPAWN_YAW = 0.42;

export const WARUNG_POS = { x: -11.5, z: 49.5 };
export const BILLBOARD_POS = { x: 9.8, z: 41.0, rotY: -0.34 };
export const COURTYARD_POOL_POS = { x: 6.2, z: 12.8 };
export const CARPORT_VEHICLES: { id: string; kind: 'sedan' | 'motor'; x: number; z: number; rotY: number }[] = [
  { id: 'carport_sedan', kind: 'sedan', x: -11.8, z: 13.4, rotY: 0.04 },
  { id: 'carport_motor', kind: 'motor', x: -9.3, z: 11.4, rotY: -0.22 },
];

export const MOSQUE_POS = { x: 29, z: 33 };
export const POS_RONDA_POS = { x: -11.4, z: 34.5 };

export const CART_PLACEMENTS: { id: string; kind: 'nasgor' | 'pecel'; x: number; z: number; rotY: number }[] = [
  { id: 'cart_nasgor', kind: 'nasgor', x: -6.2, z: 31.8, rotY: Math.PI * 0.22 },
  { id: 'cart_pecel', kind: 'pecel', x: 6.2, z: 31.8, rotY: -Math.PI * 0.22 },
];

// Rumah Komplek Sukajadi: kombinasi deretan rumah BERDEMPETAN khas Bandung & rumah TERHALANG POHON
export const NEIGHBORHOOD_HOUSES: NeighborhoodHouseSpec[] = [
  // Deret Barat Berdempetan (saling menempel di samping Rumah Gurita)
  { id: 'house_w_row1', x: -24.5, z: -4.2, rotY: Math.PI / 2, roofColor: 0x5c2c20, wallColor: 0xc2bdb0, w: 9.2, d: 9.0 },
  { id: 'house_w_row2', x: -24.5, z: 4.9, rotY: Math.PI / 2, roofColor: 0x4b3326, wallColor: 0xb0b8b2, w: 9.2, d: 9.0 },
  { id: 'house_w_row3', x: -24.5, z: 14.0, rotY: Math.PI / 2, roofColor: 0x633224, wallColor: 0xc8c0b4, w: 9.2, d: 9.0 },
  { id: 'house_w_mid1', x: -26.0, z: 30.2, rotY: Math.PI / 2, roofColor: 0x523124, wallColor: 0xb7beb8, w: 9.4, d: 8.6 },
  { id: 'house_w_mid2', x: -26.0, z: 39.0, rotY: Math.PI / 2, roofColor: 0x453528, wallColor: 0xc5beb1, w: 9.4, d: 8.6 },
  // Rumah Barat yang sebagian terhalang pepohonan rindang
  { id: 'house_w_tree', x: -34.0, z: 49.5, rotY: Math.PI / 2, roofColor: 0x583022, wallColor: 0xb8bfb6, w: 9.4, d: 8.6 },

  // Deret Timur Berdempetan (sisi timur komplek, tepat di samping compound Rumah Gurita)
  { id: 'house_e_row1', x: 24.5, z: -4.5, rotY: -Math.PI / 2, roofColor: 0x5a2e22, wallColor: 0xc9c2b2, w: 9.2, d: 9.0 },
  { id: 'house_e_row2', x: 24.5, z: 4.6, rotY: -Math.PI / 2, roofColor: 0x4a3428, wallColor: 0xb5bdb6, w: 9.2, d: 9.0 },
  { id: 'house_e_row3', x: 24.5, z: 13.7, rotY: -Math.PI / 2, roofColor: 0x643326, wallColor: 0xc5beb0, w: 9.2, d: 9.0 },
  // Rumah Timur di balik deretan pohon
  { id: 'house_e_tree', x: 29.0, z: 48.0, rotY: -Math.PI / 2, roofColor: 0x4d3124, wallColor: 0xbfc5bd, w: 9.6, d: 8.6 },

  // Deret Selatan Berdempetan sepanjang jalan lintas selatan
  { id: 'house_s_row1', x: -22.2, z: 66.0, rotY: Math.PI, roofColor: 0x542c22, wallColor: 0xb7beb8, w: 9.2, d: 8.2 },
  { id: 'house_s_row2', x: -12.8, z: 66.0, rotY: Math.PI, roofColor: 0x623426, wallColor: 0xc7c0b4, w: 9.2, d: 8.2 },
  { id: 'house_s_row3', x: -3.4, z: 66.0, rotY: Math.PI, roofColor: 0x47382b, wallColor: 0xb8c0b9, w: 9.2, d: 8.2 },
  { id: 'house_s_e1', x: 14.5, z: 66.0, rotY: Math.PI, roofColor: 0x592f24, wallColor: 0xc5beb1, w: 9.4, d: 8.2 },
  { id: 'house_s_e2', x: 24.1, z: 66.0, rotY: Math.PI, roofColor: 0x463226, wallColor: 0xb4bcb6, w: 9.4, d: 8.2 },

  // Rumah gang belakang (utara Rumah Gurita, berdempetan seperti foto udara Bandung)
  { id: 'house_n_back1', x: -20.0, z: -20.5, rotY: 0, roofColor: 0x5a2f22, wallColor: 0xbec3ba, w: 9.0, d: 8.0 },
  { id: 'house_n_back2', x: -10.8, z: -20.5, rotY: 0, roofColor: 0x483227, wallColor: 0xc6bfb2, w: 9.0, d: 8.0 },
  { id: 'house_n_back3', x: 11.2, z: -20.5, rotY: 0, roofColor: 0x613225, wallColor: 0xb9c0b8, w: 9.0, d: 8.0 },
  { id: 'house_n_back4', x: 20.4, z: -20.5, rotY: 0, roofColor: 0x4c3528, wallColor: 0xc5beb0, w: 9.0, d: 8.0 },
];

export const LAMP_POSITIONS: { x: number; z: number; rotY: number }[] = [
  { x: -7.6, z: 20.0, rotY: 0 },
  { x: 7.6, z: 20.0, rotY: Math.PI },
  { x: -7.6, z: 28.0, rotY: 0 },
  { x: 7.6, z: 28.0, rotY: Math.PI },
  { x: -7.6, z: 36.5, rotY: 0 },
  { x: 7.6, z: 36.5, rotY: Math.PI },
  { x: -7.6, z: 42.5, rotY: 0 },
  { x: 7.6, z: 44.5, rotY: Math.PI },
  { x: -7.6, z: 55.5, rotY: 0 },
  { x: 7.6, z: 54.5, rotY: Math.PI },
  { x: -20.0, z: 18.8, rotY: -Math.PI / 2 },
  { x: -35.0, z: 18.8, rotY: -Math.PI / 2 },
  { x: 20.0, z: 18.8, rotY: -Math.PI / 2 },
  { x: 38.0, z: 18.8, rotY: -Math.PI / 2 },
  { x: -22.0, z: 52.5, rotY: -Math.PI / 2 },
  { x: 22.0, z: 52.5, rotY: -Math.PI / 2 },
];

export const TREE_PLACEMENTS: TreePlacement[] = [
  // Sepanjang Jalan Sukajadi kiri & kanan (campuran Mangga, Ketapang, Pinus, Palem — non-bulat)
  { x: -9.2, z: 26.5, kind: 'ketapang', scale: 1.08, tint: 0x1e3322 },
  { x: 9.2, z: 26.5, kind: 'mangga', scale: 1.1, tint: 0x223825 },
  { x: -10.8, z: 41.2, kind: 'palem', scale: 1.06, tint: 0x243b27 },
  { x: 9.4, z: 35.5, kind: 'ketapang', scale: 1.04, tint: 0x1d3020 },
  { x: -9.2, z: 58.0, kind: 'mangga', scale: 1.12, tint: 0x203523 },
  { x: 9.2, z: 49.5, kind: 'pinus', scale: 1.08, tint: 0x182b1e },
  { x: 9.2, z: 58.0, kind: 'palem', scale: 1.1, tint: 0x243a26 },

  // Pohon yang sengaja menutupi / menaungi sebagian rumah warga (terhalang pohon)
  { x: -25.8, z: 47.8, kind: 'mangga', scale: 1.25, tint: 0x1e3321 },
  { x: -25.8, z: 52.2, kind: 'ketapang', scale: 1.2, tint: 0x1a2d1e },
  { x: 21.8, z: 45.8, kind: 'mangga', scale: 1.24, tint: 0x1f3422 },
  { x: 21.8, z: 50.6, kind: 'pinus', scale: 1.22, tint: 0x16281b },
  { x: -17.5, z: -13.5, kind: 'ketapang', scale: 1.2, tint: 0x1a2c1e },
  { x: 17.5, z: -13.5, kind: 'mangga', scale: 1.18, tint: 0x1d3020 },

  // Taman & lereng di sisi halaman Rumah Gurita & Komplek
  { x: -17.4, z: 1.0, kind: 'pinus', scale: 1.24, tint: 0x192b1e },
  { x: -17.4, z: -8.5, kind: 'ketapang', scale: 1.16, tint: 0x1b2e20 },
  { x: -17.4, z: 10.5, kind: 'mangga', scale: 1.08, tint: 0x213624 },
  { x: 17.4, z: 1.0, kind: 'pinus', scale: 1.22, tint: 0x18291d },
  { x: 17.4, z: -8.5, kind: 'mangga', scale: 1.14, tint: 0x1d3021 },
  { x: 17.4, z: 10.5, kind: 'palem', scale: 1.08, tint: 0x233825 },
  { x: -35.0, z: 17.0, kind: 'ketapang', scale: 1.22, tint: 0x1a2b1e },
  { x: -40.0, z: 27.0, kind: 'pinus', scale: 1.28, tint: 0x16261a },
  { x: 40.0, z: 17.0, kind: 'mangga', scale: 1.2, tint: 0x1c2d20 },
  { x: 42.0, z: 33.0, kind: 'palem', scale: 1.2, tint: 0x203424 },

  // Sabuk pepohonan lebat batas bukit belakang & luar komplek
  { x: -48, z: -29, kind: 'pinus', scale: 1.35, tint: 0x142218 },
  { x: -32, z: -29, kind: 'ketapang', scale: 1.28, tint: 0x17261a },
  { x: -16, z: -29, kind: 'pinus', scale: 1.32, tint: 0x152319 },
  { x: 0, z: -29, kind: 'mangga', scale: 1.3, tint: 0x18271c },
  { x: 16, z: -29, kind: 'pinus', scale: 1.3, tint: 0x152218 },
  { x: 32, z: -29, kind: 'ketapang', scale: 1.28, tint: 0x17251a },
  { x: 48, z: -29, kind: 'pinus', scale: 1.35, tint: 0x142218 },
  { x: -46, z: 4, kind: 'mangga', scale: 1.25, tint: 0x18261b },
  { x: -46, z: 42, kind: 'pinus', scale: 1.32, tint: 0x162419 },
  { x: 46, z: 4, kind: 'ketapang', scale: 1.26, tint: 0x17261a },
  { x: 46, z: 42, kind: 'pinus', scale: 1.32, tint: 0x162419 },
  { x: -34, z: 75, kind: 'mangga', scale: 1.22, tint: 0x18271b },
  { x: -12, z: 76, kind: 'ketapang', scale: 1.18, tint: 0x19291d },
  { x: 12, z: 76, kind: 'palem', scale: 1.16, tint: 0x1d2e20 },
  { x: 34, z: 75, kind: 'pinus', scale: 1.26, tint: 0x16251a },
];

export const FURNITURE_SPECS: FurnitureSpec[] = [
  // --- GROUND FLOOR (Y = 0) ---
  { id: 'furn_g_dining', kind: 'dining_set', x: -6.0, y: 0, z: 2.2, w: 2.3, h: 1.0, d: 2.0 },
  { id: 'furn_g_sofa', kind: 'sofa', x: -6.2, y: 0, z: -4.6, w: 2.15, h: 0.95, d: 0.95 },
  { id: 'furn_g_tv', kind: 'tv_stand', x: -6.2, y: 0, z: -7.7, w: 1.75, h: 1.35, d: 0.68 },
  { id: 'furn_g_shelf', kind: 'bookshelf', x: -2.25, y: 0, z: -5.4, ry: -Math.PI / 2, w: 0.5, h: 2.2, d: 1.7 },
  { id: 'furn_g_clock', kind: 'clock', x: -2.25, y: 0, z: -1.8, ry: -Math.PI / 2, w: 0.48, h: 2.25, d: 0.6 },
  { id: 'furn_g_closet_w', kind: 'closet', x: -9.85, y: 0, z: -6.5, ry: Math.PI / 2, w: 0.8, h: 2.2, d: 1.15 },
  { id: 'furn_g_counter', kind: 'counter', x: 6.4, y: 0, z: -7.8, w: 2.7, h: 1.0, d: 0.88 },
  { id: 'furn_g_fridge', kind: 'fridge', x: 9.6, y: 0, z: -7.8, w: 1.0, h: 1.98, d: 0.9 },
  { id: 'furn_g_ktable', kind: 'table', x: 6.4, y: 0, z: -4.2, w: 1.65, h: 1.05, d: 1.05 },
  { id: 'furn_g_closet_k', kind: 'closet', x: 9.85, y: 0, z: -5.4, ry: -Math.PI / 2, w: 0.8, h: 2.2, d: 1.15 },
  { id: 'furn_g_bed_se', kind: 'bed', x: 8.6, y: 0, z: 5.4, w: 1.55, h: 1.0, d: 2.25 },
  { id: 'furn_g_vanity_se', kind: 'vanity', x: 5.8, y: 0, z: 6.85, w: 1.3, h: 1.55, d: 0.6 },
  { id: 'furn_g_closet_se', kind: 'closet', x: 9.85, y: 0, z: 1.4, ry: -Math.PI / 2, w: 0.8, h: 2.2, d: 1.15 },
  // Sofa & meja teras kaca ruang depan lantai dasar (terlihat dari luar dekat kolam renang!)
  { id: 'furn_g_front_sofa', kind: 'sofa', x: 1.1, y: 0, z: 4.8, ry: Math.PI, w: 2.15, h: 0.95, d: 0.95 },

  // --- SECOND FLOOR (Y = 4.0) ---
  { id: 'furn_s_table', kind: 'table', x: -6.2, y: FLOOR_HEIGHT, z: 2.0, w: 1.65, h: 1.05, d: 1.05 },
  { id: 'furn_s_sofa', kind: 'sofa', x: -6.2, y: FLOOR_HEIGHT, z: -0.4, w: 2.15, h: 0.95, d: 0.95 },
  { id: 'furn_s_shelf', kind: 'bookshelf', x: -2.25, y: FLOOR_HEIGHT, z: 4.5, ry: -Math.PI / 2, w: 0.5, h: 2.2, d: 1.7 },
  { id: 'furn_s_closet_hall', kind: 'closet', x: -9.85, y: FLOOR_HEIGHT, z: 5.6, ry: Math.PI / 2, w: 0.8, h: 2.2, d: 1.15 },
  { id: 'furn_s_bed_nw', kind: 'bed', x: -6.8, y: FLOOR_HEIGHT, z: -6.8, w: 1.55, h: 1.0, d: 2.25 },
  { id: 'furn_s_vanity_nw', kind: 'vanity', x: -3.2, y: FLOOR_HEIGHT, z: -7.85, w: 1.3, h: 1.55, d: 0.6 },
  { id: 'furn_s_closet_nw', kind: 'closet', x: -9.85, y: FLOOR_HEIGHT, z: -6.5, ry: Math.PI / 2, w: 0.8, h: 2.2, d: 1.15 },
  { id: 'furn_s_bed_se', kind: 'bed', x: 8.8, y: FLOOR_HEIGHT, z: 5.6, w: 1.55, h: 1.0, d: 2.25 },
  { id: 'furn_s_table_se', kind: 'table', x: 8.4, y: FLOOR_HEIGHT, z: 2.2, w: 1.65, h: 1.05, d: 1.05 },
];

/**
 * Zona Aman tempat hantu dilarang menyerang, menguras Sanity, atau masuk ke dalamnya.
 */
export const SAFE_ZONES: SafeZone[] = [
  {
    id: 'safe_outside',
    name: 'Komplek Sukajadi & Halaman Depan (Zona Aman)',
    minX: -96,
    maxX: 96,
    minY: -1,
    maxY: 3.2,
    minZ: 7.55,
    maxZ: 88,
  },
  {
    id: 'safe_outside_flank_w',
    name: 'Kawasan Komplek Barat (Zona Aman)',
    minX: -96,
    maxX: -12.6,
    minY: -1,
    maxY: 3.2,
    minZ: -38,
    maxZ: 88,
  },
  {
    id: 'safe_outside_flank_e',
    name: 'Kawasan Masjid & Komplek Timur (Zona Aman)',
    minX: 12.6,
    maxX: 96,
    minY: -1,
    maxY: 3.2,
    minZ: -38,
    maxZ: 88,
  },
  {
    id: 'safe_ground_bay',
    name: 'Ceruk Barat Lantai 1 (Zona Aman)',
    minX: -12.3,
    maxX: -10.3,
    minY: -0.5,
    maxY: 3.4,
    minZ: -1.6,
    maxZ: 1.6,
  },
  {
    id: 'safe_second_bay',
    name: 'Ceruk Barat Lantai 2 (Zona Aman)',
    minX: -12.3,
    maxX: -10.3,
    minY: 3.6,
    maxY: 7.4,
    minZ: -1.6,
    maxZ: 1.6,
  },
  {
    id: 'safe_stair_g2_landing',
    name: 'Tangga Lantai 1–2 (Zona Aman)',
    minX: -1.75,
    maxX: 1.65,
    minY: -0.5,
    maxY: 7.2,
    minZ: -8.3,
    maxZ: -1.9,
  },
  {
    id: 'safe_stair_2r_landing',
    name: 'Tangga Lantai 2–Atap (Zona Aman)',
    minX: 1.95,
    maxX: 4.7,
    minY: 3.6,
    maxY: 11.4,
    minZ: -8.3,
    maxZ: -1.9,
  },
  {
    id: 'safe_kujang_shrine',
    name: 'Altar Kujang Pamungkas (Zona Aman)',
    minX: 6.1,
    maxX: 10.3,
    minY: 7.5,
    maxY: 11.5,
    minZ: -1.1,
    maxZ: 2.7,
  },
];

export function buildLevelGeometry(): {
  visuals: BoxVisual[];
  colliders: AABB[];
} {
  const visuals: BoxVisual[] = [];
  const colliders: AABB[] = [];

  const pushBox = (
    id: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: BoxVisual['mat'],
    solid = true,
    blocksVision = true,
    tint?: number
  ) => {
    visuals.push({ id, x, y, z, w, h, d, mat, solid, blocksVision, tint });
    if (solid) {
      colliders.push({
        id,
        minX: x - w * 0.5,
        maxX: x + w * 0.5,
        minY: y - h * 0.5,
        maxY: y + h * 0.5,
        minZ: z - d * 0.5,
        maxZ: z + d * 0.5,
        blocksVision,
      });
    }
  };

  const pushSolidCollider = (
    id: string,
    x: number,
    minY: number,
    z: number,
    w: number,
    h: number,
    d: number,
    blocksVision = true
  ) => {
    colliders.push({
      id,
      minX: x - w * 0.5,
      maxX: x + w * 0.5,
      minY,
      maxY: minY + h,
      minZ: z - d * 0.5,
      maxZ: z + d * 0.5,
      blocksVision,
    });
  };

  // ==================== OUTSIDE / DUNIA SUKAJADI DIPERLUAS ====================
  pushBox('ground_terrain', 0, -0.22, 24, 210, 0.3, 155, 'parapet', false, false);
  pushBox('road_main_ns', 0, -0.1, 49, 11.2, 0.14, 62, 'street', false, false);
  pushBox('road_cross_north', 0, -0.1, 22.5, 138, 0.14, 8.2, 'street', false, false);
  pushBox('road_cross_south', 0, -0.1, 56.5, 138, 0.14, 8.2, 'street', false, false);

  // Pelataran halaman dalam pagar Rumah Gurita (Ground Level: Kolam Renang, Carport & Jalan Masuk)
  pushBox('yard_gurita', 0.2, -0.09, 3.8, 30.8, 0.14, 28.8, 'floor_tile', false, false);
  pushBox('carport_pad', -11.2, -0.07, 13.0, 6.6, 0.14, 7.6, 'street', false, false);

  // Pagar compound Rumah Gurita (Z = 18.0) dengan Gerbang Utama (-6.8..-4.2) & Celah Pagar Barat (-13.2..-11.4)
  pushBox('fence_front_w', -14.2, 0.55, COMPOUND_GATE_Z, 2.0, 1.1, 0.28, 'parapet', true, false);
  pushBox('fence_front_mid', -9.1, 0.55, COMPOUND_GATE_Z, 4.6, 1.1, 0.28, 'parapet', true, false);
  pushBox('fence_front_e', 5.5, 0.55, COMPOUND_GATE_Z, 19.4, 1.1, 0.28, 'parapet', true, false);
  pushBox('fence_side_w', -15.2, 1.05, 3.75, 0.28, 2.1, 28.5, 'parapet', true, true);
  pushBox('fence_side_e', 15.2, 1.05, 3.75, 0.28, 2.1, 28.5, 'parapet', true, true);
  pushBox('fence_back', 0, 1.05, -10.5, 30.6, 2.1, 0.28, 'parapet', true, true);

  // Rumah Tetangga Komplek (berdempetan & terhalang pohon)
  for (const h of NEIGHBORHOOD_HOUSES) {
    const hw = h.w * 0.5;
    const hd = h.d * 0.5;
    const t = 0.28;
    const wt = h.wallColor;
    pushBox(`${h.id}_floor`, h.x, -0.02, h.z, h.w, 0.16, h.d, 'floor_tile', false, false);
    if (h.rotY === Math.PI / 2) {
      pushBox(`${h.id}_w_back`, h.x - hw, 1.75, h.z, t, 3.5, h.d, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_n`, h.x, 1.75, h.z - hd, h.w, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_s`, h.x, 1.75, h.z + hd, h.w, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_fn`, h.x + hw, 1.75, h.z - (hd + 0.7) * 0.5, t, 3.5, hd - 0.7, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_fs`, h.x + hw, 1.75, h.z + (hd + 0.7) * 0.5, t, 3.5, hd - 0.7, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_lintel`, h.x + hw, 2.95, h.z, t, 1.1, 1.4, 'wall_out', true, true, wt);
      pushSolidCollider(`${h.id}_col_p1`, h.x + hw + 1.2, 0, h.z - 1.4, 0.3, 2.7, 0.3, false);
      pushSolidCollider(`${h.id}_col_p2`, h.x + hw + 1.2, 0, h.z + 1.4, 0.3, 2.7, 0.3, false);
    } else if (h.rotY === -Math.PI / 2) {
      pushBox(`${h.id}_w_back`, h.x + hw, 1.75, h.z, t, 3.5, h.d, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_n`, h.x, 1.75, h.z - hd, h.w, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_s`, h.x, 1.75, h.z + hd, h.w, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_fn`, h.x - hw, 1.75, h.z - (hd + 0.7) * 0.5, t, 3.5, hd - 0.7, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_fs`, h.x - hw, 1.75, h.z + (hd + 0.7) * 0.5, t, 3.5, hd - 0.7, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_lintel`, h.x - hw, 2.95, h.z, t, 1.1, 1.4, 'wall_out', true, true, wt);
      pushSolidCollider(`${h.id}_col_p1`, h.x - hw - 1.2, 0, h.z - 1.4, 0.3, 2.7, 0.3, false);
      pushSolidCollider(`${h.id}_col_p2`, h.x - hw - 1.2, 0, h.z + 1.4, 0.3, 2.7, 0.3, false);
    } else if (h.rotY === 0) {
      pushBox(`${h.id}_w_back`, h.x, 1.75, h.z - hd, h.w, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_w`, h.x - hw, 1.75, h.z, t, 3.5, h.d, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_e`, h.x + hw, 1.75, h.z, t, 3.5, h.d, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_fw`, h.x - (hw + 0.7) * 0.5, 1.75, h.z + hd, hw - 0.7, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_fe`, h.x + (hw + 0.7) * 0.5, 1.75, h.z + hd, hw - 0.7, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_lintel`, h.x, 2.95, h.z + hd, 1.4, 1.1, t, 'wall_out', true, true, wt);
      pushSolidCollider(`${h.id}_col_p1`, h.x - 1.4, 0, h.z + hd + 1.2, 0.3, 2.7, 0.3, false);
      pushSolidCollider(`${h.id}_col_p2`, h.x + 1.4, 0, h.z + hd + 1.2, 0.3, 2.7, 0.3, false);
    } else {
      pushBox(`${h.id}_w_back`, h.x, 1.75, h.z + hd, h.w, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_w`, h.x - hw, 1.75, h.z, t, 3.5, h.d, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_e`, h.x + hw, 1.75, h.z, t, 3.5, h.d, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_fw`, h.x - (hw + 0.7) * 0.5, 1.75, h.z - hd, hw - 0.7, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_fe`, h.x + (hw + 0.7) * 0.5, 1.75, h.z - hd, hw - 0.7, 3.5, t, 'wall_out', true, true, wt);
      pushBox(`${h.id}_w_lintel`, h.x, 2.95, h.z - hd, 1.4, 1.1, t, 'wall_out', true, true, wt);
      pushSolidCollider(`${h.id}_col_p1`, h.x - 1.4, 0, h.z - hd - 1.2, 0.3, 2.7, 0.3, false);
      pushSolidCollider(`${h.id}_col_p2`, h.x + 1.4, 0, h.z - hd - 1.2, 0.3, 2.7, 0.3, false);
    }
  }

  // Masjid Komplek Sukajadi
  {
    const mx = MOSQUE_POS.x;
    const mz = MOSQUE_POS.z;
    const mt = 0xe3e4da;
    pushBox('masjid_floor', mx, 0.02, mz, 11.4, 0.2, 11.4, 'floor_tile', false, false);
    pushBox('masjid_wall_e', mx + 5.2, 2.1, mz, 0.3, 4.2, 10.4, 'wall_out', true, true, mt);
    pushBox('masjid_wall_n', mx, 2.1, mz - 5.2, 10.4, 4.2, 0.3, 'wall_out', true, true, mt);
    pushBox('masjid_wall_s', mx, 2.1, mz + 5.2, 10.4, 4.2, 0.3, 'wall_out', true, true, mt);
    pushBox('masjid_wall_wn', mx - 5.2, 2.1, mz - 3.0, 0.3, 4.2, 4.4, 'wall_out', true, true, mt);
    pushBox('masjid_wall_ws', mx - 5.2, 2.1, mz + 3.0, 0.3, 4.2, 4.4, 'wall_out', true, true, mt);
    pushBox('masjid_wall_w_lintel', mx - 5.2, 3.4, mz, 0.3, 1.6, 1.6, 'wall_out', true, true, mt);
    for (const pz of [-3.6, -1.6, 1.6, 3.6]) {
      pushSolidCollider(`masjid_pil_${pz}`, mx - 6.3, 0, mz + pz, 0.45, 4.1, 0.45, false);
    }
    pushSolidCollider('masjid_minaret_base', mx - 5.4, 0, mz - 5.4, 1.8, 8.5, 1.8, true);
  }

  // ==================== GROUND FLOOR RUMAH GURITA (21m x 16m, Y = 0 .. 4.0) ====================
  pushBox('g_floor_west', -6.15, -0.05, -0.5, 8.7, 0.16, 16.0, 'floor_wood', false, false);
  pushBox('g_floor_east', 4.35, -0.05, -0.5, 12.3, 0.16, 16.0, 'floor_tile', false, false);

  // Dinding Luar Ground (X: -10.5..+10.5, Z: -8.5..+7.5, tinggi 3.95m)
  pushBox('g_wall_north', 0, 1.95, -8.5, 21.28, 3.95, 0.28, 'wall_out');
  pushBox('g_wall_east', 10.5, 1.95, -0.5, 0.28, 3.95, 16.0, 'wall_out');
  pushBox('g_wall_west_n', -10.5, 1.95, -5.05, 0.28, 3.95, 7.1, 'wall_out');
  pushBox('g_wall_west_s', -10.5, 1.95, 4.55, 0.28, 3.95, 6.1, 'wall_out');
  pushBox('g_bay_w_back', -12.3, 1.95, 0.0, 0.25, 3.95, 3.4, 'wall_out');
  pushBox('g_bay_w_n', -11.4, 1.95, -1.6, 1.9, 3.95, 0.25, 'wall_out');
  pushBox('g_bay_w_s', -11.4, 1.95, 1.6, 1.9, 3.95, 0.25, 'wall_out');

  // Dinding Selatan dengan pintu utama lebar & bersih (X: -6.3 .. -4.7)
  pushBox('g_wall_south_w', -8.4, 1.95, 7.5, 4.2, 3.95, 0.28, 'wall_out');
  pushBox('g_wall_south_e', 2.9, 1.95, 7.5, 15.2, 3.95, 0.28, 'wall_out');
  pushBox('g_wall_south_lintel', -5.5, 3.2, 7.5, 1.6, 1.45, 0.28, 'wall_out');
  for (const px of [-6.75, -4.25, 0.2, 6.2]) {
    pushSolidCollider(`facade_pillar_${px}`, px, 0, 7.75, 0.5, 3.95, 0.5, false);
  }

  // Sekat Interior Ground + Kusen Pintu Tangga Lantai 1 -> 2 (X: -0.8..+0.7, Z = -2.0)
  pushBox('g_part_lounge_n', -1.8, 1.95, -3.95, 0.24, 3.95, 9.1, 'wall_in');
  pushBox('g_part_lounge_s', -1.8, 1.95, 4.85, 0.24, 3.95, 5.3, 'wall_in');
  pushBox('g_part_lounge_lintel', -1.8, 3.2, 1.4, 0.24, 1.45, 1.6, 'wall_in');

  pushBox('g_part_kitchen_w', 2.0, 1.95, -0.5, 0.6, 3.95, 0.24, 'wall_in');
  pushBox('g_part_kitchen_e', 7.15, 1.95, -0.5, 6.7, 3.95, 0.24, 'wall_in');
  pushBox('g_part_kitchen_lintel', 3.05, 3.2, -0.5, 1.5, 1.45, 0.24, 'wall_in');

  pushBox('g_part_bath_n', 4.2, 1.95, 0.65, 0.24, 3.95, 2.3, 'wall_in');
  pushBox('g_part_bath_s', 4.2, 1.95, 5.4, 0.24, 3.95, 4.2, 'wall_in');
  pushBox('g_part_bath_lintel', 4.2, 3.2, 2.55, 0.24, 1.45, 1.5, 'wall_in');

  pushBox('g_stair_wall_e', 1.65, 1.95, -5.25, 0.24, 3.95, 6.5, 'wall_in');
  pushBox('g_stair_front_w', -1.3, 1.95, -2.0, 1.0, 3.95, 0.24, 'wall_in');
  pushBox('g_stair_front_e', 1.18, 1.95, -2.0, 0.94, 3.95, 0.24, 'wall_in');
  pushBox('g_stair_front_lintel', -0.05, 3.2, -2.0, 1.5, 1.45, 0.24, 'wall_in');

  // ==================== SECOND FLOOR RUMAH GURITA (Y = 4.0 .. 8.0) ====================
  pushBox('s_floor_west', -6.075, 3.92, -0.5, 8.85, 0.16, 16.0, 'floor_wood', false, false);
  pushBox('s_floor_south', -0.05, 3.92, 2.75, 3.2, 0.16, 9.5, 'floor_wood', false, false);
  pushBox('s_floor_north_cap', -0.05, 3.92, -8.05, 3.2, 0.16, 0.9, 'floor_wood', false, false);
  pushBox('s_floor_east', 6.025, 3.92, -0.5, 8.95, 0.16, 16.0, 'floor_tile', false, false);

  // Dinding Luar Lantai 2
  pushBox('s_wall_north', 0, 5.95, -8.5, 21.28, 3.95, 0.28, 'wall_out');
  pushBox('s_wall_south', 0, 5.95, 7.5, 21.28, 3.95, 0.28, 'wall_out');
  pushBox('s_wall_east', 10.5, 5.95, -0.5, 0.28, 3.95, 16.0, 'wall_out');
  pushBox('s_wall_west_n', -10.5, 5.95, -5.05, 0.28, 3.95, 7.1, 'wall_out');
  pushBox('s_wall_west_s', -10.5, 5.95, 4.55, 0.28, 3.95, 6.1, 'wall_out');
  pushBox('s_bay_w_back', -12.3, 5.95, 0.0, 0.25, 3.95, 3.4, 'wall_out');
  pushBox('s_bay_w_n', -11.4, 5.95, -1.6, 1.9, 3.95, 0.25, 'wall_out');
  pushBox('s_bay_w_s', -11.4, 5.95, 1.6, 1.9, 3.95, 0.25, 'wall_out');

  // Pagar lubang tangga 1 -> 2
  pushBox('s_rail_w', -1.65, 4.5, -4.8, 0.16, 0.95, 5.6, 'parapet', true, false);
  pushBox('s_rail_e', 1.55, 4.5, -4.8, 0.16, 0.95, 5.6, 'parapet', true, false);
  pushBox('s_rail_s', -0.05, 4.5, -1.95, 3.2, 0.95, 0.16, 'parapet', true, false);

  // Akses Tangga Atap Lantai 2 (X: 2.4..3.9, Z = -2.0)
  pushBox('s_stair_roof_side_w', 2.075, 5.95, -2.0, 0.65, 3.95, 0.24, 'wall_in');
  pushBox('s_stair_roof_side_e', 4.375, 5.95, -2.0, 0.95, 3.95, 0.24, 'wall_in');
  pushBox('s_stair_roof_lintel', 3.15, 7.2, -2.0, 1.5, 1.45, 0.24, 'wall_in');
  pushBox('s_stair_wall_e', 4.85, 5.95, -5.25, 0.24, 3.95, 6.5, 'wall_in');

  // Sekat Interior Lantai 2
  pushBox('s_part_lounge_n', -1.8, 5.95, -4.0, 0.24, 3.95, 9.0, 'wall_in');
  pushBox('s_part_lounge_s', -1.8, 5.95, 4.8, 0.24, 3.95, 5.4, 'wall_in');
  pushBox('s_part_lounge_lintel', -1.8, 7.2, 1.3, 0.24, 1.45, 1.6, 'wall_in');

  pushBox('s_part_nw_w', -8.35, 5.95, -2.6, 4.3, 3.95, 0.24, 'wall_in');
  pushBox('s_part_nw_e', -3.25, 5.95, -2.6, 2.9, 3.95, 0.24, 'wall_in');
  pushBox('s_part_nw_lintel', -5.45, 7.2, -2.6, 1.5, 1.45, 0.24, 'wall_in');

  pushBox('s_part_se_w', 2.3, 5.95, 0.5, 1.0, 3.95, 0.24, 'wall_in');
  pushBox('s_part_se_e', 7.4, 5.95, 0.5, 6.2, 3.95, 0.24, 'wall_in');
  pushBox('s_part_se_lintel', 3.55, 7.2, 0.5, 1.5, 1.45, 0.24, 'wall_in');

  // Tembok Rapuh Lantai 2 menutup penuh ruangan rahasia Timur (X = 6.2, Z: 0.6..7.4)
  pushBox('s_crumble_wall', 6.2, 5.95, 4.0, 0.28, 3.95, 6.8, 'crumble', true, true);

  // ==================== ROOFTOP (Y = 8.0) + RUMAH TANGGA ATAP BERPINTU ====================
  pushBox('r_floor_west', -4.325, 7.92, -0.5, 12.35, 0.16, 16.0, 'floor_roof', false, false);
  pushBox('r_floor_south', 3.3, 7.92, 2.75, 2.9, 0.16, 9.5, 'floor_roof', false, false);
  // Landing datar luas di puncak tangga atap (Z = -8.5 .. -6.8) agar jalur keluar ke Rooftop lega!
  pushBox('r_floor_north_cap', 3.3, 7.92, -7.65, 2.9, 0.16, 1.7, 'floor_roof', false, false);
  pushBox('r_floor_east', 7.625, 7.92, -0.5, 5.75, 0.16, 16.0, 'floor_roof', false, false);

  pushBox('r_para_n', 0, 8.58, -8.5, 21.28, 1.2, 0.28, 'parapet');
  pushBox('r_para_s', 0, 8.58, 7.5, 21.28, 1.2, 0.28, 'parapet');
  pushBox('r_para_w', -10.5, 8.58, -0.5, 0.28, 1.2, 16.0, 'parapet');
  pushBox('r_para_e', 10.5, 8.58, -0.5, 0.28, 1.2, 16.0, 'parapet');

  // Rumah Tangga Rooftop (Penthouse tangga): dinding E/S/W + bukaan PINTU keluar Barat di Z: -8.3..-6.8 (tidak tembok buntu!)
  pushBox('r_pent_wall_e', 4.75, 9.45, -5.2, 0.24, 2.9, 6.6, 'wall_out');
  pushBox('r_pent_wall_s', 3.3, 9.45, -1.95, 2.9, 2.9, 0.24, 'wall_out');
  pushBox('r_pent_wall_ws', 1.85, 9.45, -4.375, 0.24, 2.9, 4.85, 'wall_out');
  pushBox('r_pent_door_lintel', 1.85, 10.68, -7.55, 0.24, 0.44, 1.5, 'wall_out');
  pushBox('r_pent_roof', 3.3, 10.95, -5.2, 3.2, 0.2, 6.8, 'wall_out', false, false);

  // Kolam Rooftop (pusat -6.6, -5.0)
  pushBox('r_pool_rim_n', -6.6, 8.25, -6.8, 4.4, 0.55, 0.28, 'parapet');
  pushBox('r_pool_rim_s', -6.6, 8.25, -3.2, 4.4, 0.55, 0.28, 'parapet');
  pushBox('r_pool_rim_w', -8.7, 8.25, -5.0, 0.28, 0.55, 3.6, 'parapet');
  pushBox('r_pool_rim_e', -4.5, 8.25, -5.0, 0.28, 0.55, 3.6, 'parapet');

  // Ruang Rahasia Pusaka Kujang Rooftop
  pushBox('r_shrine_wall_n', 8.25, 9.0, -1.2, 4.5, 2.0, 0.26, 'parapet');
  pushBox('r_shrine_wall_s', 8.25, 9.0, 2.8, 4.5, 2.0, 0.26, 'parapet');
  pushBox('r_crumble_wall', 6.0, 9.0, 0.8, 0.28, 2.0, 4.0, 'crumble', true, true);

  // ==================== COLLIDER SOLID UNTUK SEMUA OBJEK DUNIA & FURNITUR ====================
  // 1. Warung Ceu Titin (dinding belakang/sisi, counter, meja makan, bangku anak muda, tiang depan)
  pushSolidCollider('warung_back', WARUNG_POS.x - 2.5, 0, WARUNG_POS.z, 0.36, 3.1, 6.8, true);
  pushSolidCollider('warung_side_n', WARUNG_POS.x - 0.7, 0, WARUNG_POS.z - 3.3, 3.8, 3.1, 0.36, true);
  pushSolidCollider('warung_side_s', WARUNG_POS.x - 0.7, 0, WARUNG_POS.z + 3.3, 3.8, 3.1, 0.36, true);
  pushSolidCollider('warung_counter', WARUNG_POS.x - 0.35, 0, WARUNG_POS.z, 0.92, 1.5, 4.65, false);
  pushSolidCollider('warung_table_n', WARUNG_POS.x + 1.85, 0, WARUNG_POS.z - 1.5, 0.8, 0.85, 2.15, false);
  pushSolidCollider('warung_table_s', WARUNG_POS.x + 1.85, 0, WARUNG_POS.z + 1.5, 0.8, 0.85, 2.15, false);
  pushSolidCollider('warung_bench_n', WARUNG_POS.x + 2.58, 0, WARUNG_POS.z - 1.5, 0.48, 0.55, 2.05, false);
  pushSolidCollider('warung_bench_s', WARUNG_POS.x + 2.58, 0, WARUNG_POS.z + 1.5, 0.48, 0.55, 2.05, false);
  for (const pz of [-3.3, 0, 3.3]) {
    pushSolidCollider(`warung_post_${pz}`, WARUNG_POS.x + 3.45, 0, WARUNG_POS.z + pz, 0.25, 3.2, 0.25, false);
  }

  // 2. Baliho Windah Basudara (2 tiang baja solid agar tidak tertembus)
  const bCos = Math.cos(BILLBOARD_POS.rotY);
  const bSin = Math.sin(BILLBOARD_POS.rotY);
  for (const lx of [-1.8, 1.8]) {
    pushSolidCollider(
      `billboard_leg_${lx}`,
      BILLBOARD_POS.x + lx * bCos,
      0,
      BILLBOARD_POS.z - lx * bSin,
      0.72,
      6.6,
      0.72,
      false
    );
  }

  // 3. Kolam Renang Halaman Depan Rumah Gurita + Patung Singa Taman + Tempat Parkir (Carport)
  pushSolidCollider(
    'courtyard_pool_basin',
    COURTYARD_POOL_POS.x - 0.35,
    0,
    COURTYARD_POOL_POS.z,
    10.4,
    1.15,
    6.1,
    false
  );
  for (const v of CARPORT_VEHICLES) {
    if (v.kind === 'sedan') {
      pushSolidCollider(v.id, v.x, 0, v.z, 1.86, 1.65, 4.18, true);
    } else {
      pushSolidCollider(v.id, v.x, 0, v.z, 0.78, 1.15, 1.95, false);
    }
  }

  // 4. Gerobak Pedagang (Nasi Goreng & Pecel Lele)
  for (const c of CART_PLACEMENTS) {
    pushSolidCollider(c.id, c.x, 0, c.z, 2.1, 2.45, 1.35, true);
  }

  // 5. Pos Ronda (4 tiang, dinding belakang, & bangku kayu — pemain tidak tembus!)
  pushSolidCollider('pos_ronda_back', POS_RONDA_POS.x - 1.45, 0, POS_RONDA_POS.z, 0.3, 2.6, 3.0, true);
  pushSolidCollider('pos_ronda_bench', POS_RONDA_POS.x - 0.95, 0, POS_RONDA_POS.z, 0.72, 0.75, 2.45, false);
  for (const sx of [-1.45, 1.45]) {
    for (const sz of [-1.25, 1.25]) {
      pushSolidCollider(`pos_ronda_post_${sx}_${sz}`, POS_RONDA_POS.x + sx, 0, POS_RONDA_POS.z + sz, 0.28, 2.6, 0.28, false);
    }
  }

  // 6. Semua NPC Luar (solid agar karakter tidak tembus NPC)
  pushSolidCollider('npc_col_satpam', -9.1, 0, 33.7, 0.62, 1.75, 0.62, false);
  pushSolidCollider('npc_col_nasgor', -4.8, 0, 31.3, 0.62, 1.75, 0.62, false);
  pushSolidCollider('npc_col_pecel', 4.8, 0, 31.3, 0.62, 1.75, 0.62, false);
  pushSolidCollider('npc_col_warung_ibu', WARUNG_POS.x - 1.35, 0, WARUNG_POS.z, 0.62, 1.75, 0.62, false);
  pushSolidCollider('npc_col_pemuda_1', WARUNG_POS.x + 2.55, 0, WARUNG_POS.z - 1.5, 0.6, 1.45, 0.6, false);
  pushSolidCollider('npc_col_pemuda_2', WARUNG_POS.x + 2.55, 0, WARUNG_POS.z + 1.2, 0.6, 1.45, 0.6, false);
  pushSolidCollider('npc_col_pemuda_3', WARUNG_POS.x + 3.7, 0, WARUNG_POS.z + 2.4, 0.6, 1.75, 0.6, false);

  // 7. Batang semua Pohon & Tiang Lampu Jalan
  TREE_PLACEMENTS.forEach((t, idx) => {
    const trunkSize = 0.68 * t.scale;
    pushSolidCollider(`tree_trunk_${idx}`, t.x, 0, t.z, trunkSize, 3.8, trunkSize, false);
  });
  LAMP_POSITIONS.forEach((l, idx) => {
    pushSolidCollider(`lamp_pole_${idx}`, l.x, 0, l.z, 0.42, 5.2, 0.42, false);
  });

  // 8. Landmark Rooftop (Alas Patung Gurita, Menara Radio, Pedestal Kujang)
  pushSolidCollider('r_octopus_base', -6.8, FLOOR_HEIGHT * 2, 4.2, 4.4, 3.8, 4.4, true);
  pushSolidCollider('r_radio_tower_base', -0.4, FLOOR_HEIGHT * 2, -6.4, 1.35, 3.6, 1.35, true);
  pushSolidCollider('r_kujang_pedestal', 8.4, FLOOR_HEIGHT * 2, 0.8, 1.1, 1.8, 1.1, false);

  // 9. Semua Furnitur Interior (sinkron 1:1 dengan visual 3D)
  for (const f of FURNITURE_SPECS) {
    pushSolidCollider(f.id, f.x, f.y, f.z, f.w, f.h, f.d, f.h >= 1.6);
  }

  return { visuals, colliders };
}

/**
 * Semua pintu berengsel yang dapat dibuka/tutup dengan animasi [E]
 * (Gerbang Utama Courtyard + Rumah Gurita + Tangga Atap + Komplek + Masjid).
 */
export function createInitialDoors(): DoorData[] {
  const doors: DoorData[] = [
    // --- GERBANG HALAMAN DALAM RUMAH GURITA ---
    {
      id: 'door_gerbang_utama',
      label: 'Gerbang Utama Halaman Rumah Gurita',
      floor: 'outside',
      hingePos: { x: -6.8, y: 0, z: COMPOUND_GATE_Z },
      width: 2.6,
      height: 2.0,
      thickness: 0.14,
      closedAngle: 0,
      openAngle: Math.PI * 0.48,
      currentAngle: 0,
      targetAngle: 0,
      isOpen: false,
      closedCenter: { x: -5.5, y: 1.0, z: COMPOUND_GATE_Z },
      closedSize: { x: 2.6, y: 2.0, z: 0.24 },
    },

    // --- RUMAH GURITA LANTAI DASAR ---
    {
      id: 'door_main_entry',
      label: 'Pintu Utama Rumah Gurita',
      floor: 'ground',
      hingePos: { x: -6.3, y: 0, z: HOUSE_FRONT_Z },
      width: 1.6,
      height: 2.48,
      thickness: 0.12,
      closedAngle: 0,
      openAngle: Math.PI * 0.48,
      currentAngle: 0,
      targetAngle: 0,
      isOpen: false,
      closedCenter: { x: -5.5, y: 1.24, z: HOUSE_FRONT_Z },
      closedSize: { x: 1.6, y: 2.48, z: 0.2 },
    },
    {
      id: 'door_g_stair',
      label: 'Pintu Tangga Lantai 2',
      floor: 'ground',
      hingePos: { x: -0.8, y: 0, z: -2.0 },
      width: 1.5,
      height: 2.48,
      thickness: 0.12,
      closedAngle: 0,
      openAngle: -Math.PI * 0.48,
      currentAngle: 0,
      targetAngle: 0,
      isOpen: false,
      closedCenter: { x: -0.05, y: 1.24, z: -2.0 },
      closedSize: { x: 1.5, y: 2.48, z: 0.2 },
    },
    {
      id: 'door_g_lounge',
      label: 'Pintu Ruang Tengah',
      floor: 'ground',
      hingePos: { x: -1.8, y: 0, z: 0.6 },
      width: 1.6,
      height: 2.48,
      thickness: 0.12,
      closedAngle: -Math.PI / 2,
      openAngle: -Math.PI * 0.04,
      currentAngle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      isOpen: false,
      closedCenter: { x: -1.8, y: 1.24, z: 1.4 },
      closedSize: { x: 0.2, y: 2.48, z: 1.6 },
    },
    {
      id: 'door_g_kitchen',
      label: 'Pintu Dapur Utara',
      floor: 'ground',
      hingePos: { x: 2.3, y: 0, z: -0.5 },
      width: 1.5,
      height: 2.48,
      thickness: 0.12,
      closedAngle: 0,
      openAngle: Math.PI * 0.48,
      currentAngle: 0,
      targetAngle: 0,
      isOpen: false,
      lockedKeyId: 'key_dapur',
      lockedKeyLabel: 'Kunci Dapur',
      closedCenter: { x: 3.05, y: 1.24, z: -0.5 },
      closedSize: { x: 1.5, y: 2.48, z: 0.2 },
    },
    {
      id: 'door_g_bath',
      label: 'Pintu Kamar Tenggara',
      floor: 'ground',
      hingePos: { x: 4.2, y: 0, z: 1.8 },
      width: 1.5,
      height: 2.48,
      thickness: 0.12,
      closedAngle: -Math.PI / 2,
      openAngle: -Math.PI * 0.96,
      currentAngle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      isOpen: false,
      closedCenter: { x: 4.2, y: 1.24, z: 2.55 },
      closedSize: { x: 0.2, y: 2.48, z: 1.5 },
    },

    // --- RUMAH GURITA LANTAI 2 ---
    {
      id: 'door_s_lounge',
      label: 'Pintu Ruang Keluarga Lt.2',
      floor: 'second',
      hingePos: { x: -1.8, y: FLOOR_HEIGHT, z: 0.5 },
      width: 1.6,
      height: 2.48,
      thickness: 0.12,
      closedAngle: -Math.PI / 2,
      openAngle: -Math.PI * 0.04,
      currentAngle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      isOpen: false,
      closedCenter: { x: -1.8, y: FLOOR_HEIGHT + 1.24, z: 1.3 },
      closedSize: { x: 0.2, y: 2.48, z: 1.6 },
    },
    {
      id: 'door_s_nw',
      label: 'Pintu Kamar Utama Lt.2',
      floor: 'second',
      hingePos: { x: -6.2, y: FLOOR_HEIGHT, z: -2.6 },
      width: 1.5,
      height: 2.48,
      thickness: 0.12,
      closedAngle: 0,
      openAngle: Math.PI * 0.48,
      currentAngle: 0,
      targetAngle: 0,
      isOpen: false,
      lockedKeyId: 'key_kamar2',
      lockedKeyLabel: 'Kunci Kamar Lt.2',
      closedCenter: { x: -5.45, y: FLOOR_HEIGHT + 1.24, z: -2.6 },
      closedSize: { x: 1.5, y: 2.48, z: 0.2 },
    },
    {
      id: 'door_s_se',
      label: 'Pintu Kamar Timur Lt.2',
      floor: 'second',
      hingePos: { x: 2.8, y: FLOOR_HEIGHT, z: 0.5 },
      width: 1.5,
      height: 2.48,
      thickness: 0.12,
      closedAngle: 0,
      openAngle: -Math.PI * 0.48,
      currentAngle: 0,
      targetAngle: 0,
      isOpen: false,
      closedCenter: { x: 3.55, y: FLOOR_HEIGHT + 1.24, z: 0.5 },
      closedSize: { x: 1.5, y: 2.48, z: 0.2 },
    },
    {
      id: 'door_s_roof',
      label: 'Pintu Tangga Menuju Rooftop',
      floor: 'second',
      hingePos: { x: 2.4, y: FLOOR_HEIGHT, z: -2.0 },
      width: 1.5,
      height: 2.48,
      thickness: 0.12,
      closedAngle: 0,
      openAngle: -Math.PI * 0.48,
      currentAngle: 0,
      targetAngle: 0,
      isOpen: false,
      lockedKeyId: 'key_atap',
      lockedKeyLabel: 'Kunci Pintu Atap',
      closedCenter: { x: 3.15, y: FLOOR_HEIGHT + 1.24, z: -2.0 },
      closedSize: { x: 1.5, y: 2.48, z: 0.2 },
    },

    // --- PINTU KELUAR TANGGA ROOFTOP (tidak buntu tembok!) ---
    {
      id: 'door_roof_exit',
      label: 'Pintu Keluar Dek Rooftop',
      floor: 'roof',
      hingePos: { x: 1.85, y: FLOOR_HEIGHT * 2, z: -6.8 },
      width: 1.5,
      height: 2.48,
      thickness: 0.12,
      closedAngle: Math.PI / 2,
      openAngle: Math.PI * 0.98,
      currentAngle: Math.PI / 2,
      targetAngle: Math.PI / 2,
      isOpen: false,
      closedCenter: { x: 1.85, y: FLOOR_HEIGHT * 2 + 1.24, z: -7.55 },
      closedSize: { x: 0.2, y: 2.48, z: 1.5 },
    },

    // --- MASJID & RUMAH TETANGGA ---
    {
      id: 'door_masjid',
      label: 'Pintu Masjid Al-Ikhlas',
      floor: 'outside',
      hingePos: { x: MOSQUE_POS.x - 5.2, y: 0.12, z: MOSQUE_POS.z - 0.8 },
      width: 1.6,
      height: 2.5,
      thickness: 0.12,
      closedAngle: -Math.PI / 2,
      openAngle: -Math.PI * 0.96,
      currentAngle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      isOpen: false,
      closedCenter: { x: MOSQUE_POS.x - 5.2, y: 1.37, z: MOSQUE_POS.z },
      closedSize: { x: 0.2, y: 2.5, z: 1.6 },
    },
  ];

  for (const h of NEIGHBORHOOD_HOUSES) {
    const hw = h.w * 0.5;
    const hd = h.d * 0.5;
    if (h.rotY === Math.PI / 2) {
      doors.push({
        id: `door_${h.id}`,
        label: `Pintu Rumah Warga (${h.id.toUpperCase()})`,
        floor: 'outside',
        hingePos: { x: h.x + hw, y: 0, z: h.z - 0.7 },
        width: 1.4,
        height: 2.4,
        thickness: 0.12,
        closedAngle: -Math.PI / 2,
        openAngle: -Math.PI * 0.04,
        currentAngle: -Math.PI / 2,
        targetAngle: -Math.PI / 2,
        isOpen: false,
        closedCenter: { x: h.x + hw, y: 1.2, z: h.z },
        closedSize: { x: 0.2, y: 2.4, z: 1.4 },
      });
    } else if (h.rotY === -Math.PI / 2) {
      doors.push({
        id: `door_${h.id}`,
        label: `Pintu Rumah Warga (${h.id.toUpperCase()})`,
        floor: 'outside',
        hingePos: { x: h.x - hw, y: 0, z: h.z - 0.7 },
        width: 1.4,
        height: 2.4,
        thickness: 0.12,
        closedAngle: -Math.PI / 2,
        openAngle: -Math.PI * 0.96,
        currentAngle: -Math.PI / 2,
        targetAngle: -Math.PI / 2,
        isOpen: false,
        closedCenter: { x: h.x - hw, y: 1.2, z: h.z },
        closedSize: { x: 0.2, y: 2.4, z: 1.4 },
      });
    } else if (h.rotY === 0) {
      doors.push({
        id: `door_${h.id}`,
        label: `Pintu Rumah Warga (${h.id.toUpperCase()})`,
        floor: 'outside',
        hingePos: { x: h.x - 0.7, y: 0, z: h.z + hd },
        width: 1.4,
        height: 2.4,
        thickness: 0.12,
        closedAngle: 0,
        openAngle: -Math.PI * 0.48,
        currentAngle: 0,
        targetAngle: 0,
        isOpen: false,
        closedCenter: { x: h.x, y: 1.2, z: h.z + hd },
        closedSize: { x: 1.4, y: 2.4, z: 0.2 },
      });
    } else {
      doors.push({
        id: `door_${h.id}`,
        label: `Pintu Rumah Warga (${h.id.toUpperCase()})`,
        floor: 'outside',
        hingePos: { x: h.x - 0.7, y: 0, z: h.z - hd },
        width: 1.4,
        height: 2.4,
        thickness: 0.12,
        closedAngle: 0,
        openAngle: Math.PI * 0.48,
        currentAngle: 0,
        targetAngle: 0,
        isOpen: false,
        closedCenter: { x: h.x, y: 1.2, z: h.z - hd },
        closedSize: { x: 1.4, y: 2.4, z: 0.2 },
      });
    }
  }

  return doors;
}

export function createInitialInteractables(): InteractableItem[] {
  return [
    // NPC Warung Ceu Titin (Ceu Titin & Anak Muda)
    {
      id: 'npc_warung_ibu',
      kind: 'npc',
      label: 'Ceu Titin (Pemilik Warung)',
      prompt: '[E] Bicara dengan Ceu Titin (Pemilik Warung)',
      position: { x: WARUNG_POS.x + 0.55, y: 0.0, z: WARUNG_POS.z },
      floor: 'outside',
      payloadId: 'warung_ibu',
    },
    {
      id: 'npc_warung_pemuda',
      kind: 'npc',
      label: 'Rizky & Anak Muda Warung Ceu Titin',
      prompt: '[E] Ngobrol dengan Anak Muda Warung Ceu Titin',
      position: { x: WARUNG_POS.x + 3.55, y: 0.0, z: WARUNG_POS.z + 1.3 },
      floor: 'outside',
      payloadId: 'warung_pemuda',
    },

    // NPC Luar di Pos Ronda & Pedagang Jalan Sukajadi
    {
      id: 'npc_satpam',
      kind: 'npc',
      label: 'Pak Ujang (Satpam Pos Ronda)',
      prompt: '[E] Bicara dengan Pak Ujang (Pos Ronda)',
      position: { x: -9.1, y: 0.0, z: 33.7 },
      floor: 'outside',
      payloadId: 'satpam',
    },
    {
      id: 'npc_nasgor',
      kind: 'npc',
      label: 'Mang Asep (Nasi Goreng)',
      prompt: '[E] Bicara dengan Tukang Nasi Goreng',
      position: { x: -4.8, y: 0.0, z: 31.3 },
      floor: 'outside',
      payloadId: 'nasgor',
    },
    {
      id: 'npc_pecel',
      kind: 'npc',
      label: 'Mas Budi (Pecel Lele)',
      prompt: '[E] Bicara dengan Tukang Pecel Lele',
      position: { x: 4.8, y: 0.0, z: 31.3 },
      floor: 'outside',
      payloadId: 'pecel',
    },

    // 3 KUNCI RUANGAN TERKUNCI
    {
      id: 'pickup_key_dapur',
      kind: 'key',
      label: 'Kunci Dapur',
      prompt: '[E] Ambil Kunci Dapur',
      position: { x: -6.2, y: 0.56, z: -4.6 },
      floor: 'ground',
      payloadId: 'key_dapur',
    },
    {
      id: 'pickup_key_kamar2',
      kind: 'key',
      label: 'Kunci Kamar Lt.2',
      prompt: '[E] Ambil Kunci Kamar Lt.2',
      position: { x: 6.4, y: 0.96, z: -7.8 },
      floor: 'ground',
      payloadId: 'key_kamar2',
    },
    {
      id: 'pickup_key_atap',
      kind: 'key',
      label: 'Kunci Pintu Atap',
      prompt: '[E] Ambil Kunci Pintu Atap',
      position: { x: -3.2, y: 4.82, z: -7.85 },
      floor: 'second',
      payloadId: 'key_atap',
    },

    // 6 BUKTI FAKTA (1 per Segel Rumor)
    {
      id: 'ev_akta',
      kind: 'evidence',
      label: 'Akta & Catatan Arsitektur 1984',
      prompt: '[E] Ambil Bukti: Akta Arsitektur 1984',
      position: { x: -6.0, y: 0.84, z: 2.2 },
      floor: 'ground',
      payloadId: 'rumor_666',
    },
    {
      id: 'ev_penjaga',
      kind: 'evidence',
      label: 'Buku Log Penjaga & Kerabat',
      prompt: '[E] Ambil Bukti: Buku Log Penjaga',
      position: { x: 6.4, y: 0.82, z: -4.2 },
      floor: 'ground',
      payloadId: 'rumor_penghuni',
    },
    {
      id: 'ev_faktur_patung',
      kind: 'evidence',
      label: 'Faktur Properti Seni Kelautan',
      prompt: '[E] Ambil Bukti UV: Faktur Patung Gurita',
      position: { x: 5.8, y: 0.82, z: 6.85 },
      floor: 'ground',
      requiresUV: true,
      payloadId: 'rumor_gurita',
    },
    {
      id: 'ev_kuitansi_boneka',
      kind: 'evidence',
      label: 'Catatan Koleksi Boneka Antik',
      prompt: '[E] Ambil Bukti: Catatan Koleksi Antik',
      position: { x: -6.2, y: 4.82, z: 2.0 },
      floor: 'second',
      payloadId: 'rumor_uci',
    },
    {
      id: 'ev_cetak_biru',
      kind: 'evidence',
      label: 'Cetak Biru Kolam & Radio',
      prompt: '[E] Ambil Bukti: Cetak Biru Rooftop',
      position: { x: 8.4, y: 4.82, z: 2.2 },
      floor: 'second',
      payloadId: 'rumor_kolam',
    },
    {
      id: 'ev_rekaman_rani',
      kind: 'evidence',
      label: 'Rekaman Siaran Rani',
      prompt: '[E] Ambil Bukti: Ponsel & Rekaman Rani',
      position: { x: -6.5, y: 8.2, z: -2.6 },
      floor: 'roof',
      payloadId: 'rumor_gereja',
    },

    // TEMPAT PERSEMBUNYIAN
    {
      id: 'hide_ground_lounge',
      kind: 'hiding',
      label: 'Lemari Ruang Tamu',
      prompt: '[E] Sembunyi di Lemari',
      position: { x: -9.1, y: 0.0, z: -6.5 },
      floor: 'ground',
    },
    {
      id: 'hide_ground_kitchen',
      kind: 'hiding',
      label: 'Lemari Dapur',
      prompt: '[E] Sembunyi di Lemari Dapur',
      position: { x: 9.1, y: 0.0, z: -5.4 },
      floor: 'ground',
    },
    {
      id: 'hide_ground_bedroom',
      kind: 'hiding',
      label: 'Lemari Kamar Tenggara',
      prompt: '[E] Sembunyi di Lemari Kamar',
      position: { x: 9.1, y: 0.0, z: 1.4 },
      floor: 'ground',
    },
    {
      id: 'hide_second_hall',
      kind: 'hiding',
      label: 'Lemari Pakaian Lt.2',
      prompt: '[E] Sembunyi di Lemari',
      position: { x: -9.1, y: FLOOR_HEIGHT, z: 5.6 },
      floor: 'second',
    },
    {
      id: 'hide_second_nw',
      kind: 'hiding',
      label: 'Lemari Kamar Utama Lt.2',
      prompt: '[E] Sembunyi di Lemari Kamar',
      position: { x: -9.1, y: FLOOR_HEIGHT, z: -6.5 },
      floor: 'second',
    },

    // BATERAI TERPISAH & GARAM
    {
      id: 'bat_flash_ground',
      kind: 'battery_flashlight',
      label: 'Baterai Senter (+50%)',
      prompt: '[E] Ambil Baterai Senter (+50%)',
      position: { x: 1.8, y: 0.45, z: 5.8 },
      floor: 'ground',
    },
    {
      id: 'bat_uv_ground',
      kind: 'battery_uv',
      label: 'Baterai Kamera UV (+50%)',
      prompt: '[E] Ambil Baterai Kamera UV (+50%)',
      position: { x: -0.4, y: 0.45, z: 5.8 },
      floor: 'ground',
    },
    {
      id: 'salt_ground',
      kind: 'salt',
      label: 'Garam Pengusir',
      prompt: '[E] Ambil Garam (+1)',
      position: { x: 9.2, y: 0.45, z: -2.4 },
      floor: 'ground',
    },
    {
      id: 'bat_flash_second',
      kind: 'battery_flashlight',
      label: 'Baterai Senter (+50%)',
      prompt: '[E] Ambil Baterai Senter (+50%)',
      position: { x: -3.5, y: FLOOR_HEIGHT + 0.45, z: -0.6 },
      floor: 'second',
    },
    {
      id: 'bat_uv_second',
      kind: 'battery_uv',
      label: 'Baterai Kamera UV (+50%)',
      prompt: '[E] Ambil Baterai Kamera UV (+50%)',
      position: { x: -4.6, y: FLOOR_HEIGHT + 0.45, z: -6.0 },
      floor: 'second',
    },
    {
      id: 'salt_second',
      kind: 'salt',
      label: 'Garam Pengusir',
      prompt: '[E] Ambil Garam (+1)',
      position: { x: 8.2, y: FLOOR_HEIGHT + 0.45, z: -4.6 },
      floor: 'second',
    },

    // PUZZLE & PUSAKA
    {
      id: 'crumble_second',
      kind: 'crumbling_wall',
      label: 'Tembok Rapuh Lantai 2',
      prompt: '[E] Runtuhkan Tembok Rapuh (Butuh >= 2 Segel Fakta)',
      position: { x: 5.6, y: FLOOR_HEIGHT + 1.0, z: 4.0 },
      floor: 'second',
      payloadId: 's_crumble_wall',
    },
    {
      id: 'radio_tower',
      kind: 'radio_tower',
      label: 'Menara Radio Rooftop',
      prompt: '[E] Setel Frekuensi Menara Radio (Cari Sinyal Rani)',
      position: { x: -0.4, y: FLOOR_HEIGHT * 2 + 0.6, z: -5.2 },
      floor: 'roof',
    },
    {
      id: 'crumble_roof',
      kind: 'crumbling_wall',
      label: 'Tembok Rapuh Pusaka Atap',
      prompt: '[E] Buka Tembok Pusaka (3+ Segel Fakta)',
      position: { x: 5.4, y: FLOOR_HEIGHT * 2 + 0.8, z: 0.8 },
      floor: 'roof',
      payloadId: 'r_crumble_wall',
    },
    {
      id: 'kujang_shrine',
      kind: 'kujang',
      label: 'Pusaka Kujang Pamungkas',
      prompt: '[E] Ambil Kujang Pamungkas & Putus Dimensi Gaib',
      position: { x: 8.4, y: FLOOR_HEIGHT * 2 + 0.8, z: 0.8 },
      floor: 'roof',
    },
  ];
}

export function createInitialGhosts(): GhostData[] {
  return [
    {
      id: 'ghost_kuntilanak',
      kind: 'kuntilanak',
      name: 'Kuntilanak',
      floor: 'ground',
      position: { x: 0.2, y: 0.0, z: 2.0 },
      yaw: 0,
      state: 'patrol',
      homePos: { x: 0.2, y: 0.0, z: 2.0 },
      waypoints: [
        { x: 0.2, y: 0.0, z: 2.0 },
        { x: 2.8, y: 0.0, z: 4.2 },
        { x: 2.8, y: 0.0, z: 0.8 },
        { x: -0.8, y: 0.0, z: 4.5 },
      ],
      waypointIndex: 1,
      targetPos: { x: 2.8, y: 0.0, z: 4.2 },
      alertTimer: 0,
      stunTimer: 0,
      speed: 2.45,
      active: true,
    },
    {
      id: 'ghost_pocong',
      kind: 'pocong',
      name: 'Pocong',
      floor: 'ground',
      position: { x: -4.2, y: 0.0, z: -3.2 },
      yaw: 0,
      state: 'patrol',
      homePos: { x: -4.2, y: 0.0, z: -3.2 },
      waypoints: [
        { x: -4.2, y: 0.0, z: -3.2 },
        { x: -3.8, y: 0.0, z: 4.8 },
        { x: -8.5, y: 0.0, z: 4.8 },
      ],
      waypointIndex: 1,
      targetPos: { x: -3.8, y: 0.0, z: 4.8 },
      alertTimer: 0,
      stunTimer: 0,
      speed: 2.15,
      active: true,
    },
    {
      id: 'ghost_boneka_uci',
      kind: 'boneka_uci',
      name: 'Boneka Uci',
      floor: 'second',
      position: { x: -4.2, y: FLOOR_HEIGHT, z: 4.5 },
      yaw: 0,
      state: 'patrol',
      homePos: { x: -4.2, y: FLOOR_HEIGHT, z: 4.5 },
      waypoints: [
        { x: -4.2, y: FLOOR_HEIGHT, z: 4.5 },
        { x: -3.8, y: FLOOR_HEIGHT, z: 0.2 },
        { x: -7.8, y: FLOOR_HEIGHT, z: 4.5 },
      ],
      waypointIndex: 1,
      targetPos: { x: -3.8, y: FLOOR_HEIGHT, z: 0.2 },
      alertTimer: 0,
      stunTimer: 0,
      speed: 2.8,
      active: true,
    },
    {
      id: 'ghost_genderuwo',
      kind: 'genderuwo',
      name: 'Genderuwo',
      floor: 'second',
      position: { x: 7.2, y: FLOOR_HEIGHT, z: -4.2 },
      yaw: 0,
      state: 'patrol',
      homePos: { x: 7.2, y: FLOOR_HEIGHT, z: -4.2 },
      waypoints: [
        { x: 7.2, y: FLOOR_HEIGHT, z: -4.2 },
        { x: 7.4, y: FLOOR_HEIGHT, z: -1.0 },
        { x: 0.2, y: FLOOR_HEIGHT, z: 3.4 },
      ],
      waypointIndex: 1,
      targetPos: { x: 7.4, y: FLOOR_HEIGHT, z: -1.0 },
      alertTimer: 0,
      stunTimer: 0,
      speed: 2.05,
      active: true,
    },
    {
      id: 'ghost_ambu_hideung',
      kind: 'ambu_hideung',
      name: 'Ambu Hideung (Boss)',
      floor: 'roof',
      position: { x: -1.8, y: FLOOR_HEIGHT * 2, z: 1.5 },
      yaw: 0,
      state: 'patrol',
      homePos: { x: -1.8, y: FLOOR_HEIGHT * 2, z: 1.5 },
      waypoints: [
        { x: -1.8, y: FLOOR_HEIGHT * 2, z: 1.5 },
        { x: -2.2, y: FLOOR_HEIGHT * 2, z: -2.4 },
        { x: 1.6, y: FLOOR_HEIGHT * 2, z: 4.2 },
        { x: 3.8, y: FLOOR_HEIGHT * 2, z: 0.8 },
      ],
      waypointIndex: 1,
      targetPos: { x: -2.2, y: FLOOR_HEIGHT * 2, z: -2.4 },
      alertTimer: 0,
      stunTimer: 0,
      speed: 2.7,
      active: true,
    },
  ];
}
