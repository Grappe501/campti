import type { CharacterState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CharacterChoiceContext } from "@/lib/character-types";
import { applyWorldConstraints } from "@/lib/character-world-constraints";
import { warnIfCharacterStateMissingWorldContext } from "@/lib/world-context-validation";
import { profileJsonFieldToFormText } from "@/lib/profile-json";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getCharacterProfile(personId: string) {
  return safe(
    () => prisma.characterProfile.findUnique({ where: { personId } }),
    null,
  );
}

export async function getCharacterStates(personId: string) {
  return safe(
    () =>
      prisma.characterState.findMany({
        where: { personId },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

/** Latest state for a label, or the most recently updated state when `label` is omitted. */
export async function getActiveCharacterState(personId: string, label?: string) {
  return safe(
    () =>
      prisma.characterState.findFirst({
        where: { personId, ...(label ? { label } : {}) },
        orderBy: { updatedAt: "desc" },
        include: { worldState: true },
      }),
    null,
  );
}

/** World-era JSON slices for a labelled character state (admin / engine inspection). */
export async function getCharacterWorldContext(personId: string, stateLabel: string) {
  return safe(
    async () => {
      const state = await prisma.characterState.findFirst({
        where: { personId, label: stateLabel },
        orderBy: { updatedAt: "desc" },
        include: { worldState: true },
      });
      if (!state) return null;
      warnIfCharacterStateMissingWorldContext(state, `getCharacterWorldContext:${stateLabel}`);
      return {
        worldStateId: state.worldStateId,
        worldState: state.worldState,
        environmentSnapshot: state.environmentSnapshot,
        powerContext: state.powerContext,
        economicContext: state.economicContext,
        socialContext: state.socialContext,
        environmentSnapshotText: profileJsonFieldToFormText(state.environmentSnapshot),
        powerContextText: profileJsonFieldToFormText(state.powerContext),
        economicContextText: profileJsonFieldToFormText(state.economicContext),
        socialContextText: profileJsonFieldToFormText(state.socialContext),
      };
    },
    null,
  );
}

/**
 * Future: combine CharacterState world slice + PlaceState + RiskRegime for affordances.
 * TODO: Apply world constraints to decision engine
 */
export function evaluateCharacterInWorld(_personId: string, _worldStateId: string | null): { stub: true } {
  return { stub: true };
}

export async function getCharacterConstraints(personId: string) {
  return safe(
    () =>
      prisma.characterConstraint.findMany({
        where: { personId },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export async function getCharacterTriggers(personId: string) {
  return safe(
    () =>
      prisma.characterTrigger.findMany({
        where: { personId },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export async function getCharacterPerception(personId: string) {
  return safe(
    () => prisma.characterPerceptionProfile.findUnique({ where: { personId } }),
    null,
  );
}

export async function getCharacterVoice(personId: string) {
  return safe(
    () => prisma.characterVoiceProfile.findUnique({ where: { personId } }),
    null,
  );
}

export async function getCharacterChoiceProfile(personId: string) {
  return safe(
    () => prisma.characterChoiceProfile.findUnique({ where: { personId } }),
    null,
  );
}

/**
 * Future: Scene engine + CharacterChoiceProfile — enumerate legal options from
 * constraints, triggers, state pressure, and constitutional law.
 */
export function evaluateCharacterChoiceSpace(
  _personId: string,
  _context: CharacterChoiceContext,
): { stub: true } {
  return { stub: true };
}

/** Decision pathway hook — call before enumerating choices once CharacterState is loaded. */
export function evaluateCharacterChoiceSpaceWithWorld(
  characterState: CharacterState,
  worldContext: unknown,
): ReturnType<typeof evaluateCharacterChoiceSpace> {
  applyWorldConstraints(characterState, worldContext);
  return evaluateCharacterChoiceSpace(characterState.personId, {} as CharacterChoiceContext);
}

/**
 * Future: Branch engine — match trigger patterns against scene context / events.
 */
export function applyTriggers(_personId: string, _context: CharacterChoiceContext): { stub: true } {
  return { stub: true };
}

/**
 * Future: Perception engine — filter scene truth through CharacterPerceptionProfile + NarrativePermissionProfile.
 */
export function resolveCharacterPerception(
  _personId: string,
  _context: CharacterChoiceContext,
): { stub: true } {
  return { stub: true };
}
