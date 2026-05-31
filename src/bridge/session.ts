import { randomUUID } from 'crypto';
import vscode from 'vscode';
import { readMarkerFromMessage } from '../marker/codec';

export type SessionSource = 'marker' | 'new' | 'invalid';

export class Session {
  readonly id: string;
  readonly source: SessionSource;

  private constructor(id: string, source: SessionSource) {
    this.id = id;
    this.source = source;
  }

  static fromMessages(messages: readonly vscode.LanguageModelChatRequestMessage[]): Session {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== vscode.LanguageModelChatMessageRole.Assistant) continue;

      const mark = readMarkerFromMessage(msg);
      if (!mark) continue;
      if (mark.valid && mark.segmentId) {
        return new Session(mark.segmentId, 'marker');
      }
      if (!mark.valid) {
        return new Session(randomUUID(), 'invalid');
      }
    }

    return new Session(randomUUID(), 'new');
  }
}
