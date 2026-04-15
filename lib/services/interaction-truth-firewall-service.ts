/**
 * P3-S — Primary narrative integrity boundary.
 *
 * This firewall enforces separation between:
 * - canonical story truth
 * - character-bounded knowledge / belief
 * - reader interaction memory
 * - author inspection notes
 */
export type NarrativeMemoryPlane =
  | "canonical_truth"
  | "character_bounded_knowledge"
  | "reader_interaction_memory"
  | "author_inspection_notes"
  | "interaction_summary"
  | "product_account_truth";

export type MemoryBoundaryViolation = {
  code: string;
  message: string;
};

const CANONICAL_MUTATION_KEYS = ["canonical", "historicaltruth", "worldstatetruth", "world_state_truth"];
const AUTHOR_NOTE_KEYS = ["internalthoughtvisibility", "offstagetruth", "authorial"];
const PRODUCT_ACCOUNT_KEYS = [
  "plan",
  "entitlement",
  "balance",
  "billing",
  "payment",
  "stripe",
  "subscription",
  "featureflag",
  "monthlyunitallowance",
  "remainingunitbalance",
  "readerentitlement",
];

export const SESSION_METADATA_ALLOWED_KEYS = [
  "source",
  "interactiveOrchestration",
  "conversationAnchor",
  "degradedInteraction",
  "presentationPlaybackPreference",
  "sessionMemorySummary",
] as const;

function normalizedKeys(payload: Record<string, unknown>): string[] {
  const out: string[] = [];
  const visit = (value: unknown): void => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    const record = value as Record<string, unknown>;
    for (const [key, nested] of Object.entries(record)) {
      out.push(key.replace(/[^a-z0-9]+/gi, "").toLowerCase());
      visit(nested);
    }
  };
  visit(payload);
  return out;
}

export function assessMemoryBoundaryContamination(input: {
  source: NarrativeMemoryPlane;
  target: NarrativeMemoryPlane;
  payload?: Record<string, unknown> | null;
}): MemoryBoundaryViolation[] {
  const out: MemoryBoundaryViolation[] = [];
  const payload = input.payload ?? {};
  const keys = normalizedKeys(payload);

  // Primary narrative integrity boundary: reader interaction memory must never mutate canon.
  if (input.source === "reader_interaction_memory" && input.target === "canonical_truth") {
    out.push({
      code: "interaction_memory_to_canon_blocked",
      message: "Reader interaction memory cannot mutate canonical truth.",
    });
  }

  if (input.source === "author_inspection_notes" && input.target === "reader_interaction_memory") {
    out.push({
      code: "author_notes_to_reader_memory_blocked",
      message: "Author inspection notes cannot be written into reader interaction memory.",
    });
  }

  if (input.source === "interaction_summary" && input.target === "canonical_truth") {
    out.push({
      code: "interaction_summary_to_canon_blocked",
      message: "Interaction summaries are continuity aids and cannot become canonical truth.",
    });
  }
  if (input.source === "product_account_truth" && input.target === "canonical_truth") {
    out.push({
      code: "product_truth_to_canon_blocked",
      message: "Product/account truth cannot mutate canonical story truth.",
    });
  }
  if (input.source === "product_account_truth" && input.target === "character_bounded_knowledge") {
    out.push({
      code: "product_truth_to_character_knowledge_blocked",
      message: "Product/account truth cannot be written into character-bounded knowledge.",
    });
  }

  if (input.target === "canonical_truth" && keys.some((k) => CANONICAL_MUTATION_KEYS.some((m) => k.includes(m)))) {
    out.push({
      code: "conversation_artifact_injected_into_canon",
      message: "Conversation artifacts cannot be injected into canonical world-state truth sources.",
    });
  }

  if (
    input.target === "reader_interaction_memory" &&
    keys.some((k) => AUTHOR_NOTE_KEYS.some((m) => k.includes(m)))
  ) {
    out.push({
      code: "author_only_field_in_reader_memory",
      message: "Author-only fields are disallowed in reader interaction memory.",
    });
  }
  if (
    input.target === "reader_interaction_memory" &&
    keys.some((k) => CANONICAL_MUTATION_KEYS.some((m) => k.includes(m)))
  ) {
    out.push({
      code: "canonical_field_in_reader_memory",
      message: "Canonical-truth fields are disallowed in reader interaction memory writes.",
    });
  }
  if (
    input.target === "reader_interaction_memory" &&
    keys.some((k) => PRODUCT_ACCOUNT_KEYS.some((m) => k.includes(m)))
  ) {
    out.push({
      code: "product_account_field_in_reader_memory",
      message: "Product/account fields are disallowed in reader interaction memory writes.",
    });
  }
  if (input.target === "canonical_truth" && keys.some((k) => PRODUCT_ACCOUNT_KEYS.some((m) => k.includes(m)))) {
    out.push({
      code: "product_account_field_in_canonical_truth",
      message: "Product/account fields are disallowed in canonical truth writes.",
    });
  }

  return out;
}

export function assertMemoryBoundary(input: {
  source: NarrativeMemoryPlane;
  target: NarrativeMemoryPlane;
  payload?: Record<string, unknown> | null;
}): void {
  const violations = assessMemoryBoundaryContamination(input);
  if (violations.length > 0) {
    const msg = violations.map((v) => `[${v.code}] ${v.message}`).join("; ");
    throw new Error(`[interaction-truth-firewall] ${msg}`);
  }
}

export function assertSessionMetadataPatchWriteBoundary(input: {
  source: NarrativeMemoryPlane;
  patch: Record<string, unknown> | null | undefined;
  allowedTopLevelKeys?: readonly string[];
}): void {
  const patch = input.patch ?? {};
  assertMemoryBoundary({
    source: input.source,
    target: "reader_interaction_memory",
    payload: patch,
  });
  const allowed = new Set(input.allowedTopLevelKeys ?? SESSION_METADATA_ALLOWED_KEYS);
  const disallowed = Object.keys(patch).filter((k) => !allowed.has(k));
  if (disallowed.length > 0) {
    throw new Error(
      `[interaction-truth-firewall] [session_metadata_key_disallowed] Disallowed session metadata key(s): ${disallowed.join(", ")}`
    );
  }
}
