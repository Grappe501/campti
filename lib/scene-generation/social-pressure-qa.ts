/**
 * Lightweight advisory: modeled social pressure vs. cues in generated prose.
 * Deterministic; does not auto-rewrite. Uses optional QA scalars from the live field.
 */

import type {
  SceneGenerationSocialBundleV1,
  SceneGenerationSocialQaScalars,
} from "@/lib/domain/scene-generation-social";

const AMBIENT_PATTERN =
  /\b(whisper|overheard|neighbor|neighbors|watch|watched|door|porch|church|master|priest|patrol|cousin|kin|kinfolk|household|shame|silence|notice|noticed|heard|listening|spoke|spoken|parish|yard|crowd|passerby|stranger|elders|deference|law|sheriff|judge)\b/i;

const HESITATION_PATTERN = /\b(hesitat|pause|lowered (his|her|their) voice|said nothing|held (his|her|their) tongue|glance|looked away|stepped back|stiff|still)\b/i;

/**
 * Returns author-facing advisory strings (merged into `warnings`).
 */
export function adviseSocialPressureInGeneratedProse(
  generatedText: string,
  bundle: SceneGenerationSocialBundleV1 | null,
  qaScalars?: SceneGenerationSocialQaScalars | null
): string[] {
  if (!bundle) return [];

  const words = generatedText.trim().split(/\s+/).filter(Boolean);
  if (words.length < 50) return [];

  const hits = (generatedText.match(AMBIENT_PATTERN) ?? []).length;
  const hitRate = hits / Math.max(1, Math.min(words.length, 220));
  const hesitationHits = (generatedText.match(HESITATION_PATTERN) ?? []).length;

  const witness = qaScalars?.witnessRisk01 ?? null;
  const gossip = qaScalars?.gossipRisk01 ?? null;
  const authority = qaScalars?.authorityPressure01 ?? null;

  const out: string[] = [];

  if (bundle.pressureIntensityScore >= 0.52 && hitRate < 0.028 && words.length > 120) {
    out.push(
      "[social-field] Low social-pressure expression: draft shows limited ambient inhabited-world texture (sound, neighbors, hierarchy). Optional pass—avoid data dumps."
    );
  }

  if (bundle.pressureIntensityScore >= 0.5 && hitRate < 0.022 && words.length > 160) {
    out.push(
      "[social-field] Scene may feel socially empty relative to modeled population density—consider subtle background life."
    );
  }

  if (witness != null && witness >= 0.55 && hitRate < 0.025 && hesitationHits < 2 && words.length > 140) {
    out.push(
      "[social-field] High witness risk in model not clearly reflected—consider hesitation, positioning, or off-stage listeners without stating odds."
    );
  }

  if (gossip != null && gossip >= 0.52 && !/\b(whisper|rumor|talk|said|heard|told)\b/i.test(generatedText) && words.length > 130) {
    out.push(
      "[social-field] Gossip risk is elevated in the model; prose rarely implies repetition or fear of talk—optional light touch."
    );
  }

  if (authority != null && authority >= 0.55 && hitRate < 0.03 && words.length > 150) {
    out.push(
      "[social-field] Authority atmosphere may be underrepresented—deference, timing, or fear of spectacle can register indirectly."
    );
  }

  return [...new Set(out)];
}
