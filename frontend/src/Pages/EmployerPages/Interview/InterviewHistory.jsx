import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useInterviewHistory } from "./hooks/useInterviewHistory";
import { InterviewList } from "./components/InterviewList";
import { CandidateList } from "./components/CandidateList";
import { CandidateReportView } from "./components/CandidateReportView";

// ── InterviewHistory — 3-level drill-down navigation ─────────────────────────
// Level 1: Interview list  →  Level 2: Candidate list  →  Level 3: Report detail
const InterviewHistory = () => {
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const { data: allInterviews = [], isLoading } = useInterviewHistory();

  // ── Level 3: Candidate Report Detail ──
  if (selectedCandidate && selectedInterview) {
    return (
      <div className="p-4 lg:p-6 lg:px-8 w-full min-h-screen bg-slate-50/50">
        <CandidateReportView
          interview={selectedInterview}
          candidate={selectedCandidate}
          onBack={() => setSelectedCandidate(null)}
        />
      </div>
    );
  }

  // ── Level 2: Candidate List for Selected Interview ──
  if (selectedInterview) {
    return (
      <div className="p-4 lg:p-8 max-w-[1400px] mx-auto min-h-screen">
        <CandidateList
          interview={selectedInterview}
          onBack={() => setSelectedInterview(null)}
          onSelectCandidate={setSelectedCandidate}
        />
      </div>
    );
  }

  // ── Level 1: Interview List (Root View) ──
  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Interviews Dashboard</h1>
        <p className="text-slate-500 font-medium">Select an interview to view detailed candidate analytics and reports.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-slate-500 font-bold">Loading interviews...</p>
        </div>
      ) : (
        <>
          <InterviewList
            interviews={allInterviews}
            onSelectInterview={(item) => setSelectedInterview(item)}
          />
          {allInterviews.length === 0 && (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 border-dashed mt-8">
              <p className="text-slate-500 font-bold text-xl">No interviews created yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterviewHistory;
