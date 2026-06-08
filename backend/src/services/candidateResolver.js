/**
 * candidateResolver.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: find or create a candidate user by Gmail address.
 *
 * Eliminates duplication between createInterview and addCandidatesToInterview,
 * which both contained identical "find-or-create candidate" blocks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Candidate, User } from "../models/user.model.js";
import { generateTempPassword } from "../utils/tempPassword.js";

/**
 * Validate a Gmail address format.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isValidGmail(email) {
  return /^[\w.%+-]+@gmail\.com$/i.test(email);
}

/**
 * Resolve or create a candidate user by email.
 *
 * @param {string} email         Gmail address.
 * @param {string} fullName      Display name (used only when creating).
 * @param {string} [contact]     Phone/contact info (used only when creating).
 * @param {string} requesterId   The ID of the user making the request (prevents self-add).
 *
 * @returns {Promise<{user: object|null, isNew: boolean, tempPassword: string|null, error: string|null}>}
 */
export async function resolveOrCreateCandidate(email, fullName, contact = "", requesterId = null) {
  if (!isValidGmail(email)) {
    return { user: null, isNew: false, tempPassword: null, error: "Invalid Gmail address" };
  }

  let user = await User.findOne({ email });

  // Prevent adding yourself
  if (user && requesterId && user._id.equals(requesterId)) {
    return { user: null, isNew: false, tempPassword: null, error: "Cannot add yourself as a candidate" };
  }

  let isNew = false;
  let tempPassword = null;

  if (!user) {
    tempPassword = generateTempPassword();
    user = await Candidate.create({
      email,
      fullName: fullName || email.split("@")[0],
      contact: contact || "",
      role: "candidate",
      password: tempPassword,
      isActive: true,
    });
    isNew = true;
  }

  return { user, isNew, tempPassword, error: null };
}
