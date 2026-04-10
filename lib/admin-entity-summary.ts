import { prisma } from "@/lib/prisma";
import { getRegistryById } from "@/lib/campti-registry";

/**
 * Compact, non-prose summary for the specialist agent system prompt (authoritative fields only).
 */
export async function getAdminEntitySummaryForAgent(type: string, id: string): Promise<string | null> {
  try {
    switch (type) {
      case "master_registry": {
        const reg = getRegistryById(id);
        if (!reg) return null;
        return [
          `Master registry: ${reg.title}`,
          `Phase ${reg.buildPhase} · ${reg.layer} · status: ${reg.implementationStatus}`,
          reg.tagline,
          reg.description.length > 500 ? `${reg.description.slice(0, 500)}…` : reg.description,
        ].join("\n");
      }
      case "meta_scene": {
        const m = await prisma.metaScene.findUnique({
          where: { id },
          select: {
            title: true,
            timePeriod: true,
            narrativePurpose: true,
            sourceSupportLevel: true,
            place: { select: { name: true, recordType: true } },
            povPerson: { select: { name: true, recordType: true } },
          },
        });
        if (!m) return null;
        return [
          `Meta scene: ${m.title}`,
          m.timePeriod ? `Time: ${m.timePeriod}` : null,
          m.place ? `Place: ${m.place.name} (${m.place.recordType})` : null,
          m.povPerson ? `POV: ${m.povPerson.name} (${m.povPerson.recordType})` : null,
          m.sourceSupportLevel ? `Source support: ${m.sourceSupportLevel}` : null,
          m.narrativePurpose ? `Purpose: ${m.narrativePurpose.slice(0, 400)}${m.narrativePurpose.length > 400 ? "…" : ""}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
      case "fragment": {
        const f = await prisma.fragment.findUnique({
          where: { id },
          select: {
            title: true,
            fragmentType: true,
            recordType: true,
            summary: true,
            reviewStatus: true,
            placementStatus: true,
          },
        });
        if (!f) return null;
        return [
          `Fragment: ${f.title?.trim() || f.fragmentType}`,
          `Type: ${f.fragmentType}`,
          f.recordType ? `Record: ${f.recordType}` : null,
          f.placementStatus ? `Placement: ${f.placementStatus}` : null,
          f.reviewStatus ? `Review: ${f.reviewStatus}` : null,
          f.summary ? `Summary: ${f.summary.slice(0, 320)}${f.summary.length > 320 ? "…" : ""}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
      case "person": {
        const p = await prisma.person.findUnique({
          where: { id },
          select: {
            name: true,
            recordType: true,
            description: true,
            characterProfile: { select: { emotionalBaseline: true, socialPosition: true } },
          },
        });
        if (!p) return null;
        return [
          `Person: ${p.name} (${p.recordType})`,
          p.description ? `Note: ${p.description.slice(0, 280)}${p.description.length > 280 ? "…" : ""}` : null,
          p.characterProfile?.socialPosition ? `Social: ${p.characterProfile.socialPosition.slice(0, 200)}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
      case "place": {
        const pl = await prisma.place.findUnique({
          where: { id },
          select: {
            name: true,
            recordType: true,
            description: true,
            settingProfile: { select: { environmentType: true, dominantActivities: true } },
          },
        });
        if (!pl) return null;
        return [
          `Place: ${pl.name} (${pl.recordType})`,
          pl.description ? `Note: ${pl.description.slice(0, 240)}` : null,
          pl.settingProfile?.environmentType ? `Environment: ${pl.settingProfile.environmentType}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
      case "scene": {
        const s = await prisma.scene.findUnique({
          where: { id },
          select: {
            description: true,
            recordType: true,
            sceneStatus: true,
            writingMode: true,
            chapter: { select: { title: true } },
          },
        });
        if (!s) return null;
        return [
          `Scene in chapter: ${s.chapter.title}`,
          `Record: ${s.recordType}`,
          `Mode: ${s.writingMode}`,
          s.sceneStatus ? `Status: ${s.sceneStatus}` : null,
          `Description: ${s.description.slice(0, 300)}${s.description.length > 300 ? "…" : ""}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
      case "source": {
        const src = await prisma.source.findUnique({
          where: { id },
          select: {
            title: true,
            recordType: true,
            visibility: true,
            sourceType: true,
            archiveStatus: true,
            summary: true,
          },
        });
        if (!src) return null;
        return [
          `Source: ${src.title}`,
          `Record: ${src.recordType} · visibility: ${src.visibility}`,
          `Type: ${src.sourceType}`,
          src.summary ? `Summary: ${src.summary.slice(0, 280)}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
