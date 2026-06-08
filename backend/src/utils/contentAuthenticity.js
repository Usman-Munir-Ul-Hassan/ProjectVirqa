/**
 * contentAuthenticity.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure-function content authenticity analyser.
 *
 * Input:  transcript text of a candidate's spoken answer.
 * Output: a contentAuthenticity object ready to persist on the Answer document.
 *
 * Zero external dependencies. Zero API cost. ~1 ms compute per answer.
 *
 * Detects signals commonly associated with AI-generated or rehearsed text:
 *   • Perplexity-like variability (n-gram repetition, entropy)
 *   • Burstiness (sentence-length variance)
 *   • AI-typical filler phrases ("delve", "tapestry", "it's important to note", etc.)
 *   • Overly formal / structured patterns (numbered lists, parallel clauses)
 *   • Unnatural length vs. typical spoken answers
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── AI-typical phrase lexicon (lowercased, non-exhaustive) ────────────────────
const AI_TYPICAL_PHRASES = [
  "it's important to note",
  "it is important to note",
  "in conclusion",
  "to summarize",
  "delve into",
  "delve deep",
  "tapestry of",
  "testament to",
  "navigating the landscape",
  "in today's world",
  "in today's fast-paced",
  "a multifaceted approach",
  "plays a pivotal role",
  "plays a crucial role",
  "foster a culture",
  "cutting-edge",
  "state-of-the-art",
  "paradigm shift",
  "robust framework",
  "holistic approach",
  "leverage the power",
  "unlock the potential",
  "dive into",
  "rich tapestry",
  "it's worth mentioning",
  "it is worth mentioning",
  "on the other hand",
  "moreover",
  "furthermore",
  "in addition to",
  "not only",
  "but also",
  "a wide range of",
  "a broad spectrum",
  "landscape of",
  "realm of",
  "ever-evolving",
  "rapidly changing",
  "in the realm of",
  "at the end of the day",
  "first and foremost",
  "last but not least",
];

// ── Internal helpers (all pure) ──────────────────────────────────────────────

/**
 * Tokenise text into sentences (naïve split on . ! ?).
 */
function splitSentences(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .replace(/([.!?])\s+/g, "$1|||")
    .split("|||")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Burstiness: coefficient of variation of sentence lengths (in words).
 * Human speech → high variance.  AI text → unnaturally uniform.
 */
function calcBurstiness(sentences) {
  if (sentences.length < 3) return { cv: 0, isBursty: true }; // too short to judge

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return { cv: 0, isBursty: true };

  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  return { cv: +cv.toFixed(3), isBursty: cv >= 0.4 }; // humans vary more
}

/**
 * Count AI-typical phrases found in the transcript.
 */
function calcAIPhrases(text) {
  if (!text || typeof text !== "string") return { count: 0, phrases: [] };
  const lower = text.toLowerCase();
  const found = AI_TYPICAL_PHRASES.filter((p) => lower.includes(p));
  return { count: found.length, phrases: found };
}

/**
 * Lexical diversity: type-token ratio (unique words / total words).
 * Lower → more repetitive (potential AI or rehearsed).
 */
function calcLexicalDiversity(text) {
  if (!text || typeof text !== "string") return { ttr: 1, isDiverse: true };
  const words = text.toLowerCase().replace(/[^a-z\s'-]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return { ttr: 1, isDiverse: true };
  const unique = new Set(words);
  const ttr = unique.size / words.length;
  return { ttr: +ttr.toFixed(3), isDiverse: ttr >= 0.6 };
}

/**
 * Detect structural markers: numbered lists, bullet-like patterns, parallel "first/second/third".
 */
function calcStructuralMarkers(text) {
  if (!text || typeof text !== "string") return { count: 0, markers: [] };
  const markers = [];
  const lines = text.split(/\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d+[\.\)]\s/.test(trimmed)) markers.push("numbered_list");
    if (/^[-*•]\s/.test(trimmed)) markers.push("bullet_list");
  }

  const sequential = ["first", "second", "third", "fourth", "fifth", "finally"];
  const lower = text.toLowerCase();
  let seqCount = 0;
  for (const word of sequential) {
    if (lower.includes(word)) seqCount++;
  }
  if (seqCount >= 2) markers.push("sequential_markers");

  return { count: markers.length, markers: [...new Set(markers)] };
}

/**
 * Word count band classification.
 */
function classifyLength(wordCount) {
  if (wordCount < 10) return "very_short";
  if (wordCount < 30) return "short";
  if (wordCount < 80) return "normal";
  if (wordCount < 150) return "long";
  return "very_long";
}

/**
 * Derive an overall authenticity band from component signals.
 */
function deriveAuthenticityBand({ aiPhraseCount, isBursty, isDiverse, structuralCount, wordCount, lengthBand }) {
  let score = 5; // start neutral

  // AI phrases: strong signal
  if (aiPhraseCount === 0) score += 2;
  else if (aiPhraseCount <= 1) score += 1;
  else if (aiPhraseCount <= 3) score -= 1;
  else score -= 3;

  // Burstiness: human speech varies
  if (isBursty) score += 1;
  else score -= 1;

  // Lexical diversity
  if (isDiverse) score += 1;
  else score -= 1;

  // Structural markers (lists in spoken text = suspicious)
  if (structuralCount === 0) score += 1;
  else if (structuralCount <= 1) score += 0;
  else score -= 2;

  // Very short answers get a slight boost (less room for AI patterns)
  if (lengthBand === "very_short" || lengthBand === "short") score += 1;

  if (score >= 8) return "authentic";
  if (score >= 5) return "likely_authentic";
  if (score >= 3) return "suspicious";
  return "likely_ai_generated";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * analyzeContentAuthenticity(transcriptText)
 *
 * @param {string|null} transcriptText — The spoken answer text from Whisper.
 * @returns {object} Complete content authenticity analysis result.
 */
export function analyzeContentAuthenticity(transcriptText) {
  if (!transcriptText || typeof transcriptText !== "string" || transcriptText.trim().length === 0) {
    return {
      available: false,
      reason: "empty_transcript",
    };
  }

  const sentences = splitSentences(transcriptText);
  const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;
  const burstiness = calcBurstiness(sentences);
  const aiPhrases = calcAIPhrases(transcriptText);
  const lexical = calcLexicalDiversity(transcriptText);
  const structural = calcStructuralMarkers(transcriptText);
  const lengthBand = classifyLength(wordCount);

  const authenticityBand = deriveAuthenticityBand({
    aiPhraseCount: aiPhrases.count,
    isBursty: burstiness.isBursty,
    isDiverse: lexical.isDiverse,
    structuralCount: structural.count,
    wordCount,
    lengthBand,
  });

  return {
    available: true,

    // ── Core metrics ──────────────────────────────────────────────────────────
    wordCount,
    sentenceCount: sentences.length,

    // ── Burstiness (sentence-length variance) ──────────────────────────────────
    burstinessCv: burstiness.cv,
    isBursty: burstiness.isBursty,

    // ── AI-typical phrases ─────────────────────────────────────────────────────
    aiPhraseCount: aiPhrases.count,
    aiPhrases: aiPhrases.phrases,

    // ── Lexical diversity ──────────────────────────────────────────────────────
    lexicalDiversityTTR: lexical.ttr,
    isLexicallyDiverse: lexical.isDiverse,

    // ── Structural markers ─────────────────────────────────────────────────────
    structuralMarkerCount: structural.count,
    structuralMarkers: structural.markers,

    // ── Length classification ──────────────────────────────────────────────────
    lengthBand,

    // ── Overall band ───────────────────────────────────────────────────────────
    authenticityBand,
  };
}

export default analyzeContentAuthenticity;
