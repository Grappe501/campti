import { SceneDecisionAssistClient } from "@/components/admin/scene-decision-assist-client";
import { buildSceneDecisionAssistViewModel } from "@/lib/services/scene-decision-assist-service";

export async function SceneDecisionAssistTabSection({ sceneId }: { sceneId: string }) {
  const vm = await buildSceneDecisionAssistViewModel(sceneId);
  if (!vm) {
    return <p className="text-sm text-red-800">Could not load decision assist for this scene.</p>;
  }
  return <SceneDecisionAssistClient sceneId={sceneId} initial={vm} />;
}
