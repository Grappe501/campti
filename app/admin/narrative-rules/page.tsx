import Link from "next/link";
import { RuleType } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { toggleRuleActive } from "@/app/actions/constitutional-rules";
import { RULE_TYPE_ORDER } from "@/lib/constitutional-rule-constants";
import { getConstitutionalRulesList, getNarrativeRulesList } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Search = { type?: string; saved?: string; deleted?: string; error?: string };

function parseRuleTypeFilter(raw: string | undefined): RuleType | undefined {
  if (!raw || raw === "ALL") return undefined;
  return Object.values(RuleType).includes(raw as RuleType) ? (raw as RuleType) : undefined;
}

export default async function AdminNarrativeRulesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const typeFilter = parseRuleTypeFilter(sp.type);
  const constitutional = await getConstitutionalRulesList(typeFilter);
  const rules = await getNarrativeRulesList();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        title="Narrative rules"
        description="Constitutional core (system law) + source-extracted DNA rules. Law rows govern truth, voice, determinism, and draft gates; DNA rules are editable extraction output."
      />

      {sp.saved === "constitutional" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          Constitutional rule saved.
        </p>
      ) : null}
      {sp.deleted === "constitutional" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
          Constitutional rule deleted.
        </p>
      ) : null}
      {sp.error === "db" ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
          Database action failed. Ensure DATABASE_URL is set and migrations are applied.
        </p>
      ) : null}
      {sp.error === "notfound" ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
          Rule not found.
        </p>
      ) : null}

      <section className="space-y-4 rounded-xl border border-amber-200/90 bg-amber-50/40 p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Constitutional core</h2>
            <p className="mt-1 text-sm text-stone-700">
              Governing law for simulation: truth, ambiguity, reveal, voice, violence, theology, determinism, draft
              eligibility. See <code className="text-xs">lib/constitution.ts</code> for enforcement hooks.
            </p>
          </div>
          <Link
            href="/admin/narrative-rules/constitutional/new"
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50"
          >
            New constitutional rule
          </Link>
        </div>

        <form method="get" className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-stone-600">Filter by type</span>
            <select name="type" defaultValue={sp.type ?? "ALL"} className="rounded-md border border-stone-300 px-2 py-1">
              <option value="ALL">All types</option>
              {RULE_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-md border border-stone-300 bg-white px-3 py-1 hover:bg-stone-50">
            Apply
          </button>
        </form>

        <ul className="mt-2 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {constitutional.length === 0 ? (
            <li className="px-4 py-6 text-sm text-stone-600">
              No constitutional rules in this filter. Run{" "}
              <code className="text-xs">npx prisma migrate dev</code> and <code className="text-xs">npx prisma db seed</code>{" "}
              to load defaults.
            </li>
          ) : (
            constitutional.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <Link
                    href={`/admin/narrative-rules/constitutional/${r.id}`}
                    className="font-medium text-amber-900 hover:underline"
                  >
                    {r.name}
                  </Link>
                  <span className="ml-2 text-xs text-stone-500">
                    {r.ruleType} · {r.scope} · {r.severity}
                    {!r.isActive ? " · inactive" : ""}
                  </span>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600">{r.description}</p>
                </div>
                <form action={toggleRuleActive}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-800 hover:border-amber-300"
                  >
                    {r.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">Source DNA rules</h2>
        <p className="text-sm text-stone-600">
          Extracted from reviewed sources — editable narrative DNA (category, strength, scope). Not the same as
          constitutional law above.
        </p>
        <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          {rules.length === 0 ? (
            <li className="text-sm text-stone-600">No rules yet. Run narrative DNA extraction on a reviewed source.</li>
          ) : (
            rules.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/narrative-rules/${r.id}`} className="text-amber-900 hover:underline">
                  {r.title}
                </Link>
                <span className="ml-2 text-xs text-stone-500">
                  {r.category}
                  {r.source ? ` · ${r.source.title}` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
