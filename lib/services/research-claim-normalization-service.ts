import type { ExtractedClaimType } from "@/lib/domain/research-ingestion";

export type NormalizedClaimSeed = {
  claimType: ExtractedClaimType;
  claimText: string;
  confidence: number;
};

export class ResearchClaimNormalizationService {
  dedupeClaims(rows: NormalizedClaimSeed[]): NormalizedClaimSeed[] {
    const seen = new Set<string>();
    const out: NormalizedClaimSeed[] = [];
    for (const r of rows) {
      const key = `${r.claimType}::${r.claimText.toLowerCase().slice(0, 200)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }
}
