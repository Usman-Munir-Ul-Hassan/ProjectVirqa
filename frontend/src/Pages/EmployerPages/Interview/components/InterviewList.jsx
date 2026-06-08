import React, { useState } from "react";
import { Search, Filter, Calendar, Clock, Users, ChevronRight } from "lucide-react";
import { getStatusColor } from "../utils/statusUtils";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

export const InterviewList = ({ interviews, onSelectInterview }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openDropdown, setOpenDropdown] = useState(null);

  const statusOptions = ["all", "Scheduled", "Ongoing", "Completed", "Cancelled"];

  const filteredList = interviews.filter((item) => {
    const matchesSearch =
      !search ||
      (item.jobTitle || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.candidates || []).some((c) =>
        (c.fullName || "").toLowerCase().includes(search.toLowerCase())
      );
    const matchesStatus = statusFilter === "all" || item.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-8 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by job title or candidate..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <button
            className="px-6 py-3 border border-slate-200 rounded-xl flex items-center gap-2 text-sm hover:bg-slate-50 transition-colors font-bold text-slate-700 bg-white shadow-sm"
            onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
          >
            <Filter className="w-4 h-4" />
            {statusFilter === "all" ? "All Statuses" : statusFilter}
          </button>
          {openDropdown === "status" && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl text-sm z-20 overflow-hidden py-1">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setOpenDropdown(null); }}
                  className="block w-full px-5 py-3 text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-bold text-slate-700"
                >
                  {status === "all" ? "All Statuses" : status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.map((item) => (
          <div
            key={item._id}
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg cursor-pointer transition-all group flex flex-col justify-between min-h-[200px] relative overflow-hidden"
            onClick={() => onSelectInterview(item)}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight">
                  {item.jobTitle}
                </h3>
              </div>
              <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(item.status)} mb-5`}>
                {item.status}
              </span>
              
              <div className="space-y-2.5 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-400" /> {formatDate(item.startAt || item.startDate)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" /> {item.duration || "N/A"} mins
                </span>
                <span className="flex items-center gap-2">
                  <Users size={16} className="text-emerald-400" /> {item.candidates?.length || 0} candidates
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between relative z-10">
              <span className="text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300">
                View Candidate Cards
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors shadow-sm">
                <ChevronRight size={20} className="text-slate-400 group-hover:text-indigo-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredList.length === 0 && interviews.length > 0 && (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 p-16 text-center bg-white rounded-3xl border border-slate-200 border-dashed mt-6">
          <p className="text-slate-500 font-bold text-xl">No interviews match your filters.</p>
        </div>
      )}
    </>
  );
};
