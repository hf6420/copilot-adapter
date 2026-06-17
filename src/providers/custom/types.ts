/**
 * Type for a single model entry in the custom models array from chatLanguageModels.json.
 * Mirrors the JSON schema defined in package.json's custom provider configuration.
 */
export interface CustomModelConfig {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly toolCalling: boolean;
  readonly vision: boolean;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
  readonly apiType?: 'chat-completions' | 'responses' | 'messages';
  readonly editTools?: readonly string[];
  readonly thinking?: boolean;
  readonly streaming?: boolean;
  readonly zeroDataRetentionEnabled?: boolean;
  readonly supportsReasoningEffort?: readonly string[];
  readonly reasoningEffortFormat?: 'chat-completions' | 'responses';
  readonly requestHeaders?: Record<string, string>;
}
