import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  CAMPTI_BUILD_STAGES,
  CAMPTI_MASTER_BUILD_LAW,
  CAMPTI_UNIVERSAL_CURSOR_RULES,
} from "@/lib/campti-build-sequence";
import { CopyPromptButton } from "./copy-prompt-button";

export const dynamic = "force-dynamic";

function AdminSurfaceLine({ text }: { text: string }) {
  const trimmed = text.trim();
  const isFuture = /\bfuture\b/i.test(trimmed);
  const pathMatch = trimmed.match(/^(\/admin[^\s]*)/);
  const path = pathMatch?.[1] ?? "";
  const hasDynamic = path.includes("[");
  const canLink = path.startsWith("/admin") && !isFuture && !hasDynamic;

  if (canLink) {
    return (
      <li>
        <Link href={path} className="text-amber-900 hover:underline">
          {text}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <span className="text-stone-600">{text}</span>
    </li>
  );
}

function stagePromptBlock(stageNumber: number): string {
  const s = CAMPTI_BUILD_STAGES.find((x) => x.stage === stageNumber);
  if (!s) return "";
  return `${CAMPTI_UNIVERSAL_CURSOR_RULES}

---

${s.promptLabel}

Master build law: ${CAMPTI_MASTER_BUILD_LAW}

Layer focus: ${s.layerFocus}

Goal: ${s.goal}

Models / records to build or formalize:
${s.modelsToBuild.map((m) => `- ${m}`).join("\n")}

Admin surfaces (existing or planned):
${s.adminSurfaces.map((a) => `- ${a}`).join("\n")}
${s.antiPatterns?.length ? `\nAvoid:\n${s.antiPatterns.map((a) => `- ${a}`).join("\n")}` : ""}`;
}

export default function BuildSequencePage() {
  const fullSequencePrompt = [
    CAMPTI_UNIVERSAL_CURSOR_RULES,
    "",
    "---",
    "",
    "CAMPTI — FULL BUILD ORDER (do not skip)",
    CAMPTI_BUILD_STAGES.map((s) => `${s.stage}. ${s.promptLabel}`).join("\n"),
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <PageHeader
        title="Cursor build sequence"
        description="Layered system law: not more pages first — law, ontology, variables, engines, admin surfaces, readiness gates, then simulation runs. Work one stage at a time. The fifteen conceptual governance layers live at /admin/registries; this page is execution order and copyable prompts."
      />

      <section className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-amber-950">Master rule</h2>
        <p className="mt-2 font-mono text-sm text-stone-800">{CAMPTI_MASTER_BUILD_LAW}</p>
        <p className="mt-3 text-sm text-stone-700">
          If Cursor builds UI before law and schema, the system will drift. Prefer registry integrity and TypeScript/Zod
          contracts before polish.
        </p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Universal rules (every stage prompt)</h2>
            <p className="mt-1 text-xs text-stone-500">Paste at the top of each Cursor task for this project.</p>
          </div>
          <CopyPromptButton text={CAMPTI_UNIVERSAL_CURSOR_RULES} label="Copy universal rules" />
        </div>
        <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-xs leading-relaxed text-stone-800">
          {CAMPTI_UNIVERSAL_CURSOR_RULES}
        </pre>
      </section>

      <section className="rounded-xl border border-violet-200/80 bg-violet-50/30 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-violet-950">Full order (single copy block)</h2>
          <CopyPromptButton text={fullSequencePrompt} label="Copy full sequence" />
        </div>
        <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-xs text-stone-700">
          {fullSequencePrompt}
        </pre>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Stages 1–15</h2>
        {CAMPTI_BUILD_STAGES.map((s) => {
          const block = stagePromptBlock(s.stage);
          return (
            <article
              key={s.id}
              id={s.id}
              className="scroll-mt-8 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-stone-500">Stage {s.stage}</p>
                  <h3 className="text-lg font-semibold text-stone-900">{s.title}</h3>
                  <p className="mt-1 font-mono text-xs text-amber-900/90">{s.promptLabel}</p>
                </div>
                <CopyPromptButton text={block} label="Copy stage prompt" />
              </div>
              <p className="mt-3 text-sm text-stone-700">{s.layerFocus}</p>
              <p className="mt-2 text-sm font-medium text-stone-800">Goal: {s.goal}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-stone-500">Models / records</h4>
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm text-stone-700">
                    {s.modelsToBuild.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-stone-500">Admin surfaces</h4>
                  <ul className="mt-2 space-y-1 text-sm text-stone-700">
                    {s.adminSurfaces.map((a) => (
                      <AdminSurfaceLine key={a} text={a} />
                    ))}
                  </ul>
                </div>
              </div>
              {s.antiPatterns?.length ? (
                <p className="mt-3 text-xs text-red-800/90">
                  <span className="font-semibold">Avoid:</span> {s.antiPatterns.join("; ")}
                </p>
              ) : null}
            </article>
          );
        })}
      </section>

      <p className="text-center text-sm text-stone-600">
        Conceptual registry catalog:{" "}
        <Link href="/admin/registries" className="text-amber-900 hover:underline">
          /admin/registries
        </Link>
      </p>
    </div>
  );
}
