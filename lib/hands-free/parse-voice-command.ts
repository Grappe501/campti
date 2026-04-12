/** Re-exports the voice intent engine (single place for imports). */
export {
  interpretVoiceTranscript,
  normalizeTranscript,
  parseVoiceToAction,
} from "@/lib/hands-free/voice-command-engine";
export type { VoiceInterpretation } from "@/lib/hands-free/voice-command-engine";
