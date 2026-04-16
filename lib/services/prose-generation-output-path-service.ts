import type { BeatAssemblyChain } from "@/lib/domain/beat-assembly";
import type { ChapterNarrativePsychology } from "@/lib/domain/narrative-psychology";
import {
  Chapter1ProseGenerationPacketSchema,
  ProseGenerationOutputPathReportSchema,
  type Chapter1ProseGenerationPacket,
  type ProseGenerationConstraints,
  type ProseGenerationOutputPathReport,
} from "@/lib/domain/prose-generation-constraints";
import type { ChapterState } from "@/lib/domain/chapter-state";
import { ProseGenerationValidationService } from "@/lib/services/prose-generation-validation-service";

function openingParagraphs(input: {
  chapterPsychology: ChapterNarrativePsychology;
  chapterState: ChapterState;
  beatChain: BeatAssemblyChain;
}): string[] {
  const pov = input.chapterState.povWeightingCandidates[0]?.characterId ?? "the keeper";
  const firstBeat = input.beatChain.beats[0];
  const secondBeat = input.beatChain.beats[1];
  const thirdBeat = input.beatChain.beats[2];

  return [
    `${pov} set both hands on the damp bundle before speaking, feeling the reed skin hold more cold than it had yesterday. ` +
      `The yard stayed in work order, but the river sound carried heavier through the posts, and she kept her eyes on the knots until the pattern in her fingers settled.`,
    `At the grain lid she pressed a thumb to the clay seam and lifted just enough to take the smell. ` +
      `${secondBeat?.environmentalSignal ?? "Moisture had moved where it should not"}; no one named it, yet two girls changed pace and waited for her wrist to decide the next lift.`,
    `She touched the tally notch by the hearth and remembered the old instruction without repeating it aloud: compare first, move second, explain last. ` +
      `${thirdBeat?.stateUpdate ?? "The chapter did not resolve the pressure."} She shifted one load inland and left one route open, because the morning was still not done with them.`,
  ];
}

export class ProseGenerationOutputPathService {
  private readonly validator = new ProseGenerationValidationService();

  buildChapter1Packet(input: {
    chapterPsychology: ChapterNarrativePsychology;
    chapterState: ChapterState;
    beatChain: BeatAssemblyChain;
    proseConstraints: ProseGenerationConstraints;
  }): Chapter1ProseGenerationPacket {
    return Chapter1ProseGenerationPacketSchema.parse({
      artifact: "book1_chapter1_prose_generation_packet",
      chapterId: input.chapterPsychology.chapterId,
      chapterPsychologyTarget: input.chapterPsychology,
      chapterStateSummary: {
        chapterId: input.chapterState.chapterId,
        chapterMode: input.chapterState.chapterMode,
        dominantPressures: input.chapterState.dominantPressures,
        summary: input.chapterState.chapterStateSummary,
      },
      beatChainSummary: {
        artifact: input.beatChain.artifact,
        beatCount: input.beatChain.beats.length,
        orderedBeatTypes: input.beatChain.beats.map((beat) => beat.beatType),
      },
      proseConstraints: input.proseConstraints,
      paragraphRecommendations: [
        "Paragraph 1: grounded salience through labor and touch before interpretation.",
        "Paragraph 2: environmental confirmation with social cue routing.",
        "Paragraph 3: memory comparison plus unresolved operational adjustment.",
      ],
      validationExpectations: [
        "No modern cognition labels.",
        "No omniscient leakage.",
        "Place-immersion density must remain high.",
        "Ending must retain unresolved meaningful pressure.",
      ],
      openingEndingVectorRecommendation: "Close opening segment on consequence-seeded adjustment, not declarative explanation.",
    });
  }

  runConstrainedOutputPath(input: {
    chapterPsychology: ChapterNarrativePsychology;
    chapterState: ChapterState;
    beatChain: BeatAssemblyChain;
    proseConstraints: ProseGenerationConstraints;
  }): ProseGenerationOutputPathReport {
    const generatedParagraphs = openingParagraphs(input);
    const validation = this.validator.validate({
      constraints: input.proseConstraints,
      beatChain: input.beatChain,
      proseBySegment: generatedParagraphs,
    });

    return ProseGenerationOutputPathReportSchema.parse({
      artifact: "prose_generation_output_path_report",
      chapterId: input.chapterPsychology.chapterId,
      appliedConstraints: [
        `narrativeDistance=${input.proseConstraints.narrativeDistance}`,
        `sensoryDensity=${input.proseConstraints.sensoryDensityProfile.requiredDensity}`,
        `expositionAllowance=${input.proseConstraints.expositionAllowance}`,
        `ambiguityAllowance=${input.proseConstraints.ambiguityAllowance}`,
        `endingVector=${input.proseConstraints.endingMomentumProfile.vector}`,
      ],
      generatedParagraphs,
      validation,
      hardeningNext: [
        "Increase lexical detector coverage for historical integrity drift.",
        "Add beat-by-beat line alignment scoring beyond keyword matching.",
        "Wire validator to scene-generation output for all regenerated segments.",
      ],
    });
  }
}
