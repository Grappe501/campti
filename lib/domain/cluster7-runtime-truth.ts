import type { ArtifactTruthStamp, CanonicalArtifactRecord } from "@/lib/domain/canonical-artifact-governance";
import type { PersistenceGovernanceDecision } from "@/lib/domain/persistence-governance";
import type { ReadinessCertificationEvidenceRecord } from "@/lib/domain/readiness-certification-depth";
import type { RuntimeSemanticInvariantReport } from "@/lib/domain/runtime-semantic-invariant";

export const CLUSTER7_RUNTIME_TRUTH_CONTRACT_VERSION = "1" as const;

export type CrossSystemDriftFinding = {
  code: string;
  severity: "error" | "warning";
  message: string;
  layers: Array<"runtime" | "artifact" | "cockpit" | "readiness" | "persistence">;
};

export type CrossSystemDriftReport = {
  contractVersion: typeof CLUSTER7_RUNTIME_TRUTH_CONTRACT_VERSION;
  runId: string;
  sceneId: string;
  findings: CrossSystemDriftFinding[];
  hasError: boolean;
  validationFlags: string[];
};

/** Single envelope attached to canonical scene generation runs (Cluster 7). */
export type Cluster7RuntimeTruthEnvelope = {
  contractVersion: typeof CLUSTER7_RUNTIME_TRUTH_CONTRACT_VERSION;
  runId: string;
  semanticInvariantReport: RuntimeSemanticInvariantReport;
  canonicalArtifact: CanonicalArtifactRecord;
  truthStamp: ArtifactTruthStamp;
  persistenceGovernance: PersistenceGovernanceDecision;
  readinessCertification: ReadinessCertificationEvidenceRecord;
  driftReport: CrossSystemDriftReport;
};
