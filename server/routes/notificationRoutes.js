const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  sendPaymentReminder,
  sendServiceUpdate,
  sendUsageAlert,
  sendWelcomeEmail,
  sendTicketUpdateEmail,
} = require('../controllers/notificationController');

// Protect all routes
router.use(protect);

// Payment reminder - Admin only
router.post('/payment-reminder/:userId', authorize('admin'), sendPaymentReminder);

// Service update - Admin only
router.post('/service-update', authorize('admin'), sendServiceUpdate);

// Usage alert - Admin and self
router.post('/usage-alert/:userId', sendUsageAlert);

// Welcome email - Admin only
router.post('/welcome/:userId', authorize('admin'), sendWelcomeEmail);

// Ticket update - Admin and self
router.post('/ticket-update/:ticketId', sendTicketUpdateEmail);

module.exports = router;