

import { motion } from "framer-motion";
import { CheckCircle2, Mic, LineChart } from "lucide-react";

const steps = [
  {
    icon: CheckCircle2,
    title: "Start Interview",
    desc: "Choose your domain and let VIRQA generate smart, adaptive questions powered by LLMs.",
  },
  {
    icon: Mic,
    title: "Speak & Analyze",
    desc: "Answer naturally while VIRQA evaluates your tone, confidence, and clarity in real-time.",
  },
  {
    icon: LineChart,
    title: "Get Instant Feedback",
    desc: "Receive AI-generated reports with insights and improvement recommendations.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 px-6 sm:px-8 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            How It Works
          </h2>
          <p className="mt-4 text-gray-400 text-base sm:text-lg">
            Experience intelligent interviews in just 3 seamless steps
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-16 md:gap-8">
          {/* Connector line (visible and elegant) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-linear-to-r from-gray-700 via-gray-600 to-gray-700 opacity-60 -z-10"></div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                className="relative flex flex-col items-center text-center md:text-left bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.3)] p-8 hover:shadow-[0_0_40px_rgba(79,70,229,0.2)] hover:-translate-y-2 transition-all duration-500"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Step Number or Icon */}
                <motion.div
                  className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Icon className="w-7 h-7" />
                </motion.div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  {step.desc}
                </p>

                {/* Step indicator for mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden w-px h-16 bg-linear-to-b from-gray-600 to-gray-800 mt-8"></div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating glow background */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none -z-10 animate-float-slow"></div>

      {/* Local animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 6s ease infinite;
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
