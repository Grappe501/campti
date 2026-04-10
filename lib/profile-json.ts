/**
 * CharacterProfile JSON fields (coreBeliefs, fears, etc.) — display and synthesis helpers.
 */

export function profileJsonFieldToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Short slice for interpretive prose (not canonical storage). */
export function profileJsonFieldToSlice(value: unknown, max = 400): string {
  const s = profileJsonFieldToString(value).trim();
  if (!s.length) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** Flatten JSON or string for keyword / inference passes. */
export function profileJsonFieldToInferenceText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

/** Admin textarea default for JSON-backed profile fields. */
export function profileJsonFieldToFormText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
