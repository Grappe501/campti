import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { assembleChapterReaderText } from "@/lib/services/chapter-assembly-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ chapterId: string }> };

export default async function ChapterAssemblyViewPage(props: PageProps) {
  const { chapterId } = await props.params;
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, title: true },
  });
  if (!chapter) notFound();

  const authorDraft = await assembleChapterReaderText({
    chapterId,
    persist: false,
    purpose: "author_draft",
  });
  const reader = await assembleChapterReaderText({
    chapterId,
    persist: false,
    purpose: "reader_publish",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={`Assembly · ${chapter.title}`}
        description="Two previews: author_draft (human over generation) vs reader_publish (published slice first). Does not persist."
      />
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-stone-800">
          Author draft assembly
        </h2>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-800">
          {authorDraft.text || "(empty)"}
        </pre>
        <p className="text-xs text-stone-500">
          Hash: {authorDraft.contentHash.slice(0, 16)}… · Warnings:{" "}
          {authorDraft.warnings.length}
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-stone-800">
          Reader publish preview
        </h2>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-800">
          {reader.text || "(empty)"}
        </pre>
      </section>
    </div>
  );
}
