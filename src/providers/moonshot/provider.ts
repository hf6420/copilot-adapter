import { DEFAULT_ENDPOINTS } from '../endpoints';
import type { Provider } from '../types';

export const MOONSHOT: Provider = {
  id: 'moonshot',
  label: 'Moonshot',
  detailKey: 'provider.moonshot.detail',
  endpoint: DEFAULT_ENDPOINTS.moonshot,
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  apiKeyHint: 'sk-...',
  links: {
    apiHost: 'api.moonshot.cn',
    apiKeys: 'https://platform.kimi.com/console/api-keys',
    usage: 'https://platform.kimi.com/console/billing',
    status: 'https://platform.kimi.com',
  },
};
