import type { Book1CanonStatus, Book1SceneComponentType, PrismaClient } from "@prisma/client";

type ResolverLayer = Lowercase<Book1SceneComponentType>;

export type ManualReviewResolution =
  | {
      action: "set_status";
      componentKey: string;
      targetStatus: Uppercase<Book1CanonStatus>;
      note?: string;
    }
  | {
      action: "set_preferred";
      sceneNumber: number;
      layer: ResolverLayer;
      preferredComponentKey: string;
      demoteOthersTo?: Uppercase<Book1CanonStatus>;
      note?: string;
    }
  | {
      action: "set_preferred_with_retype";
      sceneNumber: number;
      layer: ResolverLayer;
      preferredComponentKey: string;
      demoteOthersTo?: Uppercase<Book1CanonStatus>;
      note?: string;
    };

export type ManualReviewResolutionResult = {
  applied: Array<{ action: ManualReviewResolution["action"]; description: string }>;
  skipped: Array<{ action: ManualReviewResolution["action"]; reason: string }>;
  failed: Array<{ action: ManualReviewResolution["action"]; reason: string }>;
};

function toCanonStatus(raw: string): Book1CanonStatus {
  const normalized = raw.toUpperCase();
  if (normalized === "CANON") return "CANON";
  if (normalized === "CANDIDATE") return "CANDIDATE";
  if (normalized === "DEPRECATED") return "DEPRECATED";
  return "OPTIONAL";
}

function toLayer(raw: string): Book1SceneComponentType {
  const normalized = raw.toUpperCase();
  if (normalized === "PRIMARY_POV") return "PRIMARY_POV";
  if (normalized === "SECONDARY_POV") return "SECONDARY_POV";
  if (normalized === "ENVIRONMENTAL_LAYER") return "ENVIRONMENTAL_LAYER";
  if (normalized === "SETTING_LAYER") return "SETTING_LAYER";
  if (normalized === "OBSERVER_LAYER") return "OBSERVER_LAYER";
  if (normalized === "INTERPRETIVE_LAYER") return "INTERPRETIVE_LAYER";
  return "SYMBOLIC_LAYER";
}

export class Book1ManualReviewResolver {
  constructor(private readonly db: PrismaClient) {}

  async apply(resolutions: ManualReviewResolution[]): Promise<ManualReviewResolutionResult> {
    const applied: ManualReviewResolutionResult["applied"] = [];
    const skipped: ManualReviewResolutionResult["skipped"] = [];
    const failed: ManualReviewResolutionResult["failed"] = [];

    for (const resolution of resolutions) {
      try {
        if (resolution.action === "set_status") {
          const component = await this.db.book1SceneComponent.findUnique({
            where: { componentKey: resolution.componentKey },
            select: { id: true, componentKey: true, canonStatus: true },
          });
          if (!component) {
            skipped.push({ action: resolution.action, reason: `component not found: ${resolution.componentKey}` });
            continue;
          }
          await this.db.book1SceneComponent.update({
            where: { id: component.id },
            data: { canonStatus: toCanonStatus(resolution.targetStatus) },
          });
          applied.push({
            action: resolution.action,
            description: `set ${component.componentKey} status ${component.canonStatus} -> ${resolution.targetStatus}`,
          });
          continue;
        }

        const anchor = await this.db.book1SceneAnchor.findFirst({
          where: { sceneNumber: resolution.sceneNumber },
          select: { id: true, sceneNumber: true, sceneKey: true },
        });
        if (!anchor) {
          skipped.push({
            action: resolution.action,
            reason: `scene anchor not found for scene ${resolution.sceneNumber}`,
          });
          continue;
        }

        const layer = toLayer(resolution.layer);
        const preferred = await this.db.book1SceneComponent.findUnique({
          where: { componentKey: resolution.preferredComponentKey },
          select: { id: true, componentKey: true, sceneAnchorId: true, componentType: true },
        });
        if (!preferred) {
          skipped.push({
            action: resolution.action,
            reason: `preferred component not found: ${resolution.preferredComponentKey}`,
          });
          continue;
        }
        if (preferred.sceneAnchorId !== anchor.id) {
          skipped.push({
            action: resolution.action,
            reason: `preferred component does not belong to scene ${anchor.sceneNumber}`,
          });
          continue;
        }
        if (resolution.action === "set_preferred" && preferred.componentType !== layer) {
          skipped.push({
            action: resolution.action,
            reason: `preferred component does not belong to scene ${anchor.sceneNumber} ${resolution.layer}`,
          });
          continue;
        }

        const demoteStatus = toCanonStatus(resolution.demoteOthersTo ?? "CANDIDATE");
        await this.db.$transaction([
          this.db.book1SceneComponent.updateMany({
            where: {
              sceneAnchorId: anchor.id,
              componentType: layer,
              id: { not: preferred.id },
            },
            data: { canonStatus: demoteStatus },
          }),
          this.db.book1SceneComponent.update({
            where: { id: preferred.id },
            data:
              resolution.action === "set_preferred_with_retype"
                ? { canonStatus: "CANON", componentType: layer }
                : { canonStatus: "CANON" },
          }),
        ]);

        applied.push({
          action: resolution.action,
          description: `scene ${anchor.sceneNumber} ${resolution.layer} preferred ${preferred.componentKey} (others ${demoteStatus})`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        failed.push({ action: resolution.action, reason: message });
      }
    }

    return { applied, skipped, failed };
  }
}
