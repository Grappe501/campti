import type { PerceptionUnit } from "@/lib/perception-stream";
import {
  deriveDeepReadingPrompts,
  deriveGuidedPrompts,
} from "@/lib/guided-experience";

export type InternalizedGuidance = {
  marginCues: string[];
  attentionCues: string[];
};

export type GuidedAttentionCue = {
  id: string;
  text: string;
  afterUnitIndex: number;
};

async function loadGuidancePrompts(metaSceneId: string): Promise<string[]> {
  const [guided, deep] = await Promise.all([
    deriveGuidedPrompts(metaSceneId),
    deriveDeepReadingPrompts(metaSceneId),
  ]);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of [...guided, ...deep]) {
    const k = p.slice(0, 48);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
    if (out.length >= 8) break;
  }
  return out;
}

/** Lightly weave guided prompts into the awareness layer (not a lecture overlay). */
export function fuseGuidedPromptIntoPerceptionStream(
  streamUnits: PerceptionUnit[],
  prompts: string[],
): PerceptionUnit[] {
  if (!prompts.length) return streamUnits;
  const fused: PerceptionUnit[] = [];
  let pi = 0;
  streamUnits.forEach((u, i) => {
    fused.push(u);
    if (pi < prompts.length && (i + 1) % 2 === 0 && u.unitType !== "continuation_impulse") {
      const text = prompts[pi]?.trim();
      pi++;
      if (!text) return;
      fused.push({
        id: `guided-${i}-${pi}`,
        unitType: "unspoken_thought",
        summary: text,
        timingHint: "hold",
        emotionalWeight: 0.35,
        voicePriority: 0.25,
        notes: "guided_cue",
      });
    }
  });
  return fused;
}

export async function deriveInternalizedGuidance(metaSceneId: string): Promise<InternalizedGuidance> {
  const prompts = await loadGuidancePrompts(metaSceneId);
  const marginCues = prompts.slice(0, 3);
  const attentionCues = prompts.slice(3, 6);
  return { marginCues, attentionCues };
}

export async function deriveAttentionCues(metaSceneId: string): Promise<GuidedAttentionCue[]> {
  const prompts = await loadGuidancePrompts(metaSceneId);
  return prompts.slice(0, 4).map((text, i) => ({
    id: `att-${i}`,
    text,
    afterUnitIndex: i * 2 + 1,
  }));
}
