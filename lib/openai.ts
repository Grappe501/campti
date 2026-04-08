import OpenAI from "openai";
import {
  DEFAULT_OPENAI_MODEL,
} from "@/lib/ingestion-constants";

let client: OpenAI | null = null;

export function isOpenAIApiKeyConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * Model name for extraction: OPENAI_MODEL when set, otherwise DEFAULT_OPENAI_MODEL.
 */
export function getConfiguredModelName(): string {
  const m = process.env.OPENAI_MODEL?.trim();
  return m && m.length > 0 ? m : DEFAULT_OPENAI_MODEL;
}

/**
 * Throws a clear error when extraction is attempted without a key.
 */
export function requireOpenAIApiKeyForExtraction(): void {
  if (!isOpenAIApiKeyConfigured()) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your environment to run real extraction.",
    );
  }
}

/**
 * Lazy singleton for the OpenAI client. Do not use until a key is known to exist.
 */
export function getOpenAIClient(): OpenAI {
  requireOpenAIApiKeyForExtraction();
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}
