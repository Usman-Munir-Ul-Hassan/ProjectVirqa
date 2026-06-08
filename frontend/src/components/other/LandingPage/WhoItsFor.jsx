import { motion } from "framer-motion";
import { Users, Briefcase, GraduationCap } from "lucide-react"; // example icons

const audience = [
  {
    icon: Users,
    title: "Job Seekers",
    desc: "Enhance your communication, confidence, and readiness for real-world interviews.",
  },
  {
    icon: Briefcase,
    title: "Employers",
    desc: "Automate voice-based candidate screening with AI-driven evaluations and insights.",
  },
  {
    icon: GraduationCap,
    title: "Students & Trainers",
    desc: "Refine speaking skills and get instant feedback to prepare for academic and professional success.",
  },
];

export default function WhoItsFor() {
  return (
    <section
     id="who-its-for"
      className="py-20 px-6 sm:px-8 overflow-hidden relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            Who It’s For
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-400">
            Designed for every stakeholder
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {audience.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={i}
                className="bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(79,70,229,0.2)]"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ y: -5 }}
              >
                {/* Icon */}
                <motion.div
                  className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-2">
                  {a.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  {a.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Soft Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none -z-10 animate-pulse"></div>
    </section>
  );
}
