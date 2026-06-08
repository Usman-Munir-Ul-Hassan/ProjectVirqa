import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { AlertTriangle, CheckCircle } from "lucide-react";

import { useInterviewTimer } from "../../../../hooks/useInterviewTimer";
import { useTTS } from "../../../../hooks/useTTS";
import { useGroqWhisper } from "../../../../hooks/useGroqWhisper";
import { useSocketSession } from "../../../../hooks/useSocketSession";

import SessionHeader from "./session/SessionHeader";
import TranscriptSidebar from "./session/TranscriptSidebar";
import AvatarStage from "./session/AvatarStage";
import ControlTray from "./session/ControlTray";

const ActiveSession = ({ interviewId, onLeave, role, totalDurationMinutes = 60 }) => {
    const user = useSelector((s) => s.auth.user);
    const TOTAL_SECONDS = totalDurationMinutes * 60;
    const userId = user?._id || user?.id;

    const sessionStartRef = useRef(Date.now());
    const isWaitingRef = useRef(false);
    const warningTriggeredRef = useRef(false);
    const transcriptEndRef = useRef(null);

    // ── TTS hook (no dependencies on other hooks) ──────────────────────────────
    const handleTtsStart = useCallback(() => {
        isWaitingRef.current = true;
    }, []);

    const handleTtsEnd = useCallback(() => {
        isWaitingRef.current = false;
    }, []);

    const {
        speakAI,
        aiSpeaking,
        aiSpeakingRef,
        cancelSpeech,
        questionEndTimeRef,
    } = useTTS(handleTtsStart, handleTtsEnd);

    // ── Socket session hook (provides isSessionEnded for other hooks) ──────────
    const speakAiRef = useRef(speakAI);
    useEffect(() => { speakAiRef.current = speakAI; }, [speakAI]);

    const onLeaveRef = useRef(onLeave);
    useEffect(() => { onLeaveRef.current = onLeave; }, [onLeave]);

    // Refs for callbacks that need to be set after hooks initialize
    const emitEndInterviewRef = useRef(null);
    const disconnectSocketRef = useRef(null);
    const setIsSessionEndedRef = useRef(null);

    const handleSessionComplete = useCallback(() => {
        if (setIsSessionEndedRef.current) setIsSessionEndedRef.current(true);
        setTimeout(() => {
            if (disconnectSocketRef.current) disconnectSocketRef.current();
            onLeaveRef.current(true);
        }, 3000);
    }, []);

    const handleAiReply = useCallback((textContent, isInterviewComplete) => {
        console.log('[TTS] Speaking AI response');
        speakAiRef.current(textContent, () => {
            if (isInterviewComplete) {
                handleSessionComplete();
            }
        });
    }, [handleSessionComplete]);

    // Temporary forceKillMic ref — gets set after useGroqWhisper
    const forceKillMicRef = useRef(() => {});

    const {
        messages,
        interim,
        currentQuestionNum,
        isSessionEnded,
        setIsSessionEnded,
        emitUserSpoke,
        emitEndInterview,
        disconnectSocket,
    } = useSocketSession({
        interviewId,
        userId,
        onAiReply: handleAiReply,
        forceKillMic: () => forceKillMicRef.current(),
    });

    // Wire post-initialization refs
    useEffect(() => {
        setIsSessionEndedRef.current = setIsSessionEnded;
        disconnectSocketRef.current = disconnectSocket;
        emitEndInterviewRef.current = emitEndInterview;
    }, [setIsSessionEnded, disconnectSocket, emitEndInterview]);

    // ── Whisper transcription callback ─────────────────────────────────────────
    const emitUserSpokeRef = useRef(emitUserSpoke);
    useEffect(() => { emitUserSpokeRef.current = emitUserSpoke; }, [emitUserSpoke]);

    const handleTranscription = useCallback((text, whisperWords, latencyMs) => {
        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount < 3) return;

        isWaitingRef.current = true;

        const cleanCheck = text.toLowerCase();
        const forceEnd =
            cleanCheck.includes("terminate the session") ||
            cleanCheck.includes("terminate the interview") ||
            cleanCheck.includes("end the interview") ||
            cleanCheck.includes("stop the interview");

        const elapsedMs = Date.now() - sessionStartRef.current;

        if (emitUserSpokeRef.current) {
            emitUserSpokeRef.current(text, whisperWords, latencyMs, elapsedMs, forceEnd);
        }
    }, []);

    // ── Groq Whisper hook (receives isSessionEnded from socket) ────────────────
    const {
        forceKillHardware,
        isMicOn,
        setMicStatus,
        micError,
        endedRef,
    } = useGroqWhisper({
        onTranscription: handleTranscription,
        questionEndTimeRef,
        isSessionEnded,
        aiSpeakingRef,
        isWaitingRef,
    });

    // Wire forceKillMic into the ref used by socket session
    useEffect(() => {
        forceKillMicRef.current = forceKillHardware;
    }, [forceKillHardware]);

    // ── Timer hook ─────────────────────────────────────────────────────────────
    const handleTimerExpire = useCallback(() => {
        forceKillHardware();
        cancelSpeech();
        if (emitEndInterviewRef.current) emitEndInterviewRef.current();
        if (setIsSessionEndedRef.current) setIsSessionEndedRef.current(true);
        setTimeout(() => onLeaveRef.current(true), 3000);
    }, [forceKillHardware, cancelSpeech]);

    const { timeLeft, timelineStatus, formatTime } = useInterviewTimer(TOTAL_SECONDS, handleTimerExpire);

    // ── Tab close protection ───────────────────────────────────────────────────
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isSessionEnded) return;
            e.preventDefault();
            e.returnValue = "Are you sure you want to end the interview?";
            return e.returnValue;
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isSessionEnded]);

    // ── Auto-scroll transcript ─────────────────────────────────────────────────
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, interim]);

    // ── Derived state ──────────────────────────────────────────────────────────
    const active = isMicOn && !aiSpeaking && !isSessionEnded;
    const userInitial = user?.name?.[0]?.toUpperCase() ?? "U";

    // ── Control handlers ───────────────────────────────────────────────────────
    const handleToggleMic = useCallback(() => {
        setMicStatus(!isMicOn);
    }, [isMicOn, setMicStatus]);

    const handleEndSession = useCallback(() => {
        if (!isSessionEnded && !endedRef.current) {
            if (!window.confirm("Are you sure you want to end the interview? Your responses will be saved and evaluated.")) {
                return;
            }
            forceKillHardware();
            cancelSpeech();
            if (emitEndInterviewRef.current) emitEndInterviewRef.current();
            onLeaveRef.current(true);
        } else {
            forceKillHardware();
            cancelSpeech();
            onLeaveRef.current(true);
        }
    }, [isSessionEnded, endedRef, forceKillHardware, cancelSpeech]);

    return (
        <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-white flex flex-col">
            <SessionHeader
                role={role}
                isSessionEnded={isSessionEnded}
                currentQuestionNum={currentQuestionNum}
                timelineStatus={timelineStatus}
                timeLeft={timeLeft}
                isMicOn={isMicOn}
                aiSpeaking={aiSpeaking}
                formatTime={formatTime}
            />

            {micError && (
                <div className="bg-red-950 text-red-300 text-xs px-4 py-2 text-center shrink-0 flex items-center justify-center gap-2">
                    <AlertTriangle size={14} /> {micError}
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {isSessionEnded && (
                    <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center gap-4 animate-fade-in backdrop-blur-sm">
                        <div className="p-4 bg-emerald-950/50 border border-emerald-800 rounded-2xl flex flex-col items-center gap-3 text-center max-w-sm shadow-2xl">
                            <CheckCircle className="text-emerald-400" size={40} />
                            <h3 className="font-semibold text-base text-emerald-200">Interview Completed Successfully</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Your transcript and audio parameters have been packaged and deployed to the HR evaluation logs. Returning you back to the session lobby...
                            </p>
                        </div>
                    </div>
                )}

                <TranscriptSidebar
                    messages={messages}
                    interim={interim}
                    transcriptEndRef={transcriptEndRef}
                />

                <AvatarStage
                    aiSpeaking={aiSpeaking}
                    isSessionEnded={isSessionEnded}
                    active={active}
                    userInitial={userInitial}
                />
            </div>

            <ControlTray
                isMicOn={isMicOn}
                isSessionEnded={isSessionEnded}
                disabled={warningTriggeredRef.current}
                onToggleMic={handleToggleMic}
                onEndSession={handleEndSession}
            />
        </div>
    );
};

export default ActiveSession;
