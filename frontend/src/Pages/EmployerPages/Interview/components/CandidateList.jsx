import React, { useState } from "react";
import { ArrowLeft, Calendar, Search, Mail, Eye, Download, Users } from "lucide-react";
import { formatInterviewResult } from "../../../../utils/evaluation";
import { getStatusColor, getRatingColor, getRecommendationColor } from "../utils/statusUtils";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

export const CandidateList = ({ interview, onBack, onSelectCandidate }) => {
  const [candidateSearch, setCandidateSearch] = useState("");
  const [scoreRangeFilter, setScoreRangeFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [candidateSort, setCandidateSort] = useState("highest");

  const rawCandidates = interview.candidates || [];
  const allReports = interview.reports || [];
  const allScores = allReports.map(r => r.overallScore).filter(s => s != null);

  const processedCandidates = rawCandidates.map(c => {
    const report = allReports.find(r => r.candidate === c._id);
    const resultFormat = formatInterviewResult(report, allScores);

    return {
      ...c,
      report,
      score: resultFormat.score,
      rating: resultFormat.rating,
      recommendation: resultFormat.recommendation,
      percentile: resultFormat.percentile
    };
  });

  let filteredCandidates = processedCandidates.filter(c => {
    if (candidateSearch && !c.fullName?.toLowerCase().includes(candidateSearch.toLowerCase())) return false;
    if (ratingFilter !== 'all' && c.rating.toLowerCase() !== ratingFilter.toLowerCase()) return false;
    if (scoreRangeFilter !== 'all') {
      if (c.score == null) return false;
      if (scoreRangeFilter === '90-100' && c.score < 90) return false;
      if (scoreRangeFilter === '70-89' && (c.score < 70 || c.score >= 90)) return false;
      if (scoreRangeFilter === '50-69' && (c.score < 50 || c.score >= 70)) return false;
      if (scoreRangeFilter === 'below50' && c.score >= 50) return false;
    }
    return true;
  });

  filteredCandidates.sort((a, b) => {
    if (candidateSort === 'highest') return (b.score || -1) - (a.score || -1);
    if (candidateSort === 'lowest') return (a.score || -1) - (b.score || -1);
    if (candidateSort === 'percentile') return (b.percentile || -1) - (a.percentile || -1);
    return 0;
  });

  return (
    <>
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wide"
      >
        <ArrowLeft size={16} /> Back to All Interviews
      </button>

      {/* ── Header Section ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 lg:p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative z-10">
           <div>
             <p className="text-xs font-black text-indigo-500 mb-3 tracking-widest uppercase bg-indigo-50 inline-block px-3 py-1 rounded-lg">Candidate Pool</p>
             <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">{interview.jobTitle}</h1>
             <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 font-medium">
                  <Calendar size={18} className="text-indigo-400" /> 
                  <span className="font-bold text-slate-800">Created:</span> {formatDate(interview.startAt || interview.startDate)}
                </span>
                <span className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider ${getStatusColor(interview.status)}`}>
                  {interview.status}
                </span>
             </div>
           </div>
           
           <div className="flex items-center gap-4 lg:min-w-[300px]">
              <div className="flex-1 text-center bg-indigo-50 border border-indigo-100 px-6 py-5 rounded-2xl">
                 <p className="text-4xl font-black text-indigo-600 leading-none">{rawCandidates.length}</p>
                 <p className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-widest mt-2">Total Candidates</p>
              </div>
              <div className="flex-1 text-center bg-slate-50 border border-slate-100 px-6 py-5 rounded-2xl">
                 <p className="text-4xl font-black text-slate-700 leading-none">
                   {allScores.length > 0 ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length) : "—"}
                 </p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Avg Score</p>
              </div>
           </div>
        </div>
      </div>

      {/* ── Advanced Filters ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-1/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          <div className="w-full lg:w-auto flex flex-wrap items-center gap-3">
            <select value={scoreRangeFilter} onChange={(e) => setScoreRangeFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-50">
              <option value="all">All Scores</option>
              <option value="90-100">90% - 100%</option>
              <option value="70-89">70% - 89%</option>
              <option value="50-69">50% - 69%</option>
              <option value="below50">Below 50%</option>
            </select>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-50">
              <option value="all">All Ratings</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
            <select value={candidateSort} onChange={(e) => setCandidateSort(e.target.value)} className="px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 outline-none">
              <option value="highest">Sort: Highest Score</option>
              <option value="lowest">Sort: Lowest Score</option>
              <option value="percentile">Sort: Top Percentile</option>
            </select>
          </div>
      </div>

      {/* ── Candidate Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCandidates.length > 0 ? filteredCandidates.map((c, idx) => (
          <div key={c._id || idx} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group relative flex flex-col min-h-[380px]">
            <div className="p-6 pb-0 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center text-xl font-black shadow-sm">
                  {c.profilePhoto ? <img src={c.profilePhoto} alt={c.fullName} className="w-full h-full rounded-2xl object-cover" /> : (c.fullName || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors leading-tight">{c.fullName || "Unknown"}</h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1"><Mail size={12}/> {c.email || "No email"}</p>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center justify-center flex-1">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0">
                  <circle cx="64" cy="64" r="56" strokeWidth="10" fill="transparent" className="text-slate-100" stroke="currentColor" />
                  <circle
                    cx="64" cy="64" r="56" strokeWidth="10" fill="transparent"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - (c.score || 0) / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    className={c.score >= 80 ? 'text-emerald-500' : c.score >= 60 ? 'text-amber-500' : c.score > 0 ? 'text-red-500' : 'text-slate-300'}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="text-center z-10 flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900 leading-none">{c.score != null ? c.score : '—'}</span>
                  {c.score != null && <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Score</span>}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                 {c.percentile != null && (
                   <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg border border-indigo-100 uppercase tracking-wide">
                     {c.percentile}th Percentile
                   </span>
                 )}
                 {c.rating !== 'N/A' && (
                   <span className={`px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wide border ${getRatingColor(c.rating)}`}>
                     {c.rating}
                   </span>
                 )}
              </div>
            </div>

            {c.recommendation !== 'N/A' && (
              <div className={`px-6 py-3 border-y flex items-center justify-between bg-slate-50/50 ${getRecommendationColor(c.recommendation).replace('bg-', 'border-').replace('text-', 'border-')} border-opacity-20`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recommendation</span>
                <span className={`text-sm font-black uppercase tracking-wider ${getRecommendationColor(c.recommendation).split(' ')[1]}`}>{c.recommendation}</span>
              </div>
            )}

            <div className="p-4 grid grid-cols-2 gap-3 bg-white">
               <button
                 onClick={() => onSelectCandidate(c)}
                 disabled={c.score == null}
                 className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
               >
                 <Eye size={14} /> Full Report
               </button>
               <button
                 disabled={c.score == null || !c.report?.pdfUrl}
                 className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                 onClick={() => window.open(c.report?.pdfUrl, '_blank')}
               >
                 <Download size={14} /> Download
               </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
             <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <Users size={32} className="text-slate-300" />
             </div>
             <p className="text-slate-600 font-bold text-xl mb-2">No candidates match filters</p>
             <p className="text-slate-400 font-medium text-sm">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </>
  );
};
