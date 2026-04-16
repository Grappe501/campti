import {
  RouteRecurrenceLedgerSchema,
  RouteRecurrenceLedgerRowSchema,
  type LocationPresenceMode,
  type RouteRecurrenceLedger,
  type RouteRecurrenceLedgerRow,
} from "@/lib/domain/chapter-composition";

type PresenceEvent = {
  locationId: string;
  locationName: string;
  chapterId: string;
  mode: LocationPresenceMode;
  associatedThreads: string[];
};

export class RouteRecurrenceLedgerService {
  buildLedger(input: {
    currentBookId: string;
    requiredLocations: Array<{ locationId: string; locationName: string }>;
    events: PresenceEvent[];
  }): RouteRecurrenceLedger {
    const rows: RouteRecurrenceLedgerRow[] = input.requiredLocations.map((location) => {
      const events = input.events.filter((event) => event.locationId === location.locationId);
      const directPresenceCount = events.filter((event) => event.mode === "direct_scene_setting").length;
      const indirectPresenceCount = events.length - directPresenceCount;
      const lastAppearanceChapter = events.length > 0 ? events[events.length - 1].chapterId : null;
      const appearanceModesUsed = Array.from(new Set(events.map((event) => event.mode)));
      const associatedThreads = Array.from(new Set(events.flatMap((event) => event.associatedThreads)));
      const recurrenceSatisfied = events.length > 0;
      return RouteRecurrenceLedgerRowSchema.parse({
        locationId: location.locationId,
        locationName: location.locationName,
        currentBookId: input.currentBookId,
        directPresenceCount,
        indirectPresenceCount,
        lastAppearanceChapter,
        appearanceModesUsed,
        associatedThreads,
        recurrenceSatisfied,
        nextRecommendedAppearanceWindow: recurrenceSatisfied ? "next-two-chapters" : "immediate-next-chapter",
      });
    });

    const enforcementWarnings = rows
      .filter((row) => !row.recurrenceSatisfied)
      .map((row) => `Location ${row.locationName} lacks meaningful presence for ${input.currentBookId}.`);

    return RouteRecurrenceLedgerSchema.parse({
      artifact: "book_route_recurrence_ledger",
      currentBookId: input.currentBookId,
      rows,
      enforcementWarnings,
    });
  }
}
