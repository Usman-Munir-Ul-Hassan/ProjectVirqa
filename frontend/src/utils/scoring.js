/**
 * Returns a consistent performance rating label based on the overall score.
 * @param {number} score - Overall score
 * @returns {string} Performance label (Excellent, Good, Average, Poor)
 */
export const getPerformanceRating = (score) => {
  if (score == null || typeof score !== 'number') return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Poor";
};

/**
 * Maps the AI recommendation to standard categories
 * @param {string} rec - The raw recommendation
 * @returns {string} Standardized recommendation
 */
export const mapRecommendation = (rec) => {
  if (!rec) return "N/A";
  if (rec === "Strong Pass") return "Strong Hire";
  if (rec === "Pass") return "Hire";
  if (rec === "Borderline") return "Consider";
  if (rec === "Fail") return "Reject";
  return rec;
};
