/**
 * Constitutional enforcement facade (Stage 1 — Constitutional Core).
 *
 * Future attachment (not implemented in this stage):
 * - Scenes: SceneReadiness / SceneConstraintSet / draft pipelines query active rules; BLOCKING rows prevent drafting
 *   when `validateAgainstRules` reports blocking messages (ties to DraftEligibility + composition readiness).
 * - Characters: CharacterProfile + CharacterChoiceProfile / constraint+trigger layers inherit rules where `scope` is CHARACTER or ENTITY (Character Engine validates actions against ConstitutionalRule in later stages).
 * - Branches: BranchCondition / deterministic paths evaluated against DETERMINISM + AMBIGUITY rules.
 * - Voice engine: NarrativeVoiceProfile + prose helpers consult VOICE + THEOLOGY (+ REVEAL where narrator-bound).
 *
 * Severity:
 * - BLOCKING: must prevent the gated action (e.g. draft) when validation fails; surfaced as hard errors.
 * - WARNING: non-blocking; show in admin (Brain, scene workspace, constitutional list) as diagnostics.
 * - INFO: advisory only; optional UI surfacing.
 */

import type { RuleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ConstitutionalValidationContext, RuleValidationResult } from "@/lib/constitutional-rule-types";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** All active constitutional rules (for enforcement and admin). */
export async function getActiveRules() {
  return safe(
    () =>
      prisma.constitutionalRule.findMany({
        where: { isActive: true },
        orderBy: [{ ruleType: "asc" }, { key: "asc" }],
      }),
    [],
  );
}

/** Rules filtered by policy kind (Truth, Voice, …). */
export async function getRulesByType(type: RuleType) {
  return safe(
    () =>
      prisma.constitutionalRule.findMany({
        where: { ruleType: type },
        orderBy: [{ isActive: "desc" }, { key: "asc" }],
      }),
    [],
  );
}

/**
 * Stub for future cross-cutting validation (claims, drafts, branch picks, voice output).
 * Returns permissive defaults until Stage 12–14 wire real checks.
 */
export async function validateAgainstRules(
  input: unknown,
  context: ConstitutionalValidationContext,
): Promise<RuleValidationResult> {
  void input;
  void context;
  return { ok: true, warnings: [], blocking: [] };
}
