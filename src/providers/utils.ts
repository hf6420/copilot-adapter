import { Settings } from '../settings';
import { API_ENDPOINT_URLS } from './endpoints';
import type { ApiTraits, Model, Provider } from './types';

export function resolveTrait<K extends keyof ApiTraits>(model: Model, key: K): ApiTraits[K] {
  return model[key] ?? model.provider[key];
}

export function getEndpoint(provider: Provider, apiEndpoint?: string): string {
  const globalOverride = Settings.providerEndpoint(provider.id);
  if (globalOverride) return globalOverride;

  if (apiEndpoint && apiEndpoint.length > 0) {
    const map = API_ENDPOINT_URLS[provider.id];
    if (map) {
      const url = map[apiEndpoint];
      if (url) return url;
    } else {
      return apiEndpoint;
    }
  }

  return provider.endpoint;
}

export function imagePart(
  imageField: string = 'image_url',
): (data: Uint8Array, mimeType: string) => Record<string, unknown> {
  return (data: Uint8Array, mimeType: string): Record<string, unknown> => {
    const base64 = Buffer.from(data).toString('base64');

    return { type: imageField, [imageField]: { url: `data:${mimeType};base64,${base64}` } };
  };
}
