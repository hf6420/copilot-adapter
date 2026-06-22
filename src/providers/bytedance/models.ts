import type { ModelItem } from '../types';
import { BYTEDANCE } from './provider';
import { VOLCENGINE_THINKING } from '../defines';

import { DEEPSEEK_V4_PRO, DEEPSEEK_V4_FLASH } from '../deepseek/models';
import { ZHIPU_GLM_4_7 } from '../zhipu/models'

const DOUBAO_SEED_BASE = {
  family: 'doubao-seed',
  provider: BYTEDANCE,
  thinking: true,
  imageInput: true,
  maxTools: 128,
  thinkingConfig: VOLCENGINE_THINKING,
  maxTokensField: 'max_completion_tokens',
};

export const DOUBAO_SEED_2_0_PRO_260215: ModelItem = {
  ...DOUBAO_SEED_BASE,
  id: 'doubao-seed-2.0-pro',
  label: 'Doubao Seed 2.0 Pro (260215)',
  apiId: 'doubao-seed-2-0-pro-260215',
  version: '2.0',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.doubao-seed-2.0-pro.detail',
} as ModelItem;

export const DOUBAO_SEED_2_0_MINI_260428: ModelItem = {
  ...DOUBAO_SEED_BASE,
  id: 'doubao-seed-2.0-mini',
  label: 'Doubao Seed 2.0 Mini (260428)',
  apiId: 'doubao-seed-2-0-mini-260428',
  version: '2.0',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.doubao-seed-2.0-mini.detail',
} as ModelItem;

export const DOUBAO_SEED_2_0_MINI_260215: ModelItem = {
  ...DOUBAO_SEED_2_0_MINI_260428,
  id: 'doubao-seed-2.0-mini-260215',
  label: 'Doubao Seed 2.0 Mini (260215)',
  apiId: 'doubao-seed-2-0-mini-260215',
} as ModelItem;

export const DOUBAO_SEED_2_0_LITE_260428 : ModelItem = {
  ...DOUBAO_SEED_BASE,
  id: 'doubao-seed-2.0-lite',
  label: 'Doubao Seed 2.0 Lite (260428)',
  apiId: 'doubao-seed-2-0-lite-260428',
  version: '2.0',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.doubao-seed-2.0-lite.detail',
} as ModelItem;

export const DOUBAO_SEED_2_0_LITE_260215: ModelItem = {
  ...DOUBAO_SEED_2_0_LITE_260428,
  id: 'doubao-seed-2.0-lite-260215',
  label: 'Doubao Seed 2.0 Lite (260215)',
  apiId: 'doubao-seed-2-0-lite-260215',
} as ModelItem;

export const DOUBAO_SEED_2_0_CODE: ModelItem = {
  ...DOUBAO_SEED_BASE,
  id: 'doubao-seed-2.0-code',
  label: 'Doubao Seed 2.0 Code',
  apiId: 'doubao-seed-2-0-code-preview-260215',
  version: '2.0',
  maxInputTokens: 256_000,
  maxOutputTokens: 128_000,
  detailKey: 'model.doubao-seed-2.0-code.detail',
} as ModelItem;

export const DEEPSEEK_V4_PRO_260425: ModelItem = {
  ...DEEPSEEK_V4_PRO,
  apiId: 'deepseek-v4-pro-260425'
} as ModelItem

export const DEEPSEEK_V4_FLASH_260425: ModelItem = {
  ...DEEPSEEK_V4_FLASH,
  apiId: 'deepseek-v4-flash-260425'
} as ModelItem

export const ZHIPU_GLM_4_7_251222: ModelItem = {
  ...ZHIPU_GLM_4_7,
  apiId: 'glm-4-7-251222'
} as ModelItem

export const VOLCENGINE_MODELS: readonly ModelItem[] = [
  DOUBAO_SEED_2_0_PRO_260215,
  DOUBAO_SEED_2_0_MINI_260428,
  DOUBAO_SEED_2_0_MINI_260215,
  DOUBAO_SEED_2_0_LITE_260428,
  DOUBAO_SEED_2_0_LITE_260215,
  DOUBAO_SEED_2_0_CODE,
  DEEPSEEK_V4_PRO_260425,
  DEEPSEEK_V4_FLASH_260425,
  ZHIPU_GLM_4_7_251222
] as ModelItem[];
