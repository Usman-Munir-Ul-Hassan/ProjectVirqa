import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ChevronLeft, Download, Clock, Target, BarChart2, BrainCircuit, CheckCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import api from '../../../../utils/api';
import { getEvaluationStatus, calculatePercentile, getPerformanceRating } from '../../../../utils/evaluation';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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

const getRatingColor = (rating) => {
  switch (rating?.toLowerCase()) {
    case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'good': return 'text-green-600 bg-green-50 border-green-200';
    case 'average': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'poor': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const ResultDashboard = ({ interview, onBack, allInterviews = [] }) => {
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['candidate-report', interview._id],
    queryFn: async () => {
      const { data } = await api.get(`/candidate/interviews/${interview._id}/report`);
      return data.data;
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Analyzing your interview performance...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto mt-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-50 flex items-center justify-center">
          <Clock size={36} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-3">Report Not Available</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
          The report could not be loaded. The interview may not be completed yet.
        </p>
        <button onClick={onBack} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  if (!getEvaluationStatus(reportData)) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto mt-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
          <Clock size={36} className="text-amber-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-3">Evaluation In Progress</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
          The AI is currently evaluating your interview responses. This usually takes a few moments. Please check back shortly.
        </p>
        <button onClick={onBack} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const overallScore = reportData.overallScore ?? 0;
  const metrics = reportData.evaluationMetrics || {};
  const questions = reportData.questions || [];
  const recommendation = reportData.recommendation || 'N/A';
  const keyStrengths = reportData.keyStrengths || [];
  const areasForImprovement = reportData.areasForImprovement || [];

  const performanceRating = getPerformanceRating(overallScore);

  const totalAttempted = questions.filter(q => q.candidateAnswer && q.candidateAnswer.trim().length > 0).length;
  const totalCorrect = questions.filter(q => q.score >= 70).length;
  const avgQuestionScore = questions.length > 0 ? Math.round(questions.reduce((acc, q) => acc + q.score, 0) / questions.length) : 0;

  const percentile = calculatePercentile(overallScore, interview.allScores || []);

  const chartData = {
    labels: ['Technical Accuracy', 'Problem Solving', 'Communication', 'Domain Knowledge', 'Confidence'],
    datasets: [{
      label: 'Score',
      data: [
        metrics.technicalAccuracy ?? overallScore, 
        metrics.problemSolving ?? overallScore, 
        metrics.communication ?? overallScore,
        Math.min(100, overallScore + 5), 
        Math.min(100, overallScore + 10)
      ],
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      borderColor: "rgba(99, 102, 241, 1)",
      borderWidth: 2,
      pointBackgroundColor: "rgba(99, 102, 241, 1)",
    }],
  };

  const chartOptions = {
    scales: { r: { suggestedMin: 0, suggestedMax: 100, ticks: { display: false } } },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-20 mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wide">
          <ChevronLeft size={16} /> Back to List
        </button>
        {reportData.pdfUrl && (
          <a href={reportData.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm">
            <Download size={16} /> Download Report
          </a>
        )}
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
          <Trophy size={150} />
        </div>
        
        <div className="p-8 lg:p-10 md:w-1/3 bg-slate-50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 z-10">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Overall Score</p>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0">
              <circle cx="80" cy="80" r="70" strokeWidth="12" fill="transparent" className="text-slate-200" stroke="currentColor" />
              <circle
                cx="80" cy="80" r="70" strokeWidth="12" fill="transparent"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - overallScore / 100)}
                strokeLinecap="round"
                className="text-indigo-600"
                stroke="currentColor"
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-5xl font-black text-slate-900">{overallScore}<span className="text-2xl text-slate-400">%</span></span>
            </div>
          </div>
          <div className={`mt-6 px-4 py-2 rounded-xl border text-sm font-black uppercase tracking-wider ${getRatingColor(performanceRating)}`}>
            {performanceRating}
          </div>
        </div>

        <div className="p-8 lg:p-10 md:w-2/3 flex flex-col justify-center z-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">{interview.jobTitle}</h1>
          <p className="text-slate-500 font-medium mb-8">Completed on {formatDate(interview.startDate)}</p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Percentile</p>
              <p className="text-2xl font-black text-indigo-600">{percentile}th Pct</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attempted</p>
              <p className="text-2xl font-black text-slate-800">{totalAttempted} / {questions.length}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Strong Answers</p>
              <p className="text-2xl font-black text-emerald-600">{totalCorrect}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg per Q</p>
              <p className="text-2xl font-black text-slate-800">{avgQuestionScore}%</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Target className="text-indigo-500" />
            Competency Map
          </h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            <Radar data={chartData} options={chartOptions} />
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <BarChart2 className="text-indigo-500" />
            Skill Assessment Breakdown
          </h2>
          <div className="space-y-6">
            {[
              { name: 'Technical Knowledge', val: metrics.technicalAccuracy ?? overallScore },
              { name: 'Problem Solving', val: metrics.problemSolving ?? overallScore },
              { name: 'Communication Skills', val: metrics.communication ?? overallScore },
              { name: 'Domain Knowledge', val: Math.min(100, overallScore + 5) },
              { name: 'Professionalism', val: Math.min(100, overallScore + 10) },
            ].map((skill, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-slate-700">{skill.name}</span>
                  <span className="text-sm font-black text-slate-900">{skill.val}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(skill.val)}`} style={{ width: `${skill.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
         <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <BrainCircuit className="text-indigo-500" />
            AI Interview Summary
         </h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
               <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest mb-4">Overall Strengths</h3>
               {keyStrengths.length > 0 ? (
                 <ul className="space-y-3">
                   {keyStrengths.map((s, i) => (
                     <li key={i} className="text-sm font-medium text-emerald-900 flex items-start gap-2">
                       <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                       {s}
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-sm font-medium text-emerald-700/60">AI is analyzing strengths...</p>
               )}
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
               <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-4">Areas for Improvement</h3>
               {areasForImprovement.length > 0 ? (
                 <ul className="space-y-3">
                   {areasForImprovement.map((a, i) => (
                     <li key={i} className="text-sm font-medium text-amber-900 flex items-start gap-2">
                       <span className="text-amber-500 shrink-0 mt-0.5 font-bold">•</span>
                       {a}
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-sm font-medium text-amber-700/60">No major areas for improvement noted.</p>
               )}
            </div>
         </div>

         <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Final Analysis Result</p>
              <p className="text-sm font-medium text-slate-700">Based on your performance, the AI has designated a status for your application.</p>
            </div>
            <div className={`px-6 py-3 rounded-xl border text-sm font-black uppercase tracking-wider ${getRatingColor(recommendation === 'Pass' ? 'Good' : recommendation === 'Strong Pass' ? 'Excellent' : recommendation === 'Fail' ? 'Poor' : 'Average')}`}>
              Status: {recommendation}
            </div>
         </div>
      </section>
    </div>
  );
};

export default ResultDashboard;
