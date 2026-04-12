import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ bookId: string }> };

export default async function BookPlannerPage(props: PageProps) {
  const { bookId } = await props.params;
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      epic: true,
      chapters: { orderBy: { sequenceInBook: "asc" } },
    },
  });
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={book.readerFacingTitle ?? book.title}
        description={`Movement ${book.movementIndex} · Epic: ${book.epic.title}`}
      />
      <p className="text-sm text-stone-600">
        Assembly status:{" "}
        <span className="font-mono">{book.narrativeAssemblyStatus}</span>
      </p>
      <section>
        <h2 className="mb-2 text-base font-semibold">Chapters</h2>
        <ul className="space-y-2">
          {book.chapters.map((ch) => (
            <li key={ch.id} className="flex flex-wrap items-baseline gap-2">
              <span className="text-stone-500">
                #{ch.sequenceInBook}
              </span>
              <Link
                href={`/admin/chapters/${ch.id}`}
                className="text-amber-900 underline"
              >
                {ch.title}
              </Link>
              <Link
                href={`/admin/narrative/chapters/${ch.id}/assembly`}
                className="text-xs text-stone-500 underline"
              >
                assembly
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
