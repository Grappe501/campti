import { SceneRunLedgerClient } from "@/components/admin/scene-run-ledger-client";
import { prisma } from "@/lib/prisma";
import { buildSceneDecisionAssistViewModel } from "@/lib/services/scene-decision-assist-service";
import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";
import { preflightVmToGuardResult } from "@/lib/services/scene-launch-guard-service";
import { loadSceneRunLedger } from "@/lib/services/scene-run-ledger-service";
import { buildSceneRunOutcomeAnalytics } from "@/lib/services/scene-run-outcome-analytics-service";

export async function SceneRunLedgerTabSection({ sceneId }: { sceneId: string }) {
  const [ledger, scene, model, analytics, decisionAssist] = await Promise.all([
    loadSceneRunLedger(sceneId, 60),
    prisma.scene.findUnique({ where: { id: sceneId }, select: { description: true } }),
    buildSceneGenerationPreflight(sceneId),
    buildSceneRunOutcomeAnalytics(sceneId, 80),
    buildSceneDecisionAssistViewModel(sceneId, { maxLedgerEntries: 80 }),
  ]);
  if (!model) {
    return <p className="text-sm text-red-800">Scene not found for run ledger.</p>;
  }
  const initialGuard = preflightVmToGuardResult(scene?.description ?? null, model);
  return (
    <SceneRunLedgerClient
      sceneId={sceneId}
      initialLedger={ledger}
      initialGuard={initialGuard}
      initialAnalytics={analytics}
      initialDecisionAssist={decisionAssist}
      sceneTitle={scene?.description ?? null}
    />
  );
}
