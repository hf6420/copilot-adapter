import type { Service } from '../types';
import { composeService } from '../utils';
import { MS_MODELS } from './models';

export const MOONSHOT_SERVICE_DEFS: readonly Service[] = [
  composeService({ key: 'moonshot.cn', label: 'api.moonshot.cn', endpoint: 'https://api.moonshot.cn/v1' }, MS_MODELS),
  composeService({ key: 'moonshot.ai', label: 'api.moonshot.ai', endpoint: 'https://api.moonshot.ai/v1' }, MS_MODELS),
];
