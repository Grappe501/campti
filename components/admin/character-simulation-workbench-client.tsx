"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import {
  acknowledgeCharacterSimulationWorkbenchAction,
  previewCharacterSimulationWorkbenchAction,
  saveCharacterSimulationWorkbenchAction,
} from "@/app/actions/character-simulation-workbench";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import type { CharacterSimulationWorkbenchViewModel } from "@/lib/domain/character-simulation-workbench";
import { CHARACTER_SIMULATION_PREVIEW_MODES } from "@/lib/domain/character-simulation-workbench";

type Props = {
  personId: string;
  initialView: CharacterSimulationWorkbenchViewModel;
};

function readinessBadgeClass(level: CharacterSimulationWorkbenchViewModel["header"]["readinessImpact"]["level"]): string {
  switch (level) {
    case "ready":
      return "border-emerald-300 bg-emerald-50 text-emerald-950";
    case "advisory_warning":
      return "border-amber-300 bg-amber-50 text-amber-950";
    case "downgrade_risk":
      return "border-orange-300 bg-orange-50 text-orange-950";
    case "blocked":
      return "border-rose-400 bg-rose-50 text-rose-950";
    default:
      return "border-stone-300 bg-stone-50 text-stone-800";
  }
}

export function CharacterSimulationWorkbenchClient({ personId, initialView }: Props) {
  const [view, setView] = useState(initialView);
  const [tab, setTab] = useState<"mind" | "voice" | "compare" | "preview" | "conflicts" | "audit" | "readiness">("mind");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [coreDesire, setCoreDesire] = useState(view.authorEditable.mindPartial.coreDesire ?? "");
  const [surfaceDesire, setSurfaceDesire] = useState(view.authorEditable.mindPartial.surfaceDesire ?? "");
  const [worldviewFrame, setWorldviewFrame] = useState(view.authorEditable.mindPartial.worldviewFrame ?? "");
  const [identityNarrative, setIdentityNarrative] = useState(view.authorEditable.mindPartial.identityNarrative ?? "");
  const [conflictStyle, setConflictStyle] = useState(view.authorEditable.mindPartial.conflictStyle ?? "");
  const [decisionStyle, setDecisionStyle] = useState(view.authorEditable.mindPartial.decisionStyle ?? "");
  const [changeResistance, setChangeResistance] = useState(
    String(view.authorEditable.mindPartial.changeResistance ?? ""),
  );
  const [coreBeliefsText, setCoreBeliefsText] = useState(
    (view.authorEditable.mindPartial.beliefSystem?.coreBeliefs ?? []).join("\n"),
  );
  const [brittleText, setBrittleText] = useState(
    (view.authorEditable.mindPartial.beliefSystem?.brittleAssumptions ?? []).join("\n"),
  );

  const [internalMonologueStyle, setInternalMonologueStyle] = useState(
    view.authorEditable.voicePartial.internalMonologueStyle ?? "",
  );
  const [spokenDialogueStyle, setSpokenDialogueStyle] = useState(
    view.authorEditable.voicePartial.spokenDialogueStyle ?? "",
  );
  const [cadenceProfile, setCadenceProfile] = useState(view.authorEditable.voicePartial.cadenceProfile ?? "");
  const [metaphorDomain, setMetaphorDomain] = useState(view.authorEditable.voicePartial.metaphorDomain ?? "");
  const [silencePattern, setSilencePattern] = useState(view.authorEditable.voicePartial.silencePattern ?? "");
  const [vocabularyRange, setVocabularyRange] = useState<"narrow" | "medium" | "wide">(
    view.authorEditable.voicePartial.vocabularyRange ?? view.merged.voice.vocabularyRange,
  );
  const [tabooText, setTabooText] = useState((view.authorEditable.voicePartial.tabooBoundaries ?? []).join("\n"));
  const [authorNotesText, setAuthorNotesText] = useState(view.authorEditable.authorNotes.join("\n"));

  const [previewMode, setPreviewMode] = useState<(typeof CHARACTER_SIMULATION_PREVIEW_MODES)[number]>("inner_monologue");
  const [previewStimulus, setPreviewStimulus] = useState("A trusted ally questions their loyalty.");

  const mindPartial = useMemo(() => {
    const m: Record<string, unknown> = {};
    if (coreDesire.trim()) m.coreDesire = coreDesire.trim();
    if (surfaceDesire.trim()) m.surfaceDesire = surfaceDesire.trim();
    if (worldviewFrame.trim()) m.worldviewFrame = worldviewFrame.trim();
    if (identityNarrative.trim()) m.identityNarrative = identityNarrative.trim();
    if (conflictStyle.trim()) m.conflictStyle = conflictStyle.trim();
    if (decisionStyle.trim()) m.decisionStyle = decisionStyle.trim();
    if (changeResistance.trim()) {
      const n = Number(changeResistance);
      if (!Number.isNaN(n)) m.changeResistance = n;
    }
    const core = coreBeliefsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const brittle = brittleText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (core.length || brittle.length) {
      m.beliefSystem = {
        ...(core.length ? { coreBeliefs: core } : {}),
        ...(brittle.length ? { brittleAssumptions: brittle } : {}),
      };
    }
    return m;
  }, [brittleText, changeResistance, conflictStyle, coreBeliefsText, coreDesire, decisionStyle, identityNarrative, surfaceDesire, worldviewFrame]);

  const voicePartial = useMemo(() => {
    const v: Record<string, unknown> = {};
    if (internalMonologueStyle.trim()) v.internalMonologueStyle = internalMonologueStyle.trim();
    if (spokenDialogueStyle.trim()) v.spokenDialogueStyle = spokenDialogueStyle.trim();
    if (cadenceProfile.trim()) v.cadenceProfile = cadenceProfile.trim();
    if (metaphorDomain.trim()) v.metaphorDomain = metaphorDomain.trim();
    if (silencePattern.trim()) v.silencePattern = silencePattern.trim();
    const taboo = tabooText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (taboo.length) v.tabooBoundaries = taboo;
    const hasVoiceStrings = Boolean(
      internalMonologueStyle.trim() ||
        spokenDialogueStyle.trim() ||
        cadenceProfile.trim() ||
        metaphorDomain.trim() ||
        silencePattern.trim() ||
        taboo.length,
    );
    if (hasVoiceStrings || vocabularyRange !== view.merged.voice.vocabularyRange) {
      v.vocabularyRange = vocabularyRange;
    }
    return v;
  }, [
    cadenceProfile,
    internalMonologueStyle,
    metaphorDomain,
    silencePattern,
    spokenDialogueStyle,
    tabooText,
    vocabularyRange,
    view.merged.voice.vocabularyRange,
  ]);

  function syncFromView(next: CharacterSimulationWorkbenchViewModel) {
    setView(next);
    setCoreDesire(next.authorEditable.mindPartial.coreDesire ?? "");
    setSurfaceDesire(next.authorEditable.mindPartial.surfaceDesire ?? "");
    setWorldviewFrame(next.authorEditable.mindPartial.worldviewFrame ?? "");
    setIdentityNarrative(next.authorEditable.mindPartial.identityNarrative ?? "");
    setConflictStyle(next.authorEditable.mindPartial.conflictStyle ?? "");
    setDecisionStyle(next.authorEditable.mindPartial.decisionStyle ?? "");
    setChangeResistance(
      next.authorEditable.mindPartial.changeResistance !== undefined
        ? String(next.authorEditable.mindPartial.changeResistance)
        : "",
    );
    setCoreBeliefsText((next.authorEditable.mindPartial.beliefSystem?.coreBeliefs ?? []).join("\n"));
    setBrittleText((next.authorEditable.mindPartial.beliefSystem?.brittleAssumptions ?? []).join("\n"));
    setInternalMonologueStyle(next.authorEditable.voicePartial.internalMonologueStyle ?? "");
    setSpokenDialogueStyle(next.authorEditable.voicePartial.spokenDialogueStyle ?? "");
    setCadenceProfile(next.authorEditable.voicePartial.cadenceProfile ?? "");
    setMetaphorDomain(next.authorEditable.voicePartial.metaphorDomain ?? "");
    setSilencePattern(next.authorEditable.voicePartial.silencePattern ?? "");
    setVocabularyRange(next.authorEditable.voicePartial.vocabularyRange ?? next.merged.voice.vocabularyRange);
    setTabooText((next.authorEditable.voicePartial.tabooBoundaries ?? []).join("\n"));
    setAuthorNotesText(next.authorEditable.authorNotes.join("\n"));
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const authorNotes = authorNotesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const r = await saveCharacterSimulationWorkbenchAction({
        personId,
        mindPartial: mindPartial,
        voicePartial: voicePartial,
        authorNotes,
      });
      if (!r.ok) {
        setError(r.message);
        if ("view" in r && r.view) syncFromView(r.view);
        return;
      }
      syncFromView(r.view);
    });
  }

  function onPreview() {
    setError(null);
    startTransition(async () => {
      const r = await previewCharacterSimulationWorkbenchAction({
        personId,
        request: { mode: previewMode, stimulus: previewStimulus },
      });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      syncFromView(r.view);
      setTab("preview");
    });
  }

  function onAcknowledge(conflictId: string) {
    setError(null);
    startTransition(async () => {
      const r = await acknowledgeCharacterSimulationWorkbenchAction({ personId, conflictIds: [conflictId] });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      syncFromView(r.view);
    });
  }

  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: "mind", label: "Mind profile" },
    { id: "voice", label: "Voice profile" },
    { id: "compare", label: "Author · seed · merged" },
    { id: "preview", label: "Preview lab" },
    { id: "conflicts", label: "Conflicts / drift" },
    { id: "audit", label: "Audit" },
    { id: "readiness", label: "Readiness impact" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-500">Character header</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">{view.header.name}</h2>
            <p className="mt-1 text-sm text-stone-600">
              Record type: {view.header.recordType.replaceAll("_", " ")} · Simulation source:{" "}
              <span className="font-medium text-stone-800">{view.header.simulationTruthSource.replaceAll("_", " ")}</span>
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Last bundle update: {view.header.lastAuthorBundleUpdatedAtIso ?? "—"} · Audit rows (loaded): {view.header.auditEntryCount}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${readinessBadgeClass(view.header.readinessImpact.level)}`}
            >
              Readiness: {view.header.readinessImpact.level.replaceAll("_", " ")}
            </span>
            <Link href="/admin/narrative?scope=scene" className="text-xs font-medium text-sky-900 underline-offset-2 hover:underline">
              Author Cockpit (scene scope) →
            </Link>
          </div>
        </div>
        {view.drift.migrationRequired ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">
            Persistence migration missing — edits cannot be saved until `prisma migrate deploy` applies the Character Simulation Workbench
            migration.
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <span className="font-medium">Action blocked.</span> {error}
        </div>
      ) : null}

      {!view.validation.ok ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-medium">Validation</p>
          <ul className="mt-1 list-disc pl-5">
            {view.validation.issues.map((i) => (
              <li key={`${i.path}-${i.code}`}>
                {i.path}: {i.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <nav className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              tab === t.id ? "bg-stone-900 text-amber-50" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "mind" ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-widest text-stone-500">Mind profile (author-owned partial)</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Core desire</span>
              <textarea value={coreDesire} onChange={(e) => setCoreDesire(e.target.value)} rows={3} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Surface desire</span>
              <textarea value={surfaceDesire} onChange={(e) => setSurfaceDesire(e.target.value)} rows={3} className={fieldClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Worldview frame</span>
              <textarea value={worldviewFrame} onChange={(e) => setWorldviewFrame(e.target.value)} rows={2} className={fieldClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Identity narrative</span>
              <textarea value={identityNarrative} onChange={(e) => setIdentityNarrative(e.target.value)} rows={3} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Conflict style</span>
              <input value={conflictStyle} onChange={(e) => setConflictStyle(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Decision style</span>
              <input value={decisionStyle} onChange={(e) => setDecisionStyle(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Change resistance (0–1)</span>
              <input value={changeResistance} onChange={(e) => setChangeResistance(e.target.value)} className={fieldClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Core beliefs (one per line)</span>
              <textarea value={coreBeliefsText} onChange={(e) => setCoreBeliefsText(e.target.value)} rows={4} className={fieldClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Brittle assumptions (one per line)</span>
              <textarea value={brittleText} onChange={(e) => setBrittleText(e.target.value)} rows={3} className={fieldClass} />
            </label>
          </div>
          <p className="text-[11px] text-stone-500">
            Nested structures (fear/wound/shame maps) remain seed-backed until edited via advanced JSON in a future pass — this panel covers
            load-bearing author strings only.
          </p>
        </section>
      ) : null}

      {tab === "voice" ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-widest text-stone-500">Voice profile (simulation voice domain)</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Internal monologue style</span>
              <textarea
                value={internalMonologueStyle}
                onChange={(e) => setInternalMonologueStyle(e.target.value)}
                rows={3}
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Spoken dialogue style</span>
              <textarea
                value={spokenDialogueStyle}
                onChange={(e) => setSpokenDialogueStyle(e.target.value)}
                rows={3}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Cadence profile</span>
              <input value={cadenceProfile} onChange={(e) => setCadenceProfile(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Metaphor domain</span>
              <input value={metaphorDomain} onChange={(e) => setMetaphorDomain(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Silence pattern</span>
              <input value={silencePattern} onChange={(e) => setSilencePattern(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Vocabulary range</span>
              <select value={vocabularyRange} onChange={(e) => setVocabularyRange(e.target.value as typeof vocabularyRange)} className={fieldClass}>
                <option value="narrow">narrow</option>
                <option value="medium">medium</option>
                <option value="wide">wide</option>
              </select>
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Taboo boundaries (one per line)</span>
              <textarea value={tabooText} onChange={(e) => setTabooText(e.target.value)} rows={3} className={fieldClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Author notes (one per line; stored in workbench meta)</span>
              <textarea value={authorNotesText} onChange={(e) => setAuthorNotesText(e.target.value)} rows={3} className={fieldClass} />
            </label>
          </div>
        </section>
      ) : null}

      {tab === "compare" ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-widest text-stone-500">Comparison</p>
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <th className="py-2 pr-3">Field group</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Author touched</th>
                  <th className="py-2 pr-3">Differs from seed</th>
                </tr>
              </thead>
              <tbody>
                {view.fieldStatuses.map((f) => (
                  <tr key={f.fieldGroup} className="border-b border-stone-100">
                    <td className="py-2 pr-3 font-medium text-stone-800">{f.label}</td>
                    <td className="py-2 pr-3 text-stone-700">{f.source.replaceAll("_", " ")}</td>
                    <td className="py-2 pr-3">{f.authorTouched ? "yes" : "no"}</td>
                    <td className="py-2 pr-3">{f.differsFromSeed ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs">
            <summary className="cursor-pointer font-medium text-stone-800">Advanced — merged profile JSON</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-stone-700">
              {JSON.stringify({ mind: view.merged.mind, voice: view.merged.voice }, null, 2)}
            </pre>
          </details>
        </section>
      ) : null}

      {tab === "preview" ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-widest text-stone-500">Preview lab</p>
          <p className="text-sm text-stone-600">{view.previewMetadata.honestCapabilityNote}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Preview mode</span>
              <select value={previewMode} onChange={(e) => setPreviewMode(e.target.value as typeof previewMode)} className={fieldClass}>
                {CHARACTER_SIMULATION_PREVIEW_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelSpanClass}>Stimulus</span>
              <textarea value={previewStimulus} onChange={(e) => setPreviewStimulus(e.target.value)} rows={2} className={fieldClass} />
            </label>
          </div>
          <button
            type="button"
            disabled={pending || view.drift.migrationRequired}
            onClick={onPreview}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-50"
          >
            Run deterministic preview
          </button>
          {view.previewMetadata.lastPreview ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50/80 p-3 text-sm text-sky-950">
              <p className="text-xs uppercase tracking-widest text-sky-900">Result</p>
              <p className="mt-2 whitespace-pre-wrap">{view.previewMetadata.lastPreview.text}</p>
              <ul className="mt-2 grid gap-1 text-xs text-sky-900 md:grid-cols-2">
                <li>Confidence: {view.previewMetadata.lastPreview.confidenceLabel}</li>
                <li>Completeness: {view.previewMetadata.lastPreview.completeness.toFixed(2)}</li>
                <li>Truth basis: {view.previewMetadata.lastPreview.truthBasis}</li>
                <li className="font-mono text-[10px] text-sky-800">id: {view.previewMetadata.lastPreview.deterministicPreviewId}</li>
              </ul>
            </div>
          ) : (
            <p className="text-xs text-stone-500">No preview run in this session yet.</p>
          )}
        </section>
      ) : null}

      {tab === "conflicts" ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs uppercase tracking-widest text-stone-500">Contradictions</p>
          {view.conflicts.length === 0 ? (
            <p className="text-sm text-stone-600">No heuristics flagged contradictions for this profile.</p>
          ) : (
            <ul className="space-y-3">
              {view.conflicts.map((c) => (
                <li key={c.id} className="rounded-lg border border-stone-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-stone-900">{c.category.replaceAll("_", " ")}</span>
                    <span className="text-xs uppercase text-stone-500">{c.severity}</span>
                  </div>
                  <p className="mt-1 text-stone-700">{c.description}</p>
                  <p className="mt-1 text-xs text-stone-600">Remediation: {c.recommendedRemediation}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Blocks readiness: {c.blocksGenerationReadiness ? "yes" : "no"} · Acknowledged: {c.acceptedByOperator ? "yes" : "no"}
                  </p>
                  {!c.acceptedByOperator && !c.blocksGenerationReadiness && c.severity === "advisory" ? (
                    <button
                      type="button"
                      disabled={pending || view.drift.migrationRequired}
                      onClick={() => onAcknowledge(c.id)}
                      className="mt-2 rounded-full border border-stone-400 px-3 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
                    >
                      Acknowledge advisory
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
            <p className="font-medium text-stone-900">Drift summary</p>
            <ul className="mt-1 list-disc pl-5">
              <li>Unresolved: {view.drift.unresolvedContradictionCount}</li>
              <li>Blocking (open): {view.drift.blockingContradictionCount}</li>
              <li>Advisory (open): {view.drift.advisoryContradictionCount}</li>
            </ul>
            {view.drift.notes.map((n) => (
              <p key={n} className="mt-1">
                — {n}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "audit" ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2">
          <p className="text-xs uppercase tracking-widest text-stone-500">Audit history</p>
          {view.auditRecent.length === 0 ? (
            <p className="text-sm text-stone-600">No audit rows returned (migration missing, or no actions yet).</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {view.auditRecent.map((a) => (
                <li key={a.id} className="border-b border-stone-100 pb-2">
                  <span className="text-xs text-stone-500">{a.createdAtIso}</span>
                  <span className="ml-2 font-medium text-stone-800">{a.action}</span>
                  <p className="text-stone-700">{a.summary}</p>
                  {a.actorNote ? <p className="text-xs text-stone-600">Note: {a.actorNote}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "readiness" ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2">
          <p className="text-xs uppercase tracking-widest text-stone-500">Readiness impact</p>
          <p className="text-sm text-stone-700">Level: {view.header.readinessImpact.level.replaceAll("_", " ")}</p>
          <div>
            <p className="text-xs font-medium text-stone-800">Reasons</p>
            <ul className="list-disc pl-5 text-sm text-stone-700">
              {view.header.readinessImpact.reasons.length ? (
                view.header.readinessImpact.reasons.map((r) => <li key={r}>{r}</li>)
              ) : (
                <li>No blocking reasons at this layer.</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-800">Remediation</p>
            <ul className="list-disc pl-5 text-sm text-stone-700">
              {view.header.readinessImpact.remediation.length ? (
                view.header.readinessImpact.remediation.map((r) => <li key={r}>{r}</li>)
              ) : (
                <li>None required for current state.</li>
              )}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || view.drift.migrationRequired}
          onClick={onSave}
          className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-50"
        >
          Save author bundle
        </button>
      </div>

      <details className="rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-700">
        <summary className="cursor-pointer font-medium text-stone-800">Provenance timeline</summary>
        <ul className="mt-2 space-y-1">
          {view.provenance.map((p) => (
            <li key={p.id}>
              <span className="font-mono text-[10px] text-stone-500">{p.recordedAtIso}</span> — {p.subject} ({p.source.replaceAll("_", " ")}):{" "}
              {p.detail}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
