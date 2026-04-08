"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AudioCueBundle } from "@/lib/audio-cue-map";
import type { PublicAudioSyncSegment } from "@/lib/public-data";

export type PublicAudioTab = {
  id: string;
  label: string;
  src: string;
  transcript?: string | null;
  /** Segment-level sync for listen / read-with-voice. */
  syncSegments?: PublicAudioSyncSegment[] | null;
};

export type PublicAudioPlayerProps = {
  /** When missing and no tabs, the player renders nothing. */
  src?: string | null;
  /** Multiple mixes (e.g. narration + ambient). */
  tabs?: PublicAudioTab[];
  title?: string;
  /** Chapter / scene line under the title. */
  contextLine?: string | null;
  /** Anchor id for in-page links (e.g. “Listen” CTA). Omit when multiple players on a page. */
  domId?: string | null;
  loop?: boolean;
  className?: string;
  /** Target volume after fade-in (0–1). */
  initialVolume?: number;
  fadeMs?: number;
  /** Optional perception-layer hints for future cadence / ambient coordination. */
  experienceCueHints?: AudioCueBundle | null;
  /** Emotional attachment line (Phase 10E). */
  voiceLead?: string;
  /** Short excerpt shown before full transcript (preview). */
  excerptPreview?: string | null;
  /** Report listening time for attachment / premium signals (e.g. POV character). */
  onListenDelta?: (deltaSeconds: number) => void;
};

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function pickActiveSyncIndex(
  currentSec: number,
  durationSec: number,
  ordered: PublicAudioSyncSegment[],
): number {
  if (!ordered.length) return -1;
  const tMs = currentSec * 1000;
  for (let i = ordered.length - 1; i >= 0; i--) {
    const s = ordered[i]!;
    const start = s.startTimeMs;
    if (start != null && start <= tMs) {
      const next = ordered[i + 1];
      const end =
        s.endTimeMs ??
        (next?.startTimeMs != null ? next.startTimeMs : durationSec > 0 ? durationSec * 1000 : null);
      if (end == null || tMs < end) return i;
    }
  }
  if (durationSec > 0 && ordered.length > 0) {
    const slice = durationSec / ordered.length;
    return Math.min(ordered.length - 1, Math.max(0, Math.floor(currentSec / slice)));
  }
  return 0;
}

/**
 * HTML5 audio with optional tabs (narration vs ambient), transcript reveal,
 * and gentle fade on play/pause. Requires a user gesture to start playback.
 */
export function PublicAudioPlayer({
  src,
  tabs,
  title,
  contextLine,
  domId = "scene-audio",
  loop = false,
  className = "",
  initialVolume = 0.72,
  fadeMs = 880,
  experienceCueHints = null,
  voiceLead = "This moment has a voice",
  excerptPreview = null,
  onListenDelta,
}: PublicAudioPlayerProps) {
  /** `null` suppresses the anchor (use when multiple players exist on one page). */
  const anchorId = domId === null || domId === "" ? undefined : domId;
  const normalizedTabs: PublicAudioTab[] =
    tabs && tabs.length > 0
      ? tabs.filter((t) => t.src?.trim())
      : src?.trim()
        ? [{ id: "default", label: "Play", src: src.trim() }]
        : [];

  const [activeIdx, setActiveIdx] = useState(0);
  const active = normalizedTabs[activeIdx] ?? normalizedTabs[0];
  const activeSrc = active?.src ?? "";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const targetVolRef = useRef(initialVolume);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [vol, setVol] = useState(initialVolume);
  const [showTranscript, setShowTranscript] = useState(false);

  const syncSegments = useMemo(() => {
    const segs = active?.syncSegments;
    return segs?.length ? [...segs].sort((a, b) => a.segmentOrder - b.segmentOrder) : null;
  }, [active]);

  const activeSyncIdx =
    syncSegments && (duration > 0 || syncSegments.length > 0)
      ? pickActiveSyncIndex(current, duration, syncSegments)
      : -1;

  const syncScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeSyncIdx < 0 || !syncSegments?.length || !anchorId) return;
    const el = document.getElementById(`${anchorId}-sync-${activeSyncIdx}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSyncIdx, syncSegments?.length, anchorId]);

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearFade(), [clearFade]);

  useEffect(() => {
    targetVolRef.current = vol;
    const el = audioRef.current;
    if (el && playing && !fadeTimerRef.current) {
      el.volume = Math.min(1, Math.max(0, vol));
    }
  }, [vol, playing]);

  const fadeTo = useCallback(
    (end: number, onDone?: () => void) => {
      const el = audioRef.current;
      if (!el) {
        onDone?.();
        return;
      }
      clearFade();
      const steps = Math.max(10, Math.ceil(fadeMs / 40));
      let i = 0;
      const start = el.volume;
      fadeTimerRef.current = setInterval(() => {
        i++;
        const t = i / steps;
        el.volume = start + (end - start) * t;
        if (i >= steps) {
          clearFade();
          el.volume = end;
          onDone?.();
        }
      }, 40);
    },
    [clearFade, fadeMs],
  );

  const togglePlay = useCallback(async () => {
    const el = audioRef.current;
    if (!el || !activeSrc) return;
    if (playing) {
      fadeTo(0, () => {
        el.pause();
        setPlaying(false);
      });
    } else {
      el.volume = 0;
      el.loop = loop;
      try {
        await el.play();
        setPlaying(true);
        fadeTo(Math.min(1, Math.max(0, targetVolRef.current)));
      } catch {
        setPlaying(false);
        el.volume = Math.min(1, Math.max(0, targetVolRef.current));
      }
    }
  }, [fadeTo, loop, playing, activeSrc]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = loop;
  }, [loop]);

  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setShowTranscript(false);
  }, [activeSrc]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!experienceCueHints?.cues.length) {
      delete el.dataset.camptiCueCount;
      return;
    }
    el.dataset.camptiCueCount = String(experienceCueHints.cues.length);
  }, [experienceCueHints]);

  useEffect(() => {
    if (!onListenDelta || !playing) return;
    const id = window.setInterval(() => {
      onListenDelta(4);
    }, 4000);
    return () => window.clearInterval(id);
  }, [playing, onListenDelta]);

  if (!normalizedTabs.length || !activeSrc) return null;

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const displayTitle = title ?? active.label;
  const transcript = active.transcript?.trim();
  const hasSync = Boolean(syncSegments?.length);
  const preview =
    excerptPreview?.trim() ||
    (transcript && transcript.length > 140 ? `${transcript.slice(0, 140).trim()}…` : transcript);

  return (
    <div
      id={anchorId}
      className={`rounded-xl border border-stone-700/50 bg-gradient-to-b from-stone-950/80 to-black/50 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${className}`}
      aria-label={displayTitle ? `Audio: ${displayTitle}` : "Audio player"}
    >
      {voiceLead ? (
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.26em] text-amber-200/45">
          {voiceLead}
        </p>
      ) : null}
      {displayTitle ? (
        <p
          className={`text-[0.6rem] font-medium uppercase tracking-[0.24em] text-stone-500 ${voiceLead ? "mt-2" : ""}`}
        >
          {displayTitle}
        </p>
      ) : null}
      {contextLine ? (
        <p className="mt-1 text-xs leading-relaxed text-stone-600">{contextLine}</p>
      ) : null}
      {preview && !hasSync ? (
        <p className="mt-3 text-sm leading-relaxed text-stone-500/95">{preview}</p>
      ) : null}

      {normalizedTabs.length >= 2 ? (
        <div
          className="mt-4 flex flex-wrap gap-1 rounded-full border border-stone-800/90 bg-black/25 p-0.5"
          role="tablist"
          aria-label="Audio tracks"
        >
          {normalizedTabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              className={`rounded-full px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.16em] transition ${
                i === activeIdx
                  ? "bg-stone-800 text-stone-100"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <audio
        key={activeSrc}
        ref={audioRef}
        src={activeSrc}
        preload="metadata"
        loop={loop}
        className="hidden"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onEnded={() => {
          if (!loop) setPlaying(false);
        }}
      />
      <div className={`flex flex-col gap-3 ${displayTitle || contextLine ? "mt-4" : ""}`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-900/35 bg-stone-950/60 text-stone-200 transition hover:border-amber-800/50 hover:text-amber-50"
          >
            <span className="sr-only">{playing ? "Pause" : "Play"}</span>
            <span aria-hidden className={playing ? "text-[0.55rem]" : "ml-0.5 text-[0.62rem]"}>
              {playing ? "❚❚" : "▶"}
            </span>
          </button>
          <div className="h-1 min-w-[100px] flex-1 rounded-full bg-stone-800/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-950/70 to-amber-800/45 transition-[width] duration-150 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-[0.65rem] tabular-nums text-stone-500">
            {formatTime(current)} / {formatTime(duration)}
          </span>
        </div>
        <label className="flex items-center gap-2 text-[0.65rem] text-stone-500">
          <span className="w-12 uppercase tracking-wider">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            className="h-1 flex-1 accent-amber-800/80"
          />
        </label>
        {hasSync ? (
          <div ref={syncScrollRef} className="border-t border-stone-800/80 pt-3">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-stone-500">
              Read with voice
            </p>
            <div className="mt-3 max-h-56 space-y-3 overflow-y-auto pr-1 text-sm leading-relaxed">
              {syncSegments!.map((seg, i) => {
                const text = seg.textExcerpt?.trim() || "…";
                const active = i === activeSyncIdx;
                const sid = anchorId ? `${anchorId}-sync-${i}` : undefined;
                return (
                  <p
                    key={`${seg.segmentOrder}-${i}`}
                    id={sid}
                    data-cue={seg.cueType ?? undefined}
                    className={`rounded-md border border-transparent px-2 py-1.5 transition-colors duration-300 ${
                      active
                        ? "border-amber-900/35 bg-amber-950/20 text-stone-100"
                        : "text-stone-500"
                    }`}
                  >
                    {text}
                  </p>
                );
              })}
            </div>
          </div>
        ) : transcript ? (
          <div className="border-t border-stone-800/80 pt-3">
            <button
              type="button"
              onClick={() => setShowTranscript((s) => !s)}
              className="text-[0.6rem] uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-300"
            >
              {showTranscript ? "Hide transcript" : "Reveal transcript"}
            </button>
            {showTranscript ? (
              <p className="mt-3 max-h-48 overflow-y-auto text-sm leading-relaxed text-stone-400">
                {transcript}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
