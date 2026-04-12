"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const SPLASH_SESSION_KEY = "campti-landing-splash-seen";

type Props = {
  children: React.ReactNode;
  /** Splash duration in ms */
  dwellMs?: number;
};

/**
 * Full-viewport CAMPTI mark; fades out to reveal children.
 * Once per browser session (sessionStorage) to avoid repeat annoyance when navigating home.
 */
export function CamptiLandingSplash({ children, dwellMs = 2000 }: Props) {
  const [phase, setPhase] = useState<"splash" | "out" | "done">("splash");
  const [reducedMotion, setReducedMotion] = useState(false);

  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_SESSION_KEY) === "1") {
        setPhase("done");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (phase !== "splash") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const dwell = mq.matches ? 0 : dwellMs;
    const t = window.setTimeout(() => setPhase("out"), dwell);
    return () => window.clearTimeout(t);
  }, [dwellMs, phase]);

  useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => {
      setPhase("done");
      try {
        sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
    }, reducedMotion ? 0 : 720);
    return () => window.clearTimeout(t);
  }, [phase, reducedMotion]);

  const showOverlay = phase === "splash" || phase === "out";

  return (
    <div className="relative min-h-screen">
      {children}
      {showOverlay ? (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0908] transition-[opacity,visibility] duration-[720ms] ease-out ${
            phase === "out" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-hidden={phase === "out"}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />
          <p className="text-[0.55rem] font-medium uppercase tracking-[0.55em] text-cyan-500/50">
            Narrative flight deck
          </p>
          <h1
            className="mt-6 select-none font-serif text-[clamp(3.5rem,14vw,11rem)] font-light leading-none tracking-[0.02em] text-stone-100"
            style={{
              textShadow:
                "0 0 80px rgba(34, 211, 238, 0.12), 0 0 120px rgba(251, 191, 36, 0.06)",
            }}
          >
            CAMPTI
          </h1>
          <p className="mt-8 max-w-sm text-center text-[0.65rem] uppercase tracking-[0.35em] text-stone-600">
            Landing
          </p>
        </div>
      ) : null}
    </div>
  );
}
