import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import {
  SCENE_GENERATION_PREFLIGHT_CONTRACT_VERSION,
  type SceneGenerationAdvisory,
  type SceneGenerationBlocker,
  type SceneGenerationHashSummary,
  type SceneGenerationInputTruthSummary,
  type SceneGenerationObservation,
  type SceneGenerationPreflightSummary,
  type SceneGenerationPreflightViewModel,
  type SceneGenerationRisk,
  type SceneGenerationSubsystemKey,
  type SceneGenerationSubsystemStatus,
} from "@/lib/domain/scene-generation-preflight";
import { deriveLaunchAllowance, deriveOverallReadinessClass } from "@/lib/domain/scene-generation-preflight-rules";
import { prisma } from "@/lib/prisma";
import { computeSceneGenerationInputHash, SCENE_GENERATION_HASH_SCHEME_V1 } from "@/lib/scene-generation/canonical-scene-generation-hash";
import { buildCharacterSimulationWorkbenchSceneRollup } from "@/lib/services/character-simulation-workbench-scene-aggregate-service";
import { CharacterSimulationRuntimeDerivationService } from "@/lib/services/character-simulation-runtime-service";
import { loadPersistedCharacterSimulationProfilesForPersonIds } from "@/lib/services/character-simulation-author-bundle-load-service";
import { buildEnforcementRegistry } from "@/lib/services/enforcement-registry-service";
import { HumanGravityRuntimeDerivationService } from "@/lib/services/human-gravity-runtime-derivation-service";
import { prepareCanonicalPreGenerationBundleForScene } from "@/lib/services/scene-generation-governance-input-adapter";
import { loadSceneGenerationInput } from "@/lib/services/scene-generation-input-loader";
import { summarizeRicreForScene } from "@/lib/services/ricre-canon-knowledge-loader-service";

function ss(
  partial: Omit<SceneGenerationSubsystemStatus, "subsystemKey"> & { subsystemKey: SceneGenerationSubsystemKey },
): SceneGenerationSubsystemStatus {
  return {
    subsystemKey: partial.subsystemKey,
    readinessClass: partial.readinessClass,
    title: partial.title,
    explanation: partial.explanation,
    evidenceSummary: partial.evidenceSummary,
    isBlocker: partial.isBlocker,
    isDowngradeRisk: partial.isDowngradeRisk,
    isAdvisory: partial.isAdvisory,
    isObservationalOnly: partial.isObservationalOnly,
    remediationGuidance: partial.remediationGuidance ?? null,
    remediationHref: partial.remediationHref ?? null,
    remediationLabel: partial.remediationLabel ?? null,
  };
}

/**
 * Canonical scene-generation preflight: assembles real signals from loaders (no LLM call, no Cluster 7 envelope).
 */
export async function buildSceneGenerationPreflight(sceneId: string): Promise<SceneGenerationPreflightViewModel | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, chapterId: true, persons: { select: { id: true } } },
  });
  if (!scene) return null;

  const evaluatedAtIso = new Date().toISOString();
  const personIds = scene.persons.map((p) => p.id);

  let merged: SceneGenerationInput | null = null;
  let loadError: string | null = null;
  try {
    const base = await loadSceneGenerationInput(sceneId, {}, { includeSocialFieldGeneration: true });
    const pre = await prepareCanonicalPreGenerationBundleForScene(sceneId);
    let m: SceneGenerationInput = { ...base, canonicalPreGeneration: pre };
    const hg = new HumanGravityRuntimeDerivationService().deriveFromSceneGenerationInput(m);
    m = { ...m, humanGravityRuntime: hg ?? undefined };
    const persisted = await loadPersistedCharacterSimulationProfilesForPersonIds(personIds);
    m = { ...m, persistedCharacterSimulationProfiles: Object.keys(persisted).length ? persisted : null };
    const rt = new CharacterSimulationRuntimeDerivationService().derive(m);
    m = { ...m, characterSimulationRuntime: rt ?? undefined };
    merged = m;
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  const subsystems: SceneGenerationSubsystemStatus[] = [];
  const blockers: SceneGenerationBlocker[] = [];
  const risks: SceneGenerationRisk[] = [];
  const advisories: SceneGenerationAdvisory[] = [];
  const observations: SceneGenerationObservation[] = [];

  const pushBlocker = (b: Omit<SceneGenerationBlocker, "id"> & { id?: string }) => {
    const id = b.id ?? `${b.subsystemKey}:${b.title}`.replace(/\s+/g, "_").slice(0, 80);
    blockers.push({ id, ...b });
  };
  const pushRisk = (r: Omit<SceneGenerationRisk, "id"> & { id?: string }) => {
    const id = r.id ?? `${r.subsystemKey}:${r.title}`.replace(/\s+/g, "_").slice(0, 80);
    risks.push({ id, ...r });
  };
  const pushAdvisory = (a: Omit<SceneGenerationAdvisory, "id"> & { id?: string }) => {
    const id = a.id ?? `${a.subsystemKey}:${a.title}`.replace(/\s+/g, "_").slice(0, 80);
    advisories.push({ id, ...a });
  };
  const pushObs = (o: Omit<SceneGenerationObservation, "id"> & { id?: string }) => {
    const id = o.id ?? `${o.subsystemKey}:obs`.replace(/\s+/g, "_");
    observations.push({ id, ...o });
  };

  // --- scene_input ---
  if (!merged) {
    subsystems.push(
      ss({
        subsystemKey: "scene_input",
        readinessClass: "blocked",
        title: "Scene generation input",
        explanation: "Failed to assemble `SceneGenerationInput` for this scene.",
        evidenceSummary: loadError ?? "unknown_error",
        isBlocker: true,
        isDowngradeRisk: false,
        isAdvisory: false,
        isObservationalOnly: false,
        remediationGuidance: "Fix contract/world-state linkage errors, then re-run preflight.",
        remediationHref: `/admin/scenes/${sceneId}`,
        remediationLabel: "Edit scene",
      }),
    );
    pushBlocker({
      subsystemKey: "scene_input",
      title: "Scene input load failed",
      explanation: loadError ?? "loadSceneGenerationInput threw.",
      remediationGuidance: "Resolve the loader error (chapter, world state, contract validation).",
      remediationHref: `/admin/scenes/${sceneId}`,
      remediationLabel: "Scene detail",
    });
  } else {
    const srcCount = merged.sourceIdsUsed?.length ?? 0;
    subsystems.push(
      ss({
        subsystemKey: "scene_input",
        readinessClass: "ready",
        title: "Scene generation input",
        explanation: "`loadSceneGenerationInput` + governance merge + gravity/simulation attachments succeeded.",
        evidenceSummary: `P2-E narrative source ids: ${srcCount}; participating people: ${merged.contract.participatingPeople.length}.`,
        isBlocker: false,
        isDowngradeRisk: false,
        isAdvisory: srcCount === 0,
        isObservationalOnly: false,
        remediationGuidance: srcCount === 0 ? "No narrative sources matched world-state filters — generation may be thin." : null,
        remediationHref: `/admin/narrative?scope=scene&sceneId=${sceneId}`,
        remediationLabel: "Author cockpit (scene)",
      }),
    );
    if (srcCount === 0) {
      pushAdvisory({
        subsystemKey: "scene_input",
        title: "No narrative sources on input bundle",
        explanation: "Temporal/world-state filters may exclude all sources for this scene.",
      });
    }
  }

  // --- canonical_hash ---
  let hashSummary: SceneGenerationHashSummary = {
    hashComputed: false,
    hashScheme: SCENE_GENERATION_HASH_SCHEME_V1,
    hashPreview: null,
    hashError: null,
    protectsSummary:
      "Hash covers contract, voice shaping, narrative sources, governance merge, human gravity, character simulation runtime, RICRE accepted canon when present — see canonical-scene-generation-hash header comment.",
  };
  if (merged) {
    try {
      const digest = computeSceneGenerationInputHash(merged, null);
      hashSummary = {
        ...hashSummary,
        hashComputed: true,
        hashPreview: digest.slice(0, 24) + "…",
        hashError: null,
      };
      subsystems.push(
        ss({
          subsystemKey: "canonical_hash",
          readinessClass: "ready",
          title: "Canonical scene generation hash",
          explanation: "Hash computed from the same `SceneGenerationInput` snapshot used for preflight.",
          evidenceSummary: `sha256 prefix ${hashSummary.hashPreview ?? ""}`,
          isBlocker: false,
          isDowngradeRisk: false,
          isAdvisory: false,
          isObservationalOnly: false,
          remediationGuidance: null,
          remediationHref: null,
          remediationLabel: null,
        }),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      hashSummary = { ...hashSummary, hashComputed: false, hashError: msg };
      subsystems.push(
        ss({
          subsystemKey: "canonical_hash",
          readinessClass: "blocked",
          title: "Canonical scene generation hash",
          explanation: "Hash computation failed — reproducibility gate is unsafe.",
          evidenceSummary: msg,
          isBlocker: true,
          isDowngradeRisk: false,
          isAdvisory: false,
          isObservationalOnly: false,
          remediationGuidance: "Inspect unstable or non-serializable fields on SceneGenerationInput.",
          remediationHref: `/admin/scenes/${sceneId}?tab=preflight`,
          remediationLabel: "Re-run preflight",
        }),
      );
      pushBlocker({
        subsystemKey: "canonical_hash",
        title: "Canonical hash failed",
        explanation: msg,
        remediationGuidance: "Fix serialization/contract issues before treating runs as comparable.",
        remediationHref: `/admin/scenes/${sceneId}?tab=preflight`,
        remediationLabel: "Preflight",
      });
    }
  } else {
    subsystems.push(
      ss({
        subsystemKey: "canonical_hash",
        readinessClass: "blocked",
        title: "Canonical scene generation hash",
        explanation: "Skipped — scene input did not load.",
        evidenceSummary: "—",
        isBlocker: true,
        isDowngradeRisk: false,
        isAdvisory: false,
        isObservationalOnly: false,
        remediationGuidance: "Fix scene input first.",
        remediationHref: `/admin/scenes/${sceneId}`,
        remediationLabel: "Scene detail",
      }),
    );
  }

  // --- governance ---
  const registry = buildEnforcementRegistry();
  const semErrors = registry.semanticViolations.filter((v) => v.severity === "error");
  if (semErrors.length > 0) {
    subsystems.push(
      ss({
        subsystemKey: "governance",
        readinessClass: "blocked",
        title: "Enforcement registry",
        explanation: "Semantic violations present in enforcement registry build.",
        evidenceSummary: `${semErrors.length} error-class violation(s).`,
        isBlocker: true,
        isDowngradeRisk: false,
        isAdvisory: false,
        isObservationalOnly: false,
        remediationGuidance: "Repair subsystem declaration rows / authority pairing.",
        remediationHref: "/admin/narrative",
        remediationLabel: "Narrative / cockpit",
      }),
    );
    pushBlocker({
      subsystemKey: "governance",
      title: "Enforcement registry semantic errors",
      explanation: semErrors.map((e) => e.message).join(" · "),
      remediationGuidance: "Resolve Cluster 2 registry violations before canonical runs.",
      remediationHref: "/admin/narrative",
      remediationLabel: "Cockpit",
    });
  } else {
    subsystems.push(
      ss({
        subsystemKey: "governance",
        readinessClass: "ready",
        title: "Enforcement registry",
        explanation: "Registry assembled without error-class semantic violations (observational flags may still exist elsewhere).",
        evidenceSummary: `Runtime id ${registry.canonicalRuntimeId}; ${registry.subsystemDeclarations.length} subsystem declarations.`,
        isBlocker: false,
        isDowngradeRisk: false,
        isAdvisory: registry.semanticViolations.some((v) => v.severity === "warning"),
        isObservationalOnly: false,
        remediationGuidance: null,
        remediationHref: "/admin/narrative",
        remediationLabel: "Cockpit governance",
      }),
    );
    for (const w of registry.semanticViolations.filter((v) => v.severity === "warning").slice(0, 4)) {
      pushAdvisory({
        subsystemKey: "governance",
        title: "Registry warning",
        explanation: w.message,
      });
    }
  }

  // --- human_gravity ---
  if (merged?.humanGravityRuntime) {
    const truth = merged.humanGravityRuntime.runtimeInfluenceTruth;
    const degraded =
      !truth.humanGravityCanonicalRuntimeActive || !truth.proseRealismSeedInfluencedByHumanGravity;
    subsystems.push(
      ss({
        subsystemKey: "human_gravity",
        readinessClass: degraded ? "downgrade_risk" : "ready",
        title: "Human gravity runtime",
        explanation: degraded
          ? "Human gravity derivation is partial — some influence gates are off."
          : "Human gravity runtime derived on the same merged path as cockpit inspection.",
        evidenceSummary: `canonicalActive=${truth.humanGravityCanonicalRuntimeActive}; proseSeedInfluenced=${truth.proseRealismSeedInfluencedByHumanGravity}`,
        isBlocker: false,
        isDowngradeRisk: degraded,
        isAdvisory: degraded,
        isObservationalOnly: false,
        remediationGuidance: degraded ? "Review EEGS / governance merge inputs for this chapter." : null,
        remediationHref: `/admin/narrative?scope=scene&sceneId=${sceneId}`,
        remediationLabel: "Cockpit",
      }),
    );
    if (degraded) {
      pushRisk({
        subsystemKey: "human_gravity",
        title: "Human gravity partially inactive",
        explanation: "Cluster 6 influence truth reports degraded gates — quality may drift.",
        remediationHref: `/admin/chapters/${merged.contract.chapter.id}`,
        remediationLabel: "Chapter",
      });
    }
  } else if (merged) {
    subsystems.push(
      ss({
        subsystemKey: "human_gravity",
        readinessClass: "downgrade_risk",
        title: "Human gravity runtime",
        explanation: "No human gravity profile on merged input (governance pack or merge path may be incomplete).",
        evidenceSummary: "deriveFromSceneGenerationInput returned null",
        isBlocker: false,
        isDowngradeRisk: true,
        isAdvisory: true,
        isObservationalOnly: false,
        remediationGuidance: "Ensure canonical pre-generation merge supplies EEGS pack.",
        remediationHref: `/admin/narrative?scope=scene&sceneId=${sceneId}`,
        remediationLabel: "Cockpit",
      }),
    );
    pushRisk({
      subsystemKey: "human_gravity",
      title: "Human gravity missing",
      explanation: "Cluster 6 runtime not attached — emotional gravity pressure may be under-specified.",
      remediationHref: `/admin/narrative?scope=scene&sceneId=${sceneId}`,
      remediationLabel: "Cockpit",
    });
  } else {
    subsystems.push(
      ss({
        subsystemKey: "human_gravity",
        readinessClass: "blocked",
        title: "Human gravity runtime",
        explanation: "Not evaluated — scene input missing.",
        evidenceSummary: "—",
        isBlocker: true,
        isDowngradeRisk: false,
        isAdvisory: false,
        isObservationalOnly: false,
        remediationGuidance: "Fix scene input load.",
        remediationHref: `/admin/scenes/${sceneId}`,
        remediationLabel: "Scene detail",
      }),
    );
  }

  // --- character_simulation ---
  let simRollup = null as Awaited<ReturnType<typeof buildCharacterSimulationWorkbenchSceneRollup>> | null;
  if (personIds.length) {
    try {
      simRollup = await buildCharacterSimulationWorkbenchSceneRollup(personIds);
    } catch {
      simRollup = null;
    }
  }
  if (simRollup && simRollup.perPerson.some((p) => p.readinessImpact === "blocked")) {
    subsystems.push(
      ss({
        subsystemKey: "character_simulation",
        readinessClass: "downgrade_risk",
        title: "Character simulation (workbench)",
        explanation: simRollup.summaryLine,
        evidenceSummary: `${simRollup.perPerson.filter((p) => p.readinessImpact === "blocked").length} blocked cast member(s) (workbench truth).`,
        isBlocker: false,
        isDowngradeRisk: true,
        isAdvisory: true,
        isObservationalOnly: false,
        remediationGuidance: "Resolve blocking contradictions in Character Simulation Workbench per person.",
        remediationHref: simRollup.perPerson.find((p) => p.readinessImpact === "blocked")?.workbenchHref ?? `/admin/people`,
        remediationLabel: "Simulation workbench",
      }),
    );
    pushRisk({
      subsystemKey: "character_simulation",
      title: "Workbench blocks cast readiness",
      explanation: simRollup.summaryLine,
      remediationHref: simRollup.perPerson.find((p) => p.readinessImpact === "blocked")?.workbenchHref ?? null,
      remediationLabel: "Open blocked workbench",
    });
  } else if (simRollup) {
    const risky = simRollup.perPerson.some((p) => p.readinessImpact !== "ready");
    subsystems.push(
      ss({
        subsystemKey: "character_simulation",
        readinessClass: risky ? "ready_with_advisories" : "ready",
        title: "Character simulation (workbench)",
        explanation: simRollup.summaryLine,
        evidenceSummary: `${simRollup.perPerson.length} cast member(s) inspected.`,
        isBlocker: false,
        isDowngradeRisk: risky,
        isAdvisory: risky,
        isObservationalOnly: false,
        remediationGuidance: risky ? "Review advisory drift on cast." : null,
        remediationHref: `/admin/scenes/${sceneId}?tab=research`,
        remediationLabel: "Scene research",
      }),
    );
    if (risky) {
      pushAdvisory({
        subsystemKey: "character_simulation",
        title: "Cast simulation not uniformly ready",
        explanation: simRollup.summaryLine,
      });
      pushRisk({
        subsystemKey: "character_simulation",
        title: "Character simulation fidelity risk",
        explanation: simRollup.summaryLine,
        remediationHref: simRollup.perPerson.find((p) => p.readinessImpact !== "ready")?.workbenchHref ?? null,
        remediationLabel: "Open workbench",
      });
    }
  } else {
    subsystems.push(
      ss({
        subsystemKey: "character_simulation",
        readinessClass: "observational_only",
        title: "Character simulation (workbench)",
        explanation: "No participating people — workbench rollup skipped.",
        evidenceSummary: "0 people on scene",
        isBlocker: false,
        isDowngradeRisk: false,
        isAdvisory: false,
        isObservationalOnly: true,
        remediationGuidance: null,
        remediationHref: null,
        remediationLabel: null,
      }),
    );
  }

  const profileTruth = merged?.persistedCharacterSimulationProfiles
    ? Object.keys(merged.persistedCharacterSimulationProfiles).length === personIds.length
      ? "persisted_author"
      : Object.keys(merged.persistedCharacterSimulationProfiles).length > 0
        ? "mixed"
        : "deterministic_seed_only"
    : "deterministic_seed_only";
  if (profileTruth !== "persisted_author" && personIds.length > 0) {
    pushAdvisory({
      subsystemKey: "character_simulation",
      title: "Character simulation profile truth",
      explanation: `Cast profile truth is "${profileTruth}" — not all persisted author bundles present.`,
    });
  }

  // --- research_canon ---
  let ricre: Awaited<ReturnType<typeof summarizeRicreForScene>> = {
    linkedTargets: 0,
    openClaims: 0,
    contradictions: 0,
    acceptedCanonRecords: 0,
    advisoryOnly: true,
    lastDecisionAt: null,
  };
  let ricreSummaryFailed = false;
  try {
    ricre = await summarizeRicreForScene(sceneId);
  } catch (e) {
    ricreSummaryFailed = true;
    const msg = e instanceof Error ? e.message : String(e);
    pushAdvisory({
      subsystemKey: "research_canon",
      title: "RICRE scene summary unavailable",
      explanation: `summarizeRicreForScene failed — research pressure not evaluated (${msg.slice(0, 200)}).`,
    });
  }
  const contra = ricre.contradictions > 0;
  const open = ricre.openClaims > 0;
  subsystems.push(
    ss({
      subsystemKey: "research_canon",
      readinessClass: ricreSummaryFailed
        ? "ready_with_advisories"
        : contra
          ? "downgrade_risk"
          : open
            ? "ready_with_advisories"
            : "ready",
      title: "Research & accepted canon (RICRE)",
      explanation: ricreSummaryFailed
        ? "RICRE scene graph summary could not be loaded — counts below may be zero."
        : `Linked targets ${ricre.linkedTargets}; open claims ${ricre.openClaims}; contradiction-shaped ${ricre.contradictions}; active accepted canon rows ${ricre.acceptedCanonRecords}.`,
      evidenceSummary: ricreSummaryFailed
        ? "summarizeRicreForScene threw (schema drift or DB unavailable)."
        : "Signals from summarizeRicreForScene (scene graph scope).",
      isBlocker: false,
      isDowngradeRisk: contra,
      isAdvisory: open || ricre.acceptedCanonRecords > 0,
      isObservationalOnly: false,
      remediationGuidance: contra ? "Resolve contradiction-shaped comparisons or record author decisions." : null,
      remediationHref: `/admin/scenes/${sceneId}?tab=research`,
      remediationLabel: "Scene research tab",
    }),
  );
  if (contra) {
    pushRisk({
      subsystemKey: "research_canon",
      title: "Research contradiction pressure",
      explanation: "Contradiction-shaped comparisons exist on scene-linked claims — approximate signal, not proof.",
      remediationHref: `/admin/research?sceneId=${sceneId}&queue=contradictions`,
      remediationLabel: "Research workbench",
    });
  }

  // --- prompt_assembly ---
  if (merged) {
    const ricrePresent = Boolean(merged.ricreAcceptedCanonKnowledge?.recordCount);
    subsystems.push(
      ss({
        subsystemKey: "prompt_assembly",
        readinessClass: "ready",
        title: "Prompt assembly prerequisites",
        explanation:
          "Loader produced contract, voice shaping, narrative shaping summary, sources, and optional RICRE bundle — same objects the LLM adapter consumes (truncation is adapter-side).",
        evidenceSummary: `RICRE bundle attached: ${ricrePresent ? `yes (${merged.ricreAcceptedCanonKnowledge?.recordCount} rows)` : "no"}.`,
        isBlocker: false,
        isDowngradeRisk: false,
        isAdvisory: !ricrePresent && ricre.acceptedCanonRecords > 0,
        isObservationalOnly: false,
        remediationGuidance:
          !ricrePresent && ricre.acceptedCanonRecords > 0
            ? "Active canon rows exist but did not resolve into this scene’s RICRE bundle — check entity linkage."
            : null,
        remediationHref: `/admin/scenes/${sceneId}?tab=research`,
        remediationLabel: "Scene research",
      }),
    );
    if (!ricrePresent && ricre.acceptedCanonRecords > 0) {
      pushAdvisory({
        subsystemKey: "prompt_assembly",
        title: "RICRE bundle absent while canon rows exist",
        explanation: "Accepted canon may target ids outside this scene’s loader OR bundle empty for other reasons — inspect research tab.",
      });
    }
  } else {
    subsystems.push(
      ss({
        subsystemKey: "prompt_assembly",
        readinessClass: "blocked",
        title: "Prompt assembly prerequisites",
        explanation: "Cannot evaluate — scene input missing.",
        evidenceSummary: "—",
        isBlocker: true,
        isDowngradeRisk: false,
        isAdvisory: false,
        isObservationalOnly: false,
        remediationGuidance: "Fix scene input.",
        remediationHref: `/admin/scenes/${sceneId}`,
        remediationLabel: "Scene detail",
      }),
    );
  }

  // --- execution_environment ---
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());
  subsystems.push(
    ss({
      subsystemKey: "execution_environment",
      readinessClass: hasOpenAi ? "ready" : "blocked",
      title: "Execution environment",
      explanation: hasOpenAi
        ? "OPENAI_API_KEY is set — model call can proceed in this process."
        : "OPENAI_API_KEY missing — canonical model generation cannot run in this process.",
      evidenceSummary: hasOpenAi ? "api_key=present" : "api_key=missing",
      isBlocker: !hasOpenAi,
      isDowngradeRisk: false,
      isAdvisory: !hasOpenAi,
      isObservationalOnly: false,
      remediationGuidance: !hasOpenAi ? "Configure OPENAI_API_KEY for the deployment performing generation." : null,
      remediationHref: null,
      remediationLabel: null,
    }),
  );
  if (!hasOpenAi) {
    pushBlocker({
      subsystemKey: "execution_environment",
      title: "Model API key missing",
      explanation: "The LLM adapter requires OPENAI_API_KEY in this environment; generation would fail immediately.",
      remediationGuidance: "Set the key in deployment env or local .env, then re-run preflight.",
      remediationHref: `/admin/scenes/${sceneId}?tab=preflight`,
      remediationLabel: "Preflight",
    });
  }

  // --- final_execution_truth ---
  subsystems.push(
    ss({
      subsystemKey: "final_execution_truth",
      readinessClass: "observational_only",
      title: "Final execution / Cluster 7 envelope",
      explanation:
        "Preflight does not execute a full scene generation run. Cluster 7 truth envelope and FinalExecutionPackage are produced when `runSceneGeneration` completes — this row is observational upstream only.",
      evidenceSummary: "No persisted run snapshot consulted in this pass.",
      isBlocker: false,
      isDowngradeRisk: false,
      isAdvisory: false,
      isObservationalOnly: true,
      remediationGuidance: "After a successful run, inspect Cluster 7 panels in cockpit or reports.",
      remediationHref: "/admin/narrative",
      remediationLabel: "Author cockpit",
    }),
  );
  pushObs({
    subsystemKey: "final_execution_truth",
    text: "Use post-generation reports (final-execution-package / readiness scorecard) for execution-grade truth.",
  });

  const inputTruth: SceneGenerationInputTruthSummary = merged
    ? {
        loadSucceeded: true,
        loadError: null,
        sceneId: merged.contract.scene.id,
        chapterId: merged.contract.chapter.id,
        participatingPeopleCount: merged.contract.participatingPeople.length,
        placesCount: merged.contract.place ? 1 : 0,
        narrativeSourceIdsCount: merged.sourceIdsUsed?.length ?? 0,
        ricreBundlePresent: Boolean(merged.ricreAcceptedCanonKnowledge?.recordCount),
        ricreRecordCount: merged.ricreAcceptedCanonKnowledge?.recordCount ?? 0,
        contractValidated: true,
      }
    : {
        loadSucceeded: false,
        loadError,
        sceneId,
        chapterId: scene.chapterId,
        participatingPeopleCount: personIds.length,
        placesCount: 0,
        narrativeSourceIdsCount: 0,
        ricreBundlePresent: false,
        ricreRecordCount: 0,
        contractValidated: false,
      };

  const blockerCount = blockers.length;
  const downgradeRiskCount = risks.length;
  const launchAllowance = deriveLaunchAllowance({ blockerCount, downgradeRiskCount });
  const advisoryCount = advisories.length;
  const observationalCount = observations.length;
  const overallReadinessClass = deriveOverallReadinessClass({
    launchAllowance,
    advisoryCount,
    observationalOnly: false,
  });

  const summary: SceneGenerationPreflightSummary = {
    overallReadinessClass,
    launchAllowance,
    headline:
      launchAllowance === "blocked"
        ? "Launch blocked — resolve blockers before runSceneGeneration."
        : launchAllowance === "allowed_with_risk"
          ? "Launch allowed with documented downgrade risks — confirm before generating."
          : advisoryCount > 0
            ? "Launch allowed — advisories present; generation should be clean with noted caveats."
            : "Launch allowed — upstream canonical inputs assembled cleanly for this snapshot.",
    evaluatedAtIso,
    primaryBlockerCount: blockerCount,
    primaryRiskCount: downgradeRiskCount,
    advisoryCount,
    observationalCount,
  };

  return {
    contractVersion: SCENE_GENERATION_PREFLIGHT_CONTRACT_VERSION,
    sceneId,
    summary,
    subsystems,
    blockers,
    risks,
    advisories,
    observations,
    inputTruth,
    hashSummary,
    honestyBanner:
      "Preflight is a read-only canonical snapshot: it does not run the LLM, does not mint Cluster 7 envelopes, and does not replace cockpit certification. Degraded or advisory states may still permit generation when policy allows.",
  };
}
