// useMediaPipePose.js
import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { assetPath } from './assetPath';

// Backup body-tracking source: uses this computer's built-in webcam and
// MediaPipe's PoseLandmarker (running locally via WASM) instead of a Kinect.
// The runtime (public/mediapipe/wasm) and model (public/models) are bundled
// with the app so this works without an internet connection.

// ── Calibration ─────────────────────────────────────────────────────────
// Assumes the webcam faces forward (horizontally) across the field, e.g.
// an open laptop sitting at one edge of the floor area, facing into it.
// These will likely need recalibrating for your specific camera placement —
// enable the camera preview (camera icon) to read live values while you
// stand at the edges of the floor area.

// Image X (left/right in frame, normalized 0.0-1.0) maps directly to
// field X (left/right).
export const camMinX = 0.15;
export const camMaxX = 0.85;

// Depth (field Y, near/far) is estimated from torso height — the normalized
// vertical distance between the shoulder midpoint and hip midpoint, which
// shrinks the farther you are from the camera. camNearTorso is the torso
// height at the near edge of the field (maps to field Y = 100); camFarTorso
// is the torso height at the far edge (maps to field Y = 0). The preview
// shows live torso-height readings to help set these.
export const camNearTorso = 0.35;
export const camFarTorso = 0.12;

// Maximum number of bodies to track.
const MAX_BODIES = 2;

// Pose landmark indices for left/right shoulder and hip, used to compute
// the body-center X position (hips) and torso height (shoulder-to-hip span).
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

const MIN_VISIBILITY = 0.5;

// EMA smoothing factor applied to tracked positions, in (0, 1]. Lower values
// are smoother but lag more behind real movement; 1 disables smoothing.
// Pose landmarks wobble slightly frame-to-frame even when standing still,
// which this irons out.
const POSITION_SMOOTHING = 0.25;

const WASM_PATH = assetPath('/mediapipe/wasm');
const MODEL_PATH = assetPath('/models/pose_landmarker_lite.task');

/**
 * Tracks body position via the webcam and calls onPositions([{x,y}, ...])
 * with an array of positions each frame, each axis clamped to 0–100, in
 * the same format as useKinectron. In single-person mode the array has one
 * element; in multi-person mode up to two.
 *
 * Positions are smoothed frame-to-frame (see POSITION_SMOOTHING) to reduce
 * jitter from the pose model.
 *
 * X comes from the hip midpoint's horizontal image position. Y (depth) is
 * estimated from torso height (see camNearTorso/camFarTorso above); a body
 * is skipped for a frame if its hips or shoulders aren't both visible.
 *
 * Also returns the live camera `stream` and `rawPositions` (unsmoothed,
 * normalized 0.0–1.0 image coordinates plus `shoulderY` and `torsoHeight`)
 * for rendering a calibration preview.
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

    // Previous frame's smoothed positions, by body index. Persists across
    // detectFrame calls within this effect run.
    let smoothedPositions = [];

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
          const leftShoulder = landmarks[LEFT_SHOULDER];
          const rightShoulder = landmarks[RIGHT_SHOULDER];

          if (
            leftHip.visibility < MIN_VISIBILITY || rightHip.visibility < MIN_VISIBILITY ||
            leftShoulder.visibility < MIN_VISIBILITY || rightShoulder.visibility < MIN_VISIBILITY
          ) continue;

          const hipX = (leftHip.x + rightHip.x) / 2;
          const hipY = (leftHip.y + rightHip.y) / 2;
          const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
          const torsoHeight = Math.abs(hipY - shoulderY);

          raw.push({ x: hipX, y: hipY, shoulderY, torsoHeight });

          const x = clamp(normalizeWebcamValue(hipX, camMinX, camMaxX) * 100, 0, 100);
          const y = clamp(normalizeWebcamValue(torsoHeight, camFarTorso, camNearTorso) * 100, 0, 100);

          positions.push({ x, y });
        }

        setRawPositions(raw);

        if (positions.length > 0) {
          smoothedPositions = positions.map((p, i) => {
            const prev = smoothedPositions[i];
            return prev
              ? {
                  x: prev.x + (p.x - prev.x) * POSITION_SMOOTHING,
                  y: prev.y + (p.y - prev.y) * POSITION_SMOOTHING,
                }
              : p;
          });
          onPositionsRef.current(smoothedPositions);
        }
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
 * @param {number} value - A normalized value derived from the camera image
 *   (e.g. an image coordinate or torso height), roughly in 0.0-1.0.
 * @param {number} min - Calibrated value corresponding to field position 0.
 * @param {number} max - Calibrated value corresponding to field position 100.
 * @return {number} normalized coordinate value in interval [0.0, 1.0] (when within bounds).
 */
function normalizeWebcamValue(value, min, max) {
  return (value - min) / (max - min);
}

// Constrains value to the [min, max] range, so tracked positions always stay
// within the field's boundaries even if someone stands past a calibrated
// near/far/left/right limit.
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
