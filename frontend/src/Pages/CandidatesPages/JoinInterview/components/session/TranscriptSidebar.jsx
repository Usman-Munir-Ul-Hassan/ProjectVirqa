const TranscriptSidebar = ({ messages, interim, transcriptEndRef }) => {
    return (
        <div className="w-72 border-r border-slate-800 flex flex-col h-full bg-slate-950/50">
            <p className="text-[10px] text-slate-500 px-4 pt-3 pb-1 uppercase tracking-widest font-medium shrink-0">
                Interview Transcript
            </p>
            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3 min-h-0 select-text">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[90%] ${m.role === "user"
                            ? "bg-blue-900 text-blue-100 self-end rounded-br-none"
                            : "bg-slate-800 text-slate-200 self-start rounded-bl-none"
                            }`}
                    >
                        <div className="opacity-40 text-[10px] mb-0.5 font-semibold">
                            {m.role === "user" ? "You" : "Interviewer"}
                        </div>
                        {m.content}
                    </div>
                ))}

                {interim && (
                    <div className="px-3 py-2 rounded-xl text-xs italic text-blue-300 bg-blue-950/40 border border-dashed border-blue-800 self-end max-w-[90%] rounded-br-none">
                        <div className="opacity-40 text-[10px] mb-0.5 font-semibold not-italic">You (Speaking)</div>
                        {interim}
                        <span className="ml-1 opacity-50 animate-pulse">...</span>
                    </div>
                )}
                <div ref={transcriptEndRef} />
            </div>
        </div>
    );
};

export default TranscriptSidebar;
