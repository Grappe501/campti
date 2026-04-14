/**
 * P2-J — Voice presentation layer (TTS prep).
 *
 * Transforms {@link CharacterResponse} into {@link VoiceReadyText} for providers such as ElevenLabs:
 * **cleanedSpeech** is plain text safe for synthesis; **emotionalCues** are non-spoken hints for style,
 * future SSML, or API-side voice settings. **No network calls** — extend here before wiring HTTP clients.
 */

import type { CharacterResponse } from "@/lib/domain/character-response-contract";

/**
 * Output of the presentation adapter — ready for TTS pipelines without leaking inner monologue as audio.
 */
export type VoiceReadyText = {
  /** Normalized spoken line only (no markdown, minimal stage-aside stripping). */
  cleanedSpeech: string;
  /** Paralinguistic / performance hints (not concatenated into the spoken string). */
  emotionalCues: string[];
};

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Remove common non-spoken artifacts from dialogue-ish strings. */
function cleanSpokenLine(raw: string): string {
  let s = raw.replace(/\r\n/g, "\n").trim();

  // Strip fenced code blocks if a model leaked them into spokenResponse.
  s = s.replace(/^```[\w]*\n?([\s\S]*?)\n?```$/m, "$1").trim();

  // Drop bracketed stage directions, e.g. [pause], [softly].
  s = s.replace(/\[[^\]]{1,120}\]/g, " ");

  // Remove asterisk-wrapped emphasis markers often used in chat UIs.
  s = s.replace(/\*([^*]+)\*/g, "$1");

  // Normalize curly quotes to straight for predictable TTS.
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

  return collapseWhitespace(s);
}

function cueForKnowledgeSource(source: CharacterResponse["knowledgeSource"]): string {
  switch (source) {
    case "known":
      return "stance: grounded (treat as firm in-world claim)";
    case "belief":
      return "stance: interpretive (softer certainty in delivery)";
    case "uncertain":
      return "stance: tentative (leave rhythmic space, avoid hard landing)";
  }
}

/**
 * Map a validated {@link CharacterResponse} to ElevenLabs-oriented text + cues.
 */
export function toVoiceReadyText(response: CharacterResponse): VoiceReadyText {
  const cleanedSpeech = cleanSpokenLine(response.spokenResponse);

  const tone = collapseWhitespace(response.emotionalTone);
  const cues: string[] = [];
  if (tone) cues.push(`tone: ${tone}`);
  cues.push(cueForKnowledgeSource(response.knowledgeSource));

  // Optional: one short inner line as subtext for director/voice UI — never merged into cleanedSpeech.
  const inner = collapseWhitespace(response.internalThought);
  if (inner.length > 0 && inner.length <= 160) {
    cues.push(`subtext (do not speak): ${inner}`);
  } else if (inner.length > 160) {
    cues.push(`subtext (do not speak): ${inner.slice(0, 157)}…`);
  }

  return { cleanedSpeech, emotionalCues: cues };
}
