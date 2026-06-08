import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  ContentParser,
  ModelItem,
  ModelItemJson,
  ModelProvider,
  ModelEndpoint,
  ThinkingConfig,
} from './types';

function buildRequestExtras(
  thinking: ThinkingConfig,
): (modelConfig: Record<string, unknown> | undefined) => Record<string, unknown> {
  const defaultOpt = thinking.options.find((o) => o.value === thinking.default);
  const defaultFields = defaultOpt?.requestFields ?? {};

  return (modelConfig) => {
    const selectedValue = modelConfig?.[thinking.field];
    if (typeof selectedValue !== 'string') return { ...defaultFields };
    const opt = thinking.options.find((o) => o.value === selectedValue);
    return { ...(opt?.requestFields ?? defaultFields) };
  };
}

function buildConfigSchema(thinking: ThinkingConfig): () => Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { t } = require('../nls') as typeof import('../nls');
  const enums = thinking.options.map((o) => o.value);
  const labels = thinking.options.map((o) => t(o.labelKey));
  const hints = thinking.options.map((o) => t(o.hintKey));

  const schema = {
    properties: {
      [thinking.field]: {
        type: 'string',
        title: t('think.label'),
        enum: enums,
        enumItemLabels: labels,
        enumDescriptions: hints,
        default: thinking.default,
        group: 'navigation',
      },
    },
  } as const;

  return () => schema;
}

function buildContentParser(contentTag: string): () => ContentParser {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ThinkTagParser } = require('./parsers/tag') as typeof import('./parsers/tag');
  const parser = new ThinkTagParser(contentTag);
  return () => parser;
}

export interface ModelJsonModule {
  readonly providerId: string;
  readonly endpointKey: string;
  readonly thinking?: ThinkingConfig;
  readonly models: readonly ModelItemJson[];
}

interface Registries {
  readonly providerById: ReadonlyMap<string, ModelProvider>;
  readonly endpointById: ReadonlyMap<string, ModelEndpoint>;
}

export function loadModelsFromJson(module: ModelJsonModule, reg: Registries): ModelItem[] {
  const provider = reg.providerById.get(module.providerId);
  if (!provider) {
    throw new Error(`Unknown providerId "${module.providerId}"`);
  }
  const targetEndpoint = reg.endpointById.get(module.endpointKey);
  if (!targetEndpoint) {
    throw new Error(`Unknown endpointKey "${module.endpointKey}"`);
  }
  const belongs = provider.endpoints?.some((ep) => ep.key === module.endpointKey) ?? false;
  if (!belongs) {
    throw new Error(`Endpoint "${module.endpointKey}" not under provider "${module.providerId}"`);
  }

  const topThinking = module.thinking;

  return module.models.map((raw) => {
    const effectiveThinking = raw.thinking ?? topThinking;
    if (effectiveThinking && !raw.thinking) {
      (raw as { thinking?: ThinkingConfig }).thinking = effectiveThinking;
    }

    const item = {
      ...raw,
      id: `${raw.id}-${module.providerId}`,
      detailKey: raw.detailKey ?? '',
      provider,
      endpoint: targetEndpoint,
    } as ModelItem;

    if (effectiveThinking) {
      item.requestExtras = buildRequestExtras(effectiveThinking);
      item.configSchema = buildConfigSchema(effectiveThinking);
    }
    if (raw.contentTag) {
      item.createContentParser = buildContentParser(raw.contentTag);
    }

    return item;
  });
}

/**
 * Scan `modelsDir` for `*.json` files and load them all.
 * Invalid files are logged and skipped — they never block startup.
 */
export function loadAllJsonModels(modelsDir: string, reg: Registries): ModelItem[] {
  const result: ModelItem[] = [];

  let files: string[];
  try {
    files = fs.readdirSync(modelsDir);
  } catch {
    // models/ directory doesn't exist or is inaccessible — that's fine.
    return result;
  }

  for (const name of files) {
    if (!name.endsWith('.json')) continue;

    const filePath = path.join(modelsDir, name);
    let module: ModelJsonModule;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module = require(filePath) as ModelJsonModule;
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { channel } = require('../logger') as typeof import('../logger');
      channel.warn(`Failed to load JSON model file ${filePath}:`, err);
      continue;
    }

    try {
      result.push(...loadModelsFromJson(module, reg));
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { channel } = require('../logger') as typeof import('../logger');
      channel.warn(`Failed to parse JSON model file ${filePath}:`, err);
    }
  }

  return result;
}
