import React from "react";
import { useQuery } from "@tanstack/react-query";
import { get } from "../../utils/api"; // assuming a generic get helper

// Fetch leaderboard data
const fetchLeaderboard = async () => {
  const { data } = await get("/api/v1/employee/interview-leaderboard");
  return data.data; // ApiResponse wraps data
};

const Leaderboard = () => {
  const { data: leaderboard, isLoading, error } = useQuery(["leaderboard"], fetchLeaderboard);

  if (isLoading) return <div className="p-4 text-center text-gray-500">Loading leaderboard...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Failed to load leaderboard.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text">
        Interview Leaderboard
      </h1>
      <table className="w-full table-auto border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Score (%)</th>
            <th className="px-4 py-2 text-left">Report</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((item, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2">{item.name}</td>
              <td className="px-4 py-2">{item.role}</td>
              <td className="px-4 py-2 font-medium text-indigo-600">{item.overallScore}%</td>
              <td className="px-4 py-2">
                {item.pdfUrl ? (
                  <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    PDF
                  </a>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
