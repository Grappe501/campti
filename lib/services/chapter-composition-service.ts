import {
  type ChapterComposition,
  ChapterCompositionSchema,
  type SceneThreadBinding,
} from "@/lib/domain/narrative-thread";

export class ChapterCompositionService {
  compose(input: {
    chapterId: string;
    chapterStateId: string;
    scenes: SceneThreadBinding[];
    chapterClosureProfile: string;
    chapterCarryForwardProfile: string;
  }): ChapterComposition {
    const dominantThreads = this.rankThreads(input.scenes, "activeThreadIds");
    const latentThreads = this.rankThreads(input.scenes, "latentThreadIds");
    const callbackThreads = this.rankThreads(input.scenes, "callbackThreadIds");
    const convergingThreads = this.rankConvergenceThreads(input.scenes);
    const sceneTransitions = input.scenes.map((scene) => scene.transitionToNextScene);
    const sceneContrastLogic = this.buildContrastLogic(input.scenes);

    return ChapterCompositionSchema.parse({
      artifact: "chapter_composition",
      chapterId: input.chapterId,
      chapterStateId: input.chapterStateId,
      sceneSequence: input.scenes,
      dominantThreads,
      latentThreads,
      callbackThreads,
      convergingThreads,
      sceneTransitions,
      sceneContrastLogic,
      chapterClosureProfile: input.chapterClosureProfile,
      chapterCarryForwardProfile: input.chapterCarryForwardProfile,
    });
  }

  hasSeemingDisconnectionSupport(composition: ChapterComposition): boolean {
    const disconnectedCandidates = composition.sceneSequence.filter(
      (scene) => scene.activeThreadIds.length > 0 && scene.echoNodeIds.length === 0,
    );
    if (disconnectedCandidates.length === 0) return false;
    const convergenceKeys = new Set(composition.sceneSequence.flatMap((scene) => scene.hiddenConvergenceKeys));
    return convergenceKeys.size > 0 && composition.convergingThreads.length > 0;
  }

  private rankThreads(scenes: SceneThreadBinding[], key: keyof Pick<SceneThreadBinding, "activeThreadIds" | "latentThreadIds" | "callbackThreadIds">): string[] {
    const counts = new Map<string, number>();
    for (const scene of scenes) {
      for (const threadId of scene[key]) {
        counts.set(threadId, (counts.get(threadId) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([threadId]) => threadId);
  }

  private rankConvergenceThreads(scenes: SceneThreadBinding[]): string[] {
    const byBinding = new Map<string, Set<string>>();
    for (const scene of scenes) {
      for (const binding of scene.delayedConvergenceBindings) {
        const set = byBinding.get(binding) ?? new Set<string>();
        for (const threadId of scene.activeThreadIds.concat(scene.latentThreadIds, scene.callbackThreadIds)) {
          set.add(threadId);
        }
        byBinding.set(binding, set);
      }
    }
    const ranked = Array.from(byBinding.values()).flatMap((set) => Array.from(set));
    return Array.from(new Set(ranked));
  }

  private buildContrastLogic(scenes: SceneThreadBinding[]): string[] {
    if (scenes.length < 2) return ["Single scene chapter; contrast logic minimal."];
    const lines: string[] = [];
    for (let index = 1; index < scenes.length; index += 1) {
      const prev = scenes[index - 1];
      const current = scenes[index];
      lines.push(
        `Scene ${prev.sceneId} -> ${current.sceneId}: active mix ${prev.activeThreadIds.length}/${current.activeThreadIds.length}, latent carry ${current.latentThreadIds.length}.`,
      );
    }
    return lines;
  }
}
