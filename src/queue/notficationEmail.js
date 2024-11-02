import nodemailer from 'nodemailer'
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or use SMTP
    auth: {
      user: process.env.EMAIL_USERNAME, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
    },
  });

async function sendEmail(to, subject, text) {
    const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to,
    subject,
    text,
    };

    await transporter.sendMail(mailOptions);
}

export {sendEmail}
  