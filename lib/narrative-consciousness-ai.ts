import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";
import { buildNarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import {
  buildAudioScriptPrompt,
  buildCharacterVoicePrompt,
  buildImmersiveExcerptPrompt,
  buildNarratorVoicePrompt,
} from "@/lib/voice-prompts";
import {
  deriveGuidedPrompts,
  deriveDeepReadingPrompts,
} from "@/lib/guided-experience";
import {
  deriveEmotionalHook,
} from "@/lib/emotional-gravity";
import { prisma } from "@/lib/prisma";

const SYSTEM_STRICT = [
  "You improve literary expressiveness using ONLY the user-provided context.",
  "Do not invent historical facts, lineage, dates, or events not present in the context.",
  "Preserve uncertainty and ambiguity; do not resolve what the context leaves open.",
  "Do not mention internal systems, tooling, schemas, or admin concepts.",
].join(" ");

async function complete(userPrompt: string): Promise<string> {
  const client = getOpenAIClient();
  const model = getConfiguredModelName();
  const res = await client.chat.completions.create({
    model,
    temperature: 0.65,
    messages: [
      { role: "system", content: SYSTEM_STRICT },
      { role: "user", content: userPrompt },
    ],
  });
  const text = res.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty model response");
  return text;
}

export async function enhanceVoicePass(
  metaSceneId: string,
  voiceProfileId?: string,
): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: true,
  });
  if (!ctx) return null;
  const profile =
    voiceProfileId != null
      ? await prisma.narrativeVoiceProfile.findUnique({ where: { id: voiceProfileId } })
      : await prisma.narrativeVoiceProfile.findFirst({
          where: { scopeType: "character", scopeId: ctx.povPerson.id },
        });
  if (!profile) return null;
  const prompt = buildCharacterVoicePrompt(ctx, profile);
  return complete(`${prompt}\n\nReturn revised prose only.`);
}

export async function enhanceGuidedPrompts(metaSceneId: string): Promise<string[] | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const base = await deriveGuidedPrompts(metaSceneId);
  if (!base.length) return null;
  const joined = base.join("\n");
  const out = await complete(
    `These are draft immersive reading prompts:\n${joined}\n\nRewrite up to 5 prompts, each one line, more vivid but still grounded in the same ideas. No new claims.`,
  );
  return out
    .split("\n")
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function enhanceEmotionalHook(metaSceneId: string): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const hook = await deriveEmotionalHook(metaSceneId);
  if (!hook) return null;
  return complete(
    `Rewrite for emotional precision in one or two sentences, same meaning, no new facts:\n${hook}`,
  );
}

export async function enhanceContinuationLine(sceneId: string): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { summary: true, description: true, emotionalTone: true },
  });
  if (!scene) return null;
  const seed = scene.summary?.trim() || scene.description.trim();
  return complete(
    `Offer a short, inviting continuation phrase (max 12 words) for a reader returning to this passage. Context: ${seed.slice(0, 400)}. Tone hint: ${scene.emotionalTone ?? "unspecified"}. No new plot facts.`,
  );
}

export async function enhanceCharacterExperience(personId: string): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { characterProfile: true },
  });
  if (!person?.characterProfile) return null;
  const cp = person.characterProfile;
  const blob = [
    cp.worldview,
    cp.coreBeliefs,
    cp.desires,
    cp.fears,
    cp.relationalStyle,
    cp.speechPatterns,
  ]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join("\n");
  if (!blob) return null;
  return complete(
    `Write one restrained paragraph (≤90 words) describing how this person moves through the world emotionally, using ONLY these notes:\n${blob.slice(0, 2000)}`,
  );
}

export async function enhanceSymbolNarrative(symbolId: string): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const sym = await prisma.symbol.findUnique({
    where: { id: symbolId },
    select: {
      name: true,
      meaning: true,
      meaningPrimary: true,
      meaningSecondary: true,
      emotionalTone: true,
      usageContext: true,
    },
  });
  if (!sym) return null;
  const blob = [sym.meaning, sym.meaningPrimary, sym.meaningSecondary, sym.usageContext]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join("\n");
  if (!blob) return null;
  return complete(
    `Symbol: ${sym.name}. Emotional tone field: ${sym.emotionalTone ?? "unspecified"}. Using ONLY this material, write ≤100 words on how this image lives in the world—no new factual claims:\n${blob.slice(0, 2000)}`,
  );
}

/** Optional LLM polish for deep-reading prompts. */
export async function enhanceDeepReadingPrompts(
  metaSceneId: string,
): Promise<string[] | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const base = await deriveDeepReadingPrompts(metaSceneId);
  if (!base.length) return null;
  const out = await complete(
    `Improve these deep-reading prompts for immersion (max 4), same constraints, one line each:\n${base.join("\n")}`,
  );
  return out
    .split("\n")
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

/** Optional narrator-style excerpt for immersive modes. */
export async function enhanceImmersiveExcerpt(
  metaSceneId: string,
  voiceProfileId: string,
): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: false,
  });
  if (!ctx) return null;
  const profile = await prisma.narrativeVoiceProfile.findUnique({
    where: { id: voiceProfileId },
  });
  if (!profile) return null;
  const prompt = buildImmersiveExcerptPrompt(ctx, profile);
  return complete(prompt);
}

export async function enhanceNarratorPassText(
  metaSceneId: string,
  voiceProfileId: string,
): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: true,
  });
  if (!ctx) return null;
  const profile = await prisma.narrativeVoiceProfile.findUnique({
    where: { id: voiceProfileId },
  });
  if (!profile) return null;
  const prompt = buildNarratorVoicePrompt(ctx, profile);
  return complete(`${prompt}\n\nReturn narrator prose only.`);
}

export async function enhanceAudioScript(
  metaSceneId: string,
  voiceProfileId: string,
): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: false,
  });
  if (!ctx) return null;
  const profile = await prisma.narrativeVoiceProfile.findUnique({
    where: { id: voiceProfileId },
  });
  if (!profile) return null;
  const prompt = buildAudioScriptPrompt(ctx, profile);
  return complete(`${prompt}\n\nReturn script only.`);
}
