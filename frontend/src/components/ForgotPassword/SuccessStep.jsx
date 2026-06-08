import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const SuccessStep = () => (
  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
    <div className="text-center py-6">
      <motion.div 
        initial={{ scale: 0 }} 
        animate={{ scale: 1 }} 
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)] text-white"
      >
        <CheckCircle size={48} strokeWidth={2} />
      </motion.div>
      <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">All Done!</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
        Your password has been successfully reset. You can now use your new password to sign in to your account.
      </p>
      <Link
        to="/login"
        className="inline-block w-full py-4 bg-white text-gray-900 font-bold rounded-xl text-sm tracking-wide shadow-lg hover:shadow-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Return to Login
      </Link>
    </div>
  </motion.div>
);

export default SuccessStep;
