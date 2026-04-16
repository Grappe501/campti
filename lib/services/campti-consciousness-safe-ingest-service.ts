import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";

type SourceCategory = "practical_simulation_architecture" | "conceptual_philosophical_research";

type UploadedArtifact = {
  filePath: string;
  sha256: string;
  byteSize: number;
  sourceTitle: string;
  sourceCategory: SourceCategory;
  uploadMetadata: {
    extension: string;
    discoveredAt: string;
    fileCreatedAt: string;
    fileModifiedAt: string;
    ingestBatchId: string;
  };
  textContent: string | null;
};

type StructuralGroupName =
  | "agents"
  | "agent_traits"
  | "agent_filters"
  | "agent_rules"
  | "scenarios"
  | "scenario_events"
  | "sim_runs"
  | "sim_agent_state";

type ExtractionHit = {
  sourcePath: string;
  matchType: "sql_table" | "keyword";
  snippet: string;
  columns?: string[];
};

const TEXT_EXTENSIONS = new Set([".sql", ".txt", ".md", ".markdown", ".json", ".yaml", ".yml", ".csv"]);

const STRUCTURAL_GROUPS: StructuralGroupName[] = [
  "agents",
  "agent_traits",
  "agent_filters",
  "agent_rules",
  "scenarios",
  "scenario_events",
  "sim_runs",
  "sim_agent_state",
];

const PRACTICAL_HINTS = [
  "create table",
  "schema",
  "migration",
  "agent_traits",
  "sim_runs",
  "state transition",
  "system design",
  "api",
  "runtime",
];

const RESEARCH_HINTS = [
  "observer",
  "metaphysics",
  "philosophy",
  "entanglement",
  "meaning generation",
  "probabilistic",
  "deterministic",
  "consciousness",
  "simulation theory",
];

const RESEARCH_CONCEPTS: Array<{ id: string; label: string; keywords: string[] }> = [
  {
    id: "observer_dependent_rendering",
    label: "observer-dependent rendering",
    keywords: ["observer-dependent", "observer dependent", "rendering depends on observer"],
  },
  {
    id: "local_vs_global_state",
    label: "local perceived state vs global state",
    keywords: ["local perceived state", "global state", "subjective state"],
  },
  {
    id: "limited_attention_budget",
    label: "limited attention budget",
    keywords: ["attention budget", "limited attention", "salience budget"],
  },
  {
    id: "hidden_variables",
    label: "hidden variables",
    keywords: ["hidden variables", "latent variables"],
  },
  {
    id: "meaning_generation_engine",
    label: "meaning generation engine",
    keywords: ["meaning generation", "meaning engine", "sense-making"],
  },
  {
    id: "deterministic_vs_probabilistic_modes",
    label: "deterministic vs probabilistic modes",
    keywords: ["deterministic", "probabilistic", "stochastic"],
  },
  {
    id: "social_feedback_loops",
    label: "social feedback loops",
    keywords: ["social feedback", "feedback loop", "social loop"],
  },
  {
    id: "memory_persistence",
    label: "memory persistence",
    keywords: ["memory persistence", "persistent memory", "memory retention"],
  },
  {
    id: "entanglement_observer_metaphors",
    label: "entanglement/observer metaphors",
    keywords: ["entanglement", "observer metaphor", "quantum observer"],
  },
];

const CONSCIOUSNESS_BUILD_KEYWORDS = [
  ...STRUCTURAL_GROUPS,
  "consciousness",
  "simulation",
  "observer-dependent",
  "local perceived state",
  "global state",
  "limited attention",
  "hidden variables",
  "meaning generation",
  "deterministic",
  "probabilistic",
  "social feedback",
  "memory persistence",
  "entanglement",
  "perceive",
  "appraise",
  "emotion",
  "intention",
  "update memory",
];

function toPosixRelativePath(absolutePath: string, workspaceRoot: string): string {
  return relative(workspaceRoot, absolutePath).replace(/\\/g, "/");
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function scoreByHints(contentLower: string, hints: string[]): number {
  return hints.reduce((acc, hint) => (contentLower.includes(hint) ? acc + 1 : acc), 0);
}

function classifySourceCategory(path: string, textContent: string | null): SourceCategory {
  const extension = extname(path).toLowerCase();
  if (extension === ".sql") return "practical_simulation_architecture";

  const textLower = (textContent ?? "").toLowerCase();
  const practicalScore = scoreByHints(textLower, PRACTICAL_HINTS);
  const researchScore = scoreByHints(textLower, RESEARCH_HINTS);

  if (practicalScore === 0 && researchScore === 0) {
    return extension === ".json"
      ? "practical_simulation_architecture"
      : "conceptual_philosophical_research";
  }

  return practicalScore >= researchScore
    ? "practical_simulation_architecture"
    : "conceptual_philosophical_research";
}

function isConsciousnessBuildArtifact(artifact: UploadedArtifact): boolean {
  const pathLower = artifact.filePath.toLowerCase();
  const textLower = (artifact.textContent ?? "").toLowerCase();
  return CONSCIOUSNESS_BUILD_KEYWORDS.some(
    (keyword) => pathLower.includes(keyword) || textLower.includes(keyword),
  );
}

async function walkFiles(root: string): Promise<string[]> {
  const output: string[] = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return output;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      output.push(fullPath);
    }
  }
  return output;
}

async function buildArtifact(
  absolutePath: string,
  workspaceRoot: string,
  discoveredAt: string,
  ingestBatchId: string,
): Promise<UploadedArtifact> {
  const fileBuffer = await readFile(absolutePath);
  const fileStats = await stat(absolutePath);
  const extension = extname(absolutePath).toLowerCase();
  const textContent = TEXT_EXTENSIONS.has(extension) ? fileBuffer.toString("utf8") : null;
  const relativePath = toPosixRelativePath(absolutePath, workspaceRoot);

  return {
    filePath: relativePath,
    sha256: createHash("sha256").update(fileBuffer).digest("hex"),
    byteSize: fileStats.size,
    sourceTitle: basename(absolutePath),
    sourceCategory: classifySourceCategory(relativePath, textContent),
    uploadMetadata: {
      extension,
      discoveredAt,
      fileCreatedAt: fileStats.birthtime.toISOString(),
      fileModifiedAt: fileStats.mtime.toISOString(),
      ingestBatchId,
    },
    textContent,
  };
}

function extractLinesContaining(text: string, keywords: string[]): string[] {
  const lines = text.split(/\r?\n/);
  return lines
    .filter((line) => {
      const lower = line.toLowerCase();
      return keywords.some((keyword) => lower.includes(keyword));
    })
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
}

function extractTableHit(text: string, tableName: string): { snippet: string; columns: string[] } | null {
  const regex = new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?["'\`\\w.]*${tableName}["'\`\\w.]*\\s*\\(([\\s\\S]*?)\\);`, "i");
  const match = text.match(regex);
  if (!match) return null;

  const block = match[1];
  const columns = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[a-zA-Z_][\w]*/.test(line))
    .map((line) => line.replace(/,$/, "").split(/\s+/)[0])
    .slice(0, 20);

  return {
    snippet: normalizeWhitespace(`CREATE TABLE ${tableName} (${block})`),
    columns,
  };
}

function extractStructuralModel(practicalArtifacts: UploadedArtifact[]) {
  const modelGroups = STRUCTURAL_GROUPS.map((groupName) => {
    const hits: ExtractionHit[] = [];
    for (const artifact of practicalArtifacts) {
      if (!artifact.textContent) continue;

      const tableHit = extractTableHit(artifact.textContent, groupName);
      if (tableHit) {
        hits.push({
          sourcePath: artifact.filePath,
          matchType: "sql_table",
          snippet: tableHit.snippet,
          columns: tableHit.columns,
        });
      }

      const keywordLines = extractLinesContaining(artifact.textContent, [groupName]);
      for (const line of keywordLines.slice(0, 6)) {
        hits.push({
          sourcePath: artifact.filePath,
          matchType: "keyword",
          snippet: line,
        });
      }
    }

    return {
      modelGroup: groupName,
      normalizedName: groupName,
      extractionHits: hits,
      inferredSchemaStatus: hits.length > 0 ? "observed" : "not_found",
    };
  });

  const textPool = practicalArtifacts
    .map((artifact) => artifact.textContent ?? "")
    .join("\n")
    .toLowerCase();

  return {
    modelGroups,
    traitMenus: collectKeywordMenus(practicalArtifacts, ["trait", "bias", "temperament"]),
    signalMenus: collectKeywordMenus(practicalArtifacts, ["signal", "cue", "indicator"]),
    actionTaxonomyCandidates: collectKeywordMenus(practicalArtifacts, ["action", "move", "response"]).slice(0, 80),
    stateTransitionLoop: {
      canonicalFlow: ["perceive", "appraise", "emotion", "intention", "action", "update memory/state"],
      observedEvidence: {
        perceive: textPool.includes("perceive"),
        appraise: textPool.includes("appraise"),
        emotion: textPool.includes("emotion"),
        intention: textPool.includes("intention"),
        action: textPool.includes("action"),
        updateMemoryState: textPool.includes("update memory") || textPool.includes("memory/state"),
      },
    },
  };
}

function collectKeywordMenus(artifacts: UploadedArtifact[], keywords: string[]): string[] {
  const seen = new Set<string>();
  for (const artifact of artifacts) {
    if (!artifact.textContent) continue;
    const lines = extractLinesContaining(artifact.textContent, keywords).slice(0, 60);
    for (const line of lines) {
      const tokens = line
        .split(/[:,;|/]/)
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length >= 3 && token.length <= 80);
      for (const token of tokens) {
        if (keywords.some((keyword) => token.includes(keyword))) {
          seen.add(token);
        }
      }
    }
  }
  return [...seen].slice(0, 120);
}

function extractResearchModel(researchArtifacts: UploadedArtifact[]) {
  const entries = RESEARCH_CONCEPTS.map((concept) => {
    const evidence: Array<{ sourcePath: string; snippet: string }> = [];

    for (const artifact of researchArtifacts) {
      if (!artifact.textContent) continue;
      const lines = extractLinesContaining(artifact.textContent, concept.keywords);
      for (const line of lines.slice(0, 6)) {
        evidence.push({ sourcePath: artifact.filePath, snippet: line });
      }
    }

    return {
      conceptId: concept.id,
      conceptLabel: concept.label,
      research_only: true,
      not_direct_runtime_prose_controls: true,
      evidence,
      extractionStatus: evidence.length > 0 ? "observed" : "not_found",
    };
  });

  return {
    policy: {
      research_only: true,
      not_direct_runtime_prose_controls: true,
      separationEnforced: true,
    },
    concepts: entries,
  };
}

function buildRuntimeSafeMapping(input: {
  practicalArtifacts: UploadedArtifact[];
  structuralModel: ReturnType<typeof extractStructuralModel>;
  researchModel: ReturnType<typeof extractResearchModel>;
}) {
  const runtimeChannels = [
    "perception_bias_outputs",
    "omission_patterns",
    "misreading_patterns",
    "bodily_stress_conversions",
    "silence_patterns",
    "conflict_response_patterns",
    "intimacy_distance_patterns",
    "authority_response_patterns",
    "ritual_meaning_patterns",
    "limited_attention_salience_budget",
  ];

  const observedResearch = new Set(
    input.researchModel.concepts.filter((concept) => concept.extractionStatus === "observed").map((concept) => concept.conceptId),
  );

  return {
    mappingPolicy: {
      allowOnlyRuntimeSafeOutputs: true,
      preserveChronologyCanonProtections: true,
      doNotExposeTheoryLabelsInProse: true,
      keepDevelopmentalIntimacySeparateFromEnneagram: true,
      keepPhilosophicalSimulationOutsideCoreRenderer: true,
    },
    promotedRuntimeMappings: runtimeChannels.map((channel) => ({
      runtimeChannel: channel,
      mappedFrom: {
        structuralSignals: input.structuralModel.signalMenus.slice(0, 10),
        structuralTraits: input.structuralModel.traitMenus.slice(0, 10),
        observedResearchLimitedToSafeAbstractions: observedResearch.has("limited_attention_budget")
          ? ["limited_attention_budget"]
          : [],
      },
      proseExposureGuard: "No raw theory labels, metaphysics, or quantum analogies in prose output.",
    })),
    blockedDirectMappings: [
      "cosmic simulation assumptions",
      "observer-collapse metaphysics",
      "explicit quantum theory analogies",
      "raw theory labels",
    ],
  };
}

function buildReviewQueue(input: {
  artifacts: UploadedArtifact[];
  structuralModel: ReturnType<typeof extractStructuralModel>;
  researchModel: ReturnType<typeof extractResearchModel>;
}) {
  const queue: Array<{
    id: string;
    severity: "high" | "medium";
    type: "metaphor_without_runtime_analog" | "overlap_risk" | "schema_decision" | "missing_source";
    detail: string;
    sourcePaths: string[];
  }> = [];

  if (input.artifacts.length === 0) {
    queue.push({
      id: "missing-uploaded-sources",
      severity: "high",
      type: "missing_source",
      detail:
        "No uploaded files matched consciousness/simulation ingestion scope keywords. Provide explicit consciousness-lab source files or pass a dedicated --inputRoot.",
      sourcePaths: [],
    });
  }

  const unresolvedGroups = input.structuralModel.modelGroups.filter((group) => group.inferredSchemaStatus === "not_found");
  if (unresolvedGroups.length > 0) {
    queue.push({
      id: "unresolved-structural-groups",
      severity: "medium",
      type: "schema_decision",
      detail: `Missing structural group definitions: ${unresolvedGroups.map((group) => group.modelGroup).join(", ")}.`,
      sourcePaths: [],
    });
  }

  const metaphorConcepts = input.researchModel.concepts.filter((concept) =>
    ["observer_dependent_rendering", "entanglement_observer_metaphors"].includes(concept.conceptId),
  );
  if (metaphorConcepts.some((concept) => concept.evidence.length > 0)) {
    queue.push({
      id: "metaphor-runtime-analog-review",
      severity: "medium",
      type: "metaphor_without_runtime_analog",
      detail: "Observer/entanglement metaphors were detected and must remain research-only until an approved runtime analog exists.",
      sourcePaths: metaphorConcepts.flatMap((concept) => concept.evidence.map((e) => e.sourcePath)),
    });
  }

  const overlapSources = input.artifacts
    .filter((artifact) => (artifact.textContent ?? "").toLowerCase().includes("enneagram") || (artifact.textContent ?? "").toLowerCase().includes("intimacy"))
    .map((artifact) => artifact.filePath);
  if (overlapSources.length > 0) {
    queue.push({
      id: "construct-overlap-review",
      severity: "medium",
      type: "overlap_risk",
      detail: "Potential overlap with Enneagram or developmental intimacy constructs needs explicit schema routing.",
      sourcePaths: overlapSources,
    });
  }

  return {
    reviewQueue: queue,
    topSchemaDecisions: [
      "Define canonical storage model for sim_agent_state snapshots (JSON envelope vs normalized child rows).",
      "Decide whether scenario_events should be append-only event logs or mutable stateful records.",
      "Decide trait/action namespace governance to avoid overlap with Enneagram and developmental intimacy layers.",
    ],
  };
}

async function writeReport(reportPath: string, payload: unknown): Promise<void> {
  await mkdir(join(reportPath, ".."), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function runCamptiConsciousnessSafeIngestion(options?: {
  workspaceRoot?: string;
  inputRoots?: string[];
  reportRoot?: string;
}) {
  const workspaceRoot = options?.workspaceRoot ?? process.cwd();
  const inputRoots = options?.inputRoots?.length ? options.inputRoots : [join(workspaceRoot, "uploads", "incoming")];
  const reportRoot = options?.reportRoot ?? join(workspaceRoot, "reports");
  const discoveredAt = new Date().toISOString();
  const ingestBatchId = `campti-consciousness-${Date.now()}`;

  const absoluteFiles = (
    await Promise.all(inputRoots.map((root) => walkFiles(root)))
  ).flat().filter((path) => !path.endsWith(".gitkeep"));

  const artifacts = await Promise.all(
    absoluteFiles.map((path) => buildArtifact(path, workspaceRoot, discoveredAt, ingestBatchId)),
  );

  const scopedArtifacts = artifacts.filter(isConsciousnessBuildArtifact);

  const practicalArtifacts = scopedArtifacts.filter(
    (artifact) => artifact.sourceCategory === "practical_simulation_architecture",
  );
  const researchArtifacts = scopedArtifacts.filter(
    (artifact) => artifact.sourceCategory === "conceptual_philosophical_research",
  );

  const sourceIngestReport = {
    generatedAt: discoveredAt,
    ingestBatchId,
    provenancePolicy: {
      preserveProvenance: true,
      keepCategoriesSeparated: true,
    },
    sources: artifacts.map((artifact) => ({
      filePath: artifact.filePath,
      sha256: artifact.sha256,
      byteSize: artifact.byteSize,
      sourceTitle: artifact.sourceTitle,
      sourceCategory: artifact.sourceCategory,
      inScopeForConsciousnessBuild: isConsciousnessBuildArtifact(artifact),
      uploadMetadata: artifact.uploadMetadata,
    })),
  };

  const structuralModel = {
    generatedAt: discoveredAt,
    ingestBatchId,
    category: "practical_simulation_architecture",
    ...extractStructuralModel(practicalArtifacts),
  };

  const researchModel = {
    generatedAt: discoveredAt,
    ingestBatchId,
    category: "conceptual_philosophical_research",
    ...extractResearchModel(researchArtifacts),
  };

  const runtimeMapping = {
    generatedAt: discoveredAt,
    ingestBatchId,
    ...buildRuntimeSafeMapping({ practicalArtifacts, structuralModel, researchModel }),
  };

  const reviewQueue = {
    generatedAt: discoveredAt,
    ingestBatchId,
    ...buildReviewQueue({ artifacts: scopedArtifacts, structuralModel, researchModel }),
  };

  const sourceReportPath = join(reportRoot, "campti-consciousness-source-ingest.json");
  const structuralReportPath = join(reportRoot, "campti-consciousness-structural-model.json");
  const researchReportPath = join(reportRoot, "campti-consciousness-research-model.json");
  const runtimeMappingPath = join(reportRoot, "campti-consciousness-runtime-mapping.json");
  const reviewQueuePath = join(reportRoot, "campti-consciousness-ingest-review-queue.json");

  await writeReport(sourceReportPath, sourceIngestReport);
  await writeReport(structuralReportPath, structuralModel);
  await writeReport(researchReportPath, researchModel);
  await writeReport(runtimeMappingPath, runtimeMapping);
  await writeReport(reviewQueuePath, reviewQueue);

  return {
    artifactsIndexed: artifacts.length,
    scopedArtifactsIndexed: scopedArtifacts.length,
    sourceFilesByCategory: {
      practical_simulation_architecture: practicalArtifacts.length,
      conceptual_philosophical_research: researchArtifacts.length,
    },
    reportsWritten: [
      toPosixRelativePath(sourceReportPath, workspaceRoot),
      toPosixRelativePath(structuralReportPath, workspaceRoot),
      toPosixRelativePath(researchReportPath, workspaceRoot),
      toPosixRelativePath(runtimeMappingPath, workspaceRoot),
      toPosixRelativePath(reviewQueuePath, workspaceRoot),
    ],
    topSchemaDecisions: reviewQueue.topSchemaDecisions,
  };
}
