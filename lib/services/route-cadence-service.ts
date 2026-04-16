import { RouteCadencePlanSchema, type RouteCadencePlan } from "@/lib/domain/narrative-sequence";
import type { SettingCoverageReport } from "@/lib/domain/narrative-thread";

export class RouteCadenceService {
  buildPlan(input: {
    coverageReport: SettingCoverageReport;
    fallbackLocationIds: string[];
  }): RouteCadencePlan[] {
    const records = input.coverageReport.records.length > 0
      ? input.coverageReport.records
      : input.fallbackLocationIds.map((locationId) => ({
        locationId,
        locationName: locationId,
        routeRole: "corridor",
        appearanceMode: "route_mention" as const,
        appearanceCount: 0,
        directSceneCount: 0,
        indirectMentionCount: 0,
        associatedThreads: [],
        associatedCharacters: [],
        currentMeaning: "Unscheduled location; requires sequence insertion.",
        callbackLinks: [],
        nextRecommendedAppearanceWindow: "immediate-next-chapter",
      }));

    return records.map((record) =>
      RouteCadencePlanSchema.parse({
        locationId: record.locationId,
        requiredPresencePerBook: Math.max(1, record.appearanceCount === 0 ? 2 : record.appearanceCount),
        directPresenceWindows: [
          record.directSceneCount > 0 ? "chapter-01-to-04-direct" : "chapter-02-direct-required",
        ],
        indirectPresenceWindows: [
          record.indirectMentionCount > 0 ? "chapter-01-to-book-end-indirect" : "chapter-03-indirect-required",
        ],
        associatedThreads: record.associatedThreads,
        narrativeRole: record.routeRole,
        emotionalWeight: Number(Math.min(1, 0.35 + record.appearanceCount * 0.15).toFixed(2)),
      }),
    );
  }
}

