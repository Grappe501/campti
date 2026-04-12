export type InstinctKey = "sp" | "so" | "sx";

/** Deterministic modifiers from instinct order (sp/so/sx). Blind spot = last in stack. */
export type InstinctStackingCognition = {
  /** Deltas applied to 0–100 pressure scalars before integration resolution. */
  lawPunishmentDelta: number;
  honorShameDelta: number;
  angerCueDelta: number;
  socialRiskCueDelta: number;
  hopeCueDelta: number;
  tags: string[];
  tabooLayer: string;
  obligationFlavor: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function parseInstinctStackOrder(raw: string | null | undefined): InstinctKey[] | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .toLowerCase()
    .replace(/\s+/g, "")
    .split(/[_\-/,]+/)
    .filter(Boolean);
  const out: InstinctKey[] = [];
  for (const p of parts) {
    if (p === "sp" || p === "so" || p === "sx") out.push(p);
  }
  return out.length ? out : null;
}

/**
 * Same world cues land differently: sp-first weighs survival/turf; so-first weighs face and rank;
 * sx-first weighs rivalry, heat, and pair-bond stakes. Blind spot (last) is where cognition under-reads risk.
 */
export function getInstinctStackingCognitionDeltas(
  stacking: string | null | undefined
): InstinctStackingCognition {
  const order = parseInstinctStackOrder(stacking ?? null);
  if (!order?.length) {
    return {
      lawPunishmentDelta: 0,
      honorShameDelta: 0,
      angerCueDelta: 0,
      socialRiskCueDelta: 0,
      hopeCueDelta: 0,
      tags: [],
      tabooLayer: "",
      obligationFlavor: "",
    };
  }

  const dom = order[0];
  const blind = order[order.length - 1];
  const tags = [`instinct_stack:${order.join("_")}`, `dominant_${dom}`];

  let lawPunishmentDelta = 0;
  let honorShameDelta = 0;
  let angerCueDelta = 0;
  let socialRiskCueDelta = 0;
  let hopeCueDelta = 0;

  if (dom === "sp") {
    lawPunishmentDelta = 7;
    socialRiskCueDelta = -5;
    tags.push("sp_emphasis_resources_body_security");
  } else if (dom === "so") {
    honorShameDelta = 9;
    socialRiskCueDelta = 7;
    tags.push("so_emphasis_rank_reputation_belonging");
  } else {
    angerCueDelta = 6;
    hopeCueDelta = 4;
    tags.push("sx_emphasis_bond_rivalry_intensity");
  }

  let tabooLayer = "";
  if (blind === "sp") {
    tabooLayer =
      "blind_self_preservation: underestimates hunger, shelter, and material consequence until crisis.";
  } else if (blind === "so") {
    tabooLayer =
      "blind_social: underestimates public shame, gossip, and standing loss until it lands.";
  } else if (blind === "sx") {
    tabooLayer =
      "blind_one_to_one: underestimates jealousy, loyalty tests, and rivalrous heat.";
  }

  const obligationFlavor =
    dom === "so"
      ? "face, kin name, and public duty stack first"
      : dom === "sp"
        ? "roof, belly, and turf obligations stack first"
        : "pair-bond and rivalry obligations stack first";

  return {
    lawPunishmentDelta: clamp(lawPunishmentDelta, -15, 15),
    honorShameDelta: clamp(honorShameDelta, -15, 15),
    angerCueDelta: clamp(angerCueDelta, -15, 15),
    socialRiskCueDelta: clamp(socialRiskCueDelta, -15, 15),
    hopeCueDelta: clamp(hopeCueDelta, -15, 15),
    tags,
    tabooLayer,
    obligationFlavor,
  };
}
