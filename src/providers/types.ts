import type { ProviderLinks } from '../client/error';

/**
 * Stateful per-request parser for the content stream.
 * Used by providers that embed reasoning text in the content delta
 * rather than a separate field (e.g. MiniMax's <think>…</think> tags).
 */
export interface ContentParser {
  /** Process the next content chunk. Returns zero or more typed events. */
  feed(chunk: string): Array<{ kind: 'content' | 'thinking'; text: string }>;
  /** Flush any buffered content at end-of-stream. */
  flush(): Array<{ kind: 'content' | 'thinking'; text: string }>;
}

interface BaseAbility {
  /** Max tool functions per request. undefined = tools not supported. */
  maxTools?: number;
  /** Model accepts image input natively (no vision proxy needed). */
  acceptsImages: boolean;
}

export interface ReasoningAbility extends BaseAbility {
  reasoning: true;
  /** XML tag name used to wrap thinking output in the content stream (e.g. 'think'). */
  thinkTag?: string;
}

export interface NonReasoningAbility extends BaseAbility {
  reasoning: false;
}

export type ModelAbility = ReasoningAbility | NonReasoningAbility;

/** Specification of a single model within a provider. */
export interface Model {
  /** Unique VS Code model ID (e.g. "deepseek-v4-flash"). Stable — Copilot Chat caches it. */
  readonly id: string;
  /** Human-readable display name. */
  readonly label: string;
  /** Model ID sent in API requests (may differ from VS Code id). */
  readonly apiId: string;
  readonly family: string;
  readonly version: string;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
  readonly ability: ModelAbility;
  /** NLS key for the detail line shown in the model picker. */
  readonly detailKey: string;
}

/** Specification of a provider (DeepSeek, MiniMax, …). */
export interface Provider {
  /** Short identifier used in secrets key and settings. */
  readonly id: string;
  /** Human-readable display name. */
  readonly label: string;
  /** Default API endpoint (no trailing slash). May include /v1 if needed. */
  readonly defaultEndpoint: string;
  readonly models: readonly Model[];
  /** Chars-per-token estimate for token counting (default 4.0). */
  readonly tokenRatio?: number;
  /** Streaming delta field that carries reasoning text (e.g. "reasoning_content"). */
  readonly thinkingField?: string;
  /** Whether the provider supports stream_options.include_usage. Defaults to true. */
  readonly supportsStreamUsage?: boolean;
  /** External URLs for richer error messages. */
  readonly links?: ProviderLinks;
  /** API key format hint shown in the input prompt (e.g. 'sk-...'). */
  readonly apiKeyHint?: string;

  /**
   * Extra request body fields specific to this provider (e.g. thinking, reasoning_effort).
   * Called for every request. Return {} when no extras are needed.
   */
  requestExtras?(
    modelConfig: Record<string, unknown> | undefined,
    model: Model,
  ): Record<string, unknown>;

  /**
   * JSON schema for the per-model configuration UI in the Copilot Chat model picker.
   * Return undefined if the model has no configurable options.
   */
  configSchema?(model: Model): Record<string, unknown> | undefined;

  /**
   * Factory that creates a per-request content stream parser.
   * Implement this when the provider embeds reasoning in the content delta
   * using a custom format (e.g. XML tags). Return undefined to use raw content.
   */
  createContentParser?(model: Model): ContentParser | undefined;
}
