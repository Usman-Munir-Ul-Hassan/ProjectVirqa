import axios from "axios";
import { emailTemplateWrapper } from "../constants.js";

const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
const MAILJET_SENDER = process.env.MAILJET_SENDER_EMAIL || "contact.usman.munir@gmail.com";

if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
  console.error('MAILJET_API_KEY or MAILJET_SECRET_KEY is not set. Email sending will fail.');
} else {
  console.log('Email service (Mailjet) is ready');
}

const createMailHtml = (htmlContent) =>
  emailTemplateWrapper
    .replace("{{emailContent}}", htmlContent)
    .replace("{{year}}", new Date().getFullYear());

const sendEmail = async (from, to, subject, htmlContent) => {
  if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
    console.error('Mailjet credentials not configured');
    return false;
  }

  try {
    const response = await axios.post(
      "https://api.mailjet.com/v3.1/send",
      {
        Messages: [
          {
            From: { Email: MAILJET_SENDER, Name: "VIRQA Team" },
            To: [{ Email: to }],
            Subject: subject,
            HTMLPart: createMailHtml(htmlContent),
          },
        ],
      },
      {
        auth: {
          username: MAILJET_API_KEY,
          password: MAILJET_SECRET_KEY,
        },
        timeout: 15000,
      }
    );

    const status = response.data?.Messages?.[0]?.Status;
    if (status === "success") {
      console.log('Mailjet email sent to:', to);
      return true;
    }

    const errorMsg = response.data?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || "Unknown error";
    console.error('Mailjet send failed:', errorMsg);
    return false;
  } catch (err) {
    console.error('Mailjet error:', err.response?.data?.ErrorMessage || err.message);
    return false;
  }
};

export default sendEmail;
