import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NarrativeHubPage() {
  const epics = await prisma.epic.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      books: { orderBy: { movementIndex: "asc" } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Narrative spine"
        description="Epic → book → chapter → scene → beat. Links to existing editors; assembly and prose QA are service-backed."
      />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">Quick links</h2>
        <ul className="list-inside list-disc text-stone-700">
          <li>
            <Link className="text-amber-800 underline" href="/admin/chapters">
              Chapters
            </Link>{" "}
            (sequence in book)
          </li>
          <li>
            <Link className="text-amber-800 underline" href="/admin/scenes">
              Scenes
            </Link>
          </li>
          <li>
            <Link className="text-amber-800 underline" href="/admin/people">
              People
            </Link>{" "}
            + voice profiles
          </li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Epics & books</h2>
        {epics.length === 0 ? (
          <p className="text-sm text-stone-500">No epics in database yet.</p>
        ) : (
          <ul className="space-y-6">
            {epics.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <p className="font-medium text-stone-900">{e.title}</p>
                <p className="text-xs text-stone-500">{e.id}</p>
                <ul className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                  {e.books.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/admin/narrative/books/${b.id}`}
                        className="text-amber-900 underline"
                      >
                        M{b.movementIndex}: {b.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
