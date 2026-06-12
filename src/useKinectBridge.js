// useKinectBridge.js
import { useEffect, useRef } from 'react';

// Connects to a custom Azure Kinect WebSocket bridge.
// All calibration/normalization lives in the bridge, not here.
// x, y values are pre-normalized to 0–100 by the bridge.
//
// Accepts both message formats:
//   { "type": "positions", "positions": [{ "x": 45.2, "y": 67.3 }] }  ← C# bridge
//   { "bodies":            [{ "x": 45.2, "y": 67.3 }] }               ← legacy

const MAX_BODIES = 2;
const RECONNECT_DELAY_MS = 2000;

export function useKinectBridge({ url, enabled, simulate, multiPerson, onPositions }) {
  const wsRef = useRef(null);
  const onPositionsRef = useRef(onPositions);
  useEffect(() => { onPositionsRef.current = onPositions; }, [onPositions]);

  // ── Simulation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !simulate) return;

    const interval = setInterval(() => {
      const t = Date.now() / 1000;
      const positions = [
        {
          x: 50 + 42 * Math.sin(t * 0.15),
          y: 50 + 38 * Math.sin(t * 0.09 + 1.3),
        },
      ];
      if (multiPerson) {
        positions.push({
          x: 50 + 36 * Math.sin(t * 0.11 + 2.1),
          y: 50 + 40 * Math.sin(t * 0.18 + 0.8),
        });
      }
      onPositionsRef.current(positions);
    }, 50);

    return () => clearInterval(interval);
  }, [enabled, simulate, multiPerson]);

  // ── Real Kinect via WebSocket bridge ─────────────────────────────────────
  useEffect(() => {
    if (!enabled || simulate) return;

    let stopped = false;
    let reconnectTimeout = null;

    function connect() {
      if (stopped) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Azure Kinect bridge at', url);
      };

      ws.onmessage = (event) => {
        let frame;
        try {
          frame = JSON.parse(event.data);
        } catch {
          return;
        }

        // Support both { type:"positions", positions:[…] } and { bodies:[…] }
        const list = (frame.type === 'positions' ? frame.positions : null)
                  ?? frame.bodies
                  ?? [];

        if (list.length === 0) return;

        const maxBodies = multiPerson ? MAX_BODIES : 1;
        const positions = [];

        for (let i = 0; i < Math.min(list.length, maxBodies); i++) {
          const { x, y } = list[i];
          if (x >= 0 && x <= 100 && y >= 0 && y <= 100)
            positions.push({ x, y });
        }

        if (positions.length > 0)
          onPositionsRef.current(positions);
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!stopped) {
          console.log('Bridge disconnected — retrying in 2s');
          reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, enabled, simulate, multiPerson]); // eslint-disable-line react-hooks/exhaustive-deps
}
