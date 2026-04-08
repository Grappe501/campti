"use client";

import { useState, useTransition } from "react";
import { deepDecomposeAssistAction, previewDecomposeSourceAction } from "@/app/actions/fragments";
import type { FragmentAssistResult } from "@/lib/fragment-ai-assist";
import { fragmentTypeLabel } from "@/lib/fragment-types";
import { FragmentType } from "@prisma/client";

type Props = {
  sourceId: string;
};

export function DecomposeToolbar({ sourceId }: Props) {
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<
    | null
    | {
        version: string;
        units: { text: string; suggestedType: string; excerpt: string; chunkLabel?: string }[];
      }
  >(null);
  const [assistMsg, setAssistMsg] = useState<string | null>(null);

  function runPreview(mode: "full" | "chunks") {
    start(async () => {
      setAssistMsg(null);
      const fd = new FormData();
      fd.set("sourceId", sourceId);
      fd.set("mode", mode);
      const res = await previewDecomposeSourceAction(fd);
      if (!res.ok) {
        setPreview(null);
        setAssistMsg(`Preview failed: ${res.reason}`);
        return;
      }
      setPreview({ version: res.version, units: res.units });
    });
  }

  function runAssist(mode: "full" | "chunks") {
    start(async () => {
      setAssistMsg(null);
      const fd = new FormData();
      fd.set("sourceId", sourceId);
      fd.set("mode", mode);
      const res: FragmentAssistResult = await deepDecomposeAssistAction(fd);
      if (!res.ok) {
        setAssistMsg(`Assist: ${res.reason}`);
        return;
      }
      setAssistMsg(`Assist returned ${res.units.length} suggested units (preview only).`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => runPreview("full")}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50 disabled:opacity-50"
        >
          Preview split (full text)
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runPreview("chunks")}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50 disabled:opacity-50"
        >
          Preview split (chunks)
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runAssist("full")}
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
        >
          Suggest deeper fragment breakdown (AI hook)
        </button>
      </div>
      {assistMsg ? <p className="text-sm text-stone-600">{assistMsg}</p> : null}
      {preview ? (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-stone-500">
            Preview — {preview.version} — {preview.units.length} units (not saved)
          </p>
          <ul className="mt-4 max-h-96 space-y-4 overflow-y-auto text-sm">
            {preview.units.map((u, i) => (
              <li key={i} className="border-b border-stone-100 pb-4 last:border-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  {u.chunkLabel ? <span>{u.chunkLabel}</span> : null}
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-stone-800">
                    {fragmentTypeLabel(u.suggestedType as FragmentType)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-stone-900">{u.text}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
