import Link from "next/link";
import { notFound } from "next/navigation";
import { decomposeSourceAction } from "@/app/actions/fragments";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { getSourceDecompositionWorkspace } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { DecomposeToolbar } from "./decompose-toolbar";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function SourceDecomposePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const workspace = await getSourceDecompositionWorkspace(id);
  if (!workspace) notFound();

  const hasFragments = workspace.fragments.length > 0;
  const hasChunks = workspace.sourceChunks.length > 0;
  const textPreview =
    workspace.sourceText?.normalizedText?.slice(0, 2000) ??
    workspace.sourceText?.rawText?.slice(0, 2000) ??
    "";

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <Link href={`/admin/sources/${id}`} className="text-sm text-amber-900 hover:underline">
          ← Source
        </Link>
        <PageHeader
          title={`Decompose — ${workspace.title}`}
          description="Turn this source into many reviewable fragments. First pass is rule-based; no AI required."
        />
      </div>

      <AdminFormError error={sp.error} />

      {sp.saved ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          Fragments saved from this source.
        </p>
      ) : null}

      {sp.error === "already_decomposed" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This source already has top-level fragments. Check &quot;Force re-run&quot; to generate again, or delete
          fragments first.
        </p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Preview &amp; assist</h2>
        <p className="mt-1 text-sm text-stone-600">
          Preview shows what the rule-based splitter would create. The AI button is a stub until a model is wired.
        </p>
        <div className="mt-6">
          <DecomposeToolbar sourceId={id} />
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Generate fragments</h2>
        <form action={decomposeSourceAction} className="mt-4 space-y-4">
          <input type="hidden" name="sourceId" value={id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Mode</span>
            <select name="mode" className={fieldClass} defaultValue={hasChunks ? "chunks" : "full"}>
              <option value="full">From full source text</option>
              <option value="chunks" disabled={!hasChunks}>
                From each chunk {hasChunks ? `(${workspace.sourceChunks.length})` : "(no chunks)"}
              </option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="force" value="true" />
            Force re-run (ignore existing top-level fragments)
          </label>
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Generate and save fragments
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Source text</h2>
        {textPreview ? (
          <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm text-stone-800">
            {textPreview}
            {(workspace.sourceText?.rawText?.length ?? 0) > 2000 ? "\n…" : ""}
          </pre>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            No source text yet. Add text on the{" "}
            <Link href={`/admin/sources/${id}`} className="text-amber-900 hover:underline">
              source page
            </Link>
            .
          </p>
        )}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Existing fragments ({workspace.fragments.length})</h2>
        {hasFragments ? (
          <ul className="mt-4 space-y-2">
            {workspace.fragments.map((f) => (
              <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <Link href={`/admin/fragments/${f.id}`} className="text-amber-900 hover:underline">
                  {f.title?.trim() || f.text.slice(0, 80)}
                </Link>
                <span className="text-xs text-stone-500">
                  {f._count.placementCandidates}c · {f._count.childFragments}ch
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-stone-600">None yet.</p>
        )}
      </section>
    </div>
  );
}
