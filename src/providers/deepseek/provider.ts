import { DEFAULT_ENDPOINTS } from '../endpoints';
import type { Provider } from '../types';

export const DEEPSEEK: Provider = {
  id: 'deepseek',
  label: 'DeepSeek',
  detailKey: 'provider.deepseek.detail',
  endpoint: DEFAULT_ENDPOINTS.deepseek,
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'api.deepseek.com',
    apiKeys: 'https://platform.deepseek.com/api_keys',
    usage: 'https://platform.deepseek.com/usage',
    status: 'https://status.deepseek.com',
  },
};
