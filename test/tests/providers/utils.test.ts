import assert from 'node:assert/strict';
import { suite, test, afterEach } from 'mocha';
import * as vscode from 'vscode';
import { composeProvider, composeService, getEndpoint, resolveService, resolveTrait } from '../../../src/providers/utils';
import { DEFAULT_ENDPOINTS } from '../../../src/providers/endpoints';
import { MINIMAX } from '../../../src/providers/minimax';
import { BIGMODEL } from '../../../src/providers/bigmodel';
import { MOONSHOT } from '../../../src/providers/moonshot';
import { QWEN } from '../../../src/providers/qwen';
import { DEEPSEEK } from '../../../src/providers/deepseek';
import { stub } from '../../helpers/stubs';
import type { Model, Provider } from '../../../src/providers/types';

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

interface EndpointCase {
  label: string;
  provider: Provider;
  apiEndpoint?: string;
  globalOverride?: string;
  expected: string;
}

const cases: EndpointCase[] = [
  {
    label: 'MiniMax: no overrides returns first service endpoint',
    provider: MINIMAX,
    expected: DEFAULT_ENDPOINTS.minimax,
  },
  {
    label: 'BigModel: no overrides returns first service endpoint',
    provider: BIGMODEL,
    expected: DEFAULT_ENDPOINTS.bigmodel,
  },
  {
    label: 'Moonshot: no overrides returns first service endpoint',
    provider: MOONSHOT,
    expected: DEFAULT_ENDPOINTS.moonshot,
  },
  {
    label: 'Qwen: no overrides returns first service endpoint',
    provider: QWEN,
    expected: DEFAULT_ENDPOINTS.qwen,
  },
  {
    label: 'DeepSeek: no overrides returns first service endpoint',
    provider: DEEPSEEK,
    expected: DEFAULT_ENDPOINTS.deepseek,
  },

  {
    label: 'MiniMax: apiEndpoint minimaxi.com resolves via service key',
    provider: MINIMAX,
    apiEndpoint: 'minimaxi.com',
    expected: 'https://api.minimaxi.com/v1',
  },
  {
    label: 'MiniMax: apiEndpoint minimax.io resolves via service key',
    provider: MINIMAX,
    apiEndpoint: 'minimax.io',
    expected: 'https://api.minimax.io/v1',
  },
  {
    label: 'BigModel: apiEndpoint bigmodel resolves via service key',
    provider: BIGMODEL,
    apiEndpoint: 'bigmodel',
    expected: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint bigmodel-coding resolves via service key',
    provider: BIGMODEL,
    apiEndpoint: 'bigmodel-coding',
    expected: 'https://open.bigmodel.cn/api/coding/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint z.ai resolves via service key',
    provider: BIGMODEL,
    apiEndpoint: 'z.ai',
    expected: 'https://api.z.ai/api/paas/v4',
  },
  {
    label: 'BigModel: apiEndpoint z.ai-coding resolves via service key',
    provider: BIGMODEL,
    apiEndpoint: 'z.ai-coding',
    expected: 'https://api.z.ai/api/coding/paas/v4',
  },
  {
    label: 'Moonshot: apiEndpoint moonshot.cn resolves via service key',
    provider: MOONSHOT,
    apiEndpoint: 'moonshot.cn',
    expected: 'https://api.moonshot.cn/v1',
  },
  {
    label: 'Moonshot: apiEndpoint moonshot.ai resolves via service key',
    provider: MOONSHOT,
    apiEndpoint: 'moonshot.ai',
    expected: 'https://api.moonshot.ai/v1',
  },

  // Qwen text-input mode: URL containing `dashscope-us` should match the US service via `match`
  {
    label: 'Qwen: full US URL matches US service via matchStr',
    provider: QWEN,
    apiEndpoint: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
    expected: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
  },

  // Unknown / empty apiEndpoint falls back to first service endpoint
  {
    label: 'MiniMax: unknown apiEndpoint falls back to first service endpoint',
    provider: MINIMAX,
    apiEndpoint: 'unknown-entry',
    expected: DEFAULT_ENDPOINTS.minimax,
  },
  {
    label: 'MiniMax: empty apiEndpoint falls back to first service endpoint',
    provider: MINIMAX,
    apiEndpoint: '',
    expected: DEFAULT_ENDPOINTS.minimax,
  },

  // Global providerEndpoints override beats everything
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

suite('resolveService', () => {
  test('returns Service by exact key match (BigModel)', () => {
    const svc = resolveService(BIGMODEL, 'z.ai-coding');
    assert.equal(svc?.key, 'z.ai-coding');
    assert.equal(svc?.endpoint, 'https://api.z.ai/api/coding/paas/v4');
  });

  test('returns Qwen US service by match', () => {
    const svc = resolveService(QWEN, 'https://dashscope-us.aliyuncs.com/compatible-mode/v1');
    assert.equal(svc?.key, 'us');
  });

  test('returns Qwen SGP service by match', () => {
    const svc = resolveService(QWEN, 'https://abc.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(svc?.key, 'sgp');
  });

  test('returns Qwen EU service by match', () => {
    const svc = resolveService(QWEN, 'https://xyz.eu-central-1.maas.aliyuncs.com/compatible-mode/v1');
    assert.equal(svc?.key, 'eu');
  });

  test('returns Qwen CN service by match', () => {
    const svc = resolveService(QWEN, 'https://dashscope.aliyuncs.com/compatible-mode/v1');
    assert.equal(svc?.key, 'cn');
  });

  test('returns undefined when no service matches', () => {
    const svc = resolveService(MINIMAX, 'totally-unknown');
    assert.equal(svc, undefined);
  });

  test('returns undefined when provider has no services', () => {
    const fake = { id: 'x', services: undefined } as unknown as Provider;
    assert.equal(resolveService(fake, 'whatever'), undefined);
  });
});

suite('composeProvider / composeService', () => {
  test('composeService returns Service with model back-refs', () => {
    const m1 = { id: 'm1' } as unknown as Model;
    const m2 = { id: 'm2' } as unknown as Model;
    const svc = composeService(
      { key: 'a', label: 'A', endpoint: 'https://a.example.com' },
      [m1, m2],
    );
    assert.equal(svc.models!.length, 2);
    assert.equal(m1.service?.key, 'a');
    assert.equal(m2.service?.key, 'a');
  });

  test('composeProvider wires services with provider back-refs', () => {
    const provider = { id: 'fake' } as unknown as Provider;
    const m = { id: 'm1' } as unknown as Model;
    const svc = composeService({ key: 'a', label: 'A', endpoint: 'https://a.example.com' }, [m]);

    composeProvider(provider, [svc]);

    assert.equal(provider.services?.length, 1);
    assert.equal(provider.services?.[0].provider, provider);
  });
});

suite('Service.models — visibility', () => {
  test('Qwen US service includes US-only models', () => {
    const us = QWEN.services?.find((s) => s.key === 'us');
    const usIds = us?.models!.map((m) => m.id) ?? [];
    assert.ok(usIds.includes('qwen-plus-us'), 'US service should contain qwen-plus-us');
    assert.ok(usIds.includes('qwen-flash-us'), 'US service should contain qwen-flash-us');
  });

  test('Qwen CN service does NOT include US-only models', () => {
    const cn = QWEN.services?.find((s) => s.key === 'cn');
    const cnIds = cn?.models!.map((m) => m.id) ?? [];
    assert.ok(!cnIds.includes('qwen-plus-us'), 'CN service should not contain qwen-plus-us');
    assert.ok(!cnIds.includes('qwen-flash-us'), 'CN service should not contain qwen-flash-us');
    assert.ok(cnIds.length > 0, 'CN service should have base models');
  });

  test('Qwen US service includes base models', () => {
    const us = QWEN.services?.find((s) => s.key === 'us');
    const usIds = us?.models!.map((m) => m.id) ?? [];
    assert.ok(usIds.includes('qwen3.7-max'), 'US service should contain shared base model');
  });
});

suite('resolveTrait — model > service > provider chain', () => {
  test('returns model value when defined on model', () => {
    const provider = { tokenRatio: 1.0 } as unknown as Provider;
    const service = { tokenRatio: 2.0 } as unknown as Model['service'];
    const model = { tokenRatio: 3.0, provider, service } as unknown as Model;
    assert.equal(resolveTrait(model, 'tokenRatio'), 3.0);
  });

  test('falls back to service when model lacks the trait', () => {
    const provider = { tokenRatio: 1.0 } as unknown as Provider;
    const service = { tokenRatio: 2.0 } as unknown as Model['service'];
    const model = { provider, service } as unknown as Model;
    assert.equal(resolveTrait(model, 'tokenRatio'), 2.0);
  });

  test('falls back to provider when neither model nor service defines the trait', () => {
    const provider = { tokenRatio: 1.0 } as unknown as Provider;
    const service = {} as unknown as Model['service'];
    const model = { provider, service } as unknown as Model;
    assert.equal(resolveTrait(model, 'tokenRatio'), 1.0);
  });

  test('returns undefined when no level defines the trait', () => {
    const provider = {} as unknown as Provider;
    const service = {} as unknown as Model['service'];
    const model = { provider, service } as unknown as Model;
    assert.equal(resolveTrait(model, 'tokenRatio'), undefined);
  });
});

suite('Provider/Service composition — invariants', () => {
  test('every model has a service back-reference', () => {
    for (const p of [MINIMAX, MOONSHOT, BIGMODEL, QWEN, DEEPSEEK]) {
      for (const svc of p.services ?? []) {
        for (const m of svc.models!) {
          assert.ok(m.service, `${m.id} must have a service back-reference`);
        }
      }
    }
  });

  test('MiniMax services share identical models', () => {
    const ids0 = MINIMAX.services?.[0].models!.map((m) => m.id);
    const ids1 = MINIMAX.services?.[1].models!.map((m) => m.id);
    assert.deepEqual(ids0, ids1);
  });

  test('every service has provider back-reference', () => {
    for (const p of [MINIMAX, MOONSHOT, BIGMODEL, QWEN, DEEPSEEK]) {
      for (const svc of p.services ?? []) {
        assert.equal(svc.provider, p, `service ${svc.key}.provider must point at owner`);
      }
    }
  });

  test('every model has provider set by composeProvider', () => {
    for (const p of [MINIMAX, MOONSHOT, BIGMODEL, QWEN, DEEPSEEK]) {
      for (const svc of p.services ?? []) {
        for (const m of svc.models!) {
          assert.equal(m.provider, p, `${m.id}.provider must equal its owning provider`);
        }
      }
    }
  });

  test('DeepSeek has a single service even though it has no variants', () => {
    assert.equal(DEEPSEEK.services?.length, 1);
    assert.equal(DEEPSEEK.services?.[0].key, 'deepseek');
  });
});
