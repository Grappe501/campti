import {
  filterOutlineCharacterEntities,
  type Book1EpicOutline,
  type Book1OutlineEntity,
  type Book1OutlineKnowledgeNode,
  type Book1OutlinePsychProfile,
  type Book1OutlineTimelineEvent,
} from "@/lib/services/book1-epic-outline-builder";

export type Chapter1SceneComponent = {
  componentType: string;
  textContent: string;
  summary: string | null;
  functionInScene: string | null;
  canonStatus: string;
  confidenceType: string;
};

export type Chapter1DeepOutline = {
  chapter: number;
  timeline: Array<{
    segment: number;
    sceneFocus: string;
    setting: string;
    characters: string[];
    psychology: string;
    narrativePurpose: string;
    readerExperience: string;
    foreshadowing: string;
    historicalContext: string;
    transitionToNext: string;
  }>;
};

function pickLayer(components: Chapter1SceneComponent[], layer: string, fallback: string): string {
  const preferred = components.find((component) => component.componentType === layer && component.canonStatus === "CANON");
  const candidate = components.find((component) => component.componentType === layer);
  const text = preferred?.summary ?? preferred?.textContent ?? candidate?.summary ?? candidate?.textContent;
  return text ? text.replace(/\s+/g, " ").trim() : fallback;
}

function topLines(values: string[], max: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized)) continue;
    out.push(normalized);
    seen.add(normalized);
    if (out.length >= max) break;
  }
  return out;
}

function sanitizeHistoricalText(value: string): string {
  let text = value.replace(/https?:\/\/\S+/gi, " ");
  text = text.replace(/\[[^\]]+\]\([^)]+\)/g, " ");
  text = text.replace(/\[[^\]]+\]/g, " ");
  text = text.replace(/(^|\s)[*-]\s+/g, " ");
  text = text.replace(/[*_`>#]+/g, " ");
  text = text.replace(/^[\s:;,"'`-]+/, "");
  text = text.replace(/[\s:;,"'`-]+$/, "");
  text = text.replace(/\s{2,}/g, " ").trim();
  text = text.replace(/\.\.\.+$/g, ".");
  text = text.replace(/[;,:-]\s*$/g, "");
  if (!text) return "";
  const sentenceMatch = text.match(/(.{24,240}?[.!?])(?:\s|$)/);
  const clipped = sentenceMatch ? sentenceMatch[1] : text.slice(0, 220);
  return clipped.replace(/\s+/g, " ").trim();
}

function toHistoricalBrief(value: string): string {
  const cleaned = sanitizeHistoricalText(value);
  if (!cleaned) return "";
  if (/[.!?]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}

function summarizeHistory(nodes: Book1OutlineKnowledgeNode[], events: Book1OutlineTimelineEvent[]): string[] {
  const nodeLines = nodes.map((node) => toHistoricalBrief(node.summaryShort ?? node.summaryLong ?? node.canonicalStatement ?? node.title));
  const eventLines = events.map((event) => toHistoricalBrief(`${event.title}. ${event.description ?? ""}`));
  return topLines(
    nodeLines
      .concat(eventLines)
      .filter((line) => line.length >= 18)
      .map((line) => line.replace(/\s+/g, " ").trim()),
    6,
  );
}

function psychologicalFrame(characters: string[], profiles: Book1OutlinePsychProfile[]): string {
  const lines = characters.map((character) => {
    const profile = profiles.find((row) => row.name.toLowerCase() === character.toLowerCase());
    if (!profile) return `${character} navigates fear of erasure while protecting lineage duty.`;
    const enneagram = profile.enneagramType ? `Enneagram ${profile.enneagramType}` : "untyped";
    const fear = profile.coreFear ?? "loss of identity";
    const desire = profile.coreDesire ?? "continuity through kinship";
    return `${character}: ${enneagram}, fear=${fear}, desire=${desire}.`;
  });
  return topLines(lines, 3).join(" ");
}

export class Chapter1DeepOutlineGenerator {
  generate(input: {
    chapterNumber?: number;
    epicOutline: Book1EpicOutline;
    sceneComponents: Chapter1SceneComponent[];
    knowledgeNodes: Book1OutlineKnowledgeNode[];
    timelineEvents: Book1OutlineTimelineEvent[];
    entities: Book1OutlineEntity[];
    psychProfiles?: Book1OutlinePsychProfile[];
  }): Chapter1DeepOutline {
    const chapterNumber = input.chapterNumber ?? 1;
    const chapterPlan = input.epicOutline.phases[0]?.chapters.find((chapter) => chapter.chapter === chapterNumber);
    const eligibleCharacters = topLines(filterOutlineCharacterEntities(input.entities).map((entity) => entity.displayName), 6);
    const chapterCharacters =
      chapterPlan && "characters" in chapterPlan && chapterPlan.characters.length > 0
        ? chapterPlan.characters
        : eligibleCharacters.slice(0, 4);
    const cleanedCharacters = topLines(chapterCharacters, 2);
    const psych = psychologicalFrame(cleanedCharacters, input.psychProfiles ?? []);
    const historyLines = summarizeHistory(input.knowledgeNodes, input.timelineEvents);
    const setting = pickLayer(input.sceneComponents, "setting_layer", "River settlements define movement, risk, and belonging.");
    const environment = pickLayer(
      input.sceneComponents,
      "environmental_layer",
      "The environment enforces seasonal constraints and political vulnerability.",
    );
    const pov = pickLayer(input.sceneComponents, "primary_pov", "A focal consciousness tracks duty, fear, and inherited law.");
    const observer = pickLayer(
      input.sceneComponents,
      "observer_layer",
      "An observing thread reads micro-signals of status, danger, and alliance.",
    );
    const interpretation = pickLayer(
      input.sceneComponents,
      "interpretive_layer",
      "The narrative maps personal choices to system-level survival logic.",
    );

    const timeline = [
      {
        segment: 1,
        sceneFocus: "Opening terrain and community rhythm before external rupture.",
        setting,
        characters: cleanedCharacters,
        psychology: psych,
        narrativePurpose: "Anchor the reader in lived tribal order and stakes of continuity.",
        readerExperience: "Immersive calm with latent pressure.",
        foreshadowing: "Ritual detail hints at future legal and cultural contests over legitimacy.",
        historicalContext: historyLines[0] ?? "Before formal colonial expansion, river-centered settlements regulated kinship and seasonal labor through ritual authority.",
        transitionToNext: "A small anomaly in daily rhythm points toward incoming external systems.",
      },
      {
        segment: 2,
        sceneFocus: "Environmental forces tighten and redirect movement decisions.",
        setting,
        characters: cleanedCharacters,
        psychology: psych,
        narrativePurpose: "Show survival as a systems problem, not only an emotional one.",
        readerExperience: "Rising tension through practical constraints.",
        foreshadowing: "Ecological adaptation foreshadows later geopolitical adaptation under colonial pressure.",
        historicalContext: historyLines[1] ?? toHistoricalBrief(environment),
        transitionToNext: "A relational exchange reframes survival into social strategy.",
      },
      {
        segment: 3,
        sceneFocus: "POV carries lineage memory into present-time decisions.",
        setting,
        characters: cleanedCharacters,
        psychology: `${psych} ${pov}`,
        narrativePurpose: "Bind internal character arc to intergenerational duty.",
        readerExperience: "Intimate, ethically weighted interiority.",
        foreshadowing: "Choice architecture anticipates chapter-scale conflicts over identity and authority.",
        historicalContext: historyLines[2] ?? "Lineage records preserved rights, obligations, and memory long before written legal systems entered the region.",
        transitionToNext: "Observation from another angle challenges the POV certainty.",
      },
      {
        segment: 4,
        sceneFocus: "Observer lens captures status signals and hidden negotiations.",
        setting,
        characters: cleanedCharacters,
        psychology: observer,
        narrativePurpose: "Introduce multi-perspective tension without losing coherence.",
        readerExperience: "Suspense through social subtext and incomplete knowledge.",
        foreshadowing: "Observer intelligence seeds future mediation and council scenes.",
        historicalContext: historyLines[3] ?? "Trade contact slowly shifted local alliances, tying daily choices to broader political negotiation.",
        transitionToNext: "Interpretive frame expands local scene into civilizational stakes.",
      },
      {
        segment: 5,
        sceneFocus: "Interpretive turn links domestic action to structural history.",
        setting,
        characters: cleanedCharacters,
        psychology: interpretation,
        narrativePurpose: "Create continuity between personal moment and long-arc novel logic.",
        readerExperience: "Meaning crystallization and thematic lift.",
        foreshadowing: "Early signals of power/identity/faith/survival will recur at Civil War and modern convergence nodes.",
        historicalContext: historyLines[4] ?? "Oral continuity carried law and identity, but outside archives began reframing legitimacy in foreign terms.",
        transitionToNext: "A concrete vow closes the chapter while opening unresolved obligations.",
      },
      {
        segment: 6,
        sceneFocus: "Closing beat secures emotional hook and chapter handoff.",
        setting,
        characters: cleanedCharacters,
        psychology: psych,
        narrativePurpose: "End Chapter 1 with controlled uncertainty and forward momentum.",
        readerExperience: "Earned anticipation and emotional residue.",
        foreshadowing: "Vow and fracture motifs prefigure Scene 4 observer conflict and Scene 11 succession pressure.",
        historicalContext: historyLines[5] ?? "By the pre-Civil War era, long-standing social systems were strained by external leverage and internal succession pressure.",
        transitionToNext: `Chapter ${chapterNumber + 1} begins at the first visible fracture between inherited law and external leverage.`,
      },
    ];

    return {
      chapter: chapterNumber,
      timeline,
    };
  }
}
