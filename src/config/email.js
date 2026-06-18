const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.warn('E-mail server is not fully configured. E-mails will print to the console instead of sending.', error.message);
  } else {
    console.log('E-mail server is ready to send transational emails.');
  }
});

module.exports = transporter;
