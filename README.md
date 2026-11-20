# Shinto Shrine in AR: a scan-to-view WebAR model

Point your phone at the printed **Shinto Shrine** picture ([`target.png`](target.png)). When it is recognised, a short
how-to panel appears, and on **OK** a full 3D Inari shrine floats in front of you over your live camera view.
It is **not anchored** to the picture: turn it with one finger and pinch to zoom. **Tap any part** (gate pillars, fox,
lantern, roof, offering box, mikoshi, ema plaques...) and it lights up while a small panel at the top explains it.

**Play locally:** `powershell -ExecutionPolicy Bypass -File tools/serve.ps1` then `http://localhost:8133/`
· **Without the picture:** `?demo=1` · **Without any camera:** `?preview=1`

| File | What it is |
|---|---|
| `index.html`, `js/app.js`, `js/scan.js` | The flow (camera, scan, how-to, viewer) and the MindAR image scanner |
| `js/shrine.js` | The shrine, built procedurally in metres: 35 touchable parts (torii, foxes, lanterns, washing pavilion, hall, mikoshi shelter, ema rack) |
| `js/kit.js` | Procedural textures, boxes, and a loft that sweeps a profile into curved roofs and the curved top lintel |
| `js/stage.js` | Lights, shadows, camera, turn / pinch / wheel controls, tap picking and the glow on the touched part |
| `js/data.js` | The sliding notes and the text for every part |
| `assets/shinto-shrine.jpg` | The illustration used as the tracking picture |
| `target.png` / `targets.mind` | The picture to scan and its compiled MindAR target |
| `tools/make-target.html`, `tools/serve.ps1` | Rebuild the target (`?build=1`); local server |

Look: [Anatomy](https://github.com/wheresryan22/anatomy) sepia theme in `vendor/anatomy/`.
Version pins: `mind-ar@1.2.5` with `three@0.160.0`. Phones need HTTPS (e.g. GitHub Pages) for the camera.
