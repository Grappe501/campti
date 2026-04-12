import type { CharacterCore } from "@/lib/domain/cognition";
import type {
  InnerVoiceConstraintFrame,
  InnerVoiceMode,
  WorldStateThoughtStyle,
} from "@/lib/domain/inner-voice";

function tabooTokensFromCore(core: CharacterCore | null): string[] {
  if (!core?.tabooBoundariesJson) return [];
  const raw = core.tabooBoundariesJson;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string").slice(0, 24);
  }
  if (typeof raw === "object" && raw !== null) {
    return Object.keys(raw as Record<string, unknown>).slice(0, 24);
  }
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
}

export function buildInnerVoiceConstraintFrame(input: {
  mode: InnerVoiceMode;
  coreProfile: CharacterCore | null;
  worldStyle: WorldStateThoughtStyle;
}): InnerVoiceConstraintFrame {
  const taboo = tabooTokensFromCore(input.coreProfile);
  const forbidden = [...new Set([...input.worldStyle.forbiddenThoughtZones, ...taboo])];

  const channels = {
    feltEmotion: true,
    consciousBelief: true,
    suppressedDesire: true,
    selfJustification: true,
    fear: true,
    contradiction: true,
    misperception: true,
  };

  const modeEmphasis: Record<string, boolean> = {
    innerMonologue: input.mode === "INNER_MONOLOGUE",
    tabooSurfacing: input.mode === "TABOO_SURFACING",
    selfJustification: input.mode === "SELF_JUSTIFICATION",
    fearStack: input.mode === "FEAR_STACK",
    contradictionTrace: input.mode === "CONTRADICTION_TRACE",
    godModeQa: input.mode === "GOD_MODE_QA",
  };

  return {
    allowUnfilteredPrivateMind: true,
    worldStateTruth: true,
    ageTruth: true,
    channels,
    modeEmphasis,
    tabooAndForbiddenIndex: forbidden,
    requireRawForbiddenBucketWhenPresent: input.mode === "TABOO_SURFACING",
  };
}
