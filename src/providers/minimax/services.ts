import type { Service } from '../types';
import { composeService } from '../utils';
import { MM_MODELS } from './models';

export const MINIMAX_SERVICE_DEFS: readonly Service[] = [
  composeService({ key: 'minimaxi.com', label: 'api.minimaxi.com', endpoint: 'https://api.minimaxi.com/v1' }, MM_MODELS),
  composeService({ key: 'minimax.io',   label: 'api.minimax.io',   endpoint: 'https://api.minimax.io/v1' },   MM_MODELS),
];
