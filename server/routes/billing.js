const express = require('express');
const {
  getUserInvoices,
  getInvoice,
  downloadInvoicePdf,
  processPayment,
  handlePaymentWebhook,
  updatePaymentMethod,
  getBillingOverview
} = require('../controllers/billingController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.get('/invoices/:userId', protect, getUserInvoices);
router.get('/invoice/:id', protect, getInvoice);
router.get('/invoice/:id/pdf', protect, downloadInvoicePdf);
router.post('/invoice/:id/pay', protect, processPayment);
router.put('/payment-method', protect, updatePaymentMethod);
router.get('/overview/:userId', protect, getBillingOverview);

// Public webhook route
router.post('/webhook', handlePaymentWebhook);

module.exports = router;