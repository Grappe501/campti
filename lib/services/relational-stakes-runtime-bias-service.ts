import type { RelationalStakeProfile } from "@/lib/domain/epic-emotional-gravity";

export type RelationalStakesSceneBias = {
  activeRelationalStakeIds: string[];
  relationalThreatMap: Record<string, number>;
  foregroundSummary: string;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}

/**
 * Foregrounds threatened bonds, obligations, and repair difficulty for the current scene window.
 */
export class RelationalStakesRuntimeBiasService {
  derive(input: { profile: RelationalStakeProfile; participatingPeopleIds: string[] }): RelationalStakesSceneBias {
    const people = new Set(input.participatingPeopleIds);
    const relationalThreatMap: Record<string, number> = {};

    for (const t of input.profile.threatenedBonds) {
      relationalThreatMap[t.relationshipId] = clamp01(t.riskLevel);
    }
    for (const b of input.profile.breakRisks) {
      const prev = relationalThreatMap[b.relationshipId] ?? 0;
      relationalThreatMap[b.relationshipId] = clamp01(Math.max(prev, b.breakRisk));
    }

    for (const r of input.profile.repairDifficulty) {
      const prev = relationalThreatMap[r.relationshipId] ?? 0;
      relationalThreatMap[r.relationshipId] = clamp01(Math.max(prev, r.repairDifficulty * 0.92));
    }

    for (const d of input.profile.dependencyLines) {
      const prev = relationalThreatMap[d.relationshipId] ?? 0;
      const w = clamp01((d.asymmetry + d.exposureRisk) / 2);
      relationalThreatMap[d.relationshipId] = clamp01(Math.max(prev, w * 0.88));
    }

    for (const s of input.profile.shameLines) {
      const prev = relationalThreatMap[s.relationshipId] ?? 0;
      relationalThreatMap[s.relationshipId] = clamp01(Math.max(prev, s.suppressionCost * 0.82));
    }

    const activeRelationalStakeIds = Object.entries(relationalThreatMap)
      .filter(([, v]) => v >= 0.45)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    const obligation = input.profile.obligationLines
      .map((o) => `${o.relationshipId}: ${o.obligationStatement}`)
      .slice(0, 2);
    const unspoken = input.profile.unspokenNeeds
      .filter((n) => people.size === 0 || people.has(n.holderCharacterId))
      .map((n) => `${n.needStatement}`)
      .slice(0, 2);

    const shame = input.profile.shameLines
      .map((s) => `${s.shameSource} (cost ${s.suppressionCost.toFixed(2)})`)
      .slice(0, 2);

    const dependency = input.profile.dependencyLines
      .map(
        (d) =>
          `${d.relationshipId}: ${d.dependencyType} (asymmetry ${d.asymmetry.toFixed(2)}, exposure ${d.exposureRisk.toFixed(2)})`,
      )
      .slice(0, 2);

    const repair = input.profile.repairDifficulty
      .map((r) => `${r.relationshipId} repair=${r.repairDifficulty.toFixed(2)}: ${r.reasons.slice(0, 1).join("")}`)
      .slice(0, 2);

    const foregroundSummary = [
      `Relational stakes: threatened bonds ${activeRelationalStakeIds.join(", ") || "none above threshold"}.`,
      obligation.length ? `Obligation texture: ${obligation.join(" | ")}` : "",
      unspoken.length ? `Unspoken need (subtext/gesture): ${unspoken.join(" | ")}` : "",
      shame.length ? `Shame / withheld self: ${shame.join(" | ")}` : "",
      dependency.length ? `Dependency pressure: ${dependency.join(" | ")}` : "",
      repair.length ? `Repair-difficulty texture: ${repair.join(" | ")}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      activeRelationalStakeIds,
      relationalThreatMap,
      foregroundSummary,
    };
  }
}
