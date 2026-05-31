import { EXT_ID } from '../defines';

/** MIME type used for marker DataParts. Must stay stable for history compatibility. */
export const MARKER_MIME = 'stateful_marker';

/** Writer ID embedded in every marker this extension creates. */
export const WRITER_ID = EXT_ID;

export const ENCODED_JSON_PREFIX = 'json:';

export const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
