"use client";

import { useCallback, useState } from "react";

import type { CockpitApiResult, CockpitSubmitTurnData } from "@/lib/services/reader-cockpit-command-service";
import {
  cockpitEndConversation,
  cockpitFetchLatestState,
  cockpitPauseConversation,
  cockpitResumeConversation,
  cockpitSetPresentationPlaybackPreference,
  cockpitStartConversationFromScene,
  cockpitSubmitReaderTurn,
} from "@/app/actions/reader-cockpit";
import {
  deriveCockpitUiIndicators,
  reduceCockpitFlowState,
  type CockpitFlowState,
} from "@/lib/services/reader-cockpit-ui-state";
import { resolveUnifiedDegradedUxState } from "@/lib/services/reader-degraded-ux-service";

type Props = {
  initialReaderId: string;
  initialCharacterId?: string;
  initialSceneId?: string;
};

export function ReaderCockpitShell({ initialReaderId, initialCharacterId = "", initialSceneId = "" }: Props) {
  const [readerId, setReaderId] = useState(initialReaderId);
  const [characterId, setCharacterId] = useState(initialCharacterId);
  const [sceneId, setSceneId] = useState(initialSceneId);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const [readerText, setReaderText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmit, setLastSubmit] = useState<CockpitSubmitTurnData | null>(null);
  const [flowState, setFlowState] = useState<CockpitFlowState>("idle");
  const [transcriptLimit, setTranscriptLimit] = useState(8);
  const [lastAction, setLastAction] = useState<string>("idle");

  const unwrap = useCallback(<T,>(r: CockpitApiResult<T>, onOk: (d: T) => void) => {
    if (r.ok) {
      setError(null);
      onOk(r.data);
    } else {
      setFlowState((s) => reduceCockpitFlowState(s, "request_failed"));
      setError(`[${r.error.code}] ${r.error.message}`);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!readerId.trim() || !characterId.trim()) {
      setError("readerId and characterId required.");
      return;
    }
    setLoading(true);
    try {
      const r = await cockpitFetchLatestState({
        readerId: readerId.trim(),
        characterId: characterId.trim(),
        sessionId,
      });
      unwrap(r, (d) => {
        setLastSubmit((prev) =>
          prev
            ? {
                ...prev,
                cockpit: d.cockpit,
                latestCharacterResponse: d.latestCharacterResponse,
                voicePresentationPayload: d.voicePresentationPayload,
              }
            : ({
                cockpit: d.cockpit,
                latestCharacterResponse: d.latestCharacterResponse,
                voicePresentationPayload: d.voicePresentationPayload,
                generation: {
                  usedLlm: false,
                  usedPolicyFallback: false,
                  finalPolicyPass: true,
                  modelOutputViolatedPolicy: false,
                },
              } satisfies CockpitSubmitTurnData)
        );
        if (d.cockpit.activeSession?.status === "PAUSED") {
          setFlowState("paused");
        } else if (d.cockpit.activeSession?.status === "ACTIVE") {
          setFlowState("active");
        } else {
          setFlowState("idle");
        }
        setLastAction("fetch_state");
      });
    } finally {
      setLoading(false);
    }
  }, [characterId, readerId, sessionId, unwrap]);

  const start = async () => {
    setFlowState((s) => reduceCockpitFlowState(s, "start_requested"));
    setLoading(true);
    try {
      const r = await cockpitStartConversationFromScene({
        readerId: readerId.trim(),
        characterId: characterId.trim(),
        sceneId: sceneId.trim(),
      });
      unwrap(r, (d) => {
        setSessionId(d.sessionId);
        setResumeToken(d.narrativeResumeToken);
        setLastSubmit({
          cockpit: d.cockpit,
          latestCharacterResponse: null,
          voicePresentationPayload: null,
          generation: {
            usedLlm: false,
            usedPolicyFallback: false,
            finalPolicyPass: true,
            modelOutputViolatedPolicy: false,
          },
        });
        setFlowState((s) => reduceCockpitFlowState(s, "start_succeeded"));
        setLastAction("start_from_scene");
      });
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!sessionId) {
      setError("Start a session first.");
      return;
    }
    setLoading(true);
    try {
      const r = await cockpitSubmitReaderTurn({
        readerId: readerId.trim(),
        characterId: characterId.trim(),
        sessionId,
        readerText,
      });
      unwrap(r, (d) => {
        setLastSubmit(d);
        setReaderText("");
        setFlowState((s) => reduceCockpitFlowState(s, "turn_sent"));
        setLastAction("submit_turn");
      });
    } finally {
      setLoading(false);
    }
  };

  const pause = async () => {
    if (!sessionId) return;
    setFlowState((s) => reduceCockpitFlowState(s, "pause_requested"));
    setLoading(true);
    try {
      const r = await cockpitPauseConversation({ sessionId, characterId: characterId.trim(), readerId: readerId.trim() });
      unwrap(r, (d) => {
        setLastSubmit((prev) =>
          prev
            ? { ...prev, cockpit: d.cockpit }
            : {
                cockpit: d.cockpit,
                latestCharacterResponse: null,
                voicePresentationPayload: null,
                generation: {
                  usedLlm: false,
                  usedPolicyFallback: false,
                  finalPolicyPass: true,
                  modelOutputViolatedPolicy: false,
                },
              }
        );
        setFlowState((s) => reduceCockpitFlowState(s, "pause_succeeded"));
        setLastAction("pause");
      });
    } finally {
      setLoading(false);
    }
  };

  const resume = async () => {
    if (!sessionId) return;
    setFlowState((s) => reduceCockpitFlowState(s, "resume_requested"));
    setLoading(true);
    try {
      const r = await cockpitResumeConversation({ sessionId, characterId: characterId.trim(), readerId: readerId.trim() });
      unwrap(r, (d) => {
        setLastSubmit((prev) =>
          prev
            ? { ...prev, cockpit: d.cockpit }
            : {
                cockpit: d.cockpit,
                latestCharacterResponse: null,
                voicePresentationPayload: null,
                generation: {
                  usedLlm: false,
                  usedPolicyFallback: false,
                  finalPolicyPass: true,
                  modelOutputViolatedPolicy: false,
                },
              }
        );
        setFlowState((s) => reduceCockpitFlowState(s, "resume_succeeded"));
        setLastAction("resume");
      });
    } finally {
      setLoading(false);
    }
  };

  const end = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const r = await cockpitEndConversation({ sessionId, characterId: characterId.trim(), readerId: readerId.trim() });
      unwrap(r, (d) => {
        setLastSubmit({
          cockpit: d.cockpit,
          latestCharacterResponse: null,
          voicePresentationPayload: null,
          generation: {
            usedLlm: false,
            usedPolicyFallback: false,
            finalPolicyPass: true,
            modelOutputViolatedPolicy: false,
          },
        });
        setSessionId(null);
        setFlowState((s) => reduceCockpitFlowState(s, "end_succeeded"));
        setLastAction("end");
      });
    } finally {
      setLoading(false);
    }
  };

  const cp = lastSubmit?.cockpit;
  const spoken = lastSubmit?.latestCharacterResponse?.spokenResponse;
  const ledger = cp?.costEstimateSummary.ledgerSessionSummary;
  const voice = cp?.voicePresentationReadiness;
  const balanceUnits = cp?.interactionBalance?.availableUnits;
  const balanceStatus = cp?.interactionBalanceStatus?.state ?? "unavailable";
  const balanceUnavailableReason = cp?.interactionBalanceStatus?.unavailableReason;
  const degradedPolicy = cp?.interactionDegradedPolicy ?? null;
  const presentationPref = cp?.presentationPlaybackPreference ?? "translated_default";
  const indicators = deriveCockpitUiIndicators(cp ?? null);
  const degradedUx = resolveUnifiedDegradedUxState({
    cockpit: cp ?? null,
    lastErrorMessage: error,
  });
  const turns = cp?.latestTranscriptTurns ?? [];
  const displayedTurns = turns.slice(0, transcriptLimit);
  const transcriptHiddenCount = Math.max(0, turns.length - transcriptLimit);

  const setPresentation = async (preference: "translated_default" | "native_when_available") => {
    if (!sessionId || !characterId.trim() || !readerId.trim()) return;
    setLoading(true);
    try {
      const r = await cockpitSetPresentationPlaybackPreference({
        readerId: readerId.trim(),
        characterId: characterId.trim(),
        sessionId,
        preference,
      });
      unwrap(r, (d) => {
        setLastSubmit((prev) =>
          prev
            ? { ...prev, cockpit: d.cockpit }
            : {
                cockpit: d.cockpit,
                latestCharacterResponse: null,
                voicePresentationPayload: null,
                generation: {
                  usedLlm: false,
                  usedPolicyFallback: false,
                  finalPolicyPass: true,
                  modelOutputViolatedPolicy: false,
                },
              }
        );
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 text-stone-200">
      <header>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">Scene conversation</p>
        <h1 className="mt-2 font-serif text-2xl text-stone-100">Enter · speak · return</h1>
        <p className="mt-2 text-sm text-stone-500">
          Conversation stays grounded in the current scene while narrative truth remains canonical.
        </p>
      </header>
      {degradedUx.state !== "healthy" ? (
        <section className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Experience state</p>
          <p className="mt-1 text-sm text-amber-100">{degradedUx.headline}</p>
          <p className="mt-1 text-xs text-amber-200/80">{degradedUx.detail}</p>
        </section>
      ) : null}

      <section className="grid gap-3 rounded-lg border border-stone-800 bg-stone-900/40 p-4 text-sm">
        <label className="block">
          <span className="text-stone-500">Reader anchor</span>
          <input
            className="mt-1 w-full rounded border border-stone-700 bg-stone-950 px-2 py-1"
            value={readerId}
            onChange={(e) => setReaderId(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-stone-500">Character anchor</span>
          <input
            className="mt-1 w-full rounded border border-stone-700 bg-stone-950 px-2 py-1"
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-stone-500">Scene anchor</span>
          <input
            className="mt-1 w-full rounded border border-stone-700 bg-stone-950 px-2 py-1"
            value={sceneId}
            onChange={(e) => setSceneId(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            className="rounded bg-amber-900/40 px-3 py-1 text-amber-100 disabled:opacity-40"
            disabled={loading}
            onClick={() => void start()}
          >
            Enter conversation
          </button>
          <button
            type="button"
            className="rounded border border-stone-600 px-3 py-1 disabled:opacity-40"
            disabled={loading}
            onClick={() => void refresh()}
          >
            Refresh state
          </button>
        </div>
        {resumeToken ? (
          <p className="text-xs text-stone-500">
            Return token: <code className="text-stone-400">{resumeToken}</code>
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Live session</p>
        <p className="mt-1 font-mono text-sm text-stone-300">{sessionId ?? "—"}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded border border-stone-700 px-2 py-1 text-stone-300">flow: {flowState}</span>
          <span className="rounded border border-stone-700 px-2 py-1 text-stone-300">
            backend: {cp?.activeSession?.status ?? "none"}
          </span>
          <span className="rounded border border-stone-700 px-2 py-1 text-stone-300">
            reusable: {String(indicators.sessionReusable)}
          </span>
          <span className="rounded border border-stone-700 px-2 py-1 text-stone-300">last action: {lastAction}</span>
        </div>
        <p className="mt-3 text-sm text-stone-400">
          Active character:{" "}
          <span className="text-stone-200">{cp?.conversationalIdentitySummary?.personName ?? "—"}</span>
        </p>
        <p className="mt-1 text-sm text-stone-400">
          Relationship:{" "}
          <span className="text-stone-200">{cp?.readerRelationshipProgression?.relationshipState ?? "stranger"}</span>
        </p>
        <p className="mt-1 text-sm text-stone-400">
          Emotional continuity:{" "}
          <span className="text-stone-200">
            {cp?.emotionalContinuity
              ? `${cp.emotionalContinuity.baselineTone} -> ${cp.emotionalContinuity.currentConversationTone}`
              : "—"}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-stone-600 px-3 py-1 text-sm disabled:opacity-40"
            disabled={loading || !sessionId}
            onClick={() => void pause()}
          >
            Pause conversation
          </button>
          <button
            type="button"
            className="rounded border border-stone-600 px-3 py-1 text-sm disabled:opacity-40"
            disabled={loading || !sessionId}
            onClick={() => void resume()}
          >
            Resume conversation
          </button>
          <button
            type="button"
            className="rounded border border-red-900/60 px-3 py-1 text-sm text-red-200/90 disabled:opacity-40"
            disabled={loading || !sessionId}
            onClick={() => void end()}
          >
            Close conversation
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Your line in-scene</p>
        <textarea
          className="mt-2 min-h-[88px] w-full rounded border border-stone-700 bg-stone-950 px-2 py-2 text-sm"
          value={readerText}
          onChange={(e) => setReaderText(e.target.value)}
          placeholder="Speak into this moment..."
        />
        <button
          type="button"
          className="mt-2 rounded bg-stone-100 px-3 py-1 text-sm text-stone-900 disabled:opacity-40"
          disabled={loading || !sessionId}
          onClick={() => void submit()}
        >
          Send line
        </button>
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Character response</p>
        <p className="mt-2 whitespace-pre-wrap text-stone-200">{spoken ?? "—"}</p>
        {lastSubmit?.generation ? (
          <p className="mt-2 text-xs text-stone-500">
            LLM: {String(lastSubmit.generation.usedLlm)} · fallback: {String(lastSubmit.generation.usedPolicyFallback)} ·
            policy ok: {String(lastSubmit.generation.finalPolicyPass)}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Voice readiness</p>
        <ul className="mt-2 list-inside list-disc text-sm text-stone-400">
          <li>TTS assigned: {voice ? String(voice.hasTtsVoiceAssignment) : "—"}</li>
          <li>Ready for playback: {voice ? String(voice.readyForVoicePlayback) : "—"}</li>
          <li>Voice availability: {indicators.voiceAvailability}</li>
          <li>
            Presentation: translation flag {voice ? String(voice.characterPresentationMode.translationApplied) : "—"}
          </li>
          <li>Preferred speed: {voice?.preferredVoicePlaybackSpeed ?? "—"}</li>
        </ul>
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Interaction balance (units)</p>
        <p className="mt-2 text-sm text-stone-300">{balanceUnits ?? "—"}</p>
        <p className="mt-1 text-xs text-stone-500">
          Balance status: {balanceStatus}
          {balanceStatus === "unavailable" && balanceUnavailableReason
            ? ` (${balanceUnavailableReason})`
            : ""}
        </p>
        {degradedPolicy === "allow_read_only" || degradedPolicy === "blocked_all" ? (
          <p className="mt-2 text-xs text-amber-200/90">interaction unavailable (read-only mode)</p>
        ) : null}
        {degradedPolicy === "allow_limited_free_turns" ||
        degradedPolicy === "allow_system_fallback_only" ? (
          <p className="mt-2 text-xs text-amber-200/90">
            limited interaction mode ({degradedPolicy === "allow_system_fallback_only" ? "system fallback only" : "limited free turns"})
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Presentation playback (P3-G)</p>
        <p className="mt-2 text-sm text-stone-400">
          Active: <span className="text-stone-200">{presentationPref}</span>
          {presentationPref === "native_when_available" && !voice?.characterPresentationMode.nativeTongueAvailable ? (
            <span className="ml-2 text-amber-200/80">(native path may be unavailable)</span>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-stone-500">Indicator: {indicators.translationIndicator}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-stone-600 px-3 py-1 text-sm disabled:opacity-40"
            disabled={loading || !sessionId}
            onClick={() => void setPresentation("translated_default")}
          >
            Translated (default)
          </button>
          <button
            type="button"
            className="rounded border border-stone-600 px-3 py-1 text-sm disabled:opacity-40"
            disabled={loading || !sessionId}
            onClick={() => void setPresentation("native_when_available")}
          >
            Native when available
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Cost / ledger (session)</p>
        {ledger ? (
          <ul className="mt-2 text-sm text-stone-400">
            <li>Rows: {ledger.entryCount}</li>
            <li>Units (sum): {ledger.totalUnitCount}</li>
            <li>Cost units (sum): {ledger.totalEstimatedCostUnits}</li>
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">No ledger rows for this session yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Transcript (newest first)</p>
        <ol className="mt-2 space-y-1 text-sm text-stone-400">
          {displayedTurns.map((t) => (
            <li key={t.turnId}>
              <span
                className={
                  t.speakerType === "reader"
                    ? "mr-2 rounded bg-stone-800 px-1 py-0.5 text-[10px] uppercase tracking-wide text-stone-300"
                    : "mr-2 rounded bg-amber-900/30 px-1 py-0.5 text-[10px] uppercase tracking-wide text-amber-200"
                }
              >
                {t.speakerType}
              </span>
              <span className="text-stone-500">#{t.orderIndex}</span> {t.summaryLine}
            </li>
          ))}
        </ol>
        {transcriptHiddenCount > 0 ? (
          <button
            type="button"
            className="mt-3 rounded border border-stone-700 px-2 py-1 text-xs text-stone-300"
            onClick={() => setTranscriptLimit((v) => v + 8)}
          >
            Show older turns ({transcriptHiddenCount} hidden)
          </button>
        ) : null}
      </section>

      {error ? <p className="rounded border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
      {loading ? <p className="text-xs text-stone-500">Loading…</p> : null}
    </div>
  );
}
