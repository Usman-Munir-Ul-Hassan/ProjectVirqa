/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-responsibility: rate-limited email sending for interview invitations.
 *
 * Extracted from interview.controller.js to satisfy SRP and OCP.
 * All email templates and rate-limiting logic lives here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import sendEmail from "../utils/Email.js";

// ── In-memory rate limiter (20 emails per minute) ────────────────────────────
const timestamps = [];
const LIMIT = 20;
const INTERVAL_MS = 60 * 1000;

/**
 * Check whether the rate limiter allows sending.
 */
export function canSendEmail() {
  const now = Date.now();
  while (timestamps.length && now - timestamps[0] > INTERVAL_MS) timestamps.shift();
  return timestamps.length < LIMIT;
}

/**
 * Record that an email was sent (for rate-limit tracking).
 */
export function recordEmailSent() {
  timestamps.push(Date.now());
}

/**
 * Build and send an interview invitation email.
 *
 * @param {string} email        Recipient Gmail address.
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
  let subject, emailBody;

  if (context === "addition") {
    // Being added to an existing interview
    subject = isNew
      ? "VIRQA Interview Invitation – Temporary Password"
      : "VIRQA Interview Invitation";
    emailBody = isNew
      ? `<h3>VIRQA Interview Invitation</h3>
         <p>You have been added as a candidate for an interview.</p>
         <p><strong>Login Email:</strong> ${email}</p>
         <p><strong>Temporary Password:</strong> ${tempPassword}</p>
         <p>Please log in and change your password immediately.</p>`
      : `<h3>VIRQA Interview Invitation</h3>
         <p>You have been added as a candidate for an interview.</p>
         <p><strong>Login Email:</strong> ${email}</p>
         <p>Please use your existing account password to log in.</p>`;
  } else {
    // New interview creation
    subject = isNew
      ? "VIRQA Interview Invitation – Temporary Password"
      : "VIRQA Interview Invitation";
    emailBody = isNew
      ? `<h3>VIRQA Interview Invitation</h3>
         <p>You have been invited for an interview for the position of <b>${jobTitle}</b>.</p>
         <p><strong>Login Email:</strong> ${email}</p>
         <p><strong>Temporary Password:</strong> ${tempPassword}</p>
         <p>Please log in and change your password immediately.</p>`
      : `<h3>VIRQA Interview Invitation</h3>
         <p>You have been invited for an interview for the position of <b>${jobTitle}</b>.</p>
         <p><strong>Login Email:</strong> ${email}</p>
         <p>Please use your existing account password to log in.</p>`;
  }

  try {
    const sent = await sendEmail(process.env.GOOGLE_USER, email, subject, emailBody);
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
