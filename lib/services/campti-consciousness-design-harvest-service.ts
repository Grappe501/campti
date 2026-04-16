import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";

type Confidence = "high" | "medium" | "low";
type ConceptBucket = "practical_adopt" | "philosophical_inspiration" | "out_of_scope_for_now";
type RuntimeBoundary = "runtime_safe" | "cockpit_simulation_only" | "research_only" | "reject_for_now";

type SourceArtifact = {
  filePath: string;
  sourceTitle: string;
  extension: string;
  byteSize: number;
  sha256: string;
  modifiedAt: string;
  textContent: string | null;
};

type ConceptSpec = {
  conceptName: string;
  shortDescription: string;
  bucket: ConceptBucket;
  keywords: string[];
  defaultConfidence: Confidence;
  usefulnessForCampti: string;
};

const TEXT_EXTENSIONS = new Set([".md", ".txt", ".markdown", ".csv", ".json", ".yaml", ".yml", ".sql"]);

const CONCEPT_SPECS: ConceptSpec[] = [
  {
    conceptName: "Perceive -> Appraise -> Emotion -> Intention -> Action -> Update Memory/State",
    shortDescription: "A staged cognition-action loop that can stabilize consciousness-layer state transitions.",
    bucket: "practical_adopt",
    keywords: ["perceive", "appraise", "emotion", "intention", "action", "update memory", "state transition"],
    defaultConfidence: "medium",
    usefulnessForCampti:
      "Fits Campti-native consciousness sequencing and regeneration loop explainability without importing an external simulator runtime.",
  },
  {
    conceptName: "Global State vs Perceived State",
    shortDescription: "Separate objective world-state from each character's subjective interpretation.",
    bucket: "practical_adopt",
    keywords: ["perceived state", "global state", "subjective state", "world-state"],
    defaultConfidence: "high",
    usefulnessForCampti:
      "Directly improves character console misreading patterns, tension generation, and Chapter 1 perspective routing.",
  },
  {
    conceptName: "Limited Attention / Salience Budget",
    shortDescription: "Constrain character processing to a bounded attention budget per scene turn.",
    bucket: "practical_adopt",
    keywords: ["attention budget", "limited attention", "salience"],
    defaultConfidence: "high",
    usefulnessForCampti:
      "Prevents omniscient character cognition and sharpens narrative selectivity in the consciousness engine.",
  },
  {
    conceptName: "Memory Persistence and State Accumulation",
    shortDescription: "Carry forward resolved and unresolved signals as persistent state across chapter turns.",
    bucket: "practical_adopt",
    keywords: ["memory persistence", "persistent memory", "state accumulation", "retention", "continuity"],
    defaultConfidence: "high",
    usefulnessForCampti:
      "Strengthens chapter-to-chapter continuity and improves regeneration loop coherence without bypassing canon protections.",
  },
  {
    conceptName: "Social Feedback Loops",
    shortDescription: "Model social responses that recursively alter future behavior and relationship pressure.",
    bucket: "practical_adopt",
    keywords: ["social feedback", "feedback loop", "relationship edges", "social loop"],
    defaultConfidence: "medium",
    usefulnessForCampti:
      "Supports relationship pressure and downstream consequence tracking in cockpit simulation controls.",
  },
  {
    conceptName: "Meaning Generation / Self-Narrative",
    shortDescription: "Characters interpret events through identity-forming meaning frames, not raw facts.",
    bucket: "philosophical_inspiration",
    keywords: ["meaning generation", "sense-making", "self narrative", "identity meaning"],
    defaultConfidence: "medium",
    usefulnessForCampti:
      "Useful as mediated design inspiration for character console and voice-cognition shaping, not as direct prose control labels.",
  },
  {
    conceptName: "Observer-Dependent Rendering",
    shortDescription: "Output varies by observer position and internal model of events.",
    bucket: "philosophical_inspiration",
    keywords: ["observer-dependent", "observer dependent", "observer"],
    defaultConfidence: "medium",
    usefulnessForCampti:
      "Useful in cockpit simulation/author review views; should remain abstracted before any runtime prose exposure.",
  },
  {
    conceptName: "Hidden Variables in Character Judgement",
    shortDescription: "Allow unknown latent factors to shape behavior without explicit exposition.",
    bucket: "philosophical_inspiration",
    keywords: ["hidden variables", "latent variables", "unknown factors"],
    defaultConfidence: "medium",
    usefulnessForCampti:
      "Useful for uncertainty scaffolding in decision panel and character console ambiguity handling.",
  },
  {
    conceptName: "Deterministic vs Probabilistic Modes",
    shortDescription: "Switchable execution posture for repeatability vs variability in author simulations.",
    bucket: "philosophical_inspiration",
    keywords: ["deterministic", "probabilistic", "stochastic"],
    defaultConfidence: "medium",
    usefulnessForCampti:
      "Useful as cockpit-only run-mode controls for testing without hardwiring metaphysics into runtime prose generation.",
  },
  {
    conceptName: "Cosmic/Nested Simulation Metaphysics",
    shortDescription: "Explicit metaphysical framing about reality layers and simulation assumptions.",
    bucket: "out_of_scope_for_now",
    keywords: ["cosmic simulation", "nested simulation", "metaphysics", "quantum observer", "observer-collapse"],
    defaultConfidence: "high",
    usefulnessForCampti:
      "Not needed for Campti runtime architecture and risks leaking theory labels into prose; keep as research-only.",
  },
];

function toPosixPath(absolutePath: string, workspaceRoot: string): string {
  return relative(workspaceRoot, absolutePath).replace(/\\/g, "/");
}

async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

async function buildArtifact(absolutePath: string, workspaceRoot: string): Promise<SourceArtifact> {
  const buffer = await readFile(absolutePath);
  const fileStats = await stat(absolutePath);
  const extension = extname(absolutePath).toLowerCase();
  const textContent = TEXT_EXTENSIONS.has(extension) ? buffer.toString("utf8") : null;
  return {
    filePath: toPosixPath(absolutePath, workspaceRoot),
    sourceTitle: basename(absolutePath),
    extension,
    byteSize: fileStats.size,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    modifiedAt: fileStats.mtime.toISOString(),
    textContent,
  };
}

function extractEvidenceLines(text: string, keywords: string[]): string[] {
  const lines = text.split(/\r?\n/);
  const hits = lines
    .filter((line) => {
      const lower = line.toLowerCase();
      return keywords.some((keyword) => lower.includes(keyword));
    })
    .map((line) => line.trim())
    .filter(Boolean);
  return hits.slice(0, 6);
}

function runtimeBoundaryForConcept(conceptName: string): RuntimeBoundary {
  const lower = conceptName.toLowerCase();
  if (
    lower.includes("attention") ||
    lower.includes("global state vs perceived state") ||
    lower.includes("memory persistence") ||
    lower.includes("social feedback")
  ) {
    return "runtime_safe";
  }
  if (lower.includes("deterministic vs probabilistic") || lower.includes("observer-dependent rendering")) {
    return "cockpit_simulation_only";
  }
  if (lower.includes("metaphysics")) return "reject_for_now";
  return "research_only";
}

function destinationFits(conceptName: string): Array<{
  destinationSubsystem: string;
  expectedBenefit: string;
  implementationComplexity: "low" | "medium" | "high";
  usageMode: "runtime-safe" | "review-only" | "cockpit-only";
}> {
  const lower = conceptName.toLowerCase();

  if (lower.includes("attention")) {
    return [
      {
        destinationSubsystem: "consciousness engine",
        expectedBenefit: "Character cognition processes only salient inputs, reducing over-reasoned prose behavior.",
        implementationComplexity: "medium",
        usageMode: "runtime-safe",
      },
      {
        destinationSubsystem: "chapter_render_directives",
        expectedBenefit: "Render directives can emphasize what characters notice vs miss in each scene beat.",
        implementationComplexity: "low",
        usageMode: "runtime-safe",
      },
    ];
  }

  if (lower.includes("global state vs perceived state")) {
    return [
      {
        destinationSubsystem: "character console",
        expectedBenefit: "Explicit misread/perceived tracks improve explainability and tension design.",
        implementationComplexity: "medium",
        usageMode: "runtime-safe",
      },
      {
        destinationSubsystem: "chapter_perspective_routing_plan",
        expectedBenefit: "Perspective routing can select narrators by perceptual mismatch impact.",
        implementationComplexity: "medium",
        usageMode: "runtime-safe",
      },
    ];
  }

  if (lower.includes("memory persistence")) {
    return [
      {
        destinationSubsystem: "regeneration loop",
        expectedBenefit: "Persistent cognition deltas strengthen chapter continuity and reduce resets.",
        implementationComplexity: "medium",
        usageMode: "runtime-safe",
      },
      {
        destinationSubsystem: "chapter_voice_cognition_map",
        expectedBenefit: "Voice shifts stay tethered to accumulated memory-state changes.",
        implementationComplexity: "medium",
        usageMode: "runtime-safe",
      },
    ];
  }

  if (lower.includes("social feedback")) {
    return [
      {
        destinationSubsystem: "decision panel",
        expectedBenefit: "Decision outcomes can include predicted social pressure feedback consequences.",
        implementationComplexity: "medium",
        usageMode: "runtime-safe",
      },
      {
        destinationSubsystem: "author cockpit simulation controls",
        expectedBenefit: "Cockpit controls can surface relationship pressure deltas before chapter lock.",
        implementationComplexity: "low",
        usageMode: "cockpit-only",
      },
    ];
  }

  if (lower.includes("meaning generation")) {
    return [
      {
        destinationSubsystem: "character console",
        expectedBenefit: "Author review can inspect why characters assign meaning to events.",
        implementationComplexity: "medium",
        usageMode: "review-only",
      },
      {
        destinationSubsystem: "chapter_voice_cognition_map",
        expectedBenefit: "Voice shaping can follow internal meaning frames without exposing theory labels.",
        implementationComplexity: "medium",
        usageMode: "review-only",
      },
    ];
  }

  if (lower.includes("observer-dependent")) {
    return [
      {
        destinationSubsystem: "author cockpit simulation controls",
        expectedBenefit: "Cockpit can compare observer variants without changing runtime prose policy.",
        implementationComplexity: "low",
        usageMode: "cockpit-only",
      },
    ];
  }

  if (lower.includes("hidden variables")) {
    return [
      {
        destinationSubsystem: "decision panel",
        expectedBenefit: "Decision reasoning can mark uncertainty factors as latent instead of deterministic claims.",
        implementationComplexity: "medium",
        usageMode: "review-only",
      },
    ];
  }

  if (lower.includes("deterministic vs probabilistic")) {
    return [
      {
        destinationSubsystem: "author cockpit simulation controls",
        expectedBenefit: "Enables reproducible testing mode vs exploratory mode in cockpit simulations.",
        implementationComplexity: "low",
        usageMode: "cockpit-only",
      },
    ];
  }

  if (lower.includes("metaphysics")) {
    return [
      {
        destinationSubsystem: "law console",
        expectedBenefit: "Explicitly tracked as non-runtime theory to prevent renderer leakage.",
        implementationComplexity: "low",
        usageMode: "review-only",
      },
    ];
  }

  return [];
}

function confidenceFromEvidence(defaultConfidence: Confidence, evidenceCount: number): Confidence {
  if (evidenceCount >= 4) return "high";
  if (evidenceCount >= 1) return defaultConfidence === "high" ? "high" : "medium";
  return "low";
}

async function writeJson(path: string, payload: unknown) {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function runCamptiConsciousnessDesignHarvest(options?: {
  workspaceRoot?: string;
  inputRoots?: string[];
  reportRoot?: string;
}) {
  const workspaceRoot = options?.workspaceRoot ?? process.cwd();
  const inputRoots = options?.inputRoots?.length ? options.inputRoots : [join(workspaceRoot, "uploads", "incoming")];
  const reportRoot = options?.reportRoot ?? join(workspaceRoot, "reports");
  const generatedAt = new Date().toISOString();

  const files = (await Promise.all(inputRoots.map((root) => walkFiles(root)))).flat();
  const artifacts = await Promise.all(files.map((file) => buildArtifact(file, workspaceRoot)));

  const conceptHarvest = CONCEPT_SPECS.map((spec) => {
    const evidence = artifacts.flatMap((artifact) => {
      if (!artifact.textContent) return [];
      const hits = extractEvidenceLines(artifact.textContent, spec.keywords);
      return hits.map((snippet) => ({
        sourceFile: artifact.filePath,
        sourceSha256: artifact.sha256,
        snippet,
      }));
    });

    return {
      conceptName: spec.conceptName,
      shortDescription: spec.shortDescription,
      findingCategory:
        spec.bucket === "practical_adopt"
          ? "A_practical_ideas_to_adopt"
          : spec.bucket === "philosophical_inspiration"
            ? "B_philosophical_design_inspiration"
            : "C_out_of_scope_for_now",
      sourceFiles: [...new Set(evidence.map((item) => item.sourceFile))],
      sourceEvidence: evidence.slice(0, 10),
      usefulnessForCampti: spec.usefulnessForCampti,
      confidenceLevel: confidenceFromEvidence(spec.defaultConfidence, evidence.length),
    };
  });

  const fitMap = conceptHarvest
    .filter((concept) => concept.confidenceLevel !== "low" || concept.findingCategory !== "C_out_of_scope_for_now")
    .map((concept) => ({
      conceptName: concept.conceptName,
      mappings: destinationFits(concept.conceptName),
    }))
    .filter((row) => row.mappings.length > 0);

  const runtimeBoundaries = conceptHarvest.map((concept) => {
    const classification = runtimeBoundaryForConcept(concept.conceptName);
    const rationale =
      classification === "runtime_safe"
        ? "Concept can be represented as behavior shaping signals without exposing external theory labels in prose."
        : classification === "cockpit_simulation_only"
          ? "Concept is useful for authoring simulation controls and diagnostics but should remain outside direct runtime prose control."
          : classification === "research_only"
            ? "Concept is currently best treated as design research input until Campti-native abstractions are finalized."
            : "Concept introduces metaphysical risk and is intentionally excluded from near-term implementation.";
    return {
      conceptName: concept.conceptName,
      classification,
      rationale,
    };
  });

  const nextSteps = [
    {
      title: "Add salience-budget gates to consciousness routing",
      sourceIdeas: ["Limited Attention / Salience Budget", "Global State vs Perceived State"],
      camptiSubsystemToModify: "consciousness engine",
      expectedBenefitToChapterOrCockpit: "Chapter 1 characters process fewer but more plausible cues, improving perspective realism.",
      betterThanImportingSimulator:
        "Reuses existing Campti cognition contracts and avoids external state machine coupling risk.",
      recommendedOrder: 1,
    },
    {
      title: "Introduce perceived-vs-global state split in character console",
      sourceIdeas: ["Global State vs Perceived State", "Hidden Variables in Character Judgement"],
      camptiSubsystemToModify: "character console",
      expectedBenefitToChapterOrCockpit:
        "Improves misreading diagnostics and author ability to tune tension in Chapter 1 revisions.",
      betterThanImportingSimulator:
        "Extends current console semantics directly instead of adding parallel simulator entities and migration debt.",
      recommendedOrder: 2,
    },
    {
      title: "Persist cognition deltas through regeneration loop",
      sourceIdeas: ["Memory Persistence and State Accumulation", "Perceive -> Appraise -> Emotion -> Intention -> Action -> Update Memory/State"],
      camptiSubsystemToModify: "regeneration loop",
      expectedBenefitToChapterOrCockpit:
        "Reduces continuity drift between Chapter 1 regeneration passes and stabilizes emotional carry-over.",
      betterThanImportingSimulator:
        "Leverages existing regeneration checkpoints and chronology guards already native to Campti.",
      recommendedOrder: 3,
    },
    {
      title: "Add social feedback pressure previews in decision panel",
      sourceIdeas: ["Social Feedback Loops", "Meaning Generation / Self-Narrative"],
      camptiSubsystemToModify: "decision panel",
      expectedBenefitToChapterOrCockpit:
        "Authors can preview downstream relationship pressure impacts before committing branch decisions.",
      betterThanImportingSimulator:
        "Keeps governance in one Campti decision surface rather than syncing two divergent decision systems.",
      recommendedOrder: 4,
    },
    {
      title: "Add cockpit-only deterministic/probabilistic simulation toggles",
      sourceIdeas: ["Deterministic vs Probabilistic Modes", "Observer-Dependent Rendering"],
      camptiSubsystemToModify: "author cockpit simulation controls",
      expectedBenefitToChapterOrCockpit:
        "Improves test reproducibility and exploratory what-if runs without leaking theory framing into runtime prose.",
      betterThanImportingSimulator:
        "Provides experimental flexibility while preserving Campti renderer contracts and canon safety barriers.",
      recommendedOrder: 5,
    },
  ];

  const conceptHarvestReport = {
    generatedAt,
    framing: "Design-harvest pass only. No external simulator ingestion.",
    provenance: {
      sourceRootPaths: inputRoots.map((path) => toPosixPath(path, workspaceRoot)),
      sourceArtifacts: artifacts.map((artifact) => ({
        filePath: artifact.filePath,
        sourceTitle: artifact.sourceTitle,
        extension: artifact.extension,
        byteSize: artifact.byteSize,
        sha256: artifact.sha256,
        modifiedAt: artifact.modifiedAt,
      })),
    },
    concepts: conceptHarvest,
  };

  const fitMapReport = {
    generatedAt,
    framing: "Campti-native fit map for harvested concepts.",
    mappings: fitMap,
  };

  const runtimeBoundariesReport = {
    generatedAt,
    safetyRules: {
      noExternalSimulatorSchemaImport: true,
      doNotExposeTheoryLabelsInProse: true,
      preserveChronologyCanonProtections: true,
      keepDevelopmentalIntimacySeparateFromEnneagram: true,
    },
    classifications: runtimeBoundaries,
  };

  const nextStepsReport = {
    generatedAt,
    focus: "Top 5 Campti-native improvements for Chapter 1 and author cockpit.",
    recommendedImprovements: nextSteps,
  };

  const conceptHarvestPath = join(reportRoot, "campti-consciousness-concept-harvest.json");
  const fitMapPath = join(reportRoot, "campti-consciousness-fit-map.json");
  const runtimeBoundariesPath = join(reportRoot, "campti-consciousness-runtime-boundaries.json");
  const nextStepsPath = join(reportRoot, "campti-consciousness-next-steps.json");

  await writeJson(conceptHarvestPath, conceptHarvestReport);
  await writeJson(fitMapPath, fitMapReport);
  await writeJson(runtimeBoundariesPath, runtimeBoundariesReport);
  await writeJson(nextStepsPath, nextStepsReport);

  return {
    sourceArtifactsAnalyzed: artifacts.length,
    reportsWritten: [
      toPosixPath(conceptHarvestPath, workspaceRoot),
      toPosixPath(fitMapPath, workspaceRoot),
      toPosixPath(runtimeBoundariesPath, workspaceRoot),
      toPosixPath(nextStepsPath, workspaceRoot),
    ],
  };
}
