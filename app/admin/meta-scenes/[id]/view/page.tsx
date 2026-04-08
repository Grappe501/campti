import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { buildMetaSceneContext } from "@/lib/perspective-engine";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MetaSceneViewPage({ params }: Props) {
  const { id } = await params;
  const ctx = await buildMetaSceneContext(id);
  if (!ctx) notFound();

  const m = ctx.metaScene;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/meta-scenes/${id}`} className="text-sm text-amber-900 hover:underline">
          ← Edit meta scene
        </Link>
        <PageHeader title={`World state · ${m.title}`} description="Read-only assembly of meta scene, setting, character state, and linked fragments." />
      </div>

      <DetailSection title="Meta scene">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Place</dt>
            <dd className="font-medium text-stone-900">{m.place?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">POV</dt>
            <dd className="font-medium text-stone-900">{m.povPerson?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Time</dt>
            <dd>{m.timePeriod ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Date estimate</dt>
            <dd>{m.dateEstimate ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Linked scene</dt>
            <dd>
              {m.scene ? (
                <Link href={`/admin/scenes/${m.scene.id}`} className="text-amber-900 hover:underline">
                  {m.scene.chapter.title}: {m.scene.description.slice(0, 80)}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Participants</dt>
            <dd>{m.participants.length ? m.participants.join(", ") : "—"}</dd>
          </div>
        </dl>
        {m.environmentDescription ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-stone-800">{m.environmentDescription}</p>
        ) : null}
        {m.sensoryField ? (
          <p className="mt-4 text-sm text-stone-700">
            <span className="font-medium text-stone-900">Sensory field: </span>
            {m.sensoryField}
          </p>
        ) : null}
      </DetailSection>

      <DetailSection title="Constraints">
        <div className="space-y-3 text-sm text-stone-800">
          <div>
            <p className="text-xs font-medium uppercase text-stone-500">Historical</p>
            <p className="mt-1 whitespace-pre-wrap">{m.historicalConstraints ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-stone-500">Social</p>
            <p className="mt-1 whitespace-pre-wrap">{m.socialConstraints ?? "—"}</p>
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Symbolic layer">
        <ul className="space-y-2 text-sm text-stone-800">
          <li>
            <span className="text-stone-500">Emotional voltage: </span>
            {ctx.symbolicLayer.emotionalVoltage ?? "—"}
          </li>
          <li>
            <span className="text-stone-500">Symbolic elements: </span>
            {ctx.symbolicLayer.symbolicElements ?? "—"}
          </li>
          <li>
            <span className="text-stone-500">Narrative purpose: </span>
            {ctx.symbolicLayer.narrativePurpose ?? "—"}
          </li>
        </ul>
      </DetailSection>

      <DetailSection title="Setting profile (resolved)">
        {ctx.settingProfile ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-stone-500">Physical</dt>
              <dd className="whitespace-pre-wrap">{ctx.settingProfile.physicalDescription ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Sounds</dt>
              <dd>{ctx.settingProfile.sounds ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Smells</dt>
              <dd>{ctx.settingProfile.smells ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Textures</dt>
              <dd>{ctx.settingProfile.textures ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-stone-600">No setting profile for this place yet.</p>
        )}
      </DetailSection>

      <DetailSection title="Setting states (matched time)">
        {ctx.settingStates.length === 0 ? (
          <p className="text-sm text-stone-600">None matched.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {ctx.settingStates.map((s) => (
              <li key={s.id} className="rounded-md border border-stone-100 p-2">
                {s.timePeriod ?? "—"} · {s.season ?? "—"} · {s.weather ?? "—"}
                {s.notableConditions ? <span className="block text-stone-700">{s.notableConditions}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Character states (POV / scene)">
        {ctx.characterStates.length === 0 ? (
          <p className="text-sm text-stone-600">None for this POV and optional scene link.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {ctx.characterStates.map((s) => (
              <li key={s.id} className="rounded-md border border-stone-100 p-2 text-stone-800">
                {s.emotionalState ?? s.motivation ?? s.notes ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Fragments linked (meta_scene)">
        {ctx.linkedFragments.length === 0 ? (
          <p className="text-sm text-stone-600">No fragment links with type meta_scene to this row.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {ctx.linkedFragments.map((l) => (
              <li key={l.fragmentId}>
                <Link href={`/admin/fragments/${l.fragmentId}`} className="text-amber-900 hover:underline">
                  {l.fragmentId.slice(0, 10)}…
                </Link>{" "}
                <span className="text-stone-500">({l.linkRole ?? "—"})</span>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
