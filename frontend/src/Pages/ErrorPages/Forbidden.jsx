import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Forbidden = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl animate-pulse delay-700" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-md w-full bg-white/5 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl"
            >
                {/* Icon */}
                <motion.div 
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                    className="mb-6 flex justify-center"
                >
                    <div className="p-5 bg-red-500/20 rounded-full border border-red-500/30">
                        <ShieldAlert size={64} className="text-red-500" />
                    </div>
                </motion.div>

                {/* Text Content */}
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">403 - Forbidden</h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Oops! Access Denied. You don't have permission to access this page. 
                    Please contact your administrator if you think this is a mistake.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/20 transition-all font-semibold"
                    >
                        <Home size={18} />
                        Home
                    </button>
                </div>
            </motion.div>

            <p className="mt-8 text-gray-600 text-sm">
                VIRQA Security Protocol &copy; 2024
            </p>
        </div>
    );
};

export default Forbidden;
