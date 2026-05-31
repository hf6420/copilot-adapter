/**
 * JSON serialization utilities that handle lone surrogates (U+D800–U+DFFF)
 * which are invalid in UTF-8 but can appear in JavaScript strings from VS Code APIs.
 */

const REPLACEMENT = '\uFFFD';

function sanitize(s: string): string {
  return s.replace(/[\uD800-\uDFFF]/g, (ch) => {
    const code = ch.charCodeAt(0);
    // Keep valid surrogate pairs; replace lone surrogates
    return code >= 0xdc00 ? REPLACEMENT : ch;
  });
}

/**
 * JSON.stringify with lone-surrogate sanitization.
 * Returns a compact JSON string safe for UTF-8 transport.
 */
export function pack(value: unknown): string {
  return sanitize(JSON.stringify(value) ?? 'null');
}

/**
 * JSON.stringify with 2-space indentation, sanitized.
 */
export function packPretty(value: unknown): string {
  return sanitize(JSON.stringify(value, null, 2) ?? 'null');
}
