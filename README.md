# EchoField Sonic Archive

An interactive spatial audio installation where sounds are mapped to a two-dimensional color field. Move through the field — with a cursor or a body tracked by a Microsoft Azure Kinect — to tune into layered audio memories like a radio.

Built with React + Vite.

---

## What it does

- Sounds are placed at positions in a 2D color field based on their emotional/tonal character
- Moving near a sound fades it in; moving away fades it out
- Multiple sounds can overlap and blend
- Descriptions and metadata appear when a sound is active
- Supports one or two people tracked simultaneously via Kinect
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
# Start with Kinect input enabled on load (true/false)
VITE_KINECT_ON=true

# Use simulated Kinect data for testing without hardware (true/false)
VITE_KINECT_SIMULATE=true

# Enable two-person mode — tracks up to two bodies simultaneously (true/false)
VITE_MULTI_PERSON=false
```

**Typical configurations:**

| Situation | Settings |
|---|---|
| Local development, no Kinect | `VITE_KINECT_ON=true`, `VITE_KINECT_SIMULATE=true` |
| Testing two-person mode | Add `VITE_MULTI_PERSON=true` |
| Live installation with Kinect | `VITE_KINECT_ON=true`, `VITE_KINECT_SIMULATE=false` |
| Mouse-only, no Kinect UI | `VITE_KINECT_ON=false` |

After editing `.env.local`, restart the dev server for changes to take effect.

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

## Two-person mode

When `VITE_MULTI_PERSON=true`:

- Up to two bodies are tracked simultaneously
- Each person independently activates their nearest sound
- If two people stand on the same sound, their gain contributions add together (louder)
- Two Kinect cursor dots appear on the field
- Both active sound descriptions are shown stacked vertically
- The simulation generates two independent wandering paths for testing

---

## Project structure

```
public/
  audio/          ← sound files served as static assets

src/
  App.jsx         ← main application, all UI components and audio engine
  colorWords.js   ← word-to-color dictionary for the algorithmic color picker
  samplePalettes.js ← pre-loaded palettes available in the Library
  soundLibrary.js ← manifest of available sounds for the participant picker
  useKinectron.js ← Kinect integration hook (real + simulated)
  main.jsx        ← React entry point
```

---

## Credits

Created by Jordan Wirfs-Brock. Built with [React](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), and [Kinectron](https://github.com/kinectron/kinectron).
