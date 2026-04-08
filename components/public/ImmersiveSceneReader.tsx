"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { splitReadingBlocks } from "@/lib/reading-blocks";
import type { ImmersiveTonePreset } from "@/lib/immersive-presets";
import { IMMERSIVE_TONE_PRESETS } from "@/lib/immersive-presets";
import {
  ReadingParagraph,
  type ReadingLinkEntity,
} from "@/components/public/linked-reading-blocks";
import type { ExperiencePerceptionSegment } from "@/lib/public-experience-rendering";

type Pacing = "slow" | "normal" | "fast";

const BLOCK_DELAY_MS: Record<Pacing, number> = {
  slow: 940,
  normal: 460,
  fast: 210,
};

const PERCEPTION_PACE: Record<Pacing, number> = {
  slow: 1.22,
  normal: 1,
  fast: 0.64,
};

export type ImmersiveSceneReaderProps = {
  text: string;
  entities: ReadingLinkEntity[];
  onEntityClick: (e: ReadingLinkEntity) => void;
  tonePreset: ImmersiveTonePreset;
  /** Subtle inset vignette for immersive / guided modes. */
  vignette?: boolean;
  /** When set, replaces paragraph-block splitting with perception-timed segments. */
  perceptionSegments?: ExperiencePerceptionSegment[] | null;
  /** 0–1 overall emotional pressure (slows/suspends pacing when high). */
  gravityOverall?: number;
};

function segmentShellClass(
  displayUnitType: ExperiencePerceptionSegment["displayUnitType"],
  blend: ExperiencePerceptionSegment["blend"],
  toneMuted: string,
): string {
  const base = "campti-immersive-block transition-opacity duration-700";
  const guided =
    blend === "guided_cue"
      ? `border-l border-stone-600/25 pl-4 sm:pl-5 ${toneMuted} text-[0.98em]`
      : "";
  switch (displayUnitType) {
    case "sensory":
      return `${base} opacity-[0.97] ${guided}`;
    case "bodily_response":
      return `${base} opacity-[0.94] tracking-[0.011em] ${guided}`;
    case "symbolic_charge":
      return `${base} opacity-[0.93] ${guided}`;
    case "unspoken_thought":
    case "partial_meaning":
    case "emotional_shift":
      return `${base} opacity-[0.91] ${guided}`;
    case "environmental_pressure":
    case "relationship_pressure":
      return `${base} opacity-[0.95] ${guided}`;
    case "continuation_impulse":
      return `${base} opacity-[0.88] ${guided}`;
    case "silence":
      return `${base} opacity-[0.35] ${guided}`;
    case "narrative_body":
    default:
      return `${base} opacity-100 ${guided}`;
  }
}

function spacingClass(displayUnitType: ExperiencePerceptionSegment["displayUnitType"]): string {
  if (displayUnitType === "narrative_body") return "mt-12";
  if (displayUnitType === "unspoken_thought" || displayUnitType === "partial_meaning") return "mt-11";
  if (displayUnitType === "silence") return "mt-10";
  return "mt-9";
}

export function ImmersiveSceneReader({
  text,
  entities,
  onEntityClick,
  tonePreset,
  vignette = false,
  perceptionSegments = null,
  gravityOverall = 0.35,
}: ImmersiveSceneReaderProps) {
  const blocks = useMemo(() => splitReadingBlocks(text), [text]);
  const t = IMMERSIVE_TONE_PRESETS[tonePreset];

  const usePerception = Boolean(perceptionSegments && perceptionSegments.length > 0);
  const revealList: string[] = usePerception
    ? perceptionSegments!.map((s) => s.text)
    : blocks;

  const [visibleCount, setVisibleCount] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pacing, setPacing] = useState<Pacing>("slow");

  useEffect(() => {
    setVisibleCount(1);
    setAutoPlay(false);
    setPaused(false);
    setPacing("slow");
  }, [text, perceptionSegments]);

  const delayForIndex = useCallback(
    (index: number): number => {
      if (!usePerception || !perceptionSegments) {
        return BLOCK_DELAY_MS[pacing];
      }
      const seg = perceptionSegments[index];
      if (!seg) return 520;
      const g = gravityOverall;
      let ms = seg.delayMs * PERCEPTION_PACE[pacing];
      ms *= 1 + g * 0.18 * (pacing === "slow" ? 1 : 0.55);
      if (seg.displayUnitType === "narrative_body") {
        ms *= 0.92 + (1 - g) * 0.12;
      }
      if (seg.isSilenceBeat) {
        ms += Math.round(320 * PERCEPTION_PACE[pacing]);
      }
      ms += seg.holdExtraMs * (pacing === "slow" ? 1 : 0.45);
      if (seg.isHold) ms += Math.round(280 * PERCEPTION_PACE[pacing]);
      return Math.max(120, Math.round(ms));
    },
    [usePerception, perceptionSegments, pacing, gravityOverall],
  );

  useEffect(() => {
    if (!autoPlay || paused) return;
    if (visibleCount >= revealList.length) return;
    const delay = delayForIndex(visibleCount - 1);
    const id = window.setTimeout(() => {
      setVisibleCount((n) => Math.min(n + 1, revealList.length));
    }, delay);
    return () => window.clearTimeout(id);
  }, [autoPlay, paused, visibleCount, revealList.length, delayForIndex]);

  const continueReveal = useCallback(() => {
    setVisibleCount((n) => Math.min(n + 1, revealList.length));
  }, [revealList.length]);

  const skipAll = useCallback(() => {
    setVisibleCount(revealList.length);
    setAutoPlay(false);
    setPaused(false);
  }, [revealList.length]);

  const paraClass =
    "font-serif text-[1.125rem] leading-[2.08] tracking-[0.012em] sm:text-[1.22rem] sm:leading-[2.14] " +
    t.text;
  const linkClass = `${t.accent} cursor-pointer border-stone-500/20 text-left`;

  if (!revealList.length) {
    return (
      <p className={`text-sm italic ${t.textMuted}`}>
        This passage is still gathering shape.
      </p>
    );
  }

  const visible = revealList.slice(0, visibleCount);

  return (
    <div
      className={`space-y-10 ${vignette ? "campti-immersive-vignette rounded-lg px-1 sm:px-2" : ""}`}
    >
      <div className="space-y-0">
        {visible.map((block, i) => {
          const seg = usePerception && perceptionSegments ? perceptionSegments[i] : undefined;
          const shell = seg
            ? segmentShellClass(seg.displayUnitType, seg.blend, t.textMuted)
            : "campti-immersive-block";
          const gap = seg ? spacingClass(seg.displayUnitType) : "";
          return (
            <div
              key={seg?.id ?? `${i}-${block.slice(0, 24)}`}
              className={`${shell} ${i > 0 ? gap : ""}`}
            >
              {seg?.isSilenceBeat ? (
                <div
                  className="min-h-[0.85rem] w-full select-none"
                  aria-hidden
                  role="presentation"
                />
              ) : (
                <ReadingParagraph
                  block={block}
                  entities={entities}
                  onEntityClick={onEntityClick}
                  paragraphClassName={paraClass}
                  entityLinkClassName={linkClass}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`flex flex-col gap-4 border-t pt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${tonePreset === "neutral" ? "border-stone-800/80" : "border-stone-700/40"}`}
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={continueReveal}
            disabled={visibleCount >= revealList.length}
            className="rounded border border-stone-600/80 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-stone-300 transition enabled:hover:border-stone-500 enabled:hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              setAutoPlay((a) => !a);
              setPaused(false);
            }}
            className="rounded border border-stone-600/80 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
          >
            {autoPlay ? "Pause auto" : "Auto"}
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            disabled={!autoPlay}
            className="rounded border border-stone-600/80 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-stone-300 transition enabled:hover:border-stone-500 enabled:hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {paused ? "Resume" : "Hold"}
          </button>
          <button
            type="button"
            onClick={skipAll}
            className="rounded border border-stone-600/80 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
          >
            Reveal all
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[0.65rem] uppercase tracking-[0.2em] ${t.textMuted}`}>
            Rhythm
          </span>
          {(["slow", "normal", "fast"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPacing(p)}
              className={`rounded px-2 py-1 text-xs capitalize transition ${
                pacing === p
                  ? "bg-stone-700/50 text-stone-100"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
