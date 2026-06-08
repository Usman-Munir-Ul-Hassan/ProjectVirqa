import React from 'react';
import { Users, BrainCircuit, BarChart3, Lightbulb } from 'lucide-react';
import { getRatingColor } from '../../utils/formatUtils';

const QuestionAnalysisCard = ({ question, candidateAnswer, score, rating, reason, suggestion, index }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-slate-800 text-white text-xs font-black rounded-lg shadow-sm">Q{index + 1}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Interviewer Asked</span>
          </div>
          <p className="text-base md:text-lg font-bold text-slate-900 leading-relaxed max-w-4xl">{question}</p>
        </div>
        
        {/* Score */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-slate-900 leading-none">{score}</span>
              <span className="text-sm font-bold text-slate-400 mb-1">/100</span>
           </div>
           <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${getRatingColor(rating)}`}>
              {rating}
           </span>
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Answer */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Users size={16} className="text-indigo-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Candidate Answer</h4>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 min-h-[160px] shadow-inner">
            {candidateAnswer ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">{candidateAnswer}</p>
            ) : (
              <div className="h-full flex items-center justify-center">
                 <p className="text-sm text-slate-400 italic font-medium">No answer provided or recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Feedback */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
              <BrainCircuit size={16} className="text-purple-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">AI Feedback</h4>
          </div>
          
          <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 space-y-6 shadow-inner">
            <div>
              <h5 className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-2 uppercase tracking-wide">
                <BarChart3 size={16} className="text-purple-600"/> Evaluation Reasoning
              </h5>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{reason || "No detailed reasoning provided."}</p>
            </div>
            
            {suggestion && (
              <div className="pt-5 border-t border-purple-200/60">
                <h5 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-2 uppercase tracking-wide">
                  <Lightbulb size={16} className="text-amber-600"/> How to Improve
                </h5>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{suggestion}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalysisCard;
