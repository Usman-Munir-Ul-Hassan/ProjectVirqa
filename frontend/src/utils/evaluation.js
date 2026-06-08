import { calculatePercentile } from './percentile';
import { getPerformanceRating, mapRecommendation } from './scoring';

// Re-export for backward compatibility — consumers can import from evaluation.js
export { calculatePercentile, getPerformanceRating, mapRecommendation };

/**
 * Determines whether an AI evaluation report is fully completed.
 *
 * A report is considered evaluated if:
 *   1. gradingStatus is explicitly "completed", OR
 *   2. An overallScore exists AND every question has an AI score and feedback.
 *
 * @param {Object|null} report - The report object from the backend.
 * @returns {boolean} true if the evaluation is fully complete.
 */
export const getEvaluationStatus = (report) => {
  if (!report) return false;

  const { gradingStatus, overallScore, questions } = report;

  // Fast path: backend explicitly says completed
  if (gradingStatus && gradingStatus.toLowerCase() === 'completed') return true;

  // Must have a valid overall score
  if (typeof overallScore !== 'number' || overallScore <= 0) return false;

  // Must have questions with AI analysis
  if (!Array.isArray(questions) || questions.length === 0) return false;

  // Every question must have an AI-assigned score AND feedback (reason)
  const allEvaluated = questions.every(
    (q) => typeof q.score === 'number' && q.score >= 0 && (q.reason || q.feedback)
  );

  return allEvaluated;
};

/**
 * Formats standard result data for a candidate/interview
 * @param {Object} report - The candidate report
 * @param {Array<number>} allScores - Array of all scores for percentile calculation
 * @returns {Object} Structured formatting data
 */
export const formatInterviewResult = (report, allScores = []) => {
  const score = report?.overallScore;
  const rating = getPerformanceRating(score);
  const rec = mapRecommendation(report?.recommendation || "N/A");
  const percentile = score != null ? calculatePercentile(score, allScores) : null;

  return {
    score: score != null ? score : null,
    rating,
    recommendation: rec,
    percentile,
    isComplete: getEvaluationStatus(report)
  };
};
