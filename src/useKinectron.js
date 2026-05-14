// useKinectron.js
import { useEffect, useRef } from 'react';
import Kinectron from 'kinectron-client';

// Requires Kinectron Version 1.0 and a Microsoft Azure Kinect sensor device.

// Define mininum-to-maximum extents along coordinate axes.
// This demo assumes that the display is projected onto the floor.
// Azure Kinect is at the center left side of the floor-projected image
// and faces along the direction of the window's +X axis.
// Body x-coordinate maps to window y-coordinate.
// Body z-coordinate maps to window x-coordinate.

// Azure Kinect reports cameraZ in millimeters.
var cameraMaxZ = 4000;
var cameraMinZ = 1300;
// Azure Kinect reports depthX in range 0.0 to 1.0.
// Mark left and right extents of projected floor region.
var cameraMinX = 0.30;
var cameraMaxX = 0.65;

// Maximum number of bodies to track.
const MAX_BODIES = 2;

/**
 * Connects to a Kinectron 1.0 server and calls onPositions([{x,y}, ...])
 * with an array of normalized 0–100 positions each frame.
 * In single-person mode the array has one element; in multi-person mode up to two.
 *
 * Uses the kinectron-client npm package (already installed).
 */
export function useKinectron({ ip, enabled, simulate, multiPerson, onPositions }) {
  const instanceRef = useRef(null);

  // Always keep a current ref to onPositions so intervals never go stale
  // when the callback changes (e.g. after loading a new palette).
  const onPositionsRef = useRef(onPositions);
  useEffect(() => { onPositionsRef.current = onPositions; }, [onPositions]);

  // ── Simulation ────────────────────────────────────────────────────────────
  // Person 1: slow Lissajous path
  // Person 2 (multi-person only): different frequencies and phase offset
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
    }, 50); // ~20fps, matching typical Kinect body frame rate

    return () => clearInterval(interval);
  }, [enabled, simulate, multiPerson]);

  // ── Real Kinect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || simulate) return;

    const kinectron = new Kinectron(ip);
    instanceRef.current = kinectron;

    kinectron.on('ready', () => {
      console.log('Connected to Kinectron server');
    });

    // Connect to the Kinectron 1.0 server program.
    kinectron.peer.connect();

    // Start the body tracking stream
    kinectron.startBodies((bodyFrame) => {
      if (bodyFrame.bodies.length > 0) {
        const maxBodies = multiPerson ? MAX_BODIES : 1;
        const positions = [];

        for (let i = 0; i < Math.min(bodyFrame.bodies.length, maxBodies); i++) {
          let body = bodyFrame.bodies[i];
          let joints = body.skeleton.joints;
          let jointIndex = 0;

          const y = normalizeKinectValue(joints[jointIndex].depthX, cameraMinX, cameraMaxX) * 100;
          const x = normalizeKinectValue(joints[jointIndex].cameraZ, cameraMinZ, cameraMaxZ) * 100;

          if (x >= 0 && x <= 100 && y >= 0 && y <= 100)
            positions.push({ x, y });
        }

        if (positions.length > 0)
          onPositionsRef.current(positions);
      }
    });

    return () => {
      if (instanceRef.current) {
        try { instanceRef.current.stopAll(); } catch (e) {}
        instanceRef.current = null;
      }
    };
  }, [ip, enabled, simulate, multiPerson]); // eslint-disable-line react-hooks/exhaustive-deps
}

/*
 * normalizeKinectValue
 * @param {number} value - One coordinate value from the Kinect camera.
 * @param {number} min - Minimum value along one axis direction.
 * @param {number} max - Maximum value along one axis direction.
 * @return {number} normalized coordinate value in interval [0.0, 1.0].
 */
function normalizeKinectValue(value, min, max) {
  return (value - min) / (max - min);
}
