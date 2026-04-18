import type { SceneMachineLaunchPolicy } from "@/lib/domain/scene-guarded-launch";
import { DEFAULT_SCENE_MACHINE_LAUNCH_POLICY } from "@/lib/domain/scene-guarded-launch";

/**
 * Cluster 9 dry-run: mutating rehearsal uses the same default machine risk posture as repair jobs.
 */
export const CLUSTER9_REHEARSAL_MACHINE_POLICY: SceneMachineLaunchPolicy = DEFAULT_SCENE_MACHINE_LAUNCH_POLICY;
