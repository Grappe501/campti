import { redirect } from "next/navigation";
import { resolveLegacyWorkbenchRedirect } from "@/lib/services/author-cockpit-consolidation-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ chapterId: string }> };

export default async function ChapterAssemblyViewPage(props: PageProps) {
  const { chapterId } = await props.params;
  redirect(
    resolveLegacyWorkbenchRedirect({
      routePattern: "/admin/narrative/chapters/[chapterId]/assembly",
      id: chapterId,
    })
  );
}
