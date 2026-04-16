import {
  LiterarySymbolDefinitionSchema,
  type LiterarySymbolDefinition,
} from "@/lib/domain/literary-device-control";

export class LiterarySymbolRegistryService {
  upsertSymbols(input: {
    current: LiterarySymbolDefinition[];
    updates: LiterarySymbolDefinition[];
  }): LiterarySymbolDefinition[] {
    const map = new Map(input.current.map((symbol) => [symbol.symbolId, symbol]));
    for (const update of input.updates) {
      map.set(update.symbolId, LiterarySymbolDefinitionSchema.parse(update));
    }
    return Array.from(map.values());
  }

  validateBindings(input: {
    symbols: LiterarySymbolDefinition[];
    activeThreadIds: string[];
    activeSettingIds: string[];
  }): string[] {
    const warnings: string[] = [];
    const activeThreadSet = new Set(input.activeThreadIds);
    const activeSettingSet = new Set(input.activeSettingIds);

    for (const symbol of input.symbols) {
      const hasThreadBinding = symbol.threadBindings.some((id) => activeThreadSet.has(id));
      const hasSettingBinding = symbol.settingBindings.some((id) => activeSettingSet.has(id));
      if (!hasThreadBinding && !hasSettingBinding) {
        warnings.push(`Symbol ${symbol.symbolId} is decorative: no active thread/setting binding in this chapter.`);
      }
      if (symbol.recurrenceTarget === "motif_driven" && symbol.payoffWindow.trim().length === 0) {
        warnings.push(`Symbol ${symbol.symbolId} motif-driven mode requires a payoff window.`);
      }
    }

    return warnings;
  }
}
