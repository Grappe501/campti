import { readFileSync } from "node:fs";
import path from "node:path";

type VerifyTarget =
  | "living-entry-experience"
  | "experience-canvas"
  | "experience-modes-reinvention"
  | "voice-presence-upgrade"
  | "narrative-overlays"
  | "interaction-presence"
  | "ambient-transitions"
  | "experience-orchestration-v2";

function read(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

function assertContains(source: string, needle: string, label: string): void {
  if (!source.includes(needle)) {
    throw new Error(`[${label}] missing required marker: ${needle}`);
  }
}

function run(target: VerifyTarget): void {
  const readScene = read("components/public/read-scene-experience.tsx");
  const bundleDomain = read("lib/domain/reader-experience-bundle.ts");
  const orchestrator = read("lib/services/reader-experience-orchestrator-service.ts");
  const continueBanner = read("components/public/continue-reading-banner.tsx");
  const cockpit = read("components/read/reader-cockpit-shell.tsx");

  if (target === "living-entry-experience") {
    assertContains(readScene, "Return state", target);
    assertContains(readScene, "entryState.worldLine", target);
    assertContains(continueBanner, "Return state", target);
    return;
  }
  if (target === "experience-canvas") {
    assertContains(readScene, "Layered canvas", target);
    assertContains(bundleDomain, "ReaderExperienceCanvasState", target);
    assertContains(orchestrator, "canvasState", target);
    return;
  }
  if (target === "experience-modes-reinvention") {
    assertContains(bundleDomain, "ReaderExperienceModeState", target);
    assertContains(orchestrator, "modeState", target);
    assertContains(readScene, "modeState?.transitionHint", target);
    return;
  }
  if (target === "voice-presence-upgrade") {
    assertContains(bundleDomain, "ReaderExperienceVoiceState", target);
    assertContains(orchestrator, "voiceState", target);
    assertContains(readScene, "voiceState?.transitionCue", target);
    return;
  }
  if (target === "narrative-overlays") {
    assertContains(bundleDomain, "ReaderExperienceOverlayState", target);
    assertContains(readScene, "Resonance", target);
    assertContains(readScene, "overlayState.relationshipTension", target);
    return;
  }
  if (target === "interaction-presence") {
    assertContains(bundleDomain, "ReaderExperienceInteractionState", target);
    assertContains(readScene, "interactionState?.entryLine", target);
    assertContains(cockpit, "Scene conversation", target);
    return;
  }
  if (target === "ambient-transitions") {
    assertContains(bundleDomain, "ReaderExperienceTransitionState", target);
    assertContains(readScene, "Ambient cue", target);
    assertContains(orchestrator, "transitionState", target);
    return;
  }
  assertContains(bundleDomain, "ReaderExperienceBundleV2", target);
  assertContains(orchestrator, "experienceVersion: \"v2\"", target);
  assertContains(readScene, "experienceBundle?.entryState", target);
}

const target = process.argv[2] as VerifyTarget | undefined;
if (!target) {
  throw new Error("Usage: tsx scripts/verify-experience-innovation.ts <target>");
}
run(target);
console.log(JSON.stringify({ ok: true, target }, null, 2));
