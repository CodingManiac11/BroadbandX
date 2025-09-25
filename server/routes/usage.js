const express = require('express');
const {
  getCurrentUsage,
  getDailyUsage,
  getMonthlyUsage,
  getHourlyUsage,
  getDeviceDistribution,
} = require('../controllers/usageController');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/current/:userId', protect, getCurrentUsage);
router.get('/daily/:userId', protect, getDailyUsage);
router.get('/monthly/:userId', protect, getMonthlyUsage);
router.get('/hourly/:userId', protect, getHourlyUsage);
router.get('/devices/:userId', protect, getDeviceDistribution);

module.exports = router;