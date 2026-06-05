import { DEEPSEEK, DEEPSEEK_SERVICE_DEFS } from './deepseek';
import { MINIMAX, MINIMAX_SERVICE_DEFS } from './minimax';
import { MOONSHOT, MOONSHOT_SERVICE_DEFS } from './moonshot';
import { QWEN, QWEN_SERVICE_DEFS } from './qwen';
import { BIGMODEL, BIGMODEL_SERVICE_DEFS } from './bigmodel';
import { composeProvider } from './utils';
import type { Model, Provider, Service } from './types';

export { DEEPSEEK, MINIMAX, MOONSHOT, QWEN, BIGMODEL };
export type { Provider, Service, Model };

composeProvider(DEEPSEEK, DEEPSEEK_SERVICE_DEFS);
composeProvider(MINIMAX, MINIMAX_SERVICE_DEFS);
composeProvider(MOONSHOT, MOONSHOT_SERVICE_DEFS);
composeProvider(QWEN, QWEN_SERVICE_DEFS);
composeProvider(BIGMODEL, BIGMODEL_SERVICE_DEFS);

export const ALL_PROVIDERS: readonly Provider[] = [
  DEEPSEEK,
  MINIMAX,
  MOONSHOT,
  QWEN,
  BIGMODEL,
];

export const ALL_MODELS: readonly Model[] = (() => {
  const seen = new Set<string>();
  const result: Model[] = [];
  for (const p of ALL_PROVIDERS) {
    for (const svc of p.services ?? []) {
      for (const m of svc.models ?? []) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          result.push(m);
        }
      }
    }
  }
  return result;
})();

export const modelById = new Map<string, Model>(ALL_MODELS.map((m) => [m.id, m]));

export const providerById = new Map<string, Provider>(ALL_PROVIDERS.map((p) => [p.id, p]));

export const serviceById = new Map<string, Service>(
  ALL_PROVIDERS.flatMap((p) => p.services ?? []).map((s) => [s.key, s]),
);
