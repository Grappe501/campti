import {
  type ChapterComposition,
  ChapterCompositionSchema,
  type DelayedConvergenceEvent,
  type NarrativeThread,
  type NarrativeThreadInspection,
  NarrativeThreadInspectionSchema,
  type NarrativeThreadPack,
  NarrativeThreadPackSchema,
  type PovReinterpretation,
  type SceneThreadBinding,
} from "@/lib/domain/narrative-thread";

function nowIso(): string {
  return new Date().toISOString();
}

function density(scene: SceneThreadBinding): number {
  const active = scene.activeThreadIds.length;
  const latent = scene.latentThreadIds.length;
  const callback = scene.callbackThreadIds.length;
  return Math.min(1, Number(((active * 0.55 + latent * 0.25 + callback * 0.2) / 6).toFixed(3)));
}

export class NarrativeThreadDerivationService {
  deriveInspection(input: {
    chapterId: string;
    threads: NarrativeThread[];
    chapterComposition: ChapterComposition;
    reinterpretations?: PovReinterpretation[];
    delayedConvergenceEvents?: DelayedConvergenceEvent[];
  }): NarrativeThreadInspection {
    const activeThreadIds = input.threads.filter((thread) => thread.currentStatus === "active").map((thread) => thread.threadId);
    const latentThreadIds = input.threads.filter((thread) => thread.currentStatus === "latent").map((thread) => thread.threadId);
    const unresolvedThreadCount = input.threads.filter((thread) => thread.currentStatus !== "resolved").length;
    const resolvedThreadCount = input.threads.filter((thread) => thread.currentStatus === "resolved").length;
    const callbackMarkers = input.threads
      .flatMap((thread) => thread.nodes)
      .map((node) => node.callbackMarker)
      .filter((marker): marker is string => Boolean(marker));
    const delayedConvergenceMarkers = input.delayedConvergenceEvents?.map((event) => event.hiddenConvergenceKey) ?? [];
    const reinterpretationCandidates =
      input.reinterpretations?.map((reinterpretation) => reinterpretation.reinterpretationId) ??
      input.threads
        .filter((thread) => thread.reinterpretationPotential >= 0.45)
        .map((thread) => thread.threadId);
    const philosophyThreadIds = input.threads
      .filter((thread) => thread.threadType === "philosophy_thread" || thread.threadType === "belief_worldview_thread")
      .map((thread) => thread.threadId);
    const sceneDensity = input.chapterComposition.sceneSequence.map((scene) => ({
      sceneId: scene.sceneId,
      activeThreadCount: scene.activeThreadIds.length,
      latentThreadCount: scene.latentThreadIds.length,
      densityScore: density(scene),
    }));
    const warnings: string[] = [];
    const averageDensity = sceneDensity.reduce((acc, row) => acc + row.densityScore, 0) / Math.max(sceneDensity.length, 1);
    if (averageDensity < 0.35) warnings.push("Chapter thread density is low; add callback echo or latent carry-forward.");
    if (input.chapterComposition.sceneSequence.some((scene) => scene.activeThreadIds.length === 0)) {
      warnings.push("At least one scene has no active threads and risks narrative isolation.");
    }
    if (input.chapterComposition.convergingThreads.length === 0) {
      warnings.push("No converging threads set; delayed convergence architecture may be underused.");
    }

    return NarrativeThreadInspectionSchema.parse({
      artifact: "narrative_thread_inspection",
      chapterId: input.chapterId,
      activeThreadIds,
      latentThreadIds,
      callbackMarkers: Array.from(new Set(callbackMarkers)),
      delayedConvergenceMarkers: Array.from(new Set(delayedConvergenceMarkers)),
      reinterpretationCandidates,
      philosophyThreadIds,
      unresolvedThreadCount,
      resolvedThreadCount,
      sceneDensity,
      warnings,
    });
  }

  buildBook1SampleThreadPack(): NarrativeThreadPack {
    const generatedAt = nowIso();
    const threads: NarrativeThread[] = [
      {
        artifact: "narrative_thread",
        schemaVersion: "1.0.0",
        threadId: "book1-continuity-survival",
        threadName: "Continuity through survival labor",
        threadType: "primary_plot_thread",
        scaleLevel: "book_scale",
        originScope: "chapter",
        originBookId: "book1",
        originChapterId: "book1-chapter-01",
        originSceneId: "book1-ch01-sc01",
        currentStatus: "active",
        currentVisibility: "reader_visible",
        currentTensionLevel: 0.74,
        currentMeaningLoad: 0.78,
        continuityRole: "convergence_spine",
        activeCarriers: ["natchitoches-matriarch-keeper", "younger-kin-observer"],
        hiddenFrom: ["river-trader-outsider"],
        knownBy: ["natchitoches-matriarch-keeper", "river-household-core"],
        locationBindings: [{ id: "natchitoches", label: "Natchitoches", weight: 0.9 }],
        philosophyBindings: [{ id: "land-teaches", label: "Land teaches through pattern", weight: 0.8 }],
        relationshipBindings: [{ id: "matriarch-line", label: "Matriarch line continuity", weight: 0.85 }],
        callbackPotential: 0.88,
        reinterpretationPotential: 0.66,
        convergencePotential: 0.92,
        divergencePotential: 0.28,
        activationConditions: ["movement_pressure > 45", "signal_integrity < 60"],
        suppressionConditions: ["external_stability_rebound"],
        escalationRules: [
          {
            id: "continuity-escalation-01",
            description: "When route stress rises, continuity labor must become visible.",
            condition: "route_thread.currentTensionLevel > 0.6",
            effect: "raise currentMeaningLoad by 0.08",
            priority: "high",
          },
        ],
        callbackRules: [
          {
            id: "continuity-callback-01",
            description: "Early storage gesture returns during trade interruption.",
            condition: "trade_contact_thread transitions to active",
            effect: "emit callback node with memory trace amplification",
            priority: "critical",
          },
        ],
        reentryRules: [
          {
            id: "continuity-reentry-01",
            description: "Re-enter via household report if scene path changes.",
            condition: "chapter gap >= 2",
            effect: "reentry through report appearance mode",
            priority: "medium",
          },
        ],
        resolutionRules: [
          {
            id: "continuity-resolution-01",
            description: "Resolve only after survivability and identity both stabilize.",
            condition: "identity_stability > 70 && food_security > 70",
            effect: "transition to transformed",
            priority: "high",
          },
        ],
        handoffRules: [
          {
            id: "continuity-handoff-01",
            description: "Carry the thread into Book 2 as memory authority.",
            condition: "book1 final chapter reached",
            effect: "set scaleLevel to cross_book_scale",
            priority: "high",
          },
        ],
        memoryTraceStrength: 0.87,
        payoffDelayProfile: { earliestChapterOffset: 2, expectedWindow: "mid_book", canCrossBook: true },
        validationFlags: [],
        nodes: [
          {
            threadNodeId: "thread-node-continuity-seed-01",
            parentThreadId: "book1-continuity-survival",
            chapterId: "book1-chapter-01",
            sceneId: "book1-ch01-sc01",
            nodeType: "seed",
            nodeFunction: "Seed survival continuity through work choreography.",
            visibleToPov: ["natchitoches-matriarch-keeper"],
            visibleToReader: "reader_visible",
            interpretiveClarity: 0.7,
            callbackMarker: "storage-knot-gesture",
            futureLinkHints: ["Gesture repeats when route pressure intensifies."],
            hiddenConvergenceKey: "red-river-logistics-pattern-01",
            delayedConvergenceBinding: ["route-pressure-cluster-a"],
            tensionShift: 0.18,
            meaningShift: 0.2,
            stateShift: { from: "seeded", to: "active" },
            locationAnchor: "natchitoches",
            characterAnchor: ["natchitoches-matriarch-keeper"],
            beatBindings: ["salience_lock_beat", "meaning_trace_beat"],
            laterReentryTargets: [
              {
                chapterId: "book1-chapter-03",
                sceneId: "book1-ch03-sc02",
                rationale: "Return as callback when route interruption appears as rumor.",
              },
            ],
          },
        ],
        provenance: {
          sourceBasis: ["book1_chapter_outline", "chapter_state_model", "narrative_psychology_architecture"],
          generatedBy: "narrative_thread_derivation_service",
          generatedAt,
        },
      },
      {
        artifact: "narrative_thread",
        schemaVersion: "1.0.0",
        threadId: "book1-red-river-route-setting",
        threadName: "Red River route as living continuity",
        threadType: "route_thread",
        scaleLevel: "cross_book_scale",
        originScope: "chapter",
        originBookId: "book1",
        originChapterId: "book1-chapter-01",
        originSceneId: "book1-ch01-sc01",
        currentStatus: "active",
        currentVisibility: "reader_partial",
        currentTensionLevel: 0.63,
        currentMeaningLoad: 0.73,
        continuityRole: "carrier",
        activeCarriers: ["river-messenger", "trade-contact-keeper"],
        hiddenFrom: ["young-runner"],
        knownBy: ["matriarch-council", "trade-contact-keeper"],
        locationBindings: [
          { id: "natchitoches", label: "Natchitoches", weight: 0.82 },
          { id: "alexandria-portage", label: "Alexandria Portage", weight: 0.71 },
          { id: "atchafalaya-fork", label: "Atchafalaya Fork", weight: 0.68 },
          { id: "lower-river-market", label: "Lower River Market", weight: 0.59 },
        ],
        philosophyBindings: [{ id: "movement-without-surrender", label: "Movement without surrender", weight: 0.77 }],
        relationshipBindings: [{ id: "trade-kin-bridge", label: "Trade and kin bridge", weight: 0.74 }],
        callbackPotential: 0.79,
        reinterpretationPotential: 0.61,
        convergencePotential: 0.88,
        divergencePotential: 0.34,
        activationConditions: ["movement_pressure > 35", "external_awareness > 45"],
        suppressionConditions: ["winter_lockdown_phase"],
        escalationRules: [
          {
            id: "route-escalation-01",
            description: "Escalate route thread when disruptions occur at both ends.",
            condition: "two locationBindings receive warning markers",
            effect: "currentTensionLevel += 0.12",
            priority: "critical",
          },
        ],
        callbackRules: [],
        reentryRules: [],
        resolutionRules: [],
        handoffRules: [],
        memoryTraceStrength: 0.72,
        payoffDelayProfile: { earliestChapterOffset: 1, expectedWindow: "book_end", canCrossBook: true },
        validationFlags: [],
        nodes: [
          {
            threadNodeId: "thread-node-route-rumor-01",
            parentThreadId: "book1-red-river-route-setting",
            chapterId: "book1-chapter-01",
            sceneId: "book1-ch01-sc03",
            nodeType: "advance",
            nodeFunction: "Apparent disconnected rumor about distant trade contact.",
            visibleToPov: ["household-runner"],
            visibleToReader: "reader_partial",
            interpretiveClarity: 0.32,
            callbackMarker: "double-harbor-rumor",
            futureLinkHints: ["Later revealed as same disturbance seen upriver."],
            hiddenConvergenceKey: "route-pressure-cluster-a",
            delayedConvergenceBinding: ["route-pressure-cluster-a"],
            tensionShift: 0.14,
            meaningShift: 0.08,
            stateShift: { from: "active", to: "latent" },
            locationAnchor: "lower-river-market",
            characterAnchor: ["household-runner"],
            beatBindings: ["social_signal_beat", "consequence_seed_beat"],
            laterReentryTargets: [
              {
                chapterId: "book1-chapter-04",
                sceneId: "book1-ch04-sc01",
                rationale: "Re-entry as confirmed arrival report from same contact chain.",
              },
            ],
          },
        ],
        provenance: {
          sourceBasis: ["red_river_trade_route_plan", "book1_outline"],
          generatedBy: "narrative_thread_derivation_service",
          generatedAt,
        },
      },
      {
        artifact: "narrative_thread",
        schemaVersion: "1.0.0",
        threadId: "book1-philosophy-reading-signs",
        threadName: "Reading signs correctly before naming danger",
        threadType: "philosophy_thread",
        scaleLevel: "epic_scale",
        originScope: "scene",
        originBookId: "book1",
        originChapterId: "book1-chapter-01",
        originSceneId: "book1-ch01-sc02",
        currentStatus: "latent",
        currentVisibility: "offstage_inferred",
        currentTensionLevel: 0.41,
        currentMeaningLoad: 0.81,
        continuityRole: "bridge",
        activeCarriers: ["elder-memory-holder", "younger-kin-observer"],
        hiddenFrom: ["external-trader"],
        knownBy: ["elder-memory-holder"],
        locationBindings: [{ id: "natchitoches", label: "Natchitoches", weight: 0.66 }],
        philosophyBindings: [
          { id: "reading-signs", label: "Reading signs correctly", weight: 0.94 },
          { id: "memory-as-authority", label: "Memory as authority", weight: 0.87 },
        ],
        relationshipBindings: [{ id: "elder-younger-transfer", label: "Elder to younger transfer", weight: 0.82 }],
        callbackPotential: 0.84,
        reinterpretationPotential: 0.9,
        convergencePotential: 0.6,
        divergencePotential: 0.22,
        activationConditions: ["signal_integrity < 55", "memory_continuity > 70"],
        suppressionConditions: ["direct_expository_dialogue_detected"],
        escalationRules: [],
        callbackRules: [],
        reentryRules: [],
        resolutionRules: [],
        handoffRules: [],
        memoryTraceStrength: 0.91,
        payoffDelayProfile: { earliestChapterOffset: 3, expectedWindow: "next_book", canCrossBook: true },
        validationFlags: [],
        nodes: [
          {
            threadNodeId: "thread-node-philosophy-gesture-01",
            parentThreadId: "book1-philosophy-reading-signs",
            chapterId: "book1-chapter-01",
            sceneId: "book1-ch01-sc02",
            nodeType: "seed",
            nodeFunction: "Teach warning-reading through action, not statement.",
            visibleToPov: ["younger-kin-observer"],
            visibleToReader: "reader_partial",
            interpretiveClarity: 0.28,
            callbackMarker: "unspoken-warning-gesture",
            futureLinkHints: ["Gesture interpreted differently in later POV chapter."],
            hiddenConvergenceKey: "warning-pattern-gesture-01",
            delayedConvergenceBinding: ["warning-pattern-gesture-01"],
            tensionShift: 0.05,
            meaningShift: 0.21,
            stateShift: { from: "seeded", to: "latent" },
            locationAnchor: "natchitoches",
            characterAnchor: ["elder-memory-holder", "younger-kin-observer"],
            beatBindings: ["memory_comparison_beat", "meaning_trace_beat"],
            laterReentryTargets: [
              {
                chapterId: "book1-chapter-05",
                sceneId: "book1-ch05-sc02",
                rationale: "POV reinterpretation reveals hidden warning content.",
              },
            ],
          },
        ],
        provenance: {
          sourceBasis: ["narrative_psychology_architecture", "book1_chapter_outline"],
          generatedBy: "narrative_thread_derivation_service",
          generatedAt,
        },
      },
    ];

    const chapterCompositions: ChapterComposition[] = [
      ChapterCompositionSchema.parse({
        artifact: "chapter_composition",
        chapterId: "book1-chapter-01",
        chapterStateId: "book1-chapter-01",
        sceneSequence: [
          {
            sceneId: "book1-ch01-sc01",
            sceneLabel: "Household workline calibration",
            locationId: "natchitoches",
            activeThreadIds: ["book1-continuity-survival"],
            latentThreadIds: ["book1-philosophy-reading-signs"],
            callbackThreadIds: [],
            distortedThreadIds: [],
            seededThreadIds: ["book1-continuity-survival"],
            echoNodeIds: [],
            hiddenConvergenceKeys: ["red-river-logistics-pattern-01"],
            delayedConvergenceBindings: ["route-pressure-cluster-a"],
            transitionToNextScene: "Shift from embodied labor to social relay.",
          },
          {
            sceneId: "book1-ch01-sc02",
            sceneLabel: "Elder warning lesson in passing",
            locationId: "natchitoches",
            activeThreadIds: ["book1-philosophy-reading-signs"],
            latentThreadIds: ["book1-continuity-survival"],
            callbackThreadIds: ["book1-philosophy-reading-signs"],
            distortedThreadIds: [],
            seededThreadIds: ["book1-philosophy-reading-signs"],
            echoNodeIds: ["thread-node-continuity-seed-01"],
            hiddenConvergenceKeys: ["warning-pattern-gesture-01"],
            delayedConvergenceBindings: ["warning-pattern-gesture-01"],
            transitionToNextScene: "Cut to rumor lane that appears disconnected.",
          },
          {
            sceneId: "book1-ch01-sc03",
            sceneLabel: "River rumor arrival",
            locationId: "lower-river-market",
            activeThreadIds: ["book1-red-river-route-setting"],
            latentThreadIds: ["book1-continuity-survival", "book1-philosophy-reading-signs"],
            callbackThreadIds: ["book1-continuity-survival"],
            distortedThreadIds: ["book1-red-river-route-setting"],
            seededThreadIds: [],
            echoNodeIds: ["thread-node-philosophy-gesture-01"],
            hiddenConvergenceKeys: ["route-pressure-cluster-a"],
            delayedConvergenceBindings: ["route-pressure-cluster-a"],
            transitionToNextScene: "Converges later when rumor is linked to household pressure pattern.",
          },
        ],
        dominantThreads: ["book1-continuity-survival", "book1-red-river-route-setting"],
        latentThreads: ["book1-philosophy-reading-signs"],
        callbackThreads: ["book1-continuity-survival", "book1-philosophy-reading-signs"],
        convergingThreads: ["book1-red-river-route-setting", "book1-continuity-survival"],
        sceneTransitions: [
          "Embodied routine -> interpretive teaching -> rumor disruption",
          "False separation in scene 3 resolves through route-pressure key",
        ],
        sceneContrastLogic: [
          "Scene 1 grounded labor, Scene 2 philosophical transmission, Scene 3 network rumor.",
          "Different thread clusters keep chapter from reading as a single-scene container.",
        ],
        chapterClosureProfile: "Ends with unresolved route signal and continuity tension carried forward.",
        chapterCarryForwardProfile: "Callbacks scheduled for chapters 3-5; convergence revealed in chapter 4.",
      }),
    ];

    const reinterpretations: PovReinterpretation[] = [
      {
        reinterpretationId: "reinterpret-book1-warning-gesture",
        threadId: "book1-philosophy-reading-signs",
        eventAnchorId: "thread-node-philosophy-gesture-01",
        sourcePov: "younger-kin-observer",
        targetPov: "elder-memory-holder",
        reinterpretationDelta: "Gesture originally read as caution, later read as coded route warning.",
        memoryDistortionFactor: 0.33,
        explicitness: "medium",
      },
    ];

    const delayedConvergenceEvents: DelayedConvergenceEvent[] = [
      {
        convergenceId: "convergence-route-pressure-a",
        hiddenConvergenceKey: "route-pressure-cluster-a",
        sourceNodeIds: ["thread-node-continuity-seed-01", "thread-node-route-rumor-01"],
        revealedInChapterId: "book1-chapter-04",
        revealedInSceneId: "book1-ch04-sc01",
        mode: "trade_disturbance",
        meaningGain: 0.67,
      },
    ];

    return NarrativeThreadPackSchema.parse({
      artifact: "book_narrative_thread_pack",
      schemaVersion: "1.0.0",
      bookId: "book1",
      threads,
      chapterCompositions,
      reinterpretations,
      delayedConvergenceEvents,
    });
  }
}
