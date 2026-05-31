import { pack } from '../serialize';
import type { ApiReq, Chunk, StreamEvent, ToolCall } from './types';
import { buildHttpError, toApiError, type ProviderLinks } from './error';
import { channel } from '../logger';
import type { ContentParser } from '../providers/types';

/**
 * Streams a chat completion from an OpenAI-compatible endpoint.
 *
 * Yields typed StreamEvent values — content, thinking, tool-call, usage —
 * via async generator rather than callbacks.
 *
 * @param endpoint      Base URL, e.g. "https://api.deepseek.com" or "https://api.minimax.io/v1"
 * @param apiKey        Bearer token for Authorization header
 * @param body          Request payload (already constructed by caller)
 * @param thinkingField  Provider-specific delta field for reasoning text (e.g. "reasoning_content")
 * @param contentParser  Optional per-request parser for providers that embed reasoning in content
 * @param signal         AbortSignal for cancellation
 * @param links          Optional provider links for richer error messages
 */
export async function* streamHttp(
  endpoint: string,
  apiKey: string,
  body: ApiReq,
  thinkingField: string | undefined,
  contentParser: ContentParser | undefined,
  signal: AbortSignal,
  links?: ProviderLinks,
): AsyncGenerator<StreamEvent> {
  const url = endpoint.endsWith('/chat/completions') ? endpoint : `${endpoint}/chat/completions`;

  const reqBody = pack({ ...body, stream: true });
  channel.debug(`Request body: ${reqBody}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: reqBody,
      signal,
    });
  } catch (err) {
    throw toApiError(err, endpoint, links);
  }

  if (!response.ok) {
    throw await buildHttpError(response, links);
  }

  if (!response.body) {
    throw toApiError(new Error('No response body'), endpoint, links);
  }

  const reader = response.body.getReader();
  const dec = new TextDecoder();
  let buf = '';

  const parser = contentParser;

  const pendingCalls = new Map<number, { id: string; name: string; args: string }>();

  try {
    while (true) {
      if (signal.aborted) return;

      const { done, value } = await reader.read();
      if (done) break;

      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          // Flush any buffered tool calls
          for (const [, tc] of pendingCalls) {
            if (tc.id && tc.name) {
              const call: ToolCall = {
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: tc.args },
              };
              yield { kind: 'tool-call', call };
            }
          }
          pendingCalls.clear();
          if (parser) {
            for (const part of parser.flush()) {
              yield { kind: part.kind, text: part.text };
            }
          }
          return;
        }

        if (!trimmed.startsWith('data: ')) continue;

        let chunk: Chunk;
        try {
          chunk = JSON.parse(trimmed.slice(6)) as Chunk;
        } catch {
          continue;
        }

        // Usage (often comes on the final chunk with empty choices)
        if (chunk.usage) {
          yield { kind: 'usage', data: chunk.usage };
        }

        for (const choice of chunk.choices ?? []) {
          const delta = choice.delta;
          if (!delta) continue;

          if (typeof delta.content === 'string' && delta.content) {
            if (parser) {
              for (const part of parser.feed(delta.content)) {
                yield { kind: part.kind, text: part.text };
              }
            } else {
              yield { kind: 'content', text: delta.content };
            }
          }

          if (thinkingField) {
            const thinking = delta[thinkingField];
            if (typeof thinking === 'string' && thinking) {
              yield { kind: 'thinking', text: thinking };
            }
          }

          if (Array.isArray(delta.tool_calls)) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              let entry = pendingCalls.get(idx);
              if (!entry) {
                entry = { id: '', name: '', args: '' };
                pendingCalls.set(idx, entry);
              }
              if (tc.id) entry.id = tc.id;
              if (tc.function?.name) entry.name += tc.function.name;
              if (tc.function?.arguments) entry.args += tc.function.arguments;
            }
          }

          // Flush complete tool calls on stop
          if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'stop') {
            for (const [, tc] of pendingCalls) {
              if (tc.id && tc.name) {
                yield {
                  kind: 'tool-call',
                  call: {
                    id: tc.id,
                    type: 'function',
                    function: { name: tc.name, arguments: tc.args },
                  },
                };
              }
            }
            pendingCalls.clear();
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
