import { useState } from 'react';
import { Calendar, Clock, Users, Plus, Edit } from 'lucide-react';
import ExtendDeadlineModal from './ExtendDeadlineModal';

const InterviewListView = ({ interviews, onCreateNew, onViewInterview, onExtend }) => {
    const [extendingInterview, setExtendingInterview] = useState(null);

    const getInterviewStatus = (interview) => {
        const now = Date.now();
        const start = new Date(interview.startAt).getTime();
        const deadline = new Date(interview.deadline).getTime();
        const totalCandidates = interview.candidates?.length || 0;
        const takenCount = interview.takenCount || 0;

        // 1. Completed: All candidates have finished their interviews
        if (totalCandidates > 0 && takenCount >= totalCandidates) {
            return 'Completed';
        }

        // 2. Expired: Time has run out
        if (now > deadline) {
            return 'Expired';
        }

        // 3. Live: The interview window is currently open
        if (now >= start && now <= deadline) {
            return 'Live';
        }

        // 4. Upcoming: Starting soon (within 10 minutes)
        if (now < start && now >= (start - 10 * 60 * 1000)) {
            return 'Upcoming';
        }

        // 5. Scheduled: In the future (more than 10 mins away)
        return 'Scheduled';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Upcoming':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Live':
                return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
            case 'Scheduled':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Expired':
                return 'bg-gray-200 text-gray-600 border-gray-300';
            case 'Completed':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="space-y-6">
            {/* Modal for Extension */}
            <ExtendDeadlineModal 
                isOpen={!!extendingInterview}
                onClose={() => setExtendingInterview(null)}
                currentDeadline={extendingInterview?.deadline}
                duration={extendingInterview?.duration}
                onConfirm={(newDeadline) => {
                    onExtend({ id: extendingInterview._id, newDeadline });
                }}
            />

            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Scheduled Interviews</h2>
                    <p className="text-gray-600 mt-1">Manage and create AI-powered interviews</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Interview
                </button>
            </div>

            {/* Interview Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interviews.map((interview) => {
                    const status = getInterviewStatus(interview);
                    const pendingCount = (interview.candidates?.length || 0) - (interview.takenCount || 0);
                    
                    return (
                        <div
                            key={interview._id}
                            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 hover:border-blue-300 overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {interview.jobTitle}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                                        {status}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                    {interview.jobDescription}
                                </p>

                                {/* Interview Details */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span>{formatDate(interview.startAt || interview.startDate)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span>{formatTime(interview.startTime)} • {interview.duration} min</span>
                                    </div>

                                    {interview.deadline && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                                            <Clock className="w-4 h-4" />
                                            <span>Deadline: {formatDate(interview.deadline)}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span>{interview.candidates?.length || 0} Candidates</span>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="text-xs font-semibold text-gray-700">Taken: {interview.takenCount || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                            <span className="text-xs font-semibold text-gray-700">Pending: {pendingCount > 0 ? pendingCount : 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    Created {formatDate(interview.createdAt)}
                                </span>
                                <div className="flex items-center gap-3">
                                    {status === 'Expired' && (
                                        <button
                                            onClick={() => setExtendingInterview(interview)}
                                            className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>Extend</span>
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => onViewInterview(interview)}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InterviewListView;
