import { SceneResearchTabClient } from "@/components/admin/scene-research-tab-client";
import { loadSceneResearchTab } from "@/lib/services/scene-research-tab-loader-service";

export async function SceneResearchTabSection({ sceneId }: { sceneId: string }) {
  const model = await loadSceneResearchTab(sceneId);
  if (!model) {
    return <p className="text-sm text-red-800">Scene not found for research tab.</p>;
  }
  return <SceneResearchTabClient initial={model} sceneId={sceneId} />;
}
