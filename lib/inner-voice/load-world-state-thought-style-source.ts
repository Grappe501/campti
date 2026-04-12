import { prisma } from "@/lib/prisma";

import type { WorldStateThoughtStyleSource } from "@/lib/inner-voice/framing/world-state-thought-style";

/** Loads rows needed for `buildWorldStateThoughtStyle` (no transformation). */
export async function loadWorldStateThoughtStyleSource(
  worldStateId: string | null
): Promise<WorldStateThoughtStyleSource> {
  if (!worldStateId) {
    return { reference: null, eraProfile: null, governance: null };
  }

  const ws = await prisma.worldStateReference.findUnique({
    where: { id: worldStateId },
    include: {
      worldEraProfile: true,
      governanceProfile: true,
    },
  });

  if (!ws) {
    return { reference: null, eraProfile: null, governance: null };
  }

  return {
    reference: {
      id: ws.id,
      eraId: ws.eraId,
      label: ws.label,
      description: ws.description,
    },
    eraProfile: ws.worldEraProfile
      ? {
          coreEconomicDrivers: ws.worldEraProfile.coreEconomicDrivers,
          powerSummary: ws.worldEraProfile.powerSummary,
          knobEconomicPressure: ws.worldEraProfile.knobEconomicPressure,
          knobRelationalInterdependence: ws.worldEraProfile.knobRelationalInterdependence,
          knobAutonomyBaseline: ws.worldEraProfile.knobAutonomyBaseline,
          knobSystemicExtraction: ws.worldEraProfile.knobSystemicExtraction,
          knobCollectiveCohesion: ws.worldEraProfile.knobCollectiveCohesion,
        }
      : null,
    governance: ws.governanceProfile
      ? {
          controlIntensity: ws.governanceProfile.controlIntensity,
          punishmentSeverity: ws.governanceProfile.punishmentSeverity,
          enforcementVisibility: ws.governanceProfile.enforcementVisibility,
          conformityPressure: ws.governanceProfile.conformityPressure,
        }
      : null,
  };
}
