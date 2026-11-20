// An Inari shrine, built procedurally in metres (1 unit = 1 m). Layout (x runs along the approach
// toward the hall, z across it, y up):
//   torii gate and its fox guardians → stone path with two lanterns → hall on its stone platform;
//   the washing pavilion behind the left lantern, the mikoshi shelter and the ema rack on the right.
// Every touchable piece is a "part": a group whose userData.part is its key in js/data.js.

import * as THREE from 'three';
import { rng, makeTextures, mat, box, cyl, ball, pyramid, loft, tbox, gableFace, gableRoof, roofTopY } from './kit.js';

export function buildShrine({ aniso = 8 } = {}){
  const T = makeTextures(aniso);
  const R = rng(5);
  const root = new THREE.Group();
  const parts = {};
  const P = (id, parent = root) => { const g = new THREE.Group(); g.userData.part = id; parent.add(g); parts[id] = g; return g; };
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

  // ------------------------------------------------------------------ materials
  const M = {
    red: mat(0xd9441f, { rough: .55 }), redDeep: mat(0x93291a, { rough: .6 }), cloth: mat(0xc43a28, { rough: .8 }),
    black: mat(0x1c1a18, { rough: .5 }), lintel: mat(0x3a3935, { rough: .6 }), lacquer: mat(0x15100d, { rough: .28, metal: .25 }),
    gold: mat(0xd9a52c, { rough: .32, metal: .65 }),
    wood: mat(0xd2b79a, { map: T.wood, rough: .9 }), woodDark: mat(0x5a4330, { rough: .9 }), slat: mat(0xffffff, { map: T.slat, rough: .85 }),
    plaster: mat(0xffffff, { map: T.plaster, rough: .95 }), lattice: mat(0xffffff, { map: T.lattice, rough: .8 }),
    shingle: mat(0xffffff, { map: T.shingle, rough: .95 }), tile: mat(0xffffff, { map: T.tile, rough: .6 }),
    stone: mat(0x908e8a, { rough: 1 }), granite: mat(0xa8a296, { rough: .95 }), baseStone: mat(0x7f7d79, { rough: 1 }),
    eave: mat(0x8c3d24, { rough: .85 }), ridge: mat(0x4b3829, { rough: .9 }), brown: mat(0x8a5a34, { rough: .85 }), rail: mat(0x6b4426, { rough: .85 }),
    plank: mat(0xe0b05a, { rough: .8 }), orange: mat(0xd49a4a, { rough: .8 }),
    paving: mat(0xffffff, { map: T.paving, rough: .9 }), gravel: mat(0xffffff, { map: T.gravel, rough: 1 }),
    water: mat(0x5f8a98, { rough: .08, metal: .1 }), moss: mat(0x7f9340, { rough: 1 }),
    straw: mat(0xd6bd78, { rough: .95 }), paper: mat(0xf8f2e4, { rough: .9, side: THREE.DoubleSide }),
    lamp: mat(0xffffff, { map: T.paper, rough: .8, emissive: 0xffc27a }),
    fox: mat(0x5b4a49, { rough: .8 }), ema: mat(0xffffff, { map: T.ema, rough: .8 }),
    dark: mat(0x1c1410, { rough: .9 }), shade: mat(0x2a1c12, { rough: .9 }),
  };
  M.lamp.emissiveIntensity = .22;

  // small shared pieces ---------------------------------------------------
  // rafter ends under an eave: a row of small red blocks with pale caps
  const eaveRow = (parent, x, y, z0, z1, step = .6) => {
    const n = Math.max(1, Math.round((z1 - z0) / step));
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(.22, .24, .5), M.red, n + 1);
    const cap = new THREE.InstancedMesh(new THREE.BoxGeometry(.24, .26, .05), M.plaster, n + 1);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i <= n; i++){
      const z = z0 + (z1 - z0) * i / n;
      m4.setPosition(x, y, z); inst.setMatrixAt(i, m4);
      m4.setPosition(x, y, z); cap.setMatrixAt(i, m4);
    }
    parent.add(inst, cap);
    return inst;
  };
  const ridgeCap = (parent, o, x, z, len, m = M.shade) => {
    const y = o.base + o.rise + (o.bump || 0) - .12;
    parent.add(at(box(.85, .5, len + .2, m), x, y, z));
  };

  // ------------------------------------------------------------------ ground (gravel)
  {
    const g = P('gravel');
    const sh = new THREE.Shape(), N = 90, cx = 3, cz = 4.5, rx = 31, rz = 25.5;
    for (let i = 0; i < N; i++){
      const a = i / N * Math.PI * 2;
      const r = 1 + .05 * Math.sin(3 * a + 1) + .035 * Math.sin(5 * a + 2) + .025 * Math.sin(9 * a + 4);
      const x = cx + rx * r * Math.cos(a), y = -(cz + rz * r * Math.sin(a));
      i ? sh.lineTo(x, y) : sh.moveTo(x, y);
    }
    const m = mat(0xffffff, { map: T.gravel, rough: 1, repeat: [.22, .22] });
    const geo = new THREE.ExtrudeGeometry(sh, { depth: .4, bevelEnabled: false });
    const ground = new THREE.Mesh(geo, m);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.4;
    ground.userData.noCast = true;
    g.add(ground);
  }

  // ------------------------------------------------------------------ stone paving
  {
    const g = P('paving');
    const p = (w, h, d, x, y, z) => g.add(tbox(w, h, d, M.paving, x, y, z, .25));
    p(7.2, .35, 9.4, -18.6, 0, 0);             // plaza under the gate
    p(8.2, .1, 8.8, -10.9, 0, 0);              // path to the hall
    p(3.8, .1, 17, -13.1, 0, 12.5);            // path branching to the shelter (x −15 … −11.2, z 4 … 21)
    p(9.5, .1, 3.8, -6.2, 0, 18.2);            // cross path into the shelter
  }

  // ------------------------------------------------------------------ torii gate
  {
    const gate = new THREE.Group(); gate.position.set(-18.6, .35, 0); root.add(gate);
    const pillars = P('torii-pillars', gate), bases = P('torii-bases', gate), nuki = P('torii-nuki', gate), top = P('torii-kasagi', gate);
    for (const s of [-1, 1]){
      const col = new THREE.Group(); col.position.set(0, 0, s * 3.3); col.rotation.x = -s * .028; gate.add(col);
      bases.add(cyl(.6, .66, 1.1, M.black, 0, 0, s * 3.3, 20));
      bases.add(cyl(.52, .6, .12, M.black, 0, 1.1, s * 3.3, 20));
      const post = cyl(.41, .5, 7.1, M.red, 0, 1.2, 0, 22);
      // the pillar leans a little inward: put the pillar mesh in the leaning group
      col.add(post); pillars.add(col);
      // wedges that lock the tie beam in place
      nuki.add(box(.32, .95, .5, M.redDeep, 0, 4.9, s * 3.92));
    }
    nuki.add(box(.62, .56, 9.7, M.red, 0, 5.0, 0));
    nuki.add(box(.56, 1.2, .5, M.red, 0, 5.56, 0));        // gakuzuka, the strut in the middle
    top.add(box(.95, .52, 10.8, M.red, 0, 6.75, 0));       // shimaki
    // kasagi: a lintel that curves up at both ends
    const prof = [[-1.15, 0], [1.15, 0], [1.2, .42], [0, 1.0], [-1.2, .42]];
    const st = [];
    for (let i = 0; i <= 28; i++){ const z = -6.6 + 13.2 * i / 28; st.push([z, 0, 1.1 * Math.pow(Math.abs(z) / 6.6, 2.4)]); }
    const kasa = loft(prof, st, [M.lintel], { smooth: [false, false, true, true, true] });
    kasa.position.y = 7.27; top.add(kasa);
    // cut ends: black end caps are part of the loft; add a thin red stripe under it
    top.add(box(1.5, .1, 10.4, M.black, 0, 7.2, 0));
  }
  {
    const g = P('torii-steps');
    g.add(tbox(1.5, .12, 6.6, M.paving, -23.0, 0, 0, .5));
    g.add(tbox(.9, .24, 6.6, M.paving, -22.65, 0, 0, .5));
  }

  // ------------------------------------------------------------------ fox guardians
  const fox = (dir) => {
    const g = new THREE.Group();
    // stepped stone pedestal: wide low slab, two blocks, a wide cap and a small plinth (as in the picture)
    g.add(tbox(2.8, .42, 2.8, M.granite, 0, 0, 0));
    g.add(tbox(2.3, .95, 2.3, M.granite, 0, .42, 0));
    g.add(tbox(1.9, 1.0, 1.9, M.granite, 0, 1.37, 0));
    g.add(tbox(2.2, .3, 2.2, M.granite, 0, 2.37, 0));
    g.add(tbox(1.45, .3, 1.45, M.granite, 0, 2.67, 0));
    // a slim, upright sitting fox facing +x
    const f = new THREE.Group(); f.position.y = 2.97; g.add(f);
    f.add(ball(.36, M.fox, -.2, .36, 0, 1.15, .95, .9));                      // haunch
    f.add(ball(.3, M.fox, .02, 1.0, 0, .85, 1.75, .8));                       // slim chest and body
    for (const s of [-1, 1]){
      f.add(cyl(.075, .09, 1.05, M.fox, .3, 0, s * .15, 10));                 // thin forelegs
      f.add(ball(.13, M.fox, .38, .06, s * .15, 1.5, .5, .9));                // paws
      f.add(ball(.12, M.fox, -.1, .1, s * .36, 1.6, .55, .9));                // hind feet
    }
    f.add(cyl(.16, .22, .55, M.fox, .12, 1.4, 0, 12));                        // long neck
    f.add(ball(.25, M.fox, .2, 1.98, 0, 1.05, .95, .9));                      // head
    const snout = new THREE.Mesh(new THREE.ConeGeometry(.12, .5, 10), M.fox);
    snout.rotation.z = -Math.PI / 2 - .12; snout.position.set(.55, 1.92, 0); f.add(snout);
    f.add(ball(.05, M.black, .8, 1.9, 0));
    for (const s of [-1, 1]){
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.11, .5, 8), M.fox);
      ear.position.set(.1, 2.42, s * .15); ear.rotation.x = s * .12; ear.rotation.z = .1; f.add(ear);
      f.add(ball(.035, M.black, .38, 2.04, s * .13));
    }
    // the tail rises behind the back in a slim curve
    const tailCurve = new THREE.CatmullRomCurve3([[-.3, .18, 0], [-.7, .22, 0], [-.88, .6, 0], [-.82, 1.1, 0], [-.62, 1.45, 0]].map((p) => new THREE.Vector3(...p)));
    f.add(new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 24, .12, 8), M.fox));
    f.add(ball(.12, M.fox, -.62, 1.5, 0, 1, 1.4, 1));
    // red bib: a collar round the neck and a tongue down the chest
    f.add(cyl(.27, .32, .42, M.cloth, .12, 1.28, 0, 16));
    f.add(box(.04, .62, .3, M.cloth, .36, .78, 0));
    g.rotation.y = dir;
    return g;
  };
  {
    const l = P('fox-l'); const a = fox(-Math.PI / 2); a.position.set(-15.6, 0, -7.6); l.add(a);
    const r = P('fox-r'); const b = fox(Math.PI / 2); b.position.set(-16.8, 0, 7.0); r.add(b);
  }

  // ------------------------------------------------------------------ stone lanterns
  const lantern = () => {
    const g = new THREE.Group();
    const G = M.granite;
    // a four-step stone base, a short post, the fire chamber, a wide roof and a jewel, as in the picture
    g.add(tbox(2.3, .24, 2.3, G, 0, 0, 0));
    g.add(tbox(1.9, .24, 1.9, G, 0, .24, 0));
    g.add(tbox(1.5, .24, 1.5, G, 0, .48, 0));
    g.add(tbox(1.1, .24, 1.1, G, 0, .72, 0));
    g.add(tbox(.7, .62, .7, G, 0, .96, 0));                      // post
    g.add(tbox(.95, .16, .95, G, 0, 1.58, 0));                   // middle platform
    g.add(tbox(.8, .8, .8, G, 0, 1.74, 0));                      // fire chamber
    for (let k = 0; k < 4; k++){                                 // light openings
      const a = k * Math.PI / 2, s = new THREE.Group(); s.rotation.y = a; g.add(s);
      s.add(box(.02, .3, .3, M.dark, .405, 1.98, 0));
    }
    g.add(tbox(1.0, .14, 1.0, G, 0, 2.54, 0));
    g.add(pyramid(1.1, .75, G, 0, 2.68, 0));                     // roof
    g.add(tbox(.3, .26, .3, G, 0, 3.4, 0));
    g.add(ball(.16, G, 0, 3.78, 0, 1, 1.15, 1));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.07, .22, 8), G); cone.position.y = 4.0; g.add(cone);
    g.scale.setScalar(1.2);
    return g;
  };
  { const a = P('lantern-l'); a.add(at(lantern(), -4.6, 0, -6.4)); const b = P('lantern-r'); const lb = lantern(); b.add(at(lb, -4.6, 0, 3.6)); }

  // ------------------------------------------------------------------ small pavilions: shared pieces
  const shelterRoof = (o, mats, parent, x, z, rotY = 0) => {
    const r = gableRoof(o, mats); r.position.set(x, 0, z); r.rotation.y = rotY; parent.add(r); return r;
  };

  // ------------------------------------------------------------------ temizuya (water-washing pavilion)
  {
    const c = new THREE.Group(); c.position.set(-10, 0, -12.5); root.add(c);
    const basin = P('temizuya-basin', c), posts = P('temizuya-posts', c), roofP = P('temizuya-roof', c);
    basin.add(tbox(7.2, .25, 7.2, M.paving, 0, 0, 0, .5));
    basin.add(tbox(2.7, 1.0, 1.9, M.granite, 0, .25, 0, .6));
    basin.add(tbox(2.0, .03, 1.2, M.water, 0, 1.24, 0, .5));
    basin.add(box(.4, .6, .4, M.granite, 1.7, .25, 0));      // a small stone step
    for (const dz of [-.35, .35]){
      const h = cyl(.035, .035, 1.8, M.wood, 0, 0, 0, 8); h.rotation.z = Math.PI / 2; h.position.set(0, 1.32, dz); basin.add(h);
      basin.add(cyl(.12, .1, .14, M.wood, -.98, 1.25, dz, 12));
    }
    const half = 2.35, ph = 3.1;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) posts.add(cyl(.15, .17, ph, M.wood, sx * half, .25, sz * half, 12));
    for (const sx of [-1, 1]) posts.add(tbox(.24, .26, 4.9, M.wood, sx * half, ph, 0, .8));
    for (const sz of [-1, 1]) posts.add(tbox(4.9, .22, .22, M.wood, 0, ph + .02, sz * half, .8));
    for (const sz of [-1, 1]) posts.add(tbox(4.9, .18, .18, M.wood, 0, 2.2, sz * half, .8));
    const o = { half: 3.5, base: 3.6, rise: 1.8, p: 1.4, lift: .32, thick: .42, len: 6.0 };
    const roof = shelterRoof(o, [M.tile, M.shade], roofP, 0, 0);
    ridgeCap(roofP, o, 0, 0, o.len);
    for (const s of [-1, 1]) eaveRow(roofP, s * (o.half - .5), o.base - .34 + .02, -2.6, 2.6, .55);
    for (const s of [-1, 1]){
      const gf = gableFace(o, -2.5, 2.5, 3.3, { base: M.shade }); gf.position.set(0, 0, s * 2.55); if (s < 0) gf.rotation.y = Math.PI; posts.add(gf);
    }
  }

  // ------------------------------------------------------------------ the hall (haiden) on its platform
  const F = 1.2;                                // floor level
  {
    // stone platform
    const pf = P('haiden-platform');
    // plain grey slabs, no texture: a low wide base under a taller upper platform (nothing shares a plane)
    pf.add(box(18.0, .45, 25.1, M.baseStone, 5.8, 0, -2.75));
    pf.add(box(16.4, F - .45, 23.5, M.stone, 5.8, .45, -2.75));
    // stairs, off-centre like the picture, with sloping side walls
    const st = P('haiden-stairs');
    const zs = -1.5;
    for (let j = 1; j <= 5; j++){
      const xf = -2.4 - .75 * (6 - j);
      st.add(box(-2.3 - xf, .2 * j, 5.2, M.stone, (xf - 2.3) / 2, 0, zs));
    }
    for (const s of [-1, 1]){
      const sh = new THREE.Shape([[0, 0], [4.7, 0], [4.7, 1.6], [0, .32]].map((p) => new THREE.Vector2(p[0], p[1])));
      const cheek = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .6, bevelEnabled: false }), M.baseStone);
      cheek.position.set(-7.0, 0, zs + s * 2.9 - .3); st.add(cheek);
    }

    // body of the hall
    const wl = P('haiden-walls');
    const WT = F + 4.0;                          // wall top
    wl.add(tbox(11.0, 4.0, 11.6, M.plaster, 5.65, F, 0, .5));
    // front: dark doorway with two red doors, lattice windows either side
    wl.add(box(.06, 3.2, 4.9, M.dark, .13, F + .1, 0));
    for (const s of [-1, 1]){
      wl.add(box(.1, 3.0, 2.3, M.redDeep, .1, F + .15, s * 1.25));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) wl.add(ball(.07, M.gold, .03, F + .75 + i * .62, s * (.35 + j * .72)));
      wl.add(tbox(.07, 2.1, 2.7, M.lattice, .12, F + 1.5, s * 4.15, .9));
    }
    wl.add(box(.08, 3.0, .12, M.black, .1, F + .15, 0));
    // red frame of the walls: posts and rails on the front and the long side
    const bar = (x, y, z, w, h, d) => wl.add(box(w, h, d, M.red, x, y, z));
    for (const z of [-5.8, -2.6, 2.6, 5.8]) wl.add(cyl(.2, .2, 4.0, M.red, .2, F, z, 12));
    bar(.14, WT - .35, 0, .2, .32, 11.8); bar(.14, F + 1.2, 0, .14, .2, 11.8);
    for (const x of [.2, 2.95, 5.7, 8.45, 11.1]) wl.add(cyl(.2, .2, 4.0, M.red, x, F, 5.8, 12));
    bar(5.65, WT - .35, 5.84, 11.2, .32, .2); bar(5.65, F + .9, 5.84, 11.2, .16, .16); bar(5.65, F + 2.1, 5.84, 11.2, .12, .12);
    for (const x of [.2, 2.95, 5.7, 8.45, 11.1]) wl.add(cyl(.2, .2, 4.0, M.red, x, F, -5.8, 12));
    for (const x of [1.6, 4.3, 7.1, 9.8]){
      for (const y of [1.1, 2.15, 3.2]) wl.add(box(.06, .06, .9, M.red, x, F + y, 5.86).rotateY(0));
    }
    // red lattice grid on the long side: vertical slats
    for (let x = 1.0; x < 11; x += .55) wl.add(box(.07, 2.9, .05, M.red, x, F + 1.0, 5.86));
    wl.add(box(.2, .2, 11.8, M.redDeep, .14, F + .02, 0));

    // veranda floor, pillars, railing
    const vp = P('haiden-posts');
    vp.add(tbox(2.5, .12, 15.2, M.woodDark, -.9, F, 0, .6));
    vp.add(tbox(13.5, .12, 1.7, M.woodDark, 5.1, F, 6.6, .6));
    const pil = (x, z, h = 3.8) => vp.add(cyl(.2, .22, h, M.red, x, F + .12, z, 14));
    for (const z of [-7, -4.9, 4.9, 7]) pil(-1.7, z, 3.78);
    for (const x of [1.6, 4.8, 8.0, 11.1]) pil(x, 7, 3.78);
    for (const z of [-2.6, 2.6]) pil(-1.7, z, 3.3);
    vp.add(box(.3, .32, 14.6, M.red, -1.7, F + 3.9, 0));
    vp.add(box(12.9, .32, .3, M.red, 5.4, F + 3.9, 7));
    // koran railing: posts, two rails, caps
    const rail = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.5));
      const ang = Math.atan2(-(z1 - z0), x1 - x0);
      const g = new THREE.Group(); g.position.set(x0, F + .12, z0); g.rotation.y = ang; vp.add(g);
      for (let i = 0; i <= n; i++){
        const x = len * i / n;
        g.add(box(.17, 1.02, .17, M.red, x, 0, 0)); g.add(ball(.13, M.gold, x, 1.1, 0));
      }
      g.add(box(len, .14, .14, M.red, len / 2, .92, 0)); g.add(box(len, .12, .12, M.red, len / 2, .5, 0)); g.add(box(len, .1, .1, M.red, len / 2, .1, 0));
      for (let i = 0; i < n * 3; i++) g.add(box(.05, .4, .05, M.red, (i + .5) * len / (n * 3), .54, 0));
    };
    rail(-1.7, -7, -1.7, -3.0); rail(-1.7, 3.0, -1.7, 7);
    rail(-1.7, 7, 11.1, 7);
    rail(-1.7, -7, .8, -7);
    rail(-1.7, -3.0, -1.7, -2.6); // closes up to the porch pillar

    // ---- main roof
    const rf = P('haiden-roof');
    const o = { half: 8.2, base: 5.05, rise: 5.4, p: 1.35, lift: .45, thick: .5, len: 16.6 };
    shelterRoof(o, [M.shingle, M.eave], rf, 5.7, 0);
    ridgeCap(rf, o, 5.7, 0, o.len, M.ridge);
    for (const s of [-1, 1]){
      const d = cyl(.42, .42, .18, M.gold, 0, 0, 0, 20); d.rotation.x = Math.PI / 2; d.position.set(5.7, o.base + o.rise + .12, s * (o.len / 2 + .12)); rf.add(d);
    }
    for (let i = -3; i <= 3; i++){ const d = ball(.14, M.gold, 5.7 + (i % 2 ? -.05 : .05), o.base + o.rise + .38, i * 2.2); rf.add(d); }
    eaveRow(rf, -2.5 + .35, o.base - .22, -7.9, 7.9, .6);
    eaveRow(rf, 13.9 - .35, o.base - .22, -7.9, 7.9, .6);
    // gable ends: plaster, gold border, red panel
    const gb = P('haiden-gable');
    for (const s of [-1, 1]){
      const gf = gableFace(o, -5.5, 5.4, WT, { base: M.plaster, gold: M.gold, panel: M.redDeep, inset: .74 });
      gf.position.set(5.7, 0, s * 6.05); if (s < 0) gf.rotation.y = Math.PI; gb.add(gf);
    }

    // ---- curved porch with the wave-shaped kara-hafu gable
    const pr = P('haiden-porch');
    const po = { half: 4.7, base: 4.55, rise: 2.7, p: 1.35, lift: .4, thick: .5, bump: .75, bumpW: .5, len: 7.6 };
    shelterRoof(po, [M.shingle, M.eave], pr, 1.2, 0, Math.PI / 2);
    // red barge board that follows the wave
    const bo = { ...po, half: po.half + .12, base: po.base + .06, rise: po.rise + .04, thick: .72, len: .5 };
    shelterRoof(bo, [M.red, M.red], pr, -2.85, 0, Math.PI / 2);
    for (const s of [-1, 1]) pr.add(ball(.26, M.gold, -3.1, po.base + po.lift + .15, s * (po.half - .2)));
    pr.add(ball(.3, M.gold, -3.1, po.base + po.rise + po.bump + .1, 0));
    for (const s of [-1, 1]) pr.add(ball(.2, M.gold, -3.1, po.base + 1.0, s * 2.2));
    eaveRow(pr, -2.35, po.base - .2, -4.3, 4.3, .6);
    // curved red tie arch between the porch pillars
    const arch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.75, F + 3.05, -2.65), new THREE.Vector3(-1.75, F + 3.65, -1.7), new THREE.Vector3(-1.75, F + 4.0, -.7),
      new THREE.Vector3(-1.75, F + 4.08, 0),
      new THREE.Vector3(-1.75, F + 4.0, .7), new THREE.Vector3(-1.75, F + 3.65, 1.7), new THREE.Vector3(-1.75, F + 3.05, 2.65)]);
    pr.add(new THREE.Mesh(new THREE.TubeGeometry(arch, 40, .17, 8), M.red));
    pr.add(box(.34, .34, 5.8, M.red, -1.72, F + 3.1, 0));
    for (const s of [-1, 1]){
      pr.add(ball(.22, M.gold, -1.72, F + 3.1, s * 2.65));
      pr.add(tbox(.12, 1.9, .06, M.gold, -1.74, F + 3.25, s * 1.0, 1));
    }

    // ---- sacred rope with paper streamers
    const sm = P('shimenawa');
    const rope = new THREE.CatmullRomCurve3([-2.75, -1.6, 0, 1.6, 2.75].map((z, i) => new THREE.Vector3(-1.45, F + 3.0 - [0, .42, .55, .42, 0][i], z)));
    sm.add(new THREE.Mesh(new THREE.TubeGeometry(rope, 48, .17, 10), M.straw));
    for (const z of [-2.75, 2.75]) sm.add(ball(.24, M.straw, -1.45, F + 3.0, z, 1, 1, 1.3));
    for (const z of [-1.7, -.85, 0, .85, 1.7]){
      const p = rope.getPoint((z + 2.75) / 5.5);
      const sh = new THREE.Group(); sh.position.copy(p); sh.position.y -= .1; sm.add(sh);
      for (let k = 0; k < 3; k++){
        const q = box(.34, .3, .025, M.paper, 0, -.3 * (k + 1), 0);
        q.position.x = (k % 2 ? -1 : 1) * .07; q.rotation.y = (k % 2 ? -1 : 1) * .5; sh.add(q);
      }
      const tw = box(.03, .1, .03, M.straw, 0, -.12, 0); sh.add(tw);
    }

    // ---- offering box
    const sb = P('saisen');
    sb.add(tbox(1.15, 1.1, 2.6, M.slat, -.75, F + .12, 0, .9));
    sb.add(box(1.3, .12, 2.75, M.black, -.75, F + 1.22, 0));
    for (let i = 0; i < 6; i++) sb.add(box(1.0, .04, .08, M.dark, -.75, F + 1.35, -1.1 + i * .44));
    for (const z of [-1.1, 0, 1.1]) sb.add(box(.05, 1.1, .16, M.black, -1.34, F + .12, z));
    sb.add(box(1.2, .12, .05, M.black, -.75, F + .12, 1.31)); sb.add(box(1.2, .12, .05, M.black, -.75, F + .12, -1.31));
    const crest = cyl(.34, .34, .04, M.gold, 0, 0, 0, 24); crest.rotation.z = Math.PI / 2; crest.position.set(-1.36, F + .72, 0); sb.add(crest);
    for (let k = 0; k < 8; k++){ const pe = ball(.07, M.gold, -1.39, F + .72 + Math.cos(k * Math.PI / 4) * .24, Math.sin(k * Math.PI / 4) * .24); sb.add(pe); }

    // ---- hanging paper lanterns
    for (const [id, z] of [['chochin-l', -4.0], ['chochin-r', 3.7]]){
      const g = P(id);
      g.add(cyl(.015, .015, .75, M.black, -1.35, F + 3.15, z, 6));
      g.add(cyl(.34, .34, .1, M.black, -1.35, F + 2.9, z, 14));
      const body = cyl(.52, .52, 1.3, M.lamp, -1.35, F + 1.6, z, 20); g.add(body);
      g.add(cyl(.36, .36, .12, M.black, -1.35, F + 1.5, z, 14));
      g.add(cyl(.02, .02, .2, M.red, -1.35, F + 1.3, z, 6));
    }

    // ---- side hall behind
    const sh = P('side-hall');
    sh.add(tbox(9.2, 2.7, 6.5, M.plaster, 5.6, F, -9.05, .5));
    const so = { half: 4.7, base: 4.1, rise: 2.7, p: 1.3, lift: .38, thick: .5, len: 11.4 };
    shelterRoof(so, [M.shingle, M.eave], sh, 5.6, -9.05, Math.PI / 2);
    const rc = box(11.6, .5, .85, M.ridge, 5.6, so.base + so.rise - .12, -9.05); sh.add(rc);
    for (const dz of [-1, 1]){
      const zz = -9.05 + dz * (so.half - .35);
      const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .24, .22), M.red, 20);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < 20; i++){ m4.setPosition(5.6 - 5.4 + i * .57, so.base - .22, zz); inst.setMatrixAt(i, m4); }
      sh.add(inst);
    }
    for (const s of [-1, 1]){
      const gf = gableFace(so, -3.2, 3.2, F + 2.7, { base: M.plaster, gold: M.gold, panel: M.redDeep, inset: .6 });
      gf.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; gf.position.set(5.6 + s * 4.72, 0, -9.05); sh.add(gf);
    }
    for (const z of [-11.9, -9.05, -6.2]) sh.add(cyl(.18, .18, 2.7, M.red, 1.05, F, z, 12));
    sh.add(box(.2, .26, 6.5, M.red, 1.0, F + 2.45, -9.05));
    for (const z of [-7.7, -10.4]) sh.add(tbox(.07, 1.5, 1.9, M.lattice, .97, F + .9, z, .9));
    sh.add(box(.2, .22, 6.5, M.redDeep, 1.0, F + .05, -9.05));
  }

  // ------------------------------------------------------------------ mikoshi shelter
  {
    const c = new THREE.Group(); c.position.set(2, 0, 19.5); root.add(c);
    const floor = P('pavilion-floor', c), posts = P('pavilion-posts', c), roofP = P('pavilion-roof', c);
    floor.add(tbox(8.4, .25, 8.4, M.paving, 0, 0, 0, .5));
    const half = 2.9, ph = 3.4;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) posts.add(cyl(.16, .19, ph, M.wood, sx * half, .25, sz * half, 12));
    for (const sx of [-1, 1]) posts.add(tbox(.26, .28, 6.2, M.wood, sx * half, ph, 0, .8));
    for (const sz of [-1, 1]) posts.add(tbox(6.2, .24, .24, M.wood, 0, ph + .02, sz * half, .8));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){ posts.add(tbox(.5, .3, .5, M.woodDark, sx * half, ph + .26, sz * half)); }
    const o = { half: 4.3, base: 3.9, rise: 2.0, p: 1.4, lift: .36, thick: .46, len: 7.0 };
    shelterRoof(o, [M.tile, M.shade], roofP, 0, 0);
    ridgeCap(roofP, o, 0, 0, o.len);
    for (const s of [-1, 1]) eaveRow(roofP, s * (o.half - .5), o.base - .3, -3.1, 3.1, .55);
    for (const s of [-1, 1]){
      const gf = gableFace(o, -3.0, 3.0, ph + .55, { base: M.shade }); gf.position.set(0, 0, s * 3.0); if (s < 0) gf.rotation.y = Math.PI; posts.add(gf);
    }
    // the portable shrine
    const body = P('mikoshi-body', c), poles = P('mikoshi-poles', c), tas = P('mikoshi-tassels', c);
    const y0 = .25;
    for (const s of [-1, 1]) poles.add(box(.3, .3, 6.0, M.lacquer, s * .85, y0, 0));
    for (const z of [-1.3, 1.3]){ poles.add(box(2.5, .22, .34, M.orange, 0, y0 + .3, z)); }
    for (const s of [-1, 1]) for (const z of [-2.8, 2.8]) poles.add(cyl(.17, .17, .08, M.gold, s * .85, y0 + .12, z, 10));
    body.add(tbox(2.0, .4, 2.0, M.lacquer, 0, y0 + .55, 0)); body.add(box(2.1, .1, 2.1, M.gold, 0, y0 + .95, 0));
    body.add(box(1.6, 1.05, 1.6, M.lacquer, 0, y0 + 1.05, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) body.add(box(.12, 1.05, .12, M.gold, sx * .8, y0 + 1.05, sz * .8));
    for (const k of [0, 1, 2, 3]){
      const s = new THREE.Group(); s.rotation.y = k * Math.PI / 2; body.add(s);
      s.add(box(.03, .72, .9, M.gold, .82, y0 + 1.2, 0)); s.add(box(.035, .66, .42, M.lacquer, .84, y0 + 1.23, -.22)); s.add(box(.035, .66, .42, M.lacquer, .84, y0 + 1.23, .22));
    }
    body.add(box(2.1, .12, 2.1, M.gold, 0, y0 + 2.1, 0)); body.add(box(2.0, .12, 2.0, M.lacquer, 0, y0 + 2.22, 0));
    body.add(pyramid(1.6, 1.05, M.lacquer, 0, y0 + 2.3, 0));
    body.add(cyl(.12, .2, .26, M.gold, 0, y0 + 3.3, 0, 10));
    body.add(ball(.2, M.gold, 0, y0 + 3.72, 0, 1, .9, 1.4));
    body.add(ball(.11, M.gold, .22, y0 + 3.95, 0)); body.add(ball(.05, M.red, .33, y0 + 3.95, 0));
    for (const s of [-1, 1]){ const w = box(.06, .42, .75, M.gold, 0, y0 + 3.6, s * .35); w.rotation.x = s * .55; body.add(w); }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.1, .6, 6), M.gold); tail.rotation.z = Math.PI / 2 + .4; tail.position.set(-.45, y0 + 3.72, 0); body.add(tail);
    // tassels hang from the four corners of the roof
    for (const sx of [-1, 1]) for (const sz of [-1, 1]){
      const x = sx * 1.12, z = sz * 1.12;
      tas.add(ball(.14, M.gold, x, y0 + 2.2, z));
      tas.add(cyl(.05, .05, 1.5, M.cloth, x, y0 + .7, z, 8));
      tas.add(cyl(.2, .06, .46, M.cloth, x, y0 + .45, z, 10));
      tas.add(cyl(.12, .12, .1, M.gold, x, y0 + .95, z, 8));
    }
  }

  // ------------------------------------------------------------------ ema rack (as in the picture: a wooden board with a small
  // grey roof, notched end posts, four rails and five columns of rounded wish plaques)
  {
    const c = new THREE.Group(); c.position.set(12.5, 0, 21); root.add(c);
    const rack = P('ema-board', c), pl = P('ema-plaques', c);
    rack.add(tbox(5.0, .14, 9.2, M.paving, 0, 0, 0, .25));
    for (const s of [-1, 1]){
      rack.add(tbox(.55, 3.7, .55, M.wood, 0, .14, s * 3.0, .8));
      for (const y of [1.0, 1.9, 2.8]) rack.add(box(.34, .22, .22, M.wood, 0, .14 + y, s * 3.36));       // notches in the post
      rack.add(box(.8, .26, .8, M.woodDark, 0, 3.7, s * 3.0));                                           // bracket under the roof
    }
    rack.add(box(.3, 3.05, 5.6, M.brown, 0, .5, 0));
    for (let k = 0; k <= 4; k++) rack.add(box(.18, .14, 5.7, M.rail, -.2, .5 + k * .76, 0));
    const o = { half: 1.45, base: 3.8, rise: .8, p: 1.3, lift: .32, thick: .2, len: 7.4 };
    shelterRoof(o, [M.tile, M.ridge], rack, 0, 0);
    ridgeCap(rack, { ...o, rise: o.rise }, 0, 0, o.len, M.ridge);
    // plaques: a rounded rectangle, a little thicker than a board, with a darker rim behind
    const rr = (w, h, r) => { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
    const faceGeo = new THREE.ExtrudeGeometry(rr(.8, .56, .2), { depth: .1, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2 });
    const rimGeo = new THREE.ExtrudeGeometry(rr(.9, .64, .24), { depth: .05, bevelEnabled: false });
    const tints = [0xe2b45f, 0xdba84e, 0xeac06c].map((c) => mat(c, { rough: .75 }));
    const rimMat = mat(0xa8793a, { rough: .85 });
    for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++){
      const y = .5 + .07 + r * .76 + .38 + .06, z = -2.1 + k * 1.05 + (R() - .5) * .08;
      const rim = new THREE.Mesh(rimGeo, rimMat); rim.rotation.y = -Math.PI / 2; rim.position.set(-.15, y, z); pl.add(rim);
      const p = new THREE.Mesh(faceGeo, tints[(r + k * 2) % 3]); p.rotation.y = -Math.PI / 2; p.rotation.x = (R() - .5) * .05; p.position.set(-.19, y, z); pl.add(p);
    }
  }

  // ------------------------------------------------------------------ finish: own materials per part, shadows, pickable meshes
  const pickables = [];
  for (const [id, g] of Object.entries(parts)){
    const clones = new Map();
    const own = (m) => { if (!clones.has(m)) clones.set(m, m.clone()); return clones.get(m); };
    g.traverse((o) => {
      if (!o.isMesh) return;
      o.material = Array.isArray(o.material) ? o.material.map(own) : own(o.material);
      pickables.push(o);
    });
    g.userData.mats = [...clones.values()];
    g.userData.id = id;
  }
  root.traverse((o) => { if (o.isMesh){ o.castShadow = !o.userData.noCast; o.receiveShadow = true; } });
  root.userData.parts = parts;
  root.userData.pickables = pickables;
  root.userData.center = new THREE.Vector3(2, 2.2, 3);
  return root;
}
