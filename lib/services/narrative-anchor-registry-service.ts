import {
  NarrativeAnchorRegistrySchema,
  NarrativeAnchorSchema,
  type NarrativeAnchor,
  type NarrativeAnchorRegistry,
} from "@/lib/domain/epic-narrative-continuity";

function anchor(input: NarrativeAnchor): NarrativeAnchor {
  return NarrativeAnchorSchema.parse(input);
}

export class NarrativeAnchorRegistryService {
  buildCamptiRegistry(): NarrativeAnchorRegistry {
    const anchors = [
      anchor({
        anchorId: "anchor-river-witness",
        anchorName: "River as Witness",
        anchorFamily: "river_anchor",
        anchorType: "setting-symbol-hybrid",
        firstAppearance: {
          bookId: "book1",
          chapterId: "book1-chapter-01",
          sceneId: "book1-ch01-sc01",
          eraId: "era-1650",
        },
        recurrenceRules: ["Recur once per chapter cluster through direct or indirect observation."],
        mutationRules: ["May shift from livelihood route to legal/political boundary in later eras."],
        symbolBindings: ["symbol-riverline", "symbol-water-memory"],
        threadBindings: ["book1-red-river-route-setting", "book1-warning-under-routine"],
        settingBindings: ["red-river-corridor"],
        identityBindings: ["identity-place-keeper"],
        memoryBindings: ["memory-river-gesture"],
        emotionalBindings: ["awe", "fear", "duty"],
        temporalVariants: [
          {
            eraId: "era-1650",
            periodLabel: "Early contact period",
            transformedAppearance: "Embodied route, weather, and survival teacher.",
            transformedFunction: "Carries practical warning signals.",
            continuitySignal: "Shared river-reading gestures recur.",
          },
          {
            eraId: "era-1960",
            periodLabel: "Industrial/legal pressure period",
            transformedAppearance: "Contested boundary and witness to erasure.",
            transformedFunction: "Carries legal memory and historical wound.",
            continuitySignal: "Same phrases and route references return with altered stakes.",
          },
        ],
        laterRecognitionWindows: ["book1-chapter-04", "book3-chapter-02"],
        payoffWindows: ["book2-mid", "book3-late"],
        validationFlags: ["transformed-recurrence-allowed"],
      }),
      anchor({
        anchorId: "anchor-phrase-warning",
        anchorName: "Inherited Warning Phrase",
        anchorFamily: "phrase_image_anchor",
        anchorType: "spoken-line",
        firstAppearance: {
          bookId: "book1",
          chapterId: "book1-chapter-01",
          sceneId: "book1-ch01-sc02",
          eraId: "era-1650",
        },
        recurrenceRules: ["Recur with lexical mutation but stable warning intent."],
        mutationRules: ["Synonyms and grammar shifts required across eras; intent must remain legible."],
        symbolBindings: ["symbol-thin-water", "symbol-quiet-turn"],
        threadBindings: ["book1-continuity-survival"],
        settingBindings: ["household-edge", "route-fork"],
        identityBindings: ["identity-warning-carrier"],
        memoryBindings: ["memory-phrase-fragment"],
        emotionalBindings: ["foreboding", "care"],
        temporalVariants: [
          {
            eraId: "era-1650",
            periodLabel: "Early contact period",
            transformedAppearance: "Instruction embedded in ritual labor speech.",
            transformedFunction: "Immediate survival warning.",
            continuitySignal: "Specific image pair remains stable.",
          },
          {
            eraId: "era-1960",
            periodLabel: "Urban/displaced setting",
            transformedAppearance: "Family saying repeated as cautionary proverb.",
            transformedFunction: "Identity memory marker and reinterpretation trigger.",
            continuitySignal: "Readers recognize image cluster despite diction shift.",
          },
        ],
        laterRecognitionWindows: ["book1-chapter-06", "book3-chapter-01"],
        payoffWindows: ["book3-mid"],
        validationFlags: [],
      }),
      anchor({
        anchorId: "anchor-gesture-river-check",
        anchorName: "River-Check Gesture",
        anchorFamily: "gesture_ritual_anchor",
        anchorType: "body-ritual",
        firstAppearance: {
          bookId: "book1",
          chapterId: "book1-chapter-02",
          sceneId: "book1-ch02-sc01",
          eraId: "era-1650",
        },
        recurrenceRules: ["Gesture recurs in stress windows before irreversible decisions."],
        mutationRules: ["Can become symbolic object-touch gesture if river is absent."],
        symbolBindings: ["symbol-hand-waterline"],
        threadBindings: ["book1-warning-under-routine"],
        settingBindings: ["river-edge", "interior-doorway"],
        identityBindings: ["identity-ritual-memory"],
        memoryBindings: ["memory-scene-shape-river-check"],
        emotionalBindings: ["anticipation", "restraint"],
        temporalVariants: [
          {
            eraId: "era-1650",
            periodLabel: "River-adjacent life",
            transformedAppearance: "Palm to current before route choice.",
            transformedFunction: "Checks conditions and calms group fear.",
            continuitySignal: "Gesture timing in chapter transitions stays consistent.",
          },
          {
            eraId: "era-1960",
            periodLabel: "Displaced urban frame",
            transformedAppearance: "Palm to windowsill before difficult conversation.",
            transformedFunction: "Embodied memory of route-check ritual.",
            continuitySignal: "Same body rhythm appears at pressure moments.",
          },
        ],
        laterRecognitionWindows: ["book2-chapter-03", "book3-chapter-04"],
        payoffWindows: ["book3-late"],
        validationFlags: [],
      }),
      anchor({
        anchorId: "anchor-family-name-pattern",
        anchorName: "Family Naming Pattern",
        anchorFamily: "family_line_anchor",
        anchorType: "identity-marker",
        firstAppearance: {
          bookId: "book1",
          chapterId: "book1-chapter-03",
          sceneId: "book1-ch03-sc01",
          eraId: "era-1650",
        },
        recurrenceRules: ["Appears at generation transitions and contested identity scenes."],
        mutationRules: ["May split, shorten, or be hidden under imposed naming systems."],
        symbolBindings: ["symbol-name-fragment"],
        threadBindings: ["book1-lineage-memory"],
        settingBindings: ["household-ledger", "grave-marker"],
        identityBindings: ["identity-lineage-proof"],
        memoryBindings: ["memory-name-fragment"],
        emotionalBindings: ["pride", "grief"],
        temporalVariants: [
          {
            eraId: "era-1650",
            periodLabel: "Lineage continuity period",
            transformedAppearance: "Full names tied to kin and place.",
            transformedFunction: "Map of duty and relation.",
            continuitySignal: "Name components become future puzzle pieces.",
          },
          {
            eraId: "era-1960",
            periodLabel: "Record-fragment period",
            transformedAppearance: "Initials and broken records requiring reconstruction.",
            transformedFunction: "Recovered truth mechanism.",
            continuitySignal: "Repeated fragments unlock reinterpretation.",
          },
        ],
        laterRecognitionWindows: ["book2-chapter-06", "book3-chapter-05"],
        payoffWindows: ["book3-finale"],
        validationFlags: [],
      }),
    ];

    return NarrativeAnchorRegistrySchema.parse({
      artifact: "narrative_anchor_registry",
      schemaVersion: "1.0.0",
      epicId: "campti-epic",
      anchors,
      activeAnchorFamilies: [...new Set(anchors.map((row) => row.anchorFamily))],
      transformedRecurrenceRules: [
        "Anchor recurrence requires recognizable continuity signal, not identical surface form.",
        "Each era transformation must preserve one stable emotional or symbolic binding.",
      ],
      validationFlags: ["anchor-family-coverage-sufficient"],
    });
  }

  validateRecurrenceHealth(input: { registry: NarrativeAnchorRegistry; requiredEraIds: string[] }): {
    recurrenceHealth: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let covered = 0;
    for (const anchor of input.registry.anchors) {
      const eraSet = new Set(anchor.temporalVariants.map((row) => row.eraId));
      const hasCoverage = input.requiredEraIds.every((eraId) => eraSet.has(eraId));
      if (hasCoverage) covered += 1;
      else warnings.push(`Anchor ${anchor.anchorId} is missing one or more required era variants.`);
    }
    const recurrenceHealth = Number((covered / Math.max(1, input.registry.anchors.length)).toFixed(3));
    return { recurrenceHealth, warnings };
  }
}
