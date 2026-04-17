import Link from "next/link";

import type { AuthorCommandCockpitBundle, AuthorCockpitScope } from "@/lib/domain/author-command-cockpit";

type ScopeOption = {
  id: string;
  label: string;
  href: string;
};

type Props = {
  bundle: AuthorCommandCockpitBundle;
  scopeOptions: Record<AuthorCockpitScope, ScopeOption[]>;
};

export function AuthorCommandCockpit({ bundle, scopeOptions }: Props) {
  const currentScopeOptions = scopeOptions[bundle.context.scope];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-stone-500">Author Command Cockpit</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">{bundle.centeredSurface.title}</h1>
            <p className="text-sm text-stone-600">{bundle.centeredSurface.subtitle}</p>
          </div>
          <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs text-stone-700">
            Scope: {bundle.context.scope}
          </div>
        </div>
      </section>

      {bundle.certificationHardening ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-amber-800">Certification &amp; validation truth (Cluster 7)</p>
          <p className="mt-2 text-sm text-amber-950">{bundle.certificationHardening.certificationReadinessLine}</p>
          <ul className="mt-3 grid gap-2 text-xs text-amber-950 sm:grid-cols-2">
            <li>Certification truth rule: {bundle.certificationHardening.certificationTruthRuleSatisfied ? "satisfied" : "not satisfied"}</li>
            <li>Artifact truth rule: {bundle.certificationHardening.artifactTruthRuleSatisfied ? "satisfied" : "not satisfied"}</li>
            <li>Execution-ready: {bundle.certificationHardening.mayPresentAsExecutionReady ? "allowed" : "disallowed"}</li>
            <li>Production-grade: {bundle.certificationHardening.mayPresentAsProductionGrade ? "allowed" : "disallowed"}</li>
            <li>Artifact authority: {bundle.certificationHardening.canonicalArtifactAuthority.replaceAll("_", " ")}</li>
            <li>Save eligible: {bundle.certificationHardening.saveEligible ? "yes" : "no"}</li>
            <li>Readiness evidence trust: {bundle.certificationHardening.readinessEvidenceTrustClass.replaceAll("_", " ")}</li>
            <li>
              Semantic invariants — hard: {bundle.certificationHardening.semanticHardViolations} · soft:{" "}
              {bundle.certificationHardening.semanticSoftViolations}
            </li>
            <li>
              Overrides: realism {bundle.certificationHardening.overrideUsage.allowSaveOnInvalidRealism ? "on" : "off"} · human
              gravity {bundle.certificationHardening.overrideUsage.allowSaveOnInvalidHumanGravity ? "on" : "off"}
            </li>
          </ul>
          {bundle.certificationHardening.saveBlockedReasons.length > 0 ? (
            <div className="mt-2 rounded-lg border border-amber-300 bg-white p-2">
              <p className="text-[11px] font-medium text-amber-900">Save blocked because</p>
              <ul className="mt-1 space-y-1 text-[11px] text-amber-800">
                {bundle.certificationHardening.saveBlockedReasons.map((r) => (
                  <li key={r}>- {r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {bundle.certificationHardening.driftErrors.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-red-800">
              {bundle.certificationHardening.driftErrors.map((m) => (
                <li key={m}>- {m}</li>
              ))}
            </ul>
          ) : null}
          {bundle.certificationHardening.driftWarnings.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-amber-800">
              {bundle.certificationHardening.driftWarnings.map((m) => (
                <li key={m}>- {m}</li>
              ))}
            </ul>
          ) : null}
          {bundle.certificationHardening.remediationTargets.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-white p-2">
              <p className="text-[11px] font-medium text-amber-900">Remediation targets</p>
              <ul className="mt-1 space-y-1 text-[11px] text-stone-700">
                {bundle.certificationHardening.remediationTargets.map((t) => (
                  <li key={t}>- {t}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-stone-500">{bundle.toolRails.topBand.label}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {bundle.toolRails.topBand.tools.map((tool) => (
            <span key={tool} className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
              {tool.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">{bundle.toolRails.leftRail.label}</p>
            <ul className="mt-2 space-y-1 text-sm text-stone-700">
              {bundle.toolRails.leftRail.tools.map((tool) => (
                <li key={tool}>- {tool.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">Scope switching</p>
            <div className="mt-3 space-y-3">
              {(Object.keys(scopeOptions) as AuthorCockpitScope[]).map((scope) => (
                <div key={scope}>
                  <p className="text-xs font-medium text-stone-500">{scope}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {scopeOptions[scope].length === 0 ? (
                      <span className="text-xs text-stone-400">No records</span>
                    ) : (
                      scopeOptions[scope].slice(0, 4).map((option) => (
                        <Link
                          key={option.id}
                          href={option.href}
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            scope === bundle.context.scope
                              ? "border-amber-400 bg-amber-50 text-amber-900"
                              : "border-stone-300 bg-white text-stone-700"
                          }`}
                        >
                          {option.label}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-4 lg:col-span-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">Centered work surface</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-900">{bundle.centeredSurface.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{bundle.centeredSurface.subtitle}</p>

            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-medium text-stone-700">Indicator bank ({bundle.indicatorBank.scope})</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {bundle.indicatorBank.indicators.map((indicator) => (
                  <li key={indicator.key} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-700">{indicator.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          indicator.severity === "high"
                            ? "bg-red-100 text-red-800"
                            : indicator.severity === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {indicator.severity}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-stone-500">{String(indicator.value)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>

        <aside className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">{bundle.toolRails.rightRail.label}</p>
            <ul className="mt-2 space-y-1 text-sm text-stone-700">
              {bundle.toolRails.rightRail.tools.map((tool) => (
                <li key={tool}>- {tool.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">Guided action signals</p>
            {bundle.guidedSignals.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">No elevated advisory signals.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {bundle.guidedSignals.map((signal) => (
                  <li key={signal.signalId} className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-sm">
                    <p className="font-medium text-stone-800">{signal.summary}</p>
                    <p className="mt-1 text-xs text-stone-600">{signal.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {bundle.beatAssembly ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Beat assembly</p>
              <p className="mt-2 text-sm font-medium text-stone-800">
                Chapter {bundle.beatAssembly.chapter} · {bundle.beatAssembly.beatCount} beats
              </p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Validation: {bundle.beatAssembly.validationPassed ? "pass" : "fail"}</li>
                <li>Highest pressure load: {bundle.beatAssembly.highestPressureLoad.toFixed(2)}</li>
                <li>Salience coverage: {(bundle.beatAssembly.salienceCoverage * 100).toFixed(0)}%</li>
                <li>Memory-linked beats: {bundle.beatAssembly.memoryLinkedBeats}</li>
                <li>Social feedback beats: {bundle.beatAssembly.socialFeedbackBeats}</li>
                <li>Meaning traces: {bundle.beatAssembly.meaningTraceBeats}</li>
              </ul>
              <p className="mt-2 text-xs text-stone-500">{bundle.beatAssembly.summaryLine}</p>
            </div>
          ) : null}

          {bundle.chapterState ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Chapter state</p>
              <p className="mt-2 text-sm font-medium text-stone-800">
                {bundle.chapterState.chapterId} · {bundle.chapterState.chapterMode.replaceAll("_", " ")}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Movement pressure: {bundle.chapterState.movementPressure}</li>
                <li>Decision pressure: {bundle.chapterState.decisionPressure}</li>
                <li>Meaning load: {bundle.chapterState.meaningLoad}</li>
                <li>Allowed meaning intensity: {bundle.chapterState.allowedMeaningIntensity.replaceAll("_", " ")}</li>
                <li>Validation: {bundle.chapterState.validationPassed ? "pass" : "fail"}</li>
              </ul>
              <p className="mt-2 text-xs text-stone-500">{bundle.chapterState.summaryLine}</p>
            </div>
          ) : null}

          {bundle.narrativePsychology ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Narrative psychology</p>
              <p className="mt-2 text-sm font-medium text-stone-800">
                {bundle.narrativePsychology.chapterId} · {bundle.narrativePsychology.chapterPsychologyMode.replaceAll("_", " ")}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Pull score: {bundle.narrativePsychology.pullScore.toFixed(2)}</li>
                <li>Carry-forward hook: {bundle.narrativePsychology.carryForwardHook.replaceAll("_", " ")}</li>
              </ul>
              <p className="mt-2 text-xs text-stone-500">{bundle.narrativePsychology.emotionalObjective}</p>
              {bundle.narrativePsychology.driftWarnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {bundle.narrativePsychology.driftWarnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {bundle.humanGravityRuntime ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Human gravity runtime (Cluster 6)</p>
              <p className="mt-2 text-xs text-stone-600">
                Scene: {bundle.humanGravityRuntime.sceneId} · Prompt lines materialized:{" "}
                {bundle.humanGravityRuntime.runtimePromptLinesMaterialized ? "yes" : "no"}
              </p>
              <p className="mt-2 text-xs text-stone-600">
                Canonical runtime active (truth rule):{" "}
                {bundle.humanGravityRuntime.humanGravityCanonicalRuntimeActive ? "yes" : "no"} · No-reset gate:{" "}
                {bundle.humanGravityRuntime.noResetValidationParticipatesInCanonicalValidity ? "yes" : "no"}
              </p>
              <p className="mt-2 text-xs text-stone-700">
                Score: {bundle.humanGravityRuntime.humanGravityScore.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-stone-600">{bundle.humanGravityRuntime.povBiasSummary}</p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Relational threat (top): {bundle.humanGravityRuntime.relationalThreatTop.join(", ") || "—"}</li>
                <li>Active consequence markers: {bundle.humanGravityRuntime.activeConsequenceMarkers.length}</li>
                <li>Fear/desire/vulnerability ids: {bundle.humanGravityRuntime.activeFearDesireVulnerabilityLines.length}</li>
              </ul>
              {bundle.humanGravityRuntime.burdenAndInheritanceLines.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px] text-stone-600">
                  {bundle.humanGravityRuntime.burdenAndInheritanceLines.slice(0, 6).map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              ) : null}
              {bundle.humanGravityRuntime.carryForwardResidue.length > 0 ? (
                <p className="mt-2 text-[11px] text-stone-500">
                  Carry-forward: {bundle.humanGravityRuntime.carryForwardResidue.slice(0, 3).join(" · ")}
                </p>
              ) : null}
              {bundle.humanGravityRuntime.shallowOrResetWarnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {bundle.humanGravityRuntime.shallowOrResetWarnings.map((w) => (
                    <li key={w}>- {w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {bundle.proseRealism ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Prose realism (Cluster 5)</p>
              <p className="mt-2 text-xs text-stone-600">
                Governance-linked: {bundle.proseRealism.governanceLinked ? "yes" : "no"}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Era truth: {bundle.proseRealism.eraTruthScore?.toFixed(2) ?? "—"}</li>
                <li>Cognition truth: {bundle.proseRealism.cognitionTruthScore?.toFixed(2) ?? "—"}</li>
                <li>Narrator boundary: {bundle.proseRealism.narratorBoundaryIntegrity?.toFixed(2) ?? "—"}</li>
                <li>Emotional credibility: {bundle.proseRealism.emotionalCredibility?.toFixed(2) ?? "—"}</li>
                <li>Sensory embodiment: {bundle.proseRealism.sensoryEmbodiment?.toFixed(2) ?? "—"}</li>
                <li>Voice distinctness: {bundle.proseRealism.voiceDistinctness?.toFixed(2) ?? "—"}</li>
                <li>Consequence residue: {bundle.proseRealism.consequenceResidue?.toFixed(2) ?? "—"}</li>
                <li>Literary naturalness: {bundle.proseRealism.literaryNaturalness?.toFixed(2) ?? "—"}</li>
              </ul>
              {bundle.proseRealism.antiMechanicalWarnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {bundle.proseRealism.antiMechanicalWarnings.map((w) => (
                    <li key={w}>- {w}</li>
                  ))}
                </ul>
              ) : null}
              {bundle.proseRealism.recommendedRefinementTargets.length > 0 ? (
                <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-2">
                  <p className="text-[11px] font-medium text-stone-700">Refinement targets</p>
                  <ul className="mt-1 space-y-1 text-[11px] text-stone-600">
                    {bundle.proseRealism.recommendedRefinementTargets.map((t) => (
                      <li key={t}>- {t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {bundle.proseConstraints ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Prose constraints</p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Mode: {bundle.proseConstraints.proseMode.replaceAll("_", " ")}</li>
                <li>Narrative distance: {bundle.proseConstraints.narrativeDistance.replaceAll("_", " ")}</li>
                <li>Sensory density: {bundle.proseConstraints.sensoryDensityTarget}</li>
                <li>Exposition allowance: {bundle.proseConstraints.expositionAllowance.toFixed(2)}</li>
                <li>Ambiguity allowance: {bundle.proseConstraints.ambiguityAllowance.toFixed(2)}</li>
                <li>Ending momentum: {bundle.proseConstraints.endingMomentumProfile}</li>
                <li>Compliance: {bundle.proseConstraints.compliant ? "pass" : "drift detected"}</li>
              </ul>
              {bundle.proseConstraints.driftWarnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {bundle.proseConstraints.driftWarnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {bundle.beatGating ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Beat gating</p>
              <p className="mt-2 text-xs text-stone-700">
                Required: {bundle.beatGating.required ? "yes" : "no"} · Blocked: {bundle.beatGating.blocked ? "yes" : "no"}
              </p>
              <p className="mt-1 text-xs text-stone-500">{bundle.beatGating.reason}</p>
            </div>
          ) : null}

          {bundle.narrativeThreads ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Narrative threads</p>
              <p className="mt-2 text-xs text-stone-700">
                Active: {bundle.narrativeThreads.activeThreadIds.length} · Latent: {bundle.narrativeThreads.latentThreadIds.length}
              </p>
              <p className="mt-1 text-xs text-stone-700">
                Unresolved: {bundle.narrativeThreads.unresolvedThreadCount} · Resolved: {bundle.narrativeThreads.resolvedThreadCount}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Callback markers: {bundle.narrativeThreads.callbackMarkers.length}</li>
                <li>Delayed convergence keys: {bundle.narrativeThreads.delayedConvergenceMarkers.length}</li>
                <li>Reinterpretation candidates: {bundle.narrativeThreads.reinterpretationCandidates.length}</li>
                <li>Philosophy threads: {bundle.narrativeThreads.philosophyThreadIds.length}</li>
              </ul>
              <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-2">
                <p className="text-[11px] font-medium text-stone-700">Scene density</p>
                <ul className="mt-1 space-y-1 text-[11px] text-stone-600">
                  {bundle.narrativeThreads.sceneDensity.map((scene) => (
                    <li key={scene.sceneId}>
                      {scene.sceneId}: {scene.activeThreadCount} active / {scene.latentThreadCount} latent (density{" "}
                      {scene.densityScore.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
              {bundle.narrativeThreads.warnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {bundle.narrativeThreads.warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {bundle.chapterComposition ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Chapter composition</p>
              <p className="mt-2 text-xs text-stone-700">
                Mode: {bundle.chapterComposition.compositionMode.replaceAll("_", " ")} · Scenes: {bundle.chapterComposition.sceneCount}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Role spread: {bundle.chapterComposition.sceneRoleSpread.length}</li>
                <li>Dominant thread families: {bundle.chapterComposition.dominantThreadFamilies.length}</li>
                <li>Latent thread families: {bundle.chapterComposition.latentThreadFamilies.length}</li>
                <li>Delayed convergence markers: {bundle.chapterComposition.delayedConvergenceMarkers.length}</li>
                <li>Callback markers: {bundle.chapterComposition.callbackMarkers.length}</li>
                <li>Reinterpretation anchors: {bundle.chapterComposition.reinterpretationAnchorIds.length}</li>
                <li>Route coverage: {bundle.chapterComposition.routeCoverageStatus.replaceAll("_", " ")}</li>
                <li>Philosophy propagation: {bundle.chapterComposition.philosophyPropagationStatus.replaceAll("_", " ")}</li>
                <li>Density score: {bundle.chapterComposition.densityScore.toFixed(2)}</li>
                <li>Closure profile: {bundle.chapterComposition.chapterClosureProfile.replaceAll("_", " ")}</li>
              </ul>
              {bundle.chapterComposition.thinnessWarnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {bundle.chapterComposition.thinnessWarnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {bundle.literaryDevices ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Literary Devices</p>
              <p className="mt-2 text-xs text-stone-700">{bundle.literaryDevices.chapterLiteraryProfileSummary}</p>

              <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-2">
                <p className="text-[11px] font-medium text-stone-700">Alliteration control (semantic mapped)</p>
                <ul className="mt-1 space-y-1 text-[11px] text-stone-600">
                  <li>Activation: {bundle.literaryDevices.alliterationControl.activationMode}</li>
                  <li>Density: {bundle.literaryDevices.alliterationControl.densityBand}</li>
                  <li>
                    Numeric input {bundle.literaryDevices.alliterationControl.numericInput} to mapped band{" "}
                    {bundle.literaryDevices.alliterationControl.mappedDensityBand}
                  </li>
                  <li>Allowed zones: {bundle.literaryDevices.alliterationControl.allowedLineZones.join(", ") || "none"}</li>
                  <li>Forbidden zones: {bundle.literaryDevices.alliterationControl.forbiddenLineZones.join(", ") || "none"}</li>
                </ul>
              </div>

              <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-2">
                <p className="text-[11px] font-medium text-stone-700">Active device panel</p>
                <ul className="mt-1 space-y-1 text-[11px] text-stone-600">
                  {bundle.literaryDevices.activeDevicePanel.map((device) => (
                    <li key={device.deviceId}>
                      {device.deviceId}: {device.activationMode} / {device.densityBand} / {device.scope} / risk {device.misuseRisk} /{" "}
                      {device.currentChapterApplicationStatus}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-2">
                <p className="text-[11px] font-medium text-stone-700">Symbol registry editor</p>
                <ul className="mt-1 space-y-1 text-[11px] text-stone-600">
                  {bundle.literaryDevices.symbolRegistry.map((symbol) => (
                    <li key={symbol.symbolId}>
                      {symbol.symbolName} ({symbol.symbolId}) carriers={symbol.carriers.join(", ")} threads=
                      {symbol.threadBindings.join(", ") || "none"} settings={symbol.settingBindings.join(", ") || "none"}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-3 text-[11px] text-stone-600">
                Route echo: {bundle.literaryDevices.routeEchoControls.activationMode} / {bundle.literaryDevices.routeEchoControls.densityBand}
              </p>
              <p className="text-[11px] text-stone-600">
                Philosophy echo: {bundle.literaryDevices.philosophyEchoControls.activationMode} / ceiling{" "}
                {bundle.literaryDevices.philosophyEchoControls.explicitnessCeiling}
              </p>

              {bundle.literaryDevices.densityWarnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {bundle.literaryDevices.densityWarnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              ) : null}
              {bundle.literaryDevices.misuseWarnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-red-700">
                  {bundle.literaryDevices.misuseWarnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">Command actions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {bundle.availableActions.map((action) => (
                <span key={action} className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs text-stone-700">
                  {action.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
