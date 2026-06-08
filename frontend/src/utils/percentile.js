/**
 * Calculates the percentile ranking for a candidate score among all scores.
 * Uses the formula: Percentile Rank = ((L + 0.5 * E) / N) * 100
 *
 * @param {number} score - The candidate's score.
 * @param {number[]} allScores - Array of all candidate scores (may include nulls).
 * @returns {number} Percentile value (0–100), or 0 if data is unavailable.
 */
export const calculatePercentile = (score, allScores) => {
  if (score == null) return 0;

  const validScores = (allScores || []).filter((s) => s != null && typeof s === 'number');

  // Ensure the current candidate's score is in the pool
  if (!validScores.includes(score)) {
    validScores.push(score);
  }

  const N = validScores.length;
  if (N === 0 || N === 1) return 0; // Guard clause

  // L: strictly less than the score
  const L = validScores.filter((s) => s < score).length;
  // E: equal to the score
  const E = validScores.filter((s) => s === score).length;

  // Formula: ((L + 0.5 * E) / N) * 100
  const percentile = ((L + 0.5 * E) / N) * 100;

  return Math.round(percentile);
};
