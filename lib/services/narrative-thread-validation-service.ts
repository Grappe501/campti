import {
  type NarrativeThread,
  NarrativeThreadSchema,
  type NarrativeThreadState,
  type ThreadNode,
  ThreadNodeSchema,
} from "@/lib/domain/narrative-thread";

const ALLOWED_THREAD_STATE_TRANSITIONS: Record<NarrativeThreadState, NarrativeThreadState[]> = {
  seeded: ["active", "latent", "suppressed", "redirected"],
  active: ["latent", "suppressed", "converging", "diverging", "recalled", "resolved", "transformed", "reinterpreted"],
  latent: ["active", "recalled", "suppressed", "resolved", "converging"],
  suppressed: ["latent", "active", "redirected"],
  redirected: ["active", "latent", "converging", "diverging"],
  converging: ["active", "resolved", "transformed"],
  diverging: ["active", "latent", "converging"],
  recalled: ["active", "reinterpreted", "resolved"],
  reinterpreted: ["active", "resolved", "transformed"],
  resolved: ["transformed"],
  transformed: ["active", "resolved"],
};

export type NarrativeThreadValidationResult = {
  passesAll: boolean;
  errors: string[];
  warnings: string[];
};

export class NarrativeThreadValidationService {
  validateThread(thread: NarrativeThread): NarrativeThreadValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const schema = NarrativeThreadSchema.safeParse(thread);
    if (!schema.success) {
      for (const issue of schema.error.issues) {
        errors.push(`Schema: ${issue.path.join(".")} ${issue.message}`);
      }
      return { passesAll: false, errors, warnings };
    }

    if (!thread.nodes.some((node) => node.nodeType === "seed")) {
      errors.push(`Thread ${thread.threadId} must include at least one seed node.`);
    }

    for (const node of thread.nodes) {
      const nodeResult = this.validateNode(node, thread);
      errors.push(...nodeResult.errors);
      warnings.push(...nodeResult.warnings);
    }

    if (thread.threadType === "philosophy_thread" && thread.philosophyBindings.length === 0) {
      warnings.push(`Thread ${thread.threadId} is philosophy_thread but has no philosophyBindings.`);
    }

    if ((thread.threadType === "setting_thread" || thread.threadType === "route_thread") && thread.locationBindings.length === 0) {
      errors.push(`Thread ${thread.threadId} (${thread.threadType}) must bind at least one location.`);
    }

    if (thread.currentStatus === "resolved" && thread.callbackPotential > 0.75) {
      warnings.push(`Thread ${thread.threadId} is resolved but callbackPotential remains very high.`);
    }

    return { passesAll: errors.length === 0, errors, warnings };
  }

  validateThreadStateTransition(from: NarrativeThreadState, to: NarrativeThreadState): boolean {
    return ALLOWED_THREAD_STATE_TRANSITIONS[from].includes(to);
  }

  private validateNode(node: ThreadNode, thread: NarrativeThread): NarrativeThreadValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const schema = ThreadNodeSchema.safeParse(node);
    if (!schema.success) {
      for (const issue of schema.error.issues) {
        errors.push(`Node ${node.threadNodeId}: ${issue.path.join(".")} ${issue.message}`);
      }
      return { passesAll: false, errors, warnings };
    }

    if (node.parentThreadId !== thread.threadId) {
      errors.push(`Node ${node.threadNodeId} references parentThreadId ${node.parentThreadId}, expected ${thread.threadId}.`);
    }

    if (!this.validateThreadStateTransition(node.stateShift.from, node.stateShift.to)) {
      errors.push(
        `Node ${node.threadNodeId} has invalid state shift ${node.stateShift.from} -> ${node.stateShift.to}.`,
      );
    }

    if (node.nodeType === "callback" && !node.callbackMarker) {
      errors.push(`Node ${node.threadNodeId} is callback but lacks callbackMarker.`);
    }

    if (node.hiddenConvergenceKey && node.delayedConvergenceBinding.length === 0) {
      warnings.push(`Node ${node.threadNodeId} declares hiddenConvergenceKey without delayed bindings.`);
    }

    if (node.nodeType === "reinterpretation" && node.visibleToReader === "hidden") {
      warnings.push(`Node ${node.threadNodeId} is reinterpretation but fully hidden from reader.`);
    }

    return { passesAll: errors.length === 0, errors, warnings };
  }
}
