// hooks/useSpeech.js
import { useRef, useState, useCallback } from "react";

export function useSpeech({ onResult, onError, onListeningChange, onSpeakingChange }) {
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);  // TTS is active
  const transcriptRef = useRef("");
  const fallbackTimer = useRef(null);
  const ttsQueue = useRef([]);
  const interviewEnded = useRef(false);

  // ─────────────────────────────────────────────
  // SETUP RECOGNITION (call once on mount)
  // ─────────────────────────────────────────────
  const setupRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      onError("browser_unsupported");
      return null;
    }

    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.maxAlternatives = 1;

    r.onstart = () => {
      transcriptRef.current = "";
      onListeningChange(true);
      // Nuclear fallback — force stop if mic hangs for 15s
      fallbackTimer.current = setTimeout(() => {
        r.stop();
      }, 15000);
    };

    r.onresult = (e) => {
      // ✅ BLEED GUARD — discard if AI is still speaking
      if (isSpeakingRef.current) {
        r.abort();
        return;
      }
      transcriptRef.current = Array.from(e.results)
        .map(res => res[0].transcript)
        .join(" ")
        .trim();
    };

    r.onend = () => {
      clearTimeout(fallbackTimer.current);
      onListeningChange(false);

      const transcript = transcriptRef.current;
      transcriptRef.current = "";

      if (isSpeakingRef.current) {
        // AI was speaking when mic closed — ignore this result entirely
        return;
      }

      if (transcript) {
        onResult(transcript);
      } else {
        // Mic closed with no speech — auto restart with hint
        onError("no_speech");
        if (!interviewEnded.current) {
          setTimeout(() => startListening(), 800);
        }
      }
    };

    r.onerror = (e) => {
      clearTimeout(fallbackTimer.current);
      onListeningChange(false);

      const map = {
        "no-speech": "no_speech",
        "audio-capture": "no_microphone",
        "not-allowed": "mic_blocked",
        "network": "network_error",
      };

      const code = map[e.error] || "unknown_error";

      if (code === "mic_blocked") {
        onError(code); // hard stop — user must fix permissions
        return;
      }

      // All other errors — retry once after short delay
      onError(code);
      if (!interviewEnded.current) {
        setTimeout(() => startListening(), 1000);
      }
    };

    return r;
  }, []);

  // ─────────────────────────────────────────────
  // START LISTENING
  // ─────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (interviewEnded.current) return;
    if (isSpeakingRef.current) return; // never open mic while AI speaks

    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      // already started — ignore
    }
  }, [setupRecognition]);

  // ─────────────────────────────────────────────
  // STOP LISTENING
  // ─────────────────────────────────────────────
  const stopListening = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    try {
      recognitionRef.current?.abort();
    } catch (e) { }
    onListeningChange(false);
  }, []);

  // ─────────────────────────────────────────────
  // SPEAK — queues sentences, opens mic only after last chunk
  // ─────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!text) return;

    // Split into sentences for faster first-word delivery
    const sentences = text.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) || [text];
    ttsQueue.current.push(...sentences);

    if (!isSpeakingRef.current) {
      playNextChunk();
    }
  }, []);

  function playNextChunk() {
    if (ttsQueue.current.length === 0) {
      // ✅ ALL chunks done — safe to open mic now
      isSpeakingRef.current = false;
      onSpeakingChange(false);

      if (!interviewEnded.current) {
        // 900ms gap — lets speaker audio physically clear the mic
        setTimeout(() => startListening(), 900);
      }
      return;
    }

    isSpeakingRef.current = true;
    onSpeakingChange(true);

    // ✅ Kill mic the instant AI starts speaking
    stopListening();

    const utterance = new SpeechSynthesisUtterance(ttsQueue.current.shift());
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => playNextChunk();   // chain next sentence
    utterance.onerror = () => playNextChunk();   // skip broken chunk, keep going

    speechSynthesis.speak(utterance);
  }

  // ─────────────────────────────────────────────
  // STOP EVERYTHING (call on interview end)
  // ─────────────────────────────────────────────
  const stopAll = useCallback(() => {
    interviewEnded.current = true;
    isSpeakingRef.current = false;
    ttsQueue.current = [];
    speechSynthesis.cancel();
    stopListening();
  }, [stopListening]);

  return { speak, startListening, stopListening, stopAll };
}