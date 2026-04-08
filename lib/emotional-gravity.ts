import {
  buildNarrativeConsciousnessContext,
  deriveEmotionalUndercurrent,
  deriveNarrativeGravityHooks,
  deriveSceneMysteryPressure,
  type NarrativeConsciousnessContext,
} from "@/lib/narrative-consciousness";
import { prisma } from "@/lib/prisma";

const PASS_STATUSES = ["accepted", "revised"] as const;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function textWeight(s: string | null | undefined): number {
  const t = s?.trim();
  if (!t) return 0;
  return clamp(Math.floor(t.length / 40), 1, 8);
}

/** 0–100 emotional pull score for a meta scene (heuristic, explainable). */
export async function scoreEmotionalGravity(metaSceneId: string): Promise<number> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: true,
  });
  if (!ctx) return 0;
  let score = 12;
  score += textWeight(ctx.metaFields.centralConflict) * 4;
  score += textWeight(ctx.metaFields.emotionalVoltage) * 5;
  score += textWeight(ctx.metaFields.symbolicElements) * 3;
  score += textWeight(deriveEmotionalUndercurrent(ctx)) * 2;
  score += Math.min(18, ctx.relationships.length * 5);
  score += Math.min(15, ctx.narrativePasses.length * 3);
  const hooks = deriveNarrativeGravityHooks(ctx);
  score += hooks.length * 3;
  return clamp(Math.round(score), 0, 100);
}

export async function deriveEmotionalHook(metaSceneId: string): Promise<string | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return null;
  const hooks = deriveNarrativeGravityHooks(ctx);
  return hooks[0] ?? deriveEmotionalUndercurrent(ctx) ?? null;
}

export async function deriveReaderPull(metaSceneId: string): Promise<string> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return "The scene asks for a slower breath.";
  const hooks = deriveNarrativeGravityHooks(ctx);
  if (hooks[0]) return hooks[0];
  return "Something here wants to be felt before it is understood.";
}

export async function deriveSceneLonging(metaSceneId: string): Promise<string | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return null;
  const longing = ctx.povPerson.profile?.coreLonging?.trim();
  if (longing) return longing.slice(0, 280);
  return ctx.metaFields.narrativePurpose?.trim().slice(0, 280) ?? null;
}

export async function deriveSceneThreatPulse(metaSceneId: string): Promise<string | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return null;
  const fear = ctx.povPerson.profile?.coreFear?.trim();
  const conflict = ctx.metaFields.centralConflict?.trim();
  if (fear && conflict) return `${conflict.slice(0, 120)} — and beneath it: ${fear.slice(0, 120)}`;
  return fear?.slice(0, 260) ?? conflict?.slice(0, 260) ?? null;
}

export async function deriveSceneTenderness(metaSceneId: string): Promise<string | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return null;
  const baseline = ctx.povPerson.profile?.emotionalBaseline?.trim();
  const sensory = ctx.metaFields.sensoryField?.trim();
  if (baseline && sensory) return `${sensory.slice(0, 140)} · ${baseline.slice(0, 140)}`;
  return baseline?.slice(0, 280) ?? sensory?.slice(0, 280) ?? null;
}

export async function deriveSceneMystery(metaSceneId: string): Promise<string | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return null;
  const m = deriveSceneMysteryPressure(ctx);
  return m || null;
}

export async function deriveEmotionalMomentumAcrossPasses(
  metaSceneId: string,
): Promise<{ rising: boolean; note: string }> {
  const passes = await prisma.metaSceneNarrativePass.findMany({
    where: { metaSceneId, status: { in: [...PASS_STATUSES] } },
    orderBy: { updatedAt: "asc" },
    select: { passType: true, summary: true, content: true },
  });
  if (passes.length < 2) {
    return {
      rising: false,
      note: "The scene holds in a single sustained register—for now.",
    };
  }
  const lens = ["relationship_pressure", "symbolic", "embodied", "full_structured"];
  let idx = 0;
  for (const p of passes) {
    if (lens.includes(p.passType)) idx++;
  }
  const rising = idx >= 2 || passes.length >= 4;
  const last = passes[passes.length - 1];
  const tail = last.summary?.trim() || last.content.slice(0, 160);
  return {
    rising,
    note: rising
      ? `Pressure accretes across passes—latest beat: ${tail}`
      : `The passes circle rather than climb—latest beat: ${tail}`,
  };
}

/** Normalized 0–1 vectors for perception timing (no extra round-trips). */
export type GravityTimingContext = {
  overallPressure: number;
  tenderness: number;
  threat: number;
  mystery: number;
  longing: number;
};

function textPull(s: string | null | undefined): number {
  const len = s?.trim().length ?? 0;
  return clamp(len / 520, 0, 1);
}

function deriveGravityTimingFromConsciousness(
  ctx: NarrativeConsciousnessContext,
  overallPressure: number,
): GravityTimingContext {
  const p = ctx.povPerson.profile;
  const tenderness =
    0.12 +
    textPull(p?.emotionalBaseline) * 0.38 +
    textPull(ctx.metaFields.sensoryField) * 0.28;
  const threat =
    0.08 +
    textPull(ctx.metaFields.centralConflict) * 0.42 +
    textPull(p?.coreFear) * 0.36 +
    (ctx.relationships[0]?.tension?.trim() ? 0.12 : 0);
  const mystery =
    0.1 +
    textPull(ctx.metaFields.historicalConstraints) * 0.32 +
    textPull(ctx.metaFields.symbolicElements) * 0.28 +
    (deriveSceneMysteryPressure(ctx).trim().length > 80 ? 0.12 : 0);
  const longing =
    0.08 +
    textPull(p?.coreLonging) * 0.48 +
    textPull(ctx.metaFields.narrativePurpose) * 0.22;
  return {
    overallPressure: clamp(overallPressure, 0, 1),
    tenderness: clamp(tenderness, 0, 1),
    threat: clamp(threat, 0, 1),
    mystery: clamp(mystery, 0, 1),
    longing: clamp(longing, 0, 1),
  };
}

/** For perception stream pacing: tenderness slows, threat sharpens, mystery holds. */
export async function buildGravityTimingContext(
  metaSceneId: string,
): Promise<GravityTimingContext> {
  const [ctx, score] = await Promise.all([
    buildNarrativeConsciousnessContext(metaSceneId, {
      publicOnly: true,
      includeRelationships: true,
    }),
    scoreEmotionalGravity(metaSceneId),
  ]);
  const pressure = clamp(score / 100, 0, 1);
  if (!ctx) {
    return {
      overallPressure: pressure,
      tenderness: 0.28,
      threat: 0.24,
      mystery: 0.28,
      longing: 0.26,
    };
  }
  return deriveGravityTimingFromConsciousness(ctx, pressure);
}
