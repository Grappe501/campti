import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getRegistryById } from "@/lib/campti-registry";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "live") return "Live (mostly wired to existing schema)";
  if (status === "partial") return "Partial (surfaces exist; dedicated tables optional)";
  return "Planned";
}

export default async function RegistryDetailPage({ params }: Props) {
  const { id } = await params;
  const r = getRegistryById(id);
  if (!r) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Phase {r.buildPhase} · {r.layer}
        </p>
        <PageHeader title={`${r.ordinal}. ${r.title}`} description={r.tagline} />
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Purpose</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">{r.description}</p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">What it governs</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
          {r.governs.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">AI contract</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">{r.aiContract}</p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Implementation status</h2>
        <p className="mt-2 text-sm text-stone-600">{statusLabel(r.implementationStatus)}</p>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Existing surfaces</h3>
        <ul className="mt-2 space-y-2">
          {r.implementedSurfaces.map((s, i) => (
            <li key={i} className="text-sm text-stone-800">
              {s.href ? (
                <Link href={s.href} className="text-amber-900 hover:underline">
                  {s.label}
                </Link>
              ) : (
                <span className="font-medium">{s.label}</span>
              )}
              {s.prismaModel ? (
                <span className="ml-2 text-xs text-stone-500">({s.prismaModel})</span>
              ) : null}
              {s.note ? <span className="mt-0.5 block text-xs text-stone-500">{s.note}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-violet-200/80 bg-violet-50/30 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-violet-950">Next build notes</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-800">{r.nextBuildNotes}</p>
      </section>

      <p className="text-center text-sm">
        <Link href="/admin/registries" className="text-amber-900 hover:underline">
          ← All registries
        </Link>
      </p>
    </div>
  );
}
