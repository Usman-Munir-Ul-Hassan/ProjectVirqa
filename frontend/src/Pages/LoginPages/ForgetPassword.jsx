import { useState, useRef,useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api.js'
import Logo from '../../components/common/Logo.jsx';

// Import sub-steps
import EmailStep from '../../components/ForgotPassword/EmailStep';
import OtpStep from '../../components/ForgotPassword/OtpStep';
import PasswordStep from '../../components/ForgotPassword/PasswordStep';
import SuccessStep from '../../components/ForgotPassword/SuccessStep';

const ForgotPassword = () => {
  const [step, setStep] = useState(sessionStorage.getItem('step') || 'email'); 
  const [email, setEmail] = useState(sessionStorage.getItem('email') || '');
  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [otp, setOtp] = useState(JSON.parse(sessionStorage.getItem('otp')) || ['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  // Auto-save state so it survives refresh
  useEffect(() => {
    sessionStorage.setItem('step', step);
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('otp', JSON.stringify(otp));
  }, [step, email, otp]);

  // Clear state when user navigates away to another page (like Login)
  // Note: This cleanup does NOT run on browser refresh, which is exactly what we want!
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('step');
      sessionStorage.removeItem('email');
      sessionStorage.removeItem('otp');
      sessionStorage.removeItem('timer');
    };
  }, []);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Focus effect for inputs
  const [focusedInput, setFocusedInput] = useState(null);

  // Password strength checking
  const checkStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;//contains special character
    return score;
  };

  const strength = checkStrength(newPassword);

  const getStrengthLabel = () => {
    switch (strength) {
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      default: return "";
    }
  };

  const getStrengthColor = () => {
    switch (strength) {
      case 1: return "bg-red-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-blue-500";
      case 4: return "bg-emerald-500";
      default: return "bg-gray-200";
    }
  };

  // --- Handlers ---

  const handleSendResetCode = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    try {
      setIsLoading(true);

      const response = await api.post("/user/forget-password", {
        email: email
      });

      if (response.status === 200) {
        toast.success('Verification code sent! Check your inbox.');
        sessionStorage.setItem('timer_expiry', Date.now() + 600 * 1000);
        setStep('otp');
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Updates the specific OTP box with the typed number and moves to the next box
  const handleOtpChange = (index, value) => {
    // Only allow numbers (0-9) or empty string
    const isNumber = /^[0-9]*$/.test(value);
    if (!isNumber) return;

    // Create a copy of current OTP array
    const newOtp = [...otp];
    
    // Update the specific box with the last typed character
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // If they typed a number and it's not the last box, move cursor to the next box
    if (value !== '' && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  // Moves the cursor to the previous box if they press Backspace on an empty box
  const handleOtpKeyDown = (index, e) => {
    // Check if they pressed backspace, the box is empty, and it's not the first box
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  // Automatically fills all 6 boxes when they paste a copied number
  const handleOtpPaste = (e) => {
    e.preventDefault(); // Stop the default browser paste action

    // Get the pasted text
    const pastedData = e.clipboardData.getData('text');
    
    // Check if the pasted text only contains numbers
    const isNumber = /^[0-9]+$/.test(pastedData);
    if (!isNumber) return;

    // Split the pasted text into an array of individual digits
    const pastedArray = pastedData.split('');
    
    // Create a fresh array of 6 empty strings
    const newOtp = ['', '', '', '', '', ''];

    // Fill our new OTP array with up to 6 pasted numbers
    for (let i = 0; i < 6; i++) {
      if (pastedArray[i]) {
        newOtp[i] = pastedArray[i];
      }
    }

    setOtp(newOtp);

    // Move the cursor to the last filled box
    const lastFilledIndex = Math.min(pastedArray.length, 5);
    otpRefs.current[lastFilledIndex].focus();
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {

      const data = await api.post("/user/verify-otp", {
        email: email,
        otp: otpCode
      });
      if (data.status === 200) {
        toast.success('OTP verified successfully!');
        setStep('password');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error! in verifying OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (strength < 3) {
      toast.error('Password is too weak. Please use a stronger password');
      return;
    }

    setIsLoading(true);
    try {

      const data = await api.post("/user/reset-password", {
        email,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      });
      if (data.status == 200) {
        toast.success(data.data.message);
        setStep('success');
        sessionStorage.clear();
      } else {
        toast.error(data.data.message);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-[#111827] to-gray-800 flex flex-col justify-center items-center relative overflow-hidden font-sans">

      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Header Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-8 z-20"
      >
        <Logo theme="light" className="scale-110" />
      </motion.div>

      {/* Main Dynamic Form Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10 px-4"
      >
        <div className="bg-gray-900/40 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/5 p-8 sm:p-10 relative overflow-hidden">

          {/* Subtle inner top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          {/* Stepper Progress Indicator */}
          {step !== 'success' && (
            <div className="flex justify-center mb-8 gap-2">
              {['email', 'otp', 'password'].map((s, i) => {
                const stepIndex = ['email', 'otp', 'password'].indexOf(step);
                const isActive = stepIndex >= i;
                return (
                  <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-blue-500 w-8' : 'bg-white/10 w-4'}`} />
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <EmailStep
                email={email} setEmail={setEmail} isLoading={isLoading}
                handleSendResetCode={handleSendResetCode}//for changing step
                focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                containerVariants={containerVariants}
              />
            )}
            {step === 'otp' && (
              <OtpStep
                email={email} otp={otp} otpRefs={otpRefs} isLoading={isLoading}
                handleOtpChange={handleOtpChange} handleOtpKeyDown={handleOtpKeyDown}
                handleOtpPaste={handleOtpPaste} handleVerifyOtp={handleVerifyOtp}
                setStep={setStep} handleSendResetCode={handleSendResetCode}
                containerVariants={containerVariants}
              />
            )}
            {step === 'password' && (
              <PasswordStep
                newPassword={newPassword} setNewPassword={setNewPassword}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                showNew={showNew} setShowNew={setShowNew}
                showConfirm={showConfirm} setShowConfirm={setShowConfirm}
                strength={strength} getStrengthLabel={getStrengthLabel} getStrengthColor={getStrengthColor}
                isLoading={isLoading} handleResetPassword={handleResetPassword}
                focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                containerVariants={containerVariants}
              />
            )}
            {step === 'success' && <SuccessStep />}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <p className="text-center text-gray-500 text-xs mt-8">
          Need help? <Link to="/contactus" className="text-gray-400 hover:text-white transition-colors underline underline-offset-2">Contact Support</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
