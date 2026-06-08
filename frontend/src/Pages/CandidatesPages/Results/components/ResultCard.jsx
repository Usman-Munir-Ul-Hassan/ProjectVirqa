import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Award, Trophy, Clock } from 'lucide-react';
import { formatInterviewResult } from '../../../../utils/evaluation';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const getScoreColor = (score) => {
  if (score >= 80) return 'from-emerald-500 to-teal-400';
  if (score >= 60) return 'from-amber-500 to-yellow-400';
  return 'from-red-500 to-orange-400';
};

const getScoreText = (score) => {
  if (score >= 80) return 'text-emerald-700';
  if (score >= 60) return 'text-amber-700';
  return 'text-red-700';
};

const getRatingColor = (rating) => {
  switch (rating?.toLowerCase()) {
    case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'good': return 'text-green-600 bg-green-50 border-green-200';
    case 'average': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'poor': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const ResultCard = ({ interview, index }) => {
  const resultFormat = formatInterviewResult(interview.report, interview.allScores || []);
  const score = resultFormat.score;
  const hasScore = score != null;
  const companyName = interview.employee?.organization || 'Unknown Company';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col relative group"
    >
      {/* Top Decorative Gradient */}
      <div className={`h-3 w-full absolute top-0 left-0 bg-gradient-to-r ${hasScore ? getScoreColor(score) : 'from-slate-200 to-slate-300'}`}></div>
      
      <div className="p-8 flex-1 flex flex-col z-10 relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1.5">{companyName}</p>
            <h3 className="font-extrabold text-slate-900 text-2xl leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{interview.jobTitle}</h3>
            <p className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
              <Calendar size={14} className="text-slate-300" /> {formatDate(interview.startDate)}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
             <Award size={24} className={hasScore ? getScoreText(score) : 'text-slate-300'} />
          </div>
        </div>

        {hasScore ? (
          <div className="mt-auto bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-100 shadow-inner flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Final Score</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-4xl font-black text-slate-900 leading-none tracking-tighter">{score}</span>
                <span className="text-lg font-black text-slate-400">%</span>
              </div>
            </div>
            
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-5">
               <div 
                 className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(score)}`} 
                 style={{ width: `${score}%` }}
               ></div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 text-xs font-black rounded-xl uppercase tracking-wider border shadow-sm ${getRatingColor(resultFormat.rating)}`}>
                {resultFormat.rating}
              </span>
              {resultFormat.percentile != null && (
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl border border-indigo-100 uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Trophy size={12}/> {resultFormat.percentile}th Percentile
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-auto bg-amber-50/50 rounded-2xl p-6 border border-amber-100/50 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-3">
              <Clock size={20} className="animate-pulse" />
            </div>
            <p className="text-sm font-black text-amber-800 uppercase tracking-widest mb-1">Evaluating</p>
            <p className="text-xs font-medium text-amber-700/70">Your AI interview is being analyzed.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResultCard;
