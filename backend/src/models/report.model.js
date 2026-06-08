import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({

  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Interview"
  },

  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  jobTitle: String,

  overallScore: { type: Number, default: 0 },

  recommendation: {
    type: String,
    enum: ["Strong Pass", "Pass", "Borderline", "Fail"],
    default: "Borderline"
  },

  evaluationMetrics: {
    technicalAccuracy: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
  },

  keyStrengths: [{ type: String }],
  areasForImprovement: [{ type: String }],

  questions: [
    {
      question: String,
      candidateAnswer: String,
      expectedAnswer: String,
      suggestion: String,
      rating: {
        type: String,
        enum: ["poor", "average", "good", "excellent"],
        default: "average"
      },
      score: { type: Number, default: 0 },
      reason: String,
    }
  ],

  gradingStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },

  gradedAt: Date,

  pdfUrl: { type: String },

  rawScoringPayload: { type: String },

  // ── Interview-level integrity summary (anti-cheat layer) ─────────────────────
  integritySummary: {
    available:               { type: Boolean, default: false },
    overallIntegrityScore:   { type: Number, default: 60 },
    avgMultiplier:           { type: Number, default: 1.0 },
    riskLevel:               {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    highRiskAnswers:         { type: Number, default: 0 },
    totalAnswers:            { type: Number, default: 0 },
    riskFactors:             [String],
  },

  // Legacy fields kept for backwards compatibility
  level: String,
  totalRawScore: Number,
  finalScore: Number,

}, { timestamps: true });

const Report = mongoose.model("Report", reportSchema);

export default Report;