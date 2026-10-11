import { normalizeTextFingerprint } from "./fingerprint";

/**
 * Extracts 3-character shingles (trigrams) from a string.
 */
function getTrigrams(str: string): Set<string> {
  const padded = `  ${str.toLowerCase().trim()}  `;
  const trigrams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Calculates Trigram similarity between two strings, mimicking PostgreSQL's pg_trgm similarity().
 * Returns a score between 0.0 and 1.0.
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const trigramsA = getTrigrams(a);
  const trigramsB = getTrigrams(b);

  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) {
      intersection++;
    }
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks if question text A is a duplicate or similar to question text B.
 * Layer 1: Exact normalized fingerprint match (1.0).
 * Layer 2: Trigram similarity >= 0.45.
 */
export function checkSimilarity(textA: string, textB: string): { isExact: boolean; score: number } {
  const fpA = normalizeTextFingerprint(textA);
  const fpB = normalizeTextFingerprint(textB);

  if (fpA && fpB && fpA === fpB) {
    return { isExact: true, score: 1.0 };
  }

  const score = calculateTrigramSimilarity(textA, textB);
  return {
    isExact: score >= 0.95,
    score,
  };
}
