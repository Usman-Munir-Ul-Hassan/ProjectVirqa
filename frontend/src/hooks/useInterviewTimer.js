/**
 * useInterviewTimer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: countdown timer + phase calculation.
 *
 * Manages the interview countdown and derives the current phase
 * (Warm-Up / Technical Assessment / Wrap-Up) from elapsed time.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * @param {number} totalSeconds  Total interview duration in seconds.
 * @param {function|null} onExpire  Callback when timer reaches 0.
 * @returns {{ timeLeft: number, timelineStatus: string, formatTime: function }}
 */
export function useInterviewTimer(totalSeconds, onExpire = null) {
    const [timeLeft, setTimeLeft] = useState(totalSeconds);
    const [timelineStatus, setTimelineStatus] = useState("Warm-Up");
    const onExpireRef = useRef(onExpire);

    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const nextTime = prev - 1;
                const elapsedSeconds = totalSeconds - nextTime;
                const progressPercent = Math.round((elapsedSeconds / totalSeconds) * 100);

                // Timer expired
                if (nextTime <= 0) {
                    if (onExpireRef.current) onExpireRef.current();
                    return 0;
                }

                // Time-based phases
                if (progressPercent < 20) {
                    setTimelineStatus("Warm-Up");
                } else if (progressPercent < 75) {
                    setTimelineStatus("Technical Assessment");
                } else {
                    setTimelineStatus("Wrap-Up");
                }

                return nextTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [totalSeconds, timeLeft]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }, []);

    return { timeLeft, timelineStatus, formatTime };
}

export default useInterviewTimer;
