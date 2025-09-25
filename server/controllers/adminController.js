const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const UsageAnalytics = require('../models/UsageAnalytics');
const { asyncHandler } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get basic counts
  const [
    totalUsers,
    totalPlans,
    activeSubscriptions,
    totalRevenue,
    monthlyRevenue,
    newUsersThisMonth,
    expiringSoon
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Plan.countDocuments({ status: 'active' }),
    Subscription.countDocuments({ status: 'active' }),
    Subscription.aggregate([
      { $match: { status: { $in: ['active', 'expired'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]),
    Subscription.aggregate([
      { 
        $match: { 
          status: 'active',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]),
    User.countDocuments({
      role: 'customer',
      customerSince: { $gte: startOfMonth }
    }),
    Subscription.countDocuments({
      status: 'active',
      endDate: { 
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        $gte: now
      }
    })
  ]);

  // Calculate growth rates
  const lastMonthUsers = await User.countDocuments({
    role: 'customer',
    customerSince: { $gte: lastMonth, $lt: startOfMonth }
  });

  const userGrowthRate = lastMonthUsers > 0 ? 
    ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers * 100) : 0;

  // Get subscription distribution
  const subscriptionsByStatus = await Subscription.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get popular plans this month
  const popularPlansThisMonth = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    },
    {
      $lookup: {
        from: 'plans',
        localField: '_id',
        foreignField: '_id',
        as: 'planDetails'
      }
    },
    {
      $unwind: '$planDetails'
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalUsers,
      totalPlans,
      activeSubscriptions,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      newUsersThisMonth,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100,
      expiringSoon,
      subscriptionsByStatus,
      popularPlansThisMonth,
      recentUsers: [], // TODO: Add recent users query
      recentSubscriptions: [] // TODO: Add recent subscriptions query
    }
  });
});

// @desc    Get user management data
// @route   GET /api/admin/users
// @access  Private/Admin
const getUserManagement = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    role,
    search,
    sortBy = 'customerSince',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const users = await User.find(filter)
    .select('-password')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(filter);

  // Get user statistics
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      users,
      userStats,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get subscription analytics
// @route   GET /api/admin/analytics/subscriptions
// @access  Private/Admin
const getSubscriptionAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month', year = new Date().getFullYear() } = req.query;

  let groupBy, dateRange;
  
  if (period === 'year') {
    groupBy = { year: { $year: '$createdAt' } };
    dateRange = {};
  } else {
    groupBy = { 
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' }
    };
    dateRange = {
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      }
    };
  }

  const subscriptionTrends = await Subscription.aggregate([
    { $match: dateRange },
    {
      $group: {
        _id: groupBy,
        newSubscriptions: { $sum: 1 },
        revenue: { $sum: '$pricing.totalAmount' },
        avgValue: { $avg: '$pricing.totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Churn analysis
  const churnData = await Subscription.aggregate([
    {
      $match: {
        status: 'cancelled',
        'cancellation.requestDate': { $gte: new Date(year, 0, 1) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$cancellation.requestDate' },
          month: { $month: '$cancellation.requestDate' }
        },
        churnedSubscriptions: { $sum: 1 },
        reasons: { $push: '$cancellation.reason' }
      }
    }
  ]);

  // Plan performance
  const planPerformance = await Subscription.aggregate([
    { $match: dateRange },
    {
      $group: {
        _id: '$plan',
        subscriptions: { $sum: 1 },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    },
    {
      $lookup: {
        from: 'plans',
        localField: '_id',
        foreignField: '_id',
        as: 'planDetails'
      }
    },
    { $unwind: '$planDetails' },
    { $sort: { subscriptions: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      subscriptionTrends,
      churnData,
      planPerformance
    }
  });
});

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  // Monthly revenue breakdown
  const monthlyRevenue = await Subscription.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(parseInt(year) + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        subscriptionCount: { $sum: 1 },
        avgRevenuePerUser: { $avg: '$pricing.totalAmount' }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);

  // Revenue by plan category
  const revenueByCategory = await Subscription.aggregate([
    {
      $lookup: {
        from: 'plans',
        localField: 'plan',
        foreignField: '_id',
        as: 'planDetails'
      }
    },
    { $unwind: '$planDetails' },
    {
      $group: {
        _id: '$planDetails.category',
        revenue: { $sum: '$pricing.totalAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Payment method analysis
  const paymentMethodStats = await Subscription.aggregate([
    { $unwind: '$paymentHistory' },
    {
      $group: {
        _id: '$paymentHistory.paymentMethod',
        totalAmount: { $sum: '$paymentHistory.amount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      monthlyRevenue,
      revenueByCategory,
      paymentMethodStats
    }
  });
});

// @desc    Get top plans analytics
// @route   GET /api/admin/analytics/top-plans
// @access  Private/Admin
const getTopPlans = asyncHandler(async (req, res) => {
  const { 
    period = 'current-month',
    limit = 10 
  } = req.query;

  let dateFilter = {};
  const now = new Date();

  switch (period) {
    case 'current-month':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
    case 'last-month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      dateFilter = {
        createdAt: {
          $gte: lastMonth,
          $lte: endOfLastMonth
        }
      };
      break;
    case 'current-year':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1)
        }
      };
      break;
    case 'all-time':
    default:
      dateFilter = {};
  }

  const topPlans = await Subscription.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$plan',
        subscriptions: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        avgRevenue: { $avg: '$pricing.totalAmount' }
      }
    },
    {
      $lookup: {
        from: 'plans',
        localField: '_id',
        foreignField: '_id',
        as: 'planDetails'
      }
    },
    { $unwind: '$planDetails' },
    {
      $project: {
        planName: '$planDetails.name',
        category: '$planDetails.category',
        subscriptions: 1,
        totalRevenue: 1,
        avgRevenue: 1,
        speed: '$planDetails.features.speed',
        pricing: '$planDetails.pricing'
      }
    },
    { $sort: { subscriptions: -1 } },
    { $limit: parseInt(limit) }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      topPlans,
      period
    }
  });
});

// @desc    Get usage analytics
// @route   GET /api/admin/analytics/usage
// @access  Private/Admin
const getUsageAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Average usage by plan
  const usageByPlan = await UsageAnalytics.aggregate([
    { $match: { date: { $gte: startDate } } },
    {
      $lookup: {
        from: 'subscriptions',
        localField: 'subscription',
        foreignField: '_id',
        as: 'subscriptionDetails'
      }
    },
    { $unwind: '$subscriptionDetails' },
    {
      $lookup: {
        from: 'plans',
        localField: 'subscriptionDetails.plan',
        foreignField: '_id',
        as: 'planDetails'
      }
    },
    { $unwind: '$planDetails' },
    {
      $group: {
        _id: '$planDetails.name',
        avgDailyUsage: { $avg: '$metrics.dataUsed' },
        totalUsers: { $addToSet: '$user' },
        avgSpeed: { $avg: '$averageSpeed.download' }
      }
    },
    {
      $project: {
        planName: '$_id',
        avgDailyUsage: 1,
        totalUsers: { $size: '$totalUsers' },
        avgSpeed: 1
      }
    }
  ]);

  // Peak usage hours
  const peakUsageHours = await UsageAnalytics.aggregate([
    { $match: { date: { $gte: startDate } } },
    { $unwind: '$metrics.sessionMetrics.peakUsageHours' },
    {
      $group: {
        _id: '$metrics.sessionMetrics.peakUsageHours.hour',
        totalUsage: { $sum: '$metrics.sessionMetrics.peakUsageHours.dataUsed' },
        userCount: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        hour: '$_id',
        totalUsage: 1,
        userCount: { $size: '$userCount' }
      }
    },
    { $sort: { hour: 1 } }
  ]);

  // Application usage patterns
  const appUsagePatterns = await UsageAnalytics.aggregate([
    { $match: { date: { $gte: startDate } } },
    { $unwind: '$applicationUsage' },
    {
      $group: {
        _id: '$applicationUsage.application',
        totalDataUsed: { $sum: '$applicationUsage.dataUsed' },
        totalDuration: { $sum: '$applicationUsage.duration' },
        avgQuality: { $avg: '$applicationUsage.qualityScore' },
        userCount: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        application: '$_id',
        totalDataUsed: 1,
        totalDuration: 1,
        avgQuality: 1,
        userCount: { $size: '$userCount' }
      }
    },
    { $sort: { totalDataUsed: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      usageByPlan,
      peakUsageHours,
      appUsagePatterns
    }
  });
});

// @desc    Get customer insights
// @route   GET /api/admin/analytics/customers
// @access  Private/Admin
const getCustomerInsights = asyncHandler(async (req, res) => {
  // Customer lifetime value
  const customerLTV = await Subscription.aggregate([
    {
      $group: {
        _id: '$user',
        totalRevenue: { $sum: '$pricing.totalAmount' },
        subscriptionCount: { $sum: 1 },
        avgSubscriptionValue: { $avg: '$pricing.totalAmount' },
        customerSince: { $min: '$createdAt' }
      }
    },
    {
      $project: {
        userId: '$_id',
        totalRevenue: 1,
        subscriptionCount: 1,
        avgSubscriptionValue: 1,
        customerSince: 1,
        monthsActive: {
          $divide: [
            { $subtract: [new Date(), '$customerSince'] },
            1000 * 60 * 60 * 24 * 30
          ]
        }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 100 }
  ]);

  // Customer segments
  const customerSegments = await User.aggregate([
    { $match: { role: 'customer' } },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'user',
        as: 'subscriptions'
      }
    },
    {
      $project: {
        totalSpent: { $sum: '$subscriptions.pricing.totalAmount' },
        subscriptionCount: { $size: '$subscriptions' },
        lastSubscription: { $max: '$subscriptions.createdAt' }
      }
    },
    {
      $bucket: {
        groupBy: '$totalSpent',
        boundaries: [0, 100, 500, 1000, 5000],
        default: 'high-value',
        output: {
          count: { $sum: 1 },
          avgSpent: { $avg: '$totalSpent' }
        }
      }
    }
  ]);

  // Churn risk analysis
  const churnRisk = await Subscription.aggregate([
    {
      $match: {
        status: 'active',
        endDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $lookup: {
        from: 'usageanalytics',
        localField: '_id',
        foreignField: 'subscription',
        as: 'usage'
      }
    },
    {
      $project: {
        user: 1,
        plan: 1,
        endDate: 1,
        daysUntilExpiry: {
          $divide: [
            { $subtract: ['$endDate', new Date()] },
            1000 * 60 * 60 * 24
          ]
        },
        recentUsage: { $slice: ['$usage', -7] }
      }
    },
    { $sort: { daysUntilExpiry: 1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      customerLTV: customerLTV.slice(0, 20), // Top 20 customers
      customerSegments,
      churnRisk: churnRisk.slice(0, 50) // Top 50 at-risk customers
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  // Get user's subscriptions
  const subscriptions = await Subscription.find({ user: req.params.id })
    .populate('plan')
    .sort({ createdAt: -1 });

  // Get user's usage analytics
  const usageStats = await UsageAnalytics.getUserUsageSummary(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      user,
      subscriptions,
      usageStats: usageStats[0] || {}
    }
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  res.status(200).json({
    status: 'success',
    message: `User status updated to ${status}`,
    data: {
      user
    }
  });
});

// @desc    Create admin user
// @route   POST /api/admin/users/admin
// @access  Private/Admin
const createAdminUser = asyncHandler(async (req, res) => {
  const userData = {
    ...req.body,
    role: 'admin',
    emailVerified: true
  };

  const admin = await User.create(userData);
  admin.password = undefined;

  res.status(201).json({
    status: 'success',
    message: 'Admin user created successfully',
    data: {
      user: admin
    }
  });
});

// @desc    Get system health
// @route   GET /api/admin/health
// @access  Private/Admin
const getSystemHealth = asyncHandler(async (req, res) => {
  const dbStats = await mongoose.connection.db.stats();
  
  const systemHealth = {
    database: {
      connected: mongoose.connection.readyState === 1,
      collections: dbStats.collections,
      dataSize: dbStats.dataSize,
      indexSize: dbStats.indexSize
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json({
    status: 'success',
    data: systemHealth
  });
});

// @desc    Get all subscriptions (Admin only)
// @route   GET /api/admin/subscriptions
// @access  Private/Admin
const getAllSubscriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  
  let query = {};
  
  // Filter by status if provided
  if (status && status !== 'all') {
    query.status = status;
  }
  
  // Search by user email or plan name
  if (search) {
    const users = await User.find({
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    
    const plans = await Plan.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');
    
    query.$or = [
      { user: { $in: users.map(u => u._id) } },
      { plan: { $in: plans.map(p => p._id) } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const subscriptions = await Subscription.find(query)
    .populate('user', 'email firstName lastName')
    .populate('plan', 'name category pricing status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Subscription.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: subscriptions,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      limit: parseInt(limit)
    }
  });
});

module.exports = {
  getDashboardStats,
  getUserManagement,
  getSubscriptionAnalytics,
  getRevenueAnalytics,
  getTopPlans,
  getUsageAnalytics,
  getCustomerInsights,
  getUserById,
  updateUserStatus,
  createAdminUser,
  getSystemHealth,
  getAllSubscriptions
};