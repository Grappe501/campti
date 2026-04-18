import Link from "next/link";
import { notFound } from "next/navigation";

import { CharacterSimulationWorkbenchClient } from "@/components/admin/character-simulation-workbench-client";
import { PageHeader } from "@/components/page-header";
import { getPersonById } from "@/lib/data-access";
import { loadCharacterSimulationWorkbenchViewModel } from "@/lib/services/character-simulation-workbench-load-service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CharacterSimulationWorkbenchPage({ params }: Props) {
  const { id } = await params;
  const person = await getPersonById(id);
  if (!person) notFound();

  const view = await loadCharacterSimulationWorkbenchViewModel(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div>
        <Link href={`/admin/people/${id}`} className="text-sm text-amber-900 hover:underline">
          ← {person.name}
        </Link>
        <PageHeader
          title="Character Simulation Workbench"
          description="Author-owned Cluster-8 mind/voice truth, validated, compared to seed, and persisted on CharacterSimulationAuthorBundle — same merge path as canonical scene generation."
        />
      </div>

      <CharacterSimulationWorkbenchClient personId={id} initialView={view} />
    </div>
  );
}
