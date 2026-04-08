import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getThemesList } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminThemesPage() {
  const themes = await getThemesList();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="Themes" description="Core and subthemes with intensity — linked across scenes and characters via bindings." />
      <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {themes.length === 0 ? (
          <li className="text-sm text-stone-600">No themes yet.</li>
        ) : (
          themes.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/themes/${t.id}`} className="text-amber-900 hover:underline">
                {t.name}
              </Link>
              {t.source ? <span className="ml-2 text-xs text-stone-500">· {t.source.title}</span> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
