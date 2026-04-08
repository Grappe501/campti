/** Session-local character follow (no accounts). Client-only. */

export const FOLLOWED_CHARACTERS_KEY = "campti-followed-characters";

export function getFollowedCharacterIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLLOWED_CHARACTERS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

export function isFollowingCharacter(personId: string): boolean {
  return getFollowedCharacterIds().includes(personId);
}

/** Returns true if now following. */
export function toggleFollowCharacter(personId: string): boolean {
  if (typeof window === "undefined") return false;
  const cur = new Set(getFollowedCharacterIds());
  if (cur.has(personId)) {
    cur.delete(personId);
  } else {
    cur.add(personId);
  }
  try {
    localStorage.setItem(FOLLOWED_CHARACTERS_KEY, JSON.stringify([...cur]));
  } catch {
    /* ignore */
  }
  return cur.has(personId);
}
