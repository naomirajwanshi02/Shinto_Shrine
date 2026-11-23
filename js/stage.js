// The viewer: the shrine floats in front of the live camera, not tied to anything.
// One finger turns it, two fingers pinch to zoom, the wheel zooms. A short tap on a part lights it up
// and reports it through onPick(id); a tap on empty space reports null.

import * as THREE from 'three';
import { buildShrine } from './shrine.js?v=8';

const HOME = { az: -0.95, el: 0.5, dist: 98 };
const LIM = { elMin: 0.04, elMax: 1.4, dMin: 22, dMax: 230 };
const GLOW = new THREE.Color(0xffa233);

let S = null;

export function mountStage(container, { onPick } = {}){
  unmountStage();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cv = renderer.domElement;
  cv.className = 'stage';
  container.appendChild(cv);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 8, 900);

  scene.add(new THREE.HemisphereLight(0xfff3dd, 0x6b5a45, 1.2));
  const sun = new THREE.DirectionalLight(0xffecc8, 2.3);
  sun.position.set(40, 85, 70);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -50; sc.right = 50; sc.top = 50; sc.bottom = -50; sc.near = 10; sc.far = 260;
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.5;
  sun.target.position.set(3, 0, 3);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xbcd0e8, 0.55); fill.position.set(-60, 30, -40); scene.add(fill);

  const shrine = buildShrine({ aniso: Math.min(8, renderer.capabilities.getMaxAnisotropy()) });
  scene.add(shrine);
  const target = shrine.userData.center.clone();

  const st = { ...HOME, vAz: 0, vEl: 0, idle: 0, auto: true, drag: false };
  S = { renderer, scene, camera, st, container, raf: 0, last: performance.now(), pointers: new Map(), pinch: null, shrine, off: [], sel: null, tap: null, onPick, t: 0 };

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(cx, cy){
    const r = cv.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(shrine.userData.pickables, false)[0];
    if (!hit) return null;
    let o = hit.object;
    while (o && !o.userData.part) o = o.parent;
    return o ? o.userData.part : null;
  }
  function select(id){
    if (S.sel === id) return;
    const prev = S.sel && shrine.userData.parts[S.sel];
    if (prev) prev.userData.mats.forEach((m) => { if (m.emissive) m.emissive.copy(m.userData.e0 ?? new THREE.Color(0)); m.emissiveIntensity = m.userData.i0 ?? 1; });
    S.sel = id;
    const g = id && shrine.userData.parts[id];
    if (g) g.userData.mats.forEach((m) => { m.userData.e0 = m.emissive.clone(); m.userData.i0 = m.emissiveIntensity; });
    S.onPick?.(id);
  }
  S.select = select;

  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); S.off.push(() => el.removeEventListener(ev, fn, opt)); };
  on(cv, 'pointerdown', (e) => {
    cv.setPointerCapture?.(e.pointerId);
    S.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    st.drag = true; st.idle = 0; st.vAz = st.vEl = 0;
    S.tap = S.pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now(), ok: true } : null;
    if (S.pointers.size === 2){ const [a, b] = [...S.pointers.values()]; S.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: st.dist }; }
  });
  on(cv, 'pointermove', (e) => {
    const p = S.pointers.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    st.idle = 0;
    if (S.tap && Math.hypot(e.clientX - S.tap.x, e.clientY - S.tap.y) > 9) S.tap.ok = false;
    if (S.pointers.size === 1){
      st.az -= dx * 0.0052; st.el = clamp(st.el + dy * 0.0042, LIM.elMin, LIM.elMax);
      st.vAz = -dx * 0.0052 * 60; st.vEl = 0;
    } else if (S.pointers.size === 2 && S.pinch){
      const [a, b] = [...S.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      st.dist = clamp(S.pinch.dist * (S.pinch.d / Math.max(d, 1)), LIM.dMin, LIM.dMax);
    }
  });
  const up = (e) => {
    const was = S.pointers.has(e.pointerId);
    S.pointers.delete(e.pointerId);
    if (S.pointers.size < 2) S.pinch = null;
    if (!S.pointers.size) st.drag = false;
    if (was && e.type === 'pointerup' && S.tap?.ok && performance.now() - S.tap.t < 600){ select(pick(e.clientX, e.clientY)); st.vAz = 0; }
    if (!S.pointers.size) S.tap = null;
  };
  on(cv, 'pointerup', up); on(cv, 'pointercancel', up); on(cv, 'pointerleave', up);
  on(cv, 'wheel', (e) => { e.preventDefault(); st.idle = 0; st.dist = clamp(st.dist * Math.exp(e.deltaY * 0.0012), LIM.dMin, LIM.dMax); }, { passive: false });
  on(window, 'resize', fit);

  function fit(){
    const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 36 / Math.max(0.55, camera.aspect * 1.05) : 36;
    camera.updateProjectionMatrix();
  }
  fit();

  window.__shrineView = (az, el, dist) => Object.assign(st, { az, el, dist, vAz: 0, idle: -9999 });
  window.__shrineSelect = select;
  window.__shrineTarget = (x, y, z) => target.set(x, y, z);
  const clock = () => {
    S.raf = requestAnimationFrame(clock);
    const now = performance.now(), dt = Math.min(0.05, (now - S.last) / 1000); S.last = now; S.t += dt;
    if (!st.drag){
      st.idle += dt;
      st.az += st.vAz * dt; st.vAz *= Math.pow(0.04, dt);
      if (st.idle > 4 && S.pointers.size === 0 && !S.sel) st.az += 0.08 * dt * Math.min(1, (st.idle - 4) / 2);
    }
    // the touched part glows and breathes
    if (S.sel){
      const g = shrine.userData.parts[S.sel], k = .45 + .22 * Math.sin(S.t * 4.2);
      g?.userData.mats.forEach((m) => { if (m.emissive){ m.emissive.copy(GLOW); m.emissiveIntensity = k; } });
    }
    const r = st.dist;
    camera.position.set(
      target.x + r * Math.cos(st.el) * Math.sin(st.az),
      target.y + r * Math.sin(st.el),
      target.z + r * Math.cos(st.el) * Math.cos(st.az));
    camera.lookAt(target.x, target.y + 1, target.z);
    renderer.render(scene, camera);
  };
  clock();

  S.reset = () => Object.assign(st, HOME, { vAz: 0, vEl: 0, idle: 0 });
  return S;
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function selectPart(id){ S?.select(id); }
export function resetView(){ S?.reset(); }
export const staged = () => !!S;

export function unmountStage(){
  if (!S) return;
  cancelAnimationFrame(S.raf);
  S.off.forEach((f) => f());
  S.scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose?.(); }); });
  S.renderer.dispose();
  S.renderer.domElement.remove();
  S = null;
}
