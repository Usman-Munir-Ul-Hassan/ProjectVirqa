import { Resend } from "resend";
import { emailTemplateWrapper } from "../constants.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const createMailOptions = (from, to, subject, htmlContent) => {
  return {
    from: `"VIRQA Team" <${from}>`,
    to,
    subject,
    html: emailTemplateWrapper
      .replace("{{emailContent}}", htmlContent)
      .replace("{{year}}", new Date().getFullYear()),
  };
};

// Verify env is configured
if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set. Email sending will fail.');
} else {
  console.log('Email service (Resend) is ready');
}

const sendEmail = async (from, to, subject, htmlContent) => {
  const mailOptions = createMailOptions(from, to, subject, htmlContent);
  const { data, error } = await resend.emails.send(mailOptions);
  if (error) {
    console.error('Resend email error:', error);
    throw error;
  }
  return !!data?.id;
};

export default sendEmail;
