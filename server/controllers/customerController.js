const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const UsageAnalytics = require('../models/UsageAnalytics');

// Customer dashboard stats
exports.getCustomerStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get active subscriptions count
    const activeSubscriptions = await Subscription.countDocuments({
      user: userId,
      status: 'active'
    });

    // Calculate monthly spending (current active subscriptions)
    const subscriptions = await Subscription.find({
      user: userId,
      status: 'active'
    }).populate('plan');
    
    const monthlySpending = subscriptions.reduce((total, sub) => {
      return total + (sub.pricing?.totalAmount || 0);
    }, 0);

    // Get usage analytics for current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const usageStats = await UsageAnalytics.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalDataUsage: { $sum: '$dataUsed' },
          avgDownloadSpeed: { $avg: '$downloadSpeed' }
        }
      }
    ]);

    const totalDataUsage = usageStats.length > 0 ? usageStats[0].totalDataUsage : 0;
    const averageSpeed = usageStats.length > 0 ? usageStats[0].avgDownloadSpeed : 0;

    // Count upcoming bills (due in next 30 days)
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    
    const upcomingBills = await Subscription.countDocuments({
      user: userId,
      status: 'active',
      // Assuming monthly billing cycle, next bill would be based on start date
    });

    res.json({
      success: true,
      data: {
        activeSubscriptions,
        monthlySpending,
        totalDataUsage: Math.round(totalDataUsage * 100) / 100, // Round to 2 decimal places
        averageSpeed: Math.round(averageSpeed * 100) / 100,
        upcomingBills: activeSubscriptions, // For simplicity, assuming each subscription has a monthly bill
        supportTickets: 0 // Placeholder for support tickets feature
      }
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer statistics',
      error: error.message
    });
  }
};

// Get customer's subscriptions
exports.getCustomerSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter)
      .populate('plan')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

// Get available plans for subscription
exports.getAvailablePlans = async (req, res) => {
  try {
    const { category, minSpeed, maxPrice } = req.query;
    
    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (maxPrice) filter['pricing.monthly'] = { $lte: parseInt(maxPrice) };
    
    let plans = await Plan.find(filter).sort({ popularity: -1 });
    
    // Filter by minimum speed if specified
    if (minSpeed) {
      plans = plans.filter(plan => 
        plan.features?.speed?.download >= parseInt(minSpeed)
      );
    }

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching available plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available plans',
      error: error.message
    });
  }
};

// Subscribe to a plan
exports.subscribeToPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, billingCycle = 'monthly' } = req.body;

    console.log('🔍 Subscription request received:');
    console.log('  - User ID:', userId);
    console.log('  - Plan ID:', planId);
    console.log('  - Billing Cycle:', billingCycle);

    // Check if plan exists and is active
    const plan = await Plan.findById(planId);
    console.log('📋 Plan lookup result:');
    console.log('  - Plan found:', !!plan);
    if (plan) {
      console.log('  - Plan name:', plan.name);
      console.log('  - Plan status:', plan.status);
      console.log('  - Plan ID from DB:', plan._id);
    }

    if (!plan || plan.status !== 'active') {
      console.log('❌ Plan validation failed - returning 404');
      return res.status(404).json({
        success: false,
        message: 'Plan not found or not available'
      });
    }

    // Check if user already has an active subscription to this plan
    const existingSubscription = await Subscription.findOne({
      user: userId,
      plan: planId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription to this plan'
      });
    }

    // Calculate pricing
    const basePrice = billingCycle === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
    const taxes = Math.round(basePrice * 0.18); // 18% GST
    const setupFee = plan.pricing.setupFee || 0;
    const totalAmount = basePrice + taxes + setupFee;

    // Create subscription
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = new Subscription({
      user: userId,
      plan: planId,
      status: 'active',
      startDate,
      endDate,
      billingCycle,
      pricing: {
        basePrice,
        discountApplied: 0,
        finalPrice: totalAmount,
        taxes,
        setupFee,
        totalAmount
      }
    });

    await subscription.save();
    await subscription.populate('plan');

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to plan',
      data: subscription
    });
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

// Get customer's usage analytics
exports.getUsageAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month', startDate, endDate } = req.query;

    let dateFilter = {};
    const currentDate = new Date();

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      switch (period) {
        case 'week':
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - 7);
          dateFilter = { date: { $gte: startOfWeek } };
          break;
        case 'month':
        default:
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          dateFilter = { date: { $gte: startOfMonth } };
          break;
        case 'year':
          const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
          dateFilter = { date: { $gte: startOfYear } };
          break;
      }
    }

    const usageData = await UsageAnalytics.find({
      user: userId,
      ...dateFilter
    }).sort({ date: 1 });

    // Calculate summary statistics
    const summary = {
      totalDataUsed: usageData.reduce((sum, record) => sum + record.dataUsed, 0),
      averageDownloadSpeed: usageData.length > 0 
        ? usageData.reduce((sum, record) => sum + record.downloadSpeed, 0) / usageData.length 
        : 0,
      averageUploadSpeed: usageData.length > 0 
        ? usageData.reduce((sum, record) => sum + record.uploadSpeed, 0) / usageData.length 
        : 0,
      peakUsageDay: usageData.length > 0 
        ? usageData.reduce((max, record) => record.dataUsed > max.dataUsed ? record : max)
        : null
    };

    res.json({
      success: true,
      data: {
        usageData,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching usage analytics',
      error: error.message
    });
  }
};

// Get billing history
exports.getBillingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, page = 1 } = req.query;

    // Get user's subscriptions
    const userSubscriptions = await Subscription.find({ user: userId }).select('_id');
    const subscriptionIds = userSubscriptions.map(sub => sub._id);

    // For now, we'll generate mock billing history based on subscriptions
    // In a real system, you'd have a separate Bills/Invoices collection
    const subscriptions = await Subscription.find({
      user: userId,
      ...(status && { status })
    })
    .populate('plan')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    // Generate billing history from subscriptions
    const billingHistory = subscriptions.map(subscription => {
      const currentDate = new Date();
      const nextBillDate = new Date(subscription.startDate);
      
      // Calculate next billing date based on billing cycle
      if (subscription.billingCycle === 'monthly') {
        nextBillDate.setMonth(nextBillDate.getMonth() + 1);
      } else {
        nextBillDate.setFullYear(nextBillDate.getFullYear() + 1);
      }

      return {
        _id: `bill_${subscription._id}`,
        subscription: subscription,
        amount: subscription.pricing.totalAmount,
        dueDate: nextBillDate,
        status: nextBillDate > currentDate ? 'pending' : 'paid',
        paidDate: nextBillDate <= currentDate ? nextBillDate : null,
        paymentMethod: nextBillDate <= currentDate ? 'Credit Card' : null,
        description: `${subscription.billingCycle.charAt(0).toUpperCase() + subscription.billingCycle.slice(1)} subscription - ${subscription.plan.name}`
      };
    });

    res.json({
      success: true,
      data: billingHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: subscriptions.length
      }
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing history',
      error: error.message
    });
  }
};

// Update customer profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, address } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        firstName, 
        lastName, 
        phone, 
        address,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled'
      });
    }

    subscription.status = 'cancelled';
    subscription.endDate = new Date(); // End immediately
    subscription.updatedAt = new Date();

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};