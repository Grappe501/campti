import type { HandsFreeAction } from "@/lib/hands-free/types";

/** Result of interpreting a speech segment (may be a full phrase or one hypothesis). */
export type VoiceInterpretation = {
  action: HandsFreeAction | null;
  /** Best-effort label for UI / logging. `stop_voice` = user asked to turn voice off. */
  label: string | null;
};

/** How the interpreter classified the utterance (for logging / tuning). */
export type InterpretSource = "stop" | "chapter" | "navigation" | "display" | "scroll" | "none";

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
};

const ORDINAL_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
  thirteenth: 13,
  fourteenth: 14,
  fifteenth: 15,
};

/** Normalize for matching: lowercase, collapse punctuation, keep word boundaries. */
export function normalizeTranscript(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[''`´]/g, "'")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasNegatedNavigation(t: string): boolean {
  return /\b(don't|dont|do not|never|not|no)\s+(you\s+)?(go\s+)?(to\s+)?(the\s+)?(next|back|forward|previous)\b/.test(
    t,
  );
}

/**
 * Expand spoken numbers inside a fragment, e.g. "chapter three" → "chapter 3".
 * Handles 0–20 and round tens for chapter-sized refs.
 */
function expandSpokenNumbers(t: string): string {
  let out = ` ${t} `;
  for (const [w, n] of Object.entries(NUMBER_WORDS)) {
    out = out.replace(new RegExp(`\\b${w}\\b`, "g"), ` ${n} `);
  }
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

function extractChapterNumber(raw: string): number | null {
  const x = normalizeTranscript(raw);
  if (hasNegatedNavigation(x)) return null;

  const digit =
    x.match(/\b(?:go to|open|jump to|show|load|take me to)\s+chapter\s+(\d{1,3})\b/) ||
    x.match(/\b(?:go to|open|jump to)\s+(?:book\s+)?chapter\s+(\d{1,3})\b/) ||
    x.match(/\bchapter\s+(?:number\s+)?(\d{1,3})\b/) ||
    x.match(/\b(\d{1,3})(?:st|nd|rd|th)?\s+chapter\b/) ||
    x.match(/\bch\.?\s*(\d{1,3})\b/) ||
    x.match(/\bchapter\s+#\s*(\d{1,3})\b/);

  if (digit?.[1]) {
    const n = parseInt(digit[1], 10);
    if (n >= 1 && n <= 999) return n;
  }

  const expanded = expandSpokenNumbers(x);
  const afterExpand =
    expanded.match(/\b(?:go to|open|jump to|show|load)\s+chapter\s+(\d{1,3})\b/) ||
    expanded.match(/\bchapter\s+(\d{1,3})\b/);
  if (afterExpand?.[1]) {
    const n = parseInt(afterExpand[1], 10);
    if (n >= 1 && n <= 999) return n;
  }

  for (const [word, n] of Object.entries(ORDINAL_WORDS)) {
    const re = new RegExp(
      `\\b(?:the\\s+)?${word}\\s+chapter\\b|\\bchapter\\s+(?:number\\s+)?${word}\\b`,
    );
    if (re.test(x) || re.test(expanded)) return n;
  }

  return null;
}

function isStopCommand(t: string): boolean {
  return /\b(stop listening|stop voice|mute commands|turn off voice|disable voice|voice off|quiet mode|end voice|cancel listening)\b/.test(
    t,
  );
}

const NEXT_RE =
  /\b(continue|continuing|move on|moving on|keep going|carry on|proceed|advance|skip ahead|skip|onward|onwards|ahead|forward|forwards)\b/;
const NEXT_PHRASE_RE =
  /\b(next (?:page|passage|beat|scene|section|part|chunk|screen|one)|turn (?:the )?page(?:s)?(?: forward)?|page forward|flip(?: forward| the page)?|read (?:on|more|ahead)|go (?:to |ahead )?next|more please|keep reading)\b/;
const PREV_RE =
  /\b(go back|step back|rewind|earlier|back up|backwards|backward|return|reverse)\b/;
const PREV_PHRASE_RE =
  /\b(previous (?:page|passage|beat|scene|section|part|one)|last (?:page|passage|beat|scene|chunk)|page back|turn back(?: the page)?|flip back|go (?:to )?previous)\b/;

function matchNext(t: string): boolean {
  if (hasNegatedNavigation(t)) return false;
  if (NEXT_PHRASE_RE.test(t) || NEXT_RE.test(t)) return true;
  if (/\b(go (?:to )?next)\b/.test(t)) return true;
  return false;
}

function matchPrevious(t: string): boolean {
  if (hasNegatedNavigation(t)) return false;
  if (PREV_PHRASE_RE.test(t) || PREV_RE.test(t)) return true;
  return false;
}

export function actionKey(action: HandsFreeAction): string {
  if (action.type === "goToChapter") return `goToChapter:${action.chapterNumber}`;
  return action.type;
}

/**
 * True when the transcript might need merging with a following chunk (e.g. "go to chapter" + "five").
 */
export function looksLikeIncompleteChapterCommand(raw: string): boolean {
  const t = normalizeTranscript(raw);
  if (!t) return false;
  if (/\bchapter\s+(\d{1,3})\b/.test(t)) return false;
  if (/\bch\.?\s*\d{1,3}\b/.test(t)) return false;
  if (
    /\b(go to|jump to|open|show|load|take me to)\s+chapter\s*$/.test(t) ||
    /\bchapter\s+(number\s*)?$/.test(t) ||
    /\b(open|show)\s+the\s+chapter\s*$/.test(t)
  ) {
    return true;
  }
  return false;
}

/**
 * Fast path for **interim** results: only fires on short, unambiguous navigators.
 * Reduces perceived latency for "next" / "back" before the engine finalizes the utterance.
 */
export function tryInterimNavigationIntent(raw: string): VoiceInterpretation | null {
  const t = normalizeTranscript(raw);
  if (!t || t.length > 44) return null;
  if (hasNegatedNavigation(t)) return null;
  if (isStopCommand(t)) return null;

  // Single-token or tight phrase — safe before finals land
  if (t === "next" || t === "forward" || t === "ahead" || t === "onward" || t === "skip") {
    return { action: { type: "next" }, label: "next" };
  }
  if (t === "back" || t === "previous" || t === "reverse") {
    return { action: { type: "previous" }, label: "previous" };
  }

  if (/^(turn (the )?page|page forward|flip|next page|read on)\s*[.!?]?$/i.test(t)) {
    return { action: { type: "next" }, label: "next" };
  }
  if (/^(go back|page back|previous page|last page)\s*[.!?]?$/i.test(t)) {
    return { action: { type: "previous" }, label: "previous" };
  }

  if (/^brighter\s*[.!?]?$/i.test(t)) {
    return { action: { type: "brighter" }, label: "brighter" };
  }
  if (/^dimmer\s*[.!?]?$/i.test(t)) {
    return { action: { type: "dimmer" }, label: "dimmer" };
  }

  return null;
}

/**
 * Stronger intent resolution: ordered rules (specific → general), number-word expansion,
 * and broader natural phrasing.
 */
export function interpretVoiceTranscript(raw: string): VoiceInterpretation {
  const t = normalizeTranscript(raw);
  if (!t) return { action: null, label: null };

  if (isStopCommand(t)) {
    return { action: null, label: "stop_voice" };
  }

  const ch = extractChapterNumber(raw);
  if (ch != null) {
    return { action: { type: "goToChapter", chapterNumber: ch }, label: `chapter ${ch}` };
  }

  // "next chapter" with no chapter number → advance reading (same as next scene)
  if (/\bnext\s+chapter\b/.test(t) && !hasNegatedNavigation(t)) {
    const ex = expandSpokenNumbers(t);
    if (!/\bchapter\s+(?:number\s*)?(\d{1,3})\b/.test(ex)) {
      return { action: { type: "next" }, label: "next" };
    }
  }

  if (matchNext(t) || t === "next") {
    return { action: { type: "next" }, label: "next" };
  }

  if (matchPrevious(t) || t === "back" || t === "previous") {
    return { action: { type: "previous" }, label: "previous" };
  }

  if (
    /\b(brighter|brighten|more light|lighter|increase brightness|up the brightness|raise brightness|higher brightness)\b/.test(
      t,
    )
  ) {
    return { action: { type: "brighter" }, label: "brighter" };
  }

  if (
    /\b(dimmer|dim|darker|less light|lower brightness|down the brightness|reduce brightness|softer light)\b/.test(t)
  ) {
    return { action: { type: "dimmer" }, label: "dimmer" };
  }

  if (
    /\b(zoom in|enlarge text|larger text|bigger (?:text|type|font)|increase (?:text|font|size)|magnify)\b/.test(t)
  ) {
    return { action: { type: "zoomIn" }, label: "zoomIn" };
  }

  if (
    /\b(zoom out|shrink text|smaller text|smaller (?:type|font)|decrease (?:text|font|size)|reduce text size)\b/.test(
      t,
    )
  ) {
    return { action: { type: "zoomOut" }, label: "zoomOut" };
  }

  if (/\b(scroll down|page down|scroll (?:the )?page down|move down)\b/.test(t)) {
    return { action: { type: "scrollDown" }, label: "scrollDown" };
  }

  if (/\b(scroll up|page up|scroll (?:the )?page up|move up)\b/.test(t)) {
    return { action: { type: "scrollUp" }, label: "scrollUp" };
  }

  return { action: null, label: null };
}

/** @deprecated use interpretVoiceTranscript */
export function parseVoiceToAction(text: string): HandsFreeAction | null {
  const { action, label } = interpretVoiceTranscript(text);
  if (label === "stop_voice") return null;
  return action;
}
