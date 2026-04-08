"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PremiumContentCategory } from "@/lib/premium-content";

export type PremiumDepthTone = "default" | "longing" | "voice" | "perspective" | "symbol";

const TONE_TITLE: Record<PremiumDepthTone, string> = {
  default: "There is more beneath this",
  longing: "There is more to this moment",
  voice: "Hear this in their voice",
  perspective: "There is another perspective waiting",
  symbol: "A longer arc is waiting",
};

const TONE_CTA: Record<PremiumDepthTone, string> = {
  default: "Learn about depth",
  longing: "Stay with the depth",
  voice: "Follow the voice inward",
  perspective: "Hold another angle",
  symbol: "Follow the symbol further",
};

function toneFromCategory(category: PremiumContentCategory | undefined): PremiumDepthTone {
  switch (category) {
    case "alternate_pov_pass":
      return "perspective";
    case "extended_audio_narration":
    case "character_voice_monologue":
      return "voice";
    case "deep_symbolic_experience":
      return "symbol";
    case "premium_cinematic_pass":
      return "longing";
    default:
      return "default";
  }
}

export type PremiumDepthGateProps = {
  title?: string;
  children: ReactNode;
  /** Shown above the blurred region. */
  teaser?: ReactNode;
  /** One line revealed before the blur (fragment of deeper material). */
  previewLine?: string | null;
  className?: string;
  /** Softer membership invitation copy. */
  tone?: PremiumDepthTone;
  /** When set, picks title / CTA flavor from premium category. */
  category?: PremiumContentCategory;
  ctaLabel?: string;
};

/**
 * Graceful depth teaser — not a billing gate. Softens deeper material while
 * keeping membership invitation human.
 */
export function PremiumDepthGate({
  title,
  children,
  teaser,
  previewLine,
  className = "",
  tone = "default",
  category,
  ctaLabel,
}: PremiumDepthGateProps) {
  const resolvedTone = category ? toneFromCategory(category) : tone;
  const heading = title ?? TONE_TITLE[resolvedTone];
  const linkLabel = ctaLabel ?? TONE_CTA[resolvedTone];

  return (
    <section
      className={`relative overflow-hidden rounded-xl border border-amber-900/15 bg-stone-950/40 ${className}`}
    >
      <div className="relative px-6 py-8 sm:px-8">
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
          {heading}
        </p>
        {teaser ? <div className="mt-4 text-sm leading-relaxed text-stone-400">{teaser}</div> : null}
        {previewLine?.trim() ? (
          <p className="mt-4 font-serif text-sm italic leading-relaxed text-stone-300/90">
            {previewLine.trim()}
          </p>
        ) : null}
        <div className="relative mt-6">
          <div className="pointer-events-none max-h-[11rem] select-none blur-[3px] opacity-[0.42]">
            <div className="space-y-3 text-sm leading-relaxed text-stone-300">{children}</div>
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f0e0c] via-[#0f0e0c]/85 to-transparent"
            aria-hidden
          />
        </div>
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs leading-relaxed text-stone-500">
            Membership will open these chambers quietly—more voice, more perspective, more room to
            linger—when the work is ready.
          </p>
          <Link
            href="/membership"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-amber-900/35 px-5 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-amber-200/80 transition hover:border-amber-800/55 hover:text-amber-50"
          >
            {linkLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
