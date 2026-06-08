import { useState, useReducer } from 'react';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import StepIndicator from '../../../components/interview/StepIndicator';
import JobDetailsStep from '../../../components/interview/JobDetailsStep';
import AIPromptStep from '../../../components/interview/AIPromptStep';
import SchedulingStep from '../../../components/interview/SchedulingStep';
import InterviewListView from '../../../components/interview/InterviewListView';
import EmptyInterviewState from '../../../components/interview/EmptyInterviewState';

// Custom Hooks & Reducers
import { useInterviews } from '../../../hooks/useInterviews';
import { interviewReducer, initialFormState } from '../../../reducers/interviewReducer';

const CreateInterviewForm = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
  const [currentStep, setCurrentStep] = useState(0);
  const [editingInterview, setEditingInterview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // 1. Use Custom CRUD Hook
  const {
    interviews,
    isLoading,
    createInterview,
    extendInterview,
    addCandidates
  } = useInterviews();

  // 2. Use useReducer for Form State
  const [formData, dispatch] = useReducer(interviewReducer, initialFormState);

  const steps = [
    { title: 'Job Details', subtitle: 'Title & Description' },
    { title: 'AI Prompt', subtitle: 'Generate & Review' },
    { title: 'Schedule', subtitle: 'Date & Time' }
  ];

  const handleCreateNew = () => {
    setEditingInterview(null);
    dispatch({ type: 'RESET_FORM' });
    setCurrentStep(0);
    setCurrentView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewInterview = (interview) => {
    setEditingInterview(interview);
    dispatch({
      type: 'SET_EDIT_DATA',
      payload: {
        jobTitle: interview.jobTitle,
        jobDescription: interview.jobDescription,
        candidates: interview.candidates || [],
        aiPrompt: interview.aiPrompt,
        startDate: interview.startDate?.split('T')[0] || '',
        startTime: interview.startTime || '',
        duration: interview.duration?.toString() || '60',
        timezone: interview.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        difficulty: interview.difficulty || 'medium'
      }
    });
    setCurrentStep(0);
    setCurrentView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingInterview(null);
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (finalData) => {
    // Prevent duplicate submissions while a request is in progress
    if (isCreating) return;
    setIsCreating(true);
    createInterview(finalData, {
      onSuccess: () => {
        // Reset form and go back to list view
        dispatch({ type: 'RESET_FORM' });
        setCurrentView('list');
        setCurrentStep(0);
        setIsCreating(false);
      },
      onError: (err) => {
        toast.error(err?.message || 'Failed to create interview');
        setIsCreating(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-8xl mx-auto">
        {currentView === 'list' ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
              <p className="text-gray-600 mt-2">
                Create and manage AI-powered interviews
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : interviews.length > 0 ? (
              <InterviewListView
                interviews={interviews}
                onCreateNew={handleCreateNew}
                onViewInterview={handleViewInterview}
                onExtend={extendInterview}
              />
            ) : (
              <EmptyInterviewState onCreateNew={handleCreateNew} />
            )}
          </>
        ) : (
          <>
            <div className="mb-8">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Interviews</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {editingInterview ? 'Edit Interview' : 'Create a New Interview'}
              </h1>
              <p className="text-gray-600 mt-2">
                {editingInterview ? 'Update your interview settings' : 'Follow the steps below to set up your AI-powered interview'}
              </p>
            </div>

            {editingInterview ? (
              <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
                <h2 className="text-xl font-semibold mb-6">Manage Interview: {editingInterview.jobTitle}</h2>

                <div className="space-y-6">
                  <div className="border p-4 rounded-lg bg-gray-50">
                    <h3 className="font-medium text-gray-800 mb-2">Extend Deadline</h3>
                    <p className="text-sm text-gray-600 mb-4">Set a specific expiry date or quickly add more time.</p>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const newDeadline = e.target.newDeadline.value;
                        if (newDeadline) {
                          extendInterview({ id: editingInterview._id, newDeadline });
                          e.target.reset();
                        }
                      }}
                      className="flex gap-2 mb-3"
                    >
                      <input
                        name="newDeadline"
                        type="datetime-local"
                        required
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Set Date
                      </button>
                    </form>

                    <div className="flex gap-2">
                      <span className="text-sm text-gray-500 self-center mr-2">Or add:</span>
                      <button
                        onClick={() => { extendInterview({ id: editingInterview._id, minutes: 30 }) }}
                        className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-medium text-sm"
                      >
                        +30 Minutes
                      </button>
                      <button
                        onClick={() => { extendInterview({ id: editingInterview._id, minutes: 60 }) }}
                        className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-medium text-sm"
                      >
                        +1 Hour
                      </button>
                    </div>
                  </div>

                  <div className="border p-4 rounded-lg bg-gray-50">
                    <h3 className="font-medium text-gray-800 mb-2">Add Candidate</h3>
                    <p className="text-sm text-gray-600 mb-4">Invite another candidate to this interview via email.</p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const email = e.target.email.value;
                        if (email) {
                          addCandidates({ id: editingInterview._id, candidateEmails: [email] });
                          e.target.reset();
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        name="email"
                        type="email"
                        placeholder="candidate@gmail.com"
                        required
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Invite
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <StepIndicator currentStep={currentStep} steps={steps} />

                <div className="transition-all duration-300">
                  {currentStep === 0 && (
                    <JobDetailsStep
                      formData={formData}
                      dispatch={dispatch}
                      onNext={handleNext}
                    />
                  )}

                  {currentStep === 1 && (
                    <AIPromptStep
                      formData={formData}
                      setFormData={(data) => dispatch({ type: 'UPDATE_MULTIPLE', payload: data })}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}

                  {currentStep === 2 && (
                    <SchedulingStep
                      formData={formData}
                      dispatch={dispatch}
                      onBack={handleBack}
                      onSubmit={handleSubmit}
                      isCreating={isCreating}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CreateInterviewForm;
