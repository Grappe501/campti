"use client";

import type { ImmersiveTonePreset } from "@/lib/immersive-presets";
import { IMMERSIVE_TONE_PRESETS } from "@/lib/immersive-presets";

type AtmosphereLayerProps = {
  preset: ImmersiveTonePreset;
  /** Very subtle animated grain (CSS-only drift). */
  grain?: boolean;
  className?: string;
};

/**
 * Full-bleed background stack: gradient + soft vignette + optional grain.
 * Restrained motion via long CSS transitions only.
 */
export function AtmosphereLayer({ preset, grain = true, className = "" }: AtmosphereLayerProps) {
  const t = IMMERSIVE_TONE_PRESETS[preset];

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[5] overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className={`absolute inset-0 bg-gradient-to-b ${t.background} transition-[background] duration-[2.5s] ease-out`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t ${t.overlay} via-transparent to-black/20`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />
      {grain ? (
        <div
          className="campti-atmosphere-grain absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      ) : null}
    </div>
  );
}
