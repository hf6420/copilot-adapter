export interface UsagePayload {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
    cache_miss?: number;
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
}
