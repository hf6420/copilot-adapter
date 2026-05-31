/** Payload written into a marker DataPart. All fields are optional. */
export interface MarkerPayload {
  visionText?: string;
  reasoningText?: string;
}

/** Wire-format of the marker payload. */
export type MarkerPayloadFormat = 'json-base64url' | 'legacy-uuid';

/** Why a visionText field present in the payload was ignored. */
export type VisionTextIgnoredReason =
  | 'vision-not-object'
  | 'vision-text-not-string'
  | 'vision-text-empty';

/** Why a reasoningText field present in the payload was ignored. */
export type ReasoningTextIgnoredReason =
  | 'reasoning-not-object'
  | 'reasoning-text-not-string'
  | 'reasoning-text-empty';

/** Result of decoding a single marker DataPart. */
export interface MarkerResult {
  valid: boolean;
  /** Conversation segment UUID (for session continuity tracking). */
  segmentId?: string;
  visionText?: string;
  visionTextIgnoredReason?: VisionTextIgnoredReason;
  reasoningText?: string;
  reasoningTextIgnoredReason?: ReasoningTextIgnoredReason;
  /** True when the marker contains only a legacy segment UUID and no metadata. */
  legacySegmentOnly?: boolean;
  payloadFormat?: MarkerPayloadFormat;
  error?: string;
}

/** A decoded marker together with its index in message.content. */
export interface LocatedMarker {
  partIndex: number;
  result: MarkerResult;
}
