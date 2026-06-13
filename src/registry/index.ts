import { Settings } from '../settings';
import { modelKey as _modelKey } from '../providers/utils';
import {
  loadBuiltinModels,
  ALL_PROVIDERS,
  providerById,
  endpointById,
  DEEPSEEK,
  MINIMAX,
  MOONSHOT,
  QWEN,
  ZHIPU,
} from './builtin';
import { loadBuiltinJSONModels } from './builtin-json';
import { loadCustomJSONModels } from './custom-json';
import type { ModelItem, Registries } from './types';

export { ALL_PROVIDERS, providerById, endpointById };
export { DEEPSEEK, MINIMAX, MOONSHOT, QWEN, ZHIPU };
export type { ModelItem };

export function modelKey(mi: ModelItem): string {
  return _modelKey(mi);
}

const CUSTOM_KEY_SUFFIX = '-custom';

export function customModelKey(mi: ModelItem): string {
  return _modelKey(mi) + CUSTOM_KEY_SUFFIX;
}

const _reg: Registries = { providerById, endpointById };

function buildAllModels(customPath: string): ModelItem[] {
  const seen = new Set<string>();
  const result: ModelItem[] = [];

  // Builtin JSON (models/*.json)
  for (const mi of loadBuiltinJSONModels(_reg)) {
    const key = modelKey(mi);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(mi);
    }
  }

  // Custom JSON (user-supplied)
  if (customPath) {
    const { models: customModels } = loadCustomJSONModels(customPath, _reg);
    for (const mi of customModels) {
      const key = customModelKey(mi);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(mi);
      }
    }
  }

  // TS-defined (fallback — only if not already seen)
  for (const mi of loadBuiltinModels()) {
    const key = modelKey(mi);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(mi);
    }
  }

  return result;
}

let _allModels: readonly ModelItem[] = buildAllModels(Settings.customModelsPath());
let _modelById = new Map<string, ModelItem>(
  _allModels.map((mi) => [mi.source === 'custom' ? customModelKey(mi) : modelKey(mi), mi]),
);

export function refreshModels(): void {
  const newAll = buildAllModels(Settings.customModelsPath());
  const newById = new Map<string, ModelItem>(
    newAll.map((mi) => [mi.source === 'custom' ? customModelKey(mi) : modelKey(mi), mi]),
  );
  _allModels = newAll;
  _modelById = newById;
  _exports.ALL_MODELS = newAll;
  _exports.modelById = newById;
}

const _exports = { ALL_MODELS: _allModels, modelById: _modelById } as {
  ALL_MODELS: readonly ModelItem[];
  modelById: ReadonlyMap<string, ModelItem>;
};

export const { ALL_MODELS, modelById } = _exports;
