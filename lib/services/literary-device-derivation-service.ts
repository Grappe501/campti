import {
  Book1LiteraryDevicePackSchema,
  LiteraryDeviceApplicationPlanSchema,
  LiteraryDeviceControlSettingSchema,
  LiteraryDeviceDefinitionSchema,
  type Book1LiteraryDevicePack,
  type LiteraryDeviceApplicationPlan,
  type LiteraryDeviceControlSetting,
  type LiteraryDeviceDefinition,
} from "@/lib/domain/literary-device-control";

type DerivationInput = {
  chapterId: string;
  sceneId?: string;
  chapterPsychologyMode: string;
  chapterMode: string;
  psychologyAxes: {
    placeImmersion: number;
    unresolvedPull: number;
    signalIntegrity: number;
    relationalHeat: number;
    laborPressure: number;
  };
  activeThreadIds: string[];
  settingThreadIds: string[];
  philosophyThreadIds: string[];
  compositionMode: string;
  sceneRoles: string[];
  beatTypes: string[];
  controlSettings: LiteraryDeviceControlSetting[];
};

function densityRank(band: LiteraryDeviceControlSetting["densityBand"]): number {
  switch (band) {
    case "rare":
      return 1;
    case "occasional":
      return 2;
    case "patterned":
      return 3;
    case "motif_driven":
      return 4;
  }
}

function allDeviceIds(): string[] {
  return [
    "alliteration",
    "assonance",
    "consonance",
    "euphony_harshness_bias",
    "repetition",
    "rhythmic_parallelism",
    "cadence_shaping",
    "sentence_pressure_modulation",
    "symbolism",
    "motif",
    "metaphor",
    "simile",
    "analogy",
    "environmental_symbolism",
    "place_memory",
    "object_resonance",
    "foreshadowing",
    "callback_echo",
    "delayed_reveal",
    "parallel_scene_echo",
    "mirrored_structure",
    "fragmentation_withheld_context",
    "convergence_tease",
    "recall_phrase_image",
    "unreliable_perception_marker",
    "memory_distortion_marker",
    "internal_external_contrast",
    "interpretive_hesitation",
    "omission_as_tension",
    "selective_noticing_pattern",
    "continuity_echo",
    "warning_pattern",
    "route_echo",
    "setting_recurrence_echo",
    "philosophy_echo",
    "thread_resonance",
    "generational_repetition",
    "place_residue",
    "memory_layered_callback",
  ];
}

function createDefinition(deviceId: string, family: LiteraryDeviceDefinition["deviceFamily"]): LiteraryDeviceDefinition {
  return LiteraryDeviceDefinitionSchema.parse({
    deviceId,
    deviceName: deviceId.replaceAll("_", " "),
    deviceFamily: family,
    description: `${deviceId.replaceAll("_", " ")} controlled by narrative truth and context-safe constraints.`,
    allowedScopes: ["line", "paragraph", "scene", "chapter", "thread", "pov"],
    defaultActivationMode: deviceId === "alliteration" ? "subtle" : "moderate",
    defaultDensityBand: deviceId === "motif" || deviceId.includes("echo") ? "patterned" : "occasional",
    allowedContexts: ["environment", "action", "dialogue", "memory", "transition", "closure", "warning", "route_presence", "philosophy_echo"],
    forbiddenContexts: ["high_tension_decision"],
    compatiblePsychologyModes: ["rooted_continuity", "signal_disturbance", "relational_thickening", "interpretive_instability"],
    compatibleChapterModes: [
      "continuity_chapter",
      "signal_disturbance_chapter",
      "obligation_strain_chapter",
      "adaptation_chapter",
      "movement_chapter",
    ],
    compatibleThreadTypes: ["continuity_thread", "setting_thread", "route_thread", "philosophy_thread", "warning_thread", "memory_thread"],
    compatibleSceneRoles: ["grounding_scene", "warning_scene", "memory_echo_scene", "setting_presence_scene", "closure_scene"],
    compatibleBeatTypes: ["salience_lock_beat", "memory_comparison_beat", "social_signal_beat", "meaning_trace_beat", "consequence_seed_beat"],
    nativeCognitionRisk: deviceId === "alliteration" || deviceId === "assonance" || deviceId === "consonance" ? "high" : "moderate",
    symbolismBindingRequirement: deviceId.includes("symbol") || deviceId === "motif" ? "required" : "preferred",
    routeSettingBindingRequirement: deviceId.includes("route") || deviceId.includes("place") ? "required" : "preferred",
    philosophyBindingRequirement: deviceId === "philosophy_echo" ? "required" : "preferred",
    misuseRiskProfile: ["ornamental_drift", "tone_breakage", "native_cognition_break"],
    validationFlags: ["narrative_truth_downstream", "pov_visibility_bounded"],
  });
}

function createDefaultControls(): LiteraryDeviceControlSetting[] {
  return [
    {
      controlId: "ctl-alliteration-ch1",
      deviceId: "alliteration",
      targetScope: "scene",
      targetId: "book1-chapter-01",
      activationMode: "subtle",
      densityBand: "rare",
      explicitnessBand: "implicit",
      priorityLevel: "medium",
      allowedContextsOverride: ["environment", "ritual", "memory", "transition"],
      forbiddenContextsOverride: ["high_tension_decision", "dialogue"],
      targetCarrierModes: ["sound_pattern", "image"],
      driftTolerance: 0.22,
      symbolismBindings: [],
      motifBindings: [],
      threadBindings: ["book1-continuity-survival"],
      settingBindings: ["natchitoches"],
      objectBindings: ["reed_bundle", "knot_cord"],
      characterBindings: ["natchitoches-matriarch-keeper"],
      chapterBindings: ["book1-chapter-01"],
      sceneBindings: ["book1-ch01-sc01"],
      notes: ["Alliteration limited to grounded environmental lines."],
      validationFlags: ["no_forced_cluster"],
      alliterationPolicy: {
        allowedLineZones: ["descriptive_line", "ritual_line", "memory_line", "transition_line"],
        forbiddenLineZones: ["high_tension_decision_line", "critical_reveal_line", "rapid_command_line"],
        consonantClusteringTolerance: 0.32,
        descriptiveLineAllowance: true,
        ritualLineAllowance: true,
        memoryLineAllowance: true,
        transitionLineAllowance: true,
        highTensionDecisionLineAllowance: false,
        numericDensityInput: 31,
      },
    },
    ...["symbolism", "motif", "continuity_echo", "warning_pattern", "route_echo", "place_memory", "philosophy_echo", "callback_echo"].map(
      (deviceId, index) =>
        LiteraryDeviceControlSettingSchema.parse({
          controlId: `ctl-${deviceId}-ch1`,
          deviceId,
          targetScope: deviceId.includes("echo") ? "thread" : "chapter",
          targetId: "book1-chapter-01",
          activationMode: index < 2 ? "strong" : "moderate",
          densityBand: index < 2 ? "motif_driven" : "patterned",
          explicitnessBand: deviceId === "philosophy_echo" ? "low" : "implicit",
          priorityLevel: index < 2 ? "critical" : "high",
          allowedContextsOverride: ["environment", "action", "memory", "transition", "closure", "warning", "route_presence", "philosophy_echo"],
          forbiddenContextsOverride: ["high_tension_decision"],
          targetCarrierModes: ["object", "image", "place", "action", "relational_gesture", "repeated_phrase", "route_mention", "warning_sign"],
          driftTolerance: 0.35,
          symbolismBindings: ["sym-riverline", "sym-knot-cord"],
          motifBindings: ["motif-lineage-knot", "motif-water-warning"],
          threadBindings: ["book1-continuity-survival", "book1-red-river-route-setting", "book1-philosophy-reading-signs"],
          settingBindings: ["natchitoches", "red-river-edge"],
          objectBindings: ["knot_cord", "reed_bundle", "waterline_notch"],
          characterBindings: ["natchitoches-matriarch-keeper", "younger-kin-observer"],
          chapterBindings: ["book1-chapter-01"],
          sceneBindings: ["book1-ch01-sc01", "book1-ch01-sc02"],
          notes: [`${deviceId} stays bound to thread/setting/object carriers.`],
          validationFlags: ["bound_non_decorative"],
        }),
    ),
  ];
}

export class LiteraryDeviceDerivationService {
  buildDefinitions(): LiteraryDeviceDefinition[] {
    const sound = ["alliteration", "assonance", "consonance", "euphony_harshness_bias", "repetition", "rhythmic_parallelism", "cadence_shaping", "sentence_pressure_modulation"];
    const image = ["symbolism", "motif", "metaphor", "simile", "analogy", "environmental_symbolism", "place_memory", "object_resonance"];
    const structural = ["foreshadowing", "callback_echo", "delayed_reveal", "parallel_scene_echo", "mirrored_structure", "fragmentation_withheld_context", "convergence_tease", "recall_phrase_image"];
    const psych = ["unreliable_perception_marker", "memory_distortion_marker", "internal_external_contrast", "interpretive_hesitation", "omission_as_tension", "selective_noticing_pattern"];
    const campti = ["continuity_echo", "warning_pattern", "route_echo", "setting_recurrence_echo", "philosophy_echo", "thread_resonance", "generational_repetition", "place_residue", "memory_layered_callback"];
    return [
      ...sound.map((id) => createDefinition(id, "sound_rhythm")),
      ...image.map((id) => createDefinition(id, "image_meaning")),
      ...structural.map((id) => createDefinition(id, "structural")),
      ...psych.map((id) => createDefinition(id, "psychological")),
      ...campti.map((id) => createDefinition(id, "campti_custom")),
    ];
  }

  deriveApplicationPlan(input: DerivationInput): LiteraryDeviceApplicationPlan {
    const allowed = new Set(allDeviceIds());
    const suppressed = new Set<string>();
    const requiredBindings = new Set<string>();
    const contextMatrix: Record<string, LiteraryDeviceApplicationPlan["deviceContextMatrix"][string]> = {};
    const active: string[] = [];
    const densityWarnings: string[] = [];
    const misuseWarnings: string[] = [];

    if (input.psychologyAxes.placeImmersion >= 0.7 && input.settingThreadIds.length > 0) {
      active.push("environmental_symbolism", "place_memory", "route_echo");
    }
    if (input.psychologyAxes.unresolvedPull >= 0.7 && input.compositionMode.includes("convergence")) {
      active.push("foreshadowing", "callback_echo", "omission_as_tension", "convergence_tease");
    }
    if (input.psychologyAxes.signalIntegrity <= 0.45) {
      active.push("interpretive_hesitation", "selective_noticing_pattern");
      densityWarnings.push("Signal integrity is low; overt symbolism explicitness reduced.");
    }
    if (input.psychologyAxes.relationalHeat >= 0.65) {
      active.push("motif", "repetition", "omission_as_tension");
      suppressed.add("alliteration");
      suppressed.add("assonance");
      misuseWarnings.push("Relational heat high: suppress ornamental sound-pattern excess.");
    }
    if (input.philosophyThreadIds.length > 0) {
      active.push("philosophy_echo", "warning_pattern");
      requiredBindings.add("active philosophy thread binding required");
    }
    if (input.psychologyAxes.laborPressure >= 0.65) {
      suppressed.add("metaphor");
      active.push("cadence_shaping", "sentence_pressure_modulation");
    }
    if (input.chapterMode === "continuity_chapter") {
      active.push("continuity_echo", "place_residue", "route_echo", "generational_repetition");
    }
    if (input.beatTypes.includes("consequence_seed_beat")) {
      active.push("callback_echo", "recall_phrase_image");
    }

    const activeUnique = Array.from(new Set(active)).filter((id) => !suppressed.has(id));
    for (const control of input.controlSettings) {
      if (control.activationMode !== "off" && !suppressed.has(control.deviceId)) {
        activeUnique.push(control.deviceId);
      }
      contextMatrix[control.deviceId] = (control.allowedContextsOverride.length > 0
        ? control.allowedContextsOverride
        : ["environment", "action", "memory", "transition"]) as LiteraryDeviceApplicationPlan["deviceContextMatrix"][string];
    }

    const alliteration = input.controlSettings.find((control) => control.deviceId === "alliteration");
    if (alliteration && (alliteration.alliterationPolicy?.highTensionDecisionLineAllowance ?? false)) {
      misuseWarnings.push("Alliteration high-tension decision usage flagged; likely immersion break risk.");
    }
    if (input.controlSettings.filter((control) => densityRank(control.densityBand) >= 3).length >= 6) {
      densityWarnings.push("Device density cluster is high for chapter: reduce patterned/motif-driven controls.");
    }

    return LiteraryDeviceApplicationPlanSchema.parse({
      artifact: "literary_device_application_plan",
      schemaVersion: "1.0.0",
      applicationPlanId: `${input.chapterId}-literary-plan-${input.sceneId ?? "chapter"}`,
      chapterId: input.chapterId,
      sceneId: input.sceneId,
      paragraphTargets: [
        { paragraphId: "p1", paragraphRole: "grounded_opening", recommendedDeviceIds: ["environmental_symbolism", "place_memory"] },
        { paragraphId: "p2", paragraphRole: "signal_contrast", recommendedDeviceIds: ["warning_pattern", "interpretive_hesitation"] },
        { paragraphId: "p3", paragraphRole: "carry_forward_close", recommendedDeviceIds: ["callback_echo", "continuity_echo"] },
      ],
      activeDeviceIds: Array.from(new Set(activeUnique)),
      allowedDeviceSet: Array.from(allowed).filter((id) => !suppressed.has(id)),
      suppressedDeviceSet: Array.from(suppressed),
      requiredBindingSet: Array.from(requiredBindings),
      deviceContextMatrix: contextMatrix,
      recommendedPlacementZones: ["descriptive line", "memory line", "transition line", "closure hinge sentence"],
      restrictedPlacementZones: ["high-tension decision line", "critical reveal line", "rapid command sequence"],
      densityWarnings,
      misuseWarnings,
      validationFlags: ["narrative_truth_downstream", "pov_visibility_guarded", "native_cognition_guarded"],
    });
  }

  buildBook1SamplePack(input: {
    chapterId: string;
    sceneId: string;
    sceneRoles: string[];
    beatTypes: string[];
    chapterPsychologyMode: string;
    chapterMode: string;
  }): Book1LiteraryDevicePack {
    const definitions = this.buildDefinitions();
    const controlSettings = createDefaultControls();
    const scenePlan = this.deriveApplicationPlan({
      chapterId: input.chapterId,
      sceneId: input.sceneId,
      chapterPsychologyMode: input.chapterPsychologyMode,
      chapterMode: input.chapterMode,
      psychologyAxes: {
        placeImmersion: 0.82,
        unresolvedPull: 0.74,
        signalIntegrity: 0.43,
        relationalHeat: 0.61,
        laborPressure: 0.68,
      },
      activeThreadIds: ["book1-continuity-survival", "book1-red-river-route-setting", "book1-philosophy-reading-signs"],
      settingThreadIds: ["book1-red-river-route-setting"],
      philosophyThreadIds: ["book1-philosophy-reading-signs"],
      compositionMode: "delayed_convergence",
      sceneRoles: input.sceneRoles,
      beatTypes: input.beatTypes,
      controlSettings,
    });
    return Book1LiteraryDevicePackSchema.parse({
      artifact: "book1_literary_device_pack",
      schemaVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      definitions,
      controlSettings,
      symbolRegistry: [
        {
          symbolId: "sym-riverline",
          symbolName: "Riverline Height",
          meaningIntent: "Rising continuity threat and migration pressure.",
          carriers: ["place", "weather", "material", "route_mention"],
          threadBindings: ["book1-red-river-route-setting", "book1-continuity-survival"],
          settingBindings: ["red-river-edge", "natchitoches"],
          objectBindings: ["waterline_notch"],
          characterBindings: ["natchitoches-matriarch-keeper"],
          recurrenceTarget: "patterned",
          explicitnessCeiling: "low",
          payoffWindow: "chapter_04_to_05",
          callbackWindow: "chapter_02_opening",
          notes: ["Use environmental shifts before declarative meaning."],
        },
        {
          symbolId: "sym-knot-cord",
          symbolName: "Lineage Knot Cord",
          meaningIntent: "Continuity through embodied duty transfer.",
          carriers: ["object", "relational_gesture", "memory_fragment"],
          threadBindings: ["book1-continuity-survival", "book1-philosophy-reading-signs"],
          settingBindings: ["natchitoches"],
          objectBindings: ["knot_cord"],
          characterBindings: ["natchitoches-matriarch-keeper", "younger-kin-observer"],
          recurrenceTarget: "motif_driven",
          explicitnessCeiling: "implicit",
          payoffWindow: "book1_chapter_07",
          callbackWindow: "chapter_03_memory_turn",
          notes: ["Callback must preserve non-preachy action-first delivery."],
        },
        {
          symbolId: "sym-reed-cold",
          symbolName: "Cold Reed Skin",
          meaningIntent: "Warning pattern for subtle system disturbance.",
          carriers: ["material", "image", "warning_sign"],
          threadBindings: ["book1-warning-under-routine", "book1-red-river-route-setting"],
          settingBindings: ["river-yard", "red-river-edge"],
          objectBindings: ["reed_bundle"],
          characterBindings: ["natchitoches-matriarch-keeper"],
          recurrenceTarget: "occasional",
          explicitnessCeiling: "implicit",
          payoffWindow: "chapter_02_midpoint",
          callbackWindow: "chapter_01_close",
          notes: ["No decorative over-usage in neutral lines."],
        },
      ],
      motifRegistry: [
        {
          motifId: "motif-lineage-knot",
          motifName: "Lineage by work gesture",
          boundThreadIds: ["book1-continuity-survival"],
          chapterBindings: ["book1-chapter-01", "book1-chapter-03", "book1-chapter-07"],
          recurrenceTarget: "motif_driven",
        },
        {
          motifId: "motif-water-warning",
          motifName: "Waterline warning residue",
          boundThreadIds: ["book1-red-river-route-setting", "book1-warning-under-routine"],
          chapterBindings: ["book1-chapter-01", "book1-chapter-02", "book1-chapter-04"],
          recurrenceTarget: "patterned",
        },
      ],
      chapterProfiles: [
        {
          chapterId: input.chapterId,
          activationProfile: ["continuity_echo:strong", "warning_pattern:moderate", "alliteration:subtle", "philosophy_echo:moderate"],
          explicitnessCeiling: "low",
          dominantCarrierModes: ["place", "object", "action", "warning_sign", "repeated_phrase"],
          notes: ["Keep philosophy propagation indirect via action, contrast, consequence, and memory."],
        },
      ],
      scenePlans: [scenePlan],
      validationExamples: {
        acceptableUse: {
          artifact: "literary_device_validation_result",
          passesHardValidation: true,
          hardFailures: [],
          softWarnings: [{ severity: "soft", category: "density_watch", message: "Patterned callbacks are near upper bound.", suggestedAction: "Keep next scene callback density stable." }],
          suggestedSuppressionActions: ["Maintain alliteration in rare band only."],
          driftDiagnostics: ["No decorative symbolism without binding detected."],
          validationFlags: ["sample_acceptable"],
        },
        overloadUse: {
          artifact: "literary_device_validation_result",
          passesHardValidation: false,
          hardFailures: [
            { severity: "hard", category: "forced_alliteration", message: "Alliteration clustered in high-tension decision lines.", suggestedAction: "Suppress alliteration in decision zones." },
          ],
          softWarnings: [
            { severity: "soft", category: "motif_overload", message: "Too many motif-driven devices in single paragraph.", suggestedAction: "Drop one motif carrier from scene close." },
          ],
          suggestedSuppressionActions: ["Reduce sound-pattern devices to rare.", "Convert explicit symbolism to implicit environment carrier."],
          driftDiagnostics: ["Immersion at risk due to ornamental rhythm overload."],
          validationFlags: ["sample_overload"],
        },
      },
    });
  }
}
