import { Resend } from "resend";
import { emailTemplateWrapper } from "../constants.js";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend) {
  console.error('RESEND_API_KEY is not set. Email sending will fail.');
} else {
  console.log('Email service (Resend) is ready');
}

const createMailHtml = (htmlContent) =>
  emailTemplateWrapper
    .replace("{{emailContent}}", htmlContent)
    .replace("{{year}}", new Date().getFullYear());

const sendEmail = async (from, to, subject, htmlContent) => {
  if (!resend) {
    console.error('Resend not initialized — missing RESEND_API_KEY');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "VIRQA Team <onboarding@resend.dev>",
      to,
      subject,
      html: createMailHtml(htmlContent),
    });

    if (error) {
      console.error('Resend API error:', error.message || error);
      return false;
    }

    console.log('Email sent:', data?.id);
    return true;
  } catch (err) {
    console.error('Email send exception:', err.message || err);
    return false;
  }
};

export default sendEmail;
