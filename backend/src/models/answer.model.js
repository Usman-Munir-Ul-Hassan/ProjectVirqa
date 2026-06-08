import mongoose from "mongoose";
const answerSchema = new mongoose.Schema({
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Interview",
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  },
  answerText: String,
  aiScore: Number,

  // ── Fluency analysis (populated from Whisper word-level timestamps) ────────
  fluency: {
    available:         { type: Boolean, default: false },
    reason:            String,

    // Core timing
    wordCount:         Number,
    durationSec:       Number,
    wordsPerMinute:    Number,

    // Pauses
    pauseCount:        Number,
    avgPauseSec:       Number,
    totalPauseSec:     Number,

    // Fillers
    fillerWordCount:   Number,
    fillerWords:       [String],

    // Rate consistency
    rateCvDuration:    Number,
    isRateConsistent:  Boolean,

    // Repetitions
    repetitionCount:   Number,
    repeatedWords:     [{ word: String, times: Number }],

    // Response latency
    responseLatencyMs: Number,
    latencyBand:       {
      type: String,
      enum: ["instant", "quick", "normal", "thoughtful", "delayed", "unknown"],
      default: "unknown",
    },

    // Overall band
    fluencyBand:       {
      type: String,
      enum: ["fluent", "moderate", "hesitant", "struggling"],
      default: "moderate",
    },
  },

  // ── Elapsed time from interview start when this answer was recorded ─────────
  elapsedMs: Number,

  // ── Content authenticity analysis (text-layer AI detection) ──────────────────
  contentAuth: {
    available:           { type: Boolean, default: false },
    reason:              String,
    wordCount:           Number,
    phase:               { type: String, enum: ["A", "B", "C"] },
    aiPhraseCount:       Number,
    aiPhrasesFound:      [String],
    markerCount:         Number,
    markerDensity:       Number,
    sentenceCount:       Number,
    avgSentenceLen:      Number,
    cvSentenceLen:       Number,
    hasNumberedList:     Boolean,
    hasBulletList:       Boolean,
    listCount:           Number,
    avgWordLength:       Number,
    complexWordRatio:    Number,
    isTemplateOpening:   Boolean,
    templatePattern:     String,
    authenticityScore:   Number,
    authenticityBand:    {
      type: String,
      enum: ["authentic", "likely_authentic", "suspicious", "likely_ai_generated"],
      default: "likely_authentic",
    },
  },

  // ── Combined integrity result (fluency + content → multiplier) ───────────────
  integrity: {
    available:           { type: Boolean, default: false },
    integrityScore:      Number,
    multiplier:          Number,
    riskLevel:           {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    riskFactors:         [String],
    fluencyScore:        Number,
    contentScore:        Number,
    hasFluencySignal:    Boolean,
    hasContentSignal:    Boolean,
  },

  // ── Integrity-adjusted score (raw × multiplier × phaseWeight) ──────────────
  adjustedScore: Number,
});

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;