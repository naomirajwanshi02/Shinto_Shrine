// Shinto Shrine in AR: allow the camera, scan the shrine picture → how-to panel →
// the 3D shrine floats over the live camera. Turn it, zoom it, read the notes at the top.
//
// ?demo=1     skip the picture (camera still on as the background)
// ?preview=1  no camera at all

import { NOTES, NOTE_MS, PARTS } from './data.js?v=11';
import { scan, stopScan, scanning, plainCamera, freezeTracking } from './scan.js?v=11';
import { mountStage, unmountStage, selectPart } from './stage.js?v=11';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const S = { phase: 'perm', note: 0, noteT: 0, part: null };

const overlay = (id, on) => $(id).classList.toggle('on', on);
const show = (id) => document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* no vibration */ } };
const pop = (el) => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };

// ------------------------------------------------------------ 0 · camera permission
async function cameraGranted(){
  try { return (await navigator.permissions?.query({ name: 'camera' }))?.state === 'granted'; } catch { return false; }
}
async function openPerm(){
  S.phase = 'perm';
  overlay('guide', false);
  if (await cameraGranted()) return openScan();
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){
    $('permStatus').textContent = 'This browser cannot use the camera here. Open the page over https in Safari or Chrome.';
    $('permBtn').disabled = true;
  }
  show('perm');
}
async function askCamera(){
  $('permBtn').disabled = true;
  $('permStatus').textContent = 'Waiting for you to tap “Allow”…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    stream.getTracks().forEach((t) => t.stop());
    $('permStatus').textContent = '';
    show(null);
    openScan();
  } catch (err) {
    console.error(err);
    $('permStatus').textContent = err?.name === 'NotAllowedError'
      ? 'The camera was blocked. Tap the “aA” or lock icon next to the address, allow the camera for this site, then tap Allow camera again.'
      : 'The camera did not start. Close other apps that use the camera and try again.';
  } finally { $('permBtn').disabled = false; }
}

// ------------------------------------------------------------ 1 · find the picture
async function openScan(){
  S.phase = 'scan';
  unmountStage();
  show(null); overlay('hud', false); overlay('guide', true);
  $('scanRetry').hidden = true;
  if (scanning()){ $('scanStatus').textContent = 'Looking for the picture…'; return; }
  $('scanStatus').textContent = 'Starting camera…';
  try {
    await scan($('ar'), { onStatus: (t) => { if (S.phase === 'scan') $('scanStatus').textContent = t; }, onFound });
  } catch (err) {
    console.error(err);
    const msg = String(err?.message || err?.name || err || '');
    $('scanStatus').textContent = /mind|fetch|404/i.test(msg) ? `Could not load the picture data (${msg}).`
      : 'Camera not available. Allow camera access for this site in your browser settings, then tap Try again.';
    $('scanRetry').hidden = false;
  }
}
function onFound(){
  if (S.phase !== 'scan') return;
  S.phase = 'found';
  freezeTracking();
  overlay('guide', false);
  buzz(40);
  overlay('found', true);
  setTimeout(() => { overlay('found', false); openIntro(); }, 1300);
}

// ------------------------------------------------------------ 2 · instructions
function openIntro(){
  S.phase = 'intro';
  overlay('guide', false);
  $('camStatus').textContent = '';
  show('intro');
}

async function begin(){
  $('goBtn').disabled = true;
  // if the camera is not running yet (skipped the picture), ask for it now
  if (!$('ar').querySelector('video') && !q.has('preview')){
    try { await plainCamera($('ar')); }
    catch (err) {
      console.error(err);
      $('camStatus').textContent = 'The camera did not start, so there is no AR view. You can still look at the shrine.';
      $('ar').classList.add('preview');
      await new Promise((r) => setTimeout(r, 1600));
    }
  } else if (q.has('preview')) $('ar').classList.add('preview');
  $('goBtn').disabled = false;
  S.phase = 'view';
  show(null);
  try { mountStage($('stage'), { onPick }); }
  catch (err){ console.error(err); $('errText').textContent = String(err?.stack || err); $('err').hidden = false; return; }
  overlay('hud', true);
  $('partCard').hidden = true; $('noteTrack').hidden = false; $('noteDots').parentElement.hidden = false; S.part = null;
  $('notes').hidden = false; $('infoBtn').setAttribute('aria-expanded', 'true');
  pop($('notes'));
  buildNotes();
  goNote(0);
}

// ------------------------------------------------------------ 3 · the notes at the top
function buildNotes(){
  if ($('noteTrack').children.length) return;
  $('noteTrack').innerHTML = NOTES.map((n, i) => `
    <article class="note" id="note${i}" aria-roledescription="slide" aria-label="${i + 1} of ${NOTES.length}">
      <h2>${n.title}</h2>
      <p>${n.text}</p>
    </article>`).join('');
  $('noteDots').innerHTML = NOTES.map((n, i) => `<button role="tab" aria-label="${n.title}" data-i="${i}"></button>`).join('');
  $('noteDots').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => goNote(+b.dataset.i)));
  let x0 = null;
  $('notes').addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  $('notes').addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) goNote(S.note + (dx < 0 ? 1 : -1));
  });
}
function goNote(i){
  S.note = (i + NOTES.length) % NOTES.length;
  $('noteTrack').style.transform = `translateX(${-100 * S.note}%)`;
  NOTES.forEach((_, k) => $(`note${k}`).setAttribute('aria-hidden', k !== S.note));
  $('noteDots').querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-selected', k === S.note));
  clearTimeout(S.noteT);
  S.noteT = setTimeout(() => { if (S.phase === 'view') goNote(S.note + 1); }, NOTE_MS);
}

// ------------------------------------------------------------ wiring
$('permBtn').addEventListener('click', askCamera);
$('scanRetry').addEventListener('click', () => { stopScan(); openScan(); });
$('scanSkip').addEventListener('click', () => { stopScan(); overlay('guide', false); openIntro(); });
$('goBtn').addEventListener('click', begin);
$('infoBtn').addEventListener('click', () => setInfo($('notes').hidden));
$('notesClose').addEventListener('click', () => setInfo(false));
$('errBtn').addEventListener('click', () => { $('err').hidden = true; location.reload(); });

// MindAR's own listeners can throw after a failed camera start; the screen already says what to do.
const fromTracker = (s) => /mind-?ar/i.test(String(s));
addEventListener('error', (e) => { const s = e.error?.stack || e.message; if (fromTracker(s + e.filename)) return; $('errText').textContent = String(s); $('err').hidden = false; });
addEventListener('unhandledrejection', (e) => { const s = e.reason?.stack || e.reason; if (fromTracker(s)) return; $('errText').textContent = String(s); $('err').hidden = false; });

window.__shrine = { S, goNote, begin };

if (q.has('preview')){ $('ar').classList.add('preview'); openIntro(); }
else if (q.has('demo')) openIntro();
else openPerm();

// ------------------------------------------------------------ information panel: the i button shows / hides it, the small cross hides it
function setInfo(on){
  $('notes').hidden = !on;
  $('infoBtn').setAttribute('aria-expanded', String(on));
  clearTimeout(S.noteT);
  if (on){ pop($('notes')); if (!S.part) goNote(S.note); }
}

// keep the last two words of every paragraph together, so no line ends with a lone word
function glue(el){ el.innerHTML = el.innerHTML.replace(/\s+(\S+)\s*$/, '&nbsp;$1'); }
document.querySelectorAll('.welcome p').forEach(glue);
new MutationObserver(() => document.querySelectorAll('.note p:not([data-g])').forEach((p) => { p.dataset.g = 1; glue(p); }))
  .observe($('noteTrack'), { childList: true });

// ------------------------------------------------------------ touching a part: the panel shows what it is
function onPick(id){
  const p = id && PARTS[id];
  if (!p){
    if (!S.part) return;
    S.part = null;
    $('partCard').hidden = true; $('noteTrack').hidden = false; $('noteDots').parentElement.hidden = false;
    if (!$('notes').hidden) goNote(S.note);
    return;
  }
  S.part = id;
  $('partName').textContent = p.name;
  $('partText').textContent = p.text; glue($('partText'));
  $('noteTrack').hidden = true; $('noteDots').parentElement.hidden = true; $('partCard').hidden = false;
  clearTimeout(S.noteT);
  const wasHidden = $('notes').hidden;
  $('notes').hidden = false; $('infoBtn').setAttribute('aria-expanded', 'true');
  pop($('notes'));
  buzz(15);
  void wasHidden;
}
// the small cross inside the panel always closes the panel (and clears any lit part); the i button brings it back
$('notesClose').addEventListener('click', (e) => {
  e.stopImmediatePropagation();
  if (S.part) selectPart(null);
  setInfo(false);
}, true);

// every cross leaves this interaction and goes back to Scan to Explore, the hub it is linked from,
// straight onto its scanning screen
const HUB = 'https://naomirajwanshi02.github.io/Scan_To_Explore/?scan=1';
function toHub(){
  clearTimeout(S.noteT);
  try { unmountStage(); } catch { /* fine */ }
  try { stopScan(); } catch { /* fine */ }
  $('ar').querySelectorAll('video').forEach((v) => v.srcObject?.getTracks?.().forEach((t) => t.stop()));
  location.href = HUB;
}
$('exitBtn').addEventListener('click', toHub);
$('introClose').addEventListener('click', toHub);
$('guideClose').addEventListener('click', toHub);
