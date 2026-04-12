import type { GazeData } from "@/lib/hands-free/webgazer-types";

/** Narrow surface we use from WebGazer.js runtime (GPL-3.0), loaded from CDN (not bundled). */
export type WebGazerHandle = {
  begin(onFail?: () => void): Promise<unknown>;
  end(): unknown;
  clearGazeListener(): unknown;
  setGazeListener(listener: (data: GazeData, elapsedTime: number) => void): unknown;
  showVideoPreview(val: boolean): unknown;
  showVideo(val: boolean): unknown;
  showFaceOverlay(val: boolean): unknown;
  showFaceFeedbackBox(val: boolean): unknown;
  detectCompatibility(): boolean;
};

declare global {
  interface Window {
    webgazer?: WebGazerHandle;
  }
}

const WEBGAZER_SCRIPT = "https://cdn.jsdelivr.net/npm/webgazer@3.5.3/dist/webgazer.js";

let loadPromise: Promise<WebGazerHandle> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-campti-webgazer="1"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("WebGazer script failed")), {
        once: true,
      });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.camptiWebgazer = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load WebGazer script"));
    document.head.appendChild(s);
  });
}

/**
 * Load WebGazer from jsDelivr at runtime so Next.js does not bundle TensorFlow/MediaPipe
 * (Turbopack cannot resolve those graph edges cleanly).
 */
export async function loadWebGazer(): Promise<WebGazerHandle> {
  if (typeof window === "undefined") {
    throw new Error("WebGazer is browser-only");
  }
  if (window.webgazer) {
    return window.webgazer;
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      await injectScript(WEBGAZER_SCRIPT);
      for (let i = 0; i < 50; i++) {
        const wg = window.webgazer;
        if (wg) return wg;
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error("WebGazer loaded but window.webgazer is missing (timeout)");
    })();
  }
  return loadPromise;
}
