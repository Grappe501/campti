import type { NarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import type { NarrativeVoiceProfile } from "@prisma/client";

export type VoiceProfileShape = Pick<
  NarrativeVoiceProfile,
  | "name"
  | "voiceLabel"
  | "sentenceRhythm"
  | "dictionStyle"
  | "emotionalRegister"
  | "metaphorDensity"
  | "sensoryBias"
  | "interiorityStyle"
  | "silenceStyle"
  | "memoryStyle"
  | "spiritualRegister"
  | "notes"
>;

function voiceKnobs(vp: VoiceProfileShape): string {
  const lines = [
    vp.voiceLabel && `Voice label: ${vp.voiceLabel}`,
    vp.sentenceRhythm && `Sentence rhythm: ${vp.sentenceRhythm}`,
    vp.dictionStyle && `Diction: ${vp.dictionStyle}`,
    vp.emotionalRegister && `Emotional register: ${vp.emotionalRegister}`,
    vp.metaphorDensity && `Metaphor density: ${vp.metaphorDensity}`,
    vp.sensoryBias && `Sensory bias: ${vp.sensoryBias}`,
    vp.interiorityStyle && `Interiority: ${vp.interiorityStyle}`,
    vp.silenceStyle && `Silence: ${vp.silenceStyle}`,
    vp.memoryStyle && `Memory: ${vp.memoryStyle}`,
    vp.spiritualRegister && `Spiritual register: ${vp.spiritualRegister}`,
    vp.notes && `Author notes: ${vp.notes}`,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

function contextBlock(ctx: NarrativeConsciousnessContext): string {
  const p = ctx.povPerson.profile;
  return [
    `Scene title: ${ctx.title}`,
    `Place: ${ctx.place.name}`,
    ctx.place.description && `Place note: ${ctx.place.description}`,
    `POV: ${ctx.povPerson.name}`,
    p?.speechPatterns && `Speech patterns: ${p.speechPatterns}`,
    p?.sensoryBias && `Character sensory bias: ${p.sensoryBias}`,
    p?.relationalStyle && `Relational style: ${p.relationalStyle}`,
    ctx.metaFields.environmentDescription &&
      `Environment: ${ctx.metaFields.environmentDescription}`,
    ctx.metaFields.sensoryField && `Sensory field: ${ctx.metaFields.sensoryField}`,
    ctx.metaFields.emotionalVoltage && `Emotional voltage: ${ctx.metaFields.emotionalVoltage}`,
    ctx.metaFields.centralConflict && `Central conflict: ${ctx.metaFields.centralConflict}`,
    ctx.metaFields.symbolicElements && `Symbolic elements: ${ctx.metaFields.symbolicElements}`,
    ctx.narrativePasses[0]?.content &&
      `Primary narrative pass (do not contradict; reshape in voice):\n${ctx.narrativePasses[0].content.slice(0, 6000)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCharacterVoicePrompt(
  context: NarrativeConsciousnessContext,
  voiceProfile: VoiceProfileShape,
): string {
  return [
    "You are enhancing scene prose in a named character voice.",
    "Rules:",
    "- Use ONLY the provided context. Do not invent historical facts, dates, or relationships not implied.",
    "- Preserve uncertainty where the context is tentative.",
    "- Prefer bodily sensation, partial understanding, and emotional specificity over labels.",
    "- Vary rhythm and diction to match the voice profile.",
    "",
    `Voice profile name: ${voiceProfile.name}`,
    voiceKnobs(voiceProfile),
    "",
    "World/context:",
    contextBlock(context),
  ].join("\n");
}

export function buildNarratorVoicePrompt(
  context: NarrativeConsciousnessContext,
  voiceProfile: VoiceProfileShape,
): string {
  return [
    "You are rendering the scene in a narrator voice distinct from character interior monologue.",
    "Rules:",
    "- Use ONLY the provided context.",
    "- No new factual claims; keep ambiguities intact.",
    "- Let observation carry feeling without explaining it away.",
    "",
    `Narrator profile: ${voiceProfile.name}`,
    voiceKnobs(voiceProfile),
    "",
    "Context:",
    contextBlock(context),
  ].join("\n");
}

export function buildAudioScriptPrompt(
  context: NarrativeConsciousnessContext,
  voiceProfile: VoiceProfileShape,
): string {
  return [
    "Write a short audio script (spoken word) suitable for human narration.",
    "Rules:",
    "- Use ONLY the provided context.",
    "- Short lines, breathable pacing, no sound effects stage directions except minimal [pause].",
    "- Preserve uncertainty; avoid authoritative historical claims beyond the text.",
    "",
    `Delivery voice: ${voiceProfile.name}`,
    voiceKnobs(voiceProfile),
    "",
    "Context:",
    contextBlock(context),
  ].join("\n");
}

export function buildImmersiveExcerptPrompt(
  context: NarrativeConsciousnessContext,
  voiceProfile: VoiceProfileShape,
): string {
  return [
    "Produce an excerpt (≤ ~220 words) for an immersive reading mode.",
    "Rules:",
    "- ONLY provided context.",
    "- Emotion emerges through sense and scene logic—not labels.",
    "- Distinctive rhythm per voice profile.",
    "",
    `Voice: ${voiceProfile.name}`,
    voiceKnobs(voiceProfile),
    "",
    contextBlock(context),
  ].join("\n");
}
