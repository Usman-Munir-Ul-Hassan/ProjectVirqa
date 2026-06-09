import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
import { emailTemplateWrapper } from "../constants.js";
const createMailOptions = (from,to, subject, htmlContent ) => {
  return {
    from: `"VIRQA Team" <${from}>`,// sender email with organization name
    to, // receiver email
    subject,//email subject
    html: emailTemplateWrapper
    .replace("{{emailContent}}", htmlContent)
    .replace("{{year}}", new Date().getFullYear()),
  };
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GOOGLE_USER,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
  family: 4, // Force IPv4 - Render doesn't support IPv6
});
// Verify that if the transporter can connect to the mail server
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});
//returns true if email is sent successfully else false
const sendEmail = async (from,to, subject, htmlContent) => {
  const mailOptions = createMailOptions(from,to, subject, htmlContent);
  const info = await transporter.sendMail(mailOptions);//actual sending of the email
  return info.accepted.length > 0;//{accepted: ['user@gmail.com'],rejected: [],messageId: '<abc123@gmail.com>'
};

export default sendEmail;