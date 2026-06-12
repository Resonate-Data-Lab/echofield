#!/usr/bin/env python3
"""
Azure Kinect → EchoField WebSocket bridge
Listens on ws://localhost:8765

Reads joint 0 (pelvis) from the body tracker each frame, normalizes the
position to 0–100, and broadcasts:
  { "bodies": [ { "x": 45.2, "y": 67.3 }, ... ] }

Physical setup:
  Kinect at center-left, facing along the display +X axis (floor projection).
  cameraZ (sensor depth, mm)     → display X axis
  depth image X (normalized 0–1) → display Y axis

Requirements (Windows):
  pip install pyk4a websockets
  Azure Kinect SDK       — https://github.com/microsoft/Azure-Kinect-Sensor-SDK/releases
  Body Tracking SDK      — https://github.com/microsoft/Azure-Kinect-Body-Tracking/releases
  (Both must be installed; their DLLs must be on PATH or in the same folder.)

Run:
  python bridge.py
"""

import asyncio
import json
import sys

import websockets
from pyk4a import CalibrationType, ColorResolution, Config, DepthMode, PyK4A
from pyk4a.body import PyK4ABodyTracker

# ── Calibration — tune these to match your room/projection area ───────────────

CAMERA_Z_MIN = 1300   # mm — near edge of tracked zone  → display x = 0
CAMERA_Z_MAX = 4000   # mm — far edge of tracked zone   → display x = 100

DEPTH_X_MIN  = 0.30   # normalized depth-image X — left edge  → display y = 0
DEPTH_X_MAX  = 0.65   # normalized depth-image X — right edge → display y = 100

DEPTH_IMG_W  = 640    # depth image width in pixels (NFOV_UNBINNED mode)
MAX_BODIES   = 2      # match VITE_MULTI_PERSON setting

# ─────────────────────────────────────────────────────────────────────────────


def normalize(val, lo, hi):
    return max(0.0, min(100.0, (val - lo) / (hi - lo) * 100.0))


def extract_bodies(body_frame, calibration):
    bodies = []
    n = min(body_frame.get_num_bodies(), MAX_BODIES)
    for i in range(n):
        try:
            skeleton = body_frame.get_body_skeleton(i)
            joint    = skeleton.joints[0]       # K4ABT_JOINT_PELVIS

            # Camera-space position in mm.
            # pyk4a exposes k4a_float3_t as a sequence: (x, y, z)
            cx, cy, cz = joint.position.v

            # Project 3-D joint to depth-image pixel for normalized X.
            px, _py = calibration.convert_3d_to_2d(
                (cx, cy, cz),
                source=CalibrationType.DEPTH,
                target=CalibrationType.DEPTH,
            )
            depth_x = px / DEPTH_IMG_W

            x = normalize(cz,      CAMERA_Z_MIN, CAMERA_Z_MAX)
            y = normalize(depth_x, DEPTH_X_MIN,  DEPTH_X_MAX)

            bodies.append({"x": round(x, 2), "y": round(y, 2)})

        except Exception as e:
            print(f"  body {i} skipped: {e}", file=sys.stderr)

    return bodies


# ── Shared WebSocket client set ───────────────────────────────────────────────

_clients: set = set()


async def ws_handler(websocket):
    _clients.add(websocket)
    print(f"[ws] browser connected  ({len(_clients)} client(s))")
    try:
        await websocket.wait_closed()
    finally:
        _clients.discard(websocket)
        print(f"[ws] browser disconnected ({len(_clients)} client(s))")


# ── Kinect capture loop (runs blocking SDK calls in a thread) ─────────────────

async def kinect_loop():
    loop = asyncio.get_running_loop()

    device = PyK4A(Config(
        color_resolution=ColorResolution.OFF,   # colour not needed; saves bandwidth
        depth_mode=DepthMode.NFOV_UNBINNED,
    ))
    device.start()
    calibration = device.calibration

    tracker = PyK4ABodyTracker()
    tracker.start()
    print("[kinect] started — waiting for bodies …")

    def one_frame():
        capture    = device.get_capture()
        tracker.enqueue_capture(capture)
        body_frame = tracker.pop_result()
        return extract_bodies(body_frame, calibration)

    try:
        while True:
            bodies = await loop.run_in_executor(None, one_frame)
            if _clients:
                msg = json.dumps({"bodies": bodies})
                websockets.broadcast(_clients, msg)
    finally:
        print("[kinect] stopping")
        tracker.stop()
        device.stop()


# ── Entry point ───────────────────────────────────────────────────────────────

async def main():
    print("Azure Kinect bridge → ws://localhost:8765")
    print("Ctrl-C to stop\n")
    async with websockets.serve(ws_handler, "localhost", 8765):
        await kinect_loop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopped.")
