/**
 * Full demo narrative: populates chapters, scenes, meta-scenes, passes, DNA rows,
 * fragments, events, relationships — for showroom demos. Idempotent via fixed IDs.
 *
 * Invoked from prisma/seed.ts after base seed + origin anchor.
 */
import {
  EventType,
  FragmentType,
  PlaceType,
  RecordType,
  SourceType,
  VisibilityStatus,
  WritingMode,
} from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { DEFAULT_BOOK_ID } from "../lib/constants/narrative-defaults";
import { DEMO } from "../lib/demo-book/ids";
import { SCENE_DRAFTS } from "../lib/demo-book/scene-drafts-registry";

const P = VisibilityStatus.PUBLIC;
const HYBRID = RecordType.HYBRID;
const FICTION = RecordType.FICTIONAL;

const IDS = {
  chPrologue: "seed-ch-prologue",
  ch1: "seed-ch-1",
  ch2: "seed-ch-2",
  alexis: "seed-person-alexis",
  francois: "seed-person-francois",
  buford: "seed-person-buford",
  narrator: "seed-person-narrator",
  natch: "seed-place-natchitoches",
  blackLake: "seed-place-black-lake",
  campti: "seed-place-campti",
  symSmoke: "seed-symbol-smoke",
  symFlame: "seed-symbol-flame",
  symRoux: "seed-symbol-roux",
  sourceGrappe: "seed-source-grappe-legacy",
} as const;

type SceneSpec = {
  id: string;
  chapterId: string;
  orderInChapter: number;
  sceneNumber: number;
  description: string;
  summary: string;
  povId: string;
  placeId: string;
  personIds: string[];
  symbolIds?: string[];
};

function specs(): SceneSpec[] {
  const { cemetery, landing, kitchen, caneRiver } = DEMO.places;
  const { narrator, alexis, francois, buford } = IDS;
  const n = IDS.natch;
  const bl = IDS.blackLake;
  const c = IDS.campti;
  const sm = IDS.symSmoke;
  const fl = IDS.symFlame;
  const rx = IDS.symRoux;

  return [
    // Prologue
    {
      id: "seed-scene-prologue-1",
      chapterId: IDS.chPrologue,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Smoke before speech — thesis of the corridor",
      summary: "Reader contract; hybridity as method.",
      povId: narrator,
      placeId: bl,
      personIds: [narrator],
      symbolIds: [sm],
    },
    {
      id: "demo-scene-pr-2",
      chapterId: IDS.chPrologue,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "River patience — arrival’s grammar",
      summary: "Alexis at the landing; translation.",
      povId: alexis,
      placeId: n,
      personIds: [alexis],
    },
    {
      id: "demo-scene-pr-3",
      chapterId: IDS.chPrologue,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Night oil — sassafras and bridge-names",
      summary: "François as word; inheritance of smoke.",
      povId: alexis,
      placeId: n,
      personIds: [alexis, francois],
      symbolIds: [sm],
    },
    // Ch1
    {
      id: "seed-scene-ch1-1",
      chapterId: IDS.ch1,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Morning trader street — Grappe as handle",
      summary: "Clerk writes the name; Alexis claims corridor.",
      povId: alexis,
      placeId: n,
      personIds: [alexis],
    },
    {
      id: "demo-scene-ch1-2",
      chapterId: IDS.ch1,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Heat and nod — public Black recognition",
      summary: "Space negotiated; letters as risk.",
      povId: alexis,
      placeId: landing,
      personIds: [alexis],
    },
    {
      id: "demo-scene-ch1-3",
      chapterId: IDS.ch1,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Bronze river — testing voice over water",
      summary: "Future branches; smoke across water.",
      povId: alexis,
      placeId: landing,
      personIds: [alexis],
      symbolIds: [sm],
    },
    // Ch2
    {
      id: "seed-scene-ch2-1",
      chapterId: IDS.ch2,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Trader’s table country",
      summary: "Languages; land talk; seam as livelihood.",
      povId: francois,
      placeId: landing,
      personIds: [francois],
    },
    {
      id: "demo-scene-ch2-2",
      chapterId: IDS.ch2,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Official with papers — refusal of tidy transfer",
      summary: "Market exhales; bridge loneliness.",
      povId: francois,
      placeId: landing,
      personIds: [francois, alexis],
    },
    {
      id: "demo-scene-ch2-3",
      chapterId: IDS.ch2,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Fire circle — cession as weather",
      summary: "Stars; downstream pull toward Campti.",
      povId: francois,
      placeId: caneRiver,
      personIds: [francois],
      symbolIds: [sm],
    },
    // Ch3
    {
      id: "demo-sc-ch3-1",
      chapterId: DEMO.chapters.ch3,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Buford at Black Lake porch",
      summary: "Oral arm story; cemetery ethics named.",
      povId: buford,
      placeId: bl,
      personIds: [buford],
      symbolIds: [sm],
    },
    {
      id: "demo-sc-ch3-2",
      chapterId: DEMO.chapters.ch3,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Roux and okra — kitchen theology",
      summary: "Hybrid teaching; stirring time.",
      povId: buford,
      placeId: kitchen,
      personIds: [buford],
      symbolIds: [rx],
    },
    {
      id: "demo-sc-ch3-3",
      chapterId: DEMO.chapters.ch3,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Lantern path — François as pattern not ghost",
      summary: "Return habit; smoke holds.",
      povId: buford,
      placeId: bl,
      personIds: [buford],
      symbolIds: [sm],
    },
  ];
}

function specsLillian(): SceneSpec[] {
  const { narrator } = IDS;
  const n = IDS.natch;
  const c = IDS.campti;
  const bl = IDS.blackLake;
  const { cemetery, landing, kitchen, caneRiver } = DEMO.places;
  const sm = IDS.symSmoke;
  const fl = IDS.symFlame;
  const rx = IDS.symRoux;
  const { ch4, ch5, ch6, ch7, ch8, ch9, ch10, ch11, ch12 } = DEMO.chapters;

  return [
    {
      id: "demo-sc-ch4-1",
      chapterId: ch4,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Letters on the dining-room archive",
      summary: "Lillian triages paper; seam log.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch4-2",
      chapterId: ch4,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Spreadsheet vs stubborn kin",
      summary: "Brain as shelf; margin notes.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch4-3",
      chapterId: ch4,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Reading aloud — ethics of quoting",
      summary: "Seam log saved; cursor blinks.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator],
      symbolIds: [sm],
    },
    {
      id: "demo-sc-ch5-1",
      chapterId: ch5,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Cemetery path with niece",
      summary: "No metaphor for the line; notice.",
      povId: narrator,
      placeId: cemetery,
      personIds: [narrator, IDS.buford],
    },
    {
      id: "demo-sc-ch5-2",
      chapterId: ch5,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Half-gone stone",
      summary: "Anger steady as river.",
      povId: narrator,
      placeId: cemetery,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch5-3",
      chapterId: ch5,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Fish joke off-record",
      summary: "Smoke from grill; symbol shorthand.",
      povId: narrator,
      placeId: c,
      personIds: [narrator, IDS.buford],
      symbolIds: [sm],
    },
    {
      id: "demo-sc-ch6-1",
      chapterId: ch6,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Reunion tent microphone",
      summary: "Elder stories; performance vs truth.",
      povId: narrator,
      placeId: c,
      personIds: [narrator, IDS.buford],
    },
    {
      id: "demo-sc-ch6-2",
      chapterId: ch6,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Storm breaks the heat",
      summary: "Trailer shelter; narrative interruption.",
      povId: narrator,
      placeId: c,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch6-3",
      chapterId: ch6,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Dance floor; transcription promise",
      summary: "Ingestion ethics; feed the kin.",
      povId: narrator,
      placeId: c,
      personIds: [narrator, IDS.buford],
    },
    {
      id: "demo-sc-ch7-1",
      chapterId: ch7,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Archive box thud",
      summary: "Maps messy; François pattern.",
      povId: narrator,
      placeId: n,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch7-2",
      chapterId: ch7,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Courthouse steps sandwich",
      summary: "Scene seed: fair booth echo.",
      povId: narrator,
      placeId: landing,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch7-3",
      chapterId: ch7,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Microfilm whir — brick not cathedral",
      summary: "Listening as method.",
      povId: narrator,
      placeId: n,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch8-1",
      chapterId: ch8,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Workspace — sourceSupportLevel",
      summary: "Interior pass accepted.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator, IDS.francois],
    },
    {
      id: "demo-sc-ch8-2",
      chapterId: ch8,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Fragment cluster wiring",
      summary: "System as findable soul.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch8-3",
      chapterId: ch8,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Night drive — stars",
      summary: "Corridor longer than miles.",
      povId: narrator,
      placeId: caneRiver,
      personIds: [narrator],
      symbolIds: [sm],
    },
    {
      id: "demo-sc-ch9-1",
      chapterId: ch9,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Merge fight — polite war",
      summary: "Split knot; brain-memo quoted.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch9-2",
      chapterId: ch9,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Buford call — hybrid flag",
      summary: "Person vs claim as question mark.",
      povId: narrator,
      placeId: bl,
      personIds: [narrator, IDS.buford],
    },
    {
      id: "demo-sc-ch9-3",
      chapterId: ch9,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Reject smoothed dialect",
      summary: "Dismiss assist; voice integrity.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch10-1",
      chapterId: ch10,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Bonfire — flame as persistence",
      summary: "Buford pokes fire; letters story spare.",
      povId: narrator,
      placeId: c,
      personIds: [narrator, IDS.buford],
      symbolIds: [fl, sm],
    },
    {
      id: "demo-sc-ch10-2",
      chapterId: ch10,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "DNA percentages argument",
      summary: "Paper lies too; embers.",
      povId: narrator,
      placeId: c,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch10-3",
      chapterId: ch10,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Dew sneakers — unlogged beauty",
      summary: "Roux memory in iron.",
      povId: narrator,
      placeId: c,
      personIds: [narrator],
      symbolIds: [rx],
    },
    {
      id: "demo-sc-ch11-1",
      chapterId: ch11,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Campti evening drive",
      summary: "Town plural; cemetery memory.",
      povId: narrator,
      placeId: c,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch11-2",
      chapterId: ch11,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Sweet tea porch",
      summary: "Going public; immersion ethics.",
      povId: narrator,
      placeId: bl,
      personIds: [narrator, IDS.buford],
    },
    {
      id: "demo-sc-ch11-3",
      chapterId: ch11,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Chimney smoke — corridor sentence",
      summary: "Demo-ready; honest enough to begin.",
      povId: narrator,
      placeId: c,
      personIds: [narrator],
      symbolIds: [sm],
    },
    {
      id: "demo-sc-ch12-1",
      chapterId: ch12,
      orderInChapter: 1,
      sceneNumber: 1,
      description: "Epilogue — Lillian steps forward",
      summary: "Narrator identity; method love.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator],
    },
    {
      id: "demo-sc-ch12-2",
      chapterId: ch12,
      orderInChapter: 2,
      sceneNumber: 2,
      description: "Direct address — click the seam",
      summary: "Variables will change.",
      povId: narrator,
      placeId: c,
      personIds: [narrator],
      symbolIds: [sm],
    },
    {
      id: "demo-sc-ch12-3",
      chapterId: ch12,
      orderInChapter: 3,
      sceneNumber: 3,
      description: "Coda — database housekeeping",
      summary: "End of demo draft.",
      povId: narrator,
      placeId: kitchen,
      personIds: [narrator],
    },
  ];
}

export async function seedFullDemo(prisma: PrismaClient) {
  // Places
  await prisma.place.upsert({
    where: { id: DEMO.places.cemetery },
    update: {
      name: "Campti — cemetery corridor",
      visibility: P,
      recordType: HYBRID,
      placeType: PlaceType.CEMETERY,
      description:
        "Racially stratified burial ground — represented in fiction with ethical restraint; not flattened into metaphor.",
      publicReturnPhrase: "Walk the path you were given; name the line without exploiting it.",
    },
    create: {
      id: DEMO.places.cemetery,
      name: "Campti — cemetery corridor",
      visibility: P,
      recordType: HYBRID,
      placeType: PlaceType.CEMETERY,
      description:
        "Racially stratified burial ground — represented in fiction with ethical restraint; not flattened into metaphor.",
      publicReturnPhrase: "Walk the path you were given; name the line without exploiting it.",
    },
  });

  await prisma.place.upsert({
    where: { id: DEMO.places.landing },
    update: {
      name: "Natchitoches landing",
      visibility: P,
      recordType: HYBRID,
      placeType: PlaceType.RIVER,
      description: "River stairs, trade street, clerk offices — arrival grammar.",
      publicReturnPhrase: "Current like patience.",
    },
    create: {
      id: DEMO.places.landing,
      name: "Natchitoches landing",
      visibility: P,
      recordType: HYBRID,
      placeType: PlaceType.RIVER,
      description: "River stairs, trade street, clerk offices — arrival grammar.",
      publicReturnPhrase: "Current like patience.",
    },
  });

  await prisma.place.upsert({
    where: { id: DEMO.places.kitchen },
    update: {
      name: "Grappe kitchen / home archive",
      visibility: P,
      recordType: FICTION,
      placeType: PlaceType.HOME,
      description: "Roux, okra, letters on table — domestic method.",
      publicReturnPhrase: "Stir until the foundation darkens.",
    },
    create: {
      id: DEMO.places.kitchen,
      name: "Grappe kitchen / home archive",
      visibility: P,
      recordType: FICTION,
      placeType: PlaceType.HOME,
      description: "Roux, okra, letters on table — domestic method.",
      publicReturnPhrase: "Stir until the foundation darkens.",
    },
  });

  await prisma.place.upsert({
    where: { id: DEMO.places.caneRiver },
    update: {
      name: "Cane River corridor",
      visibility: P,
      recordType: HYBRID,
      placeType: PlaceType.REGION,
      description: "Parishes and kin paths between Natchitoches and Campti.",
      publicReturnPhrase: "A habit of return.",
    },
    create: {
      id: DEMO.places.caneRiver,
      name: "Cane River corridor",
      visibility: P,
      recordType: HYBRID,
      placeType: PlaceType.REGION,
      description: "Parishes and kin paths between Natchitoches and Campti.",
      publicReturnPhrase: "A habit of return.",
    },
  });

  for (const pl of [
    DEMO.places.cemetery,
    DEMO.places.landing,
    DEMO.places.kitchen,
    DEMO.places.caneRiver,
  ]) {
    await prisma.settingProfile.upsert({
      where: { placeId: pl },
      update: {
        physicalDescription:
          "Humid subtropical light; woodsmoke optional; river or oak shade depending on hour.",
        sounds: "Cicadas, distant dog, river shoals, porch boards.",
        smells: "River silt, roux, cut grass, rain on hot gravel.",
      },
      create: {
        placeId: pl,
        physicalDescription:
          "Humid subtropical light; woodsmoke optional; river or oak shade depending on hour.",
        sounds: "Cicadas, distant dog, river shoals, porch boards.",
        smells: "River silt, roux, cut grass, rain on hot gravel.",
      },
    });
  }

  await prisma.person.update({
    where: { id: IDS.narrator },
    data: {
      name: "Lillian Grappe",
      description:
        "Frame narrator for the demo novel — archivist, merge reviewer, scene author; transparency over disguise.",
      visibility: P,
      recordType: HYBRID,
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: IDS.narrator },
    update: {
      worldview:
        "Archives are acts of love when done with humility; the seam between oral and paper is sacred ground.",
      coreBeliefs:
        "Label uncertainty; refuse smooth AI overrides; protect living people from careless merges.",
      emotionalBaseline: "Tired, stubborn, tender.",
      speechPatterns: "Plain diction; occasional second-person when ethics demand direct address.",
      notes: "Demo narrator — continuity note on hidden identity relaxed for showroom clarity.",
    },
    create: {
      personId: IDS.narrator,
      worldview:
        "Archives are acts of love when done with humility; the seam between oral and paper is sacred ground.",
      coreBeliefs:
        "Label uncertainty; refuse smooth AI overrides; protect living people from careless merges.",
      emotionalBaseline: "Tired, stubborn, tender.",
      speechPatterns: "Plain diction; occasional second-person when ethics demand direct address.",
      notes: "Demo narrator — continuity note on hidden identity relaxed for showroom clarity.",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: IDS.alexis },
    update: {
      worldview:
        "Kin and land move through language before they move through law; a name on paper is a door, not the whole house.",
      desires: "Carry letters and lineage without being reduced to a clerk’s spelling.",
      fears: "Paper that outlives the body and misnames the living.",
      internalConflicts: "Name as public handle versus corridor identity — translation as survival.",
      emotionalBaseline: "Watchful, heat-tired, quietly determined.",
      notes: "Chapter 1 POV — arrival and translation; demo character arc seed.",
    },
    create: {
      personId: IDS.alexis,
      worldview:
        "Kin and land move through language before they move through law; a name on paper is a door, not the whole house.",
      desires: "Carry letters and lineage without being reduced to a clerk’s spelling.",
      fears: "Paper that outlives the body and misnames the living.",
      internalConflicts: "Name as public handle versus corridor identity — translation as survival.",
      emotionalBaseline: "Watchful, heat-tired, quietly determined.",
      notes: "Chapter 1 POV — arrival and translation; demo character arc seed.",
    },
  });

  const chapterRows = [
    {
      id: IDS.chPrologue,
      chapterNumber: 0,
      title: "Prologue — Smoke Before Speech",
      summary:
        "Establishes the corridor, hybridity as method, and the contract with the reader.",
      status: "complete",
      timePeriod: "Multi-temporal frame",
      pov: "Lillian / omniscient braid",
    },
    {
      id: IDS.ch1,
      chapterNumber: 1,
      title: "Chapter 1 — Alexis: Arrival in Natchitoches",
      summary: "Letters, clerk’s pen, river patience — Alexis becomes a sentence others can parse.",
      status: "complete",
      timePeriod: "Historical braid",
      pov: "Alexis",
    },
    {
      id: IDS.ch2,
      chapterNumber: 2,
      title: "Chapter 2 — François: The Trader, Interpreter, Bridge",
      summary: "Multilingual table; land talk; loneliness of translation.",
      status: "complete",
      timePeriod: "Historical braid",
      pov: "François",
    },
    {
      id: DEMO.chapters.ch3,
      chapterNumber: 3,
      title: "Chapter 3 — Black Lake: Buford and the Oral Arm",
      summary: "Hybrid injury story; roux theology; cemetery ethics without spectacle.",
      status: "complete",
      timePeriod: "20th–21st c. braid",
      pov: "Buford",
    },
    {
      id: DEMO.chapters.ch4,
      chapterNumber: 4,
      title: "Chapter 4 — The Letters and the Seam",
      summary: "Lillian triages paper; spreadsheet vs kin; seam log.",
      status: "complete",
      timePeriod: "Present",
      pov: "Lillian",
    },
    {
      id: DEMO.chapters.ch5,
      chapterNumber: 5,
      title: "Chapter 5 — Cemetery Geography",
      summary: "Walking the line without metaphor theft; anger steady as river.",
      status: "complete",
      timePeriod: "Present",
      pov: "Lillian",
    },
    {
      id: DEMO.chapters.ch6,
      chapterNumber: 6,
      title: "Chapter 6 — Reunion as Archive",
      summary: "Microphone ethics; storm; transcription as respect.",
      status: "complete",
      timePeriod: "Present",
      pov: "Lillian",
    },
    {
      id: DEMO.chapters.ch7,
      chapterNumber: 7,
      title: "Chapter 7 — Natchitoches Files",
      summary: "Archive box; microfilm; brick not cathedral.",
      status: "complete",
      timePeriod: "Present",
      pov: "Lillian",
    },
    {
      id: DEMO.chapters.ch8,
      chapterNumber: 8,
      title: "Chapter 8 — François Echo (Support Layer)",
      summary: "Source support UI; fragment clusters; night drive.",
      status: "complete",
      timePeriod: "Present / research frame",
      pov: "Lillian",
    },
    {
      id: DEMO.chapters.ch9,
      chapterNumber: 9,
      title: "Chapter 9 — Merge Fight",
      summary: "Entity resolution; oral vs database dignity; dismiss bad assist.",
      status: "complete",
      timePeriod: "Present",
      pov: "Lillian",
    },
    {
      id: DEMO.chapters.ch10,
      chapterNumber: 10,
      title: "Chapter 10 — Flame and Persistence",
      summary: "Bonfire stories; DNA unease; roux memory.",
      status: "complete",
      timePeriod: "Present",
      pov: "Lillian",
    },
    {
      id: DEMO.chapters.ch11,
      chapterNumber: 11,
      title: "Chapter 11 — Campti Evening",
      summary: "Town as plural fact; sweet tea; smoke lifts.",
      status: "complete",
      timePeriod: "Present",
      pov: "Lillian",
    },
    {
      id: DEMO.chapters.ch12,
      chapterNumber: 12,
      title: "Epilogue — The Narrator Steps Forward",
      summary: "Lillian named; method as love; end of demo draft.",
      status: "complete",
      timePeriod: "Present",
      pov: "Lillian",
    },
  ];

  for (const ch of chapterRows) {
    await prisma.chapter.upsert({
      where: { id: ch.id },
      update: {
        bookId: DEFAULT_BOOK_ID,
        title: ch.title,
        chapterNumber: ch.chapterNumber,
        sequenceInBook: ch.chapterNumber ?? 0,
        summary: ch.summary,
        status: ch.status,
        timePeriod: ch.timePeriod,
        pov: ch.pov,
        visibility: P,
        recordType: HYBRID,
        publicNotes: "Campti demo draft — full scene text seeded for showroom.",
      },
      create: {
        id: ch.id,
        bookId: DEFAULT_BOOK_ID,
        sequenceInBook: ch.chapterNumber ?? 0,
        title: ch.title,
        chapterNumber: ch.chapterNumber,
        summary: ch.summary,
        status: ch.status,
        timePeriod: ch.timePeriod,
        pov: ch.pov,
        visibility: P,
        recordType: HYBRID,
        publicNotes: "Campti demo draft — full scene text seeded for showroom.",
      },
    });
  }

  const allSpecs = [...specs(), ...specsLillian()];

  for (const s of allSpecs) {
    const draft = SCENE_DRAFTS[s.id];
    if (!draft) {
      throw new Error(`Missing draft for scene ${s.id}`);
    }
    await prisma.scene.upsert({
      where: { id: s.id },
      update: {
        description: s.description,
        summary: s.summary,
        chapterId: s.chapterId,
        orderInChapter: s.orderInChapter,
        sceneNumber: s.sceneNumber,
        visibility: P,
        recordType: HYBRID,
        writingMode: WritingMode.NARRATIVE,
        draftText: draft,
        narrativeIntent: s.summary,
        emotionalTone: "Corridor tension / tenderness",
        sceneStatus: "complete",
        persons: { set: s.personIds.map((id) => ({ id })) },
        places: { set: [{ id: s.placeId }] },
        symbols:
          s.symbolIds && s.symbolIds.length
            ? { set: s.symbolIds.map((id) => ({ id })) }
            : { set: [] },
      },
      create: {
        id: s.id,
        description: s.description,
        summary: s.summary,
        chapterId: s.chapterId,
        orderInChapter: s.orderInChapter,
        sceneNumber: s.sceneNumber,
        visibility: P,
        recordType: HYBRID,
        writingMode: WritingMode.NARRATIVE,
        draftText: draft,
        narrativeIntent: s.summary,
        emotionalTone: "Corridor tension / tenderness",
        sceneStatus: "complete",
        persons: { connect: s.personIds.map((id) => ({ id })) },
        places: { connect: [{ id: s.placeId }] },
        ...(s.symbolIds && s.symbolIds.length
          ? { symbols: { connect: s.symbolIds.map((id) => ({ id })) } }
          : {}),
      },
    });
  }

  // Chapters ↔ people & places (reading graph)
  const chapterLinks: { id: string; personIds: string[]; placeIds: string[] }[] = [
    {
      id: IDS.chPrologue,
      personIds: [IDS.narrator, IDS.alexis, IDS.francois],
      placeIds: [IDS.blackLake, IDS.natch],
    },
    {
      id: IDS.ch1,
      personIds: [IDS.alexis],
      placeIds: [IDS.natch, DEMO.places.landing],
    },
    {
      id: IDS.ch2,
      personIds: [IDS.francois, IDS.alexis],
      placeIds: [DEMO.places.landing, DEMO.places.caneRiver],
    },
    {
      id: DEMO.chapters.ch3,
      personIds: [IDS.buford],
      placeIds: [IDS.blackLake, DEMO.places.kitchen],
    },
    {
      id: DEMO.chapters.ch4,
      personIds: [IDS.narrator],
      placeIds: [DEMO.places.kitchen],
    },
    {
      id: DEMO.chapters.ch5,
      personIds: [IDS.narrator, IDS.buford],
      placeIds: [DEMO.places.cemetery, IDS.campti],
    },
    {
      id: DEMO.chapters.ch6,
      personIds: [IDS.narrator, IDS.buford],
      placeIds: [IDS.campti],
    },
    {
      id: DEMO.chapters.ch7,
      personIds: [IDS.narrator],
      placeIds: [IDS.natch, DEMO.places.landing],
    },
    {
      id: DEMO.chapters.ch8,
      personIds: [IDS.narrator, IDS.francois],
      placeIds: [DEMO.places.kitchen, DEMO.places.caneRiver],
    },
    {
      id: DEMO.chapters.ch9,
      personIds: [IDS.narrator, IDS.buford],
      placeIds: [DEMO.places.kitchen, IDS.blackLake],
    },
    {
      id: DEMO.chapters.ch10,
      personIds: [IDS.narrator, IDS.buford],
      placeIds: [IDS.campti],
    },
    {
      id: DEMO.chapters.ch11,
      personIds: [IDS.narrator, IDS.buford],
      placeIds: [IDS.campti, IDS.blackLake],
    },
    {
      id: DEMO.chapters.ch12,
      personIds: [IDS.narrator],
      placeIds: [DEMO.places.kitchen, IDS.campti],
    },
  ];
  for (const cl of chapterLinks) {
    await prisma.chapter.update({
      where: { id: cl.id },
      data: {
        persons: { set: cl.personIds.map((id) => ({ id })) },
        places: { set: cl.placeIds.map((id) => ({ id })) },
      },
    });
  }

  // Meta-scenes + passes + beats (sample)
  for (const s of allSpecs) {
    const metaId = `demo-meta-${s.id}`;
    await prisma.metaScene.upsert({
      where: { id: metaId },
      update: {
        title: s.description,
        sceneId: s.id,
        placeId: s.placeId,
        povPersonId: s.povId,
        participants: s.personIds,
        environmentDescription: `Demo meta-layer for ${s.id}`,
        sensoryField: "Heat, smoke, river sound, cicadas — corridor humidity.",
        historicalConstraints: "Treat research excerpts as support, not tribal certification.",
        socialConstraints: "Ethical depiction of cemetery and racial geography — no spectacle.",
        characterStatesSummary: "POV attention tuned to seam-labeling and kin obligation.",
        emotionalVoltage: "medium-high",
        centralConflict: "Paper vs oral dignity; merge ethics vs narrative smoothness.",
        symbolicElements: "Smoke, flame, roux — recurring demo symbols.",
        narrativePurpose: "Showroom: guided + narrative passes populated.",
        continuityDependencies: "Linked to demo chapters and public read surfaces.",
        sourceSupportLevel: "hybrid",
        notes: "Seeded for Campti demo.",
      },
      create: {
        id: metaId,
        title: s.description,
        sceneId: s.id,
        placeId: s.placeId,
        povPersonId: s.povId,
        participants: s.personIds,
        environmentDescription: `Demo meta-layer for ${s.id}`,
        sensoryField: "Heat, smoke, river sound, cicadas — corridor humidity.",
        historicalConstraints: "Treat research excerpts as support, not tribal certification.",
        socialConstraints: "Ethical depiction of cemetery and racial geography — no spectacle.",
        characterStatesSummary: "POV attention tuned to seam-labeling and kin obligation.",
        emotionalVoltage: "medium-high",
        centralConflict: "Paper vs oral dignity; merge ethics vs narrative smoothness.",
        symbolicElements: "Smoke, flame, roux — recurring demo symbols.",
        narrativePurpose: "Showroom: guided + narrative passes populated.",
        continuityDependencies: "Linked to demo chapters and public read surfaces.",
        sourceSupportLevel: "hybrid",
        notes: "Seeded for Campti demo.",
      },
    });

    await prisma.metaSceneNarrativePass.upsert({
      where: { id: `${metaId}-opening` },
      update: {
        metaSceneId: metaId,
        passType: "opening",
        styleMode: "literary",
        content:
          SCENE_DRAFTS[s.id].split("\n\n")[0]?.slice(0, 1200) ||
          SCENE_DRAFTS[s.id].slice(0, 1200),
        summary: "Opening beat (truncated from draft for pass)",
        status: "accepted",
        confidence: 4,
      },
      create: {
        id: `${metaId}-opening`,
        metaSceneId: metaId,
        passType: "opening",
        styleMode: "literary",
        content:
          SCENE_DRAFTS[s.id].split("\n\n")[0]?.slice(0, 1200) ||
          SCENE_DRAFTS[s.id].slice(0, 1200),
        summary: "Opening beat (truncated from draft for pass)",
        status: "accepted",
        confidence: 4,
      },
    });

    await prisma.metaSceneNarrativePass.upsert({
      where: { id: `${metaId}-full` },
      update: {
        metaSceneId: metaId,
        passType: "full_structured",
        styleMode: "literary",
        content: SCENE_DRAFTS[s.id],
        summary: s.summary,
        status: "accepted",
        confidence: 4,
      },
      create: {
        id: `${metaId}-full`,
        metaSceneId: metaId,
        passType: "full_structured",
        styleMode: "literary",
        content: SCENE_DRAFTS[s.id],
        summary: s.summary,
        status: "accepted",
        confidence: 4,
      },
    });
  }

  // Cinematic passes (published) — first scene of each chapter
  const firstScenes = [
    "seed-scene-prologue-1",
    "seed-scene-ch1-1",
    "seed-scene-ch2-1",
    "demo-sc-ch3-1",
    "demo-sc-ch4-1",
    "demo-sc-ch5-1",
    "demo-sc-ch6-1",
    "demo-sc-ch7-1",
    "demo-sc-ch8-1",
    "demo-sc-ch9-1",
    "demo-sc-ch10-1",
    "demo-sc-ch11-1",
    "demo-sc-ch12-1",
  ];
  for (const sid of firstScenes) {
    const ms = await prisma.metaScene.findFirst({ where: { sceneId: sid } });
    if (!ms) continue;
    const cid = `demo-cine-${sid}`;
    await prisma.cinematicNarrativePass.upsert({
      where: { id: cid },
      update: {
        metaSceneId: ms.id,
        passType: "full_scene",
        styleMode: "cinematic_read",
        content: SCENE_DRAFTS[sid],
        summary: "Published cinematic read pass for demo hub",
        sequenceOrder: 1,
        status: "published",
        confidence: 4,
      },
      create: {
        id: cid,
        metaSceneId: ms.id,
        passType: "full_scene",
        styleMode: "cinematic_read",
        content: SCENE_DRAFTS[sid],
        summary: "Published cinematic read pass for demo hub",
        sequenceOrder: 1,
        status: "published",
        confidence: 4,
      },
    });
  }

  // Scene beats (subset)
  const beatScene = await prisma.metaScene.findFirst({
    where: { id: "demo-meta-seed-scene-ch1-1" },
  });
  if (beatScene) {
    for (const b of [
      { order: 1, type: "establish", text: "River town heat; clerk writes Grappe." },
      { order: 2, type: "pressure", text: "Name as handle vs corridor identity." },
      { order: 3, type: "turn", text: "Street releases into bread, multilingual argument." },
    ]) {
      await prisma.sceneBeat.upsert({
        where: { id: `demo-beat-ch1-${b.order}` },
        update: {
          metaSceneId: beatScene.id,
          beatType: b.type,
          orderIndex: b.order,
          summary: b.text,
          emotionalCharge: "medium",
        },
        create: {
          id: `demo-beat-ch1-${b.order}`,
          metaSceneId: beatScene.id,
          beatType: b.type,
          orderIndex: b.order,
          summary: b.text,
          emotionalCharge: "medium",
        },
      });
    }
  }

  // Voice pass sample
  const msPro = await prisma.metaScene.findFirst({
    where: { id: "demo-meta-seed-scene-prologue-1" },
  });
  if (msPro) {
    await prisma.voicePass.upsert({
      where: { id: "demo-voice-prologue-narrator" },
      update: {
        metaSceneId: msPro.id,
        personId: IDS.narrator,
        passType: "pov_render",
        content: SCENE_DRAFTS["seed-scene-prologue-1"].slice(0, 2000),
        status: "accepted",
        confidence: 3,
      },
      create: {
        id: "demo-voice-prologue-narrator",
        metaSceneId: msPro.id,
        personId: IDS.narrator,
        passType: "pov_render",
        content: SCENE_DRAFTS["seed-scene-prologue-1"].slice(0, 2000),
        status: "accepted",
        confidence: 3,
      },
    });
  }

  // DNA + bindings
  await prisma.source.upsert({
    where: { id: DEMO.sourceMain },
    update: {
      title: "The Smoke of the Corridor — Demo manuscript spine",
      summary: "Synthetic spine document for narrative DNA bindings in showroom.",
      visibility: P,
      recordType: HYBRID,
      sourceType: SourceType.NOTE,
      archiveStatus: "reviewed",
      extractedSummary: "Demo: hybridity, seam-labeling, generational echo.",
    },
    create: {
      id: DEMO.sourceMain,
      title: "The Smoke of the Corridor — Demo manuscript spine",
      summary: "Synthetic spine document for narrative DNA bindings in showroom.",
      visibility: P,
      recordType: HYBRID,
      sourceType: SourceType.NOTE,
      archiveStatus: "reviewed",
      extractedSummary: "Demo: hybridity, seam-labeling, generational echo.",
    },
  });

  await prisma.theme.upsert({
    where: { id: DEMO.theme.hybridity },
    update: {
      name: "Hybridity as method",
      description:
        "When oral and documentary strands disagree, label the seam — fragments are not facts by default.",
      intensity: 5,
      category: "core",
      sourceId: DEMO.sourceMain,
    },
    create: {
      id: DEMO.theme.hybridity,
      name: "Hybridity as method",
      description:
        "When oral and documentary strands disagree, label the seam — fragments are not facts by default.",
      intensity: 5,
      category: "core",
      sourceId: DEMO.sourceMain,
    },
  });

  await prisma.theme.upsert({
    where: { id: DEMO.theme.land },
    update: {
      name: "Land as memory vs land as file",
      description: "Cession, corridor, return — paper maps and walked paths in tension.",
      intensity: 4,
      category: "core",
      sourceId: DEMO.sourceMain,
    },
    create: {
      id: DEMO.theme.land,
      name: "Land as memory vs land as file",
      description: "Cession, corridor, return — paper maps and walked paths in tension.",
      intensity: 4,
      category: "core",
      sourceId: DEMO.sourceMain,
    },
  });

  await prisma.narrativeRule.upsert({
    where: { id: DEMO.rule.labelOral },
    update: {
      title: "Label oral history distinctly",
      description:
        "Oral claims (e.g., injury stories) remain flagged hybrid until documentary confirmation — never silent merge.",
      category: "memory",
      strength: 5,
      scope: "global",
      sourceId: DEMO.sourceMain,
    },
    create: {
      id: DEMO.rule.labelOral,
      title: "Label oral history distinctly",
      description:
        "Oral claims (e.g., injury stories) remain flagged hybrid until documentary confirmation — never silent merge.",
      category: "memory",
      strength: 5,
      scope: "global",
      sourceId: DEMO.sourceMain,
    },
  });

  await prisma.motif.upsert({
    where: { id: DEMO.motif.smoke },
    update: {
      name: "Smoke on the corridor",
      description: "Winter fields, chimneys, signal — memory before explanation.",
      usagePattern: "Reprise at chapter turns; sensory return hook.",
      sourceId: DEMO.sourceMain,
    },
    create: {
      id: DEMO.motif.smoke,
      name: "Smoke on the corridor",
      description: "Winter fields, chimneys, signal — memory before explanation.",
      usagePattern: "Reprise at chapter turns; sensory return hook.",
      sourceId: DEMO.sourceMain,
    },
  });

  await prisma.narrativePattern.upsert({
    where: { id: DEMO.pattern.generational },
    update: {
      title: "Generational echo",
      description: "Alexis → François → Buford → Lillian — same seam, different register.",
      patternType: "generational",
      strength: 5,
      sourceId: DEMO.sourceMain,
    },
    create: {
      id: DEMO.pattern.generational,
      title: "Generational echo",
      description: "Alexis → François → Buford → Lillian — same seam, different register.",
      patternType: "generational",
      strength: 5,
      sourceId: DEMO.sourceMain,
    },
  });

  await prisma.literaryDevice.upsert({
    where: { id: DEMO.device.seam },
    update: {
      name: "Seam revelation",
      description: "Direct address in epilogue; second-person ethics; UI metaphor for merge.",
      systemEffect: "Forces reader awareness of construction without breaking immersion carelessly.",
      sourceId: DEMO.sourceMain,
    },
    create: {
      id: DEMO.device.seam,
      name: "Seam revelation",
      description: "Direct address in epilogue; second-person ethics; UI metaphor for merge.",
      systemEffect: "Forces reader awareness of construction without breaking immersion carelessly.",
      sourceId: DEMO.sourceMain,
    },
  });

  const bindNarrative = async (
    id: string,
    st: string,
    sid: string,
    tt: string,
    tid: string,
    rel: string,
  ) => {
    await prisma.narrativeBinding.upsert({
      where: { id },
      update: { relationship: rel },
      create: {
        id,
        sourceType: st,
        sourceId: sid,
        targetType: tt,
        targetId: tid,
        relationship: rel,
        strength: 4,
        notes: "Demo binding",
      },
    });
  };

  await bindNarrative(
    "demo-bind-theme-hybrid-ch4",
    "theme",
    DEMO.theme.hybridity,
    "chapter",
    DEMO.chapters.ch4,
    "expresses",
  );
  await bindNarrative(
    "demo-bind-motif-smoke-pro",
    "motif",
    DEMO.motif.smoke,
    "scene",
    "seed-scene-prologue-1",
    "expresses",
  );
  await bindNarrative(
    "demo-bind-rule-oral-buford",
    "narrative_rule",
    DEMO.rule.labelOral,
    "person",
    IDS.buford,
    "influences",
  );

  // Chapter 1 — demo: surface narrative DNA on the arrival chapter (bindings visible in /admin/bindings)
  await bindNarrative(
    "demo-bind-theme-hybrid-ch1",
    "theme",
    DEMO.theme.hybridity,
    "chapter",
    IDS.ch1,
    "expresses",
  );
  await bindNarrative(
    "demo-bind-theme-land-ch1",
    "theme",
    DEMO.theme.land,
    "chapter",
    IDS.ch1,
    "expresses",
  );
  await bindNarrative(
    "demo-bind-motif-smoke-ch1-3",
    "motif",
    DEMO.motif.smoke,
    "scene",
    "demo-scene-ch1-3",
    "expresses",
  );
  await bindNarrative(
    "demo-bind-pattern-gen-ch1",
    "narrative_pattern",
    DEMO.pattern.generational,
    "chapter",
    IDS.ch1,
    "emerges_from",
  );
  await bindNarrative(
    "demo-bind-device-seam-ch1-1",
    "literary_device",
    DEMO.device.seam,
    "scene",
    "seed-scene-ch1-1",
    "influences",
  );
  await bindNarrative(
    "demo-bind-symbol-smoke-ch1-3",
    "symbol",
    IDS.symSmoke,
    "scene",
    "demo-scene-ch1-3",
    "expresses",
  );

  // Fragment cluster
  await prisma.fragmentCluster.upsert({
    where: { id: DEMO.cluster.smoke },
    update: {
      title: "Smoke → lineage → return",
      clusterType: "symbolic",
      summary: "Signal/memory across generations; ties scenes to symbol seed-smoke.",
      emotionalTone: "Warm unease",
      dominantFunction: "Return hook",
      chapterId: IDS.chPrologue,
      symbolId: IDS.symSmoke,
    },
    create: {
      id: DEMO.cluster.smoke,
      title: "Smoke → lineage → return",
      clusterType: "symbolic",
      summary: "Signal/memory across generations; ties scenes to symbol seed-smoke.",
      emotionalTone: "Warm unease",
      dominantFunction: "Return hook",
      chapterId: IDS.chPrologue,
      symbolId: IDS.symSmoke,
    },
  });

  await prisma.fragmentCluster.upsert({
    where: { id: DEMO.cluster.paper },
    update: {
      title: "Paper trail / oral river",
      clusterType: "thematic",
      summary: "Chapters 4 & 9 — ingestion, merge fight, seam log.",
      emotionalTone: "Tired resolve",
      dominantFunction: "Ethics",
      chapterId: DEMO.chapters.ch4,
    },
    create: {
      id: DEMO.cluster.paper,
      title: "Paper trail / oral river",
      clusterType: "thematic",
      summary: "Chapters 4 & 9 — ingestion, merge fight, seam log.",
      emotionalTone: "Tired resolve",
      dominantFunction: "Ethics",
      chapterId: DEMO.chapters.ch4,
    },
  });

  // Fragments (demo)
  await prisma.fragment.upsert({
    where: { id: "demo-frag-seam-direct" },
    update: {
      title: "Seam log (fiction)",
      fragmentType: FragmentType.THEME_STATEMENT,
      visibility: P,
      recordType: HYBRID,
      text: "Where strands disagree, keep both — label the seam.",
      excerpt: "label the seam",
      summary: "Ethical through-line for demo novel.",
      sourceId: DEMO.sourceMain,
      placementStatus: "placed",
      reviewStatus: "accepted",
      confidence: 4,
    },
    create: {
      id: "demo-frag-seam-direct",
      title: "Seam log (fiction)",
      fragmentType: FragmentType.THEME_STATEMENT,
      visibility: P,
      recordType: HYBRID,
      text: "Where strands disagree, keep both — label the seam.",
      excerpt: "label the seam",
      summary: "Ethical through-line for demo novel.",
      sourceId: DEMO.sourceMain,
      placementStatus: "placed",
      reviewStatus: "accepted",
      confidence: 4,
    },
  });

  await prisma.fragment.upsert({
    where: { id: "demo-frag-merge-fight" },
    update: {
      title: "Merge review note",
      fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
      visibility: P,
      recordType: HYBRID,
      text: "Are we sure this François is that François? Split the knot.",
      excerpt: "Split the knot",
      summary: "Demo continuity: sloppy merging harms.",
      sourceId: DEMO.sourceMain,
      placementStatus: "placed",
      reviewStatus: "accepted",
      confidence: 4,
    },
    create: {
      id: "demo-frag-merge-fight",
      title: "Merge review note",
      fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
      visibility: P,
      recordType: HYBRID,
      text: "Are we sure this François is that François? Split the knot.",
      excerpt: "Split the knot",
      summary: "Demo continuity: sloppy merging harms.",
      sourceId: DEMO.sourceMain,
      placementStatus: "placed",
      reviewStatus: "accepted",
      confidence: 4,
    },
  });

  // Events
  const evAlexis = "demo-event-alexis-arrival";
  await prisma.event.upsert({
    where: { id: evAlexis },
    update: {
      title: "Alexis arrives Natchitoches (novel demo)",
      description: "Framing arrival for corridor narrative.",
      visibility: P,
      recordType: HYBRID,
      eventType: EventType.MIGRATION,
      startYear: 1800,
      persons: { set: [{ id: IDS.alexis }] },
      places: { set: [{ id: IDS.natch }] },
      chapters: { set: [{ id: IDS.ch1 }] },
    },
    create: {
      id: evAlexis,
      title: "Alexis arrives Natchitoches (novel demo)",
      description: "Framing arrival for corridor narrative.",
      visibility: P,
      recordType: HYBRID,
      eventType: EventType.MIGRATION,
      startYear: 1800,
      persons: { connect: [{ id: IDS.alexis }] },
      places: { connect: [{ id: IDS.natch }] },
      chapters: { connect: [{ id: IDS.ch1 }] },
    },
  });

  // Relationships (lexicographic personA < personB)
  const rels: [string, string, string, string][] = [
    [IDS.alexis, IDS.buford, "lineage_carrying", "Letters north; name threads corridor."],
    [IDS.alexis, IDS.francois, "lineage_carrying", "Education and bridge-figure inheritance."],
    [IDS.buford, IDS.francois, "lineage_carrying", "Interpreter echo in family storytelling."],
    [IDS.buford, IDS.narrator, "kinship_present", "Porch, phone calls, archive care."],
    [IDS.francois, IDS.narrator, "research_bridge", "Support layer in Chapter 8 meta."],
  ];
  for (const [a, b, t, sum] of rels) {
    const id = `demo-rel-${a.slice(0, 8)}-${b.slice(0, 8)}`;
    await prisma.characterRelationship.upsert({
      where: { personAId_personBId: { personAId: a, personBId: b } },
      update: { relationshipType: t, relationshipSummary: sum, confidence: 3 },
      create: {
        personAId: a,
        personBId: b,
        relationshipType: t,
        relationshipSummary: sum,
        confidence: 3,
      },
    });
  }

  // Claims (existing source)
  await prisma.claim.upsert({
    where: { id: "demo-claim-treaty-kitchen" },
    update: {},
    create: {
      id: "demo-claim-treaty-kitchen",
      sourceId: IDS.sourceGrappe,
      visibility: P,
      recordType: RecordType.ORAL_HISTORY,
      description:
        "Reservation discussed in kitchens along the corridor before appearing in indexed files.",
      confidence: 3,
      needsReview: true,
      quoteExcerpt: "kitchens before indexes",
    },
  });
  await prisma.claim.upsert({
    where: { id: "demo-claim-dna-not-proof" },
    update: {},
    create: {
      id: "demo-claim-dna-not-proof",
      sourceId: IDS.sourceGrappe,
      visibility: P,
      recordType: HYBRID,
      description: "DNA percentages are hypotheses about affinity, not tribal enrollment certificates.",
      confidence: 4,
      needsReview: false,
    },
  });

  await prisma.fragmentClusterLink.upsert({
    where: { id: "demo-fcl-seam-paper" },
    update: {},
    create: {
      id: "demo-fcl-seam-paper",
      fragmentId: "demo-frag-seam-direct",
      clusterId: DEMO.cluster.paper,
      role: "thesis",
      notes: "Demo cluster link for fragments UI.",
    },
  });
  await prisma.fragmentClusterLink.upsert({
    where: { id: "demo-fcl-merge-paper" },
    update: {},
    create: {
      id: "demo-fcl-merge-paper",
      fragmentId: "demo-frag-merge-fight",
      clusterId: DEMO.cluster.paper,
      role: "constraint",
    },
  });

  // Brain memos
  await prisma.brainMemo.upsert({
    where: { id: "demo-brain-demo-spine" },
    update: {
      title: "Demo spine: full book seeded",
      content:
        "All public chapters and scenes carry draft prose; meta-scenes and passes populated for guided/cinematic modes.",
      memoType: "synthesis",
      linkedChapterId: DEMO.chapters.ch12,
    },
    create: {
      id: "demo-brain-demo-spine",
      title: "Demo spine: full book seeded",
      content:
        "All public chapters and scenes carry draft prose; meta-scenes and passes populated for guided/cinematic modes.",
      memoType: "synthesis",
      linkedChapterId: DEMO.chapters.ch12,
    },
  });

  // Scene notes
  await prisma.sceneNote.upsert({
    where: { id: "demo-note-ch1-workspace" },
    update: {
      sceneId: "seed-scene-ch1-1",
      noteType: "author",
      content: "Demo: clerk scene anchors hybrid record problem early.",
    },
    create: {
      id: "demo-note-ch1-workspace",
      sceneId: "seed-scene-ch1-1",
      noteType: "author",
      content: "Demo: clerk scene anchors hybrid record problem early.",
    },
  });

  // Construction + soul suggestions (sample)
  const msCh3 = await prisma.metaScene.findFirst({ where: { id: "demo-meta-demo-sc-ch3-1" } });
  if (msCh3) {
    await prisma.sceneConstructionSuggestion.upsert({
      where: { id: "demo-scs-buford-porch" },
      update: {
        metaSceneId: msCh3.id,
        title: "Widen oral injury beat",
        suggestionType: "expansion",
        summary: "Add parish search B-plot without resolving on-page — keep hybrid flag.",
        status: "accepted",
        confidence: 3,
      },
      create: {
        id: "demo-scs-buford-porch",
        metaSceneId: msCh3.id,
        title: "Widen oral injury beat",
        suggestionType: "expansion",
        summary: "Add parish search B-plot without resolving on-page — keep hybrid flag.",
        status: "accepted",
        confidence: 3,
      },
    });
    await prisma.sceneSoulSuggestion.upsert({
      where: { id: "demo-sss-buford-dignity" },
      update: {
        metaSceneId: msCh3.id,
        title: "Embodied dignity",
        suggestionType: "interior",
        summary: "Let silence carry injury story as much as speech — refuse spectacle.",
        status: "accepted",
        confidence: 4,
      },
      create: {
        id: "demo-sss-buford-dignity",
        metaSceneId: msCh3.id,
        title: "Embodied dignity",
        suggestionType: "interior",
        summary: "Let silence carry injury story as much as speech — refuse spectacle.",
        status: "accepted",
        confidence: 4,
      },
    });
  }

  // Scene assist run (sample dismissed)
  await prisma.sceneAssistRun.upsert({
    where: { id: "demo-assist-ch9-dismiss" },
    update: {
      sceneId: "demo-sc-ch9-3",
      assistType: "expand",
      status: "dismissed",
      modelName: "demo",
      outputText: "(smoothed dialect — rejected by author)",
    },
    create: {
      id: "demo-assist-ch9-dismiss",
      sceneId: "demo-sc-ch9-3",
      assistType: "expand",
      status: "dismissed",
      modelName: "demo",
      outputText: "(smoothed dialect — rejected by author)",
    },
  });

  // Open question (demo)
  await prisma.openQuestion.upsert({
    where: { id: "demo-oq-public-readiness" },
    update: {
      title: "Is every cinematic pass ready for public?",
      description: "Spot-check published passes before wide demo.",
      status: "open",
      priority: 2,
    },
    create: {
      id: "demo-oq-public-readiness",
      title: "Is every cinematic pass ready for public?",
      description: "Spot-check published passes before wide demo.",
      status: "open",
      priority: 2,
    },
  });

  // Continuity
  await prisma.continuityNote.upsert({
    where: { id: "demo-cn-narrator-relaxed" },
    update: {
      title: "Showroom: narrator identity public in epilogue",
      description:
        "Continuity from early seed relaxed for demo — re-tighten narrator concealment for production novel if desired.",
      severity: "low",
      status: "resolved",
      linkedChapterId: DEMO.chapters.ch12,
    },
    create: {
      id: "demo-cn-narrator-relaxed",
      title: "Showroom: narrator identity public in epilogue",
      description:
        "Continuity from early seed relaxed for demo — re-tighten narrator concealment for production novel if desired.",
      severity: "low",
      status: "resolved",
      linkedChapterId: DEMO.chapters.ch12,
    },
  });

  // Narrative voice profile
  await prisma.narrativeVoiceProfile.upsert({
    where: { id: "demo-voiceprofile-lillian" },
    update: {
      name: "Lillian — corridor narrator",
      scopeType: "narrator",
      scopeId: IDS.narrator,
      voiceLabel: "Plain, ethical, occasionally second-person",
      sentenceRhythm: "Medium-long sentences; seam as refrain.",
      dictionStyle: "Southern-adjacent without caricature",
      sensoryBias: "Heat, paper, river, roux",
      notes: "Demo profile for voice passes.",
    },
    create: {
      id: "demo-voiceprofile-lillian",
      name: "Lillian — corridor narrator",
      scopeType: "narrator",
      scopeId: IDS.narrator,
      voiceLabel: "Plain, ethical, occasionally second-person",
      sentenceRhythm: "Medium-long sentences; seam as refrain.",
      dictionStyle: "Southern-adjacent without caricature",
      sensoryBias: "Heat, paper, river, roux",
      notes: "Demo profile for voice passes.",
    },
  });

  // Character memories
  for (const [pid, id, desc] of [
    [IDS.buford, "demo-cm-buford-arm", "The hunting story everyone tells — hybrid record."],
    [IDS.alexis, "demo-cm-alexis-letters", "Paper weight in saddlebag — names as obligation."],
    [IDS.narrator, "demo-cm-lillian-merge", "Rejected smoothed dialect assist — voice integrity."],
  ] as const) {
    await prisma.characterMemory.upsert({
      where: { id },
      update: { description: desc, reliability: "emotional", emotionalWeight: 4 },
      create: {
        id,
        personId: pid,
        description: desc,
        reliability: "emotional",
        emotionalWeight: 4,
      },
    });
  }

  console.log("seedFullDemo: populated demo novel + meta layer + DNA bindings.");
}
