/**
 * useSocketSession.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: Socket.IO connection lifecycle + interview events.
 *
 * Manages connect/disconnect, user_spoke/ai_reply/end_interview events,
 * message state, question tracking, and completion detection.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { getSocketUrl } from "../utils/runtimeConfig.js";

const socket = io(getSocketUrl(), { autoConnect: false, withCredentials: true });
const completedGreetings = new Set();

/**
 * @param {object} options
 * @param {string} options.interviewId
 * @param {string} options.userId
 * @param {function} options.onAiReply  Called with (textContent, isInterviewComplete, questionNum)
 * @param {function} options.forceKillMic  Called to kill mic hardware on completion
 * @returns {{
 *   messages: Array,
 *   setMessages: function,
 *   interim: string,
 *   setInterim: function,
 *   currentQuestionNum: number,
 *   isSessionEnded: boolean,
 *   setIsSessionEnded: function,
 *   emitUserSpoke: function,
 *   emitEndInterview: function,
 *   msgsRef: React.MutableRefObject,
 * }}
 */
export function useSocketSession({ interviewId, userId, onAiReply, forceKillMic }) {
    const [messages, setMessages] = useState([]);
    const [interim, setInterim] = useState("");
    const [currentQuestionNum, setCurrentQuestionNum] = useState(0);
    const [isSessionEnded, setIsSessionEnded] = useState(false);

    const msgsRef = useRef([]);
    const onAiReplyRef = useRef(onAiReply);
    const forceKillMicRef = useRef(forceKillMic);

    useEffect(() => { msgsRef.current = messages; }, [messages]);
    useEffect(() => { onAiReplyRef.current = onAiReply; }, [onAiReply]);
    useEffect(() => { forceKillMicRef.current = forceKillMic; }, [forceKillMic]);

    // ── Socket connection lifecycle ────────────────────────────────────────────
    useEffect(() => {
        socket.connect();
        return () => { socket.disconnect(); };
    }, []);

    // ── AI reply handler ───────────────────────────────────────────────────────
    useEffect(() => {
        const handleAiReply = (data) => {
            console.log('[SOCKET] Received ai_reply', data);

            const isPayloadObject = data && typeof data === "object" && data !== null;
            let textContent = isPayloadObject ? data.content : data;
            const receivedQuestionNum = isPayloadObject ? data.questionNum : null;
            let isInterviewComplete = isPayloadObject ? data.isFinished : false;

            if (typeof textContent === "string" && textContent.includes("<SCORE_JSON>")) {
                isInterviewComplete = true;
                textContent = textContent.replace(/<SCORE_JSON>([\s\S]*?)<\/SCORE_JSON>/g, "").trim();
            }

            const cleanText = textContent.toLowerCase().trim();
            setMessages((p) => [...p, { role: "assistant", content: textContent }]);

            if (isPayloadObject && receivedQuestionNum !== null && receivedQuestionNum !== undefined) {
                setCurrentQuestionNum(receivedQuestionNum);
            } else if (!isInterviewComplete) {
                const totalUserMessages = msgsRef.current.filter(m => m.role === "user").length;
                const isGreetingIntent =
                    cleanText.includes("hello") ||
                    cleanText.includes("welcome to the interview") ||
                    (cleanText.includes("start by telling me") && totalUserMessages === 0);

                if (isGreetingIntent) setCurrentQuestionNum(0);
                else if (cleanText.includes("?")) setCurrentQuestionNum((prev) => (prev === 0 ? 1 : prev + 1));
            }

            if (isInterviewComplete && forceKillMicRef.current) {
                forceKillMicRef.current();
            }

            if (onAiReplyRef.current) {
                onAiReplyRef.current(textContent, isInterviewComplete, receivedQuestionNum);
            }
        };

        socket.on("ai_reply", handleAiReply);
        return () => { socket.off("ai_reply", handleAiReply); };
    }, []);

    // ── Initial greeting emission ──────────────────────────────────────────────
    useEffect(() => {
        if (interviewId && userId && !completedGreetings.has(interviewId)) {
            completedGreetings.add(interviewId);
            console.log('[SOCKET] Emitting initial welcome payload', { interviewId, candidateId: userId });
            socket.emit("user_spoke", { interviewId, candidateId: userId, history: [] });
        }
    }, [interviewId, userId]);

    // ── Emit user_spoke ────────────────────────────────────────────────────────
    const emitUserSpoke = useCallback((text, whisperWords, responseLatencyMs, answerElapsedMs, forceEnd = false) => {
        const history = [...msgsRef.current, { role: "user", content: text }];
        setMessages(history);

        console.log('[SOCKET] Emitting user_spoke', { interviewId, candidateId: userId, text });
        socket.emit("user_spoke", {
            interviewId,
            candidateId: userId,
            history,
            forceEndSession: forceEnd,
            whisperWords,
            responseLatencyMs,
            answerElapsedMs,
        });

        return history;
    }, [interviewId, userId]);

    // ── Emit end_interview ─────────────────────────────────────────────────────
    const emitEndInterview = useCallback(() => {
        socket.emit("end_interview", {
            interviewId,
            candidateId: userId,
            history: msgsRef.current,
        });
        completedGreetings.delete(interviewId);
    }, [interviewId, userId]);

    // ── Cleanup on unmount ─────────────────────────────────────────────────────
    const disconnectSocket = useCallback(() => {
        socket.disconnect();
        completedGreetings.delete(interviewId);
    }, [interviewId]);

    return {
        socket,
        messages,
        setMessages,
        interim,
        setInterim,
        currentQuestionNum,
        isSessionEnded,
        setIsSessionEnded,
        emitUserSpoke,
        emitEndInterview,
        disconnectSocket,
        msgsRef,
    };
}

export default useSocketSession;
