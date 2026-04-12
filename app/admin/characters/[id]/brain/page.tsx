import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssembledCharacterBrainState } from "@/app/actions/brain-assembly";
import { getSceneTimeBrainEvaluation } from "@/app/actions/scene-brain-runner";
import { SceneTimeBrainPanel } from "@/components/scene-time-brain-panel";
import { getPersonById, getWorldStateById } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ worldStateId?: string; sceneId?: string; counterpartPersonId?: string }>;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm text-neutral-800">{children}</div>
    </section>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[200px_1fr] sm:gap-4">
      <div className="font-medium text-neutral-600">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <div className="text-neutral-500">None loaded.</div>;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function brainPageHref(
  characterId: string,
  worldStateId: string,
  sceneId: string | null,
  counterpartPersonId?: string | null,
) {
  const p = new URLSearchParams();
  p.set("worldStateId", worldStateId);
  if (sceneId) p.set("sceneId", sceneId);
  if (counterpartPersonId) p.set("counterpartPersonId", counterpartPersonId);
  return `/admin/characters/${characterId}/brain?${p.toString()}`;
}

export default async function CharacterBrainPage(props: PageProps) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const personId = params.id;
  const worldStateId = searchParams?.worldStateId;
  const sceneId = searchParams?.sceneId ?? null;
  const counterpartPersonId = searchParams?.counterpartPersonId ?? null;

  if (!worldStateId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Character Brain</h1>
        <p className="text-sm text-neutral-700">
          Add <code className="rounded bg-neutral-100 px-1">?worldStateId=…</code> to assemble this character’s Stage 7 brain
          snapshot. Optionally add <code className="rounded bg-neutral-100 px-1">&sceneId=…</code> for scene-linked environment
          cues, and <code className="rounded bg-neutral-100 px-1">&counterpartPersonId=…</code> to pin the focal other person; if
          omitted, the bundle resolves a counterpart from scene JSON, character-state JSON, or dyad heuristics when possible.
        </p>
      </div>
    );
  }

  const [person, worldState, assembled] = await Promise.all([
    getPersonById(personId),
    getWorldStateById(worldStateId),
    sceneId
      ? getSceneTimeBrainEvaluation(personId, worldStateId, sceneId, counterpartPersonId).then((r) => ({
          bundle: r.bundle,
          brain: r.brain,
          sceneEvaluation: r.evaluation,
        }))
      : getAssembledCharacterBrainState(personId, worldStateId, null).then((r) => ({
          ...r,
          sceneEvaluation: null,
        })),
  ]);

  if (!person || !worldState) {
    notFound();
  }

  const { brain, bundle, sceneEvaluation } = assembled;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-500">Stage 7 derived assembly</div>
          <h1 className="text-3xl font-semibold tracking-tight">{person.name} — Brain Snapshot</h1>
          <p className="mt-1 text-sm text-neutral-700">
            World state: <span className="font-medium">{worldState.label}</span>
            {sceneId ? (
              <span>
                {" "}
                · Scene aware
                {sceneEvaluation?.counterpartSummary ? <span> · Focal counterpart</span> : null}
              </span>
            ) : (
              <span> · World-state only</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-xl border px-3 py-2 text-sm" href="/admin/brain">
            Back to Brain
          </Link>
          <Link className="rounded-xl border px-3 py-2 text-sm" href={`/admin/characters/${personId}/mind`}>
            Character Mind
          </Link>
        </div>
      </div>

      <Section title="Source coverage">
        <KV label="Intelligence" value={bundle.sourceSummary?.intelligenceLoaded ? "Loaded" : "Missing / partial"} />
        <KV label="Pressure" value={bundle.sourceSummary?.pressureLoaded ? "Loaded" : "Missing / partial"} />
        <KV label="Relationships" value={bundle.sourceSummary?.relationshipsLoaded ? "Loaded" : "Missing / partial"} />
        <KV label="Continuity" value={bundle.sourceSummary?.continuityLoaded ? "Loaded" : "Missing / partial"} />
        <KV label="Health" value={bundle.sourceSummary?.healthLoaded ? "Loaded" : "Missing / partial"} />
        <KV label="Environment" value={bundle.sourceSummary?.environmentLoaded ? "Loaded" : "Missing / partial"} />
        <KV label="Era profile" value={bundle.sourceSummary?.eraProfileLoaded ? "Loaded" : "Missing (optional)"} />
      </Section>

      {sceneEvaluation ? (
        <SceneTimeBrainPanel
          evaluation={sceneEvaluation}
          counterpartAlternates={bundle.counterpartAlternates ?? []}
          pinnedCounterpartPersonId={counterpartPersonId}
          hrefBrainPage={(opts) => brainPageHref(personId, worldStateId, sceneId, opts.counterpartPersonId ?? undefined)}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Perception envelope">
          <KV label="Notice bandwidth" value={brain.perception.noticeBandwidth} />
          <KV label="Reaction speed" value={brain.perception.reactionSpeed} />
          <KV label="Likely misses" value={<List items={brain.perception.likelyMisses} />} />
          <KV label="Likely misreads" value={<List items={brain.perception.likelyMisreads} />} />
          <KV label="Sensory biases" value={<List items={brain.perception.sensoryBiases} />} />
        </Section>

        <Section title="Meaning envelope">
          <KV label="Explanatory frame" value={<List items={brain.meaning.explanatoryFrame} />} />
          <KV label="Idiom pressure" value={<List items={brain.meaning.idiomPressure} />} />
          <KV label="Danger frame" value={<List items={brain.meaning.dangerFrame} />} />
          <KV label="Shame frame" value={<List items={brain.meaning.shameFrame} />} />
          <KV label="Hope frame" value={<List items={brain.meaning.hopeFrame} />} />
        </Section>

        <Section title="Regulation envelope">
          <KV label="Baseline regulation" value={brain.regulation.baselineRegulation} />
          <KV label="Overload risk" value={brain.regulation.overloadRisk} />
          <KV label="Freeze risk" value={brain.regulation.freezeRisk} />
          <KV label="Flood risk" value={brain.regulation.floodRisk} />
          <KV label="Likely self-management" value={<List items={brain.regulation.likelySelfManagement} />} />
        </Section>

        <Section title="Relational safety envelope">
          <KV label="Safe people" value={<List items={brain.relationalSafety.safePeople} />} />
          <KV label="Unsafe people" value={<List items={brain.relationalSafety.unsafePeople} />} />
          <KV label="Disclosure cost" value={brain.relationalSafety.disclosureCost} />
          <KV label="Intimacy permission" value={brain.relationalSafety.intimacyPermission} />
          <KV label="Masking need" value={brain.relationalSafety.likelyMaskingNeed} />
          {brain.relationalSafety.dyadDisclosure ? (
            <KV
              label="Dyad disclosure (focal × counterpart)"
              value={
                <span className="text-sm">
                  witness {brain.relationalSafety.dyadDisclosure.witnessSensitivity}; naming{" "}
                  {brain.relationalSafety.dyadDisclosure.namingVsHinting}; reciprocity{" "}
                  {brain.relationalSafety.dyadDisclosure.reciprocityExpectation}
                </span>
              }
            />
          ) : null}
        </Section>
      </div>

      <Section title="Decision envelope">
        <KV label="Speech bandwidth" value={brain.decision.speechBandwidth} />
        <KV label="Defiance cost" value={brain.decision.defianceCost} />
        <KV label="Most likely move" value={brain.decision.mostLikelyMove ?? "None"} />
        <KV label="Available actions" value={<List items={brain.decision.availableActions} />} />
        <KV label="Forbidden actions" value={<List items={brain.decision.forbiddenActions} />} />
      </Section>

      <Section title="Assembly notes">
        <List items={brain.assemblyNotes} />
      </Section>
    </div>
  );
}
