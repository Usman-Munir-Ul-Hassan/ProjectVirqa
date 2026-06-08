/**
 * cloudinaryHelper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: Cloudinary upload + cleanup operations.
 *
 * Eliminates duplication of the upload-and-delete-old pattern shared
 * across candidate and employee controllers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { uploadOnCloudinary } from "../utils/FileUploadCloudinary.js";
import { deleteDataFromCloudinary } from "../utils/FileRemovalCloudinary.js";

/**
 * Upload a profile photo to Cloudinary and delete the old one if it exists.
 *
 * @param {string} filePath   Local path to the uploaded file.
 * @param {string} folder     Cloudinary folder (e.g., "candidates/profilePhotos").
 * @param {string|null} oldUrl  Previous Cloudinary URL to delete.
 * @returns {Promise<string|null>}  New Cloudinary URL, or null on failure.
 */
export async function uploadProfilePhoto(filePath, folder, oldUrl = null) {
  const url = await uploadOnCloudinary(filePath, folder);
  if (!url) return null;

  if (oldUrl) {
    try {
      await deleteDataFromCloudinary(oldUrl);
    } catch (err) {
      console.error("Failed to delete old profile photo:", err.message);
    }
  }

  return url;
}

/**
 * Upload a single document to Cloudinary.
 *
 * @param {string} filePath  Local path to the uploaded file.
 * @param {string} folder    Cloudinary folder (e.g., "candidates/documents").
 * @returns {Promise<string|null>}  Cloudinary URL, or null on failure.
 */
export async function uploadDocument(filePath, folder) {
  return await uploadOnCloudinary(filePath, folder);
}

/**
 * Delete a file from Cloudinary by URL.
 * Silently catches errors (best-effort cleanup).
 *
 * @param {string} url  Cloudinary URL to delete.
 */
export async function safeDeleteFromCloudinary(url) {
  if (!url) return;
  try {
    await deleteDataFromCloudinary(url);
  } catch (err) {
    console.error("Failed to delete from Cloudinary:", err.message);
  }
}
