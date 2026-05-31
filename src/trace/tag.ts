import vscode from 'vscode';

export type RequestTag =
  | 'main-agent'
  | 'terminal-steering'
  | 'todo-tracker'
  | 'settings-resolver'
  | 'background'
  | 'unknown';

/** Heuristically classify a chat request by its message content and tools. */
export function tagRequest(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
  tools: readonly vscode.LanguageModelChatTool[] | undefined,
): RequestTag {
  const toolNames = new Set(tools?.map((t) => t.name) ?? []);

  if (toolNames.has('runInTerminal') || toolNames.has('run_in_terminal')) {
    return 'terminal-steering';
  }

  const lastUser = [...messages]
    .reverse()
    .find((m) => m.role === vscode.LanguageModelChatMessageRole.User);

  if (!lastUser) return 'unknown';

  const text = lastUser.content
    .filter((p): p is vscode.LanguageModelTextPart => p instanceof vscode.LanguageModelTextPart)
    .map((p) => p.value)
    .join(' ')
    .toLowerCase();

  if (text.includes('todo') || text.includes('task list') || text.includes('checklist')) {
    return 'todo-tracker';
  }

  if (text.includes('setting') || text.includes('configuration') || text.includes('configure')) {
    return 'settings-resolver';
  }

  if (!tools || tools.length === 0) {
    return 'background';
  }

  return 'main-agent';
}
