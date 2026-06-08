/**
 * scoreComputation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure functions for interview score computation, penalty application,
 * recommendation derivation, and metric resolution.
 *
 * Extracted from triggerBackgroundEvaluation to satisfy SRP.
 * Zero dependencies. Zero side effects.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Compute overall score as the average of per-question scores.
 * Only counts questions with score > 0 (answered questions).
 *
 * @param {Array<{score: number}>} questions
 * @returns {number} Rounded average, or 0 if no valid scores.
 */
export function computeOverallScore(questions) {
  const scores = Array.isArray(questions)
    ? questions
        .map((q) => (typeof q.score === "number" ? q.score : 0))
        .filter((s) => s > 0)
    : [];

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * Apply early-leave penalty based on how much of the interview was completed.
 *
 * @param {number} score                  Current computed score.
 * @param {number|null} durationMinutes   Planned duration in minutes.
 * @param {number|null} actualDurationSeconds  Actual time spent in seconds.
 * @returns {number} Score after penalty (unchanged if >= 75% completed).
 */
export function applyEarlyLeavePenalty(score, durationMinutes, actualDurationSeconds) {
  if (!durationMinutes || !actualDurationSeconds) return score;

  const completionRatio = actualDurationSeconds / (durationMinutes * 60);

  if (completionRatio < 0.25) return Math.min(score, 20);
  if (completionRatio < 0.5)  return Math.min(score, 40);
  if (completionRatio < 0.75) return Math.max(0, score - 15);
  return score; // >= 75%: no penalty
}

/**
 * Reconcile AI-returned overall score with computed score.
 * Uses computed score when AI returns 0 but questions have valid scores.
 *
 * @param {number} aiOverallScore     Score from AI (may be 0 erroneously).
 * @param {number} computedScore      Score computed from per-question averages.
 * @param {Array} questions           Parsed questions array (to check if any answered).
 * @returns {number} Final overall score.
 */
export function resolveFinalScore(aiOverallScore, computedScore, questions) {
  const hasAnswered = Array.isArray(questions) && questions.some(q => typeof q.score === "number" && q.score > 0);

  if (aiOverallScore === 0 && hasAnswered) return computedScore;
  if (aiOverallScore > 0) return aiOverallScore;
  return computedScore;
}

/**
 * Derive recommendation label from final score.
 *
 * @param {number} score  Final overall score (0–100).
 * @returns {"Strong Pass"|"Pass"|"Borderline"|"Fail"}
 */
export function deriveRecommendation(score) {
  if (score >= 80) return "Strong Pass";
  if (score >= 60) return "Pass";
  if (score >= 40) return "Borderline";
  return "Fail";
}

/**
 * Resolve evaluation metrics with fallback computation.
 * If AI metrics are all zero, derives them from question scores.
 *
 * @param {object} aiMetrics       AI-returned metrics (may be all zeros).
 * @param {Array} questions        Parsed questions array.
 * @param {number} computedScore   Fallback computed overall score.
 * @returns {{technicalAccuracy: number, communication: number, problemSolving: number}}
 */
export function resolveMetrics(aiMetrics, questions, computedScore) {
  const metrics = aiMetrics || {};
  const hasValid = (metrics.technicalAccuracy > 0 || metrics.communication > 0 || metrics.problemSolving > 0);

  if (hasValid) {
    return {
      technicalAccuracy: metrics.technicalAccuracy ?? 0,
      communication:     metrics.communication ?? 0,
      problemSolving:    metrics.problemSolving ?? 0,
    };
  }

  // Fallback: derive from question scores
  const scores = Array.isArray(questions)
    ? questions.map(q => (typeof q.score === "number" ? q.score : 0)).filter(s => s > 0)
    : [];
  const avg = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;

  return {
    technicalAccuracy: computedScore,
    communication:     Math.round(avg * 0.85),
    problemSolving:    Math.round(avg * 0.75),
  };
}

/**
 * Validate and normalise a parsed question entry.
 * Ensures all fields have safe defaults.
 *
 * @param {object} q  Raw question from AI scoring JSON.
 * @returns {object|null} Normalised question, or null if invalid.
 */
export function normaliseQuestion(q) {
  if (!q || !q.question) return null;

  return {
    question:       q.question ?? "",
    candidateAnswer: q.candidateAnswer ?? "",
    expectedAnswer:  q.expectedAnswer ?? "",
    suggestion:      q.suggestion ?? "",
    rating: ["poor", "average", "good", "excellent"].includes(q.rating) ? q.rating : "average",
    score:           typeof q.score === "number" ? q.score : 0,
    reason:          q.reason ?? "",
  };
}
