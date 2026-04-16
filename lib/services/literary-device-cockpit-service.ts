import {
  LiteraryDeviceCockpitSummarySchema,
  type LiteraryDeviceApplicationPlan,
  type LiteraryDeviceCockpitSummary,
  type LiteraryDeviceControlSetting,
  type LiteraryDeviceValidationResult,
  type LiterarySymbolDefinition,
} from "@/lib/domain/literary-device-control";

export function mapNumericAlliterationDensity(value: number): "rare" | "occasional" | "patterned" | "motif_driven" {
  if (value < 26) return "rare";
  if (value < 51) return "occasional";
  if (value < 76) return "patterned";
  return "motif_driven";
}

export class LiteraryDeviceCockpitService {
  buildSummary(input: {
    chapterId: string;
    plan: LiteraryDeviceApplicationPlan;
    controls: LiteraryDeviceControlSetting[];
    symbols: LiterarySymbolDefinition[];
    validation: LiteraryDeviceValidationResult;
    sceneIds: string[];
  }): LiteraryDeviceCockpitSummary {
    const controlsByDevice = new Map(input.controls.map((control) => [control.deviceId, control]));
    const alliteration = controlsByDevice.get("alliteration");
    const alliterationNumeric = alliteration?.alliterationPolicy?.numericDensityInput ?? 30;
    const sceneDistributionSummary = input.sceneIds.map((sceneId) => {
      const scopedCount = input.controls.filter(
        (control) =>
          (control.targetScope === "scene" && control.sceneBindings.includes(sceneId)) ||
          control.targetScope === "chapter" ||
          control.targetScope === "thread",
      ).length;
      return {
        sceneId,
        activeDeviceCount: scopedCount,
        overloadRisk: scopedCount >= 8 ? "high" : scopedCount >= 5 ? "moderate" : "low",
      } as const;
    });

    return LiteraryDeviceCockpitSummarySchema.parse({
      artifact: "literary_device_cockpit_summary",
      chapterId: input.chapterId,
      activeDevices: input.plan.activeDeviceIds.map((deviceId) => {
        const control = controlsByDevice.get(deviceId);
        return {
          deviceId,
          activationMode: control?.activationMode ?? "moderate",
          densityBand: control?.densityBand ?? "occasional",
          scope: control?.targetScope ?? "chapter",
          contexts: control?.allowedContextsOverride ?? ["environment", "action", "memory"],
          misuseRisk:
            input.validation.hardFailures.some((issue) => issue.category.includes(deviceId) || issue.category.includes("alliteration"))
              ? "high"
              : input.validation.softWarnings.some((issue) => issue.category.includes("overload"))
                ? "moderate"
                : "low",
          chapterApplicationStatus: input.plan.suppressedDeviceSet.includes(deviceId)
            ? "suppressed"
            : control?.activationMode === "required"
              ? "required"
              : "active",
        };
      }),
      symbolRegistry: input.symbols,
      motifRegistry: input.controls
        .filter((control) => control.motifBindings.length > 0)
        .map((control) => ({
          motifId: control.motifBindings[0] ?? `${control.deviceId}-motif`,
          motifName: control.motifBindings[0] ?? `${control.deviceId} motif`,
          boundThreadIds: control.threadBindings,
          recurrenceTarget: control.densityBand,
        })),
      alliterationControl: {
        activationMode: alliteration?.activationMode ?? "off",
        densityBand: alliteration?.densityBand ?? "rare",
        numericInput: alliterationNumeric,
        mappedDensityBand: mapNumericAlliterationDensity(alliterationNumeric),
        allowedLineZones: alliteration?.alliterationPolicy?.allowedLineZones ?? [],
        forbiddenLineZones: alliteration?.alliterationPolicy?.forbiddenLineZones ?? [],
        consonantClusteringTolerance: alliteration?.alliterationPolicy?.consonantClusteringTolerance ?? 0,
      },
      densityWarnings: input.plan.densityWarnings,
      misuseWarnings: input.plan.misuseWarnings,
      chapterProfileSummary:
        input.plan.activeDeviceIds.length === 0
          ? "No active literary devices."
          : `Active literary profile: ${input.plan.activeDeviceIds.length} devices with thread-bound symbolic carriers.`,
      sceneDistributionSummary,
      driftWarnings: input.validation.driftDiagnostics,
    });
  }
}
