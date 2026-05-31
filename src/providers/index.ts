import { DEEPSEEK } from './deepseek';
import { MINIMAX } from './minimax';
import type { Model, Provider } from './types';

export { DEEPSEEK, MINIMAX };
export type { Provider, Model };

/** All registered providers in display order. */
export const ALL_PROVIDERS: readonly Provider[] = [DEEPSEEK, MINIMAX];

/** Map from provider id → Provider for fast lookup. */
export const providerById = new Map<string, Provider>(ALL_PROVIDERS.map((p) => [p.id, p]));

/** Map from VS Code model id → { provider, model } for fast lookup. */
export const modelById = new Map<string, { provider: Provider; model: Model }>(
  ALL_PROVIDERS.flatMap((p) => p.models.map((m) => [m.id, { provider: p, model: m }])),
);
