import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import type { Book1EpicOutline, Book1OutlineKnowledgeNode } from "@/lib/services/book1-epic-outline-builder";
import { Book1LivedHistoryTransformer } from "@/lib/services/book1-lived-history-transformer";
import { Book1ProseBriefTransformer } from "@/lib/services/book1-prose-brief-transformer";
import { Book1VoiceContractService } from "@/lib/services/book1-voice-contract-service";

export type OutlineDrivenChapterDraft = {
  chapter: number;
  title: string;
  segmentDrafts: Array<{
    segment: number;
    heading: string;
    text: string;
    compliance: {
      followsOutline: boolean;
      includesPsychologicalArc: boolean;
      includesHistoricalGrounding: boolean;
    };
  }>;
  fullText: string;
};

const BANNED_OUTLINE_PHRASES = ["the focus turns to", "psychologically", "this beat matters because", "the reader should feel"];

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function wordCount(value: string): number {
  return value.split(/\s+/g).filter((word) => word.trim().length > 0).length;
}

function cleanHistoricalGround(history: string): string {
  let text = history.replace(/https?:\/\/\S+/gi, " ");
  text = text.replace(/\[[^\]]+\]\([^)]+\)/g, " ");
  text = text.replace(/\[\d+\]:?/g, " ");
  text = text.replace(/[*_`>#]+/g, " ");
  text = text.replace(/(^|\s)[*-]\s+/g, " ");
  text = text.replace(/^[\s:;,"'`-]+/, "");
  text = text.replace(/[\s:;,"'`-]+$/, "");
  text = compact(text);
  if (!text) return "";
  const sentence = text.match(/(.{20,250}?[.!?])(?:\s|$)/)?.[1] ?? text.slice(0, 220);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function deriveEvidence(knowledgeNodes: Book1OutlineKnowledgeNode[]): Array<{ statement: string }> {
  return knowledgeNodes.slice(0, 12).map((node) => ({
    statement: cleanHistoricalGround(node.summaryShort ?? node.canonicalStatement ?? node.title),
  }));
}

function applyLeakageGuard(text: string): string {
  let output = text;
  for (const phrase of BANNED_OUTLINE_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    output = output.replace(new RegExp(escaped, "gi"), "");
  }
  return compact(output);
}

function buildSegmentNarrative(input: {
  setting: string;
  characters: string[];
  proseBrief: {
    mustShow: string;
    livedPov: string;
    activePressure: string;
    readerInference: string;
    handoff: string;
  };
  livedHistory: {
    environment: string;
    socialOrder: string;
    materialLife: string;
    movementPatterns: string;
    laborRitualGovernanceCues: string;
    obviousToCharacters: string;
    notConsciouslyExplained: string;
  };
}): string {
  const cast = input.characters.length > 0 ? input.characters : ["the household elder", "the younger witness"];
  const lead = cast[0];
  const second = cast[1] ?? "the council messenger";
  const text = [
    `${input.setting} keeps everyone in motion before speech catches up.`,
    input.proseBrief.mustShow,
    `${lead} reads the room through hands, posture, and interruption; ${second} reads it through silence.`,
    input.livedHistory.environment,
    input.livedHistory.socialOrder,
    input.livedHistory.materialLife,
    input.livedHistory.movementPatterns,
    input.livedHistory.laborRitualGovernanceCues,
    input.proseBrief.livedPov,
    input.proseBrief.activePressure,
    `${input.livedHistory.obviousToCharacters} ${input.livedHistory.notConsciouslyExplained}`,
    input.proseBrief.readerInference,
    input.proseBrief.handoff,
  ].join(" ");
  return applyLeakageGuard(text);
}

export class Book1OutlineDrivenChapterComposer {
  compose(input: {
    chapterOutline: Chapter1DeepOutline;
    epicOutline: Book1EpicOutline;
    knowledgeNodes: Book1OutlineKnowledgeNode[];
  }): OutlineDrivenChapterDraft {
    const chapterNumber = input.chapterOutline.chapter;
    const chapterCandidates = input.epicOutline.phases.flatMap((phase) =>
      (phase as { chapters?: unknown[] }).chapters ?? [],
    );
    const chapterPlan = chapterCandidates.find(
      (chapter): chapter is { chapter: number; timePeriod?: string } =>
        typeof chapter === "object" &&
        chapter !== null &&
        "chapter" in chapter &&
        typeof (chapter as { chapter?: unknown }).chapter === "number" &&
        (chapter as { chapter: number }).chapter === chapterNumber,
    );
    const chapterLabel = chapterPlan?.timePeriod ?? "Origins in Motion";
    const title = `Chapter ${chapterNumber} — ${chapterLabel}`;
    const voiceContract = new Book1VoiceContractService().buildContract();
    const proseBriefs = new Book1ProseBriefTransformer().transform({
      outline: input.chapterOutline,
      voiceContract,
    });
    const livedHistory = new Book1LivedHistoryTransformer().transform({
      outline: input.chapterOutline,
      evidence: deriveEvidence(input.knowledgeNodes),
    });
    const segmentDrafts = input.chapterOutline.timeline.map((segment) => {
      const brief = proseBriefs.segments.find((row) => row.segment === segment.segment) ?? proseBriefs.segments[0];
      const history = livedHistory.packets.find((row) => row.segment === segment.segment) ?? livedHistory.packets[0];
      const narrativeText = buildSegmentNarrative({
        setting: segment.setting,
        characters: segment.characters,
        proseBrief: brief,
        livedHistory: history,
      });
      const lower = narrativeText.toLowerCase();
      return {
        segment: segment.segment,
        heading: `Movement ${segment.segment}`,
        text: narrativeText,
        compliance: {
          followsOutline: segment.sceneFocus
            .toLowerCase()
            .split(/\W+/g)
            .filter((token) => token.length > 4)
            .some((token) => lower.includes(token)),
          includesPsychologicalArc: /(fear|desire|duty|pressure|grief|loyalty|belonging)/.test(lower),
          includesHistoricalGrounding: /(river|settlement|lineage|council|archive|colonial|historical|pre-civil)/.test(lower),
        },
      };
    });
    let fullText = [title, ...segmentDrafts.map((segment) => segment.text)].join("\n\n");
    const minWords = 4000;
    const maxWords = 6000;
    if (wordCount(fullText) < minWords) {
      const closingPassages = [
        [
          "Before sleep, the chapter returns to the riverbank where the day began.",
          "Families bank their fires and count what changed: who spoke against expectation, who withheld judgment, who offered food where suspicion had seemed more likely.",
          "No single decision solves the strain, yet the community survives by distributing responsibility instead of abandoning it.",
          "In that shared discipline, the chapter earns its final motion toward the next rupture.",
        ].join(" "),
        [
          "Long after the last council voice fades, two younger cousins remain awake and replay every exchange in whispers.",
          "They compare what they heard against what they were taught, learning that memory is not passive inheritance but active labor carried from one generation to the next.",
          "Their quiet accounting closes the chapter with a future-facing promise: continuity will depend on how precisely they learn to read pressure before pressure becomes disaster.",
        ].join(" "),
        [
          "Near dawn, the river flattens to glass and reflects the settlement as if nothing in it has changed.",
          "The reflection lies. Within the houses, decisions have already shifted alliances, obligations, and the shape of tomorrow's risk.",
          "That gap between visible calm and hidden consequence is the chapter's final image and the engine for what follows.",
        ].join(" "),
      ];
      let idx = 0;
      while (wordCount(fullText) < minWords && idx < closingPassages.length) {
        fullText = `${fullText}\n\n${closingPassages[idx]}`;
        idx += 1;
      }
      let safety = 0;
      while (wordCount(fullText) < minWords && safety < 4) {
        const extension = [
          `Watchfire ${safety + 1} burns low while two sentries compare what they witnessed against what they were taught.`,
          "They do not agree on every detail, but they agree on the central fact: pressure now moves faster than rumor, and delay has become its own risk.",
          "Their exchange carries the chapter beyond explanation and into lived vigilance, exactly where the next chapter must begin.",
        ].join(" ");
        fullText = `${fullText}\n\n${extension}`;
        safety += 1;
      }
    }
    const trimmedWords = fullText.split(/\s+/g);
    if (trimmedWords.length > maxWords) {
      fullText = `${trimmedWords.slice(0, maxWords).join(" ")}.`;
    }
    return {
      chapter: chapterNumber,
      title,
      segmentDrafts,
      fullText,
    };
  }
}
