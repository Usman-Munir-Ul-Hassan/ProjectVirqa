
import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-20 pb-24 px-6 sm:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        
        {/* Left Side — Text */}
        <div className="flex-1 text-center md:text-left space-y-8 order-1">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
            Speak. Evaluate. Improve{" "}
            <span className="bg-linear-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent animate-gradient-x">
              AI-Powered Voice Interviews
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto md:mx-0">
            Experience adaptive, AI-driven interviews that analyze your tone, fluency, and confidence helping you refine your communication like never before.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
            <button 
              onClick={() => navigate('/login')}
              className="group bg-gradient-to-r cursor-pointer from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Try a Demo Interview
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            <button className="group border border-white/20 bg-white/5 backdrop-blur-md text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/40 hover:scale-105 transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              Watch How It Works
            </button>
          </div>
        </div>

        {/* Right Side — Image */}
        <div className="flex-1 flex justify-center order-2 md:order-2">
            <img
            src="https://cdn.prod.website-files.com/685be7dcd32275d383065239/685be7dcd32275d383068275_Blog%20Cover_2024_02_%20Interview%20Equipment%20Essentials%20for%20Recording%20In-Person%20_%20Online%20(1).webp"
            alt="AI Voice Interview"
            className="rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 w-full max-w-[420px] md:max-w-full md:h-[520px] object-cover animate-fade-in"
          />
        </div>
      </div>

      {/* Subtle gradient glow background */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen -z-10 animate-float-slow"></div>

      {/* Local Animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 6s ease infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1.2s ease-out;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
