import type { MetaScene } from "@prisma/client";

type MetaPick = Pick<
  MetaScene,
  | "environmentDescription"
  | "sensoryField"
  | "characterStatesSummary"
  | "centralConflict"
  | "symbolicElements"
  | "emotionalVoltage"
  | "socialConstraints"
  | "historicalConstraints"
>;

export function doesSceneFeelStatic(meta: MetaPick): boolean {
  const env = (meta.environmentDescription ?? "").trim().length;
  const sens = (meta.sensoryField ?? "").trim().length;
  const emo = (meta.emotionalVoltage ?? "").trim().length;
  const conf = (meta.centralConflict ?? "").trim().length;
  return env + sens > 120 && emo + conf < 40;
}

export function doesEnvironmentActOnCharacter(meta: MetaPick): boolean {
  const blob = `${meta.environmentDescription ?? ""} ${meta.sensoryField ?? ""}`.toLowerCase();
  return /\b(force|press|push|block|shape|limit|hold|burn|cold|heat|wet|dry|noise)\b/.test(blob);
}

export function doesCharacterInterpretEnvironment(meta: MetaPick): boolean {
  const blob = `${meta.characterStatesSummary ?? ""} ${meta.sensoryField ?? ""}`.toLowerCase();
  return /\b(feel|sense|read|mean|know|understand|remember|warn)\b/.test(blob);
}

export function isConflictInternalOnly(meta: MetaPick): boolean {
  const c = (meta.centralConflict ?? "").toLowerCase();
  if (!c.trim()) return false;
  return /\b(fear|shame|doubt|guilt|inner|heart)\b/.test(c) && !/\b(they|outsider|enemy|raid|law|soldier|border)\b/.test(c);
}

export function isConflictExternalOnly(meta: MetaPick): boolean {
  const c = (meta.centralConflict ?? "").toLowerCase();
  if (!c.trim()) return false;
  return /\b(raid|war|law|order|soldier|outsider|border|land|treaty)\b/.test(c) && !/\b(fear|shame|doubt|inner)\b/.test(c);
}

export function doesSymbolismExistButNotInteract(meta: MetaPick): boolean {
  const s = (meta.symbolicElements ?? "").trim();
  const c = (meta.centralConflict ?? "").trim();
  if (s.length < 20) return false;
  if (!c.length) return true;
  const symWords = s.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
  return !symWords.some((w) => c.toLowerCase().includes(w));
}
