import type { Service } from '../types';
import { composeService } from '../utils';
import { DS_MODELS } from './models';

export const DEEPSEEK_SERVICE_DEFS: readonly Service[] = [
  composeService({ key: 'deepseek', label: 'DeepSeek', endpoint: 'https://api.deepseek.com' }, DS_MODELS),
];
