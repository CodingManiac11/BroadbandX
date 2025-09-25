const express = require('express');
const {
  getProfile,
  updateProfile,
  getUserSubscriptions,
  getUserUsage,
  deleteAccount
} = require('../controllers/userController');
const { ownerOrAdmin } = require('../middleware/auth');
const router = express.Router();

// User profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.delete('/account', deleteAccount);

// User subscription and usage routes
router.get('/subscriptions', getUserSubscriptions);
router.get('/usage', getUserUsage);

module.exports = router;