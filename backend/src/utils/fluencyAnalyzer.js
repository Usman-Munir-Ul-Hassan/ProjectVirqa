/**
 * fluencyAnalyzer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure-function fluency scoring engine.
 *
 * Input:  word-level timestamps from Groq Whisper (verbose_json + word granularity)
 *         + optional responseLatencyMs measured on the client.
 *
 * Output: a single fluency object ready to persist on the Answer document.
 *
 * Zero external dependencies. Zero API cost. ~2 ms compute per answer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Filler-word lexicon (lowercased) ─────────────────────────────────────────
const FILLER_WORDS = new Set([
  "um", "uh", "uhm", "hmm", "er", "ah",
  "like", "you know", "basically", "actually",
  "literally", "i mean", "sort of", "kind of",
  "right", "okay", "so", "well",
]);

// ── Internal helpers (all pure) ──────────────────────────────────────────────

/**
 * Calculate speech duration in seconds from word timestamps.
 */
function calcDurationSec(words) {
  if (!words || words.length === 0) return 0;
  const first = words[0].start ?? 0;
  const last  = words[words.length - 1].end ?? words[words.length - 1].start ?? 0;
  return Math.max(last - first, 0.01); // avoid division by zero
}

/**
 * Words-per-minute normalised to actual speech time (excluding pauses > 1 s).
 */
function calcWordsPerMinute(words, durationSec) {
  if (!words || words.length === 0 || durationSec <= 0) return 0;
  return Math.round((words.length / durationSec) * 60);
}

/**
 * Detect intra-speech pauses and return { count, avgDurationSec, totalSec }.
 * A "pause" is any gap between consecutive words longer than PAUSE_THRESHOLD_SEC.
 */
function calcPauses(words, pauseThresholdSec = 0.5) {
  if (!words || words.length < 2) return { count: 0, avgDurationSec: 0, totalSec: 0 };

  const pauses = [];
  for (let i = 1; i < words.length; i++) {
    const gap = (words[i].start ?? 0) - (words[i - 1].end ?? words[i - 1].start ?? 0);
    if (gap >= pauseThresholdSec) pauses.push(gap);
  }

  const totalSec = pauses.reduce((s, p) => s + p, 0);
  return {
    count: pauses.length,
    avgDurationSec: pauses.length > 0 ? +(totalSec / pauses.length).toFixed(3) : 0,
    totalSec: +totalSec.toFixed(3),
  };
}

/**
 * Count filler words in the transcript.
 */
function calcFillerWords(words) {
  if (!words || words.length === 0) return { count: 0, words: [] };
  const found = [];
  for (const w of words) {
    const token = (w.word ?? "").toLowerCase().replace(/[.,!?;:'"]/g, "");
    if (FILLER_WORDS.has(token)) found.push(token);
  }
  return { count: found.length, words: found };
}

/**
 * Speech-rate consistency: coefficient of variation (CV) of per-word durations.
 * Lower CV → more consistent rhythm.  CV > 0.7 → highly variable.
 */
function calcRateConsistency(words) {
  if (!words || words.length < 3) return { cvDuration: 0, isConsistent: true };

  const durations = words.map((w) => {
    const s = w.start ?? 0;
    const e = w.end ?? s;
    return Math.max(e - s, 0.01);
  });

  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  if (mean === 0) return { cvDuration: 0, isConsistent: true };

  const variance = durations.reduce((sum, d) => sum + (d - mean) ** 2, 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  return { cvDuration: +cv.toFixed(3), isConsistent: cv <= 0.7 };
}

/**
 * Detect immediate self-repetitions (same word repeated ≥ 3 times consecutively).
 */
function calcRepetitions(words) {
  if (!words || words.length < 3) return { count: 0, repeated: [] };

  const repeated = [];
  let runStart = 0;

  for (let i = 1; i <= words.length; i++) {
    const prev = (words[i - 1]?.word ?? "").toLowerCase();
    const curr = i < words.length ? (words[i].word ?? "").toLowerCase() : null;

    if (curr !== prev || i === words.length) {
      const runLen = i - runStart;
      if (runLen >= 3) {
        repeated.push({ word: prev, times: runLen });
      }
      runStart = i;
    }
  }

  return { count: repeated.length, repeated };
}

/**
 * Classify response latency into a human-readable band.
 */
function classifyLatency(ms) {
  if (ms == null) return "unknown";
  if (ms < 1000) return "instant";   // suspiciously fast — possible rehearsed answer
  if (ms < 3000) return "quick";     // confident, prepared
  if (ms < 7000) return "normal";    // natural thinking time
  if (ms < 15000) return "thoughtful"; // deliberate reflection
  return "delayed";                   // may indicate confusion or disengagement
}

/**
 * Derive an overall fluency band label from component signals.
 * This is a simple heuristic — not an ML model.
 */
function deriveFluencyBand({ wpm, pauseCount, fillerCount, latencyBand, isConsistent }) {
  let score = 0;

  // WPM scoring (native English: 120–160 wpm ideal)
  if (wpm >= 100 && wpm <= 180) score += 3;
  else if (wpm >= 70 && wpm <= 200) score += 2;
  else score += 1;

  // Pause scoring (fewer is better; 0–2 pauses = ideal)
  if (pauseCount <= 2) score += 3;
  else if (pauseCount <= 5) score += 2;
  else score += 1;

  // Filler scoring
  if (fillerCount === 0) score += 3;
  else if (fillerCount <= 3) score += 2;
  else score += 1;

  // Consistency bonus
  if (isConsistent) score += 1;

  // Latency penalty for "instant" (rehearsed/canned answer red flag)
  if (latencyBand === "instant") score -= 1;

  if (score >= 11) return "fluent";
  if (score >= 8)  return "moderate";
  if (score >= 5)  return "hesitant";
  return "struggling";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * analyzeFluency(words, responseLatencyMs?)
 *
 * @param {Array<{word: string, start: number, end: number}>} words
 *        Word-level timestamps from Whisper verbose_json response.
 * @param {number|null} [responseLatencyMs]
 *        Milliseconds from TTS end to socket send (frontend-measured).
 *        null/undefined if not available.
 *
 * @returns {object} Complete fluency analysis result.
 */
export function analyzeFluency(words, responseLatencyMs = null) {
  if (!Array.isArray(words) || words.length === 0) {
    return {
      available: false,
      reason: "no_word_timestamps",
    };
  }

  const durationSec     = calcDurationSec(words);
  const wpm             = calcWordsPerMinute(words, durationSec);
  const pauses          = calcPauses(words);
  const fillers         = calcFillerWords(words);
  const consistency     = calcRateConsistency(words);
  const repetitions     = calcRepetitions(words);
  const latencyBand     = classifyLatency(responseLatencyMs);
  const fluencyBand     = deriveFluencyBand({
    wpm,
    pauseCount: pauses.count,
    fillerCount: fillers.count,
    latencyBand,
    isConsistent: consistency.isConsistent,
  });

  return {
    available: true,

    // ── Core timing ──────────────────────────────────────────────────────────
    wordCount:           words.length,
    durationSec:         +durationSec.toFixed(2),
    wordsPerMinute:      wpm,

    // ── Pauses ────────────────────────────────────────────────────────────────
    pauseCount:          pauses.count,
    avgPauseSec:         pauses.avgDurationSec,
    totalPauseSec:       pauses.totalSec,

    // ── Fillers ───────────────────────────────────────────────────────────────
    fillerWordCount:     fillers.count,
    fillerWords:         fillers.words,

    // ── Rate consistency ──────────────────────────────────────────────────────
    rateCvDuration:      consistency.cvDuration,
    isRateConsistent:    consistency.isConsistent,

    // ── Repetitions ───────────────────────────────────────────────────────────
    repetitionCount:     repetitions.count,
    repeatedWords:       repetitions.repeated,

    // ── Response latency ──────────────────────────────────────────────────────
    responseLatencyMs:   responseLatencyMs ?? null,
    latencyBand,

    // ── Overall band ──────────────────────────────────────────────────────────
    fluencyBand,
  };
}

export default analyzeFluency;
