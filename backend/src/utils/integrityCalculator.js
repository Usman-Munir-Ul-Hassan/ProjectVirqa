/**
 * integrityCalculator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure-function integrity scoring engine.
 *
 * Combines fluency signals (voice layer) + content authenticity (text layer)
 * into a single integrity score and multiplier that adjusts the raw AI score.
 *
 * Design principles:
 *   - Authentic candidates NEVER lose marks (multiplier = 1.0)
 *   - Suspicious signals reduce the score proportionally
 *   - When BOTH layers flag high risk, an amplifier kicks in
 *   - Phase-weighted: technical questions (B) weigh more than warm-up (A)
 *
 * Zero external dependencies. Zero API cost. ~0.1 ms compute.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Fluency band → numeric score mapping (0–100) ─────────────────────────────
const FLUENCY_BAND_SCORE = {
  fluent:     90,
  moderate:   70,
  hesitant:   45,
  struggling: 20,
};

// ── Phase weights for per-question scoring ───────────────────────────────────
const PHASE_WEIGHT = {
  A: 0.7,   // Warm-Up — lower stakes
  B: 1.0,   // Technical Assessment — full weight
  C: 0.8,   // Wrap-Up — slightly reduced
};

// ── Internal helpers (all pure) ──────────────────────────────────────────────

/**
 * Convert a fluency result object into a 0–100 numeric score.
 * If fluency data is unavailable, returns a neutral 60 (no penalty, no bonus).
 */
function fluencyToScore(fluency) {
  if (!fluency || !fluency.available) return 60;
  return FLUENCY_BAND_SCORE[fluency.fluencyBand] ?? 60;
}

/**
 * Extract content authenticity score (0–100) from a contentAuth result.
 * If content data is unavailable, returns a neutral 60.
 */
function contentToScore(contentAuth) {
  if (!contentAuth || !contentAuth.available) return 60;
  return contentAuth.authenticityScore ?? 60;
}

/**
 * Determine risk level from the combined integrity score.
 */
function classifyRisk(integrityScore) {
  if (integrityScore >= 70) return "low";
  if (integrityScore >= 50) return "medium";
  if (integrityScore >= 30) return "high";
  return "critical";
}

/**
 * Compute the final score multiplier from the integrity score.
 *
 * The multiplier is applied to the raw AI score:
 *   finalScore = rawScore × multiplier
 *
 * Authentic candidates always get 1.0 (no penalty).
 * The amplifier triggers when BOTH layers independently flag high risk,
 * producing a harsher penalty than either signal alone.
 */
function computeMultiplier(integrityScore, fluencyScore, contentScore, hasBothSignals) {
  // ── High integrity → no penalty ──────────────────────────────────────────
  if (integrityScore >= 75) return 1.0;

  // ── Moderate integrity → light penalty ───────────────────────────────────
  if (integrityScore >= 60) return 0.90;

  // ── Low integrity → significant penalty ──────────────────────────────────
  if (integrityScore >= 45) return 0.75;

  // ── Very low integrity → heavy penalty ───────────────────────────────────
  if (integrityScore >= 30) return 0.60;

  // ── Critical → amplifier check ───────────────────────────────────────────
  // If BOTH layers independently scored below 40, apply maximum penalty
  if (hasBothSignals && fluencyScore < 40 && contentScore < 40) {
    return 0.40; // Amplifier: dual high-risk
  }

  return 0.50;
}

/**
 * Collect an array of human-readable risk factors from both layers.
 */
function collectRiskFactors(fluency, contentAuth) {
  const factors = [];

  // ── Fluency-based risk factors ───────────────────────────────────────────
  if (fluency && fluency.available) {
    if (fluency.latencyBand === "instant") {
      factors.push("instant_response_latency");
    }
    if (fluency.fillerWordCount === 0 && fluency.wordCount > 15) {
      factors.push("zero_filler_words");
    }
    if (fluency.isRateConsistent && fluency.wordCount > 20) {
      factors.push("unnaturally_consistent_rate");
    }
    if (fluency.fluencyBand === "struggling") {
      factors.push("struggling_fluency");
    }
  }

  // ── Content-based risk factors ───────────────────────────────────────────
  if (contentAuth && contentAuth.available) {
    if (contentAuth.aiPhraseCount >= 3) {
      factors.push("multiple_ai_phrases");
    }
    if (contentAuth.cvSentenceLen < 0.25 && contentAuth.sentenceCount >= 4) {
      factors.push("uniform_sentence_length");
    }
    if (contentAuth.hasNumberedList || contentAuth.hasBulletList) {
      factors.push("structured_list_in_speech");
    }
    if (contentAuth.isTemplateOpening) {
      factors.push("template_opening");
    }
    if (contentAuth.markerCount === 0 && contentAuth.wordCount > 30) {
      factors.push("zero_conversational_markers");
    }
    if (contentAuth.authenticityBand === "likely_ai_generated") {
      factors.push("low_authenticity_score");
    }
  }

  return factors;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * calculateIntegrity(fluencyResult, contentAuthResult)
 *
 * @param {object|null} fluencyResult    Output from analyzeFluency().
 * @param {object|null} contentAuthResult Output from analyzeContentAuthenticity().
 *
 * @returns {object} Integrity analysis result with score, multiplier, risk level.
 */
export function calculateIntegrity(fluencyResult = null, contentAuthResult = null) {
  const fluencyScore  = fluencyToScore(fluencyResult);
  const contentScore  = contentToScore(contentAuthResult);

  const hasFluency  = !!(fluencyResult && fluencyResult.available);
  const hasContent  = !!(contentAuthResult && contentAuthResult.available);
  const hasBoth     = hasFluency && hasContent;

  // ── Weighted combination ─────────────────────────────────────────────────
  // 60% content + 40% fluency (content is a stronger AI-detection signal)
  // When only one layer is available, use it at reduced weight
  let integrityScore;
  if (hasBoth) {
    integrityScore = Math.round(contentScore * 0.6 + fluencyScore * 0.4);
  } else if (hasContent) {
    integrityScore = Math.round(contentScore * 0.8 + 60 * 0.2); // pad fluency with neutral
  } else if (hasFluency) {
    integrityScore = Math.round(fluencyScore * 0.8 + 60 * 0.2); // pad content with neutral
  } else {
    // No data at all → neutral, no penalty
    return {
      available:      false,
      reason:         "no_integrity_data",
      integrityScore: 60,
      multiplier:     1.0,
      riskLevel:      "low",
      riskFactors:    [],
      fluencyScore,
      contentScore,
    };
  }

  const riskLevel   = classifyRisk(integrityScore);
  const multiplier  = computeMultiplier(integrityScore, fluencyScore, contentScore, hasBoth);
  const riskFactors = collectRiskFactors(fluencyResult, contentAuthResult);

  return {
    available:      true,

    // ── Combined score ─────────────────────────────────────────────────────
    integrityScore,

    // ── Score multiplier (apply to raw AI score) ───────────────────────────
    multiplier,

    // ── Risk classification ────────────────────────────────────────────────
    riskLevel,
    riskFactors,

    // ── Component scores (for debugging / transparency) ────────────────────
    fluencyScore,
    contentScore,

    // ── Signal availability ────────────────────────────────────────────────
    hasFluencySignal:  hasFluency,
    hasContentSignal:  hasContent,
  };
}

/**
 * applyIntegrityMultiplier(rawScore, integrityResult, phase?)
 *
 * Convenience function for the evaluation pipeline.
 * Applies the multiplier + phase weight to a raw AI score.
 *
 * @param {number} rawScore       The LLM-assigned score (0–100).
 * @param {object} integrityResult Output from calculateIntegrity().
 * @param {string} [phase]        Interview phase: "A", "B", or "C".
 *
 * @returns {object} { rawScore, adjustedScore, multiplier, phaseWeight }
 */
export function applyIntegrityMultiplier(rawScore, integrityResult, phase = "B") {
  const multiplier = (integrityResult && integrityResult.available)
    ? integrityResult.multiplier
    : 1.0;

  const phaseWeight = PHASE_WEIGHT[phase] ?? 1.0;

  const adjustedScore = Math.max(0, Math.min(100,
    Math.round(rawScore * multiplier * phaseWeight)
  ));

  return {
    rawScore,
    adjustedScore,
    multiplier,
    phaseWeight,
  };
}

/**
 * calculateOverallIntegrity(integrityResults[])
 *
 * Aggregates per-answer integrity results into an interview-level summary.
 * Used for the Report document.
 *
 * @param {Array<object>} integrityResults Array of calculateIntegrity() outputs.
 *
 * @returns {object} Interview-level integrity summary.
 */
export function calculateOverallIntegrity(integrityResults = []) {
  const available = integrityResults.filter(r => r && r.available);

  if (available.length === 0) {
    return {
      available: false,
      overallIntegrityScore: 60,
      avgMultiplier: 1.0,
      riskLevel: "low",
      highRiskAnswers: 0,
      totalAnswers: integrityResults.length,
      riskFactors: [],
    };
  }

  const avgScore = Math.round(
    available.reduce((sum, r) => sum + r.integrityScore, 0) / available.length
  );

  const avgMultiplier = +(
    available.reduce((sum, r) => sum + r.multiplier, 0) / available.length
  ).toFixed(2);

  const highRiskAnswers = available.filter(
    r => r.riskLevel === "high" || r.riskLevel === "critical"
  ).length;

  // Collect all unique risk factors across answers
  const allFactors = new Set();
  for (const r of available) {
    for (const f of r.riskFactors) allFactors.add(f);
  }

  // Overall risk: worst individual level, but elevated if many are flagged
  let overallRisk = classifyRisk(avgScore);
  if (highRiskAnswers >= Math.ceil(available.length * 0.5)) {
    // More than half are high-risk → escalate
    if (overallRisk === "low") overallRisk = "medium";
    if (overallRisk === "medium") overallRisk = "high";
  }

  return {
    available: true,
    overallIntegrityScore: avgScore,
    avgMultiplier,
    riskLevel: overallRisk,
    highRiskAnswers,
    totalAnswers: integrityResults.length,
    riskFactors: [...allFactors],
  };
}

export default calculateIntegrity;
