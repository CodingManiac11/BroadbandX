const express = require('express');
const {
  submitFeedback,
  getUserFeedback,
  getPublicFeedback,
  getFeedbackStats,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/public', getPublicFeedback);

// Protected routes
router.post('/', protect, submitFeedback);
router.get('/user/:userId', protect, getUserFeedback);

// Admin routes
router.get('/stats', protect, authorize('admin'), getFeedbackStats);
router.put('/:id', protect, authorize('admin'), updateFeedback);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;