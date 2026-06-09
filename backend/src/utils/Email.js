import nodemailer from "nodemailer";
import { emailTemplateWrapper } from "../constants.js";

// Configure the transporter. Adjust service or host as needed.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const createMailOptions = (from, to, subject, htmlContent) => ({
  from: `"VIRQA Team" <${from}>`,
  to,
  subject,
  html: emailTemplateWrapper
    .replace("{{emailContent}}", htmlContent)
    .replace("{{year}}", new Date().getFullYear()),
});

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Email credentials are not set. Email sending will fail.');
} else {
  console.log('Email service (Nodemailer) is ready');
}

const sendEmail = async (from, to, subject, htmlContent) => {
  const mailOptions = createMailOptions(from, to, subject, htmlContent);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Nodemailer error:', error);
    throw error;
  }
};

export default sendEmail;
