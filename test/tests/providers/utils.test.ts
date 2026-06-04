import assert from 'node:assert/strict';
import { suite, test, afterEach } from 'mocha';
import * as vscode from 'vscode';
import { getEndpoint, resolveTrait } from '../../../src/providers/utils';
import { API_ENDPOINT_URLS, DEFAULT_ENDPOINTS } from '../../../src/providers/endpoints';
import { MINIMAX } from '../../../src/providers/minimax';
import { BIGMODEL } from '../../../src/providers/bigmodel';
import { MOONSHOT } from '../../../src/providers/moonshot';
import { QWEN } from '../../../src/providers/qwen';
import { DEEPSEEK } from '../../../src/providers/deepseek';
import { stub } from '../../helpers/stubs';
import type { Provider } from '../../../src/providers/types';

function stubProviderEndpoint(value: string | undefined, providerId: string): () => void {
  const mockConfig = {
    get<T>(section: string, defaultValue?: T): T {
      if (section === 'providerEndpoints') {
        const map: Record<string, string> = {};
        if (value !== undefined) map[providerId] = value;
        return map as T;
      }

      return defaultValue as T;
    },
    has: () => false,
    inspect: () => undefined,
    update: () => Promise.resolve(),
  } as unknown as vscode.WorkspaceConfiguration;

  return stub(vscode.workspace, 'getConfiguration', () => mockConfig);
}

function stubNoGlobalOverride(): () => void {
  return stubProviderEndpoint('', 'any');
}

interface TestCase {
  label: string;
  provider: Provider;
  apiEndpoint?: string;
  globalOverride?: string;
  expected: string;
}

const cases: TestCase[] = [
  {
    label: 'MiniMax: no overrides returns default endpoint',
    provider: MINIMAX,
    expected: DEFAULT_ENDPOINTS.minimax,
  },
  {
    label: 'BigModel: no overrides returns default endpoint',
    provider: BIGMODEL,
    expected: DEFAULT_ENDPOINTS.bigmodel,
  },
  {
    label: 'Moonshot: no overrides returns default endpoint',
    provider: MOONSHOT,
    expected: DEFAULT_ENDPOINTS.moonshot,
  },
  {
    label: 'Qwen: no overrides returns default endpoint',
    provider: QWEN,
    expected: DEFAULT_ENDPOINTS.qwen,
  },
  {
    label: 'DeepSeek: no overrides returns default endpoint',
    provider: DEEPSEEK,
    expected: DEFAULT_ENDPOINTS.deepseek,
  },
  {
    label: 'MiniMax: apiEndpoint minimaxi.com resolves to mapped URL',
    provider: MINIMAX,
    apiEndpoint: 'minimaxi.com',
    expected: API_ENDPOINT_URLS.minimax['minimaxi.com'],
  },
  {
    label: 'MiniMax: apiEndpoint minimax.io resolves to mapped URL',
    provider: MINIMAX,
    apiEndpoint: 'minimax.io',
    expected: API_ENDPOINT_URLS.minimax['minimax.io'],
  },
  {
    label: 'BigModel: apiEndpoint bigmodel resolves to mapped URL',
    provider: BIGMODEL,
    apiEndpoint: 'bigmodel',
    expected: API_ENDPOINT_URLS.bigmodel.bigmodel,
  },
  {
    label: 'BigModel: apiEndpoint bigmodel-coding resolves to mapped URL',
    provider: BIGMODEL,
    apiEndpoint: 'bigmodel-coding',
    expected: API_ENDPOINT_URLS.bigmodel['bigmodel-coding'],
  },
  {
    label: 'BigModel: apiEndpoint z.ai resolves to mapped URL',
    provider: BIGMODEL,
    apiEndpoint: 'z.ai',
    expected: API_ENDPOINT_URLS.bigmodel['z.ai'],
  },
  {
    label: 'BigModel: apiEndpoint z.ai-coding resolves to mapped URL',
    provider: BIGMODEL,
    apiEndpoint: 'z.ai-coding',
    expected: API_ENDPOINT_URLS.bigmodel['z.ai-coding'],
  },
  {
    label: 'Moonshot: apiEndpoint moonshot.cn resolves to mapped URL',
    provider: MOONSHOT,
    apiEndpoint: 'moonshot.cn',
    expected: API_ENDPOINT_URLS.moonshot['moonshot.cn'],
  },
  {
    label: 'Moonshot: apiEndpoint moonshot.ai resolves to mapped URL',
    provider: MOONSHOT,
    apiEndpoint: 'moonshot.ai',
    expected: API_ENDPOINT_URLS.moonshot['moonshot.ai'],
  },
  {
    label: 'Qwen: apiEndpoint URL is used directly',
    provider: QWEN,
    apiEndpoint: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
    expected: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
  },
  {
    label: 'MiniMax: unknown apiEndpoint key falls back to default',
    provider: MINIMAX,
    apiEndpoint: 'unknown-entry',
    expected: DEFAULT_ENDPOINTS.minimax,
  },
  {
    label: 'MiniMax: empty apiEndpoint falls back to default',
    provider: MINIMAX,
    apiEndpoint: '',
    expected: DEFAULT_ENDPOINTS.minimax,
  },
  {
    label: 'MiniMax: global override wins over apiEndpoint',
    provider: MINIMAX,
    apiEndpoint: 'minimax.io',
    globalOverride: 'https://custom-proxy.example.com/v1',
    expected: 'https://custom-proxy.example.com/v1',
  },
  {
    label: 'DeepSeek: global override wins over default',
    provider: DEEPSEEK,
    globalOverride: 'https://ds-proxy.internal/v1',
    expected: 'https://ds-proxy.internal/v1',
  },
  {
    label: 'Qwen: global override wins over apiEndpoint URL',
    provider: QWEN,
    apiEndpoint: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
    globalOverride: 'https://qwen-gateway.example.com/v1',
    expected: 'https://qwen-gateway.example.com/v1',
  },
];

suite('getEndpoint — priority resolution', () => {
  let restore: () => void;

  afterEach(() => restore?.());

  for (const t of cases) {
    test(t.label, () => {
      if (t.globalOverride !== undefined) {
        restore = stubProviderEndpoint(t.globalOverride, t.provider.id);
      } else {
        restore = stubNoGlobalOverride();
      }

      assert.equal(getEndpoint(t.provider, t.apiEndpoint), t.expected);
    });
  }
});

suite('API_ENDPOINT_URLS — mapping integrity', () => {
  test('MiniMax has 2 entries', () => {
    assert.equal(Object.keys(API_ENDPOINT_URLS.minimax).length, 2);
  });

  test('BigModel has 4 entries', () => {
    assert.equal(Object.keys(API_ENDPOINT_URLS.bigmodel).length, 4);
  });

  test('Moonshot has 2 entries', () => {
    assert.equal(Object.keys(API_ENDPOINT_URLS.moonshot).length, 2);
  });

  test('DeepSeek has no mapping', () => {
    assert.equal(API_ENDPOINT_URLS.deepseek, undefined);
  });

  test('Qwen has no mapping', () => {
    assert.equal(API_ENDPOINT_URLS.qwen, undefined);
  });
});

suite('resolveTrait', () => {
  test('returns model value when defined', () => {
    const result = resolveTrait(
      { tokenRatio: 2.0 } as unknown as Parameters<typeof resolveTrait>[0],
      'tokenRatio',
    );
    assert.equal(result, 2.0);
  });
});
