const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all customer routes
router.use(authenticateToken);

// Customer dashboard stats
router.get('/stats', customerController.getCustomerStats);

// Subscription management
router.get('/subscriptions', customerController.getCustomerSubscriptions);
router.post('/subscriptions', customerController.subscribeToPlan);
router.put('/subscriptions/:subscriptionId/cancel', customerController.cancelSubscription);

// Plan browsing
router.get('/plans', customerController.getAvailablePlans);

// Usage analytics
router.get('/usage-analytics', customerController.getUsageAnalytics);

// Billing
router.get('/billing-history', customerController.getBillingHistory);

// Profile management
router.put('/profile', customerController.updateProfile);

module.exports = router;