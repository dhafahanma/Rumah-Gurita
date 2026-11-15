import * as THREE from 'three';
import type { DoorData, GhostKind, TreeKind } from './types';
import type { NeighborhoodHouseSpec } from './levelData';

function makeCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeatX = 1,
  repeatY = 1,
  anisotropy = 4,
  isColor = true,
  canvasW = 512,
  canvasH = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, canvasW, canvasH);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(0,0,0,0.72)');
    grad.addColorStop(0.65, 'rgba(0,0,0,0.28)');
    grad.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, 1, 1, 1, false);
}

export function createContactShadowDisc(radius: number, tex: THREE.CanvasTexture): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 20);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  return mesh;
}

export interface MaterialLibrary {
  wall_out: THREE.MeshStandardMaterial;
  wall_in: THREE.MeshStandardMaterial;
  floor_wood: THREE.MeshStandardMaterial;
  floor_tile: THREE.MeshStandardMaterial;
  floor_roof: THREE.MeshStandardMaterial;
  street: THREE.MeshStandardMaterial;
  parapet: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  crumble: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  contactShadowTex: THREE.CanvasTexture;
}

export function createMaterialLibrary(maxAniso: number): MaterialLibrary {
  const plasterTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#c4c9bf';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1200; i++) {
        ctx.fillStyle = i % 3 === 0 ? 'rgba(38,44,40,0.09)' : 'rgba(220,226,216,0.08)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 7, 2 + Math.random() * 8);
      }
      // Jejak hujan tropis halus pada dinding plester Bandung
      for (let i = 0; i < 42; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * (h * 0.4);
        ctx.fillStyle = 'rgba(26,32,29,0.08)';
        ctx.fillRect(sx, sy, 3 + Math.random() * 4, 45 + Math.random() * 140);
      }
      ctx.strokeStyle = 'rgba(40,46,42,0.12)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
    4,
    2,
    maxAniso
  );

  const woodTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#3a271c';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1e120b';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = 'rgba(20,12,7,0.18)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 26, 3);
      }
    },
    4,
    4,
    maxAniso
  );

  const tileTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#2d3734';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#19201e';
      ctx.lineWidth = 3;
      for (let i = 0; i <= w; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
    },
    5,
    5,
    maxAniso
  );

  const asphaltTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#1c1f21';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 450; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(60,65,70,0.22)' : 'rgba(8,10,11,0.28)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
      // Garis marka putus halus di jalan aspal
      ctx.fillStyle = 'rgba(180, 165, 110, 0.25)';
      ctx.fillRect(w * 0.49, 24, w * 0.02, 180);
      ctx.fillRect(w * 0.49, 280, w * 0.02, 180);
    },
    1,
    8,
    maxAniso
  );

  const crumbleTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#4a2923';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#140907';
      ctx.lineWidth = 4;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        let cx = Math.random() * w;
        let cy = Math.random() * h;
        ctx.moveTo(cx, cy);
        for (let s = 0; s < 4; s++) {
          cx += (Math.random() - 0.5) * 60;
          cy += (Math.random() - 0.5) * 60;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }
    },
    2,
    2,
    maxAniso
  );

  return {
    wall_out: new THREE.MeshStandardMaterial({
      color: 0xd0d4cc,
      map: plasterTex,
      roughness: 0.88,
      metalness: 0.04,
    }),
    wall_in: new THREE.MeshStandardMaterial({
      color: 0xadb5ae,
      map: plasterTex,
      roughness: 0.86,
      metalness: 0.04,
    }),
    floor_wood: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: woodTex,
      roughness: 0.82,
      metalness: 0.05,
    }),
    floor_tile: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tileTex,
      roughness: 0.65,
      metalness: 0.1,
    }),
    floor_roof: new THREE.MeshStandardMaterial({
      color: 0x353c38,
      map: plasterTex,
      roughness: 0.92,
      metalness: 0.04,
    }),
    street: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: asphaltTex,
      roughness: 0.94,
      metalness: 0.02,
    }),
    parapet: new THREE.MeshStandardMaterial({
      color: 0x262d27,
      roughness: 0.9,
      metalness: 0.04,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x464f54,
      roughness: 0.42,
      metalness: 0.75,
    }),
    crumble: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: crumbleTex,
      roughness: 0.95,
      metalness: 0.05,
      emissive: new THREE.Color(0x2e0f0a),
      emissiveIntensity: 0.45,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x99b8c2,
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
      opacity: 0.38,
    }),
    contactShadowTex: createContactShadowTexture(),
  };
}

function createOctopusSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1b1e21';
  ctx.fillRect(0, 0, 128, 128);

  // Subtle weathered concrete mineral variation & rain streaks (matching Bandung rooftop statue)
  for (let i = 0; i < 420; i++) {
    const x = (i * 53) % 128;
    const y = (i * 97) % 128;
    const r = 1 + (i % 4);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(54,60,64,0.22)' : 'rgba(10,12,13,0.34)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 28; i++) {
    const x = (i * 19 + 7) % 128;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(42,50,46,0.18)' : 'rgba(8,10,11,0.26)';
    ctx.fillRect(x, 0, 2, 128);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

interface SuckerPlacement {
  pos: THREE.Vector3;
  normal: THREE.Vector3;
  radius: number;
}

function buildTaperedTentacleGeometry(
  curve: THREE.CatmullRomCurve3,
  tubularSegs: number,
  radialSegs: number,
  baseRadius: number,
  tipRadius: number,
  suckerCollector: SuckerPlacement[]
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const v = new THREE.Vector3();

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    curve.getPointAt(t, p);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const rBase = tipRadius + (baseRadius - tipRadius) * Math.pow(1 - t, 1.38);

    for (let j = 0; j <= radialSegs; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = -Math.cos(theta);
      // Slight organic dorsal ridge profile
      const ribMod = 1 + 0.05 * Math.cos(theta * 3);
      const r = rBase * ribMod;

      n.x = cos * N.x + sin * B.x;
      n.y = cos * N.y + sin * B.y;
      n.z = cos * N.z + sin * B.z;
      n.normalize();

      v.x = p.x + r * n.x;
      v.y = p.y + r * n.y;
      v.z = p.z + r * n.z;

      positions.push(v.x, v.y, v.z);
      normals.push(n.x, n.y, n.z);
      uvs.push(u, t * 4);
    }

    // Place twin-row suction cups along the ventral/outer side of the tentacle
    if (i >= 3 && i <= tubularSegs - 2 && i % 2 === 1) {
      const outDir = new THREE.Vector3(p.x, -0.35, p.z).normalize();
      const tangent = frames.tangents[i];
      const sideAxis = new THREE.Vector3().crossVectors(tangent, outDir).normalize();
      if (sideAxis.lengthSq() < 0.01) sideAxis.set(1, 0, 0);
      const ventralDir = new THREE.Vector3().crossVectors(sideAxis, tangent).normalize();
      // Ensure ventral points outward/downward visibly
      if (ventralDir.dot(outDir) < 0) ventralDir.negate();

      const suckerR = Math.max(0.028, rBase * 0.34);
      for (const sideSign of [-1, 1]) {
        const cupNormal = ventralDir
          .clone()
          .addScaledVector(sideAxis, sideSign * 0.42)
          .normalize();
        const cupPos = p.clone().addScaledVector(cupNormal, rBase * 0.94);
        suckerCollector.push({ pos: cupPos, normal: cupNormal, radius: suckerR });
      }
    }
  }

  for (let j = 1; j <= tubularSegs; j++) {
    for (let i = 1; i <= radialSegs; i++) {
      const a = (radialSegs + 1) * (j - 1) + (i - 1);
      const b = (radialSegs + 1) * j + (i - 1);
      const c = (radialSegs + 1) * j + i;
      const d = (radialSegs + 1) * (j - 1) + i;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

/**
 * Patung Gurita Hitam Bermata Merah (STATIS, properti seni ikonik di atap yang tentakelnya menjuntai ke balkon depan).
 */
export function createOctopusStatue(): {
  group: THREE.Group;
  eyeMeshes: THREE.Mesh[];
} {
  const group = new THREE.Group();
  const skinTex = createOctopusSkinTexture();

  const blackBody = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: skinTex,
    roughness: 0.62,
    metalness: 0.16,
  });
  const collarDark = new THREE.MeshStandardMaterial({
    color: 0x1e2226,
    roughness: 0.72,
    metalness: 0.12,
  });
  const plinthStone = new THREE.MeshStandardMaterial({
    color: 0x2b3033,
    roughness: 0.88,
    metalness: 0.05,
  });
  const suckerMat = new THREE.MeshStandardMaterial({
    color: 0x4b5156,
    roughness: 0.78,
    metalness: 0.08,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: new THREE.Color(0xe31616),
    emissiveIntensity: 2.3,
    roughness: 0.18,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x090202,
    roughness: 0.15,
  });

  // 1. Alas Batu & Leher Berotot Bertingkat
  const plinthLower = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.68, 0.65, 20), plinthStone);
  plinthLower.position.y = 0.325;
  plinthLower.castShadow = true;
  plinthLower.receiveShadow = true;
  group.add(plinthLower);

  const plinthUpper = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 2.28, 0.72, 20), collarDark);
  plinthUpper.position.y = 1.01;
  plinthUpper.castShadow = true;
  plinthUpper.receiveShadow = true;
  group.add(plinthUpper);

  // Sabuk selaput pangkal tentakel
  const webRing = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.32, 10, 22), blackBody);
  webRing.rotation.x = Math.PI * 0.5;
  webRing.position.y = 1.38;
  webRing.castShadow = true;
  group.add(webRing);

  // 2. Mantel Kepala Gurita Organik (Agak Lonjong & Miring ke Belakang seperti Foto Asli Bandung)
  const mantlePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.32, 0.16),
    new THREE.Vector2(1.78, 0.82),
    new THREE.Vector2(2.04, 1.72),
    new THREE.Vector2(1.94, 2.68),
    new THREE.Vector2(1.48, 3.45),
    new THREE.Vector2(0.82, 3.92),
    new THREE.Vector2(0.0, 4.12),
  ];
  const headAnchor = new THREE.Group();
  headAnchor.position.set(0, 1.32, -0.15);
  headAnchor.rotation.x = -0.22;
  group.add(headAnchor);

  const mantle = new THREE.Mesh(new THREE.LatheGeometry(mantlePts, 28), blackBody);
  mantle.scale.set(1.04, 1.0, 1.2);
  mantle.castShadow = true;
  mantle.receiveShadow = true;
  headAnchor.add(mantle);

  // Punggungan mahkota belakang & lipatan mantel samping
  const dorsalCrest = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 14), blackBody);
  dorsalCrest.scale.set(0.75, 1.45, 0.88);
  dorsalCrest.position.set(0, 2.85, -1.05);
  dorsalCrest.rotation.x = -0.35;
  dorsalCrest.castShadow = true;
  headAnchor.add(dorsalCrest);

  // Corong Siphon (tabung pernapasan samping khas anatomi gurita)
  const siphonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.1, 0.35, 0.6),
    new THREE.Vector3(1.88, 0.62, 0.92),
    new THREE.Vector3(2.24, 0.78, 1.18),
  ]);
  const siphon = new THREE.Mesh(new THREE.TubeGeometry(siphonCurve, 10, 0.24, 10, false), collarDark);
  siphon.castShadow = true;
  headAnchor.add(siphon);
  const siphonLip = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 8, 12), blackBody);
  siphonLip.position.set(2.24, 0.78, 1.18);
  siphonLip.lookAt(3.0, 1.0, 1.8);
  headAnchor.add(siphonLip);

  // 3. Kelopak Alis Berotot, Soket Mata Cekung, Bola Mata Merah Menyala & Pupil Horizontal
  const eyeMeshes: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(side * 0.86, 0.92, 1.72);
    eyeSocket.rotation.y = side * 0.34;
    headAnchor.add(eyeSocket);

    const socketRim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 10, 16), collarDark);
    socketRim.castShadow = true;
    eyeSocket.add(socketRim);

    const browArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.11, 10, 14, Math.PI * 0.95),
      blackBody
    );
    browArch.position.set(0, 0.08, 0.04);
    browArch.rotation.z = side * -0.18;
    browArch.castShadow = true;
    eyeSocket.add(browArch);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 14), eyeMat);
    eye.position.set(0, -0.01, 0.06);
    eyeSocket.add(eye);
    eyeMeshes.push(eye);

    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.075, 0.06), pupilMat);
    pupil.position.set(0, -0.01, 0.29);
    eyeSocket.add(pupil);
  }

  // 4. 8 Tentakel Meruncing (Tapered) dengan Pose Asimetris Ikonik Rumah Gurita Bandung
  const tentacleSpecs: { pts: [number, number, number][]; baseR: number; tipR: number }[] = [
    // 0: Tentakel utama depan-kanan melengkung di atas bibir balkon atap & menjuntai turun hingga balkon Lantai 2
    {
      pts: [
        [0.85, 1.42, 1.25],
        [1.25, 2.18, 2.75],
        [1.38, 1.55, 4.45],
        [1.22, 0.45, 5.55],
        [0.98, -1.35, 5.42],
        [1.08, -2.95, 4.95],
        [1.55, -3.55, 5.25],
        [1.92, -3.12, 5.38],
      ],
      baseR: 0.42,
      tipR: 0.05,
    },
    // 1: Tentakel depan-kiri melengkung spiral S-loop melewati sisi barat balkon
    {
      pts: [
        [-0.85, 1.42, 1.22],
        [-1.45, 2.28, 2.38],
        [-2.05, 1.65, 3.85],
        [-2.28, -0.35, 4.55],
        [-1.85, -1.95, 4.45],
        [-1.32, -1.62, 4.72],
      ],
      baseR: 0.4,
      tipR: 0.05,
    },
    // 2: Tentakel kanan-depan mencengkeram bibir mangkuk balkon atap
    {
      pts: [
        [1.35, 1.36, 0.55],
        [2.35, 1.85, 1.65],
        [2.85, 0.85, 2.95],
        [2.65, 0.22, 3.85],
        [2.05, 0.58, 4.18],
      ],
      baseR: 0.36,
      tipR: 0.05,
    },
    // 3: Tentakel kiri-samping menjuntai melewati parapet barat atap
    {
      pts: [
        [-1.38, 1.36, 0.48],
        [-2.42, 1.72, 1.15],
        [-3.18, 0.95, 1.72],
        [-3.45, -0.85, 1.98],
        [-3.18, -1.52, 2.42],
      ],
      baseR: 0.36,
      tipR: 0.05,
    },
    // 4: Tentakel timur melingkar di dek atap dengan ujung tergulung ke atas
    {
      pts: [
        [1.42, 1.32, -0.45],
        [2.38, 1.12, -0.35],
        [3.22, 0.35, 0.15],
        [3.68, 0.25, 0.95],
        [3.35, 0.88, 1.28],
        [2.98, 0.72, 0.95],
      ],
      baseR: 0.35,
      tipR: 0.045,
    },
    // 5: Tentakel barat-belakang melingkar di dek atap menuju karang seni
    {
      pts: [
        [-1.38, 1.32, -0.55],
        [-2.28, 1.05, -1.05],
        [-2.95, 0.32, -1.78],
        [-2.42, 0.26, -2.65],
        [-1.85, 0.72, -2.35],
      ],
      baseR: 0.35,
      tipR: 0.045,
    },
    // 6: Tentakel belakang-kanan menjalar di lantai atap
    {
      pts: [
        [0.75, 1.32, -1.25],
        [1.35, 0.95, -2.15],
        [2.05, 0.3, -2.95],
        [2.72, 0.26, -2.55],
        [2.52, 0.68, -2.02],
      ],
      baseR: 0.34,
      tipR: 0.045,
    },
    // 7: Tentakel belakang-tengah melengkung kokoh sebagai jangkar
    {
      pts: [
        [-0.38, 1.34, -1.32],
        [-0.55, 1.22, -2.38],
        [-0.35, 0.35, -3.28],
        [0.42, 0.28, -3.65],
        [0.72, 0.78, -3.32],
      ],
      baseR: 0.36,
      tipR: 0.05,
    },
  ];

  const suckers: SuckerPlacement[] = [];
  for (const spec of tentacleSpecs) {
    const curve = new THREE.CatmullRomCurve3(
      spec.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    );
    const geo = buildTaperedTentacleGeometry(curve, 26, 10, spec.baseR, spec.tipR, suckers);
    const tentMesh = new THREE.Mesh(geo, blackBody);
    tentMesh.castShadow = true;
    tentMesh.receiveShadow = true;
    group.add(tentMesh);
  }

  // 5. Ratusan Mangkuk Hisap (Suction Cups) 2-Baris via 1 InstancedMesh (hemat draw call!)
  if (suckers.length > 0) {
    const cupGeo = new THREE.CylinderGeometry(1.0, 0.76, 0.45, 8);
    const cupMesh = new THREE.InstancedMesh(cupGeo, suckerMat, suckers.length);
    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();
    suckers.forEach((s, idx) => {
      dummy.position.copy(s.pos);
      quat.setFromUnitVectors(up, s.normal);
      dummy.quaternion.copy(quat);
      dummy.scale.set(s.radius, s.radius, s.radius);
      dummy.updateMatrix();
      cupMesh.setMatrixAt(idx, dummy.matrix);
    });
    cupMesh.instanceMatrix.needsUpdate = true;
    group.add(cupMesh);
  }

  // Pencahayaan rim bulan lembut & pendar merah mata agar lekuk tentakel & mangkuk hisap terlihat jelas di malam hari
  const moonRim = new THREE.PointLight(0x8ba7c2, 2.4, 14, 1.4);
  moonRim.position.set(-0.6, 5.1, 4.4);
  group.add(moonRim);

  const eyeGlow = new THREE.PointLight(0xe02222, 1.35, 6.5, 2.0);
  eyeGlow.position.set(0, 2.35, 2.55);
  group.add(eyeGlow);

  return { group, eyeMeshes };
}

function createGentengRoofTexture(baseColorHex: number, maxAniso: number): THREE.CanvasTexture {
  const c = new THREE.Color(baseColorHex);
  const rBase = Math.round(c.r * 255);
  const gBase = Math.round(c.g * 255);
  const bBase = Math.round(c.b * 255);

  return makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = `rgb(${rBase},${gBase},${bBase})`;
      ctx.fillRect(0, 0, w, h);

      const cols = 16;
      const rows = 14;
      const cw = w / cols;
      const rh = h / rows;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cw;
          const y = row * rh;
          const shade = ((row * 7 + col * 13) % 19) - 9;
          ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, rBase + shade))},${Math.max(0, Math.min(255, gBase + shade))},${Math.max(0, Math.min(255, bBase + shade))})`;
          ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);

          // Bayangan lengkung genteng tanah liat
          ctx.fillStyle = 'rgba(10, 6, 4, 0.34)';
          ctx.fillRect(x, y + rh - 5, cw, 5);
          ctx.fillStyle = 'rgba(255, 225, 195, 0.1)';
          ctx.fillRect(x + 3, y + 2, cw * 0.45, 3);
        }
      }
    },
    3,
    3,
    maxAniso
  );
}

function createRosterBlockTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#cfd3cb';
      ctx.fillRect(0, 0, w, h);
      const cell = 64;
      for (let y = 0; y < h; y += cell) {
        for (let x = 0; x < w; x += cell) {
          ctx.strokeStyle = '#9aa097';
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
          // Lubang roster beton gelap bertingkat
          ctx.fillStyle = '#18201e';
          ctx.fillRect(x + 11, y + 11, cell - 22, cell - 22);
          // Ornamen silang / kerawang tengah khas 1980-an
          ctx.fillStyle = '#c4c9c0';
          ctx.fillRect(x + cell * 0.5 - 4, y + 10, 8, cell - 20);
          ctx.fillRect(x + 10, y + cell * 0.5 - 4, cell - 20, 8);
          ctx.fillStyle = '#242d2a';
          ctx.beginPath();
          ctx.arc(x + cell * 0.5, y + cell * 0.5, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    2,
    2,
    maxAniso,
    true,
    256,
    256
  );
}

function createMarineMuralTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#cfd6cf');
      bg.addColorStop(1, '#aeb9b4');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#242d2b';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Siluet ikonik kuda laut / kereta kuda kelautan di balik kaca Rumah Gurita
      ctx.fillStyle = '#1f2625';
      for (const hx of [w * 0.34, w * 0.52, w * 0.68]) {
        ctx.beginPath();
        ctx.ellipse(hx, h * 0.56, 36, 18, -0.15, 0, Math.PI * 2);
        ctx.fill();
        // Leher & kepala melengkung
        ctx.beginPath();
        ctx.moveTo(hx - 14, h * 0.52);
        ctx.quadraticCurveTo(hx - 36, h * 0.3, hx - 58, h * 0.34);
        ctx.quadraticCurveTo(hx - 48, h * 0.44, hx - 22, h * 0.46);
        ctx.lineTo(hx + 6, h * 0.54);
        ctx.fill();
        // Ekor spiral kelautan
        ctx.strokeStyle = '#1f2625';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(hx + 34, h * 0.66, 16, 0, Math.PI * 1.6);
        ctx.stroke();
      }
      // Garis ombak bergelombang di bawah siluet
      ctx.strokeStyle = '#29484d';
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let x = 24; x <= w - 24; x += 24) {
        const y = h * 0.8 + Math.sin(x * 0.06) * 8;
        if (x === 24) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    1,
    1,
    maxAniso,
    true,
    512,
    256
  );
}

function createBilikBambuTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#6e5435';
      ctx.fillRect(0, 0, w, h);
      const step = 20;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const odd = ((x / step + y / step) | 0) % 2 === 0;
          ctx.fillStyle = odd ? '#826440' : '#574027';
          ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
          ctx.strokeStyle = 'rgba(22,14,8,0.35)';
          ctx.strokeRect(x, y, step, step);
        }
      }
    },
    2,
    1,
    maxAniso,
    true,
    256,
    256
  );
}

function createCorrugatedZincTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#485055';
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) {
        ctx.fillStyle = 'rgba(220,232,240,0.16)';
        ctx.fillRect(x, 0, 6, h);
        ctx.fillStyle = 'rgba(12,16,18,0.35)';
        ctx.fillRect(x + 8, 0, 5, h);
      }
      // Garis karat ringan di tepi seng
      for (let i = 0; i < 45; i++) {
        ctx.fillStyle = 'rgba(115, 62, 34, 0.22)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 18 + Math.random() * 30, 4);
      }
    },
    3,
    2,
    maxAniso,
    true,
    256,
    256
  );
}

/**
 * Fasad Putih Art-Deco Rumah Gurita Bandung:
 * Pondasi batu kali, balkon lengkung bertingkat dengan soffit corbel & pagar besi atap,
 * kerawang roster beton 1980-an, kanopi pintu bergelombang, lentera teras, & relief siluet kelautan.
 */
export function createRumahGuritaFacadeDetails(maxAniso = 4): {
  group: THREE.Group;
  facadeMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  windowMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const stuccoTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#d4d8d0';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 700; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(32,38,35,0.06)' : 'rgba(245,248,240,0.06)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 4 + Math.random() * 10, 4 + Math.random() * 12);
      }
      // Jejak rembesan hujan di fasad Art-Deco
      for (let i = 0; i < 32; i++) {
        ctx.fillStyle = 'rgba(30,36,34,0.08)';
        ctx.fillRect(Math.random() * w, 0, 3 + Math.random() * 4, 65 + Math.random() * 160);
      }
    },
    3,
    2,
    maxAniso
  );

  const facadeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: stuccoTex,
    roughness: 0.86,
    metalness: 0.04,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xe6e8e0, roughness: 0.76, metalness: 0.06 });
  const stonePlinthMat = new THREE.MeshStandardMaterial({ color: 0x3b403c, roughness: 0.92 });
  const darkMullion = new THREE.MeshStandardMaterial({ color: 0x222927, roughness: 0.45, metalness: 0.5 });
  const ironRailMat = new THREE.MeshStandardMaterial({ color: 0x1b2022, roughness: 0.38, metalness: 0.78 });
  const balconyDeckMat = new THREE.MeshStandardMaterial({ color: 0x2f3532, roughness: 0.9 });
  const shingleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createCorrugatedZincTexture(maxAniso),
    roughness: 0.78,
    metalness: 0.25,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x26484f,
    emissive: new THREE.Color(0x132b30),
    emissiveIntensity: 0.55,
    roughness: 0.16,
    metalness: 0.32,
  });
  const clearGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x8cc2cc,
    emissive: new THREE.Color(0x1f3a36),
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.36,
    roughness: 0.12,
    metalness: 0.12,
  });

  // Pondasi batu kali keliling dasar bangunan utama (21.5m x 16.5m)
  const baseSouthL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.36, 0.38), stonePlinthMat);
  baseSouthL.position.set(-8.4, 0.18, 7.56);
  const baseSouthR = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.36, 0.38), stonePlinthMat);
  baseSouthR.position.set(2.9, 0.18, 7.56);
  const baseNorth = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.36, 0.38), stonePlinthMat);
  baseNorth.position.set(0, 0.18, -8.56);
  const baseEast = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 16.3), stonePlinthMat);
  baseEast.position.set(10.56, 0.18, -0.5);
  group.add(baseSouthL, baseSouthR, baseNorth, baseEast);

  // Sabuk lis beton bertingkat mengelilingi fasad 21m x 16m (Z: -8.5..+7.5, pusat Z = -0.5)
  for (const cy of [3.95, 7.95]) {
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(21.75, 0.3, 16.75), trimMat);
    cornice.position.set(0, cy, -0.5);
    cornice.castShadow = true;
    group.add(cornice);

    const dripLip = new THREE.Mesh(new THREE.BoxGeometry(21.95, 0.1, 16.95), facadeMat);
    dripLip.position.set(0, cy + 0.17, -0.5);
    group.add(dripLip);
  }

  // Kanopi putih melengkung panjang di atas lantai dasar + tudung pintu masuk gelap bergelombang + siku penyangga
  const groundCanopy = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.24, 1.4), trimMat);
  groundCanopy.position.set(2.4, 3.62, 8.12);
  groundCanopy.castShadow = true;
  group.add(groundCanopy);

  const groundCanopyLip = new THREE.Mesh(new THREE.BoxGeometry(15.7, 0.12, 0.18), facadeMat);
  groundCanopyLip.position.set(2.4, 3.55, 8.8);
  group.add(groundCanopyLip);

  const entryCanopy = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.16, 1.65), shingleMat);
  entryCanopy.position.set(-5.5, 3.68, 8.18);
  entryCanopy.rotation.x = 0.24;
  entryCanopy.castShadow = true;
  group.add(entryCanopy);

  // Siku penyangga besi kanopi pintu + anak tangga teras depan + sepasang lentera dinding kuningan
  for (const sx of [-6.85, -4.15]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.25), ironRailMat);
    bracket.position.set(sx, 3.35, 8.02);
    bracket.rotation.x = -0.55;
    group.add(bracket);

    const lanternHousing = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), ironRailMat);
    lanternHousing.position.set(sx, 2.38, 7.72);
    group.add(lanternHousing);

    const lanternGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.2, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xffd280 })
    );
    lanternGlow.position.set(sx, 2.36, 7.72);
    group.add(lanternGlow);
  }

  const entryStep = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.9), stonePlinthMat);
  entryStep.position.set(-5.5, 0.01, 7.98);
  group.add(entryStep);

  // Kerawang Roster Beton 1980-an di sayap kiri depan & dinding tangga barat (sesuai foto asli Bandung!)
  const rosterMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createRosterBlockTexture(maxAniso),
    roughness: 0.85,
  });
  const frontRoster = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.35, 0.12), rosterMat);
  frontRoster.position.set(-8.65, 2.15, 7.62);
  group.add(frontRoster);

  const westRoster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 3.2), rosterMat);
  westRoster.position.set(-10.64, 5.85, -4.6);
  group.add(westRoster);

  // 3 Balkon Lengkung Putih Ikonik di sisi Selatan (Z = 7.5), bertingkat Lt.2 & Parapet Atap
  const balconyXs = [-5.8, 0.2, 6.2];
  for (const bx of balconyXs) {
    // Tiang silinder pendukung antar lantai lengkap dengan alas & kapitel cincin
    if (bx < -4) {
      const upperCol = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.0, 14), facadeMat);
      upperCol.position.set(bx, 6.0, 7.75);
      upperCol.castShadow = true;
      group.add(upperCol);

      for (const px of [-6.75, -4.25]) {
        const pilaster = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.95, 12), facadeMat);
        pilaster.position.set(px, 1.975, 7.75);
        pilaster.castShadow = true;
        group.add(pilaster);
        const pBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.28, 12), stonePlinthMat);
        pBase.position.set(px, 0.14, 7.75);
        group.add(pBase);
      }
    } else {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 8.0, 14), facadeMat);
      col.position.set(bx, 4.0, 7.75);
      col.castShadow = true;
      group.add(col);
      const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.3, 12), stonePlinthMat);
      cBase.position.set(bx, 0.15, 7.75);
      group.add(cBase);
    }

    // Mangkuk balkon melengkung pada bibir Lantai 2 (y=3.95) & Rooftop (y=7.95)
    for (const by of [3.95, 7.95]) {
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.95, 1.65, 1.05, 22, 1, false, -Math.PI * 0.5, Math.PI),
        facadeMat
      );
      bowl.position.set(bx, by + 0.35, 7.52);
      bowl.castShadow = true;
      bowl.receiveShadow = true;
      group.add(bowl);

      // Corbel lengkung bawah balkon (perut mangkuk beton seperti foto asli)
      const soffit = new THREE.Mesh(
        new THREE.CylinderGeometry(1.65, 0.62, 0.38, 22, 1, false, -Math.PI * 0.5, Math.PI),
        trimMat
      );
      soffit.position.set(bx, by - 0.35, 7.52);
      group.add(soffit);

      // Lantai dalam balkon
      const deck = new THREE.Mesh(
        new THREE.CylinderGeometry(1.75, 1.75, 0.08, 18, 1, false, -Math.PI * 0.5, Math.PI),
        balconyDeckMat
      );
      deck.position.set(bx, by + 0.12, 7.52);
      group.add(deck);

      // Cincin lis horizontal khas foto Rumah Gurita
      for (const ry of [by - 0.05, by + 0.38, by + 0.82]) {
        const rib = new THREE.Mesh(
          new THREE.CylinderGeometry(2.05, 2.05, 0.12, 22, 1, false, -Math.PI * 0.5, Math.PI),
          trimMat
        );
        rib.position.set(bx, ry, 7.52);
        group.add(rib);
      }

      // Pagar pipa besi tipis di atas bibir balkon atap
      if (by > 7) {
        const railArc = new THREE.Mesh(
          new THREE.TorusGeometry(1.92, 0.032, 6, 20, Math.PI),
          ironRailMat
        );
        railArc.rotation.x = Math.PI / 2;
        railArc.position.set(bx, by + 1.15, 7.52);
        group.add(railArc);
      }
    }
  }

  // Balkon melengkung kecil di sisi Timur & Barat Lantai 2/Atap + corbel bawah
  for (const side of [-1, 1]) {
    for (const by of [3.95, 7.95]) {
      const sideBowl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.35, 0.98, 18, 1, false, side > 0 ? 0 : Math.PI, Math.PI),
        facadeMat
      );
      sideBowl.position.set(side * 10.52, by + 0.35, -0.5);
      sideBowl.castShadow = true;
      group.add(sideBowl);

      const sideSoffit = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 0.48, 0.34, 18, 1, false, side > 0 ? 0 : Math.PI, Math.PI),
        trimMat
      );
      sideSoffit.position.set(side * 10.52, by - 0.28, -0.5);
      group.add(sideSoffit);
    }

    // Jendela strip sisi Timur & Barat Lantai 2 agar dinding samping tidak polos
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.45, 5.2), windowMat);
    sideGlass.position.set(side * 10.64, 6.05, 3.2);
    group.add(sideGlass);
    for (let mz = 0.8; mz <= 5.6; mz += 1.2) {
      const mull = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.52, 0.08), darkMullion);
      mull.position.set(side * 10.64, 6.05, mz);
      group.add(mull);
    }
  }

  // Strip Jendela Kaca Panjang Lantai 2 (memanjang di sisi kanan/tengah & barat seperti foto)
  const stripSegments = [
    { x: 3.1, z: 7.62, w: 8.6, h: 1.55 },
    { x: -6.0, z: 7.62, w: 5.2, h: 1.55 },
  ];
  for (const seg of stripSegments) {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(seg.w, seg.h, 0.1), windowMat);
    glass.position.set(seg.x, 6.05, seg.z);
    group.add(glass);

    // Kusen aluminium atas & bawah membingkai strip kaca
    for (const sy of [6.05 - seg.h * 0.5 - 0.05, 6.05 + seg.h * 0.5 + 0.05]) {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(seg.w + 0.16, 0.1, 0.22), trimMat);
      sill.position.set(seg.x, sy, seg.z + 0.03);
      group.add(sill);
    }

    const steps = Math.floor(seg.w / 1.4);
    for (let i = 0; i <= steps; i++) {
      const mx = seg.x - seg.w * 0.5 + (i / steps) * seg.w;
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, seg.h + 0.08, 0.14), darkMullion);
      mullion.position.set(mx, 6.05, seg.z);
      group.add(mullion);
    }
  }

  // Jendela kaca lantai dasar lebar menghadap kolam renang & teras (seperti foto asli)
  const groundWin = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.25, 0.08), clearGlassMat);
  groundWin.position.set(4.5, 1.95, 7.62);
  group.add(groundWin);
  for (const gy of [0.8, 3.1]) {
    const gFrame = new THREE.Mesh(new THREE.BoxGeometry(9.75, 0.1, 0.18), darkMullion);
    gFrame.position.set(4.5, gy, 7.62);
    group.add(gFrame);
  }
  for (let wx = -0.3; wx <= 9.3; wx += 1.6) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.35, 0.14), darkMullion);
    mullion.position.set(wx, 1.95, 7.62);
    group.add(mullion);
  }

  // Lukisan siluet kuda laut/kelautan di balik kaca ruang depan (detail foto asli)
  const muralTex = createMarineMuralTexture(maxAniso);
  const reliefFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.35, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: muralTex,
      roughness: 0.68,
    })
  );
  reliefFrame.position.set(1.4, 2.08, 7.34);
  group.add(reliefFrame);

  return { group, facadeMat, trimMat, windowMat };
}

/**
 * Detail Interior Rumah Gurita (Lantai 1 & Lantai 2):
 * Plinth kayu lantai, balok plafon, pegangan & tiang tangga, karpet ruang keluarga, bingkai lukisan 80-an, & lampu gantung.
 */
export function createRumahGuritaInteriorDetails(maxAniso = 4): THREE.Group {
  const g = new THREE.Group();
  const trimWood = new THREE.MeshStandardMaterial({ color: 0x2c1b12, roughness: 0.82 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x3b281c, roughness: 0.86 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4a54e, roughness: 0.28, metalness: 0.82 });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf0dec0,
    emissive: new THREE.Color(0xd99b4e),
    emissiveIntensity: 0.65,
    roughness: 0.4,
  });

  // 1. Pegangan & Tiang Baluster Tangga (Lantai 1 -> 2 dan Lantai 2 -> Rooftop)
  const addStairHandrail = (
    xLeft: number,
    xRight: number,
    zStart: number,
    zEnd: number,
    yStart: number,
    yEnd: number
  ) => {
    const dz = zEnd - zStart;
    const dy = yEnd - yStart;
    const len = Math.hypot(dz, dy);
    const pitch = Math.atan2(dy, Math.abs(dz));
    for (const rx of [xLeft + 0.08, xRight - 0.08]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, len), trimWood);
      rail.position.set(rx, (yStart + yEnd) * 0.5 + 0.92, (zStart + zEnd) * 0.5);
      rail.rotation.x = pitch;
      g.add(rail);

      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.92, 0.055), trimWood);
        post.position.set(
          rx,
          yStart + (yEnd - yStart) * t + 0.46,
          zStart + (zEnd - zStart) * t
        );
        g.add(post);
      }
    }
  };
  addStairHandrail(-1.65, 1.55, -2.0, -7.6, 0.0, 4.0);
  addStairHandrail(1.85, 4.75, -2.0, -6.8, 4.0, 8.0);

  // 2. Plinth kayu bawah dinding & balok plafon Lantai 1 (y=0..3.8) + Lantai 2 (y=4..7.8)
  for (const baseY of [0, 4.0]) {
    const northTrim = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.16, 0.06), trimWood);
    northTrim.position.set(0, baseY + 0.08, -8.33);
    const eastTrim = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 15.6), trimWood);
    eastTrim.position.set(10.33, baseY + 0.08, -0.5);
    g.add(northTrim, eastTrim);

    for (const bx of [-6.0, 0.0, 6.5]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 15.6), beamMat);
      beam.position.set(bx, baseY + 3.78, -0.5);
      g.add(beam);
    }
  }

  // 3. Karpet Tenun Nusantara di ruang tamu, ruang makan, & ruang keluarga Lt.2
  const rugTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#4a201b';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#c4964e';
      ctx.lineWidth = 10;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.strokeStyle = '#24453a';
      ctx.lineWidth = 5;
      ctx.strokeRect(28, 28, w - 56, h - 56);
    },
    1,
    1,
    maxAniso,
    true,
    256,
    256
  );
  const rugMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: rugTex,
    roughness: 0.94,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const rugPlacements: [number, number, number, number, number][] = [
    [-6.0, 0.04, 2.2, 3.6, 2.8],
    [-6.2, 0.04, -5.8, 3.2, 2.6],
    [-6.2, 4.02, 0.8, 3.6, 3.2],
  ];
  for (const [rx, ry, rz, rw, rd] of rugPlacements) {
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(rx, ry, rz);
    g.add(rug);
  }

  // 4. Lampu Gantung Plafon Antik & Bingkai Lukisan Dinding
  const lampSpots: [number, number, number][] = [
    [-6.0, 3.85, 2.2],
    [1.0, 3.85, 4.8],
    [6.8, 3.85, -4.5],
    [-6.2, 7.85, 1.2],
    [7.5, 7.85, 3.5],
  ];
  for (const [lx, ly, lz] of lampSpots) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), brassMat);
    rod.position.set(lx, ly - 0.275, lz);
    const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.16, 12), shadeMat);
    bowl.position.set(lx, ly - 0.58, lz);
    bowl.rotation.x = Math.PI;
    g.add(rod, bowl);
  }

  const paintingColors = [0x29444a, 0x5c3626, 0x263b2d];
  const paintings: [number, number, number, number][] = [
    [-10.32, 1.95, 3.8, Math.PI / 2],
    [-1.95, 1.95, -4.5, -Math.PI / 2],
    [-10.32, 5.95, 3.8, Math.PI / 2],
  ];
  paintings.forEach(([px, py, pz, ry], idx) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.82, 0.06), trimWood);
    frame.position.set(px, py, pz);
    frame.rotation.y = ry;
    const canvas = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.64, 0.07),
      new THREE.MeshStandardMaterial({ color: paintingColors[idx % paintingColors.length], roughness: 0.7 })
    );
    canvas.position.set(px, py, pz);
    canvas.rotation.y = ry;
    g.add(frame, canvas);
  });

  return g;
}

export function createPlaque666(maxAniso: number): THREE.Mesh {
  const tex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#1b1412';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#7a251c';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#cc2c22';
      ctx.font = 'bold 98px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('666', w / 2, h / 2 - 14);
      ctx.fillStyle = '#9aa39d';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('SUKAJADI · BANDUNG', w / 2, h - 38);
    },
    1,
    1,
    maxAniso
  );
  return new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.85, 0.08),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(0x52120d),
      emissiveIntensity: 0.7,
      roughness: 0.5,
      metalness: 0.35,
    })
  );
}

/**
 * Pintu kayu 3D berengsel dengan bingkai, gagang kuningan, dan pelat kunci status.
 */
export function createDoorAssembly(door: DoorData): {
  pivot: THREE.Group;
  frameGroup: THREE.Group;
  lockPlateMat: THREE.MeshStandardMaterial;
} {
  const frameGroup = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x261a12, roughness: 0.84 });
  const leafMat = new THREE.MeshStandardMaterial({
    color: door.lockedKeyId ? 0x452820 : 0x4d3422,
    roughness: 0.76,
    metalness: 0.08,
  });
  const panelInsetMat = new THREE.MeshStandardMaterial({ color: 0x362216, roughness: 0.85 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd9a84e, roughness: 0.28, metalness: 0.82 });
  const lockPlateMat = new THREE.MeshStandardMaterial({
    color: door.lockedKeyId ? 0xb53429 : 0x6b8f74,
    emissive: new THREE.Color(door.lockedKeyId ? 0x7a1c14 : 0x16291c),
    emissiveIntensity: door.lockedKeyId ? 0.9 : 0.35,
    roughness: 0.4,
  });

  // Engsel pivot di door.hingePos
  const pivot = new THREE.Group();
  pivot.position.set(door.hingePos.x, door.hingePos.y, door.hingePos.z);
  pivot.rotation.y = door.currentAngle;

  // Daun pintu memanjang sepanjang +X lokal dari 0..door.width
  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(door.width, door.height, door.thickness),
    leafMat
  );
  leaf.position.set(door.width * 0.5, door.height * 0.5, 0);
  leaf.castShadow = true;
  leaf.receiveShadow = true;
  pivot.add(leaf);

  // Panel ukiran dekoratif depan & belakang
  for (const py of [door.height * 0.32, door.height * 0.72]) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(door.width * 0.68, door.height * 0.28, door.thickness + 0.025),
      panelInsetMat
    );
    panel.position.set(door.width * 0.5, py, 0);
    pivot.add(panel);
  }

  // Gagang pintu kuningan di kedua sisi
  for (const sz of [-1, 1]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), brassMat);
    knob.position.set(door.width - 0.16, 1.05, sz * (door.thickness * 0.5 + 0.055));
    pivot.add(knob);

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.02), lockPlateMat);
    plate.position.set(door.width - 0.16, 1.02, sz * (door.thickness * 0.5 + 0.015));
    pivot.add(plate);
  }

  // Kusen tiang engsel tipis untuk penegasan arsitektur
  const postA = new THREE.Mesh(new THREE.BoxGeometry(0.1, door.height, 0.24), frameMat);
  postA.position.set(door.hingePos.x, door.hingePos.y + door.height * 0.5, door.hingePos.z);
  frameGroup.add(postA);

  return { pivot, frameGroup, lockPlateMat };
}

export function createStreetCart(kind: 'nasgor' | 'pecel', maxAniso: number): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4b3322, roughness: 0.85 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x2a3034, roughness: 0.45, metalness: 0.7 });
  const roofColor = kind === 'nasgor' ? 0x2e4a5e : 0x733224;
  const canopyMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.75 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xb7d4dc,
    transparent: true,
    opacity: 0.4,
    roughness: 0.15,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.95, 0.95), woodMat);
  body.position.y = 0.72;
  body.castShadow = true;
  group.add(body);

  const showcase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.8), glassMat);
  showcase.position.set(-0.25, 1.5, 0);
  group.add(showcase);

  for (const sx of [-0.88, 0.88]) {
    for (const sz of [-0.42, 0.42]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), darkMetal);
      post.position.set(sx, 1.75, sz);
      group.add(post);
    }
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.1, 1.2), canopyMat);
  roof.position.y = 2.35;
  roof.castShadow = true;
  group.add(roof);

  for (const sx of [-0.65, 0.65]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16), darkMetal);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(sx, 0.32, 0.5);
    group.add(wheel);
  }

  const bannerTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = kind === 'nasgor' ? '#d9a441' : '#c95c38';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1c1512';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = '#181210';
      ctx.font = 'bold 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(kind === 'nasgor' ? 'NASI GORENG' : 'PECEL LELE', w / 2, h / 2 - 18);
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('SUKAJADI MALAM', w / 2, h / 2 + 28);
    },
    1,
    1,
    maxAniso,
    true,
    512,
    192
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.55),
    new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 2.02, 0.58);
  group.add(sign);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd280 })
  );
  bulb.position.set(0.35, 2.2, 0.2);
  group.add(bulb);

  return group;
}

/**
 * Pos Ronda / Gardu Keamanan Komplek Sukajadi (atap genteng bertekstur, bilik bambu, bangku kayu, jadwal ronda, & kentongan).
 */
export function createPosRonda(maxAniso: number): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x473020, roughness: 0.88 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x3b403c, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createGentengRoofTexture(0x733223, maxAniso),
    roughness: 0.82,
  });
  const bilikMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createBilikBambuTexture(maxAniso),
    roughness: 0.9,
  });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 3.1), floorMat);
  plinth.position.y = 0.11;
  group.add(plinth);

  for (const sx of [-1.45, 1.45]) {
    for (const sz of [-1.25, 1.25]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.52, 0.15), woodMat);
      post.position.set(sx, 1.36, sz);
      post.castShadow = true;
      group.add(post);
    }
  }

  // Dinding setengah bilik bambu di belakang (-X) & sisi utara (-Z)
  const backBilik = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 2.9), bilikMat);
  backBilik.position.set(-1.45, 0.74, 0);
  const northBilik = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.05, 0.12), bilikMat);
  northBilik.position.set(0, 0.74, -1.25);
  group.add(backBilik, northBilik);

  // Bangku panjang & meja pojok dengan teko kopi
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 2.4), woodMat);
  bench.position.set(-0.95, 0.55, 0);
  const backRest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 2.4), woodMat);
  backRest.position.set(-1.26, 0.82, 0);
  const cornerTable = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.58, 0.6), woodMat);
  cornerTable.position.set(0.85, 0.51, -0.82);
  const kettle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.11, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x265947, roughness: 0.4, metalness: 0.3 })
  );
  kettle.position.set(0.85, 0.9, -0.82);
  group.add(bench, backRest, cornerTable, kettle);

  // Atap limas genteng + lisplang kayu + mahkota nok
  const eave = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.14, 3.3), woodMat);
  eave.position.y = 2.6;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.18, 4), roofMat);
  roof.position.y = 3.22;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.22, 6), roofMat);
  crown.position.y = 3.85;
  group.add(eave, roof, crown);

  // Kentongan bambu gantung + pemukul kayu
  const kentongan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.68, 8),
    new THREE.MeshStandardMaterial({ color: 0x9c7c49, roughness: 0.78 })
  );
  kentongan.position.set(1.42, 1.85, 0.95);
  const striker = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.35, 6), woodMat);
  striker.position.set(1.42, 1.68, 0.75);
  striker.rotation.x = 0.45;
  group.add(kentongan, striker);

  // Papan Jadwal Ronda Malam di dinding dalam
  const boardTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#18241d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#cfa15a';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = '#eef2ea';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JADWAL RONDA RT 04', w / 2, 42);
      ctx.font = '20px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#c5d6c7';
      ctx.fillText('SEN-RAB: PAK UJANG & KANG DEDI', 24, 90);
      ctx.fillText('KAM-SAB: MANG ASEP & MAS BUDI', 24, 126);
      ctx.fillText('MINGGU : KERJA BAKTI WARGA', 24, 162);
    },
    1,
    1,
    maxAniso,
    true,
    512,
    192
  );
  const jadwalBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.62),
    new THREE.MeshBasicMaterial({ map: boardTex, side: THREE.DoubleSide })
  );
  jadwalBoard.position.set(-1.35, 1.75, -0.1);
  jadwalBoard.rotation.y = Math.PI / 2;
  group.add(jadwalBoard);

  // Papan POS RONDA RT 04 di luar
  const signTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#18241d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#cfa15a';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#ebe7dc';
      ctx.font = 'bold 46px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('POS RONDA', w / 2, h / 2 - 20);
      ctx.fillStyle = '#cfa15a';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('SUKAJADI RT 04', w / 2, h / 2 + 26);
    },
    1,
    1,
    maxAniso,
    true,
    512,
    192
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.52),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(1.48, 2.4, 0);
  sign.rotation.y = Math.PI / 2;
  group.add(sign);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd58a })
  );
  lamp.position.set(0, 2.48, 0);
  group.add(lamp);

  return group;
}

/**
 * Rumah Komplek Perumahan di sekitar Jalan Sukajadi:
 * Atap genteng bertekstur + jurai nok, lisplang kayu, teras berundak & pagar, jendela krepyak berbingkai,
 * kotak tanaman depan, unit AC luar, dan lampu plafon interior saat pintu dibuka.
 */
export function createNeighborhoodHouseRoofAndFacade(
  spec: NeighborhoodHouseSpec,
  maxAniso = 4
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);
  group.rotation.y = spec.rotY;

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createGentengRoofTexture(spec.roofColor, maxAniso),
    roughness: 0.82,
  });
  const ridgeMat = new THREE.MeshStandardMaterial({ color: spec.roofColor, roughness: 0.78 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x333a35, roughness: 0.82 });
  const woodFrameMat = new THREE.MeshStandardMaterial({ color: 0x452d1d, roughness: 0.78 });
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x484d49, roughness: 0.9 });
  const planterLeafMat = new THREE.MeshStandardMaterial({ color: 0x2a4e2d, roughness: 0.86, flatShading: true });
  const warmWinMat = new THREE.MeshStandardMaterial({
    color: 0xffd796,
    emissive: new THREE.Color(0xc98836),
    emissiveIntensity: 0.68,
    roughness: 0.28,
  });

  // 1. Pondasi batu & atap limas genteng dengan jurai nok + lisplang + talang air
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(spec.w + 0.3, 0.24, spec.d + 0.3), plinthMat);
  plinth.position.y = 0.12;
  group.add(plinth);

  const roofRadius = Math.max(spec.w, spec.d) * 0.77;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(roofRadius, 2.55, 4), roofMat);
  roof.position.y = 4.78;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Jurai nok genteng 4 sudut + mahkota atap
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.28, 6), ridgeMat);
  crown.position.y = 6.08;
  group.add(crown);
  for (let r = 0; r < 4; r++) {
    const ang = (r / 4) * Math.PI * 2 + Math.PI / 4;
    const ridgeLen = Math.hypot(roofRadius * 0.96, 2.5);
    const hipRidge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, ridgeLen), ridgeMat);
    hipRidge.position.set(
      Math.sin(ang) * roofRadius * 0.48,
      4.78,
      Math.cos(ang) * roofRadius * 0.48
    );
    hipRidge.rotation.y = ang;
    hipRidge.rotation.x = Math.atan2(2.5, roofRadius * 0.96);
    group.add(hipRidge);
  }

  const eave = new THREE.Mesh(new THREE.BoxGeometry(spec.w + 0.88, 0.2, spec.d + 0.88), trimMat);
  eave.position.y = 3.55;
  group.add(eave);

  // Talang air vertikal di dua sudut depan
  for (const gx of [-spec.w * 0.48, spec.w * 0.48]) {
    const gutter = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.45, 6), trimMat);
    gutter.position.set(gx, 1.78, spec.d * 0.5 + 0.22);
    group.add(gutter);
  }

  // 2. Teras depan (+Z lokal) lengkap dengan undakan, kanopi, tiang berumpak, & pagar teras
  const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.16, 1.55), plinthMat);
  porchFloor.position.set(0, 0.08, spec.d * 0.5 + 0.72);
  group.add(porchFloor);

  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.55), roofMat);
  porchRoof.position.set(0, 2.76, spec.d * 0.5 + 0.68);
  porchRoof.rotation.x = 0.09;
  group.add(porchRoof);

  for (const px of [-1.45, 1.45]) {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.32), plinthMat);
    colBase.position.set(px, 0.21, spec.d * 0.5 + 1.2);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.35, 8), trimMat);
    col.position.set(px, 1.58, spec.d * 0.5 + 1.2);
    group.add(colBase, col);
  }

  // Jendela Berbingkai Kayu + Daun Krepyak Kiri-Kanan + Kusen Atas/Bawah
  for (const wx of [-spec.w * 0.29, spec.w * 0.29]) {
    const fz = spec.d * 0.5 + 0.16;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.32, 0.1), woodFrameMat);
    frame.position.set(wx, 1.72, fz);
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.08, 0.12), warmWinMat);
    win.position.set(wx, 1.72, fz);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.12, 0.14), woodFrameMat);
    crossV.position.set(wx, 1.72, fz);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.06, 0.14), woodFrameMat);
    crossH.position.set(wx, 1.72, fz);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.09, 0.22), trimMat);
    sill.position.set(wx, 1.05, fz + 0.04);
    group.add(frame, win, crossV, crossH, sill);

    for (const sx of [-0.88, 0.88]) {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.24, 0.06), trimMat);
      shutter.position.set(wx + sx, 1.72, fz + 0.02);
      group.add(shutter);
    }

    // Kotak bunga & semak teras di bawah jendela
    const planter = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.34, 0.42), plinthMat);
    planter.position.set(wx, 0.17, spec.d * 0.5 + 0.36);
    const bush = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.45, 7), planterLeafMat);
    bush.position.set(wx, 0.52, spec.d * 0.5 + 0.36);
    group.add(planter, bush);
  }

  // Unit AC luar di dinding samping + lampu teras hangat + lampu langit-langit dalam ruangan
  const acBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.52, 0.72),
    new THREE.MeshStandardMaterial({ color: 0xc2c7c0, roughness: 0.55 })
  );
  acBox.position.set(spec.w * 0.5 + 0.2, 2.35, 0.8);
  const acFan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.06, 10),
    new THREE.MeshStandardMaterial({ color: 0x222628, roughness: 0.7 })
  );
  acFan.rotation.z = Math.PI / 2;
  acFan.position.set(spec.w * 0.5 + 0.35, 2.35, 0.8);
  group.add(acBox, acFan);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe0a8 })
  );
  lamp.position.set(0, 2.58, spec.d * 0.5 + 0.65);
  const innerLamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe2a6 })
  );
  innerLamp.position.set(0, 3.25, 0);
  group.add(lamp, innerLamp);

  return group;
}

/**
 * Masjid Al-Ikhlas Komplek Sukajadi:
 * Kubah 8-rusuk emas, menara bertingkat dengan balkon muadzin & 4 corong toa, lengkung serambi Islami,
 * jendela kerawang/roster, undakan marmer, tempat wudhu, serta mihrab & lampu gantung interior.
 */
export function createMosque(x: number, z: number, maxAniso: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const creamMat = new THREE.MeshStandardMaterial({ color: 0xd8dad0, roughness: 0.82 });
  const stoneStepMat = new THREE.MeshStandardMaterial({ color: 0x676e68, roughness: 0.78 });
  const greenDomeMat = new THREE.MeshStandardMaterial({ color: 0x1e5c3e, roughness: 0.4, metalness: 0.28 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd9a84e, roughness: 0.28, metalness: 0.8 });
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0x164a32, roughness: 0.95 });
  const rosterTex = createRosterBlockTexture(maxAniso);
  const winGlowMat = new THREE.MeshStandardMaterial({
    color: 0xd8ffe3,
    map: rosterTex,
    emissive: new THREE.Color(0x6bd498),
    emissiveIntensity: 0.62,
  });

  // Sajadah & ruang dalam (Mihrab Timur + lampu gantung kuningan)
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.04, 8.8), carpetMat);
  carpet.position.y = 0.14;
  group.add(carpet);

  const mihrabArch = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.16, 8, 16, Math.PI), brassMat);
  mihrabArch.position.set(4.95, 2.3, 0);
  mihrabArch.rotation.y = -Math.PI / 2;
  const chandelier = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 16), brassMat);
  chandelier.rotation.x = Math.PI / 2;
  chandelier.position.set(0, 3.4, 0);
  const chandelierBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffebba })
  );
  chandelierBulb.position.set(0, 3.35, 0);
  group.add(mihrabArch, chandelier, chandelierBulb);

  // Atap bertingkat, cornice lis emas & kubah utama + 8 rusuk meridian
  const lowerRoof = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.32, 11.6), creamMat);
  lowerRoof.position.y = 4.25;
  const roofParapet = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.16, 11.8), greenDomeMat);
  roofParapet.position.y = 4.46;
  group.add(lowerRoof, roofParapet);

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.9, 1.25, 8), creamMat);
  drum.position.y = 4.98;
  const drumRing = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.85, 0.18, 8), brassMat);
  drumRing.position.y = 5.56;
  group.add(drum, drumRing);

  const domePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(2.65, 0.2),
    new THREE.Vector2(2.85, 1.25),
    new THREE.Vector2(2.15, 2.45),
    new THREE.Vector2(0.85, 3.25),
    new THREE.Vector2(0.0, 3.7),
  ];
  const dome = new THREE.Mesh(new THREE.LatheGeometry(domePts, 24), greenDomeMat);
  dome.position.y = 5.52;
  dome.castShadow = true;
  group.add(dome);

  // 8 Rusuk lengkung emas di sekeliling kubah
  for (let r = 0; r < 8; r++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(2.76, 0.045, 6, 18, Math.PI * 0.56), brassMat);
    rib.position.y = 6.55;
    rib.rotation.y = (r / 8) * Math.PI * 2;
    group.add(rib);
  }

  // Mustaka / Bulan Sabit di puncak kubah
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.15, 8), brassMat);
  spire.position.y = 9.65;
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 16, Math.PI * 1.4), brassMat);
  crescent.position.y = 10.35;
  crescent.rotation.z = Math.PI * 0.25;
  group.add(spire, crescent);

  // Menara Masjid Bertingkat (X = -5.4, Z = -5.4 lokal) dengan pagar balkon & 4 corong toa
  const minaretBase = new THREE.Mesh(new THREE.BoxGeometry(1.72, 8.5, 1.72), creamMat);
  minaretBase.position.set(-5.4, 4.25, -5.4);
  minaretBase.castShadow = true;
  group.add(minaretBase);

  for (const my of [4.4, 6.6]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.2, 1.88), greenDomeMat);
    band.position.set(-5.4, my, -5.4);
    group.add(band);
  }

  const balcony = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.26, 2.35), brassMat);
  balcony.position.set(-5.4, 8.5, -5.4);
  const balRail = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.55, 2.42), creamMat);
  balRail.position.set(-5.4, 8.85, -5.4);
  group.add(balcony, balRail);

  // 4 Corong Toa pengeras suara adzan di atas balkon menara
  for (let h = 0; h < 4; h++) {
    const ang = (h / 4) * Math.PI * 2;
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.34, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8ecea, roughness: 0.45 })
    );
    horn.position.set(-5.4 + Math.cos(ang) * 1.08, 9.28, -5.4 + Math.sin(ang) * 1.08);
    horn.rotation.z = Math.cos(ang) * -Math.PI * 0.45;
    horn.rotation.x = Math.sin(ang) * Math.PI * 0.45;
    group.add(horn);
  }

  const minDome = new THREE.Mesh(new THREE.SphereGeometry(0.92, 16, 12), greenDomeMat);
  minDome.position.set(-5.4, 9.45, -5.4);
  const minSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.95, 8), brassMat);
  minSpire.position.set(-5.4, 10.65, -5.4);
  group.add(minDome, minSpire);

  // Pilar serambi Barat (-X) lengkap dengan lengkung gerbang Islami, dasar batu & pagar serambi
  const serambiFloor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 11.4), stoneStepMat);
  serambiFloor.position.set(-6.0, 0.09, 0);
  group.add(serambiFloor);

  for (const pz of [-3.6, -1.6, 1.6, 3.6]) {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.1, 10), creamMat);
    pil.position.set(-6.3, 2.05, pz);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.48), brassMat);
    cap.position.set(-6.3, 3.98, pz);
    group.add(pil, cap);

    const win = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.75, 1.05), winGlowMat);
    win.position.set(-5.3, 2.1, pz * 0.85);
    const winArch = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.08, 6, 12, Math.PI), brassMat);
    winArch.rotation.y = Math.PI / 2;
    winArch.position.set(-5.32, 2.98, pz * 0.85);
    group.add(win, winArch);
  }
  // Lengkung gapura tengah serambi
  const centerArch = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.18, 8, 16, Math.PI), greenDomeMat);
  centerArch.rotation.y = Math.PI / 2;
  centerArch.position.set(-6.3, 2.95, 0);
  group.add(centerArch);

  const serambiRoof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.24, 11.3), greenDomeMat);
  serambiRoof.position.set(-5.9, 4.1, 0);
  group.add(serambiRoof);

  // Tempat Wudhu (bangku keramik & 3 kran kuningan di sisi barat daya masjid)
  const wudhuWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.35, 3.1), creamMat);
  wudhuWall.position.set(-5.35, 0.68, 4.4);
  const wudhuDrain = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 3.1), stoneStepMat);
  wudhuDrain.position.set(-5.68, 0.11, 4.4);
  group.add(wudhuWall, wudhuDrain);
  for (const kz of [3.6, 4.4, 5.2]) {
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6), brassMat);
    tap.rotation.z = Math.PI / 2;
    tap.position.set(-5.52, 0.86, kz);
    group.add(tap);
  }

  // Papan nama Masjid
  const signTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#0e291c';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#cfa15a';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = '#f2e8cf';
      ctx.font = 'bold 42px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MASJID AL-IKHLAS', w / 2, h / 2 - 18);
      ctx.fillStyle = '#cfa15a';
      ctx.font = '24px sans-serif';
      ctx.fillText('KOMPLEK SUKAJADI', w / 2, h / 2 + 28);
    },
    1,
    1,
    maxAniso
  );
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.65),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  board.position.set(-6.38, 3.55, 0);
  board.rotation.y = -Math.PI / 2;
  group.add(board);

  return group;
}

/**
 * Baliho Pinggir Jalan Sukajadi: "WINDAH BASUDARA · BOCIL KEMATIAN GARIS KERAS".
 */
export function createBillboardWindah(maxAniso: number): THREE.Group {
  const group = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x2b3136, roughness: 0.42, metalness: 0.78 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x16191c, roughness: 0.5, metalness: 0.65 });

  // Dua tiang baja penyangga + palang silang
  for (const sx of [-1.8, 1.8]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.6, 10), steelMat);
    post.position.set(sx, 3.3, 0);
    post.castShadow = true;
    group.add(post);

    const footing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.65), frameMat);
    footing.position.set(sx, 0.175, 0);
    group.add(footing);
  }

  const brace = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.16, 0.18), steelMat);
  brace.position.set(0, 2.2, 0);
  group.add(brace);

  // Rangka papan reklame (5.4m x 2.8m) lebih tebal dari tiang agar poster bersih tanpa tembus tiang
  const backing = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.9, 0.4), frameMat);
  backing.position.set(0, 5.05, 0);
  backing.castShadow = true;
  group.add(backing);

  const posterTex = makeCanvasTexture(
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#240c16');
      grad.addColorStop(0.5, '#7a1620');
      grad.addColorStop(1, '#141c2c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Bingkai kuning neon
      ctx.strokeStyle = '#f5c038';
      ctx.lineWidth = 16;
      ctx.strokeRect(14, 14, w - 28, h - 28);

      // Ilustrasi ikonik figur gamer + headset + kacamata di sisi kiri
      ctx.fillStyle = '#252b3b';
      ctx.beginPath();
      ctx.arc(178, 260, 118, 0, Math.PI * 2);
      ctx.fill();
      // Kepala karikatur
      ctx.fillStyle = '#dfa982';
      ctx.beginPath();
      ctx.arc(178, 240, 74, 0, Math.PI * 2);
      ctx.fill();
      // Rambut & headset
      ctx.fillStyle = '#14161a';
      ctx.beginPath();
      ctx.arc(178, 202, 76, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e63e35';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(178, 224, 86, Math.PI * 0.95, Math.PI * 2.05);
      ctx.stroke();
      // Kacamata tebal
      ctx.fillStyle = '#0e1116';
      ctx.fillRect(122, 222, 46, 26);
      ctx.fillRect(188, 222, 46, 26);
      ctx.fillRect(168, 230, 20, 8);
      // Senyum lebar
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(178, 268, 26, 0.15, Math.PI - 0.15);
      ctx.stroke();

      // Tipografi utama Baliho (1024x512 proporsi 2:1 presisi!)
      ctx.fillStyle = '#f8d252';
      ctx.font = 'bold 88px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('WINDAH', 340, 148);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 82px sans-serif';
      ctx.fillText('BASUDARA', 340, 232);

      ctx.fillStyle = '#d92b21';
      ctx.fillRect(340, 262, 620, 64);
      ctx.fillStyle = '#fff8dc';
      ctx.font = 'bold 33px sans-serif';
      ctx.fillText('BOCIL KEMATIAN GARIS KERAS', 356, 306);

      ctx.fillStyle = '#c4e0f2';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('ABSEN MALAM JUMAT · SUKAJADI 666', 340, 382);

      ctx.fillStyle = '#f5c038';
      ctx.font = 'italic 26px sans-serif';
      ctx.fillText('"JANGAN LUPA NONTON LIVE & HATI-HATI!"', 340, 434);
    },
    1,
    1,
    maxAniso,
    true,
    1024,
    512
  );

  const posterMat = new THREE.MeshStandardMaterial({
    map: posterTex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: posterTex,
    emissiveIntensity: 0.85,
    roughness: 0.35,
  });

  for (const sz of [-0.21, 0.21]) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(5.25, 2.65), posterMat);
    face.position.set(0, 5.05, sz);
    if (sz < 0) face.rotation.y = Math.PI;
    group.add(face);
  }

  // Lampu sorot atas baliho
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe6a3 });
  for (const lx of [-1.6, 0, 1.6]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.65), steelMat);
    arm.position.set(lx, 6.52, 0.35);
    group.add(arm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bulbMat);
    bulb.position.set(lx, 6.45, 0.65);
    group.add(bulb);
  }

  return group;
}

/**
 * Warung Nongkrong Sukajadi dengan Spanduk "WARUNG CEU TITIN", atap seng bergelombang, terpal biru,
 * panci mie rebus, rentengan kopi, etalase gorengan, galon air, bangku kayu (dingklik), & lampu hangat.
 */
export function createWarungCeuTitin(maxAniso: number): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b483d, roughness: 0.88 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x543823, roughness: 0.84 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x362315, roughness: 0.88 });
  const zincRoofMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createCorrugatedZincTexture(maxAniso),
    roughness: 0.62,
    metalness: 0.38,
  });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x7a5738, roughness: 0.78 });
  const tarpMat = new THREE.MeshStandardMaterial({ color: 0x1d4d7a, roughness: 0.75 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc2e2eb,
    transparent: true,
    opacity: 0.42,
    roughness: 0.12,
  });

  // Lantai keramik teras warung
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 0.16, 7.6),
    new THREE.MeshStandardMaterial({ color: 0x454742, roughness: 0.85 })
  );
  deck.position.set(0.5, 0.08, 0);
  deck.receiveShadow = true;
  group.add(deck);

  // Dinding belakang (-X) dan sisi kiri/kanan (-Z / +Z) bagian kios warung
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.26, 3.1, 6.8), wallMat);
  backWall.position.set(-2.5, 1.55, 0);
  backWall.castShadow = true;
  group.add(backWall);

  for (const sz of [-3.3, 3.3]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.1, 0.26), wallMat);
    sideWall.position.set(-0.7, 1.55, sz);
    sideWall.castShadow = true;
    group.add(sideWall);
  }

  // Tiang kanopi depan (+X = +3.3)
  for (const pz of [-3.3, 0, 3.3]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 3.55, 8), darkWoodMat);
    post.position.set(3.45, 1.775, pz);
    post.castShadow = true;
    group.add(post);
  }

  // Atap seng bergelombang + kaso kayu & gulungan terpal biru khas warung Bandung
  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.14, 7.5), zincRoofMat);
  roof.position.set(0.65, 3.68, 0);
  roof.rotation.z = -0.08;
  roof.castShadow = true;
  group.add(roof);

  for (const rz of [-2.2, 0, 2.2]) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.08, 0.1), darkWoodMat);
    rafter.position.set(0.6, 3.49, rz);
    rafter.rotation.z = -0.08;
    group.add(rafter);
  }

  const rolledTarp = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 6.6, 10), tarpMat);
  rolledTarp.rotation.x = Math.PI / 2;
  rolledTarp.position.set(3.52, 1.98, 0);
  group.add(rolledTarp);

  // Spanduk "WARUNG CEU TITIN" membentang lebar di bagian atas depan warung (1024x256 rasio 4:1 proporsional)
  const spandukTex = makeCanvasTexture(
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#0d1b14');
      grad.addColorStop(0.5, '#193124');
      grad.addColorStop(1, '#101d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#cfa15a';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeStyle = '#f0b857';
      ctx.lineWidth = 3;
      ctx.strokeRect(22, 22, w - 44, h - 44);

      ctx.fillStyle = '#244030';
      ctx.beginPath();
      ctx.arc(112, h / 2, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cfa15a';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.strokeStyle = '#f5dfb3';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      for (const sx of [96, 112, 128]) {
        ctx.beginPath();
        ctx.moveTo(sx, h / 2 - 16);
        ctx.quadraticCurveTo(sx - 8, h / 2 - 30, sx + 4, h / 2 - 44);
        ctx.stroke();
      }
      ctx.fillStyle = '#ebe4d1';
      ctx.beginPath();
      ctx.roundRect(82, h / 2 - 8, 52, 40, [4, 4, 18, 18]);
      ctx.fill();
      ctx.strokeStyle = '#ebe4d1';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(138, h / 2 + 10, 11, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.fillStyle = '#cfa15a';
      ctx.fillRect(72, h / 2 + 34, 72, 7);

      ctx.fillStyle = '#fff9ec';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('WARUNG CEU TITIN', 202, h / 2 - 12);

      ctx.fillStyle = '#f0b857';
      ctx.font = 'bold 31px sans-serif';
      ctx.fillText('KOPI TUBRUK · MIE REBUS · BALA-BALA · GEHU', 204, h / 2 + 36);

      ctx.fillStyle = '#a9d9ba';
      ctx.font = '23px sans-serif';
      ctx.fillText('BASECAMP NONGKRONG SUKAJADI · BUKA 24 JAM', 204, h / 2 + 76);
    },
    1,
    1,
    maxAniso,
    true,
    1024,
    256
  );

  const bannerMat = new THREE.MeshStandardMaterial({
    map: spandukTex,
    emissive: new THREE.Color(0xfff1d6),
    emissiveMap: spandukTex,
    emissiveIntensity: 0.72,
    side: THREE.DoubleSide,
  });

  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.18), bannerMat);
  bannerMesh.position.set(3.58, 2.72, 0);
  bannerMesh.rotation.y = Math.PI / 2;
  group.add(bannerMesh);

  const southBanner = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 0.88), bannerMat);
  southBanner.position.set(1.35, 2.74, 3.62);
  group.add(southBanner);

  const warungLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd58f })
  );
  warungLamp.position.set(1.2, 2.85, 0);
  group.add(warungLamp);

  // Meja Counter Utama Warung + Etalase berisi gorengan + Panci Mie Rebus + Rentengan Kopi
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.96, 4.6), counterMat);
  counter.position.set(-0.35, 0.56, 0);
  counter.castShadow = true;
  group.add(counter);

  const etalase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 1.35), glassMat);
  etalase.position.set(-0.35, 1.35, -1.25);
  group.add(etalase);
  // Nampan gorengan kuning keemasan di dalam etalase
  const gorenganTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.14, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xc98b2c, roughness: 0.72 })
  );
  gorenganTray.position.set(-0.35, 1.15, -1.25);
  group.add(gorenganTray);

  for (const jz of [0.35, 0.85, 1.35]) {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 10), glassMat);
    jar.position.set(-0.35, 1.21, jz);
    group.add(jar);
  }

  // Panci aluminium mie rebus + galon air biru di sebelah counter
  const panci = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.17, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0xbac2c7, roughness: 0.3, metalness: 0.8 })
  );
  panci.position.set(-0.35, 1.15, -0.2);
  const galon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.19, 0.52, 12),
    new THREE.MeshStandardMaterial({ color: 0x2c7ab8, roughness: 0.25, transparent: true, opacity: 0.85 })
  );
  galon.position.set(-0.45, 0.42, 2.75);
  group.add(panci, galon);

  // Rak dagangan & rentengan sachet kopi warna-warni di dinding belakang
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.1, 4.4), darkWoodMat);
  shelf.position.set(-2.15, 1.25, 0);
  group.add(shelf);
  const sachetColors = [0x9e2b24, 0x2a6938, 0xd49b2a, 0x255078];
  for (let s = 0; s < 6; s++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.82, 0.16),
      new THREE.MeshStandardMaterial({ color: sachetColors[s % sachetColors.length], roughness: 0.65 })
    );
    strip.position.set(-1.86, 2.05, -1.6 + s * 0.62);
    group.add(strip);
  }

  // 2 Meja Panjang + Bangku Kayu (Dingklik) tempat Anak Muda duduk nongkrong (x = 1.6..2.6)
  for (const tz of [-1.5, 1.5]) {
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.72, 2.1), woodMat);
    table.position.set(1.85, 0.44, tz);
    table.castShadow = true;
    group.add(table);

    for (const cz of [-0.45, 0.35]) {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.045, 0.11, 8),
        new THREE.MeshStandardMaterial({ color: 0xe6e1d3, roughness: 0.4 })
      );
      cup.position.set(1.85, 0.86, tz + cz);
      group.add(cup);
    }

    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 2.05), darkWoodMat);
    bench.position.set(2.58, 0.3, tz);
    bench.castShadow = true;
    group.add(bench);
  }

  // Lampu bohlam hangat menggantung di warung
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd584 });
  for (const [bx, bz] of [
    [0.2, -1.5],
    [0.2, 1.5],
    [2.1, 0],
  ]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6), darkWoodMat);
    cord.position.set(bx, 2.95, bz);
    group.add(cord);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 8), bulbMat);
    bulb.position.set(bx, 2.68, bz);
    group.add(bulb);
  }

  return group;
}

/**
 * Kolam Renang Halaman Depan Rumah Gurita (di dalam Gerbang Utama, lantai dasar)
 * Lengkap dengan keramik mosaik biru, lampu dinding kolam, tangga stainless, pot tanaman, dan patung singa bersurai.
 */
export function createCourtyardSwimmingPool(): THREE.Group {
  const group = new THREE.Group();
  const stoneCoping = new THREE.MeshStandardMaterial({ color: 0x9aa29a, roughness: 0.72 });
  const mosaicTex = makeCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#155d6e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(130, 225, 240, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= w; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
    },
    3,
    2,
    4,
    true,
    256,
    256
  );
  const tileBasin = new THREE.MeshStandardMaterial({ color: 0xffffff, map: mosaicTex, roughness: 0.45 });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x26b2c7,
    emissive: new THREE.Color(0x0b4b59),
    emissiveIntensity: 0.5,
    roughness: 0.14,
    metalness: 0.35,
    transparent: true,
    opacity: 0.84,
  });
  const stainlessMat = new THREE.MeshStandardMaterial({ color: 0xd0d8db, roughness: 0.22, metalness: 0.88 });
  const statueMat = new THREE.MeshStandardMaterial({ color: 0xbcbeb6, roughness: 0.78 });
  const potMat = new THREE.MeshStandardMaterial({ color: 0x6b4532, roughness: 0.88 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a542d, roughness: 0.84, flatShading: true });

  const rimN = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.28, 0.48), stoneCoping);
  rimN.position.set(0, 0.14, -2.9);
  const rimS = rimN.clone();
  rimS.position.set(0, 0.14, 2.9);
  const rimW = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 5.4), stoneCoping);
  rimW.position.set(-4.58, 0.14, 0);
  const rimE = rimW.clone();
  rimE.position.set(4.58, 0.14, 0);
  group.add(rimN, rimS, rimW, rimE);

  const basin = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.08, 5.4), tileBasin);
  basin.position.y = 0.02;
  group.add(basin);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(8.75, 5.35), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.17;
  group.add(water);

  // Lampu dinding kolam bawah air
  for (const lx of [-2.4, 2.4]) {
    const poolLight = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 10),
      new THREE.MeshBasicMaterial({ color: 0x6ef7ff })
    );
    poolLight.position.set(lx, 0.16, -2.62);
    group.add(poolLight);
  }

  for (const lz of [-0.35, 0.35]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.85, 8), stainlessMat);
    rail.position.set(-4.35, 0.45, lz - 1.2);
    group.add(rail);
  }

  // Patung Singa Taman Putih dengan surai & alas batu
  for (const sz of [-1.5, 1.5]) {
    const lion = new THREE.Group();
    lion.position.set(-5.25, 0, sz);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 0.62), stoneCoping);
    ped.position.y = 0.07;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.42), statueMat);
    body.position.set(0, 0.48, 0);
    body.castShadow = true;
    const mane = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), statueMat);
    mane.position.set(-0.3, 0.72, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), statueMat);
    head.position.set(-0.42, 0.74, 0);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.28, 0.34), statueMat);
    legs.position.set(0, 0.24, 0);
    lion.add(ped, body, mane, head, legs);
    group.add(lion);
  }

  for (const pz of [-2.4, -0.5, 0.5, 2.4]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.38, 10), potMat);
    pot.position.set(-5.05, 0.19, pz);
    const bush = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.82, 7), leafMat);
    bush.position.set(-5.05, 0.68, pz);
    group.add(pot, bush);
  }

  return group;
}

/**
 * Kendaraan Terparkir di Halaman / Carport dalam Gerbang Rumah Gurita.
 */
export function createParkedVehicle(kind: 'sedan' | 'motor'): THREE.Group {
  const g = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x151718, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xa2abb0, roughness: 0.28, metalness: 0.78 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x203038, roughness: 0.16, metalness: 0.4 });

  if (kind === 'sedan') {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5c2320, roughness: 0.38, metalness: 0.32 });
    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.56, 4.1), bodyMat);
    lower.position.y = 0.52;
    lower.castShadow = true;
    g.add(lower);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.54, 2.05), bodyMat);
    cabin.position.set(0, 1.04, -0.15);
    cabin.castShadow = true;
    g.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.42, 2.08), glassMat);
    windshield.position.set(0, 1.04, -0.15);
    g.add(windshield);

    for (const bx of [-0.88, 0.88]) {
      for (const bz of [-1.32, 1.32]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14), tireMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(bx, 0.32, bz);
        g.add(wheel);
      }
    }
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.16, 0.16), metalMat);
    bumperF.position.set(0, 0.34, 2.08);
    g.add(bumperF);
  } else {
    const paintMat = new THREE.MeshStandardMaterial({ color: 0x1f364d, roughness: 0.4, metalness: 0.45 });
    for (const wz of [-0.62, 0.62]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.11, 14), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.28, wz);
      g.add(wheel);
    }
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 1.25), paintMat);
    body.position.set(0, 0.64, 0);
    body.castShadow = true;
    g.add(body);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.65), tireMat);
    seat.position.set(0, 0.88, -0.16);
    g.add(seat);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 0.08), metalMat);
    bar.position.set(0, 1.02, 0.48);
    g.add(bar);
  }

  return g;
}

/**
 * Ornamen Patung Karang, Keong Spiral, Tangki Silinder, Tangga Kolam, & Pagar Pipa Parapet Rooftop (sesuai foto udara Rumah Gurita).
 */
export function createRooftopSculptures(): THREE.Group {
  const g = new THREE.Group();
  const coralMat = new THREE.MeshStandardMaterial({ color: 0x3f4542, roughness: 0.92, flatShading: true });
  const darkRock = new THREE.MeshStandardMaterial({ color: 0x262b2a, roughness: 0.9 });
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x575248, roughness: 0.84 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x2a3134, roughness: 0.4, metalness: 0.78 });

  // 1. Lengkungan & terowongan karang batu laut di sisi barat laut/utara atap
  for (let i = 0; i < 5; i++) {
    const pillar = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.68 + (i % 2) * 0.26, 0),
      i % 2 === 0 ? coralMat : darkRock
    );
    pillar.position.set(-8.8 + i * 1.38, 0.62, -7.25 + (i % 2) * 0.35);
    pillar.scale.set(1.0, 1.5, 0.92);
    pillar.castShadow = true;
    g.add(pillar);
  }

  const coralArch = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.32, 7, 12, Math.PI), coralMat);
  coralArch.position.set(-6.4, 0.85, -7.3);
  g.add(coralArch);

  // 2. Patung Keong & Cangkang Kerang Raksasa bersusun di atap
  const conchPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.72, 0.22),
    new THREE.Vector2(0.64, 0.65),
    new THREE.Vector2(0.48, 1.05),
    new THREE.Vector2(0.28, 1.42),
    new THREE.Vector2(0.06, 1.72),
    new THREE.Vector2(0.0, 1.82),
  ];
  const shell = new THREE.Mesh(new THREE.LatheGeometry(conchPts, 14), shellMat);
  shell.position.set(-3.6, 0.25, -7.15);
  shell.rotation.x = 0.38;
  shell.rotation.z = -0.22;
  shell.castShadow = true;
  g.add(shell);

  // 3. Tangki silinder & menara ventilasi beton di bagian utara-tengah rooftop (seperti foto udara)
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 1.55, 14), darkRock);
  tank.position.set(-2.1, 0.78, -7.35);
  const tankDome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), coralMat);
  tankDome.position.set(-2.1, 1.55, -7.35);
  g.add(tank, tankDome);

  // 4. Tangga stainless kolam rooftop
  for (const sx of [-4.72, -4.42]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.85, 6), railMat);
    rail.position.set(sx, 0.42, -5.0);
    g.add(rail);
  }

  // 5. Pagar pipa besi pengaman di atas parapet rooftop sekeliling dek
  const railNorth = new THREE.Mesh(new THREE.BoxGeometry(21.2, 0.05, 0.05), railMat);
  railNorth.position.set(0, 1.38, -8.5);
  const railSouth = new THREE.Mesh(new THREE.BoxGeometry(21.2, 0.05, 0.05), railMat);
  railSouth.position.set(0, 1.38, 7.5);
  const railWest = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 16.0), railMat);
  railWest.position.set(-10.5, 1.38, -0.5);
  const railEast = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 16.0), railMat);
  railEast.position.set(10.5, 1.38, -0.5);
  g.add(railNorth, railSouth, railWest, railEast);

  return g;
}

/**
 * Tiang Lampu Jalan Komplek Sukajadi (PJU) dengan kap melengkung dan bohlam menyala.
 */
export function createStreetLamp(): THREE.Group {
  const g = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x2d3438, roughness: 0.45, metalness: 0.72 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd788 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.55, 8), steelMat);
  base.position.y = 0.275;
  g.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 5.2, 8), steelMat);
  pole.position.y = 2.85;
  pole.castShadow = true;
  g.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.08), steelMat);
  arm.position.set(0.55, 5.4, 0);
  arm.rotation.z = 0.16;
  g.add(arm);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.28), steelMat);
  hood.position.set(1.08, 5.48, 0);
  g.add(hood);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), bulbMat);
  bulb.position.set(1.08, 5.38, 0);
  g.add(bulb);

  return g;
}

/**
 * Pepohonan Nyata Beragam Jenis (bukan bulat/bola):
 * - 'pinus': cemara/pinus bertingkat kerucut jarum tajam
 * - 'mangga': batang bercabang 4 dengan tajuk daun pipih berlapis asimetris & buah mangga
 * - 'ketapang': ketapang kencana bertingkat cakram cabang horizontal khas jalan Bandung
 * - 'palem': batang melengkung beruas dengan pelepah daun menyirip melengkung
 */
export function createStreetTree(kind: TreeKind = 'mangga', scale = 1, tintHex = 0x1b2b20): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x332218, roughness: 0.94 });
  const branchMat = new THREE.MeshStandardMaterial({ color: 0x3d291c, roughness: 0.92 });
  const leafDark = new THREE.MeshStandardMaterial({ color: tintHex, roughness: 0.88, flatShading: true });
  const leafLight = new THREE.MeshStandardMaterial({
    color: new THREE.Color(tintHex).offsetHSL(0.01, 0.04, 0.06).getHex(),
    roughness: 0.84,
    flatShading: true,
  });

  if (kind === 'pinus') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.34, 4.6, 8), trunkMat);
    trunk.position.y = 2.3;
    trunk.castShadow = true;
    tree.add(trunk);

    // 6 tingkat kerucut pinus meruncing
    const tiers = [
      { y: 2.35, r: 1.95, h: 1.75 },
      { y: 3.35, r: 1.68, h: 1.65 },
      { y: 4.3, r: 1.38, h: 1.55 },
      { y: 5.15, r: 1.05, h: 1.4 },
      { y: 5.95, r: 0.72, h: 1.25 },
      { y: 6.65, r: 0.4, h: 1.05 },
    ];
    tiers.forEach((t, idx) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(t.r, t.h, 9),
        idx % 2 === 0 ? leafDark : leafLight
      );
      cone.position.y = t.y;
      cone.rotation.y = idx * 0.45;
      cone.castShadow = true;
      tree.add(cone);
    });
  } else if (kind === 'ketapang') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.36, 5.4, 8), trunkMat);
    trunk.position.y = 2.7;
    trunk.castShadow = true;
    tree.add(trunk);

    // Akar banir
    for (let r = 0; r < 4; r++) {
      const ang = (r / 4) * Math.PI * 2;
      const root = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.65), trunkMat);
      root.position.set(Math.sin(ang) * 0.28, 0.25, Math.cos(ang) * 0.28);
      root.rotation.y = ang;
      root.rotation.x = 0.35;
      tree.add(root);
    }

    // 3 Tingkat tajuk horizontal datar khas Ketapang Kencana
    const discs = [
      { y: 3.1, r: 2.45, h: 0.32 },
      { y: 4.35, r: 1.85, h: 0.28 },
      { y: 5.45, r: 1.15, h: 0.24 },
    ];
    discs.forEach((d, idx) => {
      for (let b = 0; b < 4; b++) {
        const ang = (b / 4) * Math.PI * 2 + idx * 0.5;
        const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, d.r * 0.85, 5), branchMat);
        limb.position.set(Math.cos(ang) * d.r * 0.38, d.y - 0.14, Math.sin(ang) * d.r * 0.38);
        limb.rotation.z = Math.PI / 2 - 0.12;
        limb.rotation.y = -ang;
        tree.add(limb);
      }
      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(d.r * 0.78, d.r, d.h, 11),
        idx % 2 === 0 ? leafDark : leafLight
      );
      canopy.position.y = d.y;
      canopy.castShadow = true;
      tree.add(canopy);
    });
  } else if (kind === 'palem') {
    // Batang beruas sedikit melengkung
    let curX = 0;
    let curY = 0;
    for (let s = 0; s < 6; s++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.22 - s * 0.018, 0.24 - s * 0.018, 1.05, 8), trunkMat);
      curX += s * 0.055;
      curY += 0.95;
      seg.position.set(curX, curY - 0.45, 0);
      seg.rotation.z = -s * 0.05;
      seg.castShadow = true;
      tree.add(seg);
    }
    const crownX = curX + 0.1;
    const crownY = curY + 0.1;

    // 9 Pelepah daun menyirip melengkung keluar & merunduk
    for (let f = 0; f < 9; f++) {
      const ang = (f / 9) * Math.PI * 2;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(crownX, crownY, 0);
      frondGroup.rotation.y = ang;

      const baseBlade = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.06, 0.55),
        f % 2 === 0 ? leafDark : leafLight
      );
      baseBlade.position.set(0.68, 0.25, 0);
      baseBlade.rotation.z = 0.28;
      frondGroup.add(baseBlade);

      const tipBlade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.25, 4), leafLight);
      tipBlade.position.set(1.65, 0.02, 0);
      tipBlade.rotation.z = -Math.PI * 0.65;
      tipBlade.scale.set(0.3, 1, 1.4);
      frondGroup.add(tipBlade);

      tree.add(frondGroup);
    }
  } else {
    // 'mangga': batang bercabang miring + rumpun daun bertumpuk pipih bersudut (bukan bola) + buah mangga
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.38, 2.7, 8), trunkMat);
    trunk.position.y = 1.35;
    trunk.castShadow = true;
    tree.add(trunk);

    const limbs = [
      { ox: 0.55, oy: 2.85, oz: 0.25, rz: -0.58, rx: 0.2, r: 1.5 },
      { ox: -0.62, oy: 2.95, oz: -0.2, rz: 0.55, rx: -0.18, r: 1.45 },
      { ox: 0.15, oy: 3.15, oz: -0.58, rz: -0.15, rx: -0.52, r: 1.38 },
      { ox: -0.12, oy: 3.35, oz: 0.45, rz: 0.18, rx: 0.42, r: 1.65 },
    ];
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0x6b8f3a, roughness: 0.55 });

    limbs.forEach((b, idx) => {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.75, 6), branchMat);
      branch.position.set(b.ox * 0.75, b.oy - 0.35, b.oz * 0.75);
      branch.rotation.set(b.rx, 0, b.rz);
      tree.add(branch);

      // Mahkota pipih melebar tidak bulat sempurna
      const foliage = new THREE.Mesh(
        new THREE.CylinderGeometry(b.r * 0.65, b.r, 0.85, 7),
        idx % 2 === 0 ? leafDark : leafLight
      );
      foliage.position.set(b.ox * 1.45, b.oy + 0.55, b.oz * 1.45);
      foliage.rotation.set(b.rx * 0.4, idx * 0.7, b.rz * 0.3);
      foliage.castShadow = true;
      tree.add(foliage);

      const upperCap = new THREE.Mesh(
        new THREE.ConeGeometry(b.r * 0.78, 0.9, 7),
        leafLight
      );
      upperCap.position.set(b.ox * 1.45, b.oy + 1.2, b.oz * 1.45);
      tree.add(upperCap);

      // 1 buah mangga menggantung di bawah ranting
      const mango = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 6), fruitMat);
      mango.position.set(b.ox * 1.35, b.oy + 0.05, b.oz * 1.35);
      mango.rotation.x = Math.PI;
      tree.add(mango);
    });
  }

  tree.scale.setScalar(scale);
  return tree;
}

export function createRadioTower(): { group: THREE.Group; beacon: THREE.Mesh } {
  const group = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x5c6469,
    roughness: 0.45,
    metalness: 0.78,
  });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2b3033, roughness: 0.85 });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 1.1), baseMat);
  plinth.position.y = 0.175;
  group.add(plinth);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 5.2, 6), steelMat);
      leg.position.set(sx * 0.24, 2.8, sz * 0.24);
      leg.rotation.z = sx * 0.06;
      leg.rotation.x = -sz * 0.06;
      group.add(leg);
    }
  }

  for (const h of [1.5, 3.0, 4.4]) {
    const ring = new THREE.Mesh(new THREE.BoxGeometry(0.62 - h * 0.06, 0.07, 0.62 - h * 0.06), steelMat);
    ring.position.y = h;
    group.add(ring);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.5, 6), steelMat);
  mast.position.y = 5.9;
  group.add(mast);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xff2b2b })
  );
  beacon.position.y = 6.65;
  group.add(beacon);

  return { group, beacon };
}

export function createKujangShrine(): { group: THREE.Group; kujang: THREE.Group } {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3b403c, roughness: 0.88 });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 0.95, 8), stoneMat);
  pedestal.position.y = 0.475;
  group.add(pedestal);

  const kujang = new THREE.Group();
  kujang.position.y = 1.45;

  const shape = new THREE.Shape();
  shape.moveTo(0, -0.35);
  shape.quadraticCurveTo(0.18, -0.1, 0.14, 0.18);
  shape.quadraticCurveTo(0.24, 0.42, 0.02, 0.68);
  shape.quadraticCurveTo(-0.12, 0.45, -0.06, 0.15);
  shape.quadraticCurveTo(-0.14, -0.12, 0, -0.35);

  const bladeGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  bladeGeo.center();

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xe6d49a,
    emissive: new THREE.Color(0xc49533),
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0.88,
  });
  kujang.add(new THREE.Mesh(bladeGeo, bladeMat));

  const hilt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.24, 8),
    new THREE.MeshStandardMaterial({ color: 0x3d2213, roughness: 0.75 })
  );
  hilt.position.y = -0.45;
  kujang.add(hilt);

  group.add(kujang);
  return { group, kujang };
}

export interface HumanoidRig {
  group: THREE.Group;
  bodyRoot: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
}

export function createHumanoidNPC(opts: {
  shirtColor: number;
  bottomColor: number;
  skinColor?: number;
  hasCap?: boolean;
  capColor?: number;
  hasApron?: boolean;
  isSkirt?: boolean;
  hasBackpack?: boolean;
  bagColor?: number;
  accessory?: 'none' | 'cap' | 'headband' | 'glasses' | 'walkie';
  isSeated?: boolean;
  prop?: 'coffee' | 'phone' | 'ladle';
  contactShadowTex: THREE.CanvasTexture;
}): HumanoidRig {
  const group = new THREE.Group();
  const bodyRoot = new THREE.Group();
  if (opts.isSeated) {
    bodyRoot.position.y = -0.34;
  }
  group.add(bodyRoot);

  const skinMat = new THREE.MeshStandardMaterial({ color: opts.skinColor ?? 0xc49573, roughness: 0.72 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: opts.shirtColor, roughness: 0.84 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: opts.bottomColor, roughness: 0.86 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x161718, roughness: 0.9 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.75 });

  group.add(createContactShadowDisc(0.45, opts.contactShadowTex));

  // Kaki berporos di pinggul (y = 0.82)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.11, 0.82, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.11, 0.82, 0);

  if (opts.isSkirt) {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 0.5, 12), bottomMat);
    skirt.position.y = 0.64;
    bodyRoot.add(skirt);

    for (const legPivot of [leftLeg, rightLeg]) {
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.74, 8), skinMat);
      calf.position.y = -0.37;
      legPivot.add(calf);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.19), shoeMat);
      shoe.position.set(0, -0.78, 0.03);
      legPivot.add(shoe);
    }
  } else {
    for (const legPivot of [leftLeg, rightLeg]) {
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.07, 0.74, 8), bottomMat);
      legMesh.position.y = -0.37;
      legPivot.add(legMesh);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.2), shoeMat);
      shoe.position.set(0, -0.77, 0.03);
      legPivot.add(shoe);
    }
  }

  if (opts.isSeated) {
    leftLeg.rotation.x = -Math.PI * 0.44;
    rightLeg.rotation.x = -Math.PI * 0.44;
  }
  bodyRoot.add(leftLeg, rightLeg);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.24), shirtMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  bodyRoot.add(torso);

  if (opts.hasBackpack || opts.bagColor !== undefined) {
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.42, 0.16),
      new THREE.MeshStandardMaterial({ color: opts.bagColor ?? 0x383a32, roughness: 0.88 })
    );
    pack.position.set(0, 1.12, -0.18);
    bodyRoot.add(pack);
  }

  if (opts.hasApron) {
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.62, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x353937, roughness: 0.92 })
    );
    apron.position.y = 0.96;
    bodyRoot.add(apron);
  }

  // Lengan berporos di bahu (y = 1.34)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 1.34, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 1.34, 0);
  for (const armPivot of [leftArm, rightArm]) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.068, 0.2, 8), shirtMat);
    sleeve.position.y = -0.09;
    armPivot.add(sleeve);
    const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.44, 8), skinMat);
    armMesh.position.y = -0.34;
    armPivot.add(armMesh);
  }

  // Properti tangan NPC agar animasi terasa hidup
  if (opts.prop === 'coffee') {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.036, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0xe6ded0, roughness: 0.4 })
    );
    cup.position.set(0, -0.56, 0.06);
    rightArm.add(cup);
  } else if (opts.prop === 'phone') {
    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.13, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x9edbff })
    );
    phone.position.set(0, -0.55, 0.06);
    rightArm.add(phone);
  } else if (opts.prop === 'ladle') {
    const spoon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6),
      new THREE.MeshStandardMaterial({ color: 0x9aa2a8, metalness: 0.75, roughness: 0.3 })
    );
    spoon.rotation.x = Math.PI * 0.4;
    spoon.position.set(0, -0.54, 0.16);
    rightArm.add(spoon);
  }

  bodyRoot.add(leftArm, rightArm);

  // Kepala berporos di leher (y = 1.42)
  const head = new THREE.Group();
  head.position.set(0, 1.42, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), skinMat);
  skull.position.y = 0.13;
  head.add(skull);

  const eyeDotMat = new THREE.MeshBasicMaterial({ color: 0x181818 });
  for (const sx of [-0.05, 0.05]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeDotMat);
    eye.position.set(sx, 0.14, 0.14);
    head.add(eye);
  }

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.158, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    hairMat
  );
  hair.position.set(0, 0.17, -0.02);
  head.add(hair);

  if (opts.hasCap || opts.accessory === 'cap') {
    const capMat = new THREE.MeshStandardMaterial({ color: opts.capColor ?? 0x2a3338, roughness: 0.65 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.09, 12), capMat);
    cap.position.y = 0.25;
    head.add(cap);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.14), capMat);
    visor.position.set(0, 0.22, 0.14);
    head.add(visor);
  } else if (opts.accessory === 'headband') {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.022, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0xa83228, roughness: 0.7 })
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.19;
    head.add(band);
  } else if (opts.accessory === 'glasses') {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x16181a, roughness: 0.4 });
    for (const gx of [-0.05, 0.05]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 6, 12), frameMat);
      rim.position.set(gx, 0.14, 0.148);
      head.add(rim);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.01), frameMat);
    bridge.position.set(0, 0.14, 0.15);
    head.add(bridge);
  }
  if (opts.accessory === 'walkie') {
    const walkie = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.14, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x1c2024, roughness: 0.6 })
    );
    walkie.position.set(0.24, 1.24, 0.09);
    bodyRoot.add(walkie);
  }
  bodyRoot.add(head);

  return { group, bodyRoot, head, leftArm, rightArm, leftLeg, rightLeg };
}

export interface GhostRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Group;
  leftArm?: THREE.Group;
  rightArm?: THREE.Group;
  leftLeg?: THREE.Group;
  rightLeg?: THREE.Group;
  hairStrands?: THREE.Mesh[];
}

/**
 * Membangun model 3D hantu yang artikulatif (tidak kaku) & sesuai gambar referensi karakter.
 */
export function createGhostModel(
  kind: GhostKind,
  contactShadowTex: THREE.CanvasTexture
): GhostRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);
  group.add(createContactShadowDisc(kind === 'genderuwo' ? 0.78 : 0.55, contactShadowTex));

  const redEyeMat = new THREE.MeshBasicMaterial({ color: 0xff2424 });

  if (kind === 'ambu_hideung') {
    // Sesuai lembar referensi AMBU HIDEUNG:
    // Kebaya hitam compang-camping, kulit biru-kelabu pucat, wajah gelap bermata merah tajam, rambut tentakel bergelombang
    const kebayaMat = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.9,
      metalness: 0.08,
    });
    const innerBatikMat = new THREE.MeshStandardMaterial({
      color: 0x262624,
      roughness: 0.85,
    });
    const paleSkinMat = new THREE.MeshStandardMaterial({
      color: 0x67727a,
      roughness: 0.72,
    });
    const shadowFaceMat = new THREE.MeshStandardMaterial({
      color: 0x1f2428,
      roughness: 0.85,
    });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x0a0b0d, roughness: 0.95 });

    // Kain panjang & ujung compang-camping
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.44, 1.18, 14), innerBatikMat);
    skirt.position.y = 0.62;
    skirt.castShadow = true;
    bodyGroup.add(skirt);

    // Sayap luar kebaya panjang
    for (const sx of [-1, 1]) {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.95, 0.14), kebayaMat);
      flap.position.set(sx * 0.16, 0.92, 0.06);
      flap.rotation.z = sx * -0.1;
      bodyGroup.add(flap);
    }

    // Kaki pucat tanpa alas di bawah kain
    for (const sx of [-0.11, 0.11]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.18), paleSkinMat);
      foot.position.set(sx, 0.04, 0.06);
      bodyGroup.add(foot);
    }

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.22), kebayaMat);
    torso.position.y = 1.38;
    bodyGroup.add(torso);

    // Kepala & wajah gelap bermata merah menyala + tirai rambut depan
    const head = new THREE.Group();
    head.position.set(0, 1.66, 0.02);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 14), shadowFaceMat);
    skull.position.y = 0.1;
    head.add(skull);

    for (const sx of [-0.055, 0.055]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), redEyeMat);
      eye.position.set(sx, 0.11, 0.145);
      head.add(eye);
    }
    const hairCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.168, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
      hairMat
    );
    hairCrown.position.set(0, 0.12, -0.02);
    head.add(hairCrown);
    bodyGroup.add(head);

    // Lengan cakar menjulur & bersiku
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.26, 1.54, 0);
    const rightArm = new THREE.Group();
    rightArm.position.set(0.26, 1.54, 0);
    for (const [idx, armPivot] of [leftArm, rightArm].entries()) {
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.1, 0.36, 8), kebayaMat);
      sleeve.position.y = -0.18;
      armPivot.add(sleeve);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.32, 8), paleSkinMat);
      forearm.position.set(0, -0.44, 0.1);
      forearm.rotation.x = -0.45;
      armPivot.add(forearm);

      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.1, 5), hairMat);
        claw.position.set(c * 0.025, -0.58, 0.22);
        claw.rotation.x = Math.PI * 0.65;
        armPivot.add(claw);
      }
      armPivot.rotation.x = -Math.PI * 0.32;
      armPivot.rotation.z = idx === 0 ? 0.14 : -0.14;
    }
    bodyGroup.add(leftArm, rightArm);

    // 8 Sulur rambut tentakel ilusi di punggung (dianimasikan berombak tiap frame)
    const hairStrands: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const spread = (i - 3.5) * 0.16;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(spread * 0.35, 1.72, -0.09),
        new THREE.Vector3(spread * 1.15, 1.36, -0.26 - (i % 2) * 0.08),
        new THREE.Vector3(spread * 1.75, 0.88 + (i % 3) * 0.12, -0.34),
      ]);
      const strand = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.032, 6, false), hairMat);
      bodyGroup.add(strand);
      hairStrands.push(strand);
    }

    return { group, bodyGroup, head, leftArm, rightArm, hairStrands };
  }

  if (kind === 'kuntilanak') {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xb2b6ab, roughness: 0.92 });
    const bloodHemMat = new THREE.MeshStandardMaterial({ color: 0x5c2724, roughness: 0.95 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x7b8584, roughness: 0.78 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.95 });

    const gown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.42, 1.35, 12), whiteMat);
    gown.position.y = 0.74;
    bodyGroup.add(gown);

    const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.44, 0.18, 12), bloodHemMat);
    hem.position.y = 0.14;
    bodyGroup.add(hem);

    const head = new THREE.Group();
    head.position.set(0, 1.54, 0.02);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), skinMat);
    skull.position.y = 0.12;
    head.add(skull);

    for (const sx of [-0.05, 0.05]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), redEyeMat);
      eye.position.set(sx, 0.13, 0.13);
      head.add(eye);
    }

    const hairStrands: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const sx = (i - 2) * 0.09;
      const lock = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.9, 6), hairMat);
      lock.position.set(sx, -0.18, -0.11);
      head.add(lock);
      hairStrands.push(lock);
    }
    bodyGroup.add(head);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.24, 1.4, 0);
    const rightArm = new THREE.Group();
    rightArm.position.set(0.24, 1.4, 0);
    for (const armPivot of [leftArm, rightArm]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.032, 0.56, 8), whiteMat);
      arm.position.y = -0.26;
      armPivot.add(arm);
      armPivot.rotation.x = -Math.PI * 0.36;
    }
    bodyGroup.add(leftArm, rightArm);

    return { group, bodyGroup, head, leftArm, rightArm, hairStrands };
  }

  if (kind === 'pocong') {
    const shroudMat = new THREE.MeshStandardMaterial({ color: 0xc2c5ba, roughness: 0.95 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x73756d, roughness: 0.92 });
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x262927, roughness: 0.92 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.12, 6, 14), shroudMat);
    body.position.y = 0.84;
    body.castShadow = true;
    bodyGroup.add(body);

    // Tali ikatan kafan di pergelangan kaki, pinggul, & leher
    for (const ty of [0.28, 0.86, 1.32]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.025, 6, 14), tieMat);
      band.position.y = ty;
      band.rotation.x = Math.PI / 2;
      bodyGroup.add(band);
    }

    const head = new THREE.Group();
    head.position.set(0, 1.42, 0);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 10), faceMat);
    face.position.set(0, 0.06, 0.11);
    head.add(face);

    const topKnot = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 8), shroudMat);
    topKnot.position.set(0, 0.36, -0.02);
    head.add(topKnot);

    for (const sx of [-0.045, 0.045]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), redEyeMat);
      eye.position.set(sx, 0.08, 0.225);
      head.add(eye);
    }
    bodyGroup.add(head);

    return { group, bodyGroup, head };
  }

  if (kind === 'genderuwo') {
    const furMat = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.96 });
    const loinMat = new THREE.MeshStandardMaterial({ color: 0x453628, roughness: 0.92 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 0.5 });

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.22, 0.88, 0);
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.22, 0.88, 0);
    for (const legPivot of [leftLeg, rightLeg]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.88, 8), furMat);
      leg.position.y = -0.44;
      legPivot.add(leg);
    }
    bodyGroup.add(leftLeg, rightLeg);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.94, 0.58), furMat);
    torso.position.y = 1.34;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const loin = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.42, 10), loinMat);
    loin.position.y = 0.85;
    bodyGroup.add(loin);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.62, 1.66, 0);
    const rightArm = new THREE.Group();
    rightArm.position.set(0.62, 1.66, 0);
    for (const armPivot of [leftArm, rightArm]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.92, 8), furMat);
      arm.position.y = -0.44;
      armPivot.add(arm);
    }
    bodyGroup.add(leftArm, rightArm);

    const head = new THREE.Group();
    head.position.set(0, 1.84, 0.1);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), furMat);
    skull.position.y = 0.12;
    head.add(skull);

    for (const sx of [-0.08, 0.08]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), redEyeMat);
      eye.position.set(sx, 0.15, 0.21);
      head.add(eye);
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 5), hornMat);
      fang.position.set(sx * 0.85, 0.02, 0.22);
      head.add(fang);
    }
    bodyGroup.add(head);

    return { group, bodyGroup, head, leftArm, rightArm, leftLeg, rightLeg };
  }

  // Boneka Uci (miniatur porselen seram dengan lengan & kepala artikulatif)
  const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xc9c4bd, roughness: 0.4 });
  const dressMat = new THREE.MeshStandardMaterial({ color: 0x998e78, roughness: 0.88 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x161414, roughness: 0.9 });
  const bowMat = new THREE.MeshStandardMaterial({ color: 0x8c2720, roughness: 0.7 });

  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.54, 12), dressMat);
  dress.position.y = 0.34;
  bodyGroup.add(dress);

  const head = new THREE.Group();
  head.position.set(0, 0.62, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), porcelainMat);
  skull.position.y = 0.12;
  head.add(skull);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
    hairMat
  );
  hair.position.y = 0.14;
  head.add(hair);

  const bow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.05), bowMat);
  bow.position.set(0, 0.26, -0.02);
  head.add(bow);

  const hollowEye = new THREE.MeshBasicMaterial({ color: 0x050505 });
  for (const sx of [-0.055, 0.055]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), hollowEye);
    eye.position.set(sx, 0.13, 0.13);
    head.add(eye);
  }
  bodyGroup.add(head);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.18, 0.56, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.18, 0.56, 0);
  for (const armPivot of [leftArm, rightArm]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.26, 6), porcelainMat);
    arm.position.y = -0.12;
    armPivot.add(arm);
  }
  bodyGroup.add(leftArm, rightArm);

  return { group, bodyGroup, head, leftArm, rightArm };
}

export type FurnitureKind =
  | 'table'
  | 'closet'
  | 'bed'
  | 'sofa'
  | 'counter'
  | 'dining_set'
  | 'bookshelf'
  | 'fridge'
  | 'tv_stand'
  | 'vanity'
  | 'clock';

export function createPropFurniture(kind: FurnitureKind): THREE.Group {
  const g = new THREE.Group();
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x3b2619, roughness: 0.84 });
  const warmWood = new THREE.MeshStandardMaterial({ color: 0x593a24, roughness: 0.78 });
  const fabric = new THREE.MeshStandardMaterial({ color: 0x454f49, roughness: 0.95 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4c5357, roughness: 0.45, metalness: 0.7 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4a44a, roughness: 0.3, metalness: 0.8 });

  if (kind === 'table') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.0), darkWood);
    top.position.y = 0.75;
    top.castShadow = true;
    g.add(top);
    for (const sx of [-0.7, 0.7]) {
      for (const sz of [-0.4, 0.4]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), darkWood);
        leg.position.set(sx, 0.375, sz);
        g.add(leg);
      }
    }
    // Kap lampu meja antik & map dokumen
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.24, 8), brass);
    base.position.set(-0.45, 0.91, -0.2);
    g.add(base);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.18, 0.18, 10),
      new THREE.MeshStandardMaterial({ color: 0xb89c6a, roughness: 0.8 })
    );
    shade.position.set(-0.45, 1.08, -0.2);
    g.add(shade);
  } else if (kind === 'dining_set') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.09, 1.15), warmWood);
    top.position.y = 0.78;
    top.castShadow = true;
    g.add(top);
    for (const sx of [-0.95, 0.95]) {
      for (const sz of [-0.46, 0.46]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.78, 0.09), darkWood);
        leg.position.set(sx, 0.39, sz);
        g.add(leg);
      }
    }
    // 4 Kursi makan di kiri-kanan
    for (const cz of [-0.82, 0.82]) {
      for (const cx of [-0.55, 0.55]) {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), darkWood);
        seat.position.set(cx, 0.45, cz);
        g.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.06), darkWood);
        back.position.set(cx, 0.72, cz + (cz > 0 ? 0.18 : -0.18));
        g.add(back);
        const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.45, 0.36), darkWood);
        cLeg.position.set(cx, 0.225, cz);
        g.add(cLeg);
      }
    }
  } else if (kind === 'closet') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.15, 0.75), darkWood);
    body.position.y = 1.075;
    body.castShadow = true;
    g.add(body);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.1, 0.82), warmWood);
    crown.position.y = 2.18;
    g.add(crown);
    for (const sx of [-0.08, 0.08]) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.04), brass);
      handle.position.set(sx, 1.08, 0.39);
      g.add(handle);
    }
  } else if (kind === 'bookshelf') {
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.2, 0.08), darkWood);
    back.position.set(0, 1.1, -0.18);
    g.add(back);
    for (const sx of [-0.79, 0.79]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.44), darkWood);
      side.position.set(sx, 1.1, 0);
      g.add(side);
    }
    const bookColors = [0x6e2b24, 0x274234, 0x3b495c, 0x7a5b2d];
    for (let row = 0; row < 4; row++) {
      const y = 0.28 + row * 0.52;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.05, 0.42), warmWood);
      shelf.position.set(0, y, 0);
      g.add(shelf);
      for (let b = 0; b < 7; b++) {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.28 + (b % 3) * 0.05, 0.26),
          new THREE.MeshStandardMaterial({ color: bookColors[(row + b) % bookColors.length], roughness: 0.85 })
        );
        book.position.set(-0.56 + b * 0.17, y + 0.17, 0.02);
        g.add(book);
      }
    }
  } else if (kind === 'fridge') {
    const enamel = new THREE.MeshStandardMaterial({ color: 0x9aa39d, roughness: 0.35, metalness: 0.25 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.95, 0.85), enamel);
    body.position.y = 0.975;
    body.castShadow = true;
    g.add(body);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.87), metal);
    seam.position.y = 1.32;
    g.add(seam);
    for (const hy of [1.58, 0.95]) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.06), metal);
      handle.position.set(-0.34, hy, 0.45);
      g.add(handle);
    }
  } else if (kind === 'tv_stand') {
    const credenza = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.58, 0.62), darkWood);
    credenza.position.y = 0.29;
    credenza.castShadow = true;
    g.add(credenza);
    // TV Tabung Era 1980-an + Antena V
    const tvBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.56, 0.46),
      new THREE.MeshStandardMaterial({ color: 0x261d17, roughness: 0.72 })
    );
    tvBox.position.set(0, 0.86, 0);
    g.add(tvBox);
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.4, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x1e2c2b, roughness: 0.25, metalness: 0.2 })
    );
    screen.position.set(-0.04, 0.86, 0.23);
    g.add(screen);
    for (const sa of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 6), metal);
      ant.position.set(sa * 0.14, 1.32, 0);
      ant.rotation.z = sa * -0.45;
      g.add(ant);
    }
  } else if (kind === 'bed') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 2.2), darkWood);
    frame.position.y = 0.25;
    frame.castShadow = true;
    g.add(frame);
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.95, 0.12), warmWood);
    headboard.position.set(0, 0.62, -1.06);
    g.add(headboard);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.24, 2.05), fabric);
    mattress.position.y = 0.5;
    g.add(mattress);
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.13, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x999e98, roughness: 0.9 })
    );
    pillow.position.set(0, 0.66, -0.76);
    g.add(pillow);
  } else if (kind === 'sofa') {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.9), fabric);
    seat.position.y = 0.24;
    seat.castShadow = true;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.56, 0.24), fabric);
    back.position.set(0, 0.64, -0.34);
    g.add(back);
    for (const sx of [-0.95, 0.95]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.56, 0.92), darkWood);
      arm.position.set(sx, 0.38, 0);
      g.add(arm);
    }
  } else if (kind === 'vanity') {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.76, 0.55), warmWood);
    desk.position.y = 0.38;
    g.add(desk);
    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.08), darkWood);
    mirrorFrame.position.set(0, 1.18, -0.2);
    g.add(mirrorFrame);
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.72, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x7b8d91, roughness: 0.08, metalness: 0.85 })
    );
    mirror.position.set(0, 1.18, -0.15);
    g.add(mirror);
  } else if (kind === 'clock') {
    // Jam Berdiri Antik (jarum jam membeku di Dimensi Gaib)
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.56, 2.25, 0.42), darkWood);
    tower.position.y = 1.125;
    tower.castShadow = true;
    g.add(tower);
    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0xd9d2bd, roughness: 0.4 })
    );
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, 1.82, 0.21);
    g.add(dial);
  } else {
    // 'counter' (Meja dapur + wastafel & kompor)
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 0.8), darkWood);
    base.position.y = 0.425;
    base.castShadow = true;
    g.add(base);
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(2.66, 0.07, 0.86),
      new THREE.MeshStandardMaterial({ color: 0x737d78, roughness: 0.5 })
    );
    top.position.y = 0.88;
    g.add(top);
    const stove = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.52), metal);
    stove.position.set(0.65, 0.94, 0);
    g.add(stove);
  }

  return g;
}
