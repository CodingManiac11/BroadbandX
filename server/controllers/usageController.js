const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const UsageLog = require('../models/UsageLog');
const emailService = require('../services/emailService');

// @desc    Get current usage statistics
// @route   GET /api/usage/current/:userId
// @access  Private
exports.getCurrentUsage = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  
  // Get user's subscription
  const subscription = await Subscription.findOne({ user: userId, status: 'active' });
  if (!subscription) {
    throw new ErrorResponse('No active subscription found', 404);
  }

  // Get current month's usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await UsageLog.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalDownload: { $sum: '$download' },
        totalUpload: { $sum: '$upload' },
        averageLatency: { $avg: '$latency' },
        averagePacketLoss: { $avg: '$packetLoss' },
        maxDownloadSpeed: { $max: '$downloadSpeed' },
        maxUploadSpeed: { $max: '$uploadSpeed' },
        activeDevices: { $addToSet: '$deviceId' },
      },
    },
  ]);

  // Check if approaching data limit
  if (usage.length > 0) {
    const totalUsage = usage[0].totalDownload + usage[0].totalUpload;
    const usagePercentage = (totalUsage / subscription.plan.monthlyData) * 100;

    // Send alert if usage is above 80%
    if (usagePercentage >= 80) {
      const user = await User.findById(userId);
      await emailService.sendUsageAlert(user.email, {
        customerName: user.firstName,
        currentUsage: Math.round(totalUsage),
        monthlyLimit: subscription.plan.monthlyData,
        usagePercentage: Math.round(usagePercentage),
        remainingData: Math.round(subscription.plan.monthlyData - totalUsage),
        daysLeft: Math.round((new Date(subscription.nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24)),
      });
    }
  }

  res.status(200).json({
    success: true,
    data: usage[0] || {
      totalDownload: 0,
      totalUpload: 0,
      averageLatency: 0,
      averagePacketLoss: 0,
      maxDownloadSpeed: 0,
      maxUploadSpeed: 0,
      activeDevices: [],
    },
  });
});

// @desc    Get daily usage statistics
// @route   GET /api/usage/daily/:userId
// @access  Private
exports.getDailyUsage = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const days = parseInt(req.query.days) || 7;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const usage = await UsageLog.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        },
        download: { $sum: '$download' },
        upload: { $sum: '$upload' },
        totalBandwidth: { $sum: { $add: ['$download', '$upload'] } },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: usage,
  });
});

// @desc    Get monthly usage statistics
// @route   GET /api/usage/monthly/:userId
// @access  Private
exports.getMonthlyUsage = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const months = parseInt(req.query.months) || 6;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const usage = await UsageLog.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
        },
        download: { $sum: '$download' },
        upload: { $sum: '$upload' },
        totalBandwidth: { $sum: { $add: ['$download', '$upload'] } },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: usage,
  });
});

// @desc    Get hourly usage statistics
// @route   GET /api/usage/hourly/:userId
// @access  Private
exports.getHourlyUsage = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const hours = parseInt(req.query.hours) || 24;

  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  const usage = await UsageLog.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' },
        },
        bandwidth: { $avg: { $add: ['$downloadSpeed', '$uploadSpeed'] } },
        users: { $addToSet: '$deviceId' },
      },
    },
    {
      $project: {
        _id: 1,
        bandwidth: 1,
        users: { $size: '$users' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: usage,
  });
});

// @desc    Get device distribution
// @route   GET /api/usage/devices/:userId
// @access  Private
exports.getDeviceDistribution = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const devices = await UsageLog.aggregate([
    {
      $match: {
        userId,
        timestamp: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    },
    {
      $group: {
        _id: '$deviceType',
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate percentages
  const total = devices.reduce((sum, device) => sum + device.count, 0);
  const distribution = devices.map(device => ({
    name: device._id || 'Unknown',
    value: Math.round((device.count / total) * 100),
  }));

  res.status(200).json({
    success: true,
    data: distribution,
  });
});