import { z } from "zod";

import { CharacterMindProfileSchema } from "@/lib/domain/character-mind";
import { CharacterVoiceProfileSchema } from "@/lib/domain/character-voice";
import {
  CHARACTER_SIMULATION_PREVIEW_MODES,
  type CharacterSimulationValidationIssue,
  type CharacterSimulationValidationResult,
  type CharacterSimulationWorkbenchMeta,
} from "@/lib/domain/character-simulation-workbench";

export const CharacterSimulationWorkbenchMetaSchema = z
  .object({
    authorNotes: z.array(z.string().max(2000)).max(200).optional(),
    acceptedConflictIds: z.array(z.string().max(200)).max(500).optional(),
  })
  .strict();

export const CharacterSimulationPreviewRequestSchema = z.object({
  mode: z.enum(CHARACTER_SIMULATION_PREVIEW_MODES),
  stimulus: z.string().min(3).max(2000),
});

export const AuthorMindPartialSchema = CharacterMindProfileSchema.partial();
export const AuthorVoicePartialSchema = CharacterVoiceProfileSchema.partial();

function pushIssue(
  issues: CharacterSimulationValidationIssue[],
  path: string,
  code: string,
  message: string,
  severity: CharacterSimulationValidationIssue["severity"]
) {
  issues.push({ path, code, message, severity });
}

/**
 * Shape validation (Zod) + semantic checks for author-owned partials.
 */
export function validateAuthorMindPartialShape(patch: unknown): CharacterSimulationValidationResult {
  const parsed = AuthorMindPartialSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join(".") || "mind",
        code: i.code,
        message: i.message,
        severity: "error" as const,
      })),
    };
  }
  return validateAuthorMindPartialSemantic(parsed.data);
}

export function validateAuthorVoicePartialShape(patch: unknown): CharacterSimulationValidationResult {
  const parsed = AuthorVoicePartialSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join(".") || "voice",
        code: i.code,
        message: i.message,
        severity: "error" as const,
      })),
    };
  }
  return validateAuthorVoicePartialSemantic(parsed.data);
}

export function validateAuthorMindPartialSemantic(
  m: z.infer<typeof AuthorMindPartialSchema>
): CharacterSimulationValidationResult {
  const issues: CharacterSimulationValidationIssue[] = [];

  if (m.changeResistance !== undefined) {
    if (m.changeResistance < 0 || m.changeResistance > 1) {
      pushIssue(issues, "changeResistance", "range", "changeResistance must be between 0 and 1.", "error");
    }
  }

  if (m.fearProfile?.fearActivationThreshold !== undefined) {
    const t = m.fearProfile.fearActivationThreshold;
    if (t < 0 || t > 1) {
      pushIssue(issues, "fearProfile.fearActivationThreshold", "range", "Fear activation threshold must be between 0 and 1.", "error");
    }
  }

  if (m.memoryWeightMap) {
    for (const [k, v] of Object.entries(m.memoryWeightMap)) {
      if (typeof v === "number" && (v < 0 || v > 1)) {
        pushIssue(issues, `memoryWeightMap.${k}`, "range", "Memory weights should stay within 0–1 for stable runtime geometry.", "warning");
      }
    }
  }

  const core = m.beliefSystem?.coreBeliefs;
  const brittle = m.beliefSystem?.brittleAssumptions;
  if (core && brittle) {
    const overlap = core.filter((b) => brittle.includes(b));
    if (overlap.length) {
      pushIssue(issues, "beliefSystem", "contradiction", "A string appears in both core beliefs and brittle assumptions — clarify which is load-bearing.", "warning");
    }
  }

  if (m.conflictStyle && m.attachmentStyle) {
    const c = m.conflictStyle.toLowerCase();
    const a = m.attachmentStyle.toLowerCase();
    if (c.includes("explosive") && a.includes("avoidant")) {
      pushIssue(issues, "conflictStyle", "temperament", "Explosive conflict style with avoidant attachment is plausible but narratively volatile — confirm intent.", "warning");
    }
  }

  return { ok: issues.every((i) => i.severity !== "error"), issues };
}

export function validateAuthorVoicePartialSemantic(
  v: z.infer<typeof AuthorVoicePartialSchema>
): CharacterSimulationValidationResult {
  const issues: CharacterSimulationValidationIssue[] = [];

  if (v.tabooBoundaries && v.metaphorDomain) {
    const taboo = v.tabooBoundaries.join(" ").toLowerCase();
    const meta = v.metaphorDomain.toLowerCase();
    if (taboo.includes("animal") && meta.includes("animal")) {
      pushIssue(issues, "voice", "voice_register_conflict", "Metaphor domain emphasizes animals while taboo boundaries also target animal imagery — tighten register.", "warning");
    }
  }

  return { ok: issues.every((i) => i.severity !== "error"), issues };
}

export function mergeValidationResults(...results: CharacterSimulationValidationResult[]): CharacterSimulationValidationResult {
  const issues = results.flatMap((r) => r.issues);
  return { ok: issues.every((i) => i.severity !== "error") && results.every((r) => r.ok), issues };
}

export function parseWorkbenchMeta(raw: unknown): CharacterSimulationWorkbenchMeta {
  const parsed = CharacterSimulationWorkbenchMetaSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}
