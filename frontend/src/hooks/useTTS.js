/**
 * useTTS.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: Text-to-Speech engine with voice preloading.
 *
 * Manages speechSynthesis voice selection, utterance lifecycle,
 * and tracks the exact moment AI finishes speaking (for latency calc).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * @param {function|null} onSpeakingStart  Called when TTS begins.
 * @param {function|null} onSpeakingEnd    Called when TTS finishes.
 * @returns {{
 *   speakAI: function(string, function?),
 *   aiSpeaking: boolean,
 *   cancelSpeech: function,
 *   questionEndTimeRef: React.MutableRefObject,
 * }}
 */
export function useTTS(onSpeakingStart = null, onSpeakingEnd = null) {
    const [aiSpeaking, setAiSpeaking] = useState(false);

    const aiSpeakingRef = useRef(false);
    const selectedVoiceRef = useRef(null);
    const activeUtteranceRef = useRef(null);
    const questionEndTimeRef = useRef(null);

    const onStartRef = useRef(onSpeakingStart);
    const onEndRef = useRef(onSpeakingEnd);
    useEffect(() => { onStartRef.current = onSpeakingStart; }, [onSpeakingStart]);
    useEffect(() => { onEndRef.current = onSpeakingEnd; }, [onSpeakingEnd]);

    const setAiSpeakingStatus = useCallback((speaking) => {
        aiSpeakingRef.current = speaking;
        setAiSpeaking(speaking);
    }, []);

    // ── Preload TTS voices on mount ────────────────────────────────────────────
    useEffect(() => {
        const pickVoice = () => {
            const voices = speechSynthesis.getVoices();
            if (voices.length === 0) return;
            const preferred = voices.find(v =>
                v.lang.startsWith("en") &&
                (v.name.includes("Google UK English Female") || v.name.includes("Google US English"))
            ) || voices.find(v =>
                v.lang.startsWith("en") &&
                (v.name.includes("Google") || v.name.includes("Natural"))
            ) || voices.find(v =>
                v.lang.startsWith("en") && v.name.includes("Microsoft")
            ) || voices.find(v =>
                v.lang.startsWith("en")
            );
            if (preferred) selectedVoiceRef.current = preferred;
        };

        pickVoice();
        speechSynthesis.onvoiceschanged = pickVoice;
        return () => { speechSynthesis.onvoiceschanged = null; };
    }, []);

    // ── Speak AI text ──────────────────────────────────────────────────────────
    const speakAI = useCallback((text, onDone) => {
        setAiSpeakingStatus(true);
        if (onStartRef.current) onStartRef.current();

        if (!("speechSynthesis" in window)) {
            setAiSpeakingStatus(false);
            if (onEndRef.current) onEndRef.current();
            if (onDone) onDone();
            return;
        }

        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        if (selectedVoiceRef.current) {
            utterance.voice = selectedVoiceRef.current;
        } else {
            const voices = speechSynthesis.getVoices();
            const fallback = voices.find(v => v.lang.startsWith("en"));
            if (fallback) {
                utterance.voice = fallback;
                selectedVoiceRef.current = fallback;
            }
        }
        utterance.rate = 0.95;

        const done = () => {
            activeUtteranceRef.current = null;
            setAiSpeakingStatus(false);
            // Mark the moment AI finishes speaking — baseline for response latency
            questionEndTimeRef.current = Date.now();
            if (onEndRef.current) onEndRef.current();
            if (onDone) onDone();
        };

        utterance.onend = done;
        utterance.onerror = (e) => { console.error(e); done(); };
        activeUtteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
    }, [setAiSpeakingStatus]);

    const cancelSpeech = useCallback(() => {
        speechSynthesis?.cancel();
        activeUtteranceRef.current = null;
        setAiSpeakingStatus(false);
    }, [setAiSpeakingStatus]);

    return {
        speakAI,
        aiSpeaking,
        aiSpeakingRef,
        cancelSpeech,
        questionEndTimeRef,
    };
}

export default useTTS;
