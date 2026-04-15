"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { actionReconcileReaderContinuity } from "@/app/actions/reader-continuity";
import type { ReaderContinuityCacheSnapshot } from "@/lib/domain/reader-continuity";
import {
  READING_PROGRESS_STORAGE_KEY,
  type ContinueReadingPayload,
} from "@/lib/reading-progress";

const HEADLINE_POOL = [
  "The world is still holding this thread",
  "Return to the same narrative weather",
  "This passage remembers your last step",
  "The moment is still alive",
  "Re-enter the river of the story",
  "Pick up the unresolved thread",
];

function hashPick(seed: string, pool: string[]): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length]!;
}

function toContinuityCacheSnapshot(payload: ContinueReadingPayload | null): ReaderContinuityCacheSnapshot | null {
  if (!payload) return null;
  return {
    chapterId: payload.chapterId,
    sceneId: payload.sceneId,
    chapterTitle: payload.chapterTitle,
    sceneLabel: payload.sceneLabel,
    savedAtEpochMs: payload.savedAt,
    scrollAnchorY: payload.scrollBySceneId?.[payload.sceneId] ?? null,
    scrollBySceneId: payload.scrollBySceneId ?? null,
    lastMode:
      payload.lastMode === "reading"
        ? "read"
        : payload.lastMode === "immersive"
          ? "feel"
          : payload.lastMode ?? null,
    continuationHeadline: payload.continuationHeadline ?? null,
    mood: payload.mood ?? null,
    returnHookLine: payload.returnHookLine ?? null,
  };
}

export function ContinueReadingBanner() {
  const [payload, setPayload] = useState<ContinueReadingPayload | null>(null);

  useEffect(() => {
    void (async () => {
      let localPayload: ContinueReadingPayload | null = null;
      try {
        const raw = localStorage.getItem(READING_PROGRESS_STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw) as ContinueReadingPayload;
          if (p?.sceneId && p?.chapterId) {
            localPayload = p;
            queueMicrotask(() => setPayload(p));
          }
        }
      } catch {
        /* ignore */
      }
      try {
        const reconciliation = await actionReconcileReaderContinuity(
          toContinuityCacheSnapshot(localPayload)
        );
        const canonicalSceneId = reconciliation?.continuity.position.sceneId;
        if (!canonicalSceneId) return;
        if (!localPayload || localPayload.sceneId !== canonicalSceneId) {
          const patched: ContinueReadingPayload = {
            chapterId: reconciliation.continuity.position.chapterId ?? localPayload?.chapterId ?? "",
            sceneId: canonicalSceneId,
            chapterTitle: localPayload?.chapterTitle ?? "Continue reading",
            sceneLabel: localPayload?.sceneLabel ?? "Return to the latest scene",
            savedAt: Date.now(),
            continuationHeadline: localPayload?.continuationHeadline,
            mood: localPayload?.mood ?? null,
            returnHookLine: localPayload?.returnHookLine,
            lastMode: localPayload?.lastMode,
            scrollBySceneId: localPayload?.scrollBySceneId,
          };
          localStorage.setItem(READING_PROGRESS_STORAGE_KEY, JSON.stringify(patched));
          queueMicrotask(() => setPayload(patched));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const headline = useMemo(() => {
    if (!payload) return "";
    if (payload.returnHookLine?.trim()) return payload.returnHookLine.trim();
    if (payload.continuationHeadline?.trim()) return payload.continuationHeadline.trim();
    return hashPick(payload.sceneId, HEADLINE_POOL);
  }, [payload]);

  if (!payload) return null;

  return (
    <aside className="campti-return-banner rounded-lg border border-amber-900/20 bg-stone-900/35 px-6 py-5 transition duration-500 ease-out sm:px-8">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
        Return state
      </p>
      <Link
        href={`/read/scenes/${payload.sceneId}`}
        className="mt-2 block font-serif text-xl text-amber-100/90 transition duration-500 ease-out hover:text-amber-50"
      >
        {headline}
      </Link>
      <p className="mt-2 text-xs leading-relaxed text-stone-500">
        <span className="text-stone-400">{payload.chapterTitle}</span>
        {payload.sceneLabel ? (
          <>
            <span className="text-stone-600"> · </span>
            <span>{payload.sceneLabel}</span>
          </>
        ) : null}
      </p>
      {payload.lastMode && payload.lastMode !== "reading" ? (
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-stone-600">
          {payload.lastMode === "immersive"
            ? "Feel"
            : payload.lastMode === "guided"
              ? "Guided"
              : payload.lastMode === "listen"
                ? "Listen"
                : "Read"}{" "}
          mode will restore when you return
        </p>
      ) : null}
      {payload.mood?.trim() ? (
        <p className="mt-3 text-xs italic text-stone-600">{payload.mood.trim()}</p>
      ) : null}
    </aside>
  );
}
