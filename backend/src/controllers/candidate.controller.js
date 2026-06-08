import asyncHandler from "../utils/asyncHandler.js";
import { Candidate } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadProfilePhoto } from "../services/cloudinaryHelper.js";
import {
  formatCandidateProfile,
  parseSkillsAndEducation,
  processDocumentUploads,
  parseResumeFromDocuments,
} from "../services/candidateProfileHelper.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET candidate profile
// GET /api/v1/candidate/profile
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await Candidate.findById(req.user._id);
  if (!user) throw new ApiError(404, "Candidate not found");

  return res.status(200).json(
    new ApiResponse(200, formatCandidateProfile(user), "Profile fetched successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// POST update candidate profile
// POST /api/v1/candidate/profile
// ─────────────────────────────────────────────────────────────────────────────
const handleProfile = asyncHandler(async (req, res) => {
  // ── Step 1: Fetch candidate record ──────────────────────────────────────────
  const user = await Candidate.findById(req.user._id);
  if (!user) throw new ApiError(404, "Candidate not found");

  // ── Step 2: Update basic text fields ────────────────────────────────────────
  if (req.body.fullName !== undefined) user.fullName = req.body.fullName;
  if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
  if (req.body.location !== undefined) user.location = req.body.location;
  if (req.body.jobTitle !== undefined) user.jobTitle = req.body.jobTitle;
  if (req.body.experience !== undefined) user.experience = req.body.experience;
  if (req.body.professionalBio !== undefined) user.professionalBio = req.body.professionalBio;

  // ── Step 3: Parse and update skills & education arrays ──────────────────────
  const { skills, educations } = parseSkillsAndEducation(req.body.skills, req.body.educations);
  if (req.body.skills) user.skills = skills;
  if (req.body.educations) user.educations = educations;

  // ── Step 4: Process avatar image (Cloudinary) ───────────────────────────────
  if (req.files?.profilePhoto?.[0]) {
    const url = await uploadProfilePhoto(
      req.files.profilePhoto[0].path,
      "candidates/profilePhotos",
      user.profilePhoto
    );
    if (!url) {
      throw new ApiError(500, "Failed to upload profile photo to Cloudinary. Please check your internet connection.");
    }
    user.profilePhoto = url;
  }

  // ── Step 5: Sync and process documents ──────────────────────────────────────
  let reqExistingDocs = [];
  if (req.body.existingDocuments) {
    try { reqExistingDocs = JSON.parse(req.body.existingDocuments); } catch { reqExistingDocs = []; }
  }

  const uploadedFiles = req.files?.documents || [];
  const oldDocuments = user.documents || [];

  const finalDocuments = await processDocumentUploads(reqExistingDocs, uploadedFiles, oldDocuments);
  user.documents = finalDocuments;

  // ── Step 6: Parse resume if available ───────────────────────────────────────
  const extractedText = await parseResumeFromDocuments(finalDocuments);
  if (extractedText) {
    user.parsedResumeText = extractedText;
  }

  // ── Step 7: Save and respond ────────────────────────────────────────────────
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, formatCandidateProfile(user), "Profile updated successfully!")
  );
});

export { getProfile, handleProfile };
