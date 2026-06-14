// useMediaPipePose.js
import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { assetPath } from './assetPath';

// Backup body-tracking source: uses this computer's built-in webcam and
// MediaPipe's PoseLandmarker (running locally via WASM) instead of a Kinect.
// The runtime (public/mediapipe/wasm) and model (public/models) are bundled
// with the app so this works without an internet connection.

// ── Calibration ─────────────────────────────────────────────────────────
// Assumes the webcam is mounted with a view across the floor-projection
// area, the same way the Kinect was mounted at the side of the floor.
// Values below are normalized camera-image coordinates (0.0–1.0), where
// (0,0) is the top-left corner of the frame and (1,1) is bottom-right.
//
// To calibrate: enable the camera preview (camera icon), stand at the
// edges of the projected floor area, and read the tracking dot's position
// in the preview to set these bounds for your room.

// Image X (left/right in frame) maps to field Y (left/right),
// matching the Kinect's depthX -> Y mapping.
export const camMinX = 0.15;
export const camMaxX = 0.85;

// Image Y (up/down in frame) maps to field X (near/far),
// matching the Kinect's depth -> X mapping.
// Lower in frame (larger Y) = nearer the camera.
export const camNearY = 0.95;
export const camFarY = 0.30;

// Maximum number of bodies to track.
const MAX_BODIES = 2;

// Pose landmark indices for left/right hip (used as body-center point).
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const MIN_VISIBILITY = 0.5;

const WASM_PATH = assetPath('/mediapipe/wasm');
const MODEL_PATH = assetPath('/models/pose_landmarker_lite.task');

/**
 * Tracks body position via the webcam and calls onPositions([{x,y}, ...])
 * with an array of normalized 0–100 positions each frame, in the same
 * format as useKinectron. In single-person mode the array has one element;
 * in multi-person mode up to two.
 *
 * Also returns the live camera `stream` and `rawPositions` (normalized
 * 0.0–1.0 image coordinates) for rendering a calibration preview.
 */
export function useMediaPipePose({ enabled, simulate, multiPerson, onPositions }) {
  const [stream, setStream] = useState(null);
  const [rawPositions, setRawPositions] = useState([]);
  const [error, setError] = useState(null);

  // Always keep a current ref to onPositions so the detection loop never
  // goes stale when the callback changes (e.g. after loading a new palette).
  const onPositionsRef = useRef(onPositions);
  useEffect(() => { onPositionsRef.current = onPositions; }, [onPositions]);

  // ── Simulation ────────────────────────────────────────────────────────
  // Mirrors useKinectron's simulation: a slow Lissajous path per person.
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

  // ── Real webcam + pose detection ─────────────────────────────────────
  useEffect(() => {
    if (!enabled || simulate) return;

    let cancelled = false;
    let rafId = null;
    let lastVideoTime = -1;
    let landmarker = null;
    let mediaStream = null;

    // Off-screen video element used as the detection source. Kept out of
    // normal layout (not display:none) so browsers keep decoding frames.
    const video = document.createElement('video');
    video.playsInline = true;
    video.muted = true;
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    document.body.appendChild(video);

    const detectFrame = () => {
      if (cancelled) return;

      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        const maxBodies = multiPerson ? MAX_BODIES : 1;
        const positions = [];
        const raw = [];

        for (let i = 0; i < Math.min(result.landmarks.length, maxBodies); i++) {
          const landmarks = result.landmarks[i];
          const leftHip = landmarks[LEFT_HIP];
          const rightHip = landmarks[RIGHT_HIP];
          if (leftHip.visibility < MIN_VISIBILITY || rightHip.visibility < MIN_VISIBILITY) continue;

          const imgX = (leftHip.x + rightHip.x) / 2;
          const imgY = (leftHip.y + rightHip.y) / 2;
          raw.push({ x: imgX, y: imgY });

          const y = normalizeWebcamValue(imgX, camMinX, camMaxX) * 100;
          const x = normalizeWebcamValue(imgY, camNearY, camFarY) * 100;

          if (x >= 0 && x <= 100 && y >= 0 && y <= 100) positions.push({ x, y });
        }

        setRawPositions(raw);
        if (positions.length > 0) onPositionsRef.current(positions);
      }

      rafId = requestAnimationFrame(detectFrame);
    };

    (async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) { mediaStream.getTracks().forEach((t) => t.stop()); return; }
        setStream(mediaStream);
        video.srcObject = mediaStream;
        await video.play();

        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        const numPoses = multiPerson ? MAX_BODIES : 1;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numPoses,
          });
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses,
          });
        }

        if (cancelled) { landmarker.close(); return; }
        setError(null);
        detectFrame();
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to start webcam tracking');
      }
    })();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (landmarker) { try { landmarker.close(); } catch { /* already closed */ } }
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
      video.remove();
      setStream(null);
      setRawPositions([]);
    };
  }, [enabled, simulate, multiPerson]);

  return { stream, rawPositions, error };
}

/*
 * normalizeWebcamValue
 * @param {number} value - One normalized image coordinate (0.0-1.0) from the camera.
 * @param {number} min - Calibrated value corresponding to field position 0.
 * @param {number} max - Calibrated value corresponding to field position 100.
 * @return {number} normalized coordinate value in interval [0.0, 1.0] (when within bounds).
 */
function normalizeWebcamValue(value, min, max) {
  return (value - min) / (max - min);
}
