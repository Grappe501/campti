/**
 * P4-D — Provider resilience and fallback matrix.
 */
export type ProviderResilienceKind = "llm" | "voice" | "payment";

export type ProviderResilienceState = "healthy" | "degraded" | "failed";

export type ProviderResilienceSnapshot = {
  llm: ProviderResilienceState;
  voice: ProviderResilienceState;
  payment: ProviderResilienceState;
  lastUpdatedAtIso: string;
  lastReason: string | null;
};

const providerState: Record<ProviderResilienceKind, ProviderResilienceState> = {
  llm: "healthy",
  voice: "healthy",
  payment: "healthy",
};

let lastUpdatedAtIso = new Date().toISOString();
let lastReason: string | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateState(kind: ProviderResilienceKind, state: ProviderResilienceState, reason?: string): void {
  providerState[kind] = state;
  lastUpdatedAtIso = new Date().toISOString();
  if (reason) lastReason = reason;
}

function resolveRetryAttempts(raw: string | undefined, fallback: number): number {
  const parsed = raw ? parseInt(raw, 10) : fallback;
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, 4);
}

export type ProviderResilienceExecutionResult<T> = {
  value: T;
  usedFallback: boolean;
  retries: number;
};

export async function executeWithProviderResilience<T>(params: {
  kind: ProviderResilienceKind;
  operation: () => Promise<T>;
  fallback: () => Promise<T> | T;
  maxRetries?: number;
  baseBackoffMs?: number;
}): Promise<ProviderResilienceExecutionResult<T>> {
  const maxRetries =
    params.maxRetries ??
    resolveRetryAttempts(process.env.PROVIDER_RESILIENCE_MAX_RETRIES, 2);
  const baseBackoffMs = Math.max(5, params.baseBackoffMs ?? 40);

  let retries = 0;
  while (retries <= maxRetries) {
    try {
      const value = await params.operation();
      updateState(params.kind, retries > 0 ? "degraded" : "healthy");
      return { value, usedFallback: false, retries };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (retries >= maxRetries) {
        updateState(params.kind, "failed", message);
        const value = await params.fallback();
        updateState(params.kind, "degraded", message);
        return { value, usedFallback: true, retries };
      }
      retries += 1;
      updateState(params.kind, "degraded", message);
      await sleep(baseBackoffMs * 2 ** (retries - 1));
    }
  }

  const value = await params.fallback();
  updateState(params.kind, "failed", "unknown_resilience_failure");
  return { value, usedFallback: true, retries: maxRetries };
}

export function markProviderFailure(kind: ProviderResilienceKind, reason: string): void {
  updateState(kind, "failed", reason);
}

export function getProviderResilienceSnapshot(): ProviderResilienceSnapshot {
  return {
    llm: providerState.llm,
    voice: providerState.voice,
    payment: providerState.payment,
    lastUpdatedAtIso,
    lastReason,
  };
}

export function resetProviderResilienceStateForTests(): void {
  providerState.llm = "healthy";
  providerState.voice = "healthy";
  providerState.payment = "healthy";
  lastUpdatedAtIso = new Date().toISOString();
  lastReason = null;
}

