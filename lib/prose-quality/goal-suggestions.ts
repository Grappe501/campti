import type {
  AuthorSceneGoals,
  ProseQualityReportV1,
  RewriteSuggestion,
} from "@/lib/prose-quality/types";

let sid = 0;
function id(): string {
  sid += 1;
  return `sug_${sid}`;
}

/**
 * Rule-based rewrite prompts from author goals + deterministic report—human applies.
 * Optional: feed `RewriteSuggestion[]` + report JSON into an AI assist step as structured constraints.
 */
export function suggestionsFromGoalsAndReport(
  goals: AuthorSceneGoals | undefined,
  report: ProseQualityReportV1,
  /** Full scene prose (lowercased internally)—used for land/body lexical goals. */
  proseText?: string
): RewriteSuggestion[] {
  sid = 0;
  const out: RewriteSuggestion[] = [];

  if (goals?.privilegeSilence) {
    const expositionHeavy =
      report.issues.some((i) => i.code === "sensory.thin") &&
      report.proseStats.wordCount > 180;
    if (expositionHeavy) {
      out.push({
        id: id(),
        priority: 2,
        target: "scene",
        message:
          "Silence/motive goal vs thin sensory report: cut one explanatory beat; replace with withheld line or gesture.",
        craftMoves: [
          "Delete one sentence that names the emotion directly.",
          "End a paragraph early; leave the next beat unstated.",
          "Swap one line of interior summary for a single physical obstruction (door, hand, heat).",
        ],
      });
    }
  }

  if (goals?.requireLandAnchor) {
    const landHints = [
      "land",
      "acre",
      "river",
      "bluff",
      "field",
      "timber",
      "soil",
      "fence",
      "boundary",
      "deed",
      "clearing",
    ];
    const lower = (proseText ?? "").toLowerCase();
    const hit = landHints.some((h) => lower.includes(h));
    if (!hit && report.proseStats.wordCount > 120) {
      out.push({
        id: id(),
        priority: 3,
        target: "paragraph",
        message:
          "Land/tenure anchor requested: no strong land lexicon in thin/excerpt windows—tie bodies to ground.",
        craftMoves: [
          "Name one soil or slope quality underfoot.",
          "Place labor (tool, crop, water) in the same beat as dialogue.",
          "If law/ownership matters, imply it through boundary marker or dispute object—not abstract 'the land'.",
        ],
      });
    }
  }

  if (goals?.requireBodyAnchors) {
    if (report.sensory.ratio < 0.4) {
      out.push({
        id: id(),
        priority: 2,
        target: "sentence",
        message:
          "Body anchor goal: increase embodied verbs and contact points (hands, jaw, breath, spine).",
        craftMoves: [
          "Add one sentence where the POV notices a small pain or comfort.",
          "Replace one state-of-mind clause with temperature, weight, or sound in the throat.",
        ],
      });
    }
  }

  if (
    goals?.minHistoricalTermHits != null &&
    report.historicalAnchors &&
    report.historicalAnchors.termsFound.length < goals.minHistoricalTermHits
  ) {
    out.push({
      id: id(),
      priority: 3,
      target: "scene",
      message: `Historical anchor quota not met (found ${report.historicalAnchors.termsFound.length}, min ${goals.minHistoricalTermHits}).`,
      craftMoves: [
        "Introduce one period-accurate tool, garment, or legal constraint in scene action.",
        "Let a character misuse or negotiate a period term—shows lived fluency.",
      ],
    });
  }

  if (report.rhythm.monotonousRhythm) {
    out.push({
      id: id(),
      priority: 2,
      target: "sentence",
      message: "Rhythm monotony flagged—vary length and withholding.",
      craftMoves: [
        "Follow one long sentence with a three-word line.",
        "Break one compound sentence into fragments after a hard beat.",
      ],
    });
  }

  if (report.cliche.hits.length >= 2) {
    out.push({
      id: id(),
      priority: 2,
      target: "sentence",
      message: "Replace flagged generic phrases with scene-specific images.",
      craftMoves: [
        `Rewrite cliché: “${report.cliche.hits[0]?.phrase}” using local material detail.`,
      ],
    });
  }

  out.sort((a, b) => b.priority - a.priority);
  return out;
}
