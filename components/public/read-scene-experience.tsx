"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  recordReaderImprintAction,
  recordVoiceListenSeconds,
  syncReaderStateFromClient,
} from "@/app/actions/reader-memory";
import { HandsFreePanel } from "@/components/read/hands-free-panel";
import { ReaderOptionsBar } from "@/components/read/reader-options-bar";
import { AtmosphereBlock } from "@/components/public/atmosphere-block";
import { AtmosphereLayer } from "@/components/public/AtmosphereLayer";
import { AudioTeaser } from "@/components/public/audio-teaser";
import { ExploreDeeperCard } from "@/components/public/explore-deeper-card";
import { ImmersiveErrorBoundary } from "@/components/public/immersive-error-boundary";
import { ImmersiveSceneReader } from "@/components/public/ImmersiveSceneReader";
import {
  LinkedReadingBlocks,
  type ReadingLinkEntity,
} from "@/components/public/linked-reading-blocks";
import { PremiumDepthGate } from "@/components/public/premium-depth-gate";
import {
  PublicAudioPlayer,
  type PublicAudioTab,
} from "@/components/public/public-audio-player";
import { SidePanel, type SidePanelEntity } from "@/components/public/SidePanel";
import type {
  PublicSceneNavigation,
  PublicSceneReaderPack,
  PublicSceneViewModel,
} from "@/lib/public-data";
import type { PublicPerceptionExperiencePayload } from "@/lib/public-experience-rendering";
import { placeTypeReaderLabel } from "@/lib/read-labels";
import {
  EXPERIENCE_MODE_STORAGE_KEY,
  IMMERSIVE_MODE_STORAGE_KEY,
  READER_RHYTHM_STORAGE_KEY,
  READING_PROGRESS_STORAGE_KEY,
  type ContinueReadingPayload,
  type PublicExperienceMode,
} from "@/lib/reading-progress";
import type { PublicSceneImmersion } from "@/lib/public-scene-immersion";
import { ambientSrcForKey } from "@/lib/public-scene-immersion";
import { IMMERSIVE_TONE_PRESETS } from "@/lib/immersive-presets";
import { splitReadingBlocks } from "@/lib/reading-blocks";
import {
  loadReaderUiPreferences,
  saveReaderUiPreferences,
  fontRemForStep,
  brightnessFilterForStep,
  FONT_STEPS_REM,
  type ReaderUiPreferences,
} from "@/lib/reader-ui-preferences";
import type { HandsFreeAction } from "@/lib/hands-free/types";

type ReadSceneExperienceProps = {
  data: PublicSceneViewModel;
  immersion: PublicSceneImmersion;
  navigation: PublicSceneNavigation;
  readerPack: PublicSceneReaderPack;
  title: string;
  perceptionPayload?: PublicPerceptionExperiencePayload | null;
  /** Public chapter list for voice “go to chapter N”. */
  chapterIndex?: { id: string; title: string; chapterNumber: number | null }[];
};

/** Matches Prisma `ReaderLastMode` string values (avoid client import of generated enum). */
function mapModeToReaderLastMode(m: PublicExperienceMode): PublicExperienceMode {
  return m;
}

function readStoredMode(): PublicExperienceMode {
  if (typeof window === "undefined") return "reading";
  try {
    const v = localStorage.getItem(EXPERIENCE_MODE_STORAGE_KEY);
    if (v === "reading" || v === "immersive" || v === "guided" || v === "listen") {
      return v;
    }
    const legacy = localStorage.getItem(IMMERSIVE_MODE_STORAGE_KEY);
    if (legacy === "immersive") return "immersive";
  } catch {
    /* ignore */
  }
  return "reading";
}

function buildAudioTabs(
  data: PublicSceneViewModel,
  immersion: PublicSceneImmersion,
): PublicAudioTab[] {
  const tabs: PublicAudioTab[] = [];
  const narrationFromTracks = data.sceneAudioTracks.find(
    (t) => t.assetType === "narration" || t.assetType === "excerpt",
  );
  const narrSrc =
    immersion.narrationSrc?.trim() || narrationFromTracks?.audioUrl?.trim() || "";
  if (narrSrc) {
    tabs.push({
      id: "narration",
      label: "Narration",
      src: narrSrc,
      transcript: narrationFromTracks?.transcript ?? null,
      syncSegments: narrationFromTracks?.syncSegments?.length
        ? narrationFromTracks.syncSegments
        : null,
    });
  }
  const ambientTrack = data.sceneAudioTracks.find(
    (t) => t.assetType === "ambient_mix" || t.assetType === "immersive_mix",
  );
  const ambSrc =
    immersion.ambientMixSrc?.trim() ||
    ambientTrack?.audioUrl?.trim() ||
    ambientSrcForKey(immersion.ambientAudioKey) ||
    "";
  if (ambSrc) {
    tabs.push({
      id: "ambient",
      label: "Ambient",
      src: ambSrc,
      transcript: ambientTrack?.transcript ?? null,
    });
  }
  return tabs;
}

export function ReadSceneExperience({
  data,
  immersion,
  navigation,
  readerPack,
  title,
  perceptionPayload = null,
  chapterIndex = [],
}: ReadSceneExperienceProps) {
  const router = useRouter();
  const [mode, setMode] = useState<PublicExperienceMode>("reading");
  const [hydrated, setHydrated] = useState(false);
  const [panel, setPanel] = useState<SidePanelEntity | null>(null);
  const [depthOpen, setDepthOpen] = useState(false);
  const [readerPrefs, setReaderPrefs] = useState<ReaderUiPreferences>(() => ({
    fontStep: 2,
    columns: 1,
    flow: "scroll",
    optionsBarExpanded: true,
    ambientBedMuted: false,
    brightnessStep: 3,
  }));
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const scrollPersistRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastListenImprintAtRef = useRef(0);

  useEffect(() => {
    setMode(readStoredMode());
    setReaderPrefs(loadReaderUiPreferences());
    setHydrated(true);
  }, []);

  useEffect(() => {
    saveReaderUiPreferences(readerPrefs);
  }, [readerPrefs]);

  useEffect(() => {
    setParagraphIndex(0);
  }, [data.scene.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(READING_PROGRESS_STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as ContinueReadingPayload;
      if (p.sceneId !== data.scene.id) return;
      const y = p.scrollBySceneId?.[data.scene.id];
      if (y != null && y > 40) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "auto" });
        });
      }
    } catch {
      /* ignore */
    }
  }, [data.scene.id]);

  const persistMode = useCallback((m: PublicExperienceMode) => {
    setMode(m);
    try {
      localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, m);
      localStorage.setItem(IMMERSIVE_MODE_STORAGE_KEY, m === "immersive" ? "immersive" : "reading");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (scrollPersistRef.current) clearTimeout(scrollPersistRef.current);
      scrollPersistRef.current = setTimeout(() => {
        try {
          const raw = localStorage.getItem(READING_PROGRESS_STORAGE_KEY);
          const prev = raw ? (JSON.parse(raw) as ContinueReadingPayload) : null;
          const base: ContinueReadingPayload =
            prev && prev.sceneId === data.scene.id
              ? prev
              : {
                  chapterId: data.chapter.id,
                  sceneId: data.scene.id,
                  chapterTitle: data.chapter.title,
                  sceneLabel: title,
                  savedAt: Date.now(),
                };
          const scrollBySceneId = {
            ...(base.scrollBySceneId ?? {}),
            [data.scene.id]: Math.round(window.scrollY),
          };
          localStorage.setItem(
            READING_PROGRESS_STORAGE_KEY,
            JSON.stringify({ ...base, scrollBySceneId, lastMode: mode }),
          );
        } catch {
          /* ignore */
        }
      }, 420);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollPersistRef.current) clearTimeout(scrollPersistRef.current);
    };
  }, [data.chapter.id, data.chapter.title, data.scene.id, mode, title]);

  useEffect(() => {
    const rhythmAuto = (() => {
      try {
        return localStorage.getItem(READER_RHYTHM_STORAGE_KEY) !== "0";
      } catch {
        return true;
      }
    })();
    const t = window.setTimeout(() => {
      void syncReaderStateFromClient({
        lastSceneId: data.scene.id,
        lastMetaSceneId: data.metaSceneId,
        lastCharacterId: data.povPerson?.id ?? null,
        lastPlaceId: data.primaryPlace?.id ?? null,
        lastSymbolId: data.relatedSymbols[0]?.id ?? null,
        lastMode: mapModeToReaderLastMode(mode),
        scrollAnchorY: typeof window !== "undefined" ? Math.round(window.scrollY) : null,
        rhythmAuto,
        continuationHeadline: readerPack.continuation.headline,
        lastScrollKey: `${data.scene.id}:${mode}`,
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [
    data.metaSceneId,
    data.povPerson?.id,
    data.primaryPlace?.id,
    data.relatedSymbols[0]?.id,
    data.scene.id,
    mode,
    readerPack.continuation.headline,
  ]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        void recordReaderImprintAction({
          entityType: "scene",
          entityId: data.scene.id,
          imprintType: "lingered",
          weight: 2,
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [data.scene.id]);

  useEffect(() => {
    const focus =
      mode === "immersive" || mode === "guided" || mode === "listen";
    if (typeof document === "undefined") return;
    if (focus) document.documentElement.setAttribute("data-campti-read-focus", "1");
    else document.documentElement.removeAttribute("data-campti-read-focus");
    return () => document.documentElement.removeAttribute("data-campti-read-focus");
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(READING_PROGRESS_STORAGE_KEY);
      const prevScroll = raw
        ? (JSON.parse(raw) as ContinueReadingPayload).scrollBySceneId
        : undefined;
      const payload: ContinueReadingPayload = {
        chapterId: data.chapter.id,
        sceneId: data.scene.id,
        chapterTitle: data.chapter.title,
        sceneLabel: title,
        savedAt: Date.now(),
        continuationHeadline: readerPack.continuation.headline,
        mood: readerPack.continuation.mood,
        returnHookLine: readerPack.continuation.headline,
        lastMode: mode,
        scrollBySceneId: prevScroll,
        rhythmAuto: (() => {
          try {
            return localStorage.getItem(READER_RHYTHM_STORAGE_KEY) !== "0";
          } catch {
            return true;
          }
        })(),
      };
      localStorage.setItem(READING_PROGRESS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [
    data.chapter.id,
    data.chapter.title,
    data.scene.id,
    readerPack.continuation.headline,
    readerPack.continuation.mood,
    title,
    mode,
  ]);

  const onListenDelta = useCallback(
    (deltaSeconds: number) => {
      if (deltaSeconds <= 0) return;
      if (data.povPerson?.id) {
        void recordVoiceListenSeconds({
          personId: data.povPerson.id,
          deltaSeconds,
        });
      }
      const now = Date.now();
      if (now - lastListenImprintAtRef.current > 75_000 && deltaSeconds >= 4) {
        lastListenImprintAtRef.current = now;
        void recordReaderImprintAction({
          entityType: "scene",
          entityId: data.scene.id,
          imprintType: "listened",
          weight: 2,
        });
      }
    },
    [data.povPerson?.id, data.scene.id],
  );

  useEffect(() => {
    if (mode !== "listen") return;
    if (typeof window === "undefined") return;
    const id = window.setTimeout(() => {
      document.getElementById("scene-audio")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(id);
  }, [mode]);

  const audioTabs = useMemo(() => buildAudioTabs(data, immersion), [data, immersion]);
  const hasAudio = audioTabs.length > 0;
  const narrationTab = audioTabs.find((t) => t.id === "narration");
  const hasReadWithVoice = Boolean(narrationTab?.syncSegments?.length);

  const linkEntities: ReadingLinkEntity[] = useMemo(() => {
    const out: ReadingLinkEntity[] = [];
    for (const p of data.relatedPeople) {
      out.push({ kind: "person", id: p.id, name: p.name });
    }
    for (const pl of data.relatedPlaces) {
      out.push({ kind: "place", id: pl.id, name: pl.name });
    }
    for (const s of data.relatedSymbols) {
      out.push({ kind: "symbol", id: s.id, name: s.name });
    }
    return out;
  }, [data.relatedPeople, data.relatedPlaces, data.relatedSymbols]);

  const drawnExperienceLinks = useMemo(() => {
    const seen = new Set<string>();
    const out: { href: string; label: string; kind: string }[] = [];
    for (const t of readerPack.followThreads) {
      if (seen.has(t.href)) continue;
      seen.add(t.href);
      out.push({ href: t.href, label: t.label, kind: t.kind });
    }
    for (const a of readerPack.nextReaderActions) {
      if (seen.has(a.href)) continue;
      seen.add(a.href);
      out.push({ href: a.href, label: a.label, kind: a.kind });
    }
    return out;
  }, [readerPack.followThreads, readerPack.nextReaderActions]);

  const attachmentLinkLabel = useCallback(
    (href: string, fallback: string) => {
      const hit = readerPack.followThreads.find((t) => t.href === href);
      return hit?.label ?? fallback;
    },
    [readerPack.followThreads],
  );

  const resolveSidePanel = useCallback(
    (e: ReadingLinkEntity): SidePanelEntity | null => {
      if (e.kind === "person") {
        const row = data.relatedPeople.find((p) => p.id === e.id);
        if (!row) return null;
        return {
          kind: "person",
          id: row.id,
          name: row.name,
          description: row.description,
        };
      }
      if (e.kind === "place") {
        const row = data.relatedPlaces.find((p) => p.id === e.id);
        if (!row) return null;
        return {
          kind: "place",
          id: row.id,
          name: row.name,
          description: row.description,
        };
      }
      const row = data.relatedSymbols.find((s) => s.id === e.id);
      if (!row) return null;
      return {
        kind: "symbol",
        id: row.id,
        name: row.name,
        meaning: row.meaning,
      };
    },
    [data.relatedPeople, data.relatedPlaces, data.relatedSymbols],
  );

  const onEntityClick = useCallback(
    (e: ReadingLinkEntity) => {
      const ent = resolveSidePanel(e);
      if (ent) setPanel(ent);
    },
    [resolveSidePanel],
  );

  const tone = IMMERSIVE_TONE_PRESETS[immersion.tonePreset];
  const immersiveReaderKey = `${data.scene.id}-${data.readingBody.length}-${mode}`;

  const paragraphBlocks = useMemo(
    () => splitReadingBlocks(data.readingBody),
    [data.readingBody],
  );

  const readerShellClass =
    mode === "reading"
      ? "rounded-lg border border-stone-800/90 bg-[#12110f]/80 px-6 py-10 sm:px-10 sm:py-12"
      : "rounded-xl border border-stone-700/35 bg-black/25 px-6 py-12 sm:px-12 sm:py-16 backdrop-blur-[2px]";

  const titleAccent =
    immersion.tonePreset === "firelight"
      ? "campti-scene-text-accent-warm"
      : immersion.tonePreset === "mist" || immersion.tonePreset === "dusk"
        ? "campti-scene-text-accent-mist"
        : "";

  const showAtmosphere = mode === "immersive" || mode === "guided";
  const listenFirst = mode === "listen" && hasAudio;

  const perceptionSegmentsForMode =
    mode === "guided"
      ? perceptionPayload?.guidedSegments ?? null
      : mode === "immersive" || mode === "listen"
        ? perceptionPayload?.feelSegments ?? null
        : null;

  const immersiveReader =
    mode === "immersive" ||
    mode === "guided" ||
    (mode === "listen" && Boolean(perceptionSegmentsForMode?.length));

  const displayReadingBody = useMemo(() => {
    if (immersiveReader || mode !== "reading" || readerPrefs.flow !== "paragraph") {
      return data.readingBody;
    }
    if (!paragraphBlocks.length) return data.readingBody;
    const i = Math.min(Math.max(paragraphIndex, 0), paragraphBlocks.length - 1);
    return paragraphBlocks[i] ?? data.readingBody;
  }, [
    immersiveReader,
    mode,
    readerPrefs.flow,
    data.readingBody,
    paragraphBlocks,
    paragraphIndex,
  ]);

  const readerStageStyle: CSSProperties = {
    fontSize: `${fontRemForStep(readerPrefs.fontStep)}rem`,
    columnCount:
      mode === "reading" && !immersiveReader && readerPrefs.columns === 2 ? 2 : undefined,
    columnGap: "1.75rem",
    filter: brightnessFilterForStep(readerPrefs.brightnessStep),
  };

  const handleHandsFree = useCallback(
    (action: HandsFreeAction) => {
      const maxFont = FONT_STEPS_REM.length - 1;
      /** Voice/gaze should feel instant — smooth scroll reads as laggy. */
      const hop = { behavior: "auto" as const };
      switch (action.type) {
        case "next": {
          if (
            mode === "reading" &&
            !immersiveReader &&
            readerPrefs.flow === "paragraph" &&
            paragraphBlocks.length > 0
          ) {
            setParagraphIndex((i) => Math.min(paragraphBlocks.length - 1, i + 1));
            return;
          }
          if (navigation.nextScene) {
            router.push(`/read/scenes/${navigation.nextScene.id}`);
            return;
          }
          window.scrollBy({ top: 380, ...hop });
          break;
        }
        case "previous": {
          if (mode === "reading" && !immersiveReader && readerPrefs.flow === "paragraph") {
            setParagraphIndex((i) => Math.max(0, i - 1));
            return;
          }
          if (navigation.prevScene) {
            router.push(`/read/scenes/${navigation.prevScene.id}`);
            return;
          }
          window.scrollBy({ top: -380, ...hop });
          break;
        }
        case "brighter":
          setReaderPrefs((p) => ({
            ...p,
            brightnessStep: Math.min(6, p.brightnessStep + 1),
          }));
          break;
        case "dimmer":
          setReaderPrefs((p) => ({
            ...p,
            brightnessStep: Math.max(0, p.brightnessStep - 1),
          }));
          break;
        case "zoomIn":
          setReaderPrefs((p) => ({
            ...p,
            fontStep: Math.min(maxFont, p.fontStep + 1),
          }));
          break;
        case "zoomOut":
          setReaderPrefs((p) => ({
            ...p,
            fontStep: Math.max(0, p.fontStep - 1),
          }));
          break;
        case "goToChapter": {
          const n = action.chapterNumber;
          const byNum = chapterIndex.find((c) => c.chapterNumber === n);
          if (byNum) {
            router.push(`/read/chapters/${byNum.id}`);
            return;
          }
          const ordered = [...chapterIndex].filter((c) => c.chapterNumber != null);
          ordered.sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0));
          const byOrder = ordered[n - 1] ?? chapterIndex[n - 1];
          if (byOrder) router.push(`/read/chapters/${byOrder.id}`);
          break;
        }
        case "scrollDown":
          window.scrollBy({ top: 420, ...hop });
          break;
        case "scrollUp":
          window.scrollBy({ top: -420, ...hop });
          break;
        default:
          break;
      }
    },
    [
      chapterIndex,
      immersiveReader,
      mode,
      navigation.nextScene,
      navigation.prevScene,
      paragraphBlocks.length,
      readerPrefs.flow,
      router,
    ],
  );

  const modeButton = (m: PublicExperienceMode, label: string) => (
    <button
      type="button"
      onClick={() => {
        if (m === "listen" && !hasAudio) return;
        persistMode(m);
      }}
      disabled={m === "listen" && !hasAudio}
      title={m === "listen" && !hasAudio ? "Listening will be available when audio is published" : undefined}
      className={`rounded-full px-2.5 py-2 text-[0.6rem] uppercase tracking-[0.14em] transition sm:px-3 ${
        mode === m
          ? "bg-stone-800 text-stone-100"
          : "text-stone-500 hover:text-stone-300 disabled:cursor-not-allowed disabled:opacity-35"
      }`}
    >
      {label}
    </button>
  );

  const contextLine = `${data.chapter.title} · ${title}`;

  const storyDepth =
    data.narrativePassSummary?.trim() ||
    data.scene.summary?.trim() ||
    data.readingBody.slice(0, 320).trim();

  return (
    <>
      {showAtmosphere ? (
        <AtmosphereLayer preset={immersion.tonePreset} grain />
      ) : null}

      <article
        className={`campti-scene-enter mx-auto w-full max-w-[min(100%,42rem)] space-y-12 pb-24 xl:max-w-[48rem] ${showAtmosphere || mode === "listen" ? "relative z-10" : ""}`}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div
              className={`flex flex-wrap items-center gap-3 transition-opacity duration-500 ${
                mode === "reading" ? "opacity-100" : "opacity-80 sm:opacity-90"
              }`}
            >
              <Link
                href={`/read/chapters/${data.chapter.id}`}
                className="text-xs uppercase tracking-[0.2em] text-stone-500 transition duration-300 hover:text-stone-300 hover:opacity-90"
              >
                ← {data.chapter.title}
              </Link>
              <span className="text-stone-700" aria-hidden>
                ·
              </span>
              <Link
                href="/read"
                className="text-xs uppercase tracking-[0.2em] text-stone-500 transition duration-300 hover:text-stone-300 hover:opacity-90"
              >
                Reading hub
              </Link>
            </div>
            <h1
              className={`mt-4 font-serif text-3xl font-normal leading-tight sm:text-4xl ${
                mode === "reading"
                  ? "text-stone-100"
                  : `${tone.text} drop-shadow-sm ${titleAccent}`
              }`}
            >
              {title}
            </h1>
            {readerPack.sceneEntryLine && mode !== "reading" ? (
              <p
                className={`mt-3 text-xs font-serif italic leading-relaxed sm:text-sm ${tone.textMuted}`}
              >
                {readerPack.sceneEntryLine}
              </p>
            ) : null}
            {readerPack.continuation.mood && mode !== "reading" ? (
              <p className={`mt-3 text-xs italic leading-relaxed ${tone.textMuted}`}>
                {readerPack.continuation.mood}
              </p>
            ) : null}
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.18em] text-stone-600">
              {data.primaryPlace ? (
                <div>
                  <dt className="text-stone-600">Setting</dt>
                  <dd className="mt-1 normal-case tracking-normal text-stone-400">
                    <button
                      type="button"
                      onClick={() =>
                        setPanel({
                          kind: "place",
                          id: data.primaryPlace!.id,
                          name: data.primaryPlace!.name,
                          description: data.primaryPlace!.description,
                        })
                      }
                      className="border-b border-transparent text-left transition hover:border-amber-200/40 hover:text-amber-100/90"
                    >
                      {data.primaryPlace.name}
                    </button>
                    <span className="text-stone-600">
                      {" "}
                      · {placeTypeReaderLabel(data.primaryPlace.placeType)}
                    </span>
                  </dd>
                </div>
              ) : null}
              {data.povPerson ? (
                <div>
                  <dt className="text-stone-600">Perspective</dt>
                  <dd className="mt-1 normal-case tracking-normal text-stone-400">
                    <button
                      type="button"
                      onClick={() =>
                        setPanel({
                          kind: "person",
                          id: data.povPerson!.id,
                          name: data.povPerson!.name,
                          description: data.povPerson!.description,
                        })
                      }
                      className="border-b border-transparent text-left transition hover:border-amber-200/40 hover:text-amber-100/90"
                    >
                      {data.povPerson.name}
                    </button>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div
            className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end"
            role="group"
            aria-label="Experience mode"
          >
            <span className="text-[0.6rem] uppercase tracking-[0.22em] text-stone-600">
              Mode
            </span>
            <div className="flex max-w-[100vw] flex-wrap justify-end gap-0.5 rounded-full border border-stone-700/80 p-0.5 sm:flex-nowrap">
              {modeButton("reading", "Read")}
              {modeButton("immersive", "Feel")}
              {modeButton("guided", "Guided")}
              {modeButton("listen", "Listen")}
            </div>
            <p className="max-w-[14rem] text-right text-[0.55rem] leading-snug tracking-[0.06em] text-stone-600">
              {mode === "reading"
                ? "Calm, continuous reading."
                : mode === "immersive"
                  ? "Immersive consciousness pace."
                  : mode === "guided"
                    ? "Deeper interpretive entry—cues stay inside the text."
                    : hasReadWithVoice
                      ? "Listen: audio leads; the text moves with the voice when sync is published."
                      : "Audio-led; text follows the listening thread."}
            </p>
            {!hydrated ? (
              <span className="sr-only">Loading your saved mode preference</span>
            ) : null}
          </div>
        </div>

        {mode === "guided" && perceptionPayload?.guidedMargins?.length ? (
          <aside
            className={`rounded-md border-l-2 border-stone-600/30 py-1 pl-4 sm:pl-5 ${
              showAtmosphere ? "bg-black/10" : "bg-stone-950/20"
            }`}
            aria-label="Guided entry"
          >
            <p className={`text-[0.58rem] uppercase tracking-[0.22em] ${tone.textMuted}`}>
              Attend
            </p>
            <p className={`mt-2 text-sm italic leading-relaxed ${tone.textMuted}`}>
              {perceptionPayload.guidedMargins[0]}
            </p>
          </aside>
        ) : null}

        {listenFirst ? (
          <PublicAudioPlayer
            tabs={audioTabs}
            title="Listen to this moment"
            contextLine={contextLine}
            loop={audioTabs.length === 1 && audioTabs[0]?.id === "ambient"}
            initialVolume={audioTabs.length === 1 && audioTabs[0]?.id === "ambient" ? 0.35 : 0.78}
            fadeMs={audioTabs.length === 1 && audioTabs[0]?.id === "ambient" ? 1200 : 880}
            experienceCueHints={perceptionPayload?.audioCueHints ?? null}
            excerptPreview={
              narrationTab?.transcript?.trim() && !hasReadWithVoice
                ? narrationTab.transcript.trim().slice(0, 200)
                : null
            }
            onListenDelta={onListenDelta}
          />
        ) : null}

        <div className={readerShellClass} style={readerStageStyle}>
          {data.narrativePassSummary && data.readingSourceLabel === "narrative" ? (
            <p
              className={`mb-10 border-b pb-8 text-sm italic leading-relaxed ${
                immersiveReader
                  ? `${tone.textMuted} border-stone-700/50`
                  : "border-stone-800 text-stone-500"
              }`}
            >
              {data.narrativePassSummary}
            </p>
          ) : null}

          {immersiveReader ? (
            <ImmersiveErrorBoundary text={data.readingBody}>
              <ImmersiveSceneReader
                key={immersiveReaderKey}
                text={data.readingBody}
                entities={linkEntities}
                onEntityClick={onEntityClick}
                tonePreset={immersion.tonePreset}
                vignette={mode === "guided"}
                perceptionSegments={perceptionSegmentsForMode}
                gravityOverall={perceptionPayload?.gravity.overallPressure ?? 0.35}
              />
            </ImmersiveErrorBoundary>
          ) : (
            <LinkedReadingBlocks
              text={displayReadingBody}
              entities={linkEntities}
              onEntityClick={onEntityClick}
              immersive={false}
            />
          )}
        </div>

        {mode === "reading" &&
        !immersiveReader &&
        readerPrefs.flow === "paragraph" &&
        paragraphBlocks.length > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-950/30 bg-black/25 px-4 py-3 text-[0.75rem] text-stone-400">
            <button
              type="button"
              disabled={paragraphIndex <= 0}
              onClick={() => setParagraphIndex((i) => Math.max(0, i - 1))}
              className="rounded-md border border-stone-700/80 px-3 py-1.5 transition enabled:hover:border-cyan-800/50 enabled:hover:text-stone-200 disabled:opacity-35"
            >
              ← Previous beat
            </button>
            <span className="tabular-nums text-stone-500">
              {paragraphIndex + 1} / {paragraphBlocks.length}
            </span>
            <button
              type="button"
              disabled={paragraphIndex >= paragraphBlocks.length - 1}
              onClick={() =>
                setParagraphIndex((i) => Math.min(paragraphBlocks.length - 1, i + 1))
              }
              className="rounded-md border border-stone-700/80 px-3 py-1.5 transition enabled:hover:border-cyan-800/50 enabled:hover:text-stone-200 disabled:opacity-35"
            >
              Next beat →
            </button>
          </div>
        ) : null}

        <ReaderOptionsBar
          prefs={readerPrefs}
          onChange={setReaderPrefs}
          hasAudio={hasAudio}
        />

        <HandsFreePanel onAction={handleHandsFree} active />

        <div className="space-y-4">
          {!listenFirst && hasAudio ? (
            <PublicAudioPlayer
              tabs={audioTabs}
              title="Listen to this moment"
              contextLine={contextLine}
              loop={audioTabs.length === 1 && audioTabs[0]?.id === "ambient"}
              initialVolume={audioTabs.length === 1 && audioTabs[0]?.id === "ambient" ? 0.35 : 0.78}
              fadeMs={audioTabs.length === 1 && audioTabs[0]?.id === "ambient" ? 1200 : 880}
              experienceCueHints={perceptionPayload?.audioCueHints ?? null}
              excerptPreview={
                narrationTab?.transcript?.trim() && !hasReadWithVoice
                  ? narrationTab.transcript.trim().slice(0, 200)
                  : null
              }
              onListenDelta={onListenDelta}
              className={
                audioTabs.length === 1 && audioTabs[0]?.id === "ambient"
                  ? "border-stone-700/50 bg-black/20"
                  : ""
              }
            />
          ) : null}
          {!hasAudio ? (
            <AudioTeaser
              label="Listen to this moment"
              sublabel="Voiced readings and mixes will appear here when the sound layer is published."
            />
          ) : null}
        </div>

        {(data.personalityProfile || data.innerNature) && (
          <div className="space-y-6">
            {data.personalityProfile ? (
              <AtmosphereBlock title="Personality profile">
                <div className="whitespace-pre-wrap">{data.personalityProfile}</div>
              </AtmosphereBlock>
            ) : null}
            {data.innerNature ? (
              <AtmosphereBlock title="Inner nature">
                <div className="whitespace-pre-wrap">{data.innerNature}</div>
              </AtmosphereBlock>
            ) : null}
          </div>
        )}

        {data.perspectiveTeaser ? (
          <PremiumDepthGate
            tone="perspective"
            teaser={
              <span>
                There is another perspective waiting—alternate voice, slower light, the same ground.
              </span>
            }
          >
            <p className="whitespace-pre-wrap text-stone-300">{data.perspectiveTeaser}</p>
          </PremiumDepthGate>
        ) : null}

        {readerPack.premiumDepthOffers.map((offer, i) => (
          <PremiumDepthGate
            key={`${offer.category}-${i}`}
            category={offer.category}
            teaser={<span>{offer.label}</span>}
            previewLine={offer.previewLine}
          >
            <p className="whitespace-pre-wrap text-stone-300">{offer.excerpt}</p>
          </PremiumDepthGate>
        ))}

        <section className="rounded-xl border border-stone-800/80 bg-stone-950/25">
          <button
            type="button"
            onClick={() => setDepthOpen((o) => !o)}
            className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
            aria-expanded={depthOpen}
          >
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
              Depth
            </span>
            <span className="text-xs text-stone-600">{depthOpen ? "Close" : "Open"}</span>
          </button>
          {depthOpen ? (
            <div className="space-y-4 border-t border-stone-800/80 px-5 py-5 sm:px-6">
              <details className="group rounded-lg border border-stone-800/60 bg-black/20 px-4 py-3">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-stone-500">
                  Story
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">
                  {storyDepth}
                  {data.readingBody.length > 320 ? "…" : ""}
                </p>
              </details>
              <details className="group rounded-lg border border-stone-800/60 bg-black/20 px-4 py-3">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-stone-500">
                  Context
                </summary>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-400">
                  {data.metaLayer?.setting ? (
                    <p className="whitespace-pre-wrap">
                      <span className="text-stone-500">Setting · </span>
                      {data.metaLayer.setting}
                    </p>
                  ) : null}
                  {data.metaLayer?.historicalContext ? (
                    <p className="whitespace-pre-wrap">{data.metaLayer.historicalContext}</p>
                  ) : null}
                  {data.metaLayer?.socialContext ? (
                    <p className="whitespace-pre-wrap">{data.metaLayer.socialContext}</p>
                  ) : null}
                  {!data.metaLayer?.setting &&
                  !data.metaLayer?.historicalContext &&
                  !data.metaLayer?.socialContext ? (
                    <p className="text-stone-600">Context will gather as the passage finds its ground.</p>
                  ) : null}
                </div>
              </details>
              <details className="group rounded-lg border border-stone-800/60 bg-black/20 px-4 py-3">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-stone-500">
                  Symbolism
                </summary>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-stone-400">
                  {data.metaLayer?.symbolism ? (
                    <p className="whitespace-pre-wrap">{data.metaLayer.symbolism}</p>
                  ) : (
                    <p className="text-stone-600">Symbols surface where the narrative insists—check the symbolism index.</p>
                  )}
                  {readerPack.symbolPrompts.slice(0, 2).map((p, i) => (
                    <p key={`sym-${i}-${p.slice(0, 24)}`} className="italic text-stone-500">
                      {p}
                    </p>
                  ))}
                </div>
              </details>
              <details className="group rounded-lg border border-stone-800/60 bg-black/20 px-4 py-3">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-stone-500">
                  Perspective
                </summary>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-stone-400">
                  {data.povPerson ? (
                    <p>
                      Held through{" "}
                      <Link
                        href={`/read/characters/${data.povPerson.id}`}
                        className="text-amber-200/80 underline-offset-4 hover:underline"
                      >
                        {data.povPerson.name}
                      </Link>
                      ’s presence in the scene.
                    </p>
                  ) : (
                    <p className="text-stone-600">Perspective will name itself when the passage anchors a witness.</p>
                  )}
                  {readerPack.relationshipPrompts.slice(0, 2).map((p, i) => (
                    <p key={`rel-${i}-${p.slice(0, 24)}`} className="italic text-stone-500">
                      {p}
                    </p>
                  ))}
                </div>
              </details>
              <details className="group rounded-lg border border-stone-800/60 bg-black/20 px-4 py-3">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-stone-500">
                  Deeper
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  Member depth will add fuller interior corridors, audio studies, and alternate
                  listening—without breaking the quiet of the page.
                </p>
                <Link
                  href="/membership"
                  className="mt-4 inline-block text-xs uppercase tracking-[0.2em] text-amber-200/75 hover:text-amber-50"
                >
                  Explore deeper →
                </Link>
              </details>
            </div>
          ) : null}
        </section>

        <nav
          className={`space-y-8 border-t pt-10 transition-colors duration-500 ${
            immersiveReader ? "border-stone-700/40" : "border-stone-800"
          }`}
          aria-label="Continue the experience"
        >
          {readerPack.sceneExitBridge ? (
            <p className="font-serif text-sm italic leading-relaxed text-stone-500">
              {readerPack.sceneExitBridge}
            </p>
          ) : null}
          <div>
            <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
              You might feel drawn to…
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {drawnExperienceLinks.map((a, i) => (
                <li key={`${a.href}-${i}`}>
                  <Link
                    href={a.href}
                    className={`text-sm underline-offset-4 transition duration-300 hover:underline ${
                      a.kind === "continue_story" ||
                      a.kind === "emotional" ||
                      a.kind === "premium_depth"
                        ? "text-amber-200/80 hover:text-amber-50"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
              Along the thread
            </h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
              {navigation.prevScene ? (
                <Link
                  href={`/read/scenes/${navigation.prevScene.id}`}
                  className="text-sm text-stone-400 underline-offset-4 transition duration-300 hover:text-stone-200 hover:underline"
                >
                  ← {navigation.prevScene.label}
                </Link>
              ) : null}
              {navigation.nextScene ? (
                <Link
                  href={`/read/scenes/${navigation.nextScene.id}`}
                  className="text-sm text-stone-400 underline-offset-4 transition duration-300 hover:text-stone-200 hover:underline"
                >
                  Next scene — {navigation.nextScene.label}
                </Link>
              ) : null}
              {navigation.nextChapter ? (
                <Link
                  href={`/read/chapters/${navigation.nextChapter.id}`}
                  className="text-sm text-amber-200/70 underline-offset-4 transition duration-300 hover:text-amber-100 hover:underline"
                >
                  Next chapter:{" "}
                  {navigation.nextChapter.chapterNumber != null
                    ? `Chapter ${navigation.nextChapter.chapterNumber}`
                    : navigation.nextChapter.title}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-stone-600">
            <Link
              href={`/read/chapters/${data.chapter.id}`}
              className="transition duration-300 hover:text-stone-400"
            >
              Leave passage → chapter
            </Link>
            <Link href="/read" className="transition duration-300 hover:text-stone-400">
              Leave → reading hub
            </Link>
          </div>
        </nav>

        {(data.relatedPeople.length > 0 ||
          data.relatedPlaces.length > 0 ||
          data.relatedSymbols.length > 0) && (
          <section className="space-y-6 border-t border-stone-800 pt-10">
            <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
              Related threads
            </h2>
            {data.relatedPeople.length > 0 ? (
              <div>
                <p className="text-xs text-stone-600">People</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {data.relatedPeople.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/read/characters/${p.id}`}
                        className="rounded-full border border-stone-700 px-3 py-1 text-sm text-stone-400 hover:border-amber-900/40 hover:text-stone-200"
                      >
                        {attachmentLinkLabel(`/read/characters/${p.id}`, p.name)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data.relatedPlaces.length > 0 ? (
              <div>
                <p className="text-xs text-stone-600">Places</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {data.relatedPlaces.map((pl) => (
                    <li key={pl.id}>
                      <Link
                        href={`/read/places/${pl.id}`}
                        className="rounded-full border border-stone-700 px-3 py-1 text-sm text-stone-400 hover:border-amber-900/40 hover:text-stone-200"
                      >
                        {attachmentLinkLabel(`/read/places/${pl.id}`, pl.name)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data.relatedSymbols.length > 0 ? (
              <div>
                <p className="text-xs text-stone-600">Symbolism</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {data.relatedSymbols.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/read/symbols#${s.id}`}
                        className="rounded-full border border-stone-700 px-3 py-1 text-sm text-stone-400 hover:border-amber-900/40 hover:text-stone-200"
                      >
                        {attachmentLinkLabel(`/read/symbols#${s.id}`, `Follow “${s.name}”`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        <ExploreDeeperCard title="Experience deeper">
          <p>
            Member depth will add alternate listening cuts, richer interior access, and layered
            scene studies—always optional, never noisy.
          </p>
        </ExploreDeeperCard>
      </article>

      <SidePanel open={!!panel} entity={panel} onClose={() => setPanel(null)} />
    </>
  );
}
