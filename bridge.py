#!/usr/bin/env python3
"""
Mock bridge — no Azure Kinect hardware required.

Sends two Lissajous-path positions over ws://localhost:8765 so you can verify
the EchoField WebSocket connection and tracker dot without hardware.

Uses the same message format as the real C# bridge:
  { "type": "positions", "positions": [{ "x": 42.5, "y": 67.1 }] }

pip install websockets
python bridge.py
"""

import asyncio
import json
import math
import time
import websockets

clients: set = set()


async def handler(ws):
    clients.add(ws)
    print(f"[ws] connected  ({len(clients)} client(s))")
    try:
        await ws.wait_closed()
    finally:
        clients.discard(ws)
        print(f"[ws] disconnected ({len(clients)} client(s))")


async def send_loop():
    while True:
        t = time.monotonic()
        positions = [
            {
                "x": round(50 + 42 * math.sin(t * 0.15),        2),
                "y": round(50 + 38 * math.sin(t * 0.09 + 1.3),  2),
            },
            {
                "x": round(50 + 36 * math.sin(t * 0.11 + 2.1),  2),
                "y": round(50 + 40 * math.sin(t * 0.18 + 0.8),  2),
            },
        ]
        if clients:
            websockets.broadcast(clients, json.dumps({"type": "positions", "positions": positions}))
        await asyncio.sleep(0.05)   # ~20 fps


async def main():
    print("Mock Kinect bridge (no hardware)  →  ws://localhost:8765")
    print("Ctrl-C to stop\n")
    async with websockets.serve(handler, "localhost", 8765):
        await send_loop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopped.")
