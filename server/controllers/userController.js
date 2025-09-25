const User = require('../models/User');
const Subscription = require('../models/Subscription');
const UsageAnalytics = require('../models/UsageAnalytics');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'address', 
    'preferences', 'dateOfBirth', 'profilePicture'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Get user subscriptions
// @route   GET /api/users/subscriptions
// @access  Private
const getUserSubscriptions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const subscriptions = await Subscription.find(filter)
    .populate('plan')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Subscription.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    data: {
      subscriptions,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get user usage analytics
// @route   GET /api/users/usage
// @access  Private
const getUserUsage = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Get usage summary
  const usageSummary = await UsageAnalytics.getUserUsageSummary(req.user._id, parseInt(days));
  
  // Get usage patterns
  const usagePatterns = await UsageAnalytics.getUsagePatterns(req.user._id, 3);
  
  // Get recent usage data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  const recentUsage = await UsageAnalytics.find({
    user: req.user._id,
    date: { $gte: startDate }
  }).sort({ date: -1 }).limit(30);

  res.status(200).json({
    status: 'success',
    data: {
      summary: usageSummary[0] || {},
      patterns: usagePatterns,
      recentUsage
    }
  });
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const { confirmEmail, reason } = req.body;

  // Verify email confirmation
  if (confirmEmail !== req.user.email) {
    return res.status(400).json({
      status: 'error',
      message: 'Email confirmation does not match'
    });
  }

  // Check for active subscriptions
  const activeSubscriptions = await Subscription.find({
    user: req.user._id,
    status: 'active'
  });

  if (activeSubscriptions.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot delete account with active subscriptions. Please cancel all subscriptions first.'
    });
  }

  // Soft delete - just mark as inactive
  await User.findByIdAndUpdate(req.user._id, { 
    status: 'inactive',
    email: `deleted_${Date.now()}_${req.user.email}` // Prevent email conflicts
  });

  res.status(200).json({
    status: 'success',
    message: 'Account deleted successfully'
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getUserSubscriptions,
  getUserUsage,
  deleteAccount
};