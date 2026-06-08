import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

const PasswordStep = ({
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  showNew, setShowNew, showConfirm, setShowConfirm,
  strength, getStrengthLabel, getStrengthColor,
  isLoading, handleResetPassword, focusedInput, setFocusedInput, containerVariants
}) => (
  <motion.div key="password" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        <KeyRound size={32} strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">New Password</h2>
      <p className="text-gray-400 text-sm leading-relaxed">
        Create a strong new password to secure your account.
      </p>
    </div>

    <form onSubmit={handleResetPassword} className="space-y-6">
      <div>
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 ml-1">
          New Password
        </label>
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur transition-opacity duration-300 ${focusedInput === 'newPassword' ? 'opacity-100' : 'opacity-0'}`} />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors z-10">
            <KeyRound size={18} />
          </div>
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setFocusedInput('newPassword')}
            onBlur={() => setFocusedInput(null)}
            className="relative w-full pl-11 pr-12 py-4 bg-gray-800/50 border border-white/10 rounded-xl outline-none transition-all duration-300 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:bg-gray-800/80"
            placeholder="Enter new password"
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors z-10"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Strength Meter */}
        <AnimatePresence>
          {newPassword && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Security Level</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${strength === 1 ? "text-red-400" : strength === 2 ? "text-yellow-400" : strength === 3 ? "text-blue-400" : strength === 4 ? "text-emerald-400" : "text-gray-500"}`}>
                  {getStrengthLabel()}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex gap-1 p-0.5">
                {[1, 2, 3, 4].map((level) => (
                  <motion.div
                    key={level}
                    className={`h-full flex-1 rounded-full ${level <= strength ? getStrengthColor() : 'bg-transparent'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 ml-1">
          Confirm Password
        </label>
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur transition-opacity duration-300 ${focusedInput === 'confirmPassword' ? 'opacity-100' : 'opacity-0'}`} />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors z-10">
            <CheckCircle size={18} />
          </div>
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setFocusedInput('confirmPassword')}
            onBlur={() => setFocusedInput(null)}
            className={`relative w-full pl-11 pr-12 py-4 bg-gray-800/50 border rounded-xl outline-none transition-all duration-300 text-white placeholder-gray-500 focus:bg-gray-800/80 ${
              confirmPassword && newPassword !== confirmPassword
                ? "border-red-500/50 focus:border-red-500/50"
                : "border-white/10 focus:border-emerald-500/50"
            }`}
            placeholder="Confirm new password"
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors z-10"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {confirmPassword && newPassword !== confirmPassword && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 mt-2 ml-1 flex items-center gap-1.5 font-medium">
              <XCircle size={14} /> Passwords do not match
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={isLoading || !newPassword || newPassword !== confirmPassword || strength < 3}
        className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 shadow-lg relative overflow-hidden group bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 disabled:from-gray-700 disabled:to-gray-600 mt-4"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Resetting...</>
          ) : 'Reset Password'}
        </span>
      </button>
    </form>
  </motion.div>
);

export default PasswordStep;
