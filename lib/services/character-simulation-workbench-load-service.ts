import { Prisma } from "@prisma/client";

import { CharacterMindProfileSchema, type CharacterMindProfile } from "@/lib/domain/character-mind";
import { CharacterVoiceProfileSchema, type CharacterVoiceProfile } from "@/lib/domain/character-voice";
import type {
  CharacterSimulationAuthorEditableProfile,
  CharacterSimulationWorkbenchViewModel,
} from "@/lib/domain/character-simulation-workbench";
import {
  mergeValidationResults,
  parseWorkbenchMeta,
  validateAuthorMindPartialSemantic,
  validateAuthorMindPartialShape,
  validateAuthorVoicePartialSemantic,
  validateAuthorVoicePartialShape,
} from "@/lib/domain/character-simulation-workbench-validation";
import { prisma } from "@/lib/prisma";
import { listCharacterSimulationAuditLogs } from "@/lib/services/character-simulation-workbench-audit-service";
import { detectCharacterSimulationConflicts } from "@/lib/services/character-simulation-workbench-conflict-service";
import {
  buildCharacterSimulationFieldStatuses,
  buildCharacterSimulationProvenanceTimeline,
} from "@/lib/services/character-simulation-workbench-provenance-service";
import {
  buildCharacterSimulationDriftSummary,
  deriveCharacterSimulationReadinessImpact,
} from "@/lib/services/character-simulation-workbench-readiness-impact-service";
import { CharacterMindSeedService } from "@/lib/services/character-mind-seed-service";

const seedSvc = new CharacterMindSeedService();

function authorPayloadPresent(m: Partial<CharacterMindProfile>, v: Partial<CharacterVoiceProfile>, notes: string[]): boolean {
  const mk = Object.keys(m).filter((k) => m[k as keyof CharacterMindProfile] !== undefined).length;
  const vk = Object.keys(v).filter((k) => v[k as keyof CharacterVoiceProfile] !== undefined).length;
  return mk > 0 || vk > 0 || notes.length > 0;
}

export async function loadCharacterSimulationWorkbenchViewModel(personId: string): Promise<CharacterSimulationWorkbenchViewModel> {
  let migrationRequired = false;
  let person: {
    id: string;
    name: string;
    recordType: string;
    birthYear: number | null;
    deathYear: number | null;
    characterSimulationAuthorBundle: {
      id: string;
      updatedAt: Date;
      simulationMindProfileJson: unknown;
      simulationVoiceProfileJson: unknown;
      workbenchMetaJson: unknown;
    } | null;
  } | null = null;

  try {
    person = await prisma.person.findUnique({
      where: { id: personId },
      select: {
        id: true,
        name: true,
        recordType: true,
        birthYear: true,
        deathYear: true,
        characterSimulationAuthorBundle: {
          select: {
            id: true,
            updatedAt: true,
            simulationMindProfileJson: true,
            simulationVoiceProfileJson: true,
            workbenchMetaJson: true,
          },
        },
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const missingRelationOrColumn =
      (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.code === "P2022")) ||
      msg.includes("workbenchMetaJson") ||
      msg.includes("CharacterSimulationAuditLog");
    if (missingRelationOrColumn) {
      migrationRequired = true;
    } else {
      throw e;
    }
  }

  if (!person && !migrationRequired) {
    throw new Error(`Person not found: ${personId}`);
  }

  if (migrationRequired || !person) {
    return buildMigrationDegradedView(personId);
  }

  const bundle = person.characterSimulationAuthorBundle;
  const mindParsed = CharacterMindProfileSchema.partial().safeParse(bundle?.simulationMindProfileJson ?? {});
  const voiceParsed = CharacterVoiceProfileSchema.partial().safeParse(bundle?.simulationVoiceProfileJson ?? {});
  const mindPartial: Partial<CharacterMindProfile> = mindParsed.success ? mindParsed.data : {};
  const voicePartial: Partial<CharacterVoiceProfile> = voiceParsed.success ? voiceParsed.data : {};

  const meta = parseWorkbenchMeta(bundle?.workbenchMetaJson ?? {});
  const authorNotes = meta.authorNotes ?? [];

  const seedMind = seedSvc.buildMindProfile({ characterId: person.id, displayLabel: person.name });
  const seedVoice = seedSvc.buildVoiceProfile({ characterId: person.id, displayLabel: person.name });
  const mergedMind = seedSvc.mergeMindProfile(seedMind, mindPartial);
  const mergedVoice = seedSvc.mergeVoiceProfile(seedVoice, voicePartial);

  const shapeMind = validateAuthorMindPartialShape(mindPartial);
  const shapeVoice = validateAuthorVoicePartialShape(voicePartial);
  const semMind = validateAuthorMindPartialSemantic(mindPartial);
  const semVoice = validateAuthorVoicePartialSemantic(voicePartial);
  const validation = mergeValidationResults(shapeMind, shapeVoice, semMind, semVoice);

  const conflicts = detectCharacterSimulationConflicts({
    seedMind,
    seedVoice,
    authorMindPartial: mindPartial,
    authorVoicePartial: voicePartial,
    meta,
    personBirthYear: person.birthYear,
    personDeathYear: person.deathYear,
  });

  const readinessImpact = deriveCharacterSimulationReadinessImpact({
    conflicts,
    validationOk: validation.ok,
    migrationRequired: false,
  });

  const hasAuthorPayload = authorPayloadPresent(mindPartial, voicePartial, authorNotes);

  const drift = buildCharacterSimulationDriftSummary({
    conflicts,
    migrationRequired: false,
    authorBundleRowExists: Boolean(bundle),
    hasAuthorPayload,
  });

  const fieldStatuses = buildCharacterSimulationFieldStatuses({
    seedMind,
    seedVoice,
    authorMindPartial: mindPartial,
    authorVoicePartial: voicePartial,
    mergedMind,
    mergedVoice,
  });

  const provenance = buildCharacterSimulationProvenanceTimeline({
    bundleUpdatedAtIso: bundle?.updatedAt.toISOString() ?? null,
    hasAuthorMind: Object.keys(mindPartial).length > 0,
    hasAuthorVoice: Object.keys(voicePartial).length > 0,
  });

  const audit = await listCharacterSimulationAuditLogs({ personId, take: 25 });

  const authorEditable: CharacterSimulationAuthorEditableProfile = {
    mindPartial,
    voicePartial,
    authorNotes,
  };

  const mindKeys = Object.keys(mindPartial).filter((k) => mindPartial[k as keyof CharacterMindProfile] !== undefined).length;
  const voiceKeys = Object.keys(voicePartial).filter((k) => voicePartial[k as keyof CharacterVoiceProfile] !== undefined).length;
  const headerTruth: CharacterSimulationWorkbenchViewModel["header"]["simulationTruthSource"] = !hasAuthorPayload
    ? "deterministic_seed_only"
    : mindKeys > 0 && voiceKeys > 0
      ? "persisted_author_partial"
      : "mixed_bundle";

  return {
    contractVersion: "1",
    header: {
      personId: person.id,
      name: person.name,
      recordType: person.recordType,
      simulationTruthSource: headerTruth,
      readinessImpact,
      lastAuthorBundleUpdatedAtIso: bundle?.updatedAt.toISOString() ?? null,
      auditEntryCount: audit.ok ? audit.rows.length : 0,
    },
    authorEditable,
    derived: { mind: seedMind, voice: seedVoice },
    merged: { mind: mergedMind, voice: mergedVoice },
    fieldStatuses,
    conflicts,
    validation,
    provenance,
    drift,
    auditRecent: audit.ok
      ? audit.rows.map((r) => ({
          id: r.id,
          createdAtIso: r.createdAt.toISOString(),
          action: r.action,
          summary: r.summary,
          actorNote: r.actorNote,
        }))
      : [],
    previewMetadata: {
      lastPreview: null,
      honestCapabilityNote:
        "Preview Lab uses deterministic synthesis from merged mind/voice — not runSceneGeneration and not an LLM call.",
    },
  };
}

function buildMigrationDegradedView(personId: string): CharacterSimulationWorkbenchViewModel {
  const seedMind = seedSvc.buildMindProfile({ characterId: personId, displayLabel: personId });
  const seedVoice = seedSvc.buildVoiceProfile({ characterId: personId, displayLabel: personId });
  const readinessImpact = deriveCharacterSimulationReadinessImpact({
    conflicts: [],
    validationOk: true,
    migrationRequired: true,
  });
  return {
    contractVersion: "1",
    header: {
      personId,
      name: personId,
      recordType: "unknown",
      simulationTruthSource: "deterministic_seed_only",
      readinessImpact,
      lastAuthorBundleUpdatedAtIso: null,
      auditEntryCount: 0,
    },
    authorEditable: { mindPartial: {}, voicePartial: {}, authorNotes: [] },
    derived: { mind: seedMind, voice: seedVoice },
    merged: { mind: seedMind, voice: seedVoice },
    fieldStatuses: buildCharacterSimulationFieldStatuses({
      seedMind,
      seedVoice,
      authorMindPartial: {},
      authorVoicePartial: {},
      mergedMind: seedMind,
      mergedVoice: seedVoice,
    }),
    conflicts: [],
    validation: { ok: true, issues: [] },
    provenance: buildCharacterSimulationProvenanceTimeline({
      bundleUpdatedAtIso: null,
      hasAuthorMind: false,
      hasAuthorVoice: false,
    }),
    drift: buildCharacterSimulationDriftSummary({
      conflicts: [],
      migrationRequired: true,
      authorBundleRowExists: false,
      hasAuthorPayload: false,
    }),
    auditRecent: [],
    previewMetadata: {
      lastPreview: null,
      honestCapabilityNote:
        "Database migration for CharacterSimulationAuthorBundle / audit is not applied — persistence and audit are unavailable; showing seed-only inspection.",
    },
  };
}
