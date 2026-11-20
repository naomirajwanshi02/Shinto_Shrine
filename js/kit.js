// Small building kit for the shrine: textures, boxes, cylinders and a "loft" that sweeps a 2D profile
// along z (used for roofs, the curved top lintel and boards). Units are metres, y is up.

import * as THREE from 'three';

export function rng(seed){
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function canvasTex(w, h, draw, { srgb = true, aniso = 8, repeat = true } = {}){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

// ------------------------------------------------------------------ textures
export function makeTextures(aniso){
  const R = rng(11);
  const T = {};

  // pale gravel with darker and lighter flecks
  T.gravel = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#eadfc8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++){
      const d = R() < 0.55;
      g.fillStyle = d ? `rgba(120,100,70,${.12 + R() * .22})` : `rgba(255,252,240,${.25 + R() * .3})`;
      g.fillRect(R() * w, R() * h, 1.5 + R() * 2.6, 1.5 + R() * 2.2);
    }
  }, { aniso });

  // grey paving slabs in a running bond, one metre by half a metre
  T.paving = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#8f8d88'; g.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let r = 0; r < rows; r++){
      const cols = 2, cw = w / cols, off = (r % 2) * cw / 2;
      for (let c = -1; c <= cols; c++){
        const s = 188 + R() * 20;
        g.fillStyle = `rgb(${s | 0},${s - 1 | 0},${s - 4 | 0})`;
        g.fillRect(c * cw + off + 3, r * rh + 3, cw - 6, rh - 6);
        for (let k = 0; k < 8; k++){ g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '60,55,45'},.05)`; g.fillRect(c * cw + off + R() * cw, r * rh + R() * rh, 10 + R() * 30, 4 + R() * 10); }
      }
    }
  }, { aniso });

  // fitted grey stone blocks
  T.stone = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6d6a64'; g.fillRect(0, 0, w, h);
    let y = 0;
    while (y < h){
      const rh = 56 + R() * 30; let x = -R() * 60;
      while (x < w){
        const bw = 80 + R() * 80, s = 138 + R() * 26;
        g.fillStyle = `rgb(${s | 0},${s - 2 | 0},${s - 6 | 0})`;
        g.fillRect(x + 2, y + 2, bw - 4, Math.min(rh, h - y) - 4);
        g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + 2, y + 2, bw - 4, 5);
        x += bw;
      }
      y += rh;
    }
  }, { aniso });

  // smooth light stone (lanterns, pedestals)
  T.granite = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#b4ada0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++){ g.fillStyle = R() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(70,60,50,.16)'; g.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2); }
  }, { aniso });

  // layered bark shingles (main hall roof): u runs along the ridge, v down the slope
  T.shingle = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5e4631'; g.fillRect(0, 0, w, h);
    const rows = 10, rh = h / rows;
    for (let r = 0; r < rows; r++){
      const v = 78 + R() * 16;
      g.fillStyle = `rgb(${v + 14 | 0},${v | 0},${v - 26 | 0})`; g.fillRect(0, r * rh, w, rh - 2);
      g.fillStyle = 'rgba(255,230,190,.10)'; g.fillRect(0, r * rh, w, 2);
      g.fillStyle = 'rgba(20,10,0,.55)'; g.fillRect(0, r * rh + rh - 3, w, 3);
      for (let k = 0; k < 18; k++){ g.fillStyle = `rgba(30,18,6,${.1 + R() * .12})`; g.fillRect(R() * w, r * rh + R() * rh * .7, 14 + R() * 40, 1.2); }
    }
  }, { aniso });

  // grey tile roof: rows of curved tiles
  T.tile = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#383a3c'; g.fillRect(0, 0, w, h);
    const rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r++){
      const v = 78 + R() * 12;
      g.fillStyle = `rgb(${v | 0},${v + 2 | 0},${v + 6 | 0})`; g.fillRect(0, r * rh, w, rh - 3);
      g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(0, r * rh, w, 2);
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, r * rh + rh - 3, w, 3);
      for (let x = 0; x < w; x += 16){ g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, r * rh, 2, rh - 3); }
    }
  }, { aniso });

  T.plaster = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f1ebdc'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++){ g.fillStyle = `rgba(150,130,100,${R() * .08})`; g.fillRect(R() * w, R() * h, 2 + R() * 4, 1 + R() * 3); }
  }, { aniso });

  // dark wooden lattice (shitomi-style window): light grid on dark ground
  T.lattice = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2b1a10'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7a5a3c';
    for (let x = 0; x <= w; x += 32) g.fillRect(x - 3, 0, 6, h);
    for (let y = 0; y <= h; y += 32) g.fillRect(0, y - 3, w, 6);
  }, { aniso });

  T.wood = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#7a5d41'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 3){ g.fillStyle = `rgba(${R() < .5 ? '40,24,10' : '200,160,110'},${.05 + R() * .12})`; g.fillRect(x, 0, 1 + R() * 2, h); }
  }, { aniso });

  T.slat = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#4a3a2c'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16){ g.fillStyle = '#8a6e50'; g.fillRect(x + 1, 0, 11, h); g.fillStyle = '#1c120a'; g.fillRect(x + 12, 0, 4, h); }
  }, { aniso });

  T.paper = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#f6efe0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b5352a'; g.fillRect(0, 0, w, 30); g.fillRect(0, h - 30, w, 30);
    g.fillStyle = '#c4452f'; g.fillRect(0, 88, w, 22); g.fillRect(0, 150, w, 22);
    g.fillStyle = 'rgba(80,50,30,.35)';
    for (let y = 8; y < h; y += 17) g.fillRect(0, y, w, 1.3);
  }, { aniso });

  T.ema = canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#d9a95e'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4){ g.fillStyle = `rgba(90,50,10,${.05 + R() * .1})`; g.fillRect(x, 0, 1 + R() * 2, h); }
  }, { aniso });

  return T;
}

// ------------------------------------------------------------------ materials
export function mat(color, { rough = .85, metal = 0, map = null, emissive = 0x000000, side = THREE.FrontSide, repeat = null, flat = false } = {}){
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, side, flatShading: flat });
  if (map){
    m.map = map;
    if (repeat){ m.map = map.clone(); m.map.needsUpdate = true; m.map.repeat.set(repeat[0], repeat[1]); }
  }
  if (emissive) m.emissive = new THREE.Color(emissive);
  return m;
}

// ------------------------------------------------------------------ primitives
// A box with its underside at y, centred on x and z. The mesh casts and receives shadows.
export function box(w, h, d, m, x = 0, y = 0, z = 0){
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y + h / 2, z);
  return o;
}
export function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 18){
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y + h / 2, z);
  return o;
}
export function ball(r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1){
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), m);
  o.position.set(x, y, z); o.scale.set(sx, sy, sz);
  return o;
}
// a four-sided pyramid roof (lantern roofs)
export function pyramid(r, h, m, x = 0, y = 0, z = 0){
  const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4, 1), m);
  o.rotation.y = Math.PI / 4;
  o.position.set(x, y + h / 2, z);
  return o;
}

// ------------------------------------------------------------------ loft
// profile: closed polygon [[x,y],...] in counter-clockwise order (seen from +z).
// stations: [[z, dx, dy], ...] increasing in z; the profile is moved by (dx, dy) at each station.
// edgeGroup[i] is the material index of the edge from point i to point i+1.
// smooth[i] (optional) shades the profile point i smoothly across its two edges.
export function loft(profile, stations, mats, { edgeGroup = null, capGroup = 0, smooth = null, uv = [0.5, 0.5] } = {}){
  const n = profile.length;
  const eg = edgeGroup || Array(n).fill(0);
  const nG = Array.isArray(mats) ? mats.length : 1;
  const pos = Array.from({ length: nG }, () => []), nor = Array.from({ length: nG }, () => []), uvs = Array.from({ length: nG }, () => []);
  const arc = [0];
  for (let i = 1; i <= n; i++){ const a = profile[i - 1], b = profile[i % n]; arc.push(arc[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const en = profile.map((a, i) => { const b = profile[(i + 1) % n]; const ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1; return [ey / l, -ex / l]; });
  const vn = (i, edge) => {
    if (smooth && smooth[i]){ const p = en[(i - 1 + n) % n], q = en[i]; const x = p[0] + q[0], y = p[1] + q[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; }
    return en[edge];
  };
  const P = (i, k) => { const s = stations[k], p = profile[i % n]; return [p[0] + s[1], p[1] + s[2], s[0]]; };
  for (let k = 0; k < stations.length - 1; k++){
    for (let i = 0; i < n; i++){
      const g = eg[i];
      const a0 = P(i, k), a1 = P(i + 1, k), b0 = P(i, k + 1), b1 = P(i + 1, k + 1);
      const n0 = vn(i, i), n1 = vn((i + 1) % n, i);
      const ua = stations[k][0] * uv[0], ub = stations[k + 1][0] * uv[0];
      const va = arc[i] * uv[1], vb = arc[i + 1] * uv[1];
      const push = (p, nn, u, v) => { pos[g].push(...p); nor[g].push(nn[0], nn[1], 0); uvs[g].push(u, v); };
      push(a0, n0, ua, va); push(a1, n1, ua, vb); push(b0, n0, ub, va);
      push(a1, n1, ua, vb); push(b1, n1, ub, vb); push(b0, n0, ub, va);
    }
  }
  // end caps
  const contour = profile.map((p) => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const cap = (k, nz) => {
    for (const t of tris){
      let ids = [t[0], t[1], t[2]];
      const a = P(ids[0], k), b = P(ids[1], k), c = P(ids[2], k);
      const cz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (cz * nz < 0) ids = [ids[0], ids[2], ids[1]];
      for (const id of ids){ const p = P(id, k); pos[capGroup].push(...p); nor[capGroup].push(0, 0, nz); uvs[capGroup].push(p[0] * .4, p[1] * .4); }
    }
  };
  cap(0, -1); cap(stations.length - 1, 1);
  const geo = new THREE.BufferGeometry();
  const P_ = [], N_ = [], U_ = []; let start = 0;
  pos.forEach((arr, gi) => {
    P_.push(...arr); N_.push(...nor[gi]); U_.push(...uvs[gi]);
    geo.addGroup(start, arr.length / 3, gi); start += arr.length / 3;
  });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P_, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(N_, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U_, 2));
  geo.computeBoundingSphere(); geo.computeBoundingBox();
  return new THREE.Mesh(geo, Array.isArray(mats) ? mats : [mats]);
}

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The cross-section of a Japanese roof: steep near the ridge, flatter toward the eave, lifted at the tips.
export function roofTopY(x, { half, base, rise, p = 1.35, lift = 0.35, bump = 0, bumpW = .45 }){
  const a = Math.min(1, Math.abs(x) / half);
  return base + rise * Math.pow(1 - a, p) + lift * smoothstep(.82, 1, a) + bump * Math.exp(-Math.pow(a / bumpW, 2));
}

// A curved gable roof whose ridge runs along z (length len). mats = [top, underside].
export function gableRoof(o, mats, { n = 30 } = {}){
  const { half, thick = .5, len } = o;
  const top = [], bot = [];
  for (let i = 0; i <= n; i++){
    const x = -half + 2 * half * i / n;
    const y = roofTopY(x, o);
    top.push([x, y]); bot.push([x, y - thick]);
  }
  // counter-clockwise: underside left to right, then the top right to left
  const profile = [...bot, ...top.slice().reverse()];
  const m = profile.length;
  const edgeGroup = profile.map((_, i) => (i >= n + 1 && i < m - 1 ? 0 : 1));
  edgeGroup[n] = 1; edgeGroup[m - 1] = 1;
  const smooth = profile.map((_, i) => i !== 0 && i !== n && i !== n + 1 && i !== m - 1);
  const mesh = loft(profile, [[-len / 2, 0, 0], [len / 2, 0, 0]], mats, { edgeGroup, capGroup: 1, smooth, uv: [.35, .45] });
  mesh.userData.under = (x) => roofTopY(x, o) - thick;
  return mesh;
}

// A box whose texture repeats sc times per metre on every face.
export function tbox(w, h, d, m, x = 0, y = 0, z = 0, sc = .5){
  const o = box(w, h, d, m, x, y, z);
  const uv = o.geometry.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++){
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * dims[f][0] * sc, uv.getY(i) * dims[f][1] * sc);
  }
  return o;
}

// The triangle-ish face under a gable roof end, between a wall top (yBot) and the roof underside.
// Returns a group centred on x = 0 (move it to the roof's x). Layers: base, gold border, panel.
export function gableFace(o, xL, xR, yBot, { base, gold = null, panel = null, inset = .8 } = {}){
  const g = new THREE.Group();
  const pts = [[xL, yBot], [xR, yBot]];
  const N = 24;
  for (let i = 0; i <= N; i++){
    const x = xR - (xR - xL) * i / N;
    pts.push([x, roofTopY(x, o) - (o.thick ?? .5) + .12]);
  }
  const shapeOf = (s, dz) => {
    const cx = (xL + xR) / 2, cy = (yBot + Math.max(...pts.map((p) => p[1]))) / 2 - .4;
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(cx + (p[0] - cx) * s, cy + (p[1] - cy) * s)));
    return sh;
  };
  const add = (m, s, dz) => { const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(s)), m); mesh.position.z = dz; g.add(mesh); };
  add(base, 1, 0);
  if (gold) add(gold, inset + .035, .012);
  if (panel) add(panel, inset - .005, .024);
  return g;
}
