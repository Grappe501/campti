import { ReaderCockpitShell } from "@/components/read/reader-cockpit-shell";
import { getCamptiSessionId } from "@/lib/campti-session";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    characterId?: string;
    sceneId?: string;
  }>;
};

export default async function ReaderCockpitPage({ searchParams }: Props) {
  const sessionReaderId = await getCamptiSessionId();
  const params = await searchParams;
  return (
    <ReaderCockpitShell
      initialReaderId={sessionReaderId ?? ""}
      initialCharacterId={params.characterId?.trim() ?? ""}
      initialSceneId={params.sceneId?.trim() ?? ""}
    />
  );
}
