/**
 * emailTemplates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Email templates for interview invitations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Invitation email for a new candidate with temporary password.
 */
export function newCandidateInvitation(email, jobTitle, tempPassword) {
  return {
    subject: `VIRQA Interview Invitation – ${jobTitle}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited to an Interview!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">
            You have been invited to participate in a voice interview for the position of 
            <strong>${jobTitle}</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Your Login Credentials</h3>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong>Temporary Password:</strong> <code style="background: #eee; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⚠️ <strong>Important:</strong> This temporary password expires in <strong>24 hours</strong>. 
              Please log in before it expires. You can change your password after logging in.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            If you did not expect this invitation, please disregard this email.
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 15px;">
            © ${new Date().getFullYear()} VIRQA – AI-Powered Voice Interview Platform
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Invitation email for an existing candidate (already has an account).
 */
export function existingCandidateInvitation(email, jobTitle) {
  return {
    subject: `VIRQA Interview Invitation – ${jobTitle}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited to an Interview!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">
            You have been invited to participate in a voice interview for the position of 
            <strong>${jobTitle}</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Your Login</h3>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0;">Use your existing account password to log in.</p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            If you've forgotten your password, use the "Forgot Password" option on the login page.
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 15px;">
            © ${new Date().getFullYear()} VIRQA – AI-Powered Voice Interview Platform
          </p>
        </div>
      </div>
    `,
  };
}
