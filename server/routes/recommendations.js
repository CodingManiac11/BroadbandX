const express = require('express');
const {
  getUserRecommendations,
  updateUserPreferences,
  getRecommendationEngine,
  trainRecommendationModel
} = require('../controllers/recommendationController');
const { customerOrAdmin, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Customer routes
router.get('/user/:userId', customerOrAdmin, getUserRecommendations);
router.put('/preferences', updateUserPreferences);

// Admin routes
router.get('/engine/status', adminOnly, getRecommendationEngine);
router.post('/engine/train', adminOnly, trainRecommendationModel);

module.exports = router;