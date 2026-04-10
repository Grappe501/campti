export type { CamptiMasterRegistry, RegistryImplementationStatus, RegistrySurface } from "./types";
export { CAMPTI_MASTER_REGISTRIES } from "./definitions";
export {
  REGISTRY_BUILD_PHASES,
  getCursorBuildSequence,
  registriesByPhase,
  type CursorBuildTask,
} from "./build-sequence";

import { CAMPTI_MASTER_REGISTRIES } from "./definitions";

export function getRegistryById(id: string) {
  return CAMPTI_MASTER_REGISTRIES.find((r) => r.id === id) ?? null;
}

export function listRegistryIds(): string[] {
  return CAMPTI_MASTER_REGISTRIES.map((r) => r.id);
}
