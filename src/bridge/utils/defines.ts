import { EXT_ID } from '../../defines';

export const ACTIVATE_PREFIX = 'activate_';

export const WARMUP_CALL_ID_PREFIX = `${EXT_ID}_preflight_activate_`;

export const MAX_WARMUP_ROUNDS = 3;

export const DRIFT_NOTICE_START = `[${EXT_ID}-tool-drift-notice-start]: #`;
export const DRIFT_NOTICE_END = `[${EXT_ID}-tool-drift-notice-end]: #`;
