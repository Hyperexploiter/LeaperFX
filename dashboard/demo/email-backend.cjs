/**
 * Simple Node.js backend for sending emails via Yahoo SMTP
 * Run this with: node email-backend.js
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Yahoo SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'yahoo',
  host: 'smtp.mail.yahoo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'yourpersonalizednew@yahoo.com',
    pass: 'toyhtjzrtdioijxt'
  }
});

// Test the connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email service connection failed:', error);
  } else {
    console.log('✅ Email service ready to send messages');
  }
});

// Email sending endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, from } = req.body;

    const mailOptions = {
      from: `"Leaper FX Exchange" <yourpersonalizednew@yahoo.com>`,
      to: to,
      subject: subject,
      html: html
    };

    console.log('📧 Sending email to:', to);
    console.log('📋 Subject:', subject);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Email Backend', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Email backend running on http://localhost:${PORT}`);
  console.log(`📧 Ready to send emails via Yahoo SMTP`);
});