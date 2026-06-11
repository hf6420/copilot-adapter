import * as fs from 'node:fs';
import { channel } from '../logger';
import { t } from '../nls';
import { loadModelsFromJson } from '../providers/loader';
import { modelKey } from '../providers/utils';
import type { ModelItem, ThinkingConfig, ModelAbility } from '../providers/types';
import type { ModelJsonModule } from '../providers/loader';
import type { ModelProvider, ModelEndpoint } from '../providers/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationError {
  /** Human-readable error message (already localized). */
  message: string;
  /** 1-based line number where the error occurred, or 0 if unknown. */
  line: number;
}

/**
 * A single custom model entry — flat, self-contained, one entry per model.
 */
export interface CustomModelEntry {
  id: string;
  label: string;
  provider: string;
  endpoints: string[];
  family?: string;
  version?: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  detail?: string;
  reasoning?: boolean;
  imageInput?: boolean;
  maxTools?: number;
  imageField?: string;
  thinking?: ThinkingConfig;
  contentTag?: string;

  /** Internal: validated form of ability + detail merged in during loading. */
  _ability?: ModelAbility;
  _detailKey?: string;
}

interface Registries {
  readonly providerById: ReadonlyMap<string, ModelProvider>;
  readonly endpointById: ReadonlyMap<string, ModelEndpoint>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

// ---------------------------------------------------------------------------
// Per-model validation
// ---------------------------------------------------------------------------

function isArrayOfStrings(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x.length > 0);
}

/**
 * Validate a single CustomModelEntry.
 * Returns an array of error messages (empty = valid).
 */
export function validateCustomModelEntry(raw: unknown, idx: number): string[] {
  const errors: string[] = [];
  const prefix = `[${idx}]`;

  if (!isRecord(raw)) {
    errors.push(`${prefix}: ${t('customModels.validation.notAnObject')}`);
    return errors;
  }

  const m = raw as Record<string, unknown>;

  // Required string fields
  if (!isNonEmptyString(m.id)) {
    errors.push(`${prefix}.id: ${t('customModels.validation.requiredString')}`);
  }
  if (!isNonEmptyString(m.label)) {
    errors.push(`${prefix}.label: ${t('customModels.validation.requiredString')}`);
  }
  if (!isNonEmptyString(m.provider)) {
    errors.push(`${prefix}.provider: ${t('customModels.validation.requiredString')}`);
  }

  // endpoints: required, must be a non-empty array of strings
  if (!isArrayOfStrings(m.endpoints)) {
    if (Array.isArray(m.endpoints)) {
      // An empty string inside the array can't be distinguished well — just say "non-empty string array"
      errors.push(`${prefix}.endpoints: ${t('customModels.validation.nonEmptyStringArray')}`);
    } else {
      errors.push(`${prefix}.endpoints: ${t('customModels.validation.requiredStringArray')}`);
    }
  }

  // maxInputTokens (optional, positive int)
  if (m.maxInputTokens !== undefined && !isPositiveInt(m.maxInputTokens)) {
    errors.push(`${prefix}.maxInputTokens: ${t('customModels.validation.positiveInt')}`);
  }
  // maxOutputTokens (optional, positive int)
  if (m.maxOutputTokens !== undefined && !isPositiveInt(m.maxOutputTokens)) {
    errors.push(`${prefix}.maxOutputTokens: ${t('customModels.validation.positiveInt')}`);
  }

  // reasoning (optional, boolean)
  if (m.reasoning !== undefined && typeof m.reasoning !== 'boolean') {
    errors.push(`${prefix}.reasoning: ${t('customModels.validation.boolean')}`);
  }
  // imageInput (optional, boolean)
  if (m.imageInput !== undefined && typeof m.imageInput !== 'boolean') {
    errors.push(`${prefix}.imageInput: ${t('customModels.validation.boolean')}`);
  }
  // maxTools (optional, positive int)
  if (m.maxTools !== undefined && !isPositiveInt(m.maxTools)) {
    errors.push(`${prefix}.maxTools: ${t('customModels.validation.positiveInt')}`);
  }

  // thinking (optional)
  if (m.thinking !== undefined) {
    errors.push(...validateThinking(m.thinking, `${prefix}.thinking`));
  }

  return errors;
}

function validateThinking(raw: unknown, prefix: string): string[] {
  const errs: string[] = [];

  if (!isRecord(raw)) {
    errs.push(`${prefix}: ${t('customModels.validation.notAnObject')}`);
    return errs;
  }

  const th = raw as Record<string, unknown>;

  if (!isNonEmptyString(th.default)) {
    errs.push(`${prefix}.default: ${t('customModels.validation.requiredString')}`);
  }
  if (!Array.isArray(th.options)) {
    errs.push(`${prefix}.options: ${t('customModels.validation.array')}`);
    return errs;
  }

  const options = th.options as unknown[];
  const defaultVal = th.default as string | undefined;
  let foundDefault = false;

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (!isRecord(opt)) {
      errs.push(`${prefix}.options[${i}]: ${t('customModels.validation.notAnObject')}`);
      continue;
    }
    if (!isNonEmptyString(opt.value)) {
      errs.push(`${prefix}.options[${i}].value: ${t('customModels.validation.requiredString')}`);
    }
    if (!isNonEmptyString(opt.label)) {
      errs.push(`${prefix}.options[${i}].label: ${t('customModels.validation.requiredString')}`);
    }
    if (defaultVal !== undefined && opt.value === defaultVal) {
      foundDefault = true;
    }
  }

  if (defaultVal !== undefined && !foundDefault) {
    errs.push(
      `${prefix}.default: ${t('customModels.validation.thinkingDefaultMismatch')} "${defaultVal}"`,
    );
  }

  return errs;
}

// ---------------------------------------------------------------------------
// Top-level array validation
// ---------------------------------------------------------------------------

/**
 * Validate an array of custom model entries.
 * Returns all validation errors (empty = all valid).
 */
export function validateCustomModelArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [t('customModels.validation.topLevelArray')];
  }

  const errors: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    errors.push(...validateCustomModelEntry(raw[i], i));
  }

  return errors;
}

// ---------------------------------------------------------------------------
// File loading
// ---------------------------------------------------------------------------

export interface CustomModelsResult {
  models: ModelItem[];
  errors: ValidationError[];
}

/**
 * Parse a JSON string into an array, returning parse errors
 * with approximate line numbers.
 */
function parseJsonArray(text: string): { data: unknown[]; parseErrors: ValidationError[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err: unknown) {
    const message = err instanceof SyntaxError ? err.message : String(err);
    const lineMatch = message.match(/line\s+(\d+)/i);
    const line = lineMatch ? Number(lineMatch[1]) : 0;
    return {
      data: [],
      parseErrors: [{ message: `${t('customModels.validation.jsonParse')}: ${message}`, line }],
    };
  }

  if (!Array.isArray(raw)) {
    return {
      data: [],
      parseErrors: [{ message: t('customModels.validation.topLevelArray'), line: 0 }],
    };
  }

  return { data: raw, parseErrors: [] };
}

/**
 * Label prefix added to every custom model so users can distinguish them
 * from built-in models in the model picker.
 */
const CUSTOM_LABEL_PREFIX = t('customModels.labelPrefix');

/** Suffix appended to modelKey for custom models to avoid collisions. */
const CUSTOM_KEY_SUFFIX = '-custom';

/**
 * Group flat entries by (provider, endpoint), building ModelJsonModule
 * structures.  An entry with N endpoints produces N copies (one per endpoint).
 */
function groupEntries(reg: Registries, entries: CustomModelEntry[]): ModelJsonModule[] {
  const groups = new Map<string, { providerId: string; endpointId: string; models: Record<string, unknown>[] }>();

  for (const entry of entries) {
    const provider = reg.providerById.get(entry.provider);
    if (!provider) continue;

    for (const epId of entry.endpoints) {
      const key = `${entry.provider}\0${epId}`;
      let group = groups.get(key);
      if (!group) {
        group = { providerId: entry.provider, endpointId: epId, models: [] };
        groups.set(key, group);
      }

      const ability: ModelAbility = {
        reasoning: entry.reasoning ?? true,
        imageInput: entry.imageInput ?? false,
        ...(entry.maxTools !== undefined ? { maxTools: entry.maxTools } : {}),
        ...(entry.imageField !== undefined ? { imageField: entry.imageField } : {}),
      };

      group.models.push({
        id: entry.id,
        label: `${CUSTOM_LABEL_PREFIX} ${entry.label}`,
        apiId: entry.id,
        family: entry.family ?? 'custom',
        version: entry.version ?? '',
        maxInputTokens: entry.maxInputTokens ?? 128_000,
        maxOutputTokens: entry.maxOutputTokens ?? 32_000,
        detailKey: '_custom',
        ability,
        _detail: entry.detail ?? '',
        ...(entry.thinking ? { thinking: entry.thinking } : {}),
        ...(entry.contentTag ? { contentTag: entry.contentTag } : {}),
      });
    }
  }

  return [...groups.values()].map((g) => ({
    providerId: g.providerId,
    endpointId: g.endpointId,
    models: g.models,
  })) as ModelJsonModule[];
}

/**
 * Load custom models from a JSON file path.
 *
 * Expected format: an array of flat model entries:
 * ```json
 * [
 *   { "id": "my-model", "label": "My Model", "provider": "qwen",
 *     "endpoints": ["cn", "us"], "reasoning": true, "imageInput": false }
 * ]
 * ```
 *
 * - filePath empty → returns empty result
 * - file not found → returns empty result (not an error)
 * - JSON parse error → returns error diagnostics
 * - validation errors → returns error diagnostics
 */
export function loadCustomModels(filePath: string, reg: Registries): CustomModelsResult {
  if (!filePath) {
    return { models: [], errors: [] };
  }

  let text: string;
  try {
    text = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return { models: [], errors: [] };
  }

  const { data, parseErrors } = parseJsonArray(text);
  if (parseErrors.length > 0) {
    return { models: [], errors: parseErrors };
  }

  // Structural validation (flat entries)
  const validationErrors = validateCustomModelArray(data);
  if (validationErrors.length > 0) {
    return {
      models: [],
      errors: validationErrors.map((msg) => ({ message: msg, line: 0 })),
    };
  }

  const entries = data as CustomModelEntry[];

  // Validate provider/endpoint references exist in registries
  const refErrors: ValidationError[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!reg.providerById.has(e.provider)) {
      refErrors.push({
        message: `[${i}].provider: ${t('customModels.validation.unknownProvider')} "${e.provider}"`,
        line: 0,
      });
    } else {
      for (const epId of e.endpoints) {
        if (!reg.endpointById.has(epId)) {
          refErrors.push({
            message: `[${i}].endpoints: ${t('customModels.validation.unknownEndpoint')} "${epId}"`,
            line: 0,
          });
        } else {
          const provider = reg.providerById.get(e.provider)!;
          const belongs = provider.endpoints?.some((ep) => ep.id === epId) ?? false;
          if (!belongs) {
            refErrors.push({
              message: `[${i}].endpoints: ${t('customModels.validation.endpointNotUnderProvider')} "${epId}" under "${e.provider}"`,
              line: 0,
            });
          }
        }
      }
    }
  }
  if (refErrors.length > 0) {
    return { models: [], errors: refErrors };
  }

  // Group by (provider, endpoint) and feed to existing loader
  const modules = groupEntries(reg, entries);

  const models: ModelItem[] = [];
  for (const mod of modules) {
    try {
      models.push(...loadModelsFromJson(mod, reg));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      channel.warn(`Failed to load custom models from ${filePath}:`, err);
      return { models: [], errors: [{ message, line: 0 }] };
    }
  }

  return { models, errors: [] };
}

// ---------------------------------------------------------------------------
// Custom modelKey
// ---------------------------------------------------------------------------

/**
 * Custom model keys get a `-custom` suffix so they never collide with
 * built-in models.
 */
export function customModelKey(mi: ModelItem): string {
  return modelKey(mi) + CUSTOM_KEY_SUFFIX;
}
