const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createPaymentIntent,
  handlePaymentSuccess,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod
} = require('../controllers/paymentController');

// All routes require authentication
router.use(authenticateToken);

// Create payment intent
router.post('/create-intent', createPaymentIntent);

// Handle successful payment
router.post('/success', handlePaymentSuccess);

// Payment methods management
router.get('/methods', getPaymentMethods);
router.post('/methods', addPaymentMethod);
router.delete('/methods/:id', deletePaymentMethod);

module.exports = router;