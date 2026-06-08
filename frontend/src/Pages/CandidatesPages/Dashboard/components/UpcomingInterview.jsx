'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Mic, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useCandidateInterviews } from '../../../../hooks/useCandidate';

const UpcomingInterview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: interviews = [], isLoading, isError } = useCandidateInterviews();

  const now = new Date();

  const upcoming = interviews.filter((i) => {
    // Exclude terminal states
    if (i.status === 'Completed' || i.status === 'Cancelled') return false;
    // Exclude if candidate already has a report (completed by this candidate)
    if (i.report) return false;
    // Show scheduled interviews or future start times
    const start = i.startAt ? new Date(i.startAt) : null;
    return i.status === 'Scheduled' || (start && start > now);
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Upcoming Interviews
        </h2>
        <p className="text-gray-600">Loading upcoming interviews...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Upcoming Interviews
        </h2>
        <p className="text-red-600">
          Failed to load interviews. Please try again later.
        </p>
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Upcoming Interviews
        </h2>
        <p className="text-gray-500">No upcoming interviews scheduled.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={20} className="text-blue-600" />
        <h2 className="text-base md:text-lg font-semibold text-gray-900">
          Upcoming Interviews
        </h2>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {upcoming.map((interview) => {
          const candidateId = user?._id || user?.id;
          // Check if candidate has already joined (using joinedCandidates from API)
          const isJoined = Array.isArray(interview.joinedCandidates) &&
            interview.joinedCandidates.some((c) => c.toString() === (candidateId || '').toString());

          const interviewStart = interview.startAt ? new Date(interview.startAt) : null;
          const deadline = interview.deadline ? new Date(interview.deadline) : null;
          const hasStarted = interviewStart && interviewStart <= now;
          const pastDeadline = deadline && now > deadline;
          const canJoin = hasStarted && !pastDeadline && !isJoined;

          return (
            <div
              key={interview._id || interview.id}
              className="p-4 border border-gray-100 rounded-lg hover:shadow-sm hover:border-blue-300 transition-all"
            >
              {/* Role & Time */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                  {interview.jobTitle || interview.role}
                </h3>

                <span className="inline-flex items-center gap-1 text-xs md:text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                  <Clock size={12} />
                  {interview.startAt
                    ? new Date(interview.startAt).toLocaleString()
                    : interview.time}
                </span>
              </div>

              {/* Duration + Deadline */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                {interview.duration && (
                  <span>Duration: {interview.duration} min</span>
                )}
                {deadline && (
                  <span className={pastDeadline ? 'text-red-500' : ''}>
                    Deadline: {deadline.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Interviewer + Join button */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <User size={14} />
                  With {interview.employee?.fullName || interview.interviewer}
                </div>

                {isJoined ? (
                  <span className="flex items-center gap-1 text-green-600 text-xs md:text-sm px-3 py-1.5 rounded-lg font-medium bg-green-50">
                    <CheckCircle size={14} />
                    Joined
                  </span>
                ) : pastDeadline ? (
                  <span className="flex items-center gap-1 text-gray-400 text-xs md:text-sm px-3 py-1.5 rounded-lg font-medium bg-gray-50">
                    <XCircle size={14} />
                    Expired
                  </span>
                ) : (
                  <button
                    onClick={() => navigate('/api/v1/candidates/join')}
                    disabled={!canJoin}
                    className={`flex items-center gap-1 bg-green-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 transition ${!canJoin ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Mic size={14} />
                    {canJoin ? 'Join' : 'Not started'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingInterview;
