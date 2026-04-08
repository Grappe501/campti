"use client";

import { useEffect, useState } from "react";
import {
  isFollowingCharacter,
  toggleFollowCharacter,
} from "@/lib/session-follow";

type CharacterFollowButtonProps = {
  personId: string;
  shortName: string;
};

/**
 * Soft follow — session-local favorites (no accounts).
 */
export function CharacterFollowButton({ personId, shortName }: CharacterFollowButtonProps) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setFollowing(isFollowingCharacter(personId));
  }, [personId]);

  return (
    <button
      type="button"
      onClick={() => setFollowing(toggleFollowCharacter(personId))}
      className={`rounded-full border px-4 py-2 text-[0.65rem] uppercase tracking-[0.22em] transition ${
        following
          ? "border-amber-800/50 bg-amber-950/25 text-amber-100/90"
          : "border-stone-700 text-stone-400 hover:border-amber-900/40 hover:text-stone-200"
      }`}
    >
      {following ? `Staying with ${shortName}` : `Follow ${shortName}`}
    </button>
  );
}
