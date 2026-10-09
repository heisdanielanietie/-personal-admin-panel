export const MAX_HTML_BYTES = 20_000_000;
// A worst-case JSON-escaped chunk stays below the function request limit.
export const HTML_CHUNK_CHARS = 500_000;
export const MAX_HTML_PARTS = Math.ceil(MAX_HTML_BYTES / HTML_CHUNK_CHARS);
