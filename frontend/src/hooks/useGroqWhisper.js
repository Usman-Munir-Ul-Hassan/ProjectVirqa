/**
 * useGroqWhisper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: Groq Whisper audio recording + transcription pipeline.
 *
 * Manages MediaRecorder, Web Audio API silence detection, and
 * Groq Whisper SDK transcription with word-level timestamps.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Groq from "groq-sdk";
import { getGroqApiKey } from "../utils/runtimeConfig.js";

const GROQ_API_KEY = getGroqApiKey();
const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true });

/**
 
 * @returns {{
 *   startPipeline: function,
 *   forceKillHardware: function,
 *   isMicOn: boolean,
 *   setMicStatus: function,
 *   micError: string,
 *   endedRef: React.MutableRefObject,
 * }}
 */
export function useGroqWhisper({
    onTranscription,
    questionEndTimeRef,
    isSessionEnded,
    aiSpeakingRef,
    isWaitingRef,
}) {
    const [isMicOn, setIsMicOn] = useState(true);
    const [micError, setMicError] = useState("");

    const micRef = useRef(true);
    const endedRef = useRef(false);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const localStreamRef = useRef(null);

    const onTranscriptionRef = useRef(onTranscription);
    useEffect(() => { onTranscriptionRef.current = onTranscription; }, [onTranscription]);

    const setMicStatus = useCallback((on) => {
        micRef.current = on;
        setIsMicOn(on);
    }, []);

    // ── Force-kill all hardware resources ──────────────────────────────────────
    const forceKillHardware = useCallback(() => {
        endedRef.current = true;
        micRef.current = false;
        setIsMicOn(false);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try { mediaRecorderRef.current.stop(); } catch (_) { }
        }
        mediaRecorderRef.current = null;

        if (audioContextRef.current) {
            audioContextRef.current.cancel();
            audioContextRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
    }, []);

    // ── Groq Whisper Pipeline ──────────────────────────────────────────────────
    const startPipeline = useCallback(async () => {
        if (endedRef.current || isSessionEnded || aiSpeakingRef.current || !micRef.current || isWaitingRef.current) return;
        if (mediaRecorderRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioCtx();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 2048;
            const bufferLength = analyser.fftSize;
            const dataArray = new Uint8Array(bufferLength);

            let mimeType;
            if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
            else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            else mimeType = '';

            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);

            let audioChunks = [];
            mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', async () => {
                if (audioChunks.length === 0) return;
                const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/wav' });
                audioChunks = [];

                if (aiSpeakingRef.current || isSessionEnded || isWaitingRef.current || !micRef.current || endedRef.current) return;

                try {
                    const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });
                    const transcription = await groq.audio.transcriptions.create({
                        file: file,
                        model: "whisper-large-v3-turbo",
                        response_format: "verbose_json",
                        timestamp_granularities: ["word"],
                        language: "en"
                    });

                    const text = transcription.text;
                    const whisperWords = Array.isArray(transcription.words) ? transcription.words : null;

                    if (text && text.trim()) {
                        // Compute response latency: time from TTS end to now
                        const latencyMs = questionEndTimeRef.current
                            ? Date.now() - questionEndTimeRef.current
                            : null;
                        questionEndTimeRef.current = null;

                        if (onTranscriptionRef.current) {
                            onTranscriptionRef.current(text.trim(), whisperWords, latencyMs);
                        }
                    }
                } catch (err) {
                    console.error("[GROQ WHISPER ERROR]:", err);
                }

                // Restart recording if still listening
                if (micRef.current && !aiSpeakingRef.current && !isWaitingRef.current && !isSessionEnded && !endedRef.current) {
                    try { mediaRecorder.start(); } catch (e) { }
                }
            });

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;

            // Silence Detection loop
            let isSpeaking = false;
            let silenceTimer = null;
            let animationFrameId;

            const checkSilence = () => {
                if (!mediaRecorderRef.current) return;

                if (mediaRecorderRef.current.state === "recording") {
                    analyser.getByteTimeDomainData(dataArray);
                    let sumSquares = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        const normalized = (dataArray[i] / 128.0) - 1.0;
                        sumSquares += normalized * normalized;
                    }
                    const rms = Math.sqrt(sumSquares / bufferLength);

                    if (rms > 0.02) {
                        if (!isSpeaking) isSpeaking = true;
                        clearTimeout(silenceTimer);
                        silenceTimer = setTimeout(() => {
                            isSpeaking = false;
                            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                                mediaRecorderRef.current.stop();
                            }
                        }, 1500);
                    }
                }

                animationFrameId = requestAnimationFrame(checkSilence);
            };

            checkSilence();

            audioContextRef.current = {
                context: audioContext,
                cancel: () => {
                    cancelAnimationFrame(animationFrameId);
                    clearTimeout(silenceTimer);
                    try { audioContext.close(); } catch (_) { }
                }
            };

            setMicError("");

        } catch (err) {
            console.error("Groq initialization fault:", err);
            setMicError("Microphone hardware or Groq initialization fault.");
        }
    }, [isSessionEnded, aiSpeakingRef, isWaitingRef, questionEndTimeRef]);

    // ── Sync mic state to hardware ─────────────────────────────────────────────
    useEffect(() => {
        if (isSessionEnded) {
            forceKillHardware();
            return;
        }
        if (micRef.current && !aiSpeakingRef.current && !isWaitingRef.current) {
            startPipeline();
        } else {
            if (mediaRecorderRef.current) {
                if (mediaRecorderRef.current.state !== "inactive") {
                    try { mediaRecorderRef.current.stop(); } catch (_) { }
                }
                mediaRecorderRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.cancel();
                audioContextRef.current = null;
            }
        }
    }, [isMicOn, aiSpeakingRef.current, isWaitingRef.current, isSessionEnded, forceKillHardware, startPipeline]);

    return {
        startPipeline,
        forceKillHardware,
        isMicOn,
        setMicStatus,
        micError,
        endedRef,
        micRef,
    };
}

export default useGroqWhisper;
