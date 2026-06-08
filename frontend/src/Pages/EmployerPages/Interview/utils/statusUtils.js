export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed": return "bg-emerald-100 text-emerald-700";
    case "scheduled": return "bg-blue-100 text-blue-700";
    case "ongoing": return "bg-amber-100 text-amber-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

export const getRecommendationColor = (rec) => {
  switch (rec) {
    case "Strong Pass":
    case "Strong Hire": return "bg-emerald-100 text-emerald-700 border-emerald-200 text-emerald-800";
    case "Pass":
    case "Hire": return "bg-green-100 text-green-700 border-green-200 text-green-800";
    case "Borderline":
    case "Consider": return "bg-amber-100 text-amber-700 border-amber-200 text-amber-800";
    case "Fail":
    case "Reject": return "bg-red-100 text-red-700 border-red-200 text-red-800";
    default: return "bg-slate-100 text-slate-700 border-slate-200 text-slate-800";
  }
};

export const getRatingColor = (rating) => {
  switch (rating?.toLowerCase()) {
    case "excellent": return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "good": return "text-green-600 bg-green-50 border-green-200";
    case "average": return "text-amber-600 bg-amber-50 border-amber-200";
    case "poor": return "text-red-600 bg-red-50 border-red-200";
    default: return "text-slate-600 bg-slate-50 border-slate-200";
  }
};

export const getScoreGradient = (score) => {
  if (score >= 80) return "from-emerald-500 to-teal-400";
  if (score >= 60) return "from-amber-500 to-yellow-400";
  return "from-red-500 to-orange-400";
};
