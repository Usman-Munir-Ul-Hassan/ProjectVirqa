/**
 * contentAuthAnalyzer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure-function content authenticity analyzer.
 *
 * Detects AI-generated or copy-pasted text patterns in SPOKEN interview answers.
 * Since VIRQA captures speech via Whisper, a genuinely spoken answer will have
 * natural conversational markers.  AI-generated or read-aloud text will show:
 *   - Overly structured phrasing
 *   - AI-typical transition phrases
 *   - Absence of spoken-language patterns
 *   - Uniform sentence length (no natural variation)
 *
 * Zero external dependencies. Zero API cost. Pure regex + arithmetic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── AI-typical phrases rarely used in spontaneous speech ─────────────────────
const AI_PHRASES = [
  "in conclusion",
  "to summarize",
  "furthermore",
  "moreover",
  "it's important to note",
  "it is important to note",
  "additionally",
  "firstly",
  "secondly",
  "thirdly",
  "lastly",
  "in summary",
  "to recap",
  "on the other hand",
  "in today's world",
  "in today's digital age",
  "it's worth noting",
  "it is worth noting",
  "that being said",
  "having said that",
  "with that being said",
  "in the realm of",
  "delving into",
  "dive into",
  "let's explore",
  "it's crucial to",
  "it is crucial to",
  "plays a vital role",
  "plays an important role",
  "a myriad of",
  "plethora of",
  "in light of",
  "as an ai",
  "as an ai language model",
  "i'd be happy to",
  "great question",
  "that's a great question",
  "that is a great question",
  "absolutely",
  "certainly",
];

// ── Spontaneous-speech markers (presence = more authentic) ───────────────────
const CONVERSATIONAL_MARKERS = [
  /\bi think\b/gi,
  /\bi guess\b/gi,
  /\bi mean\b/gi,
  /\bi feel like\b/gi,
  /\bi would say\b/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
  /\bprobably\b/gi,
  /\bmaybe\b/gi,
  /\bto be honest\b/gi,
  /\bhonestly\b/gi,
  /\bpersonally\b/gi,
  /\bfrom my (?:experience|perspective|view)\b/gi,
  /\bin my (?:experience|opinion|view)\b/gi,
  /\bwhat i(?:'ve| have) (?:done|found|seen|learned)\b/gi,
  /\bi(?:'ve| have) (?:worked|used|tried|built|done)\b/gi,
  /\bthe way i\b/gi,
  /\bfor me[, ]\b/gi,
  /\byou know\b/gi,
  /\blike[, ]\b/gi,
  /\bactually\b/gi,
  /\bbasically\b/gi,
];

// ── Internal helpers (all pure) ──────────────────────────────────────────────

/**
 * Count AI-typical phrases found in the text.
 */
function detectAIPhrases(text) {
  if (!text) return { count: 0, found: [] };
  const lower = text.toLowerCase();
  const found = AI_PHRASES.filter(phrase => lower.includes(phrase));
  return { count: found.length, found };
}

/**
 * Count spontaneous-speech markers.
 */
function detectConversationalMarkers(text) {
  if (!text) return { count: 0, density: 0 };

  const words = text.trim().split(/\s+/);
  const wordCount = words.length || 1;
  let total = 0;

  for (const pattern of CONVERSATIONAL_MARKERS) {
    const matches = text.match(pattern);
    if (matches) total += matches.length;
  }

  return {
    count: total,
    density: +(total / wordCount * 100).toFixed(2), // markers per 100 words
  };
}

/**
 * Measure sentence-length uniformity.
 * Natural speech has high variation (short fragments + long run-ons).
 * AI-generated text tends to have evenly-sized sentences.
 *
 * Returns coefficient of variation (CV) of sentence word-counts.
 * CV < 0.25 → suspiciously uniform.
 */
function calcSentenceUniformity(text) {
  if (!text) return { cvSentenceLen: 1, avgSentenceLen: 0, sentenceCount: 0 };

  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length < 2) {
    return { cvSentenceLen: 1, avgSentenceLen: sentences[0]?.split(/\s+/).length ?? 0, sentenceCount: sentences.length };
  }

  const lengths = sentences.map(s => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return { cvSentenceLen: 1, avgSentenceLen: 0, sentenceCount: sentences.length };

  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const cv = Math.sqrt(variance) / mean;

  return {
    cvSentenceLen: +cv.toFixed(3),
    avgSentenceLen: Math.round(mean),
    sentenceCount: sentences.length,
  };
}

/**
 * Detect list / enumeration patterns (numbered or bulleted).
 * Spoken answers rarely contain structured lists.
 */
function detectListPatterns(text) {
  if (!text) return { hasNumberedList: false, hasBulletList: false, listCount: 0 };

  const numberedMatches = text.match(/\b\d+\.\s/g);
  const bulletMatches = text.match(/[-•*]\s/g);

  const numberedCount = numberedMatches?.length ?? 0;
  const bulletCount = bulletMatches?.length ?? 0;

  return {
    hasNumberedList: numberedCount >= 3,
    hasBulletList: bulletCount >= 3,
    listCount: numberedCount + bulletCount,
  };
}

/**
 * Measure vocabulary complexity using average word length as a proxy.
 * Spoken English averages 4.0–4.5 chars/word.
 * Academic / AI-generated text averages 5.0+ chars/word.
 */
function calcVocabularyComplexity(text) {
  if (!text) return { avgWordLength: 0, complexWordRatio: 0 };

  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return { avgWordLength: 0, complexWordRatio: 0 };

  const totalChars = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, "").length, 0);
  const avgWordLength = totalChars / words.length;

  // "Complex" = words with 8+ characters (approx. college-level vocabulary)
  const complexWords = words.filter(w => w.replace(/[^a-zA-Z]/g, "").length >= 8).length;
  const complexWordRatio = complexWords / words.length;

  return {
    avgWordLength: +avgWordLength.toFixed(2),
    complexWordRatio: +complexWordRatio.toFixed(3),
  };
}

/**
 * Detect ChatGPT-style template openings.
 */
function detectTemplateOpenings(text) {
  if (!text) return { isTemplateOpening: false, pattern: null };

  const firstSentence = text.trim().split(/[.!?]/)[0]?.toLowerCase().trim() ?? "";

  const templatePatterns = [
    /^that'?s (?:a |an )?(?:great|excellent|good|interesting|fantastic) (?:question|topic|point)/,
    /^(?:absolutely|certainly|definitely|of course|sure)[,!.]/,
    /^(?:well|so)[, ] (?:that'?s|this is|let me)/,
    /^(?:i'?d be happy to|let me (?:explain|break this down|walk you through))/,
    /^great question/,
    /^to answer your question/,
  ];

  for (const pattern of templatePatterns) {
    if (pattern.test(firstSentence)) {
      return { isTemplateOpening: true, pattern: pattern.source };
    }
  }

  return { isTemplateOpening: false, pattern: null };
}

/**
 * Derive authenticity score (0–100) from component signals.
 * Higher = more likely genuinely spoken.
 */
function deriveAuthenticityScore({
  aiPhraseCount,
  markerCount,
  markerDensity,
  cvSentenceLen,
  hasList,
  avgWordLength,
  complexWordRatio,
  isTemplateOpening,
  wordCount,
}) {
  let score = 70; // baseline: assume authentic until signals say otherwise

  // ── AI phrases (each one subtracts) ──────────────────────────────
  score -= aiPhraseCount * 6;

  // ── Conversational markers (each one adds) ───────────────────────
  score += Math.min(markerCount * 4, 20); // cap at +20

  // ── Marker density bonus ─────────────────────────────────────────
  if (markerDensity > 2) score += 5;

  // ── Sentence uniformity (low CV = suspicious) ────────────────────
  if (cvSentenceLen < 0.20) score -= 12;
  else if (cvSentenceLen < 0.30) score -= 6;

  // ── List patterns ────────────────────────────────────────────────
  if (hasList) score -= 10;

  // ── Vocabulary complexity ────────────────────────────────────────
  if (avgWordLength > 5.5) score -= 8;
  else if (avgWordLength > 5.0) score -= 4;

  // ── Complex word ratio ───────────────────────────────────────────
  if (complexWordRatio > 0.25) score -= 6;

  // ── Template opening ─────────────────────────────────────────────
  if (isTemplateOpening) score -= 8;

  // ── Short-answer leniency (fewer signals available → less penalty) ─
  if (wordCount < 20) score = Math.max(score, 50);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Classify the authenticity band.
 */
function classifyAuthenticity(score) {
  if (score >= 75) return "authentic";
  if (score >= 55) return "likely_authentic";
  if (score >= 35) return "suspicious";
  return "likely_ai_generated";
}

/**
 * Determine the interview phase from elapsed milliseconds.
 * Mirrors the time-based phase logic in ActiveSession.jsx and index.js.
 */
function getPhase(elapsedMs, durationMinutes = 30) {
  if (!elapsedMs || !durationMinutes) return "B";
  const progressPercent = (elapsedMs / 1000) / (durationMinutes * 60) * 100;
  if (progressPercent < 20) return "A";  // Warm-Up
  if (progressPercent < 75) return "B";  // Technical Assessment
  return "C";                             // Wrap-Up
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * analyzeContentAuthenticity(text, elapsedMs?, durationMinutes?)
 *
 * @param {string} text              The candidate's answer text (from Whisper transcript).
 * @param {number|null} [elapsedMs]  Milliseconds from interview start when answer was given.
 * @param {number} [durationMinutes] Total interview duration in minutes (for phase calc).
 *
 * @returns {object} Complete content authenticity analysis result.
 */
export function analyzeContentAuthenticity(text, elapsedMs = null, durationMinutes = 30) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return {
      available: false,
      reason: "empty_text",
    };
  }

  const words = text.trim().split(/\s+/);
  const wordCount = words.length;

  const aiPhrases      = detectAIPhrases(text);
  const markers        = detectConversationalMarkers(text);
  const uniformity     = calcSentenceUniformity(text);
  const lists          = detectListPatterns(text);
  const complexity     = calcVocabularyComplexity(text);
  const template       = detectTemplateOpenings(text);
  const phase          = getPhase(elapsedMs, durationMinutes);

  const authenticityScore = deriveAuthenticityScore({
    aiPhraseCount:     aiPhrases.count,
    markerCount:       markers.count,
    markerDensity:     markers.density,
    cvSentenceLen:     uniformity.cvSentenceLen,
    hasList:           lists.hasNumberedList || lists.hasBulletList,
    avgWordLength:     complexity.avgWordLength,
    complexWordRatio:  complexity.complexWordRatio,
    isTemplateOpening: template.isTemplateOpening,
    wordCount,
  });

  const band = classifyAuthenticity(authenticityScore);

  return {
    available: true,

    // ── Core metrics ─────────────────────────────────────────────────────────
    wordCount,
    phase,

    // ── AI phrase detection ──────────────────────────────────────────────────
    aiPhraseCount:     aiPhrases.count,
    aiPhrasesFound:    aiPhrases.found,

    // ── Conversational markers ───────────────────────────────────────────────
    markerCount:       markers.count,
    markerDensity:     markers.density,

    // ── Sentence structure ───────────────────────────────────────────────────
    sentenceCount:     uniformity.sentenceCount,
    avgSentenceLen:    uniformity.avgSentenceLen,
    cvSentenceLen:     uniformity.cvSentenceLen,

    // ── List patterns ────────────────────────────────────────────────────────
    hasNumberedList:   lists.hasNumberedList,
    hasBulletList:     lists.hasBulletList,
    listCount:         lists.listCount,

    // ── Vocabulary ───────────────────────────────────────────────────────────
    avgWordLength:     complexity.avgWordLength,
    complexWordRatio:  complexity.complexWordRatio,

    // ── Template detection ───────────────────────────────────────────────────
    isTemplateOpening: template.isTemplateOpening,
    templatePattern:   template.pattern,

    // ── Overall ──────────────────────────────────────────────────────────────
    authenticityScore,
    authenticityBand:  band,
  };
}

export default analyzeContentAuthenticity;
