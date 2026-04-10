import type { PrismaClient } from "@prisma/client";
import {
  EnvironmentRiskCategory,
  NodeConnectionType,
  PlaceMemoryType,
  PlaceType,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";

/**
 * Red River / Campti environment & node layer — additive upserts only.
 * Safe to re-run; does not overwrite unrelated seed data.
 */
export async function seedEnvironment(prisma: PrismaClient): Promise<void> {
  const ws = [
    {
      id: "seed-ws-ref-ws01",
      eraId: "WS-01-SACRED-TRADE-ARTERY",
      label: "Sacred / trade artery (early colonial)",
      description: "River as sacred artery and corridor before industrial control.",
    },
    {
      id: "seed-ws-ref-ws04",
      eraId: "WS-04-EXPANSION-COTTON",
      label: "Expansion / cotton economy",
      description: "Supply nodes and land pressure intensify along the corridor.",
    },
    {
      id: "seed-ws-ref-ws06",
      eraId: "WS-06-JIM-CROW-RURAL",
      label: "Jim Crow rural town",
      description: "Stable small-town grid with rigid social control.",
    },
    {
      id: "seed-ws-ref-ws08",
      eraId: "WS-08-MODERN-DECLINE-MEMORY",
      label: "Modern decline / memory load",
      description: "Shrinking population; layered oral and documentary memory.",
    },
    {
      id: "seed-ws-ref-ws07",
      eraId: "WS-07-ENGINEERED-WATERWAY",
      label: "Engineered waterway",
      description: "Cutoffs, navigation works, flood control — river as infrastructure.",
    },
  ];

  for (const w of ws) {
    await prisma.worldStateReference.upsert({
      where: { eraId: w.eraId },
      update: { label: w.label, description: w.description },
      create: {
        id: w.id,
        eraId: w.eraId,
        label: w.label,
        description: w.description,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  const extraPlaces: { id: string; name: string; placeType: PlaceType }[] = [
    { id: "seed-place-red-river", name: "Red River", placeType: PlaceType.RIVER },
    { id: "seed-place-grand-ecore", name: "Grand Ecore", placeType: PlaceType.REGION },
    { id: "seed-place-los-adaes", name: "Los Adaes", placeType: PlaceType.REGION },
  ];

  for (const pl of extraPlaces) {
    await prisma.place.upsert({
      where: { id: pl.id },
      update: {},
      create: {
        id: pl.id,
        name: pl.name,
        placeType: pl.placeType,
        visibility: VisibilityStatus.PUBLIC,
        recordType: RecordType.HISTORICAL,
      },
    });
  }

  const placeIds = {
    campti: "seed-place-campti",
    natchitoches: "seed-place-natchitoches",
    redRiver: "seed-place-red-river",
    grandEcore: "seed-place-grand-ecore",
    losAdaes: "seed-place-los-adaes",
  };

  const envProfiles: {
    placeId: string;
    terrainType: string;
    hydrologyType: string;
    floodRiskLevel: number;
    droughtRiskLevel: number;
    mobilityProfile: string;
    notes: string;
  }[] = [
    {
      placeId: placeIds.campti,
      terrainType: "river_bluff_corridor",
      hydrologyType: "red_river_floodplain",
      floodRiskLevel: 55,
      droughtRiskLevel: 25,
      mobilityProfile: "landing_and_farm_roads",
      notes: "Corridor town tied to river landings and backswamp edges.",
    },
    {
      placeId: placeIds.natchitoches,
      terrainType: "ridge_and_river_trade_hub",
      hydrologyType: "red_river_and_tributary_fan",
      floodRiskLevel: 40,
      droughtRiskLevel: 20,
      mobilityProfile: "hub_roads_trails",
      notes: "Colonial and later trade hub; multiple approach corridors.",
    },
    {
      placeId: placeIds.redRiver,
      terrainType: "alluvial_channel",
      hydrologyType: "meandering_southwest_flow",
      floodRiskLevel: 70,
      droughtRiskLevel: 35,
      mobilityProfile: "raft_steamboat_barge_epochs",
      notes: "Channel migration, cutoffs, and engineered control shape human possibility.",
    },
    {
      placeId: placeIds.grandEcore,
      terrainType: "bluff_overlook",
      hydrologyType: "high_bank_above_channel",
      floodRiskLevel: 30,
      droughtRiskLevel: 30,
      mobilityProfile: "military_and_trade_overlook",
      notes: "Strategic height over the floodplain.",
    },
    {
      placeId: placeIds.losAdaes,
      terrainType: "frontier_mission_presidio",
      hydrologyType: "spring_ridge_network",
      floodRiskLevel: 35,
      droughtRiskLevel: 25,
      mobilityProfile: "trails_to_natchitoches",
      notes: "Spanish colonial node; trail linkage east toward Natchitoches.",
    },
  ];

  for (const ep of envProfiles) {
    await prisma.placeEnvironmentProfile.upsert({
      where: { placeId: ep.placeId },
      update: {
        terrainType: ep.terrainType,
        hydrologyType: ep.hydrologyType,
        floodRiskLevel: ep.floodRiskLevel,
        droughtRiskLevel: ep.droughtRiskLevel,
        mobilityProfile: ep.mobilityProfile,
        notes: ep.notes,
      },
      create: {
        placeId: ep.placeId,
        terrainType: ep.terrainType,
        hydrologyType: ep.hydrologyType,
        floodRiskLevel: ep.floodRiskLevel,
        droughtRiskLevel: ep.droughtRiskLevel,
        mobilityProfile: ep.mobilityProfile,
        notes: ep.notes,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  const nodes: {
    id: string;
    placeId: string;
    key: string;
    label: string;
    nodeType: string;
    isCoreNode: boolean;
    regionLabel: string;
    summary: string;
  }[] = [
    {
      id: "seed-env-node-campti",
      placeId: placeIds.campti,
      key: "campti_node",
      label: "Campti landing / town node",
      nodeType: "SETTLEMENT_NODE",
      isCoreNode: true,
      regionLabel: "Natchitoches Parish corridor",
      summary: "River-adjacent town node; supply and memory load in later eras.",
    },
    {
      id: "seed-env-node-natchitoches",
      placeId: placeIds.natchitoches,
      key: "natchitoches_node",
      label: "Natchitoches trade hub",
      nodeType: "TRADE_HUB",
      isCoreNode: true,
      regionLabel: "Cane River / Red River junction zone",
      summary: "Primary trade and administrative hub for the region.",
    },
    {
      id: "seed-env-node-red-river-channel",
      placeId: placeIds.redRiver,
      key: "red_river_main_channel",
      label: "Red River main channel segment",
      nodeType: "RIVER_SEGMENT",
      isCoreNode: true,
      regionLabel: "Red River corridor",
      summary: "Sacred artery, trade highway, then engineered waterway — era-dependent behavior.",
    },
    {
      id: "seed-env-node-grand-ecore-bluff",
      placeId: placeIds.grandEcore,
      key: "grand_ecore_bluff_node",
      label: "Grand Ecore bluff",
      nodeType: "BLUFF_OVERLOOK",
      isCoreNode: false,
      regionLabel: "Natchitoches vicinity",
      summary: "Elevated position; military and trade sightlines.",
    },
    {
      id: "seed-env-node-los-adaes",
      placeId: placeIds.losAdaes,
      key: "los_adaes_node",
      label: "Los Adaes mission / presidio",
      nodeType: "COLONIAL_OUTPOST",
      isCoreNode: false,
      regionLabel: "Spanish Texas / Louisiana borderlands",
      summary: "Colonial node linked by trail to Natchitoches.",
    },
  ];

  for (const n of nodes) {
    await prisma.environmentNode.upsert({
      where: { key: n.key },
      update: {
        label: n.label,
        nodeType: n.nodeType,
        isCoreNode: n.isCoreNode,
        regionLabel: n.regionLabel,
        summary: n.summary,
      },
      create: {
        id: n.id,
        placeId: n.placeId,
        key: n.key,
        label: n.label,
        nodeType: n.nodeType,
        isCoreNode: n.isCoreNode,
        regionLabel: n.regionLabel,
        summary: n.summary,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  const nodeKey = (k: string) =>
    prisma.environmentNode.findUnique({ where: { key: k }, select: { id: true } }).then((r) => r?.id ?? null);

  const idRiver = await nodeKey("red_river_main_channel");
  const idNatch = await nodeKey("natchitoches_node");
  const idCampti = await nodeKey("campti_node");
  const idLos = await nodeKey("los_adaes_node");
  const idBluff = await nodeKey("grand_ecore_bluff_node");

  const connections: {
    id: string;
    fromId: string | null;
    toId: string | null;
    connectionType: NodeConnectionType;
    travelRisk: number;
    travelDifficulty: number;
    notes: string;
  }[] = [
    {
      id: "seed-nc-river-natch",
      fromId: idRiver,
      toId: idNatch,
      connectionType: NodeConnectionType.RIVER,
      travelRisk: 35,
      travelDifficulty: 40,
      notes: "River reach linking channel to Natchitoches hub.",
    },
    {
      id: "seed-nc-river-campti",
      fromId: idRiver,
      toId: idCampti,
      connectionType: NodeConnectionType.RIVER,
      travelRisk: 40,
      travelDifficulty: 45,
      notes: "Channel segment toward Campti landing zone.",
    },
    {
      id: "seed-nc-natch-los",
      fromId: idNatch,
      toId: idLos,
      connectionType: NodeConnectionType.TRADE_PATH,
      travelRisk: 30,
      travelDifficulty: 50,
      notes: "Trail / trade path between colonial nodes.",
    },
    {
      id: "seed-nc-bluff-natch",
      fromId: idBluff,
      toId: idNatch,
      connectionType: NodeConnectionType.TRAIL,
      travelRisk: 25,
      travelDifficulty: 35,
      notes: "Bluff line into hub approaches.",
    },
  ];

  for (const c of connections) {
    if (!c.fromId || !c.toId) continue;
    await prisma.nodeConnection.upsert({
      where: { id: c.id },
      update: {
        connectionType: c.connectionType,
        travelRisk: c.travelRisk,
        travelDifficulty: c.travelDifficulty,
        notes: c.notes,
      },
      create: {
        id: c.id,
        fromNodeId: c.fromId,
        toNodeId: c.toId,
        connectionType: c.connectionType,
        bidirectional: true,
        travelRisk: c.travelRisk,
        travelDifficulty: c.travelDifficulty,
        notes: c.notes,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  const risks: {
    id: string;
    key: string;
    label: string;
    category: EnvironmentRiskCategory;
    baseSeverity: number;
    description: string;
  }[] = [
    {
      id: "seed-risk-flood",
      key: "annual_flood_risk",
      label: "Annual flood pulse",
      category: EnvironmentRiskCategory.FLOOD,
      baseSeverity: 55,
      description: "Seasonal high water and backswamp inundation along the corridor.",
    },
    {
      id: "seed-risk-channel",
      key: "channel_shift_risk",
      label: "Channel migration / cutoff",
      category: EnvironmentRiskCategory.TRANSPORT,
      baseSeverity: 45,
      description: "Meander cutoffs and channel jumps disrupt landings and crossings.",
    },
    {
      id: "seed-risk-trade",
      key: "trade_route_disruption",
      label: "Trade route disruption",
      category: EnvironmentRiskCategory.SCARCITY,
      baseSeverity: 40,
      description: "Corridor closure or seasonal impassability.",
    },
    {
      id: "seed-risk-military",
      key: "military_corridor_exposure",
      label: "Military corridor exposure",
      category: EnvironmentRiskCategory.CONFLICT,
      baseSeverity: 50,
      description: "Strategic movement and occupation along ridges and crossings.",
    },
    {
      id: "seed-risk-isolation",
      key: "isolation_in_backswamp",
      label: "Isolation in backswamp",
      category: EnvironmentRiskCategory.ISOLATION,
      baseSeverity: 45,
      description: "Poor roads and flood timing strand communities.",
    },
  ];

  for (const r of risks) {
    await prisma.riskRegime.upsert({
      where: { key: r.key },
      update: {
        label: r.label,
        category: r.category,
        baseSeverity: r.baseSeverity,
        description: r.description,
      },
      create: {
        id: r.id,
        key: r.key,
        label: r.label,
        category: r.category,
        baseSeverity: r.baseSeverity,
        description: r.description,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  const wsId = async (eraId: string) => {
    const row = await prisma.worldStateReference.findUnique({
      where: { eraId },
      select: { id: true },
    });
    return row?.id ?? null;
  };

  const idWs01 = await wsId("WS-01-SACRED-TRADE-ARTERY");
  const idWs04 = await wsId("WS-04-EXPANSION-COTTON");
  const idWs06 = await wsId("WS-06-JIM-CROW-RURAL");
  const idWs08 = await wsId("WS-08-MODERN-DECLINE-MEMORY");
  const idWs07 = await wsId("WS-07-ENGINEERED-WATERWAY");

  const placeStates: {
    id: string;
    placeId: string;
    worldStateId: string | null;
    label: string;
    settlementPattern: string;
    strategicValue: number;
    riskLevel: number;
    notes: string;
  }[] = [
    {
      id: "seed-ps-campti-ws01",
      placeId: placeIds.campti,
      worldStateId: idWs01,
      label: "Campti — proto landing / corridor",
      settlementPattern: "sparse_river_landings",
      strategicValue: 35,
      riskLevel: 45,
      notes: "Early corridor function; thin settlement on bluff and landing.",
    },
    {
      id: "seed-ps-campti-ws04",
      placeId: placeIds.campti,
      worldStateId: idWs04,
      label: "Campti — supply node",
      settlementPattern: "farm_supply_and_ferry",
      strategicValue: 55,
      riskLevel: 40,
      notes: "Expansion-era cotton economy; river supply and local extraction.",
    },
    {
      id: "seed-ps-campti-ws06",
      placeId: placeIds.campti,
      worldStateId: idWs06,
      label: "Campti — stable rural town",
      settlementPattern: "jim_crow_small_town",
      strategicValue: 45,
      riskLevel: 35,
      notes: "Grid town; rigid social order; church and store as anchors.",
    },
    {
      id: "seed-ps-campti-ws08",
      placeId: placeIds.campti,
      worldStateId: idWs08,
      label: "Campti — declining memory town",
      settlementPattern: "shrinking_rural",
      strategicValue: 30,
      riskLevel: 30,
      notes: "Population loss; layered family memory and oral history load.",
    },
    {
      id: "seed-ps-river-ws01",
      placeId: placeIds.redRiver,
      worldStateId: idWs01,
      label: "Red River — sacred / trade artery",
      settlementPattern: "corridor_not_town",
      strategicValue: 80,
      riskLevel: 55,
      notes: "River as sacred continuity and trade spine before full engineering.",
    },
    {
      id: "seed-ps-river-ws07",
      placeId: placeIds.redRiver,
      worldStateId: idWs07,
      label: "Red River — engineered waterway",
      settlementPattern: "navigation_infrastructure",
      strategicValue: 75,
      riskLevel: 45,
      notes: "Locks, cutoffs managed; flood policy and barge economics.",
    },
  ];

  for (const ps of placeStates) {
    if (!ps.worldStateId) continue;
    await prisma.placeState.upsert({
      where: { id: ps.id },
      update: {
        label: ps.label,
        settlementPattern: ps.settlementPattern,
        strategicValue: ps.strategicValue,
        riskLevel: ps.riskLevel,
        notes: ps.notes,
        worldStateId: ps.worldStateId,
      },
      create: {
        id: ps.id,
        placeId: ps.placeId,
        worldStateId: ps.worldStateId,
        label: ps.label,
        settlementPattern: ps.settlementPattern,
        strategicValue: ps.strategicValue,
        riskLevel: ps.riskLevel,
        notes: ps.notes,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  const memories: {
    id: string;
    placeId: string;
    worldStateId: string | null;
    memoryType: PlaceMemoryType;
    label: string;
    description: string;
  }[] = [
    {
      id: "seed-mem-river-continuity",
      placeId: placeIds.redRiver,
      worldStateId: idWs01,
      memoryType: PlaceMemoryType.CONTINUITY,
      label: "River as continuity",
      description: "Oral and ritual memory of the river as enduring presence despite political change.",
    },
    {
      id: "seed-mem-grand-ecore-war",
      placeId: placeIds.grandEcore,
      worldStateId: null,
      memoryType: PlaceMemoryType.WAR,
      label: "Bluff as military sightline",
      description: "Strategic memory of campaigns, movement, and surveillance over the floodplain.",
    },
    {
      id: "seed-mem-campti-community",
      placeId: placeIds.campti,
      worldStateId: idWs08,
      memoryType: PlaceMemoryType.COMMUNITY,
      label: "Town as kin network",
      description: "Church, store, and family plots as continuity under economic pressure.",
    },
    {
      id: "seed-mem-natch-colonial",
      placeId: placeIds.natchitoches,
      worldStateId: idWs01,
      memoryType: PlaceMemoryType.CONTINUITY,
      label: "Colonial grid memory",
      description: "Layered French, Spanish, and American town memory along the corridor.",
    },
  ];

  for (const m of memories) {
    await prisma.placeMemoryProfile.upsert({
      where: { id: m.id },
      update: {
        label: m.label,
        description: m.description,
        memoryType: m.memoryType,
        worldStateId: m.worldStateId,
      },
      create: {
        id: m.id,
        placeId: m.placeId,
        worldStateId: m.worldStateId,
        memoryType: m.memoryType,
        label: m.label,
        description: m.description,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }
}
