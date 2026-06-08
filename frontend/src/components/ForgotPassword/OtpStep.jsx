import { motion } from 'framer-motion';
import { ShieldCheck, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

const OtpStep = ({ email, otp, otpRefs, isLoading, handleOtpChange, handleOtpKeyDown, handleOtpPaste, handleVerifyOtp, setStep, handleSendResetCode, containerVariants }) => {
  const calculateTimeLeft = () => {
    const expiry = sessionStorage.getItem('timer_expiry');
    if (!expiry) return 0;
    const diff = Math.floor((parseInt(expiry) - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const onResendClick = async (e) => {
    e.preventDefault();
    const success = await handleSendResetCode(e);
    if (success) {
      sessionStorage.setItem('timer_expiry', Date.now() + 600 * 1000);
      setTimeLeft(calculateTimeLeft());
    }
  };

  return (
    <motion.div key="otp" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
          <ShieldCheck size={32} strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Verify Code</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          We sent a 6-digit verification code to <br />
          <span className="text-white font-medium">{email}</span>
        </p>

        {timeLeft > 0 ? (
          <div className="flex items-center justify-center gap-2 text-indigo-400 bg-indigo-500/10 inline-flex px-3 py-1.5 rounded-lg border border-indigo-500/20">
            <Clock size={16} />
            <span className="font-mono text-sm font-medium tracking-wider">
              Expires in: {formatTime(timeLeft)}
            </span>
          </div>
        ) : (
          <div className="text-red-400 bg-red-500/10 inline-flex px-3 py-1.5 rounded-lg border border-red-500/20 text-sm font-medium">
            Code has expired. Please resend.
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
            Enter Security Code
          </label>
          <div className="flex gap-3 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => otpRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
                disabled={timeLeft <= 0}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 focus:bg-gray-800/80 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleVerifyOtp}
          disabled={isLoading || otp.join('').length !== 6 || timeLeft <= 0}
          className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 shadow-lg relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 disabled:from-gray-700 disabled:to-gray-600"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verifying...</>
            ) : 'Verify Code'}
          </span>
        </button>

        <div className="text-center flex items-center justify-between text-sm mt-4">
          <button onClick={() => setStep('email')} className="text-gray-400 hover:text-white transition-colors">
            Change Email
          </button>
          <button
            onClick={onResendClick}
            disabled={isLoading}
            className={`font-medium transition-colors ${isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}`}
          >
            Resend Code
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OtpStep;
