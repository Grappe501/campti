"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveAdminPageAgent, type AdminPageAgentDefinition } from "@/lib/admin-page-agents";
import { parseEntityFromAdminPath } from "@/lib/admin-entity-from-path";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function AdminPageAgentPanel() {
  const pathname = usePathname() ?? "/admin";
  if (pathname === "/admin/login") return null;

  const entityRef = useMemo(() => parseEntityFromAdminPath(pathname), [pathname]);

  const [agent, setAgent] = useState<AdminPageAgentDefinition>(() => resolveAdminPageAgent(pathname));
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAgent(resolveAdminPageAgent(pathname));
    setMessages([]);
    setError(null);
  }, [pathname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pathname,
          entity: entityRef ?? undefined,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pathname, entityRef]);

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-amber-300/90 bg-gradient-to-r from-amber-100 to-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-lg ring-2 ring-amber-200/60 transition hover:from-amber-200 hover:to-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 md:bottom-8 md:right-8"
        aria-expanded={open}
        aria-controls="admin-page-agent-panel"
      >
        <span className="text-base" aria-hidden>
          ◆
        </span>
        <span className="hidden sm:inline">Specialist</span>
        <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs font-medium text-stone-600">
          {agent.name}
        </span>
      </button>

      {/* Panel */}
      {open ? (
        <div
          id="admin-page-agent-panel"
          className="fixed inset-x-0 bottom-0 z-40 flex max-h-[min(85vh,560px)] flex-col border-t border-stone-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:inset-x-auto md:bottom-24 md:right-8 md:w-[min(100vw-2rem,420px)] md:rounded-xl md:border md:shadow-xl"
        >
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-stone-100 bg-stone-50/80 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">Page specialist</p>
              <p className="text-sm font-medium text-stone-900">{agent.name}</p>
              <p className="mt-0.5 text-xs text-stone-600">{agent.specialty}</p>
              <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-stone-500">
                <span className="font-medium text-stone-600">Impacts:</span> {agent.impacts}
              </p>
              {entityRef ? (
                <p className="mt-2 rounded-md bg-stone-100/80 px-2 py-1 font-mono text-[10px] text-stone-600">
                  Entity: {entityRef.type} · {entityRef.id.slice(0, 12)}
                  {entityRef.id.length > 12 ? "…" : ""}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-stone-500 hover:bg-stone-200/80"
              aria-label="Close specialist panel"
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="space-y-3 text-sm text-stone-700">
                <p>
                  Ask about this page, what it connects to, or how a change might ripple. Use a suggested prompt
                  below or type your own.
                </p>
                <ul className="space-y-2">
                  {agent.suggestedPrompts.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => setInput(q)}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs text-stone-800 transition hover:border-amber-300 hover:bg-amber-50/50"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="space-y-4">
                {messages.map((m, i) => (
                  <li
                    key={i}
                    className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "ml-4 bg-amber-50 text-stone-900 ring-1 ring-amber-100"
                        : "mr-2 bg-stone-100 text-stone-800"
                    }`}
                  >
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                      {m.role === "user" ? "You" : agent.name}
                    </span>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </li>
                ))}
                {loading ? (
                  <li className="text-sm italic text-stone-500">Thinking…</li>
                ) : null}
                <div ref={bottomRef} />
              </ul>
            )}
            {error ? (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-800 ring-1 ring-red-100">{error}</p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-stone-100 bg-white p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Ask the specialist…"
                rows={2}
                className="min-h-[44px] flex-1 resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="shrink-0 self-end rounded-lg bg-amber-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-[10px] text-stone-500">
              Path: <code className="rounded bg-stone-100 px-1">{pathname}</code> · AI assists judgment; verify claims and
              record types.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
