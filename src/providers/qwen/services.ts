import type { Service } from '../types';
import { composeService } from '../utils';
import { QWEN_BASE_MODELS, QWEN_US_MODELS } from './models';

export const QWEN_SERVICE_DEFS: readonly Service[] = [
  composeService(
    { key: 'cn', label: 'CN Beijing', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1', matchStr: 'dashscope.aliyuncs.com' },
    QWEN_BASE_MODELS,
  ),
  composeService(
    { key: 'us', label: 'US', endpoint: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1', matchStr: 'dashscope-us.aliyuncs.com' },
    [...QWEN_BASE_MODELS, ...QWEN_US_MODELS],
  ),
  composeService(
    { key: 'sgp', label: 'Singapore', endpoint: 'https://{workspace}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1', matchStr: 'ap-southeast-1.maas.aliyuncs.com' },
    QWEN_BASE_MODELS,
  ),
  composeService(
    { key: 'eu', label: 'EU (Frankfurt)', endpoint: 'https://{workspace}.eu-central-1.maas.aliyuncs.com/compatible-mode/v1', matchStr: 'eu-central-1.maas.aliyuncs.com' },
    QWEN_BASE_MODELS,
  ),
];
