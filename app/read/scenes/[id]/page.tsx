import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReadSceneExperience } from "@/components/public/read-scene-experience";
import {
  getPublicChapterIndex,
  getPublicSceneById,
  getPublicSceneNavigation,
  getPublicSceneReaderPack,
  type PublicSceneNavigation,
} from "@/lib/public-data";
import { resolvePublicSceneImmersion } from "@/lib/public-scene-immersion";
import { buildPublicPerceptionPayload } from "@/lib/public-experience-rendering";
import { getCamptiSessionId } from "@/lib/campti-session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicSceneById(id);
  if (!data) return { title: "Scene — Campti" };
  const label =
    data.scene.summary?.trim() ||
    `Scene · ${data.chapter.title}`.slice(0, 120);
  return {
    title: `${label} — Campti`,
    description: data.narrativePassSummary ?? data.scene.summary ?? undefined,
    openGraph: { title: label, description: data.scene.summary ?? undefined },
  };
}

export default async function ReadScenePage({ params }: Props) {
  const { id } = await params;
  const data = await getPublicSceneById(id);
  if (!data) notFound();

  const navigationRaw = await getPublicSceneNavigation(id, data.chapter.id);
  const sessionId = await getCamptiSessionId();
  const readerPack = await getPublicSceneReaderPack(id, data.metaSceneId, sessionId);
  const immersionResolved = resolvePublicSceneImmersion({
    sceneId: data.scene.id,
    emotionalTone: data.scene.emotionalTone,
    publishedAudio: data.sceneAudioTracks.map((t) => ({
      assetType: t.assetType,
      audioUrl: t.audioUrl,
      title: t.title,
    })),
  });

  const title =
    data.scene.summary?.trim() ||
    `Passage · ${data.chapter.chapterNumber != null ? `Chapter ${data.chapter.chapterNumber}` : data.chapter.title}`;

  const navigation: PublicSceneNavigation =
    navigationRaw ?? {
      prevScene: null,
      nextScene: null,
      chapter: data.chapter,
      nextChapter: null,
    };

  const perceptionPayload = await buildPublicPerceptionPayload(data);
  const chapterIndex = await getPublicChapterIndex();

  return (
    <ReadSceneExperience
      data={data}
      immersion={immersionResolved}
      navigation={navigation}
      readerPack={readerPack}
      title={title}
      perceptionPayload={perceptionPayload}
      chapterIndex={chapterIndex}
    />
  );
}
