/** Client-side reader “flight deck” preferences (scene / passage view). */

export const READER_UI_STORAGE_KEY = "campti-reader-ui-v1";

export type ReaderFlowMode = "scroll" | "paragraph";
export type ReaderColumnMode = 1 | 2;

export type ReaderUiPreferences = {
  fontStep: number;
  columns: ReaderColumnMode;
  flow: ReaderFlowMode;
  optionsBarExpanded: boolean;
  /** When ElevenLabs / ambient beds ship, reader can prefer a quiet mix. */
  ambientBedMuted: boolean;
  /** Display brightness: 0 = dimmest, 6 = brightest (voice: brighter / dimmer). */
  brightnessStep: number;
};

const DEFAULTS: ReaderUiPreferences = {
  fontStep: 2,
  columns: 1,
  flow: "scroll",
  optionsBarExpanded: true,
  ambientBedMuted: false,
  brightnessStep: 3,
};

const FONT_STEPS_REM = [0.95, 1.02, 1.1, 1.2, 1.32];

export function fontRemForStep(step: number): number {
  const i = Math.max(0, Math.min(FONT_STEPS_REM.length - 1, Math.round(step)));
  return FONT_STEPS_REM[i]!;
}

/** CSS filter value for passage brightness (0–6). */
export function brightnessFilterForStep(step: number): string {
  const s = Math.max(0, Math.min(6, Math.round(step)));
  const b = 0.72 + s * 0.055;
  return `brightness(${b})`;
}

export function loadReaderUiPreferences(): ReaderUiPreferences {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(READER_UI_STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<ReaderUiPreferences>;
    return {
      ...DEFAULTS,
      ...p,
      fontStep:
        typeof p.fontStep === "number" && p.fontStep >= 0 && p.fontStep < FONT_STEPS_REM.length
          ? p.fontStep
          : DEFAULTS.fontStep,
      columns: p.columns === 2 ? 2 : 1,
      flow: p.flow === "paragraph" ? "paragraph" : "scroll",
      optionsBarExpanded: typeof p.optionsBarExpanded === "boolean" ? p.optionsBarExpanded : true,
      ambientBedMuted: typeof p.ambientBedMuted === "boolean" ? p.ambientBedMuted : false,
      brightnessStep:
        typeof p.brightnessStep === "number" && p.brightnessStep >= 0 && p.brightnessStep <= 6
          ? Math.round(p.brightnessStep)
          : DEFAULTS.brightnessStep,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveReaderUiPreferences(p: ReaderUiPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(READER_UI_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export { FONT_STEPS_REM };
