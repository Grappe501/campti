import {
  ANOMALY_DETECTION_CONTRACT_VERSION,
  type OperationalAnomaly,
  type AnomalySeverity,
} from "@/lib/domain/anomaly-detection";

type AnomalyMetricInput = {
  metric: OperationalAnomaly["category"];
  current: number;
  baseline: number;
  thresholdMultiplier: number;
  likelyCauseHints: string[];
  explanation: string;
};

function severityFromRatio(ratio: number): AnomalySeverity {
  if (ratio >= 2.5) return "critical";
  if (ratio >= 1.5) return "warning";
  return "info";
}

export function detectOperationalAnomalies(input: {
  metrics: AnomalyMetricInput[];
}): OperationalAnomaly[] {
  const anomalies: OperationalAnomaly[] = [];

  for (const metricInput of input.metrics) {
    const baseline = Math.max(metricInput.baseline, 0.0001);
    const ratio = metricInput.current / baseline;
    if (ratio < metricInput.thresholdMultiplier) continue;

    anomalies.push({
      contractVersion: ANOMALY_DETECTION_CONTRACT_VERSION,
      anomalyId: `${metricInput.metric}:${anomalies.length + 1}`,
      category: metricInput.metric,
      severity: severityFromRatio(ratio),
      metricValue: metricInput.current,
      baselineValue: metricInput.baseline,
      likelyCauseHints: metricInput.likelyCauseHints,
      operatorExplanation: metricInput.explanation,
      explainableRule: `current/baseline ratio ${ratio.toFixed(3)} >= threshold ${metricInput.thresholdMultiplier.toFixed(3)}`,
      nonOmniscient: true,
    });
  }

  return anomalies;
}
