// pages/Auth/AuthPage.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiMail, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Logo from '../../components/common/Logo.jsx';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/authSlice';
import api from '../../utils/api';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch(); // Hook to send data to Redux
  const navigate = useNavigate(); // Hook for navigation

  // React Query handles the API call, loading state, and errors automatically
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/user/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(setCredentials(data.user));
      toast.success(`${data.name} Login successful!`)

      // Navigate to the respective dashboard based on the active role
      if (data.role === 'candidate') {
        navigate('/api/v1/candidates');
      } else if (data.role === 'employee') {
        navigate('/api/v1/employee');
      } else if (data.role === 'admin') {
        navigate('/api/v1/admin');
      } else {
        navigate('/error'); // Fallback route
      }
    },
    onError: (error) => {
      const customMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(customMessage);
    }
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };
  const handleRegisterClick = (e) => {
    e.preventDefault();
    toast.info(
      "Direct registration is not available. Please contact your institution's administrator to create an account.",
      {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 flex flex-col justify-center items-center relative overflow-hidden group font-sans">

      {/* Animated Grid on Hover (from ContactUs) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />

      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10 px-4"
      >

        {/* Logo Section */}
        <div className="mb-8 flex justify-center">
          {/* Logo handles its own theme, but we want it to look good on dark bg. 
                Our Logo component has a 'light' theme which means 'for dark backgrounds'.
            */}
          <Logo theme="light" className="scale-125" />
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">

          <div className="text-center mb-8 mt-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400 text-sm">
              Log in to your VIRQA account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Custom styled inputs for dark theme */}
            <div className="space-y-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiMail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiLock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <NavLink
                to="/forget-password"
                className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
              >
                Forgot Password?
              </NavLink>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={`w-full py-3.5 px-4 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${loginMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={handleRegisterClick}
                className="text-white hover:text-blue-400 font-bold transition-colors cursor-pointer bg-transparent border-none underline"
              >
                Register
              </button>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-gray-600 text-xs mt-8">
          © 2025 VIRQA. All rights reserved.
        </p>

      </motion.div>
    </div>
  );
};

export default Login;
