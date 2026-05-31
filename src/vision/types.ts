import vscode from 'vscode';

export interface VisionStats {
  /** Total image DataParts across all input messages. */
  inputParts: number;
  /** Messages that contain at least one image. */
  inputMessages: number;
  /** Number of "current" user messages sent to the vision proxy. */
  currentMessages: number;
  /** Messages successfully described by the vision proxy. */
  generatedMessages: number;
  /** Messages where a previously stored vision description was replayed. */
  replayedMessages: number;
  /** Image-containing messages that were neither current nor had a stored description. */
  omittedMessages: number;
  /** Messages where the vision proxy was unavailable (no model found). */
  unavailableMessages: number;
  /** Messages where the vision proxy call threw an error. */
  failedMessages: number;
  /** Total image DataParts removed from messages. */
  droppedParts: number;
  /** Total characters in replayed vision descriptions. */
  visionTextChars: number;
}

export interface VisionResult {
  messages: readonly vscode.LanguageModelChatRequestMessage[];
  stats: VisionStats;
  /**
   * Vision description generated for the current user message.
   * Empty string if no images were present or vision proxy was not called.
   * Should be stored in the marker for replay on the next turn.
   */
  newVisionText: string;
  /** ID of the vision proxy model that was used, if any. */
  visionModelId?: string;
}

export function createEmptyVisionStats(): VisionStats {
  return {
    inputParts: 0,
    inputMessages: 0,
    currentMessages: 0,
    generatedMessages: 0,
    replayedMessages: 0,
    omittedMessages: 0,
    unavailableMessages: 0,
    failedMessages: 0,
    droppedParts: 0,
    visionTextChars: 0,
  };
}
