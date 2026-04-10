import type { CharacterMemory, CharacterProfile, SettingProfile, SettingState } from "@prisma/client";
import { profileJsonFieldToSlice } from "@/lib/profile-json";

export type EnvironmentActContext = {
  settingProfile: SettingProfile | null;
  settingStates: SettingState[];
  constraints: { historical: string | null; social: string | null };
};

/** How place + constraints press on the POV — not a prose passage, a pressure summary. */
export function howEnvironmentActsOnCharacter(ctx: EnvironmentActContext): string {
  const parts: string[] = [];
  const p = ctx.settingProfile;
  if (p?.dominantActivities?.trim()) parts.push(`Labor rhythm: ${p.dominantActivities.trim().slice(0, 160)}`);
  if (p?.classDynamics?.trim()) parts.push(`Class pressure: ${p.classDynamics.trim().slice(0, 140)}`);
  if (p?.racialDynamics?.trim()) parts.push(`Racialized risk: ${p.racialDynamics.trim().slice(0, 140)}`);
  if (ctx.constraints.historical?.trim()) parts.push(`Historical constraint: ${ctx.constraints.historical.trim().slice(0, 160)}`);
  if (ctx.constraints.social?.trim()) parts.push(`Social constraint: ${ctx.constraints.social.trim().slice(0, 160)}`);
  return parts.length ? parts.join(" · ") : "Environment pressure underspecified — add setting profile + constraints.";
}

export function howWeatherChangesPerception(ctx: {
  settingStates: SettingState[];
  settingProfile: SettingProfile | null;
}): string {
  const s = ctx.settingStates[0];
  if (s?.weather?.trim()) return `Weather window: ${s.weather.trim()}`;
  if (ctx.settingProfile?.typicalWeather?.trim()) return `Typical weather tone: ${ctx.settingProfile.typicalWeather.trim().slice(0, 140)}`;
  return "";
}

export function howSocialRiskChangesPerception(ctx: {
  settingProfile: SettingProfile | null;
  constraints: { historical: string | null; social: string | null };
}): string {
  const rules = ctx.settingProfile?.socialRules?.trim();
  const soc = ctx.constraints.social?.trim();
  if (rules && soc) return `Social rules (${rules.slice(0, 120)}) + explicit constraint (${soc.slice(0, 120)})`;
  if (rules) return `Social rules: ${rules.slice(0, 200)}`;
  if (soc) return `Social constraint: ${soc.slice(0, 200)}`;
  return "";
}

export function howLaborOrFatigueChangesPerception(ctx: {
  characterProfile: CharacterProfile | null;
  settingProfile: SettingProfile | null;
}): string {
  const dom = ctx.settingProfile?.dominantActivities?.trim();
  const phys = ctx.characterProfile?.behavioralPatterns?.trim();
  if (dom) return `Labor context may narrow attention to bodies, timing, and task — ${dom.slice(0, 160)}`;
  if (phys) return `Behavioral load: ${phys.slice(0, 180)}`;
  return "";
}

export function howHungerGriefFearChangeAttention(ctx: {
  characterProfile: CharacterProfile | null;
  memories: CharacterMemory[];
}): string {
  const grief = ctx.memories.some((m) => /loss|grief|dead|gone|hurt/i.test(m.description));
  const fear = profileJsonFieldToSlice(ctx.characterProfile?.fears, 300);
  const parts: string[] = [];
  if (grief) parts.push("Memory field contains grief-markers — attention may snag on absence.");
  if (fear) parts.push(`Named fear tightens scan: ${fear.slice(0, 140)}`);
  return parts.join(" ");
}
