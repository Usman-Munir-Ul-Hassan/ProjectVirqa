import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BarChart2, Loader2, Trophy } from 'lucide-react';
import { useCandidateResults } from './hooks/useCandidateResults';
import ResultDashboard from './components/ResultDashboard';
import ResultCard from './components/ResultCard';

const Results = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterview, setSelectedInterview] = useState(null);

  const { data: interviews = [], isLoading } = useCandidateResults();

  const filteredInterviews = interviews.filter((iv) =>
    (iv.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedInterview) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans p-4 lg:p-8">
        <ResultDashboard 
          interview={selectedInterview} 
          onBack={() => setSelectedInterview(null)} 
          allInterviews={interviews} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner">
              <Trophy size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assessment Results</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Review your AI-driven performance evaluations</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!isLoading && interviews.length > 0 && (
          <div className="mb-8 relative">
            <input
              type="text"
              placeholder="Search past results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium shadow-sm"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <BarChart2 size={18} />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-bold">Loading results...</p>
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredInterviews.length > 0 ? filteredInterviews.map((interview, index) => (
                <ResultCard key={interview._id} interview={interview} index={index} />
              )) : interviews.length === 0 ? (
                <div className="col-span-full text-center py-32 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-50 flex items-center justify-center">
                    <Trophy size={36} className="text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-bold text-xl mb-2">No results available yet</p>
                  <p className="text-sm font-medium text-slate-400">Complete an interview to see your analytics dashboard here.</p>
                </div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Results;