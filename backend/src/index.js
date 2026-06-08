import dotenv from "dotenv";
dotenv.config()
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./db/db_connect.js";
import Interview from "./models/interview.model.js";
import { Candidate } from "./models/user.model.js";
import { buildConversationalPrompt, assembleFinalPrompt } from "./constants.js";
import openrouterClient from "./utils/openrouterClient.js";
import Report from "./models/report.model.js";
import { triggerBackgroundEvaluation } from "./controllers/interview.controller.js";
import { createAndEmitNotification } from "./controllers/notification.controller.js";
import { User } from "./models/user.model.js";
import { analyzeFluency } from "./utils/fluencyAnalyzer.js";
const { fetchAIChat } = openrouterClient;

if (!process.env.MONGODB_URI || !process.env.DB_NAME) {
  console.error('Missing environment variables: MONGODB_URI and DB_NAME must be set in backend/.env');
  process.exit(1);
}
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
  console.error('Missing environment variables: CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY must be set in backend/.env');
  process.exit(1);
}

// Create HTTP server from Express app
const httpServer = createServer(app);

// Attach Socket.IO to the same HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }
});

// ─── Socket.IO Logic ───────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // ── User room management for notifications ────────────────────────
  socket.on("authenticate", async (userId) => {
    if (!userId) return;
    try {
      const user = await User.findById(userId);
      if (user) {
        socket.join(`user_${userId}`);
        socket.userId = userId;
        console.log(`👤 User ${userId} joined notification room`);
      }
    } catch (err) {
      console.error("Socket auth error:", err.message);
    }
  });

  socket.on("leave_notifications", (userId) => {
    if (userId) {
      socket.leave(`user_${userId}`);
      console.log(`👤 User ${userId} left notification room`);
    }
  });

  // In‑memory cache for interview prompts
  const interviewCache = {};

  // Accumulates per-turn fluency data for this socket's interview session.
  // Each entry: { userText: <original spoken text>, data: <fluencyAnalyzer result> }
  const interviewFluencyMap = [];

  // Candidate sends a message (either empty [] for greeting or their answer)
  socket.on("user_spoke", async ({ interviewId, candidateId, history, forceEndSession, whisperWords, responseLatencyMs, answerElapsedMs }) => {
    try {
      const interview = await Interview.findById(interviewId);
      const candidate = await Candidate.findById(candidateId);
      if (!interview || !candidate) {
        socket.emit("ai_error", "Interview or candidate not found.");
        return;
      }

      // Guard: if interview already completed or candidate already has a report, reject
      const existingReport = await Report.findOne({ interview: interviewId, candidate: candidateId });
      if (interview.status === "Completed" || existingReport) {
        socket.emit("ai_reply", { content: "This interview has already been completed.", isFinished: true, questionNum: 0 });
        return;
      }

      // ── Run fluency analysis if Whisper word-level timestamps are present ──
      if (Array.isArray(whisperWords) && whisperWords.length > 0) {
        const lastUserMsg = history.filter(m => m.role === "user").pop();
        if (lastUserMsg) {
          const fluencyResult = analyzeFluency(whisperWords, responseLatencyMs ?? null);
          interviewFluencyMap.push({ userText: lastUserMsg.content, data: fluencyResult, elapsedMs: answerElapsedMs ?? null });
          console.log(`[FLUENCY] Turn analysed: ${fluencyResult.wordCount} words, ${fluencyResult.wordsPerMinute} wpm, band=${fluencyResult.fluencyBand}`);
        }
      }

      // Handle forced end session (user manually ended or time expired on frontend)
      if (forceEndSession) {
        const durationMinutes = interview.duration || 30;
        const elapsedMs = interview.startAt ? (Date.now() - new Date(interview.startAt).getTime()) : 0;
        const closureText = "The interview session has ended. Thank you for your time! You'll hear back from the team soon.";

        // Save conversation history to DB
        const turnUpdates = [];
        const lastUserTurn = history.length > 0 ? history[history.length - 1] : null;
        if (lastUserTurn && lastUserTurn.role === "user") {
          turnUpdates.push({ role: "user", content: lastUserTurn.content, timestamp: new Date() });
        }
        turnUpdates.push({ role: "assistant", content: closureText, timestamp: new Date() });

        await Interview.findByIdAndUpdate(interviewId, {
          status: "Completed",
          endedAt: new Date(),
          $push: { conversation: { $each: turnUpdates } }
        });

        // Create pending Report stub
        await Report.findOneAndUpdate(
          { interview: interviewId, candidate: candidateId },
          { $setOnInsert: { interview: interviewId, candidate: candidateId, jobTitle: interview.jobTitle, gradingStatus: "pending" } },
          { upsert: true }
        );

        // Trigger background evaluation with duration info for early-leave penalty
        triggerBackgroundEvaluation(interviewId, candidateId, interview.jobTitle, interview.jobDescription, [...history, { role: "assistant", content: closureText }], (candidate.parsedResumeText && !candidate.parsedResumeText.startsWith("__")) ? candidate.parsedResumeText : null, durationMinutes, elapsedMs / 1000, interviewFluencyMap);

        socket.emit("ai_reply", { content: closureText, isFinished: true, questionNum: history.filter(m => m.role === "assistant").length + 1 });
        return;
      }

      // Parse resume data on the fly if uploaded but not parsed yet
      // Guard: only attempt when field is still the schema default "" (never attempted)
      if (candidate.parsedResumeText === "" && candidate.documents && candidate.documents.length > 0) {
        const resumeDoc = candidate.documents.find(d => 
          d.url && d.url.endsWith(".pdf") && 
          (d.name.toLowerCase().includes("resume") || d.name.toLowerCase().includes("cv"))
        ) || candidate.documents.find(d => d.url && d.url.endsWith(".pdf"));

        if (resumeDoc) {
          try {
            const { parsePdfFromUrl } = await import("./utils/pdfParser.js");
            const extractedText = await parsePdfFromUrl(resumeDoc.url);
            candidate.parsedResumeText = extractedText || "__PARSE_FAILED__";
            await candidate.save();
          } catch (err) {
            console.error("Dynamic resume parsing failed in Socket:", err);
            candidate.parsedResumeText = "__PARSE_FAILED__";
            await candidate.save();
          }
        }
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

      const durationMinutes = interview.duration || 30;
      const questionsAsked = history.filter((m) => m.role === "assistant").length;

      // Retrieve or compute system prompt for this interview (with resume + profile)
      let cached = interviewCache[interviewId];
      if (!cached) {
        // Use the employee-reviewed prompt if saved; otherwise generate time-based prompt
        let basePrompt = interview.aiPrompt
          ? interview.aiPrompt
          : buildConversationalPrompt({
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
        
        cached = { systemPrompt };
        interviewCache[interviewId] = cached;
      }

      let aiText;

      // Build messages with memory anchors (time-based phase reminders)
      const messages = [{ role: "system", content: cached.systemPrompt }];
      
      // Calculate elapsed time for phase awareness
      const elapsedMs = interview.startAt ? (Date.now() - new Date(interview.startAt).getTime()) : 0;
      const elapsedMinutes = elapsedMs / 60000;
      const progressPercent = Math.min(100, Math.round((elapsedMinutes / durationMinutes) * 100));

      history.forEach((msg, idx) => {
        // Inject memory anchor every 4 messages
        if (idx > 0 && idx % 4 === 0) {
          const phase = progressPercent < 20 ? "Phase A (warm-up) - ask resume-based questions" :
            progressPercent < 75 ? "Phase B (core) - ask technical questions, adapt difficulty based on answers" :
            "Phase C (wrap-up) - ask broader questions and start wrapping up";
          messages.push({
            role: "system",
            content: `[PROGRESS] You are Alex. ${questionsAsked} questions asked so far. Interview is ${progressPercent}% through (${Math.round(elapsedMinutes)}min of ${durationMinutes}min). Current: ${phase}. Ask ONE question per turn. Under 40 words. Reference resume/previous answers.`,
          });
        }
        messages.push(msg);
      });

      const aiData = await fetchAIChat(messages, { temperature: 0.7 });
      aiText = aiData.choices[0].message.content;

      // Check for completion (AI decided to wrap up naturally)
      const cleanText = aiText.toLowerCase();
      const isComplete = cleanText.includes("interview is now complete") ||
                         cleanText.includes("thank you for your time") ||
                         cleanText.includes("terminating the interview") ||
                         cleanText.includes("that wraps up our questions");

      // Send AI reply back (as object with isFinished flag)
      socket.emit("ai_reply", { content: aiText, isFinished: isComplete, questionNum: questionsAsked + 1 });

      const lastUserTurn = history.length > 0 ? history[history.length - 1] : null;
      const turnUpdates = [];
      if (lastUserTurn && lastUserTurn.role === "user") {
        turnUpdates.push({ role: "user", content: lastUserTurn.content, timestamp: new Date() });
      }
      turnUpdates.push({ role: "assistant", content: aiText, timestamp: new Date() });

      if (isComplete) {
        await Interview.findByIdAndUpdate(interviewId, {
          status: "Completed",
          endedAt: new Date(),
          $push: { conversation: { $each: turnUpdates } }
        });

        await Report.findOneAndUpdate(
          { interview: interviewId, candidate: candidateId },
          { $setOnInsert: { interview: interviewId, candidate: candidateId, jobTitle: interview.jobTitle, gradingStatus: "pending" } },
          { upsert: true }
        );

        triggerBackgroundEvaluation(interviewId, candidateId, interview.jobTitle, interview.jobDescription, [...history, { role: "assistant", content: aiText }], (candidate.parsedResumeText && !candidate.parsedResumeText.startsWith("__")) ? candidate.parsedResumeText : null, durationMinutes, elapsedMs / 1000, interviewFluencyMap);
      } else {
        await Interview.findByIdAndUpdate(interviewId, {
          $push: { conversation: { $each: turnUpdates } }
        });
      }
    } catch (err) {
      console.error("Socket AI error:", err.message);
      socket.emit("ai_error", "AI failed to respond. Please try again.");
    }
  });

  // Handle explicit interview end (manual hangup or timer expiry)
  socket.on("end_interview", async ({ interviewId, candidateId, history }) => {
    try {
      const interview = await Interview.findById(interviewId);
      if (!interview) {
        socket.emit("ai_error", "Interview not found.");
        return;
      }

      // Load candidate for resume text
      const candidate = await Candidate.findById(candidateId);

      // Guard: already completed
      const existingReport = await Report.findOne({ interview: interviewId, candidate: candidateId });
      if (existingReport) {
        socket.emit("interview_ended", { success: true, alreadyCompleted: true });
        return;
      }

      const durationMinutes = interview.duration || 30;
      const elapsedMs = interview.startAt ? (Date.now() - new Date(interview.startAt).getTime()) : 0;
      const closureText = "Interview ended by candidate. Thank you for your time!";

      // Save all conversation history to DB
      const turnUpdates = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          turnUpdates.push({ role: msg.role, content: msg.content, timestamp: new Date() });
        }
      }

      await Interview.findByIdAndUpdate(interviewId, {
        status: "Completed",
        endedAt: new Date(),
        conversation: turnUpdates // Replace with full history
      });

      // Create pending Report stub
      await Report.findOneAndUpdate(
        { interview: interviewId, candidate: candidateId },
        { $setOnInsert: { interview: interviewId, candidate: candidateId, jobTitle: interview.jobTitle, gradingStatus: "pending" } },
        { upsert: true }
      );

      // Trigger background evaluation with duration info for early-leave penalty
      triggerBackgroundEvaluation(interviewId, candidateId, interview.jobTitle, interview.jobDescription, history, candidate?.parsedResumeText || null, durationMinutes, elapsedMs / 1000, interviewFluencyMap);

      socket.emit("interview_ended", { success: true, alreadyCompleted: false });
    } catch (err) {
      console.error("Socket end_interview error:", err.message);
      socket.emit("ai_error", "Failed to end interview. Please try again.");
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ─── Make io accessible to controllers ──────────────────────────────
app.set("io", io);
global._io = io;

// ───────────────────────────────────────────────────────────────────

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
