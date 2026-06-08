import { Mic, MicOff, PhoneOff } from "lucide-react";

const ControlTray = ({ isMicOn, isSessionEnded, disabled, onToggleMic, onEndSession }) => {
    return (
        <div className="p-4 flex justify-center gap-4 border-t border-slate-800 h-20 shrink-0 bg-slate-950">
            <button
                disabled={disabled || isSessionEnded}
                onClick={onToggleMic}
                className={`p-3 rounded-full border transition-all ${disabled || isSessionEnded
                    ? "opacity-10 cursor-not-allowed"
                    : isMicOn
                        ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                        : "bg-orange-950 border-orange-800 text-orange-400 hover:bg-orange-900"
                    }`}
            >
                {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
                onClick={onEndSession}
                className="p-3 bg-red-900 border border-red-700 text-red-200 rounded-full hover:bg-red-800 transition-colors"
            >
                <PhoneOff size={18} />
            </button>
        </div>
    );
};

export default ControlTray;
