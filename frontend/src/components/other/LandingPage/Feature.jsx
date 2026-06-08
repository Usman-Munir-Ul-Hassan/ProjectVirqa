
import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

export default function ProblemSolution() {
  const problemPoints = [
    "Static question banks",
    "No real-time voice analysis",
    "Unfair or inconsistent evaluations",
  ];

  const solutionPoints = [
    "Adaptive LLM-based questions",
    "Real-time speech-to-text + tone analysis",
    "Instant AI-generated feedback reports",
  ];

  return (
    <section id="features"
    className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="grid lg:grid-cols-2 gap-8 sm:gap-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          {/* Problem Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-gray-900/40 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/5 shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] transition-all duration-500"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              The Problem with Traditional Interviews
            </h3>

            <ul className="space-y-4">
              {problemPoints.map((p, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 text-sm text-red-400 font-semibold shadow-sm border border-red-500/20">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-base text-gray-300">{p}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solution Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-gray-900/40 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/5 shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-500"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              How VIRQA Solves It
            </h3>

            <ul className="space-y-4">
              {solutionPoints.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mt-0.5 text-sm text-emerald-400 font-semibold shadow-sm border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-base text-gray-300">{s}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Accent Glow */}
      <motion.div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen -z-10"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </section>
  );
}
