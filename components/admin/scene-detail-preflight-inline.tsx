import Link from "next/link";

import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";

export async function SceneDetailPreflightInline({ sceneId }: { sceneId: string }) {
  const model = await buildSceneGenerationPreflight(sceneId);
  if (!model) return null;
  const { summary } = model;
  const bar =
    summary.launchAllowance === "blocked"
      ? "border-rose-200 bg-rose-50 text-rose-950"
      : summary.launchAllowance === "allowed_with_risk"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-emerald-200 bg-emerald-50 text-emerald-950";

  return (
    <div className={`rounded-xl border p-4 text-sm shadow-sm ${bar}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Scene generation preflight</p>
      <p className="mt-1 font-medium">{summary.headline}</p>
      <p className="mt-1 text-xs opacity-90">
        Allowance: {summary.launchAllowance.replaceAll("_", " ")} · Blockers {summary.primaryBlockerCount} · Risks {summary.primaryRiskCount}
      </p>
      <Link href={`/admin/scenes/${sceneId}?tab=preflight`} className="mt-2 inline-block text-xs font-semibold underline">
        Open Preflight tab
      </Link>
    </div>
  );
}
