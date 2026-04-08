/**
 * Optional OpenAI assists — refine or reorganize existing rows only; callers must persist explicitly.
 */
import { prisma } from "@/lib/prisma";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";

function parseJsonObject(content: string | null | undefined): Record<string, unknown> {
  if (!content?.trim()) throw new Error("Empty response.");
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/u, "")
      .trim();
  }
  const v = JSON.parse(text) as unknown;
  if (!v || typeof v !== "object") throw new Error("Expected JSON object.");
  return v as Record<string, unknown>;
}

export async function enhanceNarrativeRule(ruleId: string): Promise<{
  title: string;
  description: string;
  notes: string;
}> {
  if (!isOpenAIApiKeyConfigured()) {
    throw new Error("OPENAI_API_KEY not configured.");
  }
  const rule = await prisma.narrativeRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new Error("Rule not found.");

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      {
        role: "system",
        content:
          "You refine narrative rule text for an author's private tool. Do not invent new canon facts. Preserve uncertainty. Return JSON: { title, description, notes } where notes explains what you changed.",
      },
      {
        role: "user",
        content: `Refine for clarity and enforceability (no new claims):\nTITLE: ${rule.title}\nDESCRIPTION:\n${rule.description}\nNOTES: ${rule.notes ?? ""}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const o = parseJsonObject(completion.choices[0]?.message?.content);
  return {
    title: String(o.title ?? rule.title).slice(0, 500),
    description: String(o.description ?? rule.description).slice(0, 50_000),
    notes: String(o.notes ?? "").slice(0, 2000),
  };
}

export async function enhanceTheme(themeId: string): Promise<{
  name: string;
  description: string;
  notes: string;
}> {
  if (!isOpenAIApiKeyConfigured()) {
    throw new Error("OPENAI_API_KEY not configured.");
  }
  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  if (!theme) throw new Error("Theme not found.");

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      {
        role: "system",
        content:
          "You reorganize theme documentation. Do not assert facts not in the text. Return JSON: { name, description, notes }.",
      },
      {
        role: "user",
        content: `THEME NAME: ${theme.name}\nDESCRIPTION:\n${theme.description}\nNOTES: ${theme.notes ?? ""}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const o = parseJsonObject(completion.choices[0]?.message?.content);
  return {
    name: String(o.name ?? theme.name).slice(0, 500),
    description: String(o.description ?? theme.description).slice(0, 50_000),
    notes: String(o.notes ?? "").slice(0, 2000),
  };
}

export async function inferMissingSymbols(sourceId: string): Promise<
  { name: string; meaningPrimary: string; certainty: string; uncertaintyNote: string }[]
> {
  if (!isOpenAIApiKeyConfigured()) {
    throw new Error("OPENAI_API_KEY not configured.");
  }
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { sourceText: true },
  });
  if (!source?.sourceText) throw new Error("Source or text missing.");

  const body =
    source.sourceText.normalizedText?.trim() || source.sourceText.rawText?.trim() || "";
  const symRows = await prisma.symbol.findMany({
    where: { sourceId },
    select: { name: true },
  });
  const existing = symRows.map((s) => s.name).join(", ");

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: getConfiguredModelName(),
    messages: [
      {
        role: "system",
        content:
          "List symbol candidates ONLY if the text supports them. Return JSON { symbols: [{ name, meaningPrimary, certainty, uncertaintyNote }] }. certainty: high|medium|low|interpretive. Max 12 items.",
      },
      {
        role: "user",
        content: `Existing symbol names (do not duplicate): ${existing}\n\nTEXT:\n${body.slice(0, 100_000)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const o = parseJsonObject(completion.choices[0]?.message?.content);
  const arr = Array.isArray(o.symbols) ? o.symbols : [];
  const out: { name: string; meaningPrimary: string; certainty: string; uncertaintyNote: string }[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = String(r.name ?? "").trim();
    const meaningPrimary = String(r.meaningPrimary ?? "").trim();
    if (!name || !meaningPrimary) continue;
    out.push({
      name: name.slice(0, 200),
      meaningPrimary: meaningPrimary.slice(0, 5000),
      certainty: String(r.certainty ?? "interpretive").slice(0, 80),
      uncertaintyNote: String(r.uncertaintyNote ?? "").slice(0, 2000),
    });
  }
  return out.slice(0, 12);
}

export async function suggestBindings(sourceId: string): Promise<
  {
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    relationship: string;
    rationale: string;
    confidence: number;
  }[]
> {
  const { inferBindingsFromText } = await import("@/lib/narrative-binding");
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { sourceText: true },
  });
  if (!source?.sourceText) return [];
  const text =
    source.sourceText.normalizedText?.trim() || source.sourceText.rawText?.trim() || "";
  const inferred = await inferBindingsFromText(text);
  return inferred.map((i) => ({
    sourceType: i.sourceType,
    sourceId: i.sourceId,
    targetType: i.targetType,
    targetId: i.targetId,
    relationship: i.relationship,
    rationale: i.rationale,
    confidence: i.confidence,
  }));
}
