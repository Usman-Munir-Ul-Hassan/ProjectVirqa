/**
 * evaluationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: background interview evaluation pipeline.
 *
 * Owns the complete evaluation lifecycle:
 *   1. Pending Report stub creation
 *   2. AI scoring via LLM
 *   3. Score computation + early-leave penalty
 *   4. Report upsert
 *   5. Per-answer integrity analysis (content + fluency + multiplier)
 *   6. Overall integrity summary
 *   7. Notification dispatch
 *
 * Extracted from interview.controller.js to satisfy SRP.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Interview from "../models/interview.model.js";
import Report from "../models/report.model.js";
import Question from "../models/question.model.js";
import Answer from "../models/answer.model.js";
import { fetchAIChat } from "../utils/openrouterClient.js";
import { buildScoringPrompt } from "../constants.js";
import { createAndEmitNotification } from "../controllers/notification.controller.js";
import { analyzeContentAuthenticity } from "../utils/contentAuthAnalyzer.js";
import { calculateIntegrity, applyIntegrityMultiplier, calculateOverallIntegrity } from "../utils/integrityCalculator.js";
import {
  computeOverallScore,
  applyEarlyLeavePenalty,
  resolveFinalScore,
  deriveRecommendation,
  resolveMetrics,
  normaliseQuestion,
} from "./scoreComputation.js";

// Helper to get the io instance
const getIo = () => {
  try { return global._io; } catch { return null; }
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND EVALUATOR
// Runs completely out-of-band after interview ends.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trigger the full background evaluation pipeline.
 * Same signature as the original in interview.controller.js for backward compatibility.
 *
 * @param {string} interviewId
 * @param {string} candidateId
 * @param {string} jobTitle
 * @param {string} jobDescription
 * @param {Array} history
 * @param {string|null} [resumeText]
 * @param {number|null} [durationMinutes]
 * @param {number|null} [actualDurationSeconds]
 * @param {Array} [fluencyMap]
 */
export const triggerBackgroundEvaluation = async (
  interviewId,
  candidateId,
  jobTitle,
  jobDescription,
  history,
  resumeText = null,
  durationMinutes = null,
  actualDurationSeconds = null,
  fluencyMap = []
) => {
  // ── Step 1: Ensure a "pending" Report stub exists BEFORE the AI call ─────
  await Report.findOneAndUpdate(
    { interview: interviewId, candidate: candidateId },
    { $setOnInsert: { interview: interviewId, candidate: candidateId, jobTitle, gradingStatus: "pending" } },
    { upsert: true }
  ).catch((err) => {
    console.error(`[VIRQA-EVALUATOR] Failed to create pending stub for interview ${interviewId}:`, err.message);
  });

  // ── Step 2: AI scoring + Report update ────────────────────────────────────
  let parsedScores = null;
  try {
    const evaluationPrompt = buildScoringPrompt({
      jobTitle,
      jobDescription: jobDescription || "No specific description provided.",
      history,
      resumeText: resumeText || null,
      durationMinutes: durationMinutes || null,
      actualDurationSeconds: actualDurationSeconds || null,
    });

    const aiResponseData = await fetchAIChat(
      [{ role: "system", content: evaluationPrompt }],
      { temperature: 0.1 }
    );

    const rawText = aiResponseData.choices[0].message.content;

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON block found in grading response.");

    parsedScores = JSON.parse(jsonMatch[0].trim());

    // Persist finalScores onto Interview
    await Interview.findByIdAndUpdate(interviewId, { finalScores: parsedScores });

    // ── Score computation (extracted to scoreComputation.js) ────────────────
    let computedOverallScore = computeOverallScore(parsedScores.questions);
    computedOverallScore = applyEarlyLeavePenalty(computedOverallScore, durationMinutes, actualDurationSeconds);

    const aiOverallScore = typeof parsedScores.overallScore === "number" ? parsedScores.overallScore : 0;
    const finalOverallScore = resolveFinalScore(aiOverallScore, computedOverallScore, parsedScores.questions);

    const autoRecommendation = deriveRecommendation(finalOverallScore);
    const computedMetrics = resolveMetrics(parsedScores.evaluationMetrics || {}, parsedScores.questions, computedOverallScore);

    const reportPayload = {
      interview: interviewId,
      candidate: candidateId,
      jobTitle: jobTitle,
      overallScore: finalOverallScore,
      recommendation: ["Strong Pass", "Pass", "Borderline", "Fail"].includes(parsedScores.recommendation)
        ? parsedScores.recommendation
        : autoRecommendation,
      evaluationMetrics: computedMetrics,
      questions: Array.isArray(parsedScores.questions)
        ? parsedScores.questions.map((q) => normaliseQuestion(q)).filter(Boolean)
        : [],
      gradingStatus: "completed",
      gradedAt: new Date(),
      rawScoringPayload: rawText,
    };

    await Report.findOneAndUpdate(
      { interview: interviewId, candidate: candidateId },
      { $set: reportPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[VIRQA-EVALUATOR] Report saved for session: ${interviewId} candidate: ${candidateId}`);

    // ── Notify employee: report is ready ──────────────────────────────────
    try {
      const interviewDoc = await Interview.findById(interviewId).select("employee jobTitle").lean();
      if (interviewDoc?.employee) {
        const io = getIo();
        await createAndEmitNotification({
          io,
          recipientId: interviewDoc.employee,
          senderId: candidateId,
          type: "results",
          title: "Interview Report Ready",
          message: `The evaluation report for ${interviewDoc.jobTitle} interview is ready.`,
          details: `Overall Score: ${parsedScores.overallScore}/100 — Recommendation: ${parsedScores.recommendation}`,
          link: "/api/v1/employee/history",
          relatedEntity: { entityType: "report", entityId: interviewId },
        });
      }
    } catch (notifErr) {
      console.error(`[VIRQA-EVALUATOR] Notification error (employee):`, notifErr.message);
    }

    // ── Notify candidate: results are available ────────────────────────────
    try {
      const io = getIo();
      await createAndEmitNotification({
        io,
        recipientId: candidateId,
        type: "results",
        title: "Your Interview Results Are Ready",
        message: `Your ${jobTitle} interview has been evaluated. View your results now.`,
        link: "/api/v1/candidates/results",
        relatedEntity: { entityType: "report", entityId: interviewId },
      });
    } catch (notifErr) {
      console.error(`[VIRQA-EVALUATOR] Notification error (candidate):`, notifErr.message);
    }
  } catch (err) {
    console.error(`[VIRQA-EVALUATOR] Grading failure for interview ${interviewId} candidate ${candidateId}:`, err.message);
    await Report.findOneAndUpdate(
      { interview: interviewId, candidate: candidateId },
      { $set: { gradingStatus: "failed" } }
    ).catch(() => { });
  }

  // ── Step 3: Answer upsert loop with integrity analysis ────────────────────
  const perAnswerIntegrityResults = [];

  if (Array.isArray(parsedScores?.questions)) {
    for (const qData of parsedScores.questions) {
      if (!qData.question) continue;
      try {
        const questionDoc = await Question.findOneAndUpdate(
          { text: qData.question },
          {
            $setOnInsert: {
              text: qData.question,
              category: jobTitle,
              difficulty: "intermediate",
              baseWeight: 10
            }
          },
          { upsert: true, new: true }
        );

        // Correlate fluency data by matching candidate answer text
        const fluencyEntry = fluencyMap.find(f => f.userText === qData.candidateAnswer);
        const fluencyData  = (fluencyEntry && fluencyEntry.data) ? fluencyEntry.data : null;
        const answerElapsedMs = (fluencyEntry && fluencyEntry.elapsedMs) ? fluencyEntry.elapsedMs : null;

        // Content authenticity analysis (text layer)
        const contentAuthResult = analyzeContentAuthenticity(
          qData.candidateAnswer || "",
          answerElapsedMs,
          durationMinutes || 30
        );

        // Combined integrity score
        const integrityResult = calculateIntegrity(fluencyData, contentAuthResult);
        perAnswerIntegrityResults.push(integrityResult);

        // Apply integrity multiplier to raw AI score
        const rawScore = typeof qData.score === "number" ? qData.score : 0;
        const phase    = (contentAuthResult && contentAuthResult.phase) || "B";
        const scoring  = applyIntegrityMultiplier(rawScore, integrityResult, phase);

        // Build answer payload with all integrity layers
        const answerPayload = {
          answerText:    qData.candidateAnswer || "",
          aiScore:       rawScore,
          adjustedScore: scoring.adjustedScore,
          elapsedMs:     answerElapsedMs,
        };
        if (fluencyData) {
          answerPayload.fluency = fluencyData;
        }
        if (contentAuthResult && contentAuthResult.available) {
          answerPayload.contentAuth = contentAuthResult;
        }
        if (integrityResult && integrityResult.available) {
          answerPayload.integrity = integrityResult;
        }

        await Answer.findOneAndUpdate(
          { interview: interviewId, candidate: candidateId, question: questionDoc._id },
          { $set: answerPayload },
          { upsert: true, new: true }
        );
      } catch (answerErr) {
        console.error(`[VIRQA-EVALUATOR] Answer upsert failed for question "${qData.question}" (interview ${interviewId}):`, answerErr.message);
      }
    }
  }

  // ── Step 4: Compute overall integrity summary and update Report ───────────
  try {
    const overallIntegrity = calculateOverallIntegrity(perAnswerIntegrityResults);
    await Report.findOneAndUpdate(
      { interview: interviewId, candidate: candidateId },
      { $set: { integritySummary: overallIntegrity } }
    );
    console.log(`[INTEGRITY] Session ${interviewId}: score=${overallIntegrity.overallIntegrityScore}, risk=${overallIntegrity.riskLevel}, highRisk=${overallIntegrity.highRiskAnswers}/${overallIntegrity.totalAnswers}`);
  } catch (integrityErr) {
    console.error(`[INTEGRITY] Failed to update summary for interview ${interviewId}:`, integrityErr.message);
  }
};
