/** Web Speech API — Chromium-first; Safari/Firefox vary. */

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

export function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

/**
 * Optional: bias recognition toward short reader commands (Chromium / webkit).
 * Safe no-op if the API is missing or rejects the grammar.
 */
export function attachReaderCommandGrammars(rec: SpeechRecognitionLike): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      webkitSpeechGrammarList?: new () => {
        addFromString: (grammar: string, weight: number) => void;
      };
    };
    const GL = w.webkitSpeechGrammarList;
    if (!GL) return;
    const list = new GL();
    list.addFromString(
      "#JSGF V1.0; grammar campti; public <c> = next | forward | back | previous | brighter | dimmer | chapter | page | scroll | turn ;",
      1,
    );
    (rec as unknown as { grammars: typeof list }).grammars = list;
  } catch {
    /* grammars are optional; many builds ignore them */
  }
}
