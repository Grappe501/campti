import { ScenePreflightTabClient } from "@/components/admin/scene-preflight-tab-client";
import { prisma } from "@/lib/prisma";
import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";
import { preflightVmToGuardResult } from "@/lib/services/scene-launch-guard-service";

export async function ScenePreflightTabSection({ sceneId }: { sceneId: string }) {
  const [scene, model] = await Promise.all([
    prisma.scene.findUnique({ where: { id: sceneId }, select: { description: true } }),
    buildSceneGenerationPreflight(sceneId),
  ]);
  if (!model) {
    return <p className="text-sm text-red-800">Scene not found for preflight.</p>;
  }
  const initialGuard = preflightVmToGuardResult(scene?.description ?? null, model);
  return (
    <ScenePreflightTabClient
      initial={model}
      initialGuard={initialGuard}
      sceneId={sceneId}
      sceneTitle={scene?.description ?? null}
    />
  );
}
