const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getCurrentUser,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { authenticateToken, userRateLimit } = require('../middleware/auth');
const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', userRateLimit(5, 15 * 60 * 1000), login); // 5 attempts per 15 minutes
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', userRateLimit(3, 60 * 60 * 1000), forgotPassword); // 3 attempts per hour
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(authenticateToken);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router;