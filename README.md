# EchoField Sonic Archive

An interactive spatial audio installation where sounds are mapped to a two-dimensional color field. Move through the field — with a cursor or a body tracked by a Microsoft Azure Kinect or a webcam — to tune into layered audio memories like a radio.

Built with React + Vite.

---

## What it does

- Sounds are placed at positions in a 2D color field based on their emotional/tonal character
- Moving near a sound fades it in; moving away fades it out
- Multiple sounds can overlap and blend
- Descriptions and metadata appear when a sound is active
- Supports one or two people tracked simultaneously via a Kinect **or** a webcam (MediaPipe), toggleable in the UI
- Pre-loaded sample palettes are available in the Library; participants can also build their own from the shared sound library

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (included with Node.js)

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev
```

Then open `http://localhost:5173` in a browser.

### Build for production

```bash
npm run build
```

---

## Configuration — `.env.local`

Create a file called `.env.local` in the project root (it is git-ignored and never committed). This file controls runtime behaviour without changing any code.

```
# Which body-tracking source is active on load: 'kinect', 'webcam', or 'off'
VITE_TRACKING_SOURCE=kinect

# Use simulated Kinect data for testing without hardware (true/false)
VITE_KINECT_SIMULATE=true

# Use a simulated wandering path instead of the real webcam (true/false)
VITE_WEBCAM_SIMULATE=false

# Enable two-person mode — tracks up to two bodies simultaneously (true/false)
VITE_MULTI_PERSON=false
```

**Typical configurations:**

| Situation | Settings |
|---|---|
| Local development, no tracking hardware | `VITE_TRACKING_SOURCE=kinect`, `VITE_KINECT_SIMULATE=true` |
| Testing two-person mode | Add `VITE_MULTI_PERSON=true` |
| Live installation with Kinect | `VITE_TRACKING_SOURCE=kinect`, `VITE_KINECT_SIMULATE=false` |
| Live installation with webcam (Kinect backup) | `VITE_TRACKING_SOURCE=webcam` |
| Mouse-only, no body tracking | `VITE_TRACKING_SOURCE=off` |

After editing `.env.local`, restart the dev server for changes to take effect.

The Radio (Kinect) and Camera (webcam) icons in the bottom-right corner toggle between sources at runtime — clicking one disables the other. `VITE_TRACKING_SOURCE` just sets which is active on load.

> `VITE_KINECT_ON` from older `.env.local` files is still read as a fallback if `VITE_TRACKING_SOURCE` is unset (`true` → `kinect`, otherwise `off`).

---

## Kinect setup

EchoField uses [Kinectron 1.0](https://github.com/kinectron/kinectron) with a **Microsoft Azure Kinect** sensor.

### Requirements

- A Windows machine with the Azure Kinect sensor attached
- The Kinectron 1.0 server app running on that machine

### IP address

Set the Kinectron server IP in `src/App.jsx` near the top of the file:

```js
const KINECTRON_IP = '127.0.0.1'; // use 127.0.0.1 if Kinectron and EchoField are on the same machine
```

### Coordinate mapping

The installation assumes the display is **projected onto the floor**, with the Kinect mounted at the side:

- Body **Z** (depth, distance from Kinect) → field **X** axis
- Body **X** (left/right) → field **Y** axis

The camera bounds and field extents can be adjusted in `src/useKinectron.js`:

```js
var cameraMaxZ = 4000;  // millimeters
var cameraMinZ = 1300;
var cameraMinX = 0.30;  // depthX range (0.0–1.0)
var cameraMaxX = 0.65;
```

### Startup order

1. Start the Kinectron server app on the Windows machine
2. Open EchoField in a browser
3. Click the **Radio icon** (bottom right) to enable Kinect input

---

## Webcam setup (MediaPipe) — Kinect backup

If the Kinect/Kinectron setup is unavailable, EchoField can track body position using **this computer's built-in (or USB) webcam** via [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker), running fully locally in the browser (no internet connection required — the model and runtime are bundled in `public/`).

### Requirements

- A webcam (built-in laptop camera works)
- A browser that supports `getUserMedia` and WebAssembly (Chrome, Edge, Firefox, Safari)

### Enabling it

1. Open EchoField in a browser
2. Click the **Camera icon** (bottom right) to enable webcam tracking — this also opens a small calibration preview
3. Allow camera access when prompted

Only one tracking source is active at a time — enabling the webcam disables the Kinect, and vice versa.

### Coordinate mapping & calibration

Like the Kinect setup, this assumes the display is **projected onto the floor**, with the webcam mounted to one side with a view across the floor area (the same general placement as the Kinect).

- Camera image **Y** (up/down in frame) → field **X** axis (near/far — lower in frame = closer to the camera)
- Camera image **X** (left/right in frame) → field **Y** axis (left/right)

The tracked point is the midpoint between the left and right hip landmarks.

Calibration bounds are set in `src/useMediaPipePose.js`:

```js
// Image X (left/right in frame) -> field Y
export const camMinX = 0.15;
export const camMaxX = 0.85;

// Image Y (up/down in frame) -> field X (near/far)
export const camNearY = 0.95; // lower in frame = nearer the camera
export const camFarY = 0.30;  // higher in frame = farther from the camera
```

To calibrate for a room:

1. Enable webcam tracking (Camera icon) — the calibration preview opens automatically
2. Stand at each corner of the floor-projection area
3. Watch the green dot in the preview and adjust `camMinX`/`camMaxX`/`camNearY`/`camFarY` so the dashed rectangle matches the corners where people will stand
4. The **Crosshair icon** (bottom right, only visible while webcam tracking is active) toggles the calibration preview on/off at any time

A person is only reported as a tracked position while their hip-center falls inside the calibrated rectangle — standing outside it (e.g., off to the side, out of frame) produces no position, same as the Kinect's out-of-bounds behavior.

### Assets

The pose model and WASM runtime are bundled locally so the installation works offline:

- `public/models/pose_landmarker_lite.task` — pose detection model
- `public/mediapipe/wasm/` — MediaPipe WASM runtime

---

## Sound library

Audio files live in `public/audio/`. They are served as static files and referenced by path — no upload or backend required.

### Adding sounds

1. Drop the audio file into `public/audio/`
2. Add an entry to `src/soundLibrary.js`:

```js
{ fileName: 'your-file.wav', displayName: 'Your Display Name' },
```

That's it — the new sound will appear in the participant sound picker immediately.

Supported formats: anything the browser supports (`.mp3`, `.wav`, `.m4a`, `.ogg`).

---

## Sample palettes

Pre-loaded palettes are defined in `src/samplePalettes.js`. Each palette is an array of nodes:

```js
{
  id: 'unique-id',
  name: 'Palette Name',
  date: 'Sample',
  nodes: [
    {
      id: 'node-id',
      text: 'Poetic description shown when active',
      color: '#3b82f6',           // hex color — also determines visual position
      audioUrl: '/audio/file.wav', // path to file in public/audio/
      fileName: 'Display name',
      x: 22,                      // position in field (0–100)
      y: 35,
      date: 'Sample',
    },
    // ...
  ],
}
```

To add a new sample palette, append an object to the array in `samplePalettes.js` and restart the dev server.

---

## Souvenir links (view-only palettes)

Anyone who builds a palette can get a personal link back to it later — a
"souvenir" page showing **only** the explorable color field for that one
palette, with none of the creation, archive, or library controls. It works
with the mouse or, on a phone, by dragging a finger across the screen.

### The full flow

1. **Build** a palette in the studio. Once enough sounds are placed, a
   **"Complete & Archive"** button appears (top right).
2. Click **Complete & Archive** — this saves the palette into the Library
   (stored locally in the participant's browser, no server involved).
3. Open the **Library** (archive icon, bottom right) and click the
   **download icon** on that palette's card. This:
   - downloads a `<slug>.json` file (e.g. `midnight-rain-123456.json`) to
     the participant's computer/phone, and
   - copies a view link to the clipboard, e.g.
     `https://yoursite.example/?palette=midnight-rain-123456`.
4. **Publish it** — the link doesn't work until you (the site operator)
   take that downloaded file and add it to this repo:

   ```
   public/palettes/midnight-rain-123456.json
   ```

   then rebuild/redeploy (see **Deploying** below).

Until step 4 is done, visiting the link shows "This souvenir isn't ready
yet" rather than an error — so it's fine to hand someone their link right
away and publish the file later (e.g. in a batch).

### Souvenir file format

Same shape as a sample palette (see above):

```json
{
  "id": 1750000123456,
  "name": "Midnight Rain",
  "date": "6/14/2026",
  "nodes": [
    {
      "id": "1750000123456",
      "text": "Poetic description shown when active",
      "color": "#3b82f6",
      "audioUrl": "/audio/file.wav",
      "fileName": "Display name",
      "x": 22,
      "y": 35,
      "date": "6/14/2026"
    }
  ]
}
```

`audioUrl` paths point at files already in `public/audio/`.

---

## Deploying (GitHub Pages)

This is a static site — `npm run build` produces a `dist/` folder that can be
hosted anywhere. `base: './'` in `vite.config.js` makes all asset paths
relative, so the build works whether it's served from a domain root or a
subpath like `https://<user>.github.io/<repo>/`.

```bash
npm run deploy
```

This builds the app and pushes `dist/` to the `gh-pages` branch (via the
[`gh-pages`](https://www.npmjs.com/package/gh-pages) package). In the repo's
**Settings → Pages**, set the source to the `gh-pages` branch (run the
command once first so the branch exists).

There's no automatic deploy on push — run `npm run deploy` again any time you
want to publish updates, including after adding a new file to
`public/palettes/`. GitHub Pages can take a minute or two (longer with CDN
caching) to reflect a new deploy.

---

## Two-person mode

When `VITE_MULTI_PERSON=true`:

- Up to two bodies are tracked simultaneously (works with either Kinect or webcam tracking)
- Each person independently activates their nearest sound
- If two people stand on the same sound, their gain contributions add together (louder)
- Two tracking cursor dots appear on the field
- Both active sound descriptions are shown stacked vertically
- The simulation generates two independent wandering paths for testing

---

## Project structure

```
public/
  audio/          ← sound files served as static assets
  models/         ← bundled MediaPipe pose detection model
  mediapipe/wasm/ ← bundled MediaPipe WASM runtime
  palettes/       ← published souvenir palettes (<slug>.json), served at /?palette=<slug>

src/
  App.jsx           ← main application, all UI components, audio engine, and the standalone PaletteView (souvenir page)
  assetPath.js      ← resolves root-relative asset paths against the configured base URL
  colorWords.js     ← word-to-color dictionary for the algorithmic color picker
  samplePalettes.js ← pre-loaded palettes available in the Library
  soundLibrary.js   ← manifest of available sounds for the participant picker
  useKinectron.js   ← Kinect integration hook (real + simulated)
  useMediaPipePose.js ← webcam body-tracking hook (real + simulated)
  main.jsx          ← React entry point
```

---

## Credits

Created by Alice Chan, Jordan Wirfs-Brock, and William Bares. Built with [React](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [Kinectron](https://github.com/kinectron/kinectron), and [MediaPipe](https://developers.google.com/mediapipe), using Gemini and Claude Code.
