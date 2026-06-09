import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Interview from "../models/interview.model.js";
import Report from "../models/report.model.js";
import { Candidate, User } from "../models/user.model.js";
import { fetchAIChat } from "../utils/openrouterClient.js";
import { buildAIPromptLite, assembleFinalPrompt, buildAIPrompt } from "../constants.js";
import { createAndEmitNotification } from "./notification.controller.js";
import { sendInvitationEmail } from "../services/emailService.js";
import { resolveOrCreateCandidate } from "../services/candidateResolver.js";
import { parseResumeFromDocuments } from "../services/candidateProfileHelper.js";
import { triggerBackgroundEvaluation } from "../services/evaluationService.js";

// Re-export for backward compatibility with index.js and routes
export { triggerBackgroundEvaluation };

// Helper to get the io instance from the express app
const getIo = () => {
  try { return global._io; } catch { return null; }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET INTERVIEWS (employee)
// GET /api/v1/employee/interviews
// ─────────────────────────────────────────────────────────────────────────────
const getInterviews = asyncHandler(async (req, res) => {
  const interviews = await Interview.aggregate([
    { $match: { employee: req.user._id } },
    {
      $lookup: {
        from: "reports",
        localField: "_id",
        foreignField: "interview",
        as: "reports",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "candidates",
        foreignField: "_id",
        as: "candidates",
      },
    },
    { $addFields: { takenCount: { $size: "$reports" } } },
    {
      $project: {
        "candidates.password": 0,
        "candidates.refreshToken": 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return res.status(200).json(new ApiResponse(200, interviews, "Interviews fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADD CANDIDATES TO INTERVIEW
// PATCH /api/v1/employee/interview/:id/add-candidates
// ─────────────────────────────────────────────────────────────────────────────
const addCandidatesToInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { candidateEmails } = req.body;

  if (!Array.isArray(candidateEmails) || candidateEmails.length === 0) {
    throw new ApiError(400, "candidatesEmail is required");
  }

  const interview = await Interview.findOne({ _id: id, employee: req.user._id });
  if (!interview) throw new ApiError(404, "Interview not found or you have no permission");

  const successes = [];
  const failures = [];

  for (const email of candidateEmails) {
    const result = await resolveOrCreateCandidate(email, null, "", req.user._id);

    if (result.error) {
      failures.push({ email, reason: result.error });
      continue;
    }

    const { user, isNew, tempPassword } = result;

    if (interview.candidates?.some((cId) => cId.equals(user._id))) {
      failures.push({ email, reason: "Candidate already added to this interview" });
      continue;
    }

    const emailResult = await sendInvitationEmail(email, interview.jobTitle, tempPassword, "addition");
    if (emailResult.success) {
      await Interview.updateOne({ _id: interview._id }, { $addToSet: { candidates: user._id } });
      interview.candidates.push(user._id);
      successes.push(email);
    } else {
      failures.push({ email, reason: emailResult.reason });
    }
  }

  // Notify newly added candidates
  const io = getIo();
  for (const email of successes) {
    try {
      const user = await User.findOne({ email });
      if (user) {
        await createAndEmitNotification({
          io,
          recipientId: user._id,
          senderId: req.user._id,
          type: "interview",
          title: "Added to Interview",
          message: `You have been added as a candidate for ${interview.jobTitle} interview.`,
          link: "/api/v1/candidates/join",
          relatedEntity: { entityType: "interview", entityId: interview._id },
        });
      }
    } catch (err) {
      console.error(`Failed to notify ${email}:`, err.message);
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { added: successes, failed: failures }, `${successes.length} candidates processed`)
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET CANDIDATE INTERVIEWS
// GET /api/v1/candidate/interviews
// ─────────────────────────────────────────────────────────────────────────────
const getCandidateInterviews = asyncHandler(async (req, res) => {
  const candidateId = req.user._id;

  const interviews = await Interview.aggregate([
    { $match: { candidates: candidateId } },
    {
      $lookup: {
        from: "users",
        localField: "employee",
        foreignField: "_id",
        as: "interviewerData",
      },
    },
    { $unwind: "$interviewerData" },
    {
      $lookup: {
        from: "reports",
        localField: "_id",
        foreignField: "interview",
        as: "allReportsData"
      }
    },
    {
      $lookup: {
        from: "reports",
        let: { interviewId: "$_id", candidateId: candidateId },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$interview", "$$interviewId"] }, { $eq: ["$candidate", "$$candidateId"] }] } } }
        ],
        as: "reportData",
      },
    },
    {
      $project: {
        jobTitle: 1,
        startDate: 1,
        startTime: 1,
        startAt: 1,
        deadline: 1,
        duration: 1,
        status: 1,
        numberOfQuestions: 1,
        joinedCandidates: 1,
        employee: {
          fullName: "$interviewerData.fullName",
          organization: "$interviewerData.organization",
        },
        report: { $arrayElemAt: ["$reportData", 0] },
        allScores: {
          $map: {
            input: "$allReportsData",
            as: "r",
            in: "$$r.overallScore"
          }
        }
      },
    },
    { $sort: { startAt: -1 } },
  ]);

  return res.status(200).json(new ApiResponse(200, interviews, "Candidate interviews fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE INTERVIEW
// POST /api/v1/employee/create-interview
// ─────────────────────────────────────────────────────────────────────────────
const createInterview = asyncHandler(async (req, res) => {
  const { jobTitle, jobDescription, aiPrompt, startDate, startTime, duration, timezone, candidates, numberOfQuestions, difficulty } = req.body;

  if (!jobTitle || !startDate || !startTime) {
    throw new ApiError(400, "Job title, date and time are required");
  }

  const processedCandidates = [];
  const failures = [];

  if (Array.isArray(candidates) && candidates.length > 0) {
    for (const candidateData of candidates) {
      const { email, fullName, contact } = candidateData;

      const result = await resolveOrCreateCandidate(email, fullName, contact, req.user._id);

      if (result.error) {
        failures.push({ email: email || "unknown", reason: result.error });
        continue;
      }

      const { user, isNew, tempPassword } = result;

      const emailResult = await sendInvitationEmail(email, jobTitle, tempPassword, "invitation");
      if (emailResult.success) {
        processedCandidates.push(user._id);
      } else {
        console.error(`Failed to send email to ${email}:`, emailResult.reason);
        failures.push({ email, reason: emailResult.reason });
      }
    }
  }

  const startAt = new Date(`${startDate}T${startTime}`);
  const durationNum = parseInt(duration) || 30;
  const deadlineDate = req.body.deadline
    ? new Date(req.body.deadline)
    : new Date(startAt.getTime() + durationNum * 60000);

  const interview = await Interview.create({
    jobTitle,
    jobDescription,
    aiPrompt,
    employee: req.user._id,
    candidates: processedCandidates,
    startDate,
    startTime,
    duration: durationNum,
    deadline: deadlineDate,
    startAt,
    timezone: timezone || "UTC",
    status: "Scheduled",
    numberOfQuestions: parseInt(numberOfQuestions) || 5,
    difficulty: difficulty || "medium",
  });

  // Fire-and-forget notification to candidates
  notifyCandidatesAfterCreation(interview, req.user._id).catch(err =>
    console.error("Notification error (createInterview):", err.message)
  );

  return res.status(201).json(new ApiResponse(201, { interview, failures }, "Interview created successfully"));
});

// ─── Post-creation: notify candidates about the new interview ───────
const notifyCandidatesAfterCreation = async (interview, employee) => {
  const io = getIo();
  for (const candidateId of interview.candidates) {
    try {
      await createAndEmitNotification({
        io,
        recipientId: candidateId,
        senderId: employee,
        type: "interview",
        title: "New Interview Invitation",
        message: `You have been invited for a ${interview.jobTitle} interview.`,
        details: `Duration: ${interview.duration || 30} minutes. Check your interviews for details.`,
        link: "/api/v1/candidates/join",
        relatedEntity: { entityType: "interview", entityId: interview._id },
      });
    } catch (err) {
      console.error(`Failed to notify candidate ${candidateId}:`, err.message);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTEND INTERVIEW DEADLINE
// PATCH /api/v1/employee/interview/:id/extend
// ─────────────────────────────────────────────────────────────────────────────
const extendInterviewDeadline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { minutes, newDeadline } = req.body;

  const interview = await Interview.findById(id);
  if (!interview) throw new ApiError(404, "Interview not found");

  if (newDeadline) {
    const deadlineDate = new Date(newDeadline);
    if (isNaN(deadlineDate.getTime())) throw new ApiError(400, "Invalid date format for newDeadline");
    if (deadlineDate <= new Date()) throw new ApiError(400, "New deadline must be in the future");
    interview.deadline = deadlineDate;
  } else if (minutes && !isNaN(minutes)) {
    const baseTime = new Date(interview.deadline) > new Date() ? new Date(interview.deadline) : new Date();
    interview.deadline = new Date(baseTime.getTime() + minutes * 60000);
  } else {
    throw new ApiError(400, "Please provide minutes or newDeadline");
  }

  await interview.save();
  return res.status(200).json(new ApiResponse(200, interview, "Interview deadline updated successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE PROMPT TEMPLATE
// POST /api/v1/employee/generate-prompt
// ─────────────────────────────────────────────────────────────────────────────
const generatePrompt = asyncHandler(async (req, res) => {
  const { jobTitle, jobDescription, duration, difficulty } = req.body;

  if (!jobTitle || !jobDescription) {
    throw new ApiError(400, "Job title and description are required");
  }

  const configPrompt = buildAIPrompt({
    jobTitle,
    jobDescription,
    durationMinutes: parseInt(duration) || 30,
    difficulty: difficulty || "medium",
  });

  return res.status(200).json(new ApiResponse(200, { aiPrompt: configPrompt }, "Prompt baseline structured."));
});

// ─────────────────────────────────────────────────────────────────────────────
// JOIN INTERVIEW (candidate self-join)
// ─────────────────────────────────────────────────────────────────────────────
const joinInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const candidateId = req.user._id;

  const interview = await Interview.findById(id);
  if (!interview) throw new ApiError(404, "Interview not found");

  if (interview.status === "Completed") {
    throw new ApiError(403, "This interview has already been completed");
  }
  if (interview.status === "Cancelled") {
    throw new ApiError(403, "This interview has been cancelled");
  }

  if (!interview.candidates?.some((cId) => cId.equals(candidateId))) {
    throw new ApiError(403, "You are not invited to this interview");
  }

  const updated = await Interview.findByIdAndUpdate(
    id,
    { $addToSet: { joinedCandidates: candidateId } },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, updated, "Successfully joined interview"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET INTERVIEW REPORT (For Candidate)
// GET /api/v1/candidate/interviews/:id/report
// ─────────────────────────────────────────────────────────────────────────────
const getInterviewReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await Report.findOne({ interview: id, candidate: req.user._id }).lean();

  if (!report) {
    throw new ApiError(404, "Report not found. Interview may still be in progress.");
  }

  if (report.gradingStatus === "pending") {
    return res.status(202).json(
      new ApiResponse(202, { gradingStatus: "pending" }, "Report is still being generated. Please try again shortly.")
    );
  }

  if (report.gradingStatus === "failed") {
    return res.status(500).json(
      new ApiResponse(500, { gradingStatus: "failed" }, "Grading failed. Please contact support.")
    );
  }

  return res.status(200).json(new ApiResponse(200, report, "Report retrieved successfully."));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET EMPLOYEE INTERVIEW REPORT (For Employer)
// GET /api/v1/employee/interview/:id/report/:candidateId
// ─────────────────────────────────────────────────────────────────────────────
const getEmployeeInterviewReport = asyncHandler(async (req, res) => {
  const { id, candidateId } = req.params;

  const interview = await Interview.findOne({ _id: id, employee: req.user._id });
  if (!interview) {
    throw new ApiError(404, "Interview not found or unauthorized.");
  }

  const report = await Report.findOne({ interview: id, candidate: candidateId }).lean();

  if (!report) {
    throw new ApiError(404, "Report not found for this candidate.");
  }

  return res.status(200).json(new ApiResponse(200, report, "Candidate report retrieved successfully."));
});

// ─────────────────────────────────────────────────────────────────────────────
// ── CORE: CHAT WITH AI (PHASE 1 EXECUTION) ──
// ─────────────────────────────────────────────────────────────────────────────
const chatWithAI = asyncHandler(async (req, res) => {

  const { id } = req.params;
  const { history } = req.body;
  console.log("History: ", history);
  if (!Array.isArray(history)) {
    throw new ApiError(400, "History array is required");
  }

  // ── 1. Load context ────────────────────────────────────────────────────────
  const interview = await Interview.findById(id);
  if (!interview) throw new ApiError(404, "Interview not found");

  const candidate = await Candidate.findById(req.user._id);
  if (!candidate) throw new ApiError(404, "Candidate not found");

  // ── 2. Already completed guard ────────────────────────────────────────────
  if (interview.status === "Completed") {
    const existingReport = await Report.findOne({ interview: id }).lean();
    return res.status(200).json(
      new ApiResponse(200, { content: null, isFinished: true, report: existingReport ?? null }, "Interview already completed")
    );
  }

  const lastUserMessage = [...history].reverse().find((m) => m.role === "user")?.content || "";

  // ── 3. Time limit guard ───────────────────────────────────────────────────
  if (interview.duration && interview.startAt) {
    const elapsedMinutes = (Date.now() - new Date(interview.startAt)) / 60000;
    if (elapsedMinutes >= interview.duration) {
      await Interview.findByIdAndUpdate(id, { status: "Completed", endedAt: new Date() });

      const timeoutClosure = "We've reached the end of our allocated window. Thank you for your time! The interview is now complete. You'll hear back from the team soon.";

      await Report.findOneAndUpdate(
        { interview: id, candidate: req.user._id },
        { $setOnInsert: { interview: id, candidate: req.user._id, jobTitle: interview.jobTitle, gradingStatus: "pending" } },
        { upsert: true }
      );

      triggerBackgroundEvaluation(id, req.user._id, interview.jobTitle, interview.jobDescription, history, (candidate.parsedResumeText && !candidate.parsedResumeText.startsWith("__")) ? candidate.parsedResumeText : null, interview.duration, elapsedMinutes * 60);

      return res.status(200).json(
        new ApiResponse(200, { content: timeoutClosure, isFinished: true, questionNum: history.filter(m => m.role === "assistant").length, report: null }, "Time limit reached")
      );
    }
  }

  // ── 4. Time-based interview (no fixed question count) ──────────────────
  const durationMinutes = interview.duration || 30;
  const questionsAsked = history.filter((m) => m.role === "assistant").length;
  const elapsedMs = interview.startAt ? (Date.now() - new Date(interview.startAt).getTime()) : 0;
  const elapsedMinutes = elapsedMs / 60000;
  const progressPercent = Math.min(100, Math.round((elapsedMinutes / durationMinutes) * 100));

  // Parse resume data on the fly if uploaded but not parsed yet
  // Guard: only attempt when field is still the schema default "" (never attempted)
  if (candidate.parsedResumeText === "" && candidate.documents && candidate.documents.length > 0) {
    const extractedText = await parseResumeFromDocuments(candidate.documents);
    candidate.parsedResumeText = extractedText || "__PARSE_FAILED__";
    await candidate.save();
  }

  // Fetch and include candidate profile information dynamically
  const candidateProfileSummary = `
CANDIDATE PROFILE DETAILS:
- Name: ${candidate.fullName || "N/A"}
- Email: ${candidate.email}
- Phone: ${candidate.phoneNumber || "N/A"}
- Location: ${candidate.location || "N/A"}
- Target Job Title: ${candidate.jobTitle || "N/A"}
- Experience Level: ${candidate.experience || "N/A"} years
- Bio/Summary: ${candidate.professionalBio || "N/A"}
- Skills: ${Array.isArray(candidate.skills) ? candidate.skills.join(", ") : "N/A"}
- Education: ${Array.isArray(candidate.educations) ? candidate.educations.map(edu => `${edu.degree} from ${edu.institution} (${edu.year})`).join("; ") : "N/A"}
- Target Level: ${candidate.level || "N/A"}
`.trim();

  // ── 5. Build system prompt (time-based) ──────────────────────────────
  let basePrompt = interview.aiPrompt
    ? interview.aiPrompt
    : buildAIPromptLite({
      jobTitle: interview.jobTitle,
      jobDescription: interview.jobDescription || "No specific description provided.",
      durationMinutes: durationMinutes,
      difficulty: interview.difficulty || "medium",
      resumeText: (candidate.parsedResumeText && !candidate.parsedResumeText.startsWith("__")) ? candidate.parsedResumeText : null,
      profileText: candidateProfileSummary,
      candidateName: candidate.fullName || candidate.email?.split("@")[0] || "there",
    });

  const systemPrompt = assembleFinalPrompt(basePrompt, {
    resumeText: (candidate.parsedResumeText && !candidate.parsedResumeText.startsWith("__")) ? candidate.parsedResumeText : null,
    profileText: candidateProfileSummary,
    durationMinutes: durationMinutes
  });

  // ── 6. Thread assembly with time-based memory anchors ──────────────────
  const structuredMessages = [{ role: "system", content: systemPrompt }];

  history.forEach((msg, idx) => {
    if (idx > 0 && idx % 4 === 0) {
      const phase = progressPercent < 20 ? "Phase A (warm-up) - ask resume-based questions" :
        progressPercent < 75 ? "Phase B (core) - ask technical questions, adapt difficulty" :
        "Phase C (wrap-up) - broader questions and wrapping up";
      structuredMessages.push({
        role: "system",
        content: `[PROGRESS] You are Alex. ${questionsAsked} questions asked. Interview is ${progressPercent}% through (${Math.round(elapsedMinutes)}min of ${durationMinutes}min). Current: ${phase}. Ask ONE question per turn. Under 40 words. Reference resume/previous answers.`,
      });
    }
    structuredMessages.push(msg);
  });

  // ── 7. LLM call ─────────────────────────────────────────────────────────
  try {
    const aiResponseData = await fetchAIChat(structuredMessages, { temperature: 0.7 });
    const aiMessage = aiResponseData.choices[0].message.content.trim();

    const cleanMsg = aiMessage.toLowerCase();
    const aiCompleted = cleanMsg.includes("interview is now complete") ||
                        cleanMsg.includes("thank you for your time") ||
                        cleanMsg.includes("that wraps up our questions");

    // ── 8. Persist turn ───────────────────────────────────────────────────
    await Interview.findByIdAndUpdate(id, {
      $push: {
        conversation: {
          $each: [
            { role: "user", content: lastUserMessage, timestamp: new Date() },
            { role: "assistant", content: aiMessage, timestamp: new Date() },
          ],
        },
      },
    });

    if (aiCompleted) {
      await Interview.findByIdAndUpdate(id, { status: "Completed", endedAt: new Date() });

      await Report.findOneAndUpdate(
        { interview: id, candidate: req.user._id },
        { $setOnInsert: { interview: id, candidate: req.user._id, jobTitle: interview.jobTitle, gradingStatus: "pending" } },
        { upsert: true }
      );

      triggerBackgroundEvaluation(id, req.user._id, interview.jobTitle, interview.jobDescription, [...history, { role: "assistant", content: aiMessage }], (candidate.parsedResumeText && !candidate.parsedResumeText.startsWith("__")) ? candidate.parsedResumeText : null, durationMinutes, elapsedMs / 1000);

      return res.status(200).json(
        new ApiResponse(200, { content: aiMessage, isFinished: true, questionNum: questionsAsked + 1 }, "Interview completed by AI.")
      );
    }

    return res.status(200).json(
      new ApiResponse(200, { content: aiMessage, isFinished: false, questionNum: questionsAsked + 1 }, "Turn processed cleanly.")
    );
  } catch (error) {
    console.error("[VIRQA-CORE] Model transaction fail:", error);
    throw new ApiError(500, "Failed to calculate subsequent dialogue matrix turn.");
  }
});

export {
  getInterviews,
  addCandidatesToInterview,
  createInterview,
  extendInterviewDeadline,
  generatePrompt,
  joinInterview,
  getCandidateInterviews,
  chatWithAI,
  getInterviewReport,
  getEmployeeInterviewReport,
};
