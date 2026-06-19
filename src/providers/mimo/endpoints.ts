import type { ModelEndpoint } from '../types';
import { composeModelEndpoint } from '../utils';
import { MIMO_MODELS } from './models';

export const MIMO_ENDPOINTS: readonly ModelEndpoint[] = [
  composeModelEndpoint(
    { id: 'mimo', label: 'MIMO', url: 'https://api.xiaomimimo.com/v1' },
    MIMO_MODELS,
  ),
];
