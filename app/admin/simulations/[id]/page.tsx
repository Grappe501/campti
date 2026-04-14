import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { cognitionPrisma } from "@/lib/prisma-cognition-access";
import { buildSimulationObserverSnapshot } from "@/lib/services/world-observer-service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function SimulationRunObserverPage({ params }: Props) {
  const { id } = await params;
  const run = await cognitionPrisma.simulationRun.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!run) notFound();

  const snap = await buildSimulationObserverSnapshot(id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/dashboard" className="text-sm text-amber-900 hover:underline">
          ← Admin
        </Link>
        <PageHeader
          title="Simulation run observer"
          description="Persisted simulation output summary: overrides, pressure stacks, diff from base, optional prose preview."
        />
      </div>

      <section className="rounded-xl border border-stone-200 bg-stone-900 p-4 shadow-sm">
        <pre className="max-h-[70vh] overflow-auto text-xs text-stone-100">{JSON.stringify(snap, null, 2)}</pre>
      </section>
    </div>
  );
}
