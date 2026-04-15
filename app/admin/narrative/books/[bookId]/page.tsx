import { redirect } from "next/navigation";
import { resolveLegacyWorkbenchRedirect } from "@/lib/services/author-cockpit-consolidation-service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ bookId: string }> };

export default async function BookPlannerPage(props: PageProps) {
  const { bookId } = await props.params;
  redirect(
    resolveLegacyWorkbenchRedirect({
      routePattern: "/admin/narrative/books/[bookId]",
      id: bookId,
    })
  );
}
