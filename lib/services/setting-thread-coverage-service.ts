import {
  type LocationAppearanceMode,
  type LocationPresenceRecord,
  type NarrativeThread,
  type SettingCoverageReport,
  SettingCoverageReportSchema,
} from "@/lib/domain/narrative-thread";

type PresenceSeed = {
  locationId: string;
  locationName: string;
  routeRole: string;
  appearanceMode: LocationAppearanceMode;
  associatedThreads: string[];
  associatedCharacters: string[];
  currentMeaning: string;
  callbackLinks: string[];
  nextRecommendedAppearanceWindow: string;
};

function buildRecord(seed: PresenceSeed): LocationPresenceRecord {
  const directSceneCount = seed.appearanceMode === "direct_scene" ? 1 : 0;
  const indirectMentionCount = directSceneCount === 1 ? 0 : 1;
  return {
    locationId: seed.locationId,
    locationName: seed.locationName,
    routeRole: seed.routeRole,
    appearanceMode: seed.appearanceMode,
    appearanceCount: 1,
    directSceneCount,
    indirectMentionCount,
    associatedThreads: seed.associatedThreads,
    associatedCharacters: seed.associatedCharacters,
    currentMeaning: seed.currentMeaning,
    callbackLinks: seed.callbackLinks,
    nextRecommendedAppearanceWindow: seed.nextRecommendedAppearanceWindow,
  };
}

export class SettingThreadCoverageService {
  buildCoverageReport(input: {
    bookId: string;
    requiredLocationIds: string[];
    seeds: PresenceSeed[];
    threads: NarrativeThread[];
  }): SettingCoverageReport {
    const recordsByLocation = new Map<string, LocationPresenceRecord>();
    for (const seed of input.seeds) {
      const existing = recordsByLocation.get(seed.locationId);
      if (!existing) {
        recordsByLocation.set(seed.locationId, buildRecord(seed));
        continue;
      }
      existing.appearanceCount += 1;
      if (seed.appearanceMode === "direct_scene") existing.directSceneCount += 1;
      else existing.indirectMentionCount += 1;
      existing.associatedThreads = Array.from(new Set(existing.associatedThreads.concat(seed.associatedThreads)));
      existing.associatedCharacters = Array.from(new Set(existing.associatedCharacters.concat(seed.associatedCharacters)));
      existing.callbackLinks = Array.from(new Set(existing.callbackLinks.concat(seed.callbackLinks)));
      existing.currentMeaning = seed.currentMeaning;
      existing.nextRecommendedAppearanceWindow = seed.nextRecommendedAppearanceWindow;
    }

    for (const thread of input.threads) {
      if (!["setting_thread", "route_thread", "place_attachment_thread"].includes(thread.threadType)) continue;
      for (const binding of thread.locationBindings) {
        if (!recordsByLocation.has(binding.id)) {
          recordsByLocation.set(
            binding.id,
            buildRecord({
              locationId: binding.id,
              locationName: binding.label,
              routeRole: "corridor",
              appearanceMode: "route_mention",
              associatedThreads: [thread.threadId],
              associatedCharacters: thread.activeCarriers.slice(0, 3),
              currentMeaning: `Location persists through ${thread.threadName}.`,
              callbackLinks: thread.nodes.map((node) => node.threadNodeId),
              nextRecommendedAppearanceWindow: "next chapter indirect mention",
            }),
          );
        }
      }
    }

    const records = Array.from(recordsByLocation.values());
    const presentLocationIds = new Set(records.map((record) => record.locationId));
    const missingLocationIds = input.requiredLocationIds.filter((locationId) => !presentLocationIds.has(locationId));
    const underrepresentedLocationIds = records.filter((record) => record.appearanceCount < 2).map((record) => record.locationId);
    const coverageRatio = Number(((input.requiredLocationIds.length - missingLocationIds.length) / input.requiredLocationIds.length).toFixed(3));

    const recommendations: string[] = [];
    if (missingLocationIds.length > 0) {
      recommendations.push(`Add at least indirect mentions for missing route locations: ${missingLocationIds.join(", ")}.`);
    }
    if (underrepresentedLocationIds.length > 0) {
      recommendations.push(`Increase recurrence for underrepresented locations: ${underrepresentedLocationIds.join(", ")}.`);
    }
    if (recommendations.length === 0) {
      recommendations.push("Route coverage satisfies baseline recurrence; continue balancing direct and indirect appearances.");
    }

    return SettingCoverageReportSchema.parse({
      artifact: "red_river_setting_coverage_report",
      bookId: input.bookId,
      requiredLocationIds: input.requiredLocationIds,
      records,
      missingLocationIds,
      underrepresentedLocationIds,
      coverageRatio,
      recommendations,
    });
  }
}
