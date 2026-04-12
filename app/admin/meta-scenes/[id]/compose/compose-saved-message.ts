/** Maps `?saved=` query values from compose actions to user-facing status text. */
const COMPOSE_SAVED_MESSAGES: Record<string, string> = {
  core: "Scene core saved.",
  context: "Context layer saved.",
  charstate: "Character state saved.",
  settingstate: "Setting state saved.",
  link: "Fragment linked.",
  unlink: "Fragment unlinked.",
  intel: "Scene intelligence queue refreshed.",
  suggestion: "Suggestion updated.",
  soul: "Soul suggestions generated.",
  soulsug: "Soul suggestion updated.",
  preview: "Descriptive cache generated (template).",
  aienhance: "AI enhancement applied (optional layer).",
  pass: "Narrative pass saved.",
  passstatus: "Pass status updated.",
  passdel: "Pass deleted.",
};

export function composeSavedMessage(saved: string | undefined): string | null {
  if (!saved?.trim()) return null;
  return COMPOSE_SAVED_MESSAGES[saved] ?? "Saved.";
}
