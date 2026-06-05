import type { Service } from '../types';
import { composeService } from '../utils';
import { BM_MODELS } from './models';

export const BIGMODEL_SERVICE_DEFS: readonly Service[] = [
  composeService({ key: 'bigmodel',        label: 'open.bigmodel.cn (standard)',    endpoint: 'https://open.bigmodel.cn/api/paas/v4'      }, BM_MODELS),
  composeService({ key: 'bigmodel-coding', label: 'open.bigmodel.cn (coding plan)', endpoint: 'https://open.bigmodel.cn/api/coding/paas/v4' }, BM_MODELS),
  composeService({ key: 'z.ai',            label: 'api.z.ai (standard)',            endpoint: 'https://api.z.ai/api/paas/v4'                }, BM_MODELS),
  composeService({ key: 'z.ai-coding',     label: 'api.z.ai (coding plan)',         endpoint: 'https://api.z.ai/api/coding/paas/v4'         }, BM_MODELS),
];
