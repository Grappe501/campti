"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { HandsFreeAction } from "@/lib/hands-free/types";
import {
  attachReaderCommandGrammars,
  getSpeechRecognitionConstructor,
  speechRecognitionSupported,
} from "@/lib/hands-free/browser-speech";
import {
  actionKey,
  interpretVoiceTranscript,
  looksLikeIncompleteChapterCommand,
  tryInterimNavigationIntent,
} from "@/lib/hands-free/voice-command-engine";
import { createGazeEdgeController } from "@/lib/hands-free/gaze-edge-controller";
import { loadWebGazer, type WebGazerHandle } from "@/lib/hands-free/webgazer-load";
import type { GazeEdge } from "@/lib/hands-free/gaze-edge-controller";

/** Min gap between any two voice dispatches (interim or final). */
const VOICE_DEBOUNCE_MS = 72;
/** Merge window when the browser splits one utterance across multiple final segments. */
const VOICE_MERGE_MS = 42;
/** Ignore repeat of the same action (e.g. accidental double-final). */
const VOICE_SAME_ACTION_MS = 300;
/** Min gap between interim shortcut fires (prevents stutter duplicates). */
const INTERIM_SHORTCUT_GAP_MS = 110;
/** After an interim shortcut, skip an immediate duplicate final for this long. */
const SKIP_FINAL_DUP_MS = 380;
/** Max rate for “Hearing:” transcript UI — speech events can fire 30+/sec without this. */
const INTERIM_UI_MIN_MS = 105;
/** Max rate for gaze edge highlight state — WebGazer can fire 60fps. */
const GAZE_UI_MIN_MS = 55;

type Props = {
  onAction: (action: HandsFreeAction) => void;
  active?: boolean;
};

function speechErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone blocked — allow access in the browser lock icon.";
    case "no-speech":
      return "No speech detected; speak a command or try again.";
    case "audio-capture":
      return "No microphone found.";
    case "network":
      return "Speech service network error.";
    case "aborted":
      return "";
    default:
      return "Voice input interrupted — try again.";
  }
}

/**
 * Hands-free: Web Speech API + WebGazer gaze dwell (GPL-3.0, loaded from CDN).
 * Memoized so parent re-renders (e.g. reader body) don’t rebuild this subtree.
 */
function HandsFreePanelInner({ onAction, active = true }: Props) {
  const [voiceOn, setVoiceOn] = useState(false);
  const [gazeOn, setGazeOn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [gazeError, setGazeError] = useState<string | null>(null);
  const [heardInterim, setHeardInterim] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [refOpen, setRefOpen] = useState(false);
  const [gazeVisual, setGazeVisual] = useState<{ zone: GazeEdge; progress: number }>({
    zone: "none",
    progress: 0,
  });

  const recRef = useRef<InstanceType<NonNullable<ReturnType<typeof getSpeechRecognitionConstructor>>> | null>(
    null,
  );
  const lastVoiceActAt = useRef(0);
  const lastActionKey = useRef<string>("");
  const lastActionAt = useRef(0);
  const lastInterimShortcutAt = useRef(0);
  const skipFinalDuplicateUntil = useRef(0);
  const lastDispatchedFromInterimKey = useRef<string>("");
  const voiceOnRef = useRef(false);
  const pendingFinalsRef = useRef<string[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webgazerRef = useRef<WebGazerHandle | null>(null);
  const gazeControllerRef = useRef<ReturnType<typeof createGazeEdgeController> | null>(null);
  const lastInterimUiAt = useRef(0);
  const interimUiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInterimText = useRef<string | null>(null);
  const lastGazeUiAt = useRef(0);
  /** Skip work when the engine repeats the same interim string (common at 30–60 Hz). */
  const lastInterimSnapshotRef = useRef<string>("");
  voiceOnRef.current = voiceOn;

  const flushInterimUi = useCallback((text: string | null) => {
    pendingInterimText.current = text;
    const now = Date.now();
    const elapsed = now - lastInterimUiAt.current;
    if (elapsed >= INTERIM_UI_MIN_MS) {
      if (interimUiTimer.current) {
        clearTimeout(interimUiTimer.current);
        interimUiTimer.current = null;
      }
      lastInterimUiAt.current = now;
      setHeardInterim(text);
      return;
    }
    if (!interimUiTimer.current) {
      interimUiTimer.current = setTimeout(() => {
        interimUiTimer.current = null;
        lastInterimUiAt.current = Date.now();
        setHeardInterim(pendingInterimText.current);
      }, INTERIM_UI_MIN_MS - elapsed);
    }
  }, []);

  if (!gazeControllerRef.current) {
    gazeControllerRef.current = createGazeEdgeController({
      edgeFraction: 0.12,
      hysteresisPx: 20,
      smoothWindow: 6,
      dwellMs: 720,
      cooldownMs: 1180,
    });
  }

  const dispatchVoiceMerged = useCallback(
    (merged: string, opts?: { fromInterimShortcut?: boolean }) => {
      const trimmed = merged.trim();
      if (!trimmed) return;

      const { action, label } = interpretVoiceTranscript(trimmed);

      if (label === "stop_voice") {
        setVoiceOn(false);
        if (interimUiTimer.current) {
          clearTimeout(interimUiTimer.current);
          interimUiTimer.current = null;
        }
        setHeardInterim(null);
        setStatus("Voice control off");
        setLastSuccess("Stopped listening");
        return;
      }

      if (!action) {
        setStatus(`No command matched — “${trimmed.slice(0, 72)}${trimmed.length > 72 ? "…" : ""}”`);
        setLastSuccess(null);
        return;
      }

      const key = actionKey(action);
      const now = Date.now();
      if (key === lastActionKey.current && now - lastActionAt.current < VOICE_SAME_ACTION_MS) {
        return;
      }
      if (now - lastVoiceActAt.current < VOICE_DEBOUNCE_MS) return;

      lastVoiceActAt.current = now;
      lastActionKey.current = key;
      lastActionAt.current = now;
      if (opts?.fromInterimShortcut) {
        lastDispatchedFromInterimKey.current = key;
        skipFinalDuplicateUntil.current = now + SKIP_FINAL_DUP_MS;
      }
      onAction(action);
      setLastSuccess(label ?? action.type);
      setStatus(`Voice → ${label ?? action.type}`);
      if (interimUiTimer.current) {
        clearTimeout(interimUiTimer.current);
        interimUiTimer.current = null;
      }
      setHeardInterim(null);
    },
    [onAction],
  );

  const tryInterimShortcut = useCallback(
    (interimRaw: string) => {
      const trimmed = interimRaw.trim();
      if (trimmed.length < 2) return;
      const now = Date.now();
      if (now - lastInterimShortcutAt.current < INTERIM_SHORTCUT_GAP_MS) return;

      const quick = tryInterimNavigationIntent(trimmed);
      if (!quick?.action || quick.label === "stop_voice") return;

      const key = actionKey(quick.action);
      if (key === lastActionKey.current && now - lastActionAt.current < VOICE_SAME_ACTION_MS) return;
      if (now - lastVoiceActAt.current < VOICE_DEBOUNCE_MS) return;

      lastInterimShortcutAt.current = now;
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
      pendingFinalsRef.current = [];

      dispatchVoiceMerged(trimmed, { fromInterimShortcut: true });
    },
    [dispatchVoiceMerged],
  );

  const queueFinalChunk = useCallback(
    (chunk: string) => {
      const c = chunk.trim();
      if (!c) return;
      pendingFinalsRef.current.push(c);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        const merged = pendingFinalsRef.current.join(" ");
        pendingFinalsRef.current = [];
        dispatchVoiceMerged(merged);
      }, VOICE_MERGE_MS);
    },
    [dispatchVoiceMerged],
  );

  const processFinalChunk = useCallback(
    (piece: string) => {
      const c = piece.trim();
      if (!c) return;

      const now = Date.now();
      if (now < skipFinalDuplicateUntil.current) {
        const int = interpretVoiceTranscript(c);
        if (int.action && actionKey(int.action) === lastDispatchedFromInterimKey.current) {
          return;
        }
      }

      if (looksLikeIncompleteChapterCommand(c)) {
        queueFinalChunk(c);
        return;
      }

      const solo = interpretVoiceTranscript(c);
      if (solo.label === "stop_voice") {
        dispatchVoiceMerged(c);
        return;
      }
      if (solo.action) {
        dispatchVoiceMerged(c);
        return;
      }

      queueFinalChunk(c);
    },
    [dispatchVoiceMerged, queueFinalChunk],
  );

  useEffect(() => {
    if (!voiceOn || !active) {
      pendingFinalsRef.current = [];
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      if (interimUiTimer.current) {
        clearTimeout(interimUiTimer.current);
        interimUiTimer.current = null;
      }
      setHeardInterim(null);
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
      return;
    }
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setStatus("Voice commands need Chrome or Edge (Web Speech API).");
      setVoiceOn(false);
      return;
    }
    lastInterimUiAt.current = 0;
    lastInterimSnapshotRef.current = "";
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    attachReaderCommandGrammars(rec);
    const maxAlt = (rec as unknown as { maxAlternatives?: number }).maxAlternatives;
    if (typeof maxAlt === "undefined") {
      try {
        (rec as unknown as { maxAlternatives: number }).maxAlternatives = 5;
      } catch {
        /* ignore */
      }
    }

    rec.onresult = (ev: {
      resultIndex: number;
      results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
    }) => {
      let interim = "";
      for (let i = 0; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (!result?.[0]) continue;
        if (result.isFinal) continue;
        interim += result[0].transcript;
      }
      const inter = interim.trim();
      if (inter !== lastInterimSnapshotRef.current) {
        lastInterimSnapshotRef.current = inter;
        flushInterimUi(inter || null);
        if (inter.length >= 2) {
          tryInterimShortcut(inter);
        }
      }

      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (!result?.isFinal || !result[0]?.transcript) continue;
        processFinalChunk(result[0].transcript);
      }
    };

    rec.onerror = (ev: { error: string }) => {
      const msg = speechErrorMessage(ev.error);
      if (msg) setStatus(msg);
    };

    rec.onend = () => {
      if (voiceOnRef.current && active) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setStatus("Listening for commands…");
    } catch {
      setStatus("Could not start microphone.");
      setVoiceOn(false);
    }
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      pendingFinalsRef.current = [];
      try {
        rec.abort();
      } catch {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }
      recRef.current = null;
    };
  }, [voiceOn, active, processFinalChunk, tryInterimShortcut, flushInterimUi]);

  const handleGazeSample = useCallback(
    (x: number, y: number) => {
      if (!active || !gazeOn) return;
      const ctl = gazeControllerRef.current;
      if (!ctl) return;
      const { fired, zone, dwellProgress } = ctl.pushSample(x, y, performance.now());
      const t = performance.now();
      if (t - lastGazeUiAt.current >= GAZE_UI_MIN_MS) {
        lastGazeUiAt.current = t;
        setGazeVisual({ zone, progress: dwellProgress });
      }

      if (fired === "right") {
        ctl.reset();
        onAction({ type: "next" });
        setLastSuccess("gaze next");
        setStatus("Gaze → next");
      } else if (fired === "left") {
        ctl.reset();
        onAction({ type: "previous" });
        setLastSuccess("gaze previous");
        setStatus("Gaze → previous");
      }
    },
    [active, gazeOn, onAction],
  );

  useEffect(() => {
    if (!gazeOn || !active) {
      gazeControllerRef.current?.reset();
      lastGazeUiAt.current = 0;
      setGazeVisual({ zone: "none", progress: 0 });
      const wg = webgazerRef.current;
      if (wg) {
        try {
          wg.clearGazeListener();
          wg.end();
        } catch {
          /* ignore */
        }
        webgazerRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setGazeError(null);
    gazeControllerRef.current?.reset();

    (async () => {
      try {
        const webgazer = await loadWebGazer();
        if (cancelled) return;
        if (!webgazer.detectCompatibility()) {
          setGazeError("Browser cannot access camera for gaze.");
          setGazeOn(false);
          return;
        }
        webgazerRef.current = webgazer;
        webgazer.setGazeListener((data) => {
          if (!data || cancelled) return;
          handleGazeSample(data.x, data.y);
        });
        await webgazer.begin(() => {
          setGazeError("Camera permission denied or unavailable.");
          setGazeOn(false);
        });
        if (cancelled) {
          try {
            webgazer.clearGazeListener();
            webgazer.end();
          } catch {
            /* ignore */
          }
          return;
        }
        webgazer.showVideoPreview(false);
        webgazer.showVideo(false);
        webgazer.showFaceOverlay(false);
        webgazer.showFaceFeedbackBox(false);
        setStatus("Gaze on — dwell left/right screen edge");
      } catch (e) {
        setGazeError(e instanceof Error ? e.message : "Could not start gaze.");
        setGazeOn(false);
      }
    })();

    return () => {
      cancelled = true;
      const wg = webgazerRef.current;
      webgazerRef.current = null;
      if (wg) {
        try {
          wg.clearGazeListener();
          wg.end();
        } catch {
          /* ignore */
        }
      }
      gazeControllerRef.current?.reset();
    };
  }, [gazeOn, active, handleGazeSample]);

  const speechOk = speechRecognitionSupported();

  const leftPulse =
    gazeVisual.zone === "left" ? Math.min(0.55, 0.12 + gazeVisual.progress * 0.5) : 0;
  const rightPulse =
    gazeVisual.zone === "right" ? Math.min(0.55, 0.12 + gazeVisual.progress * 0.5) : 0;

  return (
    <div className="relative rounded-lg border border-violet-900/45 bg-gradient-to-b from-violet-950/25 to-black/30 px-4 py-4 shadow-[inset_0_1px_0_rgba(139,92,246,0.08)] sm:px-5">
      {/* Gaze dwell affordance — edge highlights */}
      {gazeOn ? (
        <>
          <div
            className="pointer-events-none fixed inset-y-0 left-0 z-[35] w-[4%] min-w-[20px] bg-gradient-to-r from-cyan-500/50 to-transparent transition-opacity duration-150"
            style={{ opacity: leftPulse }}
            aria-hidden
          />
          <div
            className="pointer-events-none fixed inset-y-0 right-0 z-[35] w-[4%] min-w-[20px] bg-gradient-to-l from-cyan-500/50 to-transparent transition-opacity duration-150"
            style={{ opacity: rightPulse }}
            aria-hidden
          />
        </>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.55rem] font-medium uppercase tracking-[0.26em] text-violet-300/90">
            Hands-free control
          </p>
          <p className="mt-1 max-w-2xl text-[0.68rem] leading-relaxed text-stone-500">
            Voice uses fast interim detection for short commands (e.g. “next”, “back”) plus full
            phrase matching; gaze uses smoothed dwell on the screen edges. Move the mouse briefly if
            WebGazer feels unsteady — it learns from pointer movement.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!speechOk}
          onClick={() => {
            setVoiceOn((v) => !v);
            if (!voiceOn) setStatus("Starting microphone…");
          }}
          className={`rounded-md border px-4 py-2 text-[0.72rem] font-medium transition ${
            voiceOn
              ? "border-violet-400/50 bg-violet-950/50 text-violet-50"
              : "border-stone-600 text-stone-300 hover:border-stone-500 hover:text-stone-100"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {voiceOn ? "Stop voice" : "Start voice"}
        </button>
        <button
          type="button"
          onClick={() => setGazeOn((g) => !g)}
          className={`rounded-md border px-4 py-2 text-[0.72rem] font-medium transition ${
            gazeOn
              ? "border-cyan-500/55 bg-cyan-950/40 text-cyan-50"
              : "border-stone-600 text-stone-300 hover:border-stone-500 hover:text-stone-100"
          }`}
        >
          {gazeOn ? "Stop gaze" : "Start gaze"}
        </button>
        <button
          type="button"
          onClick={() => setRefOpen((o) => !o)}
          className="rounded-md border border-stone-700 px-3 py-2 text-[0.68rem] text-stone-500 transition hover:border-stone-600 hover:text-stone-300"
        >
          {refOpen ? "Hide phrases" : "Command list"}
        </button>
      </div>

      {voiceOn && heardInterim ? (
        <p className="mt-3 rounded-md border border-stone-800/80 bg-black/30 px-3 py-2 font-mono text-[0.7rem] text-cyan-200/80">
          <span className="text-stone-600">Hearing: </span>
          {heardInterim}
        </p>
      ) : null}

      {lastSuccess ? (
        <p className="mt-2 text-[0.65rem] text-emerald-600/90">
          Last: <span className="text-emerald-500/95">{lastSuccess}</span>
        </p>
      ) : null}

      {gazeError ? (
        <p className="mt-3 text-[0.72rem] text-amber-300/95">{gazeError}</p>
      ) : null}
      {status ? <p className="mt-2 text-[0.68rem] text-stone-500">{status}</p> : null}

      {refOpen ? (
        <div className="mt-4 rounded-md border border-stone-800/90 bg-black/25 px-3 py-3 text-[0.65rem] leading-relaxed text-stone-500">
          <p className="font-medium text-stone-400">Examples</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5">
            <li>Navigation: “turn the page”, “flip forward”, “skip”, “ahead”, “go back”, “last page”</li>
            <li>Chapter: “go to chapter 3”, “ch 12”, “next chapter” (advance), “open chapter five”</li>
            <li>Display: “brighter”, “dimmer”, “zoom in”, “bigger text”</li>
            <li>Scroll: “scroll down”, “page up”</li>
            <li>Stop: “stop listening”, “voice off”</li>
            <li>Gaze: hold your gaze on the far left or right edge until the bar fills</li>
          </ul>
        </div>
      ) : null}

      {!speechOk ? (
        <p className="mt-3 text-[0.65rem] text-stone-600">
          Web Speech API not available in this browser. Use Chrome or Edge for voice.
        </p>
      ) : null}
      <p className="mt-3 text-[0.58rem] leading-relaxed text-stone-600">
        WebGazer.js (GPL-3.0) loads from jsDelivr at runtime. Camera and models stay in your browser.
      </p>
    </div>
  );
}

export const HandsFreePanel = memo(HandsFreePanelInner);
