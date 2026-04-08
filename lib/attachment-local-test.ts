/**
 * Local / dev checklist for Phase 10E attachment behavior (no runtime side effects).
 * Call `describeAttachmentLocalTestFlow()` from a REPL or log in dev if needed.
 */

export const ATTACHMENT_LOCAL_TEST_STEPS = [
  "Open /read and enter a public scene.",
  "Stay on the page 30s+ or switch tabs once (linger imprint).",
  "Switch mode to Feel, Guided, or Listen; confirm preference persists in localStorage.",
  "Play audio 90s+ if available (listened imprint throttles ~75s).",
  "Navigate away, then return via /read — Return card should echo headline/mood, not generic churn copy.",
  "Revisit the same scene (revisited/returned imprints when you add those client signals).",
  "Open /admin/attachment — internal aggregates should list scenes/symbols/characters with weight.",
] as const;

export function describeAttachmentLocalTestFlow(): string {
  return ATTACHMENT_LOCAL_TEST_STEPS.map((s, i) => `${i + 1}. ${s}`).join("\n");
}
