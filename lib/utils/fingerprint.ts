/**
 * Normalizes question text for exact duplicate detection.
 * Removes all punctuation, symbols, whitespace, and lowercases text.
 * Handles both English and Hindi Unicode characters cleanly.
 */
export function normalizeTextFingerprint(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    // Keep alphanumeric and Unicode letters (including Devanagari 0900-097F)
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();
}

/**
 * Standardize text by collapsing whitespace and trimming.
 */
export function cleanText(text: string): string {
  if (!text) return "";
  return text.trim().replace(/\s+/g, " ");
}
