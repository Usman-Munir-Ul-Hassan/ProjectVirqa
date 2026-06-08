import { Clock } from "lucide-react";

const SessionHeader = ({ role, isSessionEnded, currentQuestionNum, timelineStatus, timeLeft, isMicOn, aiSpeaking, formatTime }) => {
    return (
        <div className="p-4 border-b border-slate-800 flex justify-between items-center h-16 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h2 className="font-semibold text-sm leading-none mb-1">{role}</h2>
                    {isSessionEnded ? (
                        <span className="text-[11px] text-red-400 font-medium tracking-wide">Interview Terminated</span>
                    ) : currentQuestionNum === 0 ? (
                        <span className="text-[11px] text-blue-400 font-medium animate-pulse">Phase 1: Warm-Up & Background</span>
                    ) : (
                        <span className="text-[11px] text-slate-400">Technical Evaluation • {currentQuestionNum} questions explored</span>
                    )}
                </div>

                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${isSessionEnded
                    ? "bg-red-950/40 text-red-400 border-red-900"
                    : timelineStatus === "Warm-Up"
                        ? "bg-blue-950/40 text-blue-400 border-blue-900"
                        : timelineStatus === "Technical Assessment"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900"
                            : "bg-amber-950/40 text-amber-400 border-amber-900"
                    }`}>
                    {isSessionEnded ? "Concluded" : timelineStatus}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-lg border ${timeLeft <= 60
                    ? "bg-red-950/60 text-red-400 border-red-800 font-bold animate-bounce"
                    : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}>
                    <Clock size={13} />
                    <span>Time Remaining: {formatTime(timeLeft)}</span>
                </div>

                <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-2 border ${isSessionEnded
                    ? "bg-red-950 text-red-400 border-red-900"
                    : !isMicOn
                        ? "bg-stone-900 text-stone-500 border-stone-700"
                        : aiSpeaking
                            ? "bg-blue-950 text-blue-400 border-blue-800"
                            : "bg-green-950 text-green-400 border-green-800"
                    }`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {isSessionEnded ? "Session Terminated" : !isMicOn ? "Mic Off" : aiSpeaking ? "AI Speaking..." : "Listening..."}
                </span>
            </div>
        </div>
    );
};

export default SessionHeader;
