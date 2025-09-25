const nodemailer = require('nodemailer');

// Create Nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Email Template Types
 */
const EMAIL_TEMPLATES = {
  PAYMENT_REMINDER: {
    subject: 'Payment Reminder - BroadbandX',
    template: (data) => `
      <h2>Payment Reminder</h2>
      <p>Dear ${data.customerName},</p>
      <p>This is a reminder that your payment of $${data.amount} for your BroadbandX subscription is due on ${data.dueDate}.</p>
      <p>Subscription Details:</p>
      <ul>
        <li>Plan: ${data.planName}</li>
        <li>Amount Due: $${data.amount}</li>
        <li>Due Date: ${data.dueDate}</li>
      </ul>
      <p>Please ensure timely payment to avoid any service interruptions.</p>
      <p>You can make the payment by logging into your account at <a href="${process.env.CLIENT_URL}/dashboard">dashboard</a>.</p>
    `,
  },
  SERVICE_UPDATE: {
    subject: 'Service Update - BroadbandX',
    template: (data) => `
      <h2>Service Update</h2>
      <p>Dear ${data.customerName},</p>
      <p>${data.message}</p>
      <p>Date: ${data.date}</p>
      <p>Time: ${data.time}</p>
      ${data.duration ? `<p>Expected Duration: ${data.duration}</p>` : ''}
      <p>We apologize for any inconvenience this may cause.</p>
    `,
  },
  USAGE_ALERT: {
    subject: 'Data Usage Alert - BroadbandX',
    template: (data) => `
      <h2>Data Usage Alert</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your data usage has reached ${data.usagePercentage}% of your monthly limit.</p>
      <p>Usage Details:</p>
      <ul>
        <li>Current Usage: ${data.currentUsage} GB</li>
        <li>Monthly Limit: ${data.monthlyLimit} GB</li>
        <li>Remaining Data: ${data.remainingData} GB</li>
        <li>Days Left in Cycle: ${data.daysLeft}</li>
      </ul>
      <p>You can monitor your usage and upgrade your plan at any time through your <a href="${process.env.CLIENT_URL}/dashboard">dashboard</a>.</p>
    `,
  },
  WELCOME: {
    subject: 'Welcome to BroadbandX!',
    template: (data) => `
      <h2>Welcome to BroadbandX!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Thank you for choosing BroadbandX as your internet service provider. We're excited to have you onboard!</p>
      <p>Your service details:</p>
      <ul>
        <li>Plan: ${data.planName}</li>
        <li>Speed: ${data.speed}</li>
        <li>Monthly Data: ${data.data}</li>
        <li>Installation Date: ${data.installationDate}</li>
      </ul>
      <p>You can access your account dashboard at any time by visiting <a href="${process.env.CLIENT_URL}/dashboard">your dashboard</a>.</p>
    `,
  },
  SUPPORT_TICKET: {
    subject: (ticketNumber) => `Support Ticket Update - ${ticketNumber}`,
    template: (data) => `
      <h2>Support Ticket Update</h2>
      <p>Dear ${data.customerName},</p>
      <p>There has been an update to your support ticket:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
        <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Last Update:</strong> ${data.updateTime}</p>
        ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
      </div>
      <p>You can view the complete ticket details and respond by visiting your <a href="${process.env.CLIENT_URL}/support/ticket/${data.ticketId}">support ticket</a>.</p>
    `,
  },
  FEEDBACK_REQUEST: {
    subject: 'Share Your Experience with BroadbandX',
    template: (data) => `
      <h2>How Are We Doing?</h2>
      <p>Dear ${data.customerName},</p>
      <p>We value your feedback and would love to hear about your experience with BroadbandX. Your insights help us improve our services and better serve our customers.</p>
      <p>Please take a moment to share your thoughts about:</p>
      <ul>
        <li>Internet Speed and Reliability</li>
        <li>Customer Support Experience</li>
        <li>Overall Service Quality</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/feedback" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Submit Your Feedback
        </a>
      </div>
      <p>Your feedback helps us maintain the high standards of service you expect from BroadbandX.</p>
    `,
  },
  FEEDBACK_RESPONSE: {
    subject: 'Response to Your Feedback - BroadbandX',
    template: (data) => `
      <h2>Thank You for Your Feedback</h2>
      <p>Dear ${data.customerName},</p>
      <p>Thank you for taking the time to share your thoughts about our ${data.feedbackType} service. We truly value your feedback and want to address your comments.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Our Response:</strong></p>
        <p>${data.response}</p>
      </div>
      <p>If you have any additional comments or concerns, please don't hesitate to reach out to our support team.</p>
    `,
  },
};

/**
 * Send an email using a template
 * @param {string} to - Recipient email address
 * @param {string} templateName - Name of the template to use
 * @param {Object} data - Data to populate the template
 */
const sendTemplatedEmail = async (to, templateName, data) => {
  if (!EMAIL_TEMPLATES[templateName]) {
    throw new Error(`Template ${templateName} not found`);
  }

  const template = EMAIL_TEMPLATES[templateName];
  const subject = typeof template.subject === 'function' ? template.subject(data.ticketNumber) : template.subject;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: template.template(data),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Utility functions for specific email types
const sendPaymentReminder = async (to, data) => {
  return sendTemplatedEmail(to, 'PAYMENT_REMINDER', data);
};

const sendServiceUpdate = async (to, data) => {
  return sendTemplatedEmail(to, 'SERVICE_UPDATE', data);
};

const sendUsageAlert = async (to, data) => {
  return sendTemplatedEmail(to, 'USAGE_ALERT', data);
};

const sendWelcomeEmail = async (to, data) => {
  return sendTemplatedEmail(to, 'WELCOME', data);
};

const sendTicketUpdate = async (to, data) => {
  return sendTemplatedEmail(to, 'SUPPORT_TICKET', data);
};

const sendFeedbackRequest = async (to, data) => {
  return sendTemplatedEmail(to, 'FEEDBACK_REQUEST', data);
};

const sendFeedbackResponse = async (to, data) => {
  return sendTemplatedEmail(to, 'FEEDBACK_RESPONSE', data);
};

module.exports = {
  sendPaymentReminder,
  sendServiceUpdate,
  sendUsageAlert,
  sendWelcomeEmail,
  sendTicketUpdate,
  sendFeedbackRequest,
  sendFeedbackResponse
};