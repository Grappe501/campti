import {
  MANUSCRIPT_COHERENCE_CONTRACT_VERSION,
  type ManuscriptCoherenceFinding,
  type ManuscriptCoherenceReport,
} from "@/lib/domain/manuscript-coherence";

function riskFromFindings(findings: ManuscriptCoherenceFinding[], prefix: string): "low" | "moderate" | "high" {
  const relevant = findings.filter((finding) => finding.findingId.startsWith(prefix));
  if (relevant.some((finding) => finding.severity === "high")) return "high";
  if (relevant.some((finding) => finding.severity === "moderate")) return "moderate";
  return "low";
}

export function evaluateManuscriptCoherence(input: {
  manuscriptId: string;
  findings: ManuscriptCoherenceFinding[];
}): ManuscriptCoherenceReport {
  const chapterBrittlenessRisk = riskFromFindings(input.findings, "brittleness");
  const pressureDriftRisk = riskFromFindings(input.findings, "pressure");
  const hasHighContradiction = input.findings.some(
    (finding) => finding.category === "contradiction" && finding.severity === "high"
  );

  return {
    contractVersion: MANUSCRIPT_COHERENCE_CONTRACT_VERSION,
    manuscriptId: input.manuscriptId,
    findings: input.findings,
    chapterBrittlenessRisk,
    pressureDriftRisk,
    coherencePass: !hasHighContradiction && chapterBrittlenessRisk !== "high" && pressureDriftRisk !== "high",
  };
}
