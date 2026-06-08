import React from 'react';
import { Calendar, Clock, Building, ArrowRight, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCandidateInterviews } from '../../../../hooks/useCandidate';

const ScheduledInterviews = ({ onJoin }) => {
    const { data: rawInterviews, isLoading: loading, error: queryError } = useCandidateInterviews();
    
    const error = queryError ? queryError.response?.data?.message || "Failed to fetch interviews" : null;

    const interviews = React.useMemo(() => {
        if (!rawInterviews) return [];
        
        return rawInterviews.map(interview => {
            // Terminal states — backend status is authoritative
            const backendStatus = interview.status;
            if (backendStatus === "Completed" || backendStatus === "Cancelled") {
                return null;  // will be removed by filter(Boolean)
            }

            // If this candidate already has a report, they've completed their interview
            if (interview.report) {
                return null;  // already completed by this candidate
            }

            // For "Scheduled" / "Ongoing" — apply timestamp logic
            const now = new Date();
            const startAt = new Date(interview.startAt);
            const deadline = new Date(interview.deadline);
            let status = 'upcoming';

            // Allow joining 10 minutes early
            const joinTime = new Date(startAt.getTime() - 10 * 60000);
            if (now >= joinTime && now <= deadline) {
                status = 'ready';
            }

            const companyName = interview.employee?.organization || "Company";
            const interviewerName = interview.employee?.fullName || "Recruiter";

            return {
                id: interview._id,
                role: interview.jobTitle,
                company: companyName,
                interviewer: interviewerName,
                date: new Date(interview.startAt || interview.startDate).toLocaleDateString(),
                time: interview.startTime,
                status: status,
                duration: `${interview.duration} min`,
                raw: interview
            };
        }).filter(Boolean);
    }, [rawInterviews]);


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500 font-medium">Loading your interviews...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="text-center">
                    <p className="text-red-500 font-medium">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-6 font-sans">
            <div className="max-w-8xl mx-auto">

                {/* Header */}
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Scheduled Interviews</h1>
                    <p className="mt-2 text-slate-500">View and join your upcoming technical interview sessions.</p>
                </div>

                {/* Interview List */}
                <div className="space-y-6">
                    {interviews.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                            <p className="text-slate-500">You don't have any upcoming interviews scheduled.</p>
                        </div>
                    ) : (
                        interviews.map((interview, index) => (
                            <motion.div
                                key={interview.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-white rounded-2xl p-6 shadow-sm border ${interview.status === 'ready' ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200'} hover:shadow-md transition-all duration-300`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                                    {/* Left: Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between md:hidden mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${interview.status === 'ready'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {interview.status === 'ready' ? 'Ready to Join' : 'Upcoming'}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900">{interview.role}</h3>

                                        <div className="flex items-center gap-2 mt-1 text-slate-600 font-medium">
                                            <Building size={16} className="text-slate-400" />
                                            {interview.company}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={16} className="text-indigo-500/80" />
                                                {interview.date}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={16} className="text-indigo-500/80" />
                                                {interview.time} ({interview.duration})
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Video size={16} className="text-indigo-500/80" />
                                                With {interview.interviewer}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action */}
                                    <div className="flex flex-col items-center md:items-end gap-3 min-w-[140px]">
                                        <span className={`hidden md:inline-block px-3 py-1 rounded-full text-xs font-medium ${interview.status === 'ready'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {interview.status === 'ready' ? 'Ready to Join' : 'Upcoming'}
                                        </span>

                                        <button
                                            onClick={() => interview.status === 'ready' && onJoin(interview)}
                                            disabled={interview.status !== 'ready'}
                                            className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${interview.status === 'ready'
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 hover:scale-[1.02]'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {interview.status === 'ready' ? 'Join Lobby' : 'Not Started'}
                                            {interview.status === 'ready' && <ArrowRight size={18} />}
                                        </button>
                                    </div>

                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduledInterviews;

