/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: rate-limited email sending for interview invitations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import sendEmail from "../utils/Email.js";
import { newCandidateInvitation, existingCandidateInvitation } from "./emailTemplates.js";

// ── In-memory rate limiter (20 emails per minute) ────────────────────────────
const timestamps = [];
const LIMIT = 20;
const INTERVAL_MS = 60 * 1000;

export function canSendEmail() {
  const now = Date.now();
  while (timestamps.length && now - timestamps[0] > INTERVAL_MS) timestamps.shift();
  return timestamps.length < LIMIT;
}

export function recordEmailSent() {
  timestamps.push(Date.now());
}

/**
 * Build and send an interview invitation email.
 *
 * @param {string} email        Recipient email address.
 * @param {string} jobTitle     Interview job title.
 * @param {string|null} tempPassword  Temporary password (null for existing users).
 * @param {"invitation"|"addition"} context  Whether this is a new invitation or being added.
 * @returns {Promise<{success: boolean, reason?: string}>}
 */
export async function sendInvitationEmail(email, jobTitle, tempPassword = null, context = "invitation") {
  if (!canSendEmail()) {
    return { success: false, reason: "Rate limit exceeded" };
  }

  const isNew = tempPassword !== null;
  const template = isNew
    ? newCandidateInvitation(email, jobTitle, tempPassword)
    : existingCandidateInvitation(email, jobTitle);

  try {
    const sent = await sendEmail(process.env.MAILJET_SENDER_EMAIL, email, template.subject, template.body);
    if (sent) {
      recordEmailSent();
      return { success: true };
    }
    return { success: false, reason: "Email send failed" };
  } catch (err) {
    console.error('Email service error:', err.message || err);
    return { success: false, reason: "Email send error" };
  }
}
