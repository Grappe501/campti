import type { BeatAssemblyChain, BeatAssemblyCockpitSummary } from "@/lib/domain/beat-assembly";
import { Book1BeatAssemblyService } from "@/lib/services/book1-beat-assembly-service";

export type Chapter1MachineBeatChainArtifact = {
  chain: BeatAssemblyChain;
  cockpitSummary: BeatAssemblyCockpitSummary;
};

export function generateBook1Chapter1MachineBeatChain(): Chapter1MachineBeatChainArtifact {
  const service = new Book1BeatAssemblyService();
  const { chain, cockpitSummary } = service.buildChapter1BeatAssembly();
  return {
    chain,
    cockpitSummary,
  };
}
