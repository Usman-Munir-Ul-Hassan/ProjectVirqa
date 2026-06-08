const AvatarStage = ({ aiSpeaking, isSessionEnded, active, userInitial }) => {
    return (
        <div className="flex-1 flex items-center justify-center bg-slate-950">
            <div className="flex items-center gap-16">
                {/* AI Avatar */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        {aiSpeaking && !isSessionEnded && (
                            <>
                                <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-60" />
                                <span className="absolute -inset-3.5 rounded-full border border-blue-500 animate-ping opacity-35" style={{ animationDelay: "0.5s" }} />
                            </>
                        )}
                        <div className={`w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-300 z-10 relative transition-all ${aiSpeaking && !isSessionEnded ? "ring-2 ring-blue-400 scale-105" : ""}`}>
                            AI
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Interviewer</span>
                </div>

                {/* User Avatar */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        {active && (
                            <>
                                <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-60" />
                                <span className="absolute -inset-3.5 rounded-full border border-green-500 animate-ping opacity-35" style={{ animationDelay: "0.5s" }} />
                            </>
                        )}
                        <div className={`w-16 h-16 rounded-full bg-green-900 flex items-center justify-center text-sm font-semibold text-green-300 z-10 relative transition-all ${active ? "ring-2 ring-green-400 scale-105" : ""}`}>
                            {userInitial}
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">You</span>
                </div>
            </div>
        </div>
    );
};

export default AvatarStage;
