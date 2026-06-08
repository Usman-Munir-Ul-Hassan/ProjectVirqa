import { ArrowLeft, Calendar, Clock, Download, FileText, Award, CheckCircle2, AlertCircle, BarChart3, BrainCircuit, Lightbulb, MessageSquare, Users } from "lucide-react";
import { useCandidateReport } from "../hooks/useCandidateReport";
import { getEvaluationStatus, getPerformanceRating, mapRecommendation } from "../../../../utils/evaluation";
import { getRecommendationColor, getRatingColor, getScoreGradient } from "../utils/statusUtils";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

export const CandidateReportView = ({ interview, candidate, onBack }) => {
  const { data: report, isLoading, error } = useCandidateReport(interview._id, candidate._id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium">Loading comprehensive report for {candidate.fullName}...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium">
          <ArrowLeft size={18} /> Back to candidate list
        </button>
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Clock size={36} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            Report not available
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
            This candidate has not completed the interview yet, or the report could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const isFullyEvaluated = getEvaluationStatus(report);

  if (!isFullyEvaluated) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium">
          <ArrowLeft size={18} /> Back to candidate list
        </button>
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Clock size={36} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            Report is being generated...
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
            The AI is currently evaluating the interview responses. This usually takes a few moments. Please check back shortly.
          </p>
        </div>
      </div>
    );
  }

  const overallScore = report.overallScore ?? 0;
  const recommendation = mapRecommendation(report.recommendation || "N/A");
  const metrics = report.evaluationMetrics || {};
  const questions = report.questions || [];
  const keyStrengths = report.keyStrengths || [];
  const areasForImprovement = report.areasForImprovement || [];

  const performanceRating = getPerformanceRating(overallScore);

  const metricsData = [
    { name: "Technical Accuracy", score: metrics.technicalAccuracy ?? 0 },
    { name: "Communication Skills", score: metrics.communication ?? 0 },
    { name: "Problem Solving", score: metrics.problemSolving ?? 0 },
  ];

  const questionsAnswered = questions.filter(q => q.candidateAnswer && q.candidateAnswer.trim().length > 0).length;
  const averageQuality = overallScore >= 80 ? "High" : overallScore >= 60 ? "Moderate" : "Low";

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto pb-20">
      {/* ── Top Navigation & Actions ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-semibold">
          <ArrowLeft size={18} /> Back to candidate list
        </button>
        {report.pdfUrl && (
          <a
            href={report.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
          >
            <Download size={16} />
            Download PDF Report
          </a>
        )}
      </div>

      {/* ── 1. Candidate Information ── */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 lg:p-10 md:w-2/3 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-bold shadow-md shadow-indigo-100">
              {(candidate.fullName || "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1.5 tracking-tight">{candidate.fullName}</h1>
              <p className="text-slate-500 text-sm mb-4 font-medium">Applied Role: <span className="font-bold text-slate-800">{interview.jobTitle}</span></p>
              
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Calendar size={14} className="text-slate-400"/> {formatDate(interview.startAt || interview.startDate)}
                </span>
                <span className={`px-3 py-1.5 rounded-lg border tracking-wide uppercase ${getRecommendationColor(recommendation)}`}>
                  {recommendation}
                </span>
                <span className={`px-3 py-1.5 rounded-lg border tracking-wide uppercase ${getRatingColor(performanceRating)}`}>
                  {performanceRating} Performance
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-10 md:w-1/3 bg-slate-50 flex items-center justify-center relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getScoreGradient(overallScore)}`}></div>
           <div className="text-center w-full">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Overall Score</p>
             <div className="flex items-end justify-center gap-1">
               <span className="text-6xl font-black text-slate-900 leading-none tracking-tighter">{overallScore}</span>
               <span className="text-xl text-slate-400 font-bold leading-loose mb-1">/100</span>
             </div>
             <div className="w-full bg-slate-200 h-2 rounded-full mt-5 overflow-hidden">
               <div className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(overallScore)} transition-all duration-1000 ease-out`} style={{ width: `${overallScore}%` }}></div>
             </div>
           </div>
        </div>
      </section>

      {/* ── 2. Interview Summary & Overall AI Assessment ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Interview Summary Card */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileText size={120} />
          </div>
          
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 mb-8 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText size={18} className="text-indigo-600" />
            </div>
            Interview Summary
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
              <span className="block text-3xl font-black text-slate-800">{questions.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Asked</span>
            </div>
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 text-center">
              <span className="block text-3xl font-black text-indigo-600">{questionsAnswered}</span>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 block">Answered</span>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
              <span className="block text-xl font-bold text-slate-800 mt-1.5">{averageQuality}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 block">Avg Quality</span>
            </div>
          </div>

          <div className="space-y-8 flex-1 relative z-10">
            <div>
              <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2 mb-4 uppercase tracking-wider">
                <CheckCircle2 size={18} /> Key Strengths
              </h3>
              {keyStrengths.length > 0 ? (
                <ul className="space-y-3">
                  {keyStrengths.map((str, i) => (
                     <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-3 leading-relaxed">
                       <span className="text-emerald-500 mt-1 shadow-sm rounded-full bg-emerald-50"><CheckCircle2 size={14}/></span>
                       {str}
                     </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 italic font-medium">No specific strengths were highlighted by the AI evaluation.</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-4 uppercase tracking-wider">
                <AlertCircle size={18} /> Areas for Improvement
              </h3>
              {areasForImprovement.length > 0 ? (
                <ul className="space-y-3">
                  {areasForImprovement.map((area, i) => (
                    <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-3 leading-relaxed">
                      <span className="text-amber-500 mt-1 shadow-sm rounded-full bg-amber-50"><AlertCircle size={14}/></span>
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <p className="text-sm text-slate-500 italic font-medium">No specific areas for improvement were highlighted.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Overall Assessment Card */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Award size={120} />
          </div>
          
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 mb-8 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Award size={18} className="text-indigo-600" />
            </div>
            Overall AI Assessment
          </h2>
          
          <div className="flex-1 flex flex-col justify-between relative z-10">
            <div className="space-y-8 mb-8">
              {metricsData.map((metric, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-end mb-2.5">
                    <span className="text-sm font-bold text-slate-700">{metric.name}</span>
                    <span className="text-sm font-black text-slate-900">{metric.score}<span className="text-slate-400 font-semibold">/100</span></span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(metric.score)} transition-all duration-1000 ease-out`}
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div>
                  <div className="flex justify-between items-end mb-2.5">
                    <span className="text-sm font-bold text-slate-700">Professionalism</span>
                    <span className="text-sm font-black text-slate-900">{overallScore >= 60 ? Math.min(overallScore + 10, 100) : overallScore}<span className="text-slate-400 font-semibold">/100</span></span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(overallScore >= 60 ? overallScore + 10 : overallScore)} transition-all duration-1000 ease-out`}
                      style={{ width: `${overallScore >= 60 ? Math.min(overallScore + 10, 100) : overallScore}%` }}
                    />
                  </div>
              </div>
            </div>

            <div className="mt-auto bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Hiring Recommendation</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{recommendation}</p>
              </div>
              <div className={`px-5 py-2.5 rounded-xl text-sm font-black tracking-wider uppercase border shadow-sm ${getRecommendationColor(recommendation)}`}>
                {recommendation}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── 3. Question-by-Question Analysis ── */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <MessageSquare size={20} />
           </div>
           <h2 className="text-2xl font-extrabold text-slate-900">
             Question-by-Question Analysis
           </h2>
        </div>

        <div className="space-y-8">
          {questions.length > 0 ? questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-slate-800 text-white text-xs font-black rounded-lg shadow-sm">Q{idx + 1}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Interviewer Asked</span>
                  </div>
                  <p className="text-base md:text-lg font-bold text-slate-900 leading-relaxed max-w-4xl">{q.question}</p>
                </div>
                
                <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-slate-900 leading-none">{q.score}</span>
                      <span className="text-sm font-bold text-slate-400 mb-1">/100</span>
                   </div>
                   <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${getRatingColor(q.rating)}`}>
                      {q.rating}
                   </span>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Users size={16} className="text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Candidate Answer</h4>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 min-h-[160px] shadow-inner">
                    {q.candidateAnswer ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">{q.candidateAnswer}</p>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                         <p className="text-sm text-slate-400 italic font-medium">No answer provided or recorded.</p>
                      </div>
                    )}
                  </div>
                </div>

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
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{q.reason || "No detailed reasoning provided."}</p>
                    </div>
                    
                    {q.suggestion && (
                      <div className="pt-5 border-t border-purple-200/60">
                        <h5 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-2 uppercase tracking-wide">
                          <Lightbulb size={16} className="text-amber-600"/> How to Improve
                        </h5>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{q.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )) : (
             <div className="bg-white p-16 text-center rounded-3xl border border-slate-200 border-dashed">
               <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                  <MessageSquare size={24} className="text-slate-400" />
               </div>
               <p className="text-slate-500 font-bold text-lg">No question-by-question data available.</p>
             </div>
          )}
        </div>
      </section>
    </div>
  );
};
