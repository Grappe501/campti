/**
 * Smoothed gaze → left/right edge dwell → actions.
 * Uses a moving average, horizontal hysteresis, and cooldowns to reduce jitter.
 */

export type GazeEdge = "left" | "right" | "none";

export type GazeEdgeControllerOptions = {
  /** Fraction of viewport width for active edge zones (each side). */
  edgeFraction: number;
  /** Pixels: zone must shrink by this much before we consider the gaze "left" the edge. */
  hysteresisPx: number;
  /** Samples for simple moving average of gaze x/y. */
  smoothWindow: number;
  dwellMs: number;
  cooldownMs: number;
};

const DEFAULT_OPTS: GazeEdgeControllerOptions = {
  edgeFraction: 0.12,
  hysteresisPx: 18,
  smoothWindow: 6,
  dwellMs: 950,
  cooldownMs: 1500,
};

type Sample = { x: number; y: number };

function mean(samples: Sample[]): Sample {
  if (!samples.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const s of samples) {
    sx += s.x;
    sy += s.y;
  }
  const n = samples.length;
  return { x: sx / n, y: sy / n };
}

/**
 * Classify gaze x with hysteresis: once inside an edge, must move past inner boundary to exit.
 */
function classifyEdge(
  x: number,
  width: number,
  opts: GazeEdgeControllerOptions,
  prev: GazeEdge,
): GazeEdge {
  const ef = opts.edgeFraction;
  const h = opts.hysteresisPx;
  const outerLeft = width * ef;
  const outerRight = width * (1 - ef);
  const innerLeft = outerLeft + h;
  const innerRight = outerRight - h;

  if (prev === "left") {
    if (x > innerLeft) return "none";
    return "left";
  }
  if (prev === "right") {
    if (x < innerRight) return "none";
    return "right";
  }
  if (x < outerLeft) return "left";
  if (x > outerRight) return "right";
  return "none";
}

export type GazeEdgeController = {
  reset(): void;
  /** Call from WebGazer gaze listener with raw screen coordinates. */
  pushSample(x: number, y: number, now: number): {
    fired: "left" | "right" | null;
    zone: GazeEdge;
    dwellProgress: number;
  };
};

export function createGazeEdgeController(
  optsPartial?: Partial<GazeEdgeControllerOptions>,
): GazeEdgeController {
  const opts = { ...DEFAULT_OPTS, ...optsPartial };
  const buf: Sample[] = [];
  let logicalZone: GazeEdge = "none";
  let dwellStart: number | null = null;
  let lastFire = 0;

  return {
    reset() {
      buf.length = 0;
      logicalZone = "none";
      dwellStart = null;
      lastFire = 0;
    },
    pushSample(x, y, now) {
      buf.push({ x, y });
      while (buf.length > opts.smoothWindow) buf.shift();
      const { x: sx } = mean(buf);
      const w = Math.max(320, typeof window !== "undefined" ? window.innerWidth : 1200);
      const zone = classifyEdge(sx, w, opts, logicalZone);

      if (zone !== logicalZone) {
        logicalZone = zone;
        dwellStart = zone === "none" ? null : now;
      }

      let dwellProgress = 0;
      if (logicalZone !== "none" && dwellStart != null && now - lastFire >= opts.cooldownMs) {
        dwellProgress = Math.min(1, (now - dwellStart) / opts.dwellMs);
      }

      let fired: "left" | "right" | null = null;
      if (
        logicalZone !== "none" &&
        dwellStart != null &&
        now - lastFire >= opts.cooldownMs &&
        now - dwellStart >= opts.dwellMs
      ) {
        fired = logicalZone === "left" ? "left" : "right";
        lastFire = now;
        dwellStart = null;
        logicalZone = "none";
      }

      return { fired, zone: logicalZone, dwellProgress };
    },
  };
}
