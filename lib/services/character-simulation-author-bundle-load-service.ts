import { Prisma } from "@prisma/client";

import { CharacterMindProfileSchema, type CharacterMindProfile } from "@/lib/domain/character-mind";
import { CharacterVoiceProfileSchema, type CharacterVoiceProfile } from "@/lib/domain/character-voice";
import { prisma } from "@/lib/prisma";

export type PersistedCharacterSimulationProfilesMap = Record<
  string,
  { mindPartial?: Partial<CharacterMindProfile>; voicePartial?: Partial<CharacterVoiceProfile> }
>;

function entryHasPayload(entry: PersistedCharacterSimulationProfilesMap[string] | undefined): boolean {
  if (!entry) return false;
  const mk = entry.mindPartial ? Object.keys(entry.mindPartial).length : 0;
  const vk = entry.voicePartial ? Object.keys(entry.voicePartial).length : 0;
  return mk > 0 || vk > 0;
}

/**
 * How Cluster-8 mind/voice inputs were sourced for participating people on this run.
 */
export function summarizeCharacterSimulationProfileTruth(
  participatingPersonIds: string[],
  map: PersistedCharacterSimulationProfilesMap
): "persisted_author" | "deterministic_seed_only" | "mixed" {
  if (participatingPersonIds.length === 0) return "deterministic_seed_only";
  const flags = participatingPersonIds.map((id) => entryHasPayload(map[id]));
  const any = flags.some(Boolean);
  const all = flags.every(Boolean);
  if (!any) return "deterministic_seed_only";
  if (all) return "persisted_author";
  return "mixed";
}

/**
 * Load author-owned simulation JSON for the given people (empty map when none).
 */
export async function loadPersistedCharacterSimulationProfilesForPersonIds(
  personIds: string[],
): Promise<PersistedCharacterSimulationProfilesMap> {
  const unique = [...new Set(personIds)].filter(Boolean);
  if (unique.length === 0) return {};

  let rows: Awaited<ReturnType<typeof prisma.characterSimulationAuthorBundle.findMany>>;
  try {
    rows = await prisma.characterSimulationAuthorBundle.findMany({
      where: { personId: { in: unique } },
    });
  } catch (e) {
    /** Migration not applied on this database — deterministic seeds remain primary until `migrate deploy`. */
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
      return {};
    }
    throw e;
  }

  const out: PersistedCharacterSimulationProfilesMap = {};
  for (const row of rows) {
    const mindParsed = CharacterMindProfileSchema.partial().safeParse(row.simulationMindProfileJson);
    const voiceParsed = CharacterVoiceProfileSchema.partial().safeParse(row.simulationVoiceProfileJson);
    const mindPartial = mindParsed.success ? mindParsed.data : undefined;
    const voicePartial = voiceParsed.success ? voiceParsed.data : undefined;
    if (mindPartial || voicePartial) {
      out[row.personId] = { mindPartial, voicePartial };
    }
  }
  return out;
}
