import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoIosArrowRoundBack } from "react-icons/io";
import { Mail } from 'lucide-react';

const EmailStep = ({ email, setEmail, isLoading, handleSendResetCode, focusedInput, setFocusedInput, containerVariants }) => (
  <motion.div key="email" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        <Mail size={32} strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Forgot Password?</h2>
      <p className="text-gray-400 text-sm leading-relaxed">
        Enter the email address associated with your account and we'll send you a code to reset your password.
      </p>
    </div>

    <form onSubmit={handleSendResetCode} className="space-y-6">
      <div>
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 ml-1">
          Email Address
        </label>
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur transition-opacity duration-300 ${focusedInput === 'email' ? 'opacity-100' : 'opacity-0'}`} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
            required
            className="relative w-full px-5 py-4 bg-gray-800/50 border border-white/10 rounded-xl outline-none transition-all duration-300 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/80"
            placeholder="e.g. alex@example.com"
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 shadow-lg relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Sending...</>
          ) : 'Send Reset Code'}
        </span>
      </button>
    </form>

    <div className="mt-8 text-center">
      <Link to="/login" className="inline-flex items-center justify-center gap-2 text-gray-400 hover:text-white font-medium text-sm transition-colors group">
        <IoIosArrowRoundBack className="text-xl transition-transform group-hover:-translate-x-1" />
        Back to Login
      </Link>
    </div>
  </motion.div>
);

export default EmailStep;
