import type { ModelProvider } from '../types';

export const CUSTOM: ModelProvider = {
  id: 'custom',
  label: 'Custom Models',
  detailKey: 'provider.custom.detail',
  url: '',
  supportsStreamUsage: true,
};
