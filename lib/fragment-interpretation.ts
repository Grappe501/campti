import type { Fragment } from "@prisma/client";
import { FragmentType } from "@prisma/client";
import { classifyFragmentType, normalizeFragmentText } from "@/lib/fragment-decomposition";

export type FragmentLike = Pick<
  Fragment,
  | "text"
  | "fragmentType"
  | "primaryFragmentType"
  | "secondaryFragmentTypes"
  | "summary"
  | "emotionalTone"
  | "narrativeFunction"
  | "title"
>;

function secondaryTypes(fragment: FragmentLike): FragmentType[] {
  const raw = fragment.secondaryFragmentTypes;
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter((x): x is FragmentType =>
    typeof x === "string" && (Object.values(FragmentType) as string[]).includes(x),
  ) as FragmentType[];
}

export function deriveSurfaceMeaning(fragment: FragmentLike): string {
  const s = fragment.summary?.trim();
  if (s?.length) return s;
  const t = normalizeFragmentText(fragment.text);
  return t.slice(0, 280) + (t.length > 280 ? "…" : "");
}

export function deriveHiddenMeaning(fragment: FragmentLike): string {
  const t = normalizeFragmentText(fragment.text).toLowerCase();
  const hints: string[] = [];
  if (/\b(but|yet|though|instead)\b/.test(t)) hints.push("Contrast or qualification may reframe the obvious reading.");
  if (/\b(always|never|must)\b/.test(t)) hints.push("Normative or rule-like language — stakes may be moral or social, not literal.");
  if (/\b(smoke|river|fire|blood|stone)\b/.test(t)) hints.push("Concrete images may carry latent symbolic weight.");
  if (/\b(child|children|mother|elder)\b/.test(t)) hints.push("Kinship or generation language — watch power and care.");
  if (hints.length === 0) return "No strong implicit cues detected heuristically — review manually.";
  return hints.join(" ");
}

export function deriveEmotionalUse(fragment: FragmentLike): string {
  const tone = fragment.emotionalTone?.trim();
  if (tone) return `Emotional register: ${tone}. Useful for calibrating beat temperature in a scene.`;
  const t = fragment.text;
  if (/\b(fear|grief|love|dread|hope|loss)\b/i.test(t)) return "Carries explicit affect — can anchor or shift reader empathy.";
  return "Emotional use is latent — pair with POV state or sensory staging.";
}

export function deriveSymbolicUse(fragment: FragmentLike): string {
  const t = fragment.text.toLowerCase();
  if (/\b(smoke|water|fire|river|road|stone|ring)\b/.test(t)) {
    return "Image-rich — candidate for motif threading or recurring visual.";
  }
  if (fragment.fragmentType === FragmentType.SYMBOLIC_NOTE || secondaryTypes(fragment).includes(FragmentType.SYMBOLIC_NOTE)) {
    return "Tagged symbolic — use sparingly; let it press on action or dialogue.";
  }
  return "Symbolic layer optional — strengthen by echo elsewhere or tie to conflict.";
}

export function deriveNarrativeUse(fragment: FragmentLike): string {
  const fn = fragment.narrativeFunction?.trim();
  if (fn) return `Stated function: ${fn}`;
  const inferred = classifyFragmentType(fragment.text);
  return `Heuristic role: ${inferred.replace(/_/g, " ").toLowerCase()} — confirm against scene intent.`;
}

export type AlternatePlacement = {
  target: "memory" | "symbol" | "scene_action" | "continuity";
  rationale: string;
};

export function deriveAlternatePlacements(fragment: FragmentLike): AlternatePlacement[] {
  const t = normalizeFragmentText(fragment.text).toLowerCase();
  const out: AlternatePlacement[] = [];
  if (/\b(i remember|we remember|childhood|years ago)\b/.test(t)) {
    out.push({ target: "memory", rationale: "Memory-shaped language — could live in character memory or flashback." });
  }
  if (/\b(smoke|river|fire|blood|stone|threshold)\b/.test(t)) {
    out.push({ target: "symbol", rationale: "Image/motif language — could echo in symbol web or chapter returns." });
  }
  if (fragment.fragmentType === "DIALOGUE_SNIPPET" || /["“”']/.test(fragment.text)) {
    out.push({ target: "scene_action", rationale: "Speech-forward — strong in scene body, weaker as exposition." });
  }
  if (/\b(must not|cannot contradict|continuity|timeline)\b/.test(t)) {
    out.push({ target: "continuity", rationale: "Constraint tone — map to continuity notes or canon rules." });
  }
  if (out.length === 0) {
    out.push({ target: "scene_action", rationale: "Default: embed as beat or texture unless profiled otherwise." });
  }
  return out.slice(0, 4);
}

export function deriveSceneReadinessScore(fragment: FragmentLike): number {
  let s = 3;
  const text = fragment.text.trim();
  if (text.length > 80 && text.length < 900) s += 1;
  if (fragment.summary?.trim()) s += 1;
  if (fragment.emotionalTone?.trim()) s += 1;
  if (fragment.narrativeFunction?.trim()) s += 1;
  if (/\b(but|yet|though)\b/i.test(text)) s += 0; // tension doesn't always mean ready
  return Math.min(5, Math.max(1, s));
}
