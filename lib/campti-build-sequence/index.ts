export type { CamptiBuildStage } from "./types";
export { CAMPTI_BUILD_STAGES } from "./stages";
export { CAMPTI_UNIVERSAL_CURSOR_RULES, CAMPTI_MASTER_BUILD_LAW } from "./universal-rules";

import { CAMPTI_BUILD_STAGES } from "./stages";

export function getBuildStageByNumber(n: number) {
  return CAMPTI_BUILD_STAGES.find((s) => s.stage === n) ?? null;
}

export function getBuildStageById(id: string) {
  return CAMPTI_BUILD_STAGES.find((s) => s.id === id) ?? null;
}
