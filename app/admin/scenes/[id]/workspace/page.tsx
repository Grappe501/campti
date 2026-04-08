import Link from "next/link";
import { notFound } from "next/navigation";
import {
  generateSceneScaffold,
  generateSceneSummaryFromDraft,
  linkEntityToScene,
  unlinkEntityFromScene,
  updateSceneWorkspace,
} from "@/app/actions/scenes";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import {
  getSceneByIdFull,
  getSceneContextData,
  searchEntitiesForScene,
} from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { getSceneContinuityWarnings } from "@/lib/scene-continuity";
import { WritingMode } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
    q?: string;
    t?: string;
  }>;
};

function adminHref(type: string, id: string) {
  if (type === "person") return `/admin/people/${id}`;
  if (type === "place") return `/admin/places/${id}`;
  if (type === "event") return `/admin/events/${id}`;
  if (type === "source") return `/admin/sources/${id}`;
  if (type === "openQuestion") return `/admin/questions/${id}`;
  return null;
}

function ModePanel({
  mode,
  sceneId,
  structuredDataJson,
  locked,
  guidance,
}: {
  mode: WritingMode;
  sceneId: string;
  structuredDataJson: unknown;
  locked: boolean;
  guidance: string[];
}) {
  if (mode === WritingMode.STRUCTURED) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
        <p className="text-sm font-medium text-stone-900">Structured mode</p>
        <p className="text-xs text-stone-600">
          Generate a scaffold snapshot from what’s already linked (no AI).
        </p>
        <form action={generateSceneScaffold}>
          <input type="hidden" name="sceneId" value={sceneId} />
          <button
            type="submit"
            disabled={locked}
            className="w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-60"
          >
            Generate Scene Scaffold
          </button>
        </form>
        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
            structuredDataJson
          </p>
          <pre className="mt-2 max-h-[22rem] overflow-auto whitespace-pre-wrap break-words text-xs text-stone-800">
            {JSON.stringify(structuredDataJson ?? {}, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (mode === WritingMode.NARRATIVE) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
        <p className="text-sm font-medium text-stone-900">Narrative mode</p>
        <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-700 space-y-2">
          <p className="font-medium text-stone-900">Freewriting prompt</p>
          <p>
            Write the scene first. Link entities as you go to keep grounding and
            continuity visible.
          </p>
          <p className="text-stone-500">
            “Suggest links from text” is stubbed for now.
          </p>
        </div>
        <button
          type="button"
          className="w-full rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
          disabled
        >
          Suggest links from text (coming soon)
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
      <p className="text-sm font-medium text-stone-900">Hybrid mode</p>
      <p className="text-xs text-stone-600">
        Lightweight guidance from your linked context.
      </p>
      <ul className="rounded-lg bg-stone-50 p-3 text-xs text-stone-800 space-y-1">
        {guidance.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}

function EntityList({
  title,
  items,
  type,
  sceneId,
  locked,
}: {
  title: string;
  items: Array<{ id: string; label: string }>;
  type: "person" | "place" | "event" | "symbol" | "source" | "openQuestion";
  sceneId: string;
  locked: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-stone-500">None linked.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.map((it) => {
            const href = adminHref(type, it.id);
            return (
              <li
                key={it.id}
                className="flex items-center justify-between gap-2"
              >
                {href ? (
                  <Link
                    href={href}
                    className="text-sm text-amber-900 hover:underline"
                  >
                    {it.label}
                  </Link>
                ) : (
                  <span className="text-sm text-stone-800">{it.label}</span>
                )}
                <form action={unlinkEntityFromScene}>
                  <input type="hidden" name="sceneId" value={sceneId} />
                  <input type="hidden" name="entityType" value={type} />
                  <input type="hidden" name="entityId" value={it.id} />
                  <button
                    type="submit"
                    disabled={locked}
                    className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default async function AdminSceneWorkspacePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const scene = await getSceneByIdFull(id);
  if (!scene) notFound();

  const ctx = await getSceneContextData(id);
  const provenance = ctx?.provenance ?? { sourceCount: 0, claimCount: 0, confidenceAvg: null as number | null };

  const type = (sp.t ?? "person").trim();
  const query = (sp.q ?? "").trim();
  const results = query.length >= 2 ? await searchEntitiesForScene(type, query) : [];

  const warnings = getSceneContinuityWarnings({
    sceneStatus: scene.sceneStatus,
    writingMode: scene.writingMode,
    draftText: scene.draftText,
    personsCount: scene.persons.length,
    placesCount: scene.places.length,
    events: scene.events.map((e) => ({
      startYear: e.startYear ?? null,
      endYear: e.endYear ?? null,
      title: e.title,
    })),
    sourcesCount: scene.sources.length,
  });

  const locked = (scene.sceneStatus ?? "").toLowerCase() === "locked";

  const guidance: string[] = [
    ...(scene.persons.length
      ? [`This scene includes ${scene.persons.map((p) => p.name).slice(0, 3).join(", ")}${scene.persons.length > 3 ? "…" : ""}`]
      : ["No people linked yet"]),
    ...(scene.places.length
      ? [`Places: ${scene.places.map((p) => p.name).slice(0, 2).join(", ")}${scene.places.length > 2 ? "…" : ""}`]
      : ["No place linked yet"]),
    ...(scene.events.length ? [] : ["No event linked yet"]),
    ...(scene.openQuestions.length
      ? [`Open question available: ${scene.openQuestions[0]!.title}`]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/admin/scenes/${scene.id}`} className="text-sm text-amber-900 hover:underline">
            ← Scene details
          </Link>
          <PageHeader
            title={scene.description}
            description={`Workspace · Chapter: ${scene.chapter.chapterNumber ?? "—"} ${scene.chapter.title}`}
          />
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-600">
            <span className="rounded-full bg-stone-100 px-3 py-1">
              Scene grounded in <span className="font-medium text-stone-900">{provenance.sourceCount}</span> sources
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1">
              Claims: <span className="font-medium text-stone-900">{provenance.claimCount}</span>
              {provenance.confidenceAvg != null ? (
                <>
                  {" "}
                  · avg confidence{" "}
                  <span className="font-medium text-stone-900">{provenance.confidenceAvg}</span>
                </>
              ) : null}
            </span>
            {locked ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-950">
                Locked (read-only)
              </span>
            ) : null}
          </div>
        </div>

        <form action={updateSceneWorkspace} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <input type="hidden" name="id" value={scene.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Writing mode</span>
            <select name="writingMode" defaultValue={scene.writingMode} className={fieldClass} disabled={locked}>
              {Object.values(WritingMode).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass + " mt-3"}>
            <span className={labelSpanClass}>Scene status</span>
            <select name="sceneStatus" defaultValue={scene.sceneStatus ?? "drafting"} className={fieldClass}>
              {["planned", "drafting", "revised", "locked"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="mt-3 w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save mode/status
          </button>
        </form>
      </div>

      <AdminFormError error={sp.error} />

      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Saved.
        </p>
      ) : null}

      {warnings.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-medium">Continuity checks</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((w, idx) => (
              <li key={`${w.code}-${idx}`}>{w.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT: Context */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-stone-900">Linked entities</p>
            <div className="mt-3 space-y-3 text-sm">
              <EntityList title="People" items={scene.persons.map((p) => ({ id: p.id, label: p.name }))} type="person" sceneId={scene.id} locked={locked} />
              <EntityList title="Places" items={scene.places.map((p) => ({ id: p.id, label: p.name }))} type="place" sceneId={scene.id} locked={locked} />
              <EntityList title="Events" items={scene.events.map((e) => ({ id: e.id, label: e.title }))} type="event" sceneId={scene.id} locked={locked} />
              <EntityList title="Symbols" items={scene.symbols.map((s) => ({ id: s.id, label: s.name }))} type="symbol" sceneId={scene.id} locked={locked} />
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-stone-900">Source anchors</p>
            <div className="mt-3 space-y-2 text-sm">
              <EntityList title="Linked sources" items={scene.sources.map((s) => ({ id: s.id, label: s.title }))} type="source" sceneId={scene.id} locked={locked} />
              {ctx?.claims?.length ? (
                <div className="mt-3 rounded-lg bg-stone-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Relevant claims</p>
                  <ul className="mt-2 space-y-1 text-xs text-stone-700">
                    {ctx.claims.slice(0, 12).map((c) => (
                      <li key={c.id}>
                        <span className="font-medium text-stone-900">{c.confidence}</span> · {c.description.slice(0, 120)}
                        {c.description.length > 120 ? "…" : ""} <span className="text-stone-500">({c.source.title})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-stone-500">No claims available from linked sources yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-stone-900">Open questions</p>
            <div className="mt-3">
              <EntityList title="Linked questions" items={scene.openQuestions.map((q) => ({ id: q.id, label: q.title }))} type="openQuestion" sceneId={scene.id} locked={locked} />
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-stone-900">Continuity notes</p>
            {scene.continuityNotes.length ? (
              <ul className="mt-3 space-y-1 text-sm">
                {scene.continuityNotes.map((n) => (
                  <li key={n.id}>
                    <Link href={`/admin/continuity/${n.id}`} className="text-amber-900 hover:underline">
                      {n.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-stone-500">None linked.</p>
            )}
          </div>
        </aside>

        {/* CENTER: Writing */}
        <main className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <p className="text-sm font-medium text-stone-900">Draft</p>
            <form action={updateSceneWorkspace} className="space-y-3">
              <input type="hidden" name="id" value={scene.id} />
              <label className={labelClass}>
                <span className={labelSpanClass}>Draft text</span>
                <textarea
                  name="draftText"
                  rows={18}
                  defaultValue={scene.draftText ?? ""}
                  className={fieldClass}
                  placeholder="Write the scene here…"
                  readOnly={locked}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className={labelSpanClass}>Narrative intent</span>
                  <input
                    name="narrativeIntent"
                    defaultValue={scene.narrativeIntent ?? ""}
                    className={fieldClass}
                    placeholder="What this scene must achieve"
                    readOnly={locked}
                  />
                </label>
                <label className={labelClass}>
                  <span className={labelSpanClass}>Emotional tone</span>
                  <input
                    name="emotionalTone"
                    defaultValue={scene.emotionalTone ?? ""}
                    className={fieldClass}
                    placeholder="e.g., tense, tender, ominous"
                    readOnly={locked}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className={labelSpanClass}>Historical confidence (1–5)</span>
                  <input
                    name="historicalConfidence"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={scene.historicalConfidence ?? ""}
                    className={fieldClass}
                    readOnly={locked}
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={locked}
                    className="w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-60"
                  >
                    Save draft
                  </button>
                </div>
              </div>
            </form>

            <div className="flex flex-wrap gap-2">
              <form action={generateSceneSummaryFromDraft}>
                <input type="hidden" name="sceneId" value={scene.id} />
                <button
                  type="submit"
                  disabled={locked}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50 disabled:opacity-60"
                >
                  Generate summary from draftText
                </button>
              </form>
              <Link
                href={`/admin/chapters/${scene.chapterId}`}
                className="rounded-full border border-amber-800/30 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
              >
                Back to chapter
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
            <p className="text-sm font-medium text-stone-900">Trace + continuity summaries</p>
            <form action={updateSceneWorkspace} className="space-y-3">
              <input type="hidden" name="id" value={scene.id} />
              <label className={labelClass}>
                <span className={labelSpanClass}>Source trace summary</span>
                <textarea
                  name="sourceTraceSummary"
                  rows={3}
                  defaultValue={scene.sourceTraceSummary ?? ""}
                  className={fieldClass}
                  placeholder="What sources support this scene (reader-safe phrasing optional)."
                  readOnly={locked}
                />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Continuity summary</span>
                <textarea
                  name="continuitySummary"
                  rows={3}
                  defaultValue={scene.continuitySummary ?? ""}
                  className={fieldClass}
                  placeholder="Continuity considerations, constraints, and decisions."
                  readOnly={locked}
                />
              </label>
              <button
                type="submit"
                disabled={locked}
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-60"
              >
                Save summaries
              </button>
            </form>
          </div>
        </main>

        {/* RIGHT: Mode-specific + linking */}
        <aside className="lg:col-span-3 space-y-4">
          <ModePanel
            mode={scene.writingMode}
            sceneId={scene.id}
            structuredDataJson={scene.structuredDataJson}
            locked={locked}
            guidance={guidance}
          />

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
            <p className="text-sm font-medium text-stone-900">Link entities</p>
            <form method="get" className="space-y-3">
              <label className={labelClass}>
                <span className={labelSpanClass}>Type</span>
                <select name="t" defaultValue={type} className={fieldClass}>
                  {[
                    { id: "person", label: "People" },
                    { id: "place", label: "Places" },
                    { id: "event", label: "Events" },
                    { id: "symbol", label: "Symbols" },
                    { id: "source", label: "Sources" },
                    { id: "openQuestion", label: "Open Questions" },
                  ].map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Search</span>
                <input name="q" defaultValue={query} className={fieldClass} placeholder="Type at least 2 characters…" />
              </label>
              <button type="submit" className="w-full rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50">
                Search
              </button>
            </form>

            {query.length >= 2 ? (
              results.length ? (
                <ul className="space-y-2">
                  {results.map((r: unknown) => {
                    const o = (r && typeof r === "object" ? (r as Record<string, unknown>) : {}) as Record<string, unknown>;
                    const rid = String(o.id ?? "");
                    const label = String((o.name ?? o.title ?? o.description ?? rid) || "(unknown)");
                    const href = adminHref(type, rid);
                    return (
                      <li key={rid} className="rounded-lg border border-stone-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {href ? (
                              <Link href={href} className="block truncate font-medium text-amber-900 hover:underline">
                                {label}
                              </Link>
                            ) : (
                              <p className="truncate font-medium text-stone-900">{label}</p>
                            )}
                            <p className="mt-1 font-mono text-[11px] text-stone-500">{rid}</p>
                          </div>
                          <form action={linkEntityToScene}>
                            <input type="hidden" name="sceneId" value={scene.id} />
                            <input type="hidden" name="entityType" value={type} />
                            <input type="hidden" name="entityId" value={rid} />
                            <button
                              type="submit"
                              disabled={locked}
                              className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-60"
                            >
                              Attach
                            </button>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-stone-500">No results.</p>
              )
            ) : (
              <p className="text-xs text-stone-500">Search to attach existing canonical records. No creation happens here.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

