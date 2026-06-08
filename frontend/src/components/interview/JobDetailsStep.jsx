import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, X, Mail, Plus, Check, Edit } from "lucide-react";
import { toast } from "react-toastify";

const ManualCandidateForm = ({ onAdd }) => {
    const [candidate, setCandidate] = useState({ fullName: "", email: "", contact: "" });

    const handleAdd = () => {
        if (!candidate.email || !/^[\w.%+-]+@gmail\.com$/i.test(candidate.email)) {
            toast.error("Please enter a valid Gmail address");
            return;
        }
        onAdd(candidate);
        setCandidate({ fullName: "", email: "", contact: "" });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
                type="text"
                placeholder="Full Name"
                value={candidate.fullName}
                onChange={(e) => setCandidate({ ...candidate, fullName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <input
                type="email"
                placeholder="Email (Gmail only)"
                value={candidate.email}
                onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Contact (optional)"
                    value={candidate.contact}
                    onChange={(e) => setCandidate({ ...candidate, contact: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <button
                    onClick={handleAdd}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

//flow:Excel file → read → convert to JSON → fix column names → extract data → remove invalid rows → show in UI
const JobDetailsStep = ({ formData, dispatch, onNext }) => {
   const [excelFile, setExcelFile] = useState(null);
   const [candidates, setCandidates] = useState(formData.candidates || []);
   const [editingIndex, setEditingIndex] = useState(null);
   const [editData, setEditData] = useState({ fullName: "", email: "", contact: "" });

   const updateCandidates = (newList) => {
     setCandidates(newList);
     dispatch({ type: 'SET_CANDIDATES', payload: newList });
   };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(fileExtension)) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setExcelFile(file);

    const reader = new FileReader();

    // FileReader runs this when reading is complete
    reader.onload = (event) => {
      const data = event.target.result;

      //  read as ArrayBuffer,Flow: Excel file → Workbook → Sheet → Rows → Data
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert worksheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Normalize data: lowercase keys, remove spaces, and extract needed fields
      const parsedCandidates = jsonData
        .map((row) => {
          const newRow = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.toLowerCase().replace(/\s/g, "");
            newRow[cleanKey] = row[key];
          });

          return {
            fullName: newRow.fullname || newRow.name || "",
            email: newRow.email || "",
            contact: newRow.contact || newRow.phone || newRow.mobile || ""
          };
        })
        // Ignore rows with no email
        .filter((c) => c.email);

      updateCandidates(parsedCandidates);

      toast.success(`Extracted ${parsedCandidates.length} candidates`);
    };

    //  read as ArrayBuffer 
    reader.readAsArrayBuffer(file);
};

    // ================= Remove File =================
    const removeFile = () => {
        setExcelFile(null);
        updateCandidates([]);
    };

    // ================= Next Button =================
    const handleNext = () => {
        if (!formData.jobTitle.trim()) {
            toast.error("Please enter a job title");
            return;
        }

        if (!formData.jobDescription.trim()) {
            toast.error("Please enter a job description");
            return;
        }

        if (candidates.length === 0) {
            toast.error("Please add at least one candidate (Manual or Excel)");
            return;
        }

        // Candidates are already synced via updateCandidates
        onNext();
    };

    return (
        <div className="space-y-6">

            {/* ================= Job Title ================= */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Job Title
                </h2>

                <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) =>
                        dispatch({ type: 'UPDATE_FIELD', field: 'jobTitle', value: e.target.value })
                    }
                    placeholder="e.g., Senior Frontend Developer"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>

            {/* ================= Difficulty Level ================= */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Difficulty Level
                </h2>
                <p className="text-sm text-gray-600 mb-3">Select the difficulty level for the interview questions.</p>
                <select
                    value={formData.difficulty || 'medium'}
                    onChange={(e) =>
                        dispatch({ type: 'UPDATE_FIELD', field: 'difficulty', value: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>

            {/* ================= Job Description ================= */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Job Description
                </h2>

                <textarea
                    value={formData.jobDescription}
                    onChange={(e) =>
                        dispatch({ type: 'UPDATE_FIELD', field: 'jobDescription', value: e.target.value })
                    }
                    placeholder="Paste or write the job description here..."
                    rows="8"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />

                <div className="mt-2 text-sm text-gray-500 text-right">
                    {formData.jobDescription.length} characters
                </div>
            </div>

            {/* ================= Excel Upload ================= */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Upload Candidate Excel File
                </h2>

                <p className="text-sm text-gray-600 mb-4">
                    Excel must contain columns: <b>fullName, email, contact</b>
                </p>

                {!excelFile ? (
                    <div className="space-y-6">
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                <p className="mb-2 text-sm text-gray-600">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    Excel files only (.xlsx, .xls)
                                </p>
                            </div>

                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                            />
                        </label>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">OR Add Manually</span>
                            </div>
                        </div>

                        <ManualCandidateForm onAdd={(candidate) => {
                            updateCandidates([...candidates, candidate]);
                        }} />
                    </div>
                ) : (
                    <div className="space-y-4">

                        {/* Uploaded File Info */}
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {excelFile.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {(excelFile.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={removeFile}
                                className="p-2 hover:bg-green-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ================= Scrollable Candidate List ================= */}
                {candidates.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">
                                    {candidates.length} Candidates Added
                                </h3>
                            </div>
                            {excelFile && (
                                <button 
                                    onClick={() => updateCandidates([])}
                                    className="text-xs text-red-600 hover:underline"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                            {candidates.map((c, index) => (
                                <div
                                    key={index}
                                    className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm flex justify-between items-center group"
                                >
                                    {editingIndex === index ? (
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 mr-4">
                                            <input
                                                type="text"
                                                value={editData.fullName}
                                                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                                                className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                placeholder="Full Name"
                                            />
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                placeholder="Email"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editData.contact}
                                                    onChange={(e) => setEditData({ ...editData, contact: e.target.value })}
                                                    className="flex-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                    placeholder="Contact"
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (!editData.email || !/^[\w.%+-]+@gmail\.com$/i.test(editData.email)) {
                                                            toast.error("Valid Gmail required");
                                                            return;
                                                        }
                                                        const newList = [...candidates];
                                                        newList[index] = editData;
                                                        updateCandidates(newList);
                                                        setEditingIndex(null);
                                                    }}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingIndex(null)}
                                                    className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {c.fullName || "No Name"}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {c.email}
                                                </p>
                                                {c.contact && (
                                                    <p className="text-sm text-gray-500">
                                                        {c.contact}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingIndex(index);
                                                        setEditData({ ...c });
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => updateCandidates(candidates.filter((_, i) => i !== index))}
                                                    className="p-2 text-gray-400 hover:text-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ================= Next Button ================= */}
            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                >
                    Generate AI Prompt →
                </button>
            </div>
        </div>
    );
};

export default JobDetailsStep;