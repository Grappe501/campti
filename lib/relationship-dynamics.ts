import type { CharacterProfile, EnneagramType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deriveRelationshipDynamic } from "@/lib/enneagram-engine";

export type RelationshipDynamicsContext = {
  personAId: string;
  personBId: string;
  profileA: CharacterProfile | null;
  profileB: CharacterProfile | null;
  typeA: EnneagramType | null;
  typeB: EnneagramType | null;
  enneagramRead: string | null;
};

export async function buildRelationshipContext(personAId: string, personBId: string): Promise<RelationshipDynamicsContext | null> {
  const [a, b] = await Promise.all([
    prisma.characterProfile.findUnique({ where: { personId: personAId } }),
    prisma.characterProfile.findUnique({ where: { personId: personBId } }),
  ]);
  const typeA = a?.enneagramType ?? null;
  const typeB = b?.enneagramType ?? null;
  const enneagramRead =
    typeA && typeB ? deriveRelationshipDynamic(typeA, typeB) : "Both Enneagram types must be authored (or inferred into profile) for a dyad read.";
  return {
    personAId,
    personBId,
    profileA: a,
    profileB: b,
    typeA,
    typeB,
    enneagramRead,
  };
}

export function deriveEnneagramRelationshipDynamic(profileA: CharacterProfile | null, profileB: CharacterProfile | null): string {
  const ta = profileA?.enneagramType;
  const tb = profileB?.enneagramType;
  if (!ta || !tb) return "Incomplete — both profiles need an Enneagram type for dyad dynamics.";
  return deriveRelationshipDynamic(ta, tb);
}

export function deriveLikelyConflictLoop(profileA: CharacterProfile | null, profileB: CharacterProfile | null): string {
  const ta = profileA?.enneagramType;
  const tb = profileB?.enneagramType;
  const ca = profileA?.conflictStyle?.trim();
  const cb = profileB?.conflictStyle?.trim();
  if (ca || cb) return `Authored conflict styles: A — ${ca ?? "unset"} · B — ${cb ?? "unset"}`;
  if (ta && tb)
    return `Typical loop (heuristic): type ${ta} vs ${tb} often misreads threat vs care — escalate when stressed, go cold when ashamed.`;
  return "No typed conflict pattern — add conflictStyle on profiles or Enneagram types.";
}

export function deriveLikelyRepairPath(profileA: CharacterProfile | null, profileB: CharacterProfile | null): string {
  const ta = profileA?.enneagramType;
  const tb = profileB?.enneagramType;
  if (!ta || !tb) return "Repair path needs explicit relational notes or both Enneagram types.";
  return `Repair often needs explicit naming of fear (${ta} / ${tb}) without forcing performance; slow re-contact beats grand gestures.`;
}

export function deriveLikelyPowerNegotiation(profileA: CharacterProfile | null, profileB: CharacterProfile | null): string {
  const pa = profileA?.socialPosition?.trim();
  const pb = profileB?.socialPosition?.trim();
  const pow = profileA?.controlPattern?.trim() || profileB?.controlPattern?.trim();
  if (pa || pb) return `Social positions: ${pa ?? "—"} vs ${pb ?? "—"} — power may follow status + who controls narrative.`;
  if (pow) return `Control pattern hint: ${pow}`;
  return "Power negotiation underspecified — add social position or control pattern notes.";
}

export function deriveLikelyMarriageDynamic(profileA: CharacterProfile | null, profileB: CharacterProfile | null): string {
  const ta = profileA?.enneagramType;
  const tb = profileB?.enneagramType;
  const att = profileA?.attachmentPattern?.trim() || profileB?.attachmentPattern?.trim();
  if (att) return `Attachment notes: ${att}`;
  if (ta && tb)
    return `Marriage-shaped bond (interpretive): ${ta} + ${tb} — stability requires shared safety language and explicit repair rituals.`;
  return "Marriage dynamic requires more profile depth (attachment + types).";
}
