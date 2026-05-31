import vscode from 'vscode';
import { Settings } from '../settings';

const MARKER_MIME_TOKENS = 0; // replay markers don't consume real tokens

/**
 * Estimate the token count for a VS Code chat message or plain string.
 * Uses a chars-per-token ratio that is calibrated over time from actual API usage.
 */
export function estimateTokens(
  input: string | vscode.LanguageModelChatRequestMessage,
  charsPerToken: number,
): number {
  if (typeof input === 'string') {
    return Math.ceil(input.length / charsPerToken);
  }

  let chars = 0;
  for (const part of input.content) {
    if (part instanceof vscode.LanguageModelTextPart) {
      chars += part.value.length;
    } else if (part instanceof vscode.LanguageModelToolCallPart) {
      chars += part.name.length + JSON.stringify(part.input).length;
    } else if (part instanceof vscode.LanguageModelToolResultPart) {
      for (const item of part.content) {
        if (item instanceof vscode.LanguageModelTextPart) chars += item.value.length;
      }
    } else if (part instanceof vscode.LanguageModelDataPart) {
      if (part.mimeType.startsWith('image/')) {
        return Settings.imageTokenEstimate();
      }
      if (part.mimeType === 'stateful_marker') {
        return MARKER_MIME_TOKENS;
      }
      chars += part.data.byteLength;
    } else if (isThinkingPart(part)) {
      const v = (part as vscode.LanguageModelThinkingPart).value;
      const text = Array.isArray(v) ? v.join('') : v;
      chars += text.length;
    }
  }

  return Math.ceil(chars / charsPerToken);
}

/** Update EMA of chars-per-token using actual API usage data. */
export function refineRatio(
  totalRequestChars: number,
  promptTokens: number,
  currentRatio: number,
): number {
  if (promptTokens <= 0 || totalRequestChars <= 0) return currentRatio;
  const observed = totalRequestChars / promptTokens;
  // Exponential moving average with α = 0.2
  return currentRatio * 0.8 + observed * 0.2;
}

function isThinkingPart(part: unknown): boolean {
  return (
    typeof vscode.LanguageModelThinkingPart === 'function' &&
    part instanceof vscode.LanguageModelThinkingPart
  );
}
