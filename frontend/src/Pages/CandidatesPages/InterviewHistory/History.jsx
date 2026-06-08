import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Eye, Calendar, Clock, Loader2, Target, BarChart2, Filter, Search, Award
} from 'lucide-react';
import ResultDashboard from '../Results/components/ResultDashboard';
import api from '../../../utils/api';
import { calculatePercentile } from '../../../utils/evaluation';
// import { useNavigate } from 'react-router-dom'; // navigation removed

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-emerald-100 text-emerald-700';
    case 'scheduled': return 'bg-blue-100 text-blue-700';
    case 'ongoing': return 'bg-amber-100 text-amber-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getRatingColor = (rating) => {
  switch (rating?.toLowerCase()) {
    case 'excellent': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'good': return 'text-green-700 bg-green-50 border-green-200';
    case 'average': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'poor': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-slate-500 bg-slate-50 border-slate-200';
  }
};

const History = () => {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterRating, setFilterRating] = useState('All');
  const [filterScoreRange, setFilterScoreRange] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedInterview, setSelectedInterview] = useState(null);

  const { data: rawInterviews = [], isLoading, error } = useQuery({
    queryKey: ['candidate-interviews'],
    queryFn: async () => {
      const { data } = await api.get('/candidate/interviews');
      return data.data || [];
    },
  });

  const processedData = useMemo(() => {
    const allScores = rawInterviews.map(iv => iv.report?.overallScore).filter(s => s != null);

    return rawInterviews.map(iv => {
      const score = iv.report?.overallScore;
      let rating = 'N/A';
      if (score != null) {
        if (score >= 85) rating = 'Excellent';
        else if (score >= 70) rating = 'Good';
        else if (score >= 50) rating = 'Average';
        else rating = 'Poor';
      }

      return {
        ...iv,
        score,
        rating,
        percentile: score != null ? calculatePercentile(score, allScores) : null,
      };
    });
  }, [rawInterviews]);

  const uniqueRoles = ['All', ...new Set(processedData.map(i => i.jobTitle))];
  const ratings = ['All', 'Excellent', 'Good', 'Average', 'Poor'];
  const scoreRanges = ['All', '90-100', '70-89', '50-69', 'Below 50'];

  const filteredAndSortedData = useMemo(() => {
    let data = [...processedData];

    if (search.trim()) {
      data = data.filter(i => i.jobTitle?.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterRole !== 'All') {
      data = data.filter(i => i.jobTitle === filterRole);
    }
    if (filterRating !== 'All') {
      data = data.filter(i => i.rating === filterRating);
    }
    if (filterScoreRange !== 'All') {
      data = data.filter(i => {
        if (i.score == null) return false;
        if (filterScoreRange === '90-100') return i.score >= 90;
        if (filterScoreRange === '70-89') return i.score >= 70 && i.score < 90;
        if (filterScoreRange === '50-69') return i.score >= 50 && i.score < 70;
        if (filterScoreRange === 'Below 50') return i.score < 50;
        return true;
      });
    }

    data.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.startDate) - new Date(a.startDate);
      if (sortBy === 'oldest') return new Date(a.startDate) - new Date(b.startDate);
      if (sortBy === 'highestScore') return (b.score || -1) - (a.score || -1);
      if (sortBy === 'lowestScore') return (a.score || -1) - (b.score || -1);
      return 0;
    });

    return data;
  }, [processedData, search, filterRole, filterRating, filterScoreRange, sortBy]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Interview History</h1>
          <p className="text-slate-500 font-medium">Review your past interviews, scores, and access full evaluation reports.</p>
        </div>

        {/* ── Filters Section ── */}
        {!selectedInterview && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
            <div className="relative w-full lg:w-1/3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
            <div className="w-full lg:w-auto flex flex-wrap items-center gap-3">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestScore">Highest Score</option>
                <option value="lowestScore">Lowest Score</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Filters:</span>
            </div>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none hover:bg-slate-50">
              {uniqueRoles.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>)}
            </select>
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none hover:bg-slate-50">
              {ratings.map(r => <option key={r} value={r}>{r === 'All' ? 'All Ratings' : r}</option>)}
            </select>
            <select value={filterScoreRange} onChange={(e) => setFilterScoreRange(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none hover:bg-slate-50">
              {scoreRanges.map(r => <option key={r} value={r}>{r === 'All' ? 'All Score Ranges' : r}</option>)}
            </select>
            {(filterRole !== 'All' || filterRating !== 'All' || filterScoreRange !== 'All') && (
              <button onClick={() => { setFilterRole('All'); setFilterRating('All'); setFilterScoreRange('All'); }} className="px-3 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        </div>
        )}

        {/* ── Table Section ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-slate-500 font-bold">Loading history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <p className="text-slate-500 font-medium">Error loading history.</p>
            </div>
          ) : selectedInterview ? (
            <ResultDashboard
              interview={selectedInterview}
              onBack={() => setSelectedInterview(null)}
              allInterviews={processedData}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Name</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Interview Date</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Percentage</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Percentile</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rating</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedData.length > 0 ? filteredAndSortedData.map((iv) => (
                    <tr key={iv._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                            <Target size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{iv.jobTitle}</p>
                            <p className="text-xs text-slate-500 font-medium">{iv.employee?.fullName ? `with ${iv.employee.fullName}` : 'Automated'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> {formatDate(iv.startDate).split(',')[0]}</span>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><Clock size={12} className="text-slate-400"/> {formatDate(iv.startDate).split(',')[1]}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        {iv.score != null ? (
                          <span className="text-lg font-black text-slate-800">{iv.score}<span className="text-xs text-slate-400 ml-0.5">%</span></span>
                        ) : <span className="text-sm text-slate-400 font-medium">—</span>}
                      </td>
                      <td className="py-5 px-6 text-center">
                         {iv.percentile != null ? (
                           <div className="inline-flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Top</span>
                             <span className="text-sm font-black text-indigo-600">{100 - iv.percentile}%</span>
                           </div>
                         ) : <span className="text-sm text-slate-400 font-medium">—</span>}
                      </td>
                      <td className="py-5 px-6 text-center">
                        {iv.rating !== 'N/A' ? (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${getRatingColor(iv.rating)}`}>
                            {iv.rating}
                          </span>
                        ) : <span className="text-sm text-slate-400 font-medium">—</span>}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(iv.status)}`}>
                          {iv.status}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <button
                          onClick={() => setSelectedInterview(iv)}
                          disabled={iv.status !== 'Completed' && iv.status !== 'completed'}
                          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 border rounded-xl text-sm font-bold transition-all shadow-sm ${
                            iv.status === 'Completed' || iv.status === 'completed'
                            ? 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md'
                            : 'bg-slate-50 border-transparent text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Eye size={16} /> View Report
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="py-20 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                           <BarChart2 size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-600 font-bold text-xl mb-2">No history found</p>
                        <p className="text-sm text-slate-400 font-medium">Try adjusting your filters or search terms.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;