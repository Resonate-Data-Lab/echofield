import { useEffect, useRef } from 'react';
import Kinectron from 'kinectron-client';

// Depth range (meters) reported by Kinect v2.
// Adjust these if your installation space is larger/smaller.
const CAMERA_MIN_Z = 1.5;
const CAMERA_MAX_Z = 4.5;

/**
 * Connects to a Kinectron server and calls onPosition(xPct, yPct)
 * with normalized 0–100 values each time a body is tracked.
 *
 * X maps hip left-right (depthX, already 0–1 from Kinectron).
 * Y maps hip depth — closer to Kinect = lower Y value (top of field),
 * farther away = higher Y value (bottom of field). Flip the y line
 * below if your installation needs the opposite orientation.
 *
 * Uses the kinectron-client npm package (already installed).
 */
export function useKinectron({ ip, enabled, simulate, onPosition }) {
  const instanceRef = useRef(null);

  // Always keep a current ref to onPosition so intervals never go stale
  // when the callback changes (e.g. after loading a new palette).
  const onPositionRef = useRef(onPosition);
  useEffect(() => { onPositionRef.current = onPosition; }, [onPosition]);

  // Simulated body: two sine waves at different frequencies trace a
  // Lissajous-like path that wanders through most of the field.
  useEffect(() => {
    if (!enabled || !simulate) return;

    const interval = setInterval(() => {
      const t = Date.now() / 1000;
      const x = 50 + 42 * Math.sin(t * 0.31);
      const y = 50 + 38 * Math.sin(t * 0.19 + 1.3);
      onPositionRef.current(x, y);
    }, 50); // ~20fps, matching typical Kinect body frame rate

    return () => clearInterval(interval);
  }, [enabled, simulate]);

  useEffect(() => {
    if (!enabled || simulate) return;

    const kinectron = new Kinectron(ip);
    instanceRef.current = kinectron;

    kinectron.makeConnection();
    kinectron.startTrackedBodies((body) => {
      const rawX = body.joints[0].depthX;
      const rawZ = body.joints[0].cameraZ;

      const x = Math.max(0, Math.min(100, rawX * 100));
      const y = Math.max(0, Math.min(100,
        ((rawZ - CAMERA_MIN_Z) / (CAMERA_MAX_Z - CAMERA_MIN_Z)) * 100
      ));

      onPosition(x, y);
    });

    return () => {
      if (instanceRef.current) {
        try { instanceRef.current.stopAll(); } catch (e) {}
        instanceRef.current = null;
      }
    };
  // onPosition is intentionally excluded — it's stable via useCallback
  // and we don't want to reconnect on every render.
  }, [ip, enabled, simulate]); // eslint-disable-line react-hooks/exhaustive-deps
}
