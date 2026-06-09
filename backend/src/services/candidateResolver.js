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
    // Brand new candidate — create with temp password (24h expiry)
    tempPassword = generateTempPassword();
    user = await Candidate.create({
      email,
      fullName: fullName || email.split("@")[0],
      contact: contact || "",
      role: "candidate",
      password: tempPassword,
      isActive: true,
      tempPasswordExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    isNew = true;
  } else if (!user.lastLogin) {
    // User was auto-created from a previous invite but never logged in.
    // Regenerate a fresh temp password so they can access the account.
    tempPassword = generateTempPassword();
    user.password = tempPassword;
    user.tempPasswordExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();
    isNew = true; // Treat as new for email template purposes
  }

  return { user, isNew, tempPassword, error: null };
}
