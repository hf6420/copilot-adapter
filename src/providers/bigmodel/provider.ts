import { DEFAULT_ENDPOINTS } from '../endpoints';
import type { Provider } from '../types';

export const BIGMODEL: Provider = {
  id: 'bigmodel',
  label: 'BigModel',
  detailKey: 'provider.bigmodel.detail',
  endpoint: DEFAULT_ENDPOINTS.bigmodel,
  tokenRatio: 4.0,
  thinkingField: 'reasoning_content',
  apiKeyHint: '...',
  links: {
    apiHost: 'open.bigmodel.cn',
    apiKeys: 'https://open.bigmodel.cn/usercenter/apikeys',
    usage: 'https://open.bigmodel.cn/usercenter/financial',
    status: 'https://open.bigmodel.cn',
  },
};
