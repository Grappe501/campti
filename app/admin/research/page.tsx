import { PageHeader } from "@/components/page-header";
import { ResearchWorkbenchClient } from "@/components/admin/research-workbench-client";
import { parseResearchWorkbenchUrlState } from "@/lib/domain/research-workbench-nav";
import { loadResearchWorkbenchDashboardFromRoute } from "@/lib/services/research-workbench-route-load-service";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ResearchWorkbenchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = parseResearchWorkbenchUrlState(sp);
  const dashboard = await loadResearchWorkbenchDashboardFromRoute(filters);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <PageHeader
        title="Research and canon reconciliation"
        description="RICRE workbench — ingest external material, extract heuristic claims, compare to canon, and record author decisions. No silent canon writes."
      />
      <ResearchWorkbenchClient initialDashboard={dashboard} />
    </div>
  );
}
