import type { Prisma } from "@prisma/client";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";
import { createBindingIfFreshTx } from "@/lib/narrative-binding";
import { prisma } from "@/lib/prisma";

const NAME_HINTS: { needle: string; slug: string }[] = [
  { needle: "alexis grap", slug: "alexis" },
  { needle: "louise marguerite guedon", slug: "louise" },
  { needle: "françois grap", slug: "francois" },
  { needle: "francois grap", slug: "francois" },
  { needle: "buford isadore grap", slug: "buford" },
  { needle: "grandmother grap", slug: "grandmother" },
  { needle: "the narrator", slug: "narrator" },
  { needle: "narrator", slug: "narrator" },
  { needle: "trichel", slug: "trichel" },
];

function parseModelJson(content: string | null | undefined): unknown {
  if (!content?.trim()) throw new Error("Empty model content.");
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/u, "")
      .trim();
  }
  return JSON.parse(text) as unknown;
}

export type ExtractedEntry = {
  nameHint: string;
  internalAuthoringNotes: string;
  relationalTexture: string | null;
  stressTexture: string | null;
};

function normalizeEntries(raw: unknown): ExtractedEntry[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const arr = o.entries ?? o.characters;
  if (!Array.isArray(arr)) return [];
  const out: ExtractedEntry[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const nameHint = String(r.nameHint ?? r.name ?? "").trim();
    const internalAuthoringNotes = String(r.internalAuthoringNotes ?? r.notes ?? "").trim();
    if (!nameHint || !internalAuthoringNotes) continue;
    out.push({
      nameHint,
      internalAuthoringNotes: internalAuthoringNotes.slice(0, 12_000),
      relationalTexture: r.relationalTexture != null ? String(r.relationalTexture).trim().slice(0, 8000) || null : null,
      stressTexture: r.stressTexture != null ? String(r.stressTexture).trim().slice(0, 8000) || null : null,
    });
  }
  return out;
}

export async function extractSectionXiiiCharacterEntries(text: string): Promise<ExtractedEntry[]> {
  if (!isOpenAIApiKeyConfigured()) return [];
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: getConfiguredModelName(),
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You help authors with a private fiction project. The document may reference personality frameworks.
Rules:
- Do NOT output Enneagram numbers, wings, or type labels (no "type 4", "9w1", etc.).
- Write in plain prose suitable for CharacterProfile fields: relational habits, stress behavior, interior texture.
- JSON only. Array field "entries" with objects: nameHint (string), internalAuthoringNotes (string), relationalTexture (string|null), stressTexture (string|null).
- Cover every major figure named in the text when possible.`,
      },
      {
        role: "user",
        content: `Extract internal character modeling notes from this private guide. No typology numbers or labels.\n\n---\n${text.slice(0, 100_000)}`,
      },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  return normalizeEntries(parseModelJson(content));
}

function scoreNameMatch(personName: string, hint: string): number {
  const pn = personName.toLowerCase().trim();
  const h = hint.toLowerCase().trim();
  if (!pn || !h) return 0;
  if (pn === h) return 100;
  if (pn.includes(h) || h.includes(pn)) return 80;
  const pParts = new Set(pn.split(/\s+/).filter((w) => w.length > 2));
  const hParts = h.split(/\s+/).filter((w) => w.length > 2);
  let n = 0;
  for (const w of hParts) {
    if (pParts.has(w)) n++;
  }
  return n >= 2 ? 70 : n === 1 ? 40 : 0;
}

async function resolvePersonForHint(hint: string): Promise<{ id: string; name: string } | null> {
  const people = await prisma.person.findMany({ select: { id: true, name: true }, take: 400 });
  let best: { id: string; name: string; score: number } | null = null;
  for (const p of people) {
    const s = scoreNameMatch(p.name, hint);
    if (s > (best?.score ?? 0)) best = { ...p, score: s };
  }
  const lower = hint.toLowerCase();
  for (const { needle, slug } of NAME_HINTS) {
    if (!lower.includes(needle)) continue;
    for (const p of people) {
      if (p.name.toLowerCase().includes(slug)) {
        const s = 75;
        if (s > (best?.score ?? 0)) best = { ...p, score: s };
      }
    }
  }
  if (!best || best.score < 40) return null;
  return { id: best.id, name: best.name };
}

function appendField(
  existing: string | null | undefined,
  addition: string,
  maxLen = 24_000,
): string {
  const base = existing?.trim() ?? "";
  const block = addition.trim();
  if (!block) return base;
  const sep = base ? "\n\n" : "";
  const next = `${base}${sep}${block}`.trim();
  return next.length > maxLen ? `${next.slice(0, maxLen)}…` : next;
}

/**
 * Section XIII: enrich CharacterProfile + source→person bindings only. No public DNA rows.
 * Call `extractSectionXiiiCharacterEntries` outside the transaction so the DB is not held during OpenAI.
 */
export async function applySectionXiiiInternalCharacterGuide(
  tx: Prisma.TransactionClient,
  sourceId: string,
  entries: ExtractedEntry[],
): Promise<{ updatedPeople: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  if (entries.length === 0) {
    warnings.push("OpenAI unavailable or empty parse — no character rows updated.");
  }

  const updatedPeople: string[] = [];

  for (const e of entries) {
    const person = await resolvePersonForHint(e.nameHint);
    if (!person) {
      warnings.push(`No Person match for hint "${e.nameHint.slice(0, 80)}"`);
      continue;
    }

    const block = `[Internal guide — Section XIII]\n${e.internalAuthoringNotes}`;
    const relBlock = e.relationalTexture
      ? `\n\n[Internal guide — relational texture]\n${e.relationalTexture}`
      : "";
    const stressBlock = e.stressTexture ? `\n\n[Internal guide — stress texture]\n${e.stressTexture}` : "";

    const existing = await tx.characterProfile.findUnique({ where: { personId: person.id } });
    const mergedNotes = appendField(existing?.notes, block + relBlock + stressBlock);

    await tx.characterProfile.upsert({
      where: { personId: person.id },
      create: {
        personId: person.id,
        notes: mergedNotes,
        enneagramSource: "internal_guide_section_xiii",
        notesOnTypeUse:
          "Internal mapping from Section XIII — typology numbers withheld from public surfaces; use prose fields only.",
      },
      update: {
        notes: mergedNotes,
        enneagramSource: existing?.enneagramSource?.trim() || "internal_guide_section_xiii",
        notesOnTypeUse:
          existing?.notesOnTypeUse?.trim() ||
          "Internal mapping from Section XIII — typology numbers withheld from public surfaces; use prose fields only.",
      },
    });

    await createBindingIfFreshTx(tx, {
      sourceType: "source",
      sourceId,
      targetType: "person",
      targetId: person.id,
      relationship: "influences",
      strength: 3,
      notes: "Internal character guide (admin-only typology discipline).",
    });

    updatedPeople.push(person.name);
  }

  return { updatedPeople, warnings };
}
