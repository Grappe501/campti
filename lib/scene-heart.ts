import { prisma } from "@/lib/prisma";
import { getNarrativeDnaContextForMetaScene } from "@/lib/narrative-dna-context";

export type HeartSnapshot = {
  hasHeart: boolean;
  emotionSpecificity: "generic" | "specific" | "unknown";
  povEmbodied: boolean;
  environmentConsequential: boolean;
  symbolismPersonal: boolean;
  relationshipPressure: boolean;
  deficits: string[];
};

function isGenericEmotion(text: string | null | undefined): boolean {
  if (!text?.trim()) return true;
  const t = text.toLowerCase();
  return /^(tension|emotion|feeling|sad|happy|conflict)\b|vague|general/i.test(t) && t.length < 40;
}

export async function doesSceneHaveHeart(metaSceneId: string): Promise<boolean> {
  const snap = await deriveHeartDeficits(metaSceneId);
  return snap.deficits.length === 0;
}

export async function isEmotionSpecificOrGeneric(metaSceneId: string): Promise<"generic" | "specific" | "unknown"> {
  const m = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { emotionalVoltage: true, characterStatesSummary: true },
  });
  if (!m) return "unknown";
  const blob = [m.emotionalVoltage, m.characterStatesSummary].filter(Boolean).join(" ");
  return isGenericEmotion(blob) ? "generic" : "specific";
}

export async function isPovEmotionEmbodied(metaSceneId: string): Promise<boolean> {
  const m = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { povPersonId: true },
  });
  if (!m) return false;
  const p = await prisma.characterProfile.findUnique({ where: { personId: m.povPersonId } });
  return Boolean(p?.sensoryBias?.trim() || p?.emotionalBaseline?.trim() || p?.enneagramType);
}

export async function isEnvironmentJustDecor(metaSceneId: string): Promise<boolean> {
  const m = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { environmentDescription: true, sensoryField: true, placeId: true },
  });
  if (!m) return true;
  const hasSceneLayer = Boolean(m.environmentDescription?.trim() || m.sensoryField?.trim());
  const sp = await prisma.settingProfile.findUnique({
    where: { placeId: m.placeId },
    select: { sounds: true, smells: true, textures: true },
  });
  const hasSensory = Boolean(sp?.sounds?.trim() && sp?.smells?.trim() && sp?.textures?.trim());
  return !(hasSceneLayer || hasSensory);
}

export async function doesSymbolismTouchCharacter(metaSceneId: string): Promise<boolean> {
  const m = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { symbolicElements: true, povPersonId: true },
  });
  if (!m?.symbolicElements?.trim()) return false;
  const prof = await prisma.characterProfile.findUnique({
    where: { personId: m.povPersonId },
    select: { internalConflicts: true, fears: true, desires: true },
  });
  return Boolean(prof?.internalConflicts?.trim() || prof?.fears?.trim() || prof?.desires?.trim());
}

export async function doesRelationshipPressureExist(metaSceneId: string): Promise<boolean> {
  const m = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { centralConflict: true, participants: true },
  });
  if (!m) return false;
  return Boolean(m.centralConflict?.trim()) || m.participants.length > 1;
}

export async function deriveHeartDeficits(metaSceneId: string): Promise<HeartSnapshot> {
  const deficits: string[] = [];

  const [spec, embodied, decor, symbolPersonal, relPress, dnaSlice, metaForDna] = await Promise.all([
    isEmotionSpecificOrGeneric(metaSceneId),
    isPovEmotionEmbodied(metaSceneId),
    isEnvironmentJustDecor(metaSceneId),
    doesSymbolismTouchCharacter(metaSceneId),
    doesRelationshipPressureExist(metaSceneId),
    getNarrativeDnaContextForMetaScene(metaSceneId),
    prisma.metaScene.findUnique({
      where: { id: metaSceneId },
      select: { symbolicElements: true },
    }),
  ]);

  if (spec === "generic")
    deficits.push(
      "The emotional engine reads like a label (‘tension’, ‘sadness’) rather than a specific weather system — name texture, tempo, and what the body does with the feeling.",
    );
  if (!embodied)
    deficits.push(
      "The POV is physically present but not yet psychologically organizing the scene — add sensory bias, emotional baseline, or Enneagram law so attention has a bias.",
    );
  if (decor)
    deficits.push(
      "The environment risks reading decorative: things are seen but not consequential — let heat, rule, or terrain force delay, risk, or shame.",
    );
  if (!symbolPersonal)
    deficits.push(
      "Symbols may exist in the room but have not yet docked with the POV’s fear, memory, or longing — tie image to interior cost.",
    );
  if (!relPress)
    deficits.push(
      "Interpersonal physics is thin: bodies may share space without owing each other silence, care, or threat — clarify social stakes.",
    );

  if (
    dnaSlice.symbols.length > 0 &&
    !metaForDna?.symbolicElements?.trim()
  ) {
    deficits.push(
      "Narrative DNA lists bound symbols for this scene or POV, but the meta scene’s symbolic field is still empty — consider threading at least one concrete image through the POV.",
    );
  }

  const hasHeart = deficits.length === 0;
  return {
    hasHeart,
    emotionSpecificity: spec,
    povEmbodied: embodied,
    environmentConsequential: !decor,
    symbolismPersonal: symbolPersonal,
    relationshipPressure: relPress,
    deficits,
  };
}

export async function deriveSceneHeartSnapshot(metaSceneId: string): Promise<HeartSnapshot> {
  return deriveHeartDeficits(metaSceneId);
}
