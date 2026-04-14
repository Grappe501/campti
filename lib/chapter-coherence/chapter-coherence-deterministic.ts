import { createHash } from "node:crypto";

import { NarrativeAssemblyStatus, NarrativeContinuityState } from "@prisma/client";

import type {
  ChapterCoherenceIssue,
  ChapterCoherenceReport,
  ChapterEndingAssessment,
  ChapterOpeningAssessment,
  ChapterRevealAssessment,
  ChapterRhythmAssessment,
  ChapterTransitionAssessment,
  SceneOrderSummary,
} from "@/lib/domain/chapter-coherence";
import { CHAPTER_COHERENCE_REPORT_VERSION } from "@/lib/domain/chapter-coherence";

export type ChapterSceneAnalysisRow = {
  id: string;
  orderInChapter: number | null;
  sceneNumber: number | null;
  description: string;
  summary: string | null;
  narrativeIntent: string | null;
  emotionalTone: string | null;
  pov: string | null;
  continuityState: NarrativeContinuityState;
  narrativeAssemblyStatus: NarrativeAssemblyStatus;
  /** Reader-layer text used for length / overlap (already resolved). */
  readerText: string;
};

const REVEAL_WORDS = /\b(reveal|secret|discovers?|learns?|truth|exposes?|confesses?|admits?|hidden)\b/gi;
const DIALOGUE_HINT = /[""«»]|^[\s]*—|^[\s]*–/;
const HOOK_PUNCT = /[?!]/;

function normTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function toneProxy(s: string | null | undefined): number {
  const t = (s ?? "").toLowerCase();
  let x = 0.5;
  if (/calm|quiet|soft|peace|rest|still/.test(t)) x -= 0.25;
  if (/violent|panic|rage|terror|fight|blood|storm|crisis/.test(t)) x += 0.35;
  if (/tension|fear|dread|unease|worry/.test(t)) x += 0.15;
  return Math.min(1, Math.max(0, x));
}

function beatLabel(intent: string | null, tone: string | null, description: string): string {
  const blob = `${intent ?? ""} ${tone ?? ""} ${description}`.toLowerCase();
  if (/dialogue|conversation|speak|said|asks?/.test(blob)) return "dialogue";
  if (/fight|chase|flight|storm|battle|run|rush/.test(blob)) return "action";
  if (/think|remember|feel|interior|reflect|memory|doubt/.test(blob)) return "introspection";
  if (/letter|news|explain|plan|meet|arrive|depart/.test(blob)) return "exposition";
  return "mixed";
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = nums.reduce((a, b) => a + b, 0) / nums.length;
  const v = nums.reduce((s, n) => s + (n - m) ** 2, 0) / nums.length;
  return Math.sqrt(v);
}

function coefficientOfVariation(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const m = nums.reduce((a, b) => a + b, 0) / nums.length;
  if (m === 0) return null;
  return stdDev(nums) / m;
}

export function analyzeChapterSceneOrder(scenes: ChapterSceneAnalysisRow[]): SceneOrderSummary {
  const ordered = [...scenes].sort((a, b) => {
    const oa = a.orderInChapter ?? 1e9;
    const ob = b.orderInChapter ?? 1e9;
    if (oa !== ob) return oa - ob;
    return (a.sceneNumber ?? 0) - (b.sceneNumber ?? 0);
  });
  const orderedSceneIds = ordered.map((s) => s.id);
  const issues: ChapterCoherenceIssue[] = [];
  const orders = ordered.map((s) => s.orderInChapter).filter((n): n is number => n != null);
  const seen = new Set<number>();
  for (const o of orders) {
    if (seen.has(o)) {
      issues.push({
        code: "scene_order.gap_or_duplicate",
        severity: "warning",
        message: `Duplicate orderInChapter value (${o}).`,
        sceneIds: ordered.filter((s) => s.orderInChapter === o).map((s) => s.id),
      });
    }
    seen.add(o);
  }
  if (orders.length >= 2) {
    const sorted = [...orders].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i]! - sorted[i - 1]! > 1) {
        issues.push({
          code: "scene_order.gap_or_duplicate",
          severity: "info",
          message: `Gap in orderInChapter sequence (${sorted[i - 1]} → ${sorted[i]}).`,
          sceneIds: [],
          evidence: { gapFrom: sorted[i - 1]!, gapTo: sorted[i]! },
        });
      }
    }
  }
  const nullOrder = ordered.filter((s) => s.orderInChapter == null).length;
  if (nullOrder > 0 && nullOrder < ordered.length) {
    issues.push({
      code: "scene_order.unsorted",
      severity: "warning",
      message: "Some scenes lack orderInChapter while others are ordered—sorting may be ambiguous.",
      sceneIds: ordered.filter((s) => s.orderInChapter == null).map((s) => s.id),
    });
  }
  return {
    orderedSceneIds,
    orderSource: "orderInChapter_then_sceneNumber",
    issues,
  };
}

export function assessChapterTransitions(scenes: ChapterSceneAnalysisRow[]): ChapterTransitionAssessment {
  const ordered = [...scenes].sort((a, b) => {
    const oa = a.orderInChapter ?? 1e9;
    const ob = b.orderInChapter ?? 1e9;
    if (oa !== ob) return oa - ob;
    return (a.sceneNumber ?? 0) - (b.sceneNumber ?? 0);
  });
  const pairs: ChapterTransitionAssessment["pairs"] = [];
  let abrupt = 0;
  for (let i = 0; i < ordered.length - 1; i++) {
    const prev = ordered[i]!;
    const next = ordered[i + 1]!;
    const prevTokens = normTokens(prev.readerText.slice(0, 220)).slice(0, 40);
    const nextTokens = normTokens(next.readerText.slice(0, 220)).slice(0, 40);
    const overlap = jaccard(prevTokens, nextTokens);
    const povPrev = (prev.pov ?? "").trim().toLowerCase();
    const povNext = (next.pov ?? "").trim().toLowerCase();
    const povShift = Boolean(povPrev && povNext && povPrev !== povNext);
    const tonePrev = toneProxy(prev.emotionalTone);
    const toneNext = toneProxy(next.emotionalTone);
    const toneDelta = Math.abs(tonePrev - toneNext);
    const abruptPair = (povShift && overlap < 0.05) || (toneDelta > 0.55 && overlap < 0.08);
    const notes: string[] = [];
    if (povShift) notes.push("POV label differs across boundary.");
    if (overlap < 0.06) notes.push("Low lexical overlap between scene openings.");
    if (toneDelta > 0.5) notes.push("Large emotional-tone proxy delta.");
    if (abruptPair) abrupt++;
    pairs.push({
      prevSceneId: prev.id,
      nextSceneId: next.id,
      povShift,
      toneDelta,
      lexicalOverlap: overlap,
      abrupt: abruptPair,
      notes,
    });
  }
  return {
    pairCount: pairs.length,
    pairs,
    abruptTransitionCount: abrupt,
  };
}

export function assessChapterRhythm(scenes: ChapterSceneAnalysisRow[]): ChapterRhythmAssessment {
  const ordered = [...scenes].sort((a, b) => {
    const oa = a.orderInChapter ?? 1e9;
    const ob = b.orderInChapter ?? 1e9;
    if (oa !== ob) return oa - ob;
    return (a.sceneNumber ?? 0) - (b.sceneNumber ?? 0);
  });
  const sceneWordCounts = ordered.map((s) => normTokens(s.readerText).length);
  const cv = coefficientOfVariation(sceneWordCounts);
  const beatLabels = ordered.map((s) => beatLabel(s.narrativeIntent, s.emotionalTone, s.description));
  let run = 1;
  let maxRun = 1;
  for (let i = 1; i < beatLabels.length; i++) {
    if (beatLabels[i] === beatLabels[i - 1] && beatLabels[i] !== "mixed") {
      run++;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 1;
    }
  }
  const tensionProxyByScene = ordered.map((s) => toneProxy(s.emotionalTone));
  let flatTension = false;
  if (tensionProxyByScene.length >= 4) {
    const tcv = coefficientOfVariation(tensionProxyByScene);
    flatTension = tcv != null && tcv < 0.12;
  }
  const notes: string[] = [];
  if (cv != null && cv < 0.18 && sceneWordCounts.length >= 3) {
    notes.push("Scene lengths are unusually uniform—rhythm may feel flat.");
  }
  if (maxRun >= 3) {
    notes.push("Several consecutive scenes share the same beat label.");
  }
  if (flatTension) {
    notes.push("Tension proxy varies little across the chapter.");
  }
  return {
    sceneWordCounts,
    lengthCoefficientOfVariation: cv,
    beatLabels,
    longestRepeatedBeatRun: maxRun,
    tensionProxyByScene,
    flatTensionCurve: flatTension,
    notes,
  };
}

export function assessChapterRevealFlow(scenes: ChapterSceneAnalysisRow[]): ChapterRevealAssessment {
  const ordered = [...scenes].sort((a, b) => {
    const oa = a.orderInChapter ?? 1e9;
    const ob = b.orderInChapter ?? 1e9;
    if (oa !== ob) return oa - ob;
    return (a.sceneNumber ?? 0) - (b.sceneNumber ?? 0);
  });
  const revealKeywordHitsByScene = ordered.map((s) => {
    const blob = `${s.summary ?? ""} ${s.narrativeIntent ?? ""} ${s.description}`.slice(0, 8000);
    const m = blob.match(REVEAL_WORDS);
    return m?.length ?? 0;
  });
  let firstHeavy: number | null = null;
  for (let i = 0; i < revealKeywordHitsByScene.length; i++) {
    if (revealKeywordHitsByScene[i]! >= 2) {
      firstHeavy = i;
      break;
    }
  }
  const n = ordered.length;
  const revealTooEarly = n >= 3 && firstHeavy === 0 && revealKeywordHitsByScene[0]! >= 2;
  const late = revealKeywordHitsByScene.slice(Math.max(0, n - 2)).reduce((a, b) => a + b, 0);
  const early = revealKeywordHitsByScene.slice(0, Math.min(2, n)).reduce((a, b) => a + b, 0);
  const crowdedLateReveals = n >= 4 && late >= 3 && early >= 1;
  const notes: string[] = [];
  if (revealTooEarly) notes.push("Heavy reveal language appears very early in the chapter.");
  if (crowdedLateReveals) notes.push("Several reveal-like beats cluster late.");
  return {
    revealKeywordHitsByScene,
    firstHeavyRevealIndex: firstHeavy,
    revealTooEarly,
    crowdedLateReveals,
    notes,
  };
}

export function assessChapterOpening(scenes: ChapterSceneAnalysisRow[]): ChapterOpeningAssessment {
  const ordered = [...scenes].sort((a, b) => {
    const oa = a.orderInChapter ?? 1e9;
    const ob = b.orderInChapter ?? 1e9;
    if (oa !== ob) return oa - ob;
    return (a.sceneNumber ?? 0) - (b.sceneNumber ?? 0);
  });
  const first = ordered[0];
  if (!first) {
    return {
      firstSceneId: null,
      firstSceneWordCount: 0,
      weakHook: true,
      slowStart: true,
      notes: ["No scenes in chapter."],
    };
  }
  const wc = normTokens(first.readerText).length;
  const head = first.readerText.slice(0, 220);
  const weakHook = wc < 90 && !DIALOGUE_HINT.test(head) && !HOOK_PUNCT.test(head.slice(0, 80));
  const slowStart = wc > 220 && !HOOK_PUNCT.test(head.slice(0, 120));
  const notes: string[] = [];
  if (weakHook) notes.push("Opening scene is short and lacks a strong hook signal.");
  if (slowStart) notes.push("Opening scene is long before a strong beat or question.");
  return {
    firstSceneId: first.id,
    firstSceneWordCount: wc,
    weakHook,
    slowStart,
    notes,
  };
}

export function assessChapterEnding(scenes: ChapterSceneAnalysisRow[]): ChapterEndingAssessment {
  const ordered = [...scenes].sort((a, b) => {
    const oa = a.orderInChapter ?? 1e9;
    const ob = b.orderInChapter ?? 1e9;
    if (oa !== ob) return oa - ob;
    return (a.sceneNumber ?? 0) - (b.sceneNumber ?? 0);
  });
  const last = ordered[ordered.length - 1];
  if (!last) {
    return {
      lastSceneId: null,
      lastSceneWordCount: 0,
      endsWithQuestion: false,
      weakCadence: true,
      notes: ["No scenes in chapter."],
    };
  }
  const wc = normTokens(last.readerText).length;
  const tail = last.readerText.slice(-400).trim();
  const endsWithQuestion = /\?\s*$/.test(tail);
  const weakCadence = wc < 50 && !endsWithQuestion;
  const notes: string[] = [];
  if (weakCadence) notes.push("Final scene is very short—ending may feel abrupt.");
  if (!endsWithQuestion && wc < 120) notes.push("Ending lacks a strong closing turn or question.");
  return {
    lastSceneId: last.id,
    lastSceneWordCount: wc,
    endsWithQuestion,
    weakCadence,
    notes,
  };
}

function pushIssue(
  list: ChapterCoherenceIssue[],
  issue: Omit<ChapterCoherenceIssue, "sceneIds"> & { sceneIds?: string[] }
) {
  list.push({
    ...issue,
    sceneIds: issue.sceneIds ?? [],
  });
}

function scoreFromIssues(issues: ChapterCoherenceIssue[]): number {
  let s = 100;
  for (const i of issues) {
    if (i.severity === "blocking") s -= 18;
    else if (i.severity === "warning") s -= 8;
    else s -= 3;
  }
  return Math.max(0, Math.min(100, Math.round(s)));
}

export function buildChapterCoherenceReportFromScenes(input: {
  chapterId: string;
  bookId: string;
  title: string;
  scenes: ChapterSceneAnalysisRow[];
}): ChapterCoherenceReport {
  const scenes = input.scenes;
  const sceneOrderSummary = analyzeChapterSceneOrder(scenes);
  const transitionAssessments = assessChapterTransitions(scenes);
  const rhythmAssessment = assessChapterRhythm(scenes);
  const revealAssessment = assessChapterRevealFlow(scenes);
  const openingAssessment = assessChapterOpening(scenes);
  const endingAssessment = assessChapterEnding(scenes);

  const coherenceIssues: ChapterCoherenceIssue[] = [...sceneOrderSummary.issues];

  for (const p of transitionAssessments.pairs) {
    if (p.abrupt) {
      pushIssue(coherenceIssues, {
        code: "transition.abrupt_handoff",
        severity: "warning",
        message: "Abrupt transition between adjacent scenes (POV/tone vs overlap).",
        sceneIds: [p.prevSceneId, p.nextSceneId],
        evidence: { lexicalOverlap: p.lexicalOverlap, toneDelta: p.toneDelta },
      });
    }
  }

  if (rhythmAssessment.longestRepeatedBeatRun >= 3) {
    pushIssue(coherenceIssues, {
      code: "rhythm.repeated_beat_streak",
      severity: "info",
      message: "Several consecutive scenes share the same beat label.",
      sceneIds: [],
          evidence: { run: rhythmAssessment.longestRepeatedBeatRun },
    });
  }
  if (rhythmAssessment.flatTensionCurve) {
    pushIssue(coherenceIssues, {
      code: "rhythm.flat_tension_curve",
      severity: "warning",
      message: "Tension proxy is flat across the chapter.",
      sceneIds: [],
    });
  }
  if (
    rhythmAssessment.lengthCoefficientOfVariation != null &&
    rhythmAssessment.lengthCoefficientOfVariation < 0.18 &&
    scenes.length >= 3
  ) {
    pushIssue(coherenceIssues, {
      code: "rhythm.flat_scene_lengths",
      severity: "info",
      message: "Scene lengths are unusually uniform.",
      sceneIds: [],
          evidence: { cv: rhythmAssessment.lengthCoefficientOfVariation },
    });
  }

  if (revealAssessment.revealTooEarly) {
    pushIssue(coherenceIssues, {
      code: "reveal.too_early",
      severity: "warning",
      message: "Reveal-heavy language appears in the first scene of a multi-scene chapter.",
      sceneIds: sceneOrderSummary.orderedSceneIds.slice(0, 1),
    });
  }
  if (revealAssessment.crowdedLateReveals) {
    pushIssue(coherenceIssues, {
      code: "reveal.crowded_late",
      severity: "info",
      message: "Several reveal-like beats may cluster late.",
      sceneIds: sceneOrderSummary.orderedSceneIds.slice(-2),
    });
  }

  if (openingAssessment.weakHook) {
    pushIssue(coherenceIssues, {
      code: "opening.weak_hook",
      severity: "warning",
      message: "Opening scene may lack a strong hook.",
      sceneIds: openingAssessment.firstSceneId ? [openingAssessment.firstSceneId] : [],
    });
  }
  if (openingAssessment.slowStart) {
    pushIssue(coherenceIssues, {
      code: "opening.slow_start",
      severity: "info",
      message: "Opening scene may be slow to deliver a strong beat.",
      sceneIds: openingAssessment.firstSceneId ? [openingAssessment.firstSceneId] : [],
    });
  }
  if (endingAssessment.weakCadence) {
    pushIssue(coherenceIssues, {
      code: "ending.weak_cadence",
      severity: "info",
      message: "Final scene may feel thin or abrupt.",
      sceneIds: endingAssessment.lastSceneId ? [endingAssessment.lastSceneId] : [],
    });
  }

  const povs = scenes.map((s) => (s.pov ?? "").trim().toLowerCase()).filter(Boolean);
  const uniquePov = new Set(povs);
  if (uniquePov.size > 1 && scenes.length > 2) {
    pushIssue(coherenceIssues, {
      code: "pov.inconsistent_sequence",
      severity: "info",
      message: "Multiple POV labels across scenes—ensure shifts are intentional.",
      sceneIds: [],
          evidence: { distinctPovCount: uniquePov.size },
    });
  }

  for (const s of scenes) {
    if (s.continuityState === NarrativeContinuityState.WARNING) {
      pushIssue(coherenceIssues, {
        code: "pressure.continuity_warning_scene",
        severity: "warning",
        message: "Scene has continuity WARNING.",
        sceneIds: [s.id],
      });
    }
    if (!s.readerText.trim()) {
      pushIssue(coherenceIssues, {
        code: "assembly.empty_scene_slice",
        severity: "blocking",
        message: "Scene contributes no reader text to assembly.",
        sceneIds: [s.id],
      });
    }
  }

  const inputContentHash = createHash("sha256")
    .update(
      JSON.stringify({
        chapterId: input.chapterId,
        sceneIds: sceneOrderSummary.orderedSceneIds,
        sceneHashes: scenes.map((s) =>
          createHash("sha256").update(s.readerText.slice(0, 12000)).digest("hex")
        ),
      })
    )
    .digest("hex");

  const overallCoherenceScore = scoreFromIssues(coherenceIssues);

  return {
    contractVersion: CHAPTER_COHERENCE_REPORT_VERSION,
    chapterId: input.chapterId,
    bookId: input.bookId,
    title: input.title,
    sceneCount: scenes.length,
    sceneOrderSummary,
    transitionAssessments,
    rhythmAssessment,
    revealAssessment,
    openingAssessment,
    endingAssessment,
    coherenceIssues,
    overallCoherenceScore,
    advisoryOnly: true,
    inputContentHash,
    builtAtIso: new Date().toISOString(),
  };
}
