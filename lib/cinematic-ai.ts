import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { buildNarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import { validateEnhancedDescriptionOutput } from "@/lib/descriptive-validation";

const RULES = `Rules:
- Use ONLY the structured context provided. Do not invent dates, names, or events not present.
- Preserve uncertainty and ambiguity where the context hedges.
- Prioritize voice, rhythm, and emotional inevitability over explanation.
- Do not summarize; write scene prose or speakable narration as requested.
- No meta language about being an AI or a system.`;

function packContext(metaSceneId: string, extra: string): string {
  return `CONTEXT (authoritative; do not contradict):\n${extra}\n\n${RULES}`;
}

export async function enhanceCinematicPass(
  metaSceneId: string,
  passType: string,
): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: true,
    publicOnly: false,
  });
  if (!ctx) return null;

  const payload = [
    `Meta scene title: ${ctx.title}`,
    `Place: ${ctx.place.name}`,
    `POV: ${ctx.povPerson.name}`,
    `Environment: ${ctx.metaFields.environmentDescription ?? ""}`,
    `Sensory field: ${ctx.metaFields.sensoryField ?? ""}`,
    `Emotional voltage: ${ctx.metaFields.emotionalVoltage ?? ""}`,
    `Central conflict: ${ctx.metaFields.centralConflict ?? ""}`,
    `Symbolic elements: ${ctx.metaFields.symbolicElements ?? ""}`,
    `Narrative purpose: ${ctx.metaFields.narrativePurpose ?? ""}`,
    `Approved narrative pass fragments: ${ctx.narrativePasses
      .slice(0, 2)
      .map((p) => `[${p.passType}] ${p.content.slice(0, 1200)}`)
      .join("\n---\n")}`,
  ].join("\n");

  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      {
        role: "system",
        content:
          "You refine cinematic scene prose for literary reading. Obey the context strictly.",
      },
      {
        role: "user",
        content: `${packContext(metaSceneId, payload)}\n\nTask: write or refine a ${passType} pass as immersive scene prose (not bullet summary).`,
      },
    ],
    temperature: 0.65,
    max_tokens: 2200,
  });
  const text = res.choices[0]?.message?.content?.trim() ?? "";
  const v = validateEnhancedDescriptionOutput(text);
  return v.ok ? v.text : null;
}

export async function enhanceAudioNarration(metaSceneId: string): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: false,
  });
  if (!ctx) return null;
  const payload = [
    `Place: ${ctx.place.name}; POV: ${ctx.povPerson.name}`,
    `Voice passes (if any): ${ctx.voicePasses
      .filter((v) => v.passType === "audio_script" || v.passType === "narrator_voice")
      .map((v) => v.content.slice(0, 900))
      .join("\n---\n")}`,
    `Narrative excerpt: ${ctx.narrativePasses[0]?.content?.slice(0, 1400) ?? ""}`,
  ].join("\n");

  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      {
        role: "system",
        content:
          "You write clean, pause-aware narration for human voice actors. Short paragraphs. No stage directions unless minimal [pause].",
      },
      {
        role: "user",
        content: `${packContext(metaSceneId, payload)}\n\nTask: produce speakable narration under 900 words.`,
      },
    ],
    temperature: 0.55,
    max_tokens: 1800,
  });
  const text = res.choices[0]?.message?.content?.trim() ?? "";
  const v = validateEnhancedDescriptionOutput(text);
  return v.ok ? v.text : null;
}

export async function enhanceTransitionBeat(
  fromSceneId: string,
  toSceneId: string,
): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const [from, to] = await Promise.all([
    prisma.scene.findUnique({
      where: { id: fromSceneId },
      select: { summary: true, emotionalTone: true, narrativeIntent: true },
    }),
    prisma.scene.findUnique({
      where: { id: toSceneId },
      select: { summary: true, description: true, emotionalTone: true },
    }),
  ]);
  if (!from || !to) return null;
  const payload = [
    `From scene residue: ${from.emotionalTone ?? ""} ${from.narrativeIntent ?? ""} ${from.summary ?? ""}`,
    `Toward: ${to.summary ?? to.description.slice(0, 400)} (${to.emotionalTone ?? ""})`,
  ].join("\n");

  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      {
        role: "system",
        content: "You write a subtle cinematic transition (2–5 sentences). No melodrama.",
      },
      {
        role: "user",
        content: `${packContext(`${fromSceneId}>${toSceneId}`, payload)}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 600,
  });
  const text = res.choices[0]?.message?.content?.trim() ?? "";
  const v = validateEnhancedDescriptionOutput(text);
  return v.ok ? v.text : null;
}

export async function enhanceAlternatePovPass(
  metaSceneId: string,
  personId: string,
): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const [ctx, person] = await Promise.all([
    buildNarrativeConsciousnessContext(metaSceneId, { publicOnly: false }),
    prisma.person.findUnique({
      where: { id: personId },
      select: {
        name: true,
        description: true,
        characterProfile: {
          select: {
            emotionalBaseline: true,
            attentionBias: true,
            memoryBias: true,
            relationalStyle: true,
          },
        },
      },
    }),
  ]);
  if (!ctx || !person) return null;
  const payload = [
    `Primary POV in scene: ${ctx.povPerson.name}`,
    `Alternate witness: ${person.name}`,
    person.description ?? "",
    `Profile hints: ${person.characterProfile?.emotionalBaseline ?? ""} ${person.characterProfile?.attentionBias ?? ""}`,
    `Scene voltage: ${ctx.metaFields.emotionalVoltage ?? ""}`,
    `Place: ${ctx.place.name}`,
  ].join("\n");

  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      {
        role: "system",
        content:
          "You render the same moment from another witness’s interiority. Do not contradict the given scene facts.",
      },
      {
        role: "user",
        content: `${packContext(metaSceneId, payload)}\n\nTask: 400–900 words of literary prose.`,
      },
    ],
    temperature: 0.62,
    max_tokens: 2200,
  });
  const text = res.choices[0]?.message?.content?.trim() ?? "";
  const v = validateEnhancedDescriptionOutput(text);
  return v.ok ? v.text : null;
}
