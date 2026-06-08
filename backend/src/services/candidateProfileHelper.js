/**
 * candidateProfileHelper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: candidate profile formatting, skills/education parsing,
 * document management, and resume extraction.
 *
 * Eliminates the duplicated response shape between getProfile and handleProfile.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { uploadDocument, safeDeleteFromCloudinary } from "./cloudinaryHelper.js";

/**
 * Format a candidate user document into the standard API response shape.
 *
 * @param {object} user  Mongoose Candidate document.
 * @returns {object} Formatted profile object.
 */
export function formatCandidateProfile(user) {
  return {
    name:         user.fullName || "",
    email:        user.email,
    phone:        user.phoneNumber || "",
    location:     user.location || "",
    jobTitle:     user.jobTitle || "",
    experience:   user.experience || "",
    educations:   user.educations || [],
    documents:    user.documents || [],
    bio:          user.professionalBio || "",
    skills:       user.skills || [],
    profilePhoto: user.profilePhoto || null,
  };
}

/**
 * Parse skills and education arrays from raw JSON strings.
 * Gracefully handles invalid JSON by returning empty arrays.
 *
 * @param {string|null} skillsRaw     JSON string of skills array.
 * @param {string|null} educationsRaw JSON string of educations array.
 * @returns {{skills: Array, educations: Array}}
 */
export function parseSkillsAndEducation(skillsRaw = null, educationsRaw = null) {
  let skills = [];
  let educations = [];

  if (skillsRaw) {
    try { skills = JSON.parse(skillsRaw); } catch { skills = []; }
  }
  if (educationsRaw) {
    try { educations = JSON.parse(educationsRaw); } catch { educations = []; }
  }

  return { skills, educations };
}

/**
 * Process document uploads: sync existing docs, upload new ones, clean up removed ones.
 *
 * @param {Array} reqExistingDocs  Document metadata from the request (with isNew flags).
 * @param {Array} uploadedFiles    Multer file objects for newly uploaded documents.
 * @param {Array} oldDocuments     Previous document array from the database.
 * @param {string} folder          Cloudinary folder for uploads.
 * @returns {Promise<Array>} Final documents array with URLs.
 */
export async function processDocumentUploads(reqExistingDocs, uploadedFiles, oldDocuments, folder = "candidates/documents") {
  const finalDocuments = [];
  let uploadIndex = 0;

  // Reconstruct: upload new files, retain existing
  for (const docInfo of reqExistingDocs) {
    if (docInfo.isNew) {
      const file = uploadedFiles[uploadIndex++];
      if (file) {
        const url = await uploadDocument(file.path, folder);
        if (!url) {
          throw new Error(`Failed to upload document "${docInfo.name}".`);
        }
        finalDocuments.push({ id: docInfo.id, name: docInfo.name, size: docInfo.size, url });
      }
    } else {
      finalDocuments.push({ id: docInfo.id, name: docInfo.name, size: docInfo.size, url: docInfo.url });
    }
  }

  // Clean up removed documents from Cloudinary
  const currentUrls = finalDocuments.map(d => d.url).filter(Boolean);
  for (const oldDoc of oldDocuments) {
    if (oldDoc.url && !currentUrls.includes(oldDoc.url)) {
      await safeDeleteFromCloudinary(oldDoc.url);
    }
  }

  return finalDocuments;
}

/**
 * Find and parse a resume PDF from the candidate's document list.
 *
 * @param {Array} documents  Array of { name, url } document objects.
 * @returns {Promise<string|null>} Extracted resume text, or null.
 */
export async function parseResumeFromDocuments(documents) {
  if (!Array.isArray(documents) || documents.length === 0) return null;

  const resumeDoc = documents.find(d =>
    d.url && d.url.endsWith(".pdf") &&
    (d.name.toLowerCase().includes("resume") || d.name.toLowerCase().includes("cv"))
  ) || documents.find(d => d.url && d.url.endsWith(".pdf"));

  if (!resumeDoc) return null;

  try {
    const { parsePdfFromUrl } = await import("../utils/pdfParser.js");
    return await parsePdfFromUrl(resumeDoc.url);
  } catch (err) {
    console.error("Resume parsing failed:", err.message);
    return null;
  }
}
