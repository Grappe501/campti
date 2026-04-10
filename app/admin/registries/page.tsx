import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  CAMPTI_MASTER_REGISTRIES,
  REGISTRY_BUILD_PHASES,
  getCursorBuildSequence,
} from "@/lib/campti-registry";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  const base = "rounded-full px-2 py-0.5 text-xs font-medium";
  if (status === "live") return `${base} bg-emerald-100 text-emerald-900`;
  if (status === "partial") return `${base} bg-amber-100 text-amber-950`;
  return `${base} bg-stone-200 text-stone-700`;
}

export default function RegistriesHubPage() {
  const sequence = getCursorBuildSequence();

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <PageHeader
        title="Deterministic engine — master registries"
        description="Fifteen governance layers for a simulation-first archive: truth status, constraints, and composition gates. Each registry links to live admin surfaces where they exist; next-build notes describe Prisma/admin work still to land."
      />

      <section className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-violet-950">Ontology spine (Stage 2)</h2>
        <p className="mt-1 text-sm text-stone-700">
          Controlled vocabulary and profiles: object kinds, registry values, narrative permission, confidence ladder, scene
          readiness. The catalog below is conceptual; the data tables are editable here.
        </p>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          <li>
            <Link href="/admin/ontology" className="font-medium text-amber-900 hover:underline">
              Ontology types
            </Link>
          </li>
          <li>
            <Link href="/admin/registries/values" className="font-medium text-amber-900 hover:underline">
              Registry values
            </Link>
          </li>
          <li>
            <Link href="/admin/permissions" className="font-medium text-amber-900 hover:underline">
              Permissions
            </Link>
          </li>
          <li>
            <Link href="/admin/confidence" className="font-medium text-amber-900 hover:underline">
              Confidence
            </Link>
          </li>
          <li>
            <Link href="/admin/readiness" className="font-medium text-amber-900 hover:underline">
              Readiness
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-amber-950">Cursor build sequence</h2>
        <p className="mt-1 text-sm text-stone-700">
          Prefer completing phases in order (1→5). Within a phase, follow the numbered tasks below. For the layered
          execution order (law → ontology → engines → gates → runs), use{" "}
          <Link href="/admin/build-sequence" className="font-medium text-amber-900 hover:underline">
            /admin/build-sequence
          </Link>
          .
        </p>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-stone-800">
          {sequence.map((t) => (
            <li key={t.registryId}>
              <Link href={`/admin/registries/${t.registryId}`} className="font-medium text-amber-900 hover:underline">
                {t.title}
              </Link>
              <span className="text-stone-500"> — phase {t.phase}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-8">
        {REGISTRY_BUILD_PHASES.map((p) => {
          const items = CAMPTI_MASTER_REGISTRIES.filter((r) => r.buildPhase === p.phase).sort(
            (a, b) => a.buildOrderInPhase - b.buildOrderInPhase,
          );
          return (
            <div key={p.phase}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                Phase {p.phase} — {p.name}
              </h2>
              <p className="mt-1 text-sm text-stone-600">{p.summary}</p>
              <ul className="mt-4 space-y-3">
                {items.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-300/70"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/admin/registries/${r.id}`}
                          className="text-base font-medium text-amber-950 hover:underline"
                        >
                          {r.ordinal}. {r.title}
                        </Link>
                        <p className="mt-1 text-sm text-stone-600">{r.tagline}</p>
                        <p className="mt-2 text-xs text-stone-500">
                          Layer: <span className="text-stone-700">{r.layer}</span>
                        </p>
                      </div>
                      <span className={statusBadge(r.implementationStatus)}>{r.implementationStatus}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-stone-700">{r.description}</p>
                    <Link
                      href={`/admin/registries/${r.id}`}
                      className="mt-3 inline-block text-sm text-amber-900 hover:underline"
                    >
                      Open registry detail →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
