/**
 * Default API base URLs for each built-in provider.
 *
 * NOTE: These values must stay in sync with the `default` fields under
 * `contributes.configuration.properties.copilot-adapter.providerEndpoints`
 * in package.json — JSON cannot import from TS, so the manifest mirrors
 * these constants manually.
 */
export const DEFAULT_ENDPOINTS = {
  deepseek: 'https://api.deepseek.com',
  minimax: 'https://api.minimaxi.com/v1',
  moonshot: 'https://api.moonshot.cn/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  bigmodel: 'https://open.bigmodel.cn/api/paas/v4',
} as const;

/**
 * Base URLs keyed by the `apiEndpoint` provider-config value.
 * Keys match the `enum` values declared in package.json for each provider's
 * `apiEndpoint` dropdown.
 */
export const API_ENDPOINT_URLS: Record<string, Record<string, string>> = {
  minimax: {
    'minimaxi.com': 'https://api.minimaxi.com/v1',
    'minimax.io': 'https://api.minimax.io/v1',
  },
  bigmodel: {
    bigmodel: 'https://open.bigmodel.cn/api/paas/v4',
    'bigmodel-coding': 'https://open.bigmodel.cn/api/coding/paas/v4',
    'z.ai': 'https://api.z.ai/api/paas/v4',
    'z.ai-coding': 'https://api.z.ai/api/coding/paas/v4',
  },
  moonshot: {
    'moonshot.cn': 'https://api.moonshot.cn/v1',
    'moonshot.ai': 'https://api.moonshot.ai/v1',
  },
} as const;
