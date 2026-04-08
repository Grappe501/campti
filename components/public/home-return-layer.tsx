"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  READING_PROGRESS_STORAGE_KEY,
  type ContinueReadingPayload,
} from "@/lib/reading-progress";

/**
 * Homepage entry: soft memory-aware return line when local reading progress exists.
 */
export function HomeReturnLayer() {
  const [payload, setPayload] = useState<ContinueReadingPayload | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(READING_PROGRESS_STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as ContinueReadingPayload;
      if (p?.sceneId && p?.chapterId) setPayload(p);
    } catch {
      /* ignore */
    }
  }, []);

  if (!payload) return null;

  const line =
    payload.returnHookLine?.trim() ||
    payload.continuationHeadline?.trim() ||
    "Return to where you left it";

  return (
    <div className="mx-auto max-w-2xl px-6 pb-10 sm:px-10">
      <div className="rounded-lg border border-stone-800/90 bg-stone-950/40 px-6 py-5 transition duration-500 ease-out sm:px-8">
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
          You were here last
        </p>
        <Link
          href={`/read/scenes/${payload.sceneId}`}
          className="mt-2 block font-serif text-lg text-amber-100/85 transition duration-500 hover:text-amber-50"
        >
          {line}
        </Link>
        <p className="mt-2 text-xs text-stone-600">
          {payload.chapterTitle}
          {payload.sceneLabel ? <span className="text-stone-700"> · {payload.sceneLabel}</span> : null}
        </p>
      </div>
    </div>
  );
}
