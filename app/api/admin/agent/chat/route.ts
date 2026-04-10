import { NextResponse } from "next/server";
import { resolveAdminPageAgent } from "@/lib/admin-page-agents";
import { requireAdminApiAuth } from "@/lib/admin-auth-api";
import { parseEntityFromAdminPath } from "@/lib/admin-entity-from-path";
import { getAdminEntitySummaryForAgent } from "@/lib/admin-entity-summary";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";

export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

type Body = {
  messages: ChatMessage[];
  pathname: string;
  /** Explicit entity (optional); if omitted, derived from pathname when possible. */
  entity?: { type: string; id: string } | null;
};

/**
 * Specialist admin agent chat — server-side only, uses OPENAI_API_KEY.
 * Requires admin session when CAMPTI_ADMIN_PASSWORD is set.
 */
export async function POST(req: Request) {
  const unauthorized = await requireAdminApiAuth(req);
  if (unauthorized) return unauthorized;

  if (!isOpenAIApiKeyConfigured()) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not configured. Add it to `.env` or your host environment (e.g. `OPENAI_API_KEY=sk-...`) and restart the dev server.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pathname = typeof body.pathname === "string" ? body.pathname : "/admin";
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const userTurns = messages.filter((m) => m.role === "user" || m.role === "assistant");
  if (userTurns.length === 0 || !userTurns.some((m) => m.role === "user")) {
    return NextResponse.json(
      { error: "messages[] must include at least one user message" },
      { status: 400 },
    );
  }

  const entity =
    body.entity && typeof body.entity.type === "string" && typeof body.entity.id === "string"
      ? { type: body.entity.type, id: body.entity.id }
      : parseEntityFromAdminPath(pathname);

  let entityBlock = "";
  if (entity) {
    const summary = await getAdminEntitySummaryForAgent(entity.type, entity.id);
    entityBlock = `

Focused entity (from URL / client):
- type: ${entity.type}
- id: ${entity.id}
${summary ? `\nAuthoritative row summary (database):\n${summary}\n` : "\n(No matching row summary — id may be invalid or type not yet supported for hydration.)\n"}`;
  }

  const agent = resolveAdminPageAgent(pathname);

  const system = `${agent.systemPrompt}

Current page path: ${pathname}
Specialist role: ${agent.name} — ${agent.specialty}
Downstream impacts (summary): ${agent.impacts}
${entityBlock}
When the author asks you to "simulate" an outcome, describe structured narrative consequences (what records would need updating, what continuity to check), not literal predictions of history. Do not contradict recordType or source visibility rules above.`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: getConfiguredModelName(),
      messages: [
        { role: "system", content: system },
        ...userTurns.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    return NextResponse.json({
      reply,
      agentId: agent.id,
      agentName: agent.name,
      entity: entity ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OpenAI request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
