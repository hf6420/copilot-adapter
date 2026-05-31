import vscode from 'vscode';
import { pack } from '../serialize';
import { readMarkerFromMessage } from '../marker/codec';
import type { Msg, Tool, ToolCall } from '../client/types';

/**
 * Converts VS Code chat messages to the LLM wire format.
 *
 * When `thinkingField` is provided, injects stored reasoning content from
 * the replay marker into assistant messages under that field name.
 */
export function translateMessages(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
  thinkingField?: string,
): Msg[] {
  const out: Msg[] = [];

  for (const msg of messages) {
    const role = toRole(msg.role);

    let textContent = '';
    let thinkingContent = '';
    const toolCalls: ToolCall[] = [];
    const toolResults: { callId: string; text: string }[] = [];

    for (const part of msg.content) {
      if (part instanceof vscode.LanguageModelTextPart) {
        textContent += part.value;
      } else if (isThinkingPart(part)) {
        thinkingContent += extractThinkingText(part);
      } else if (part instanceof vscode.LanguageModelToolCallPart) {
        toolCalls.push({
          id: part.callId,
          type: 'function',
          function: { name: part.name, arguments: pack(part.input) },
        });
      } else if (part instanceof vscode.LanguageModelToolResultPart) {
        let text = '';
        for (const item of part.content) {
          if (item instanceof vscode.LanguageModelTextPart) text += item.value;
        }
        toolResults.push({ callId: part.callId, text: text || pack(part.content) });
      }
      // DataParts (image markers, replay markers) are intentionally skipped here —
      // vision text is injected at the pre-processing stage in describe.ts
    }

    if (role === 'assistant') {
      if (textContent || toolCalls.length > 0) {
        const m: Msg = { role: 'assistant', content: textContent };
        if (toolCalls.length > 0) m.tool_calls = toolCalls;
        if (thinkingField) {
          m[thinkingField] = resolveThinking(msg, thinkingField, thinkingContent);
        }
        out.push(m);
      }
    } else {
      if (textContent) {
        out.push({ role, content: textContent });
      }
    }

    for (const tr of toolResults) {
      out.push({ role: 'tool', content: tr.text, tool_call_id: tr.callId });
    }
  }

  return out;
}

function resolveThinking(
  msg: vscode.LanguageModelChatRequestMessage,
  _field: string,
  liveThinking: string,
): string {
  const mark = readMarkerFromMessage(msg);
  if (mark?.valid && mark.reasoningText) return mark.reasoningText;
  return liveThinking;
}

export function translateTools(
  tools: readonly vscode.LanguageModelChatTool[] | undefined,
): Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description || t.name,
      parameters: (t.inputSchema as Record<string, unknown> | undefined) ?? {
        type: 'object',
        properties: {},
      },
    },
  }));
}

export function countMsgChars(messages: Msg[]): number {
  let n = 0;
  for (const m of messages) {
    n += m.content.length;
    if (m.tool_calls) {
      for (const tc of m.tool_calls) n += tc.function.arguments.length + tc.function.name.length;
    }
  }
  return n;
}

function toRole(role: vscode.LanguageModelChatMessageRole): 'user' | 'assistant' {
  return role === vscode.LanguageModelChatMessageRole.Assistant ? 'assistant' : 'user';
}

function isThinkingPart(part: unknown): part is vscode.LanguageModelThinkingPart {
  return (
    typeof vscode.LanguageModelThinkingPart === 'function' &&
    part instanceof vscode.LanguageModelThinkingPart
  );
}

function extractThinkingText(part: vscode.LanguageModelThinkingPart): string {
  const v = part.value;
  return Array.isArray(v) ? v.join('') : v;
}
