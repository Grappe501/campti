import Link from "next/link";
import { AdminFormError } from "@/components/admin-form-error";
import { ConstitutionalRuleForm } from "@/components/admin/constitutional-rule-form";
import { PageHeader } from "@/components/page-header";
import { createRule } from "@/app/actions/constitutional-rules";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewConstitutionalRulePage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/admin/narrative-rules" className="text-sm text-amber-900 hover:underline">
        ← Narrative rules
      </Link>
      <PageHeader
        title="New constitutional rule"
        description="System law row (Truth, Voice, Determinism, …). Keys are permanent slugs. Distinct from source-extracted DNA rules below on the main list."
      />
      <AdminFormError error={sp.error} />
      {sp.error === "db" ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
          Could not save. Check database connection and run migrations if the schema is new.
        </p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <ConstitutionalRuleForm action={createRule} submitLabel="Create rule" />
      </section>
    </div>
  );
}
