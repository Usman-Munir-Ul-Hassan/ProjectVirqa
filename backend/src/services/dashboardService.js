/**
 * dashboardService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: employee dashboard data computation.
 *
 * Extracted from employee.controller.js getDashboardData handler.
 * Pure data transformation functions — no DB queries, no side effects.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Chart color palettes (matching original implementation)
const BG_COLORS = [
  "rgba(54, 162, 235, 0.6)",
  "rgba(75, 192, 192, 0.6)",
  "rgba(255, 205, 86, 0.6)",
  "rgba(255, 99, 132, 0.6)",
  "rgba(153, 102, 255, 0.6)",
  "rgba(255, 159, 64, 0.6)",
  "rgba(201, 203, 207, 0.6)",
];
const BORDER_COLORS = [
  "rgb(54, 162, 235)",
  "rgb(75, 192, 192)",
  "rgb(255, 205, 86)",
  "rgb(255, 99, 132)",
  "rgb(153, 102, 255)",
  "rgb(255, 159, 64)",
  "rgb(201, 203, 207)",
];

/**
 * Build a flat candidate list from aggregated interview data.
 * Each candidate entry includes status derived from report + interview state.
 *
 * @param {Array} interviews  Aggregated interview documents with candidateUsers and reports.
 * @returns {Array} Flat array of candidate objects.
 */
export function buildCandidateList(interviews) {
  const candidates = [];

  for (const interview of interviews) {
    for (const candidate of interview.candidateUsers || []) {
      const report = (interview.reports || []).find(
        (r) => r.candidate && r.candidate.toString() === candidate._id.toString()
      );

      let status;
      if (report?.gradingStatus === "completed") {
        status = "Completed";
      } else if (report?.gradingStatus === "pending") {
        status = "In Progress";
      } else if (interview.status === "Ongoing") {
        status = "In Progress";
      } else if (interview.status === "Cancelled") {
        status = "Cancelled";
      } else if (interview.status === "Completed") {
        status = "In Progress";
      } else {
        status = "Pending";
      }

      candidates.push({
        id: candidate._id,
        interviewId: interview._id,
        name: candidate.fullName || candidate.email?.split("@")[0] || "Unknown",
        email: candidate.email,
        role: interview.jobTitle,
        score: report?.gradingStatus === "completed" ? report.overallScore : null,
        status,
        date: interview.startAt
          ? new Date(interview.startAt).toISOString().split("T")[0]
          : new Date(interview.createdAt).toISOString().split("T")[0],
      });
    }
  }

  return candidates;
}

/**
 * Compute status counts from a candidate list.
 *
 * @param {Array} candidates  Flat candidate list from buildCandidateList.
 * @returns {{All: number, Completed: number, "In Progress": number, Pending: number}}
 */
export function computeStatusCounts(candidates) {
  return {
    All: candidates.length,
    Completed: candidates.filter((c) => c.status === "Completed").length,
    "In Progress": candidates.filter((c) => c.status === "In Progress").length,
    Pending: candidates.filter((c) => c.status === "Pending").length,
  };
}

/**
 * Build chart.js dataset: average score per job title from graded interviews.
 *
 * @param {Array} interviews  Aggregated interview documents with reports.
 * @returns {object} Chart.js-compatible dataset { labels, datasets }.
 */
export function buildChartData(interviews) {
  const scoreByRole = {};

  for (const interview of interviews) {
    const scoredReports = (interview.reports || []).filter(
      (r) => r.gradingStatus === "completed" && typeof r.overallScore === "number"
    );
    if (scoredReports.length === 0) continue;

    const role = interview.jobTitle || "Other";
    if (!scoreByRole[role]) {
      scoreByRole[role] = { total: 0, count: 0 };
    }
    const avgForInterview = scoredReports.reduce((sum, r) => sum + r.overallScore, 0) / scoredReports.length;
    scoreByRole[role].total += avgForInterview;
    scoreByRole[role].count += 1;
  }

  const chartLabels = Object.keys(scoreByRole);
  const chartValues = chartLabels.map((role) => Math.round(scoreByRole[role].total / scoreByRole[role].count));

  return {
    labels: chartLabels.length > 0 ? chartLabels : ["No Data"],
    datasets: [
      {
        label: "Average Score",
        data: chartValues.length > 0 ? chartValues : [0],
        backgroundColor: chartLabels.map((_, i) => BG_COLORS[i % BG_COLORS.length]),
        borderColor: chartLabels.map((_, i) => BORDER_COLORS[i % BORDER_COLORS.length]),
        borderWidth: 1,
      },
    ],
  };
}
