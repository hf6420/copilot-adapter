import { Settings } from '../settings';
import type { ApiTraits, Model, Provider, Service } from './types';

export function resolveTrait<K extends keyof ApiTraits>(model: Model, key: K): ApiTraits[K] {
  return (model as any)[key] ?? (model.service as any)?.[key] ?? (model.provider as any)[key];
}

export function getEndpoint(provider: Provider, apiEndpoint?: string): string {
  const globalOverride = Settings.providerEndpoint(provider.id);
  if (globalOverride) return globalOverride;

  if (apiEndpoint && provider.services) {
    const svc = resolveService(provider, apiEndpoint);
    if (svc) return svc.endpoint!;
  }

  return provider.services?.[0]?.endpoint ?? provider.endpoint;
}

export function resolveService(provider: Provider, apiEndpoint: string): Service | undefined {
  if (!provider.services) return undefined;

  const exact = provider.services.find((s) => s.key === apiEndpoint);
  if (exact) return exact;

  return provider.services.find((s) => s.matchUrl && apiEndpoint.includes(s.matchUrl));
}

export function composeProvider(provider: Provider, services: readonly Service[]): void {
  provider.services = services as Service[];
  for (const svc of provider.services) {
    svc.provider = provider;
    for (const m of svc.models ?? []) {
      m.provider = provider;
    }
  }
}

export function composeService(service: Service, models: readonly Model[]): Service {
  service.models = models as Model[];
  for (const m of models) {
    m.service = service;
  }

  return service;
}

export function imagePart(
  imageField: string = 'image_url',
): (data: Uint8Array, mimeType: string) => Record<string, unknown> {
  return (data: Uint8Array, mimeType: string): Record<string, unknown> => {
    const base64 = Buffer.from(data).toString('base64');

    return { type: imageField, [imageField]: { url: `data:${mimeType};base64,${base64}` } };
  };
}
