import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFormError } from "@/components/admin-form-error";
import { ConstitutionalRuleForm } from "@/components/admin/constitutional-rule-form";
import { PageHeader } from "@/components/page-header";
import { deleteRule, updateRule } from "@/app/actions/constitutional-rules";
import { getConstitutionalRuleById } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditConstitutionalRulePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const rule = await getConstitutionalRuleById(id);
  if (!rule) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/admin/narrative-rules" className="text-sm text-amber-900 hover:underline">
        ← Narrative rules
      </Link>
      <PageHeader
        title={rule.name}
        description={`Key: ${rule.key} · ${rule.ruleType} · ${rule.severity}`}
      />
      <AdminFormError error={sp.error} />
      {sp.error === "db" ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
          Could not save. Check database connection.
        </p>
      ) : null}
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <ConstitutionalRuleForm action={updateRule} submitLabel="Save changes" defaults={rule} />
      </section>

      <section className="rounded-xl border border-rose-200/80 bg-rose-50/30 p-4">
        <h2 className="text-sm font-semibold text-rose-950">Delete</h2>
        <p className="mt-1 text-xs text-stone-600">Removes this constitutional row. Seed scripts can restore defaults.</p>
        <form action={deleteRule} className="mt-3">
          <input type="hidden" name="id" value={rule.id} />
          <button
            type="submit"
            className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-900 hover:bg-rose-100"
          >
            Delete rule
          </button>
        </form>
      </section>
    </div>
  );
}
