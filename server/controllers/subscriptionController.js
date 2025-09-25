const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create subscription
// @route   POST /api/subscriptions
// @access  Private
const createSubscription = asyncHandler(async (req, res) => {
  const {
    planId,
    billingCycle = 'monthly',
    installationAddress,
    startDate,
    discountCode
  } = req.body;

  // Check if user already has an active subscription
  const existingSubscription = await Subscription.findActiveByUser(req.user._id);
  if (existingSubscription) {
    return res.status(400).json({
      status: 'error',
      message: 'You already have an active subscription. Please upgrade/downgrade instead.'
    });
  }

  // Get plan details
  const plan = await Plan.findById(planId);
  if (!plan || plan.status !== 'active') {
    return res.status(404).json({
      status: 'error',
      message: 'Plan not found or not available'
    });
  }

  // Calculate pricing
  const basePrice = billingCycle === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
  let finalPrice = basePrice;
  let discountApplied = 0;

  // Apply discount if provided
  if (discountCode) {
    // Discount logic would go here
    // For now, just apply a sample 10% discount
    discountApplied = basePrice * 0.1;
    finalPrice = basePrice - discountApplied;
  }

  // Calculate dates
  const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
  const endDate = new Date(subscriptionStartDate);
  if (billingCycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Calculate tax (example: 8% tax)
  const taxAmount = finalPrice * 0.08;
  const totalAmount = finalPrice + taxAmount;

  // Create subscription
  const subscription = await Subscription.create({
    user: req.user._id,
    plan: planId,
    status: 'pending',
    startDate: subscriptionStartDate,
    endDate,
    billingCycle,
    pricing: {
      basePrice,
      discountApplied,
      finalPrice,
      currency: plan.pricing.currency,
      taxAmount,
      totalAmount
    },
    installation: {
      address: installationAddress || req.user.address
    }
  });

  // Add service history
  await subscription.addServiceHistory(
    'created',
    'Subscription created and pending activation',
    req.user._id,
    { planName: plan.name, billingCycle }
  );

  await subscription.populate('plan user');

  res.status(201).json({
    status: 'success',
    message: 'Subscription created successfully',
    data: {
      subscription
    }
  });
});

// @desc    Get user subscriptions
// @route   GET /api/subscriptions/my-subscriptions
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

// @desc    Get subscription by ID
// @route   GET /api/subscriptions/:id
// @access  Private
const getSubscriptionById = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id)
    .populate('plan user', '-password')
    .populate('serviceHistory.performedBy', 'firstName lastName')
    .populate('customerNotes.addedBy', 'firstName lastName');

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      subscription
    }
  });
});

// @desc    Update subscription (Admin only)
// @route   PUT /api/subscriptions/:id
// @access  Private/Admin
const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  const updatedSubscription = await Subscription.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('plan user');

  // Add service history
  await updatedSubscription.addServiceHistory(
    'updated',
    'Subscription updated by admin',
    req.user._id,
    req.body
  );

  res.status(200).json({
    status: 'success',
    message: 'Subscription updated successfully',
    data: {
      subscription: updatedSubscription
    }
  });
});

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
  const { reason, effectiveDate } = req.body;

  const subscription = await Subscription.findById(req.params.id).populate('plan');

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  if (subscription.status === 'cancelled') {
    return res.status(400).json({
      status: 'error',
      message: 'Subscription is already cancelled'
    });
  }

  // Calculate cancellation date
  const cancellationDate = effectiveDate ? new Date(effectiveDate) : new Date();
  
  // Check if refund is eligible (within 30 days and less than 10% usage)
  const daysSinceStart = Math.floor((Date.now() - subscription.startDate) / (1000 * 60 * 60 * 24));
  const isRefundEligible = daysSinceStart <= 30 && subscription.currentUsagePercentage < 10;

  // Update subscription
  subscription.status = 'cancelled';
  subscription.cancellation = {
    requestDate: new Date(),
    effectiveDate: cancellationDate,
    reason,
    requestedBy: req.user._id,
    refundEligible: isRefundEligible,
    refundAmount: isRefundEligible ? subscription.pricing.totalAmount : 0
  };

  await subscription.save();

  // Add service history
  await subscription.addServiceHistory(
    'cancelled',
    `Subscription cancelled. Reason: ${reason}`,
    req.user._id,
    { refundEligible: isRefundEligible }
  );

  res.status(200).json({
    status: 'success',
    message: 'Subscription cancelled successfully',
    data: {
      subscription,
      refundEligible: isRefundEligible
    }
  });
});

// @desc    Upgrade plan
// @route   PUT /api/subscriptions/:id/upgrade
// @access  Private
const upgradePlan = asyncHandler(async (req, res) => {
  const { newPlanId } = req.body;

  const subscription = await Subscription.findById(req.params.id).populate('plan');
  const newPlan = await Plan.findById(newPlanId);

  if (!subscription || !newPlan) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription or new plan not found'
    });
  }

  if (subscription.status !== 'active') {
    return res.status(400).json({
      status: 'error',
      message: 'Can only upgrade active subscriptions'
    });
  }

  // Check if it's actually an upgrade
  if (newPlan.pricing.monthly <= subscription.plan.pricing.monthly) {
    return res.status(400).json({
      status: 'error',
      message: 'New plan must be higher tier than current plan'
    });
  }

  // Calculate prorated pricing
  const remainingDays = subscription.daysRemaining;
  const totalDays = subscription.billingCycle === 'yearly' ? 365 : 30;
  const proratedCredit = (subscription.pricing.finalPrice / totalDays) * remainingDays;
  
  const newPrice = subscription.billingCycle === 'yearly' ? newPlan.pricing.yearly : newPlan.pricing.monthly;
  const proratedNewPrice = (newPrice / totalDays) * remainingDays;
  const additionalCost = proratedNewPrice - proratedCredit;

  // Store old plan for history
  const oldPlan = subscription.plan;

  // Update subscription
  subscription.plan = newPlanId;
  subscription.pricing.basePrice = newPrice;
  subscription.pricing.finalPrice = newPrice;
  subscription.pricing.totalAmount = newPrice + subscription.pricing.taxAmount;

  await subscription.save();

  // Add service history
  await subscription.addServiceHistory(
    'upgraded',
    `Plan upgraded from ${oldPlan.name} to ${newPlan.name}`,
    req.user._id,
    { 
      oldPlan: oldPlan.name, 
      newPlan: newPlan.name,
      additionalCost 
    }
  );

  await subscription.populate('plan');

  res.status(200).json({
    status: 'success',
    message: 'Plan upgraded successfully',
    data: {
      subscription,
      additionalCost
    }
  });
});

// @desc    Downgrade plan
// @route   PUT /api/subscriptions/:id/downgrade
// @access  Private
const downgradePlan = asyncHandler(async (req, res) => {
  const { newPlanId, effectiveDate } = req.body;

  const subscription = await Subscription.findById(req.params.id).populate('plan');
  const newPlan = await Plan.findById(newPlanId);

  if (!subscription || !newPlan) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription or new plan not found'
    });
  }

  // Check if it's actually a downgrade
  if (newPlan.pricing.monthly >= subscription.plan.pricing.monthly) {
    return res.status(400).json({
      status: 'error',
      message: 'New plan must be lower tier than current plan'
    });
  }

  // Downgrade takes effect at next billing cycle unless immediate
  const downgradeDate = effectiveDate ? new Date(effectiveDate) : subscription.endDate;
  
  // Store downgrade request
  const oldPlan = subscription.plan;
  
  if (downgradeDate > new Date()) {
    // Schedule downgrade for future
    subscription.serviceHistory.push({
      type: 'downgrade',
      description: `Downgrade scheduled from ${oldPlan.name} to ${newPlan.name}`,
      performedBy: req.user._id,
      metadata: { 
        oldPlan: oldPlan.name, 
        newPlan: newPlan.name,
        effectiveDate: downgradeDate,
        scheduled: true
      }
    });
    
    await subscription.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Downgrade scheduled for next billing cycle',
      data: {
        subscription,
        effectiveDate: downgradeDate
      }
    });
  } else {
    // Immediate downgrade
    subscription.plan = newPlanId;
    subscription.pricing.basePrice = subscription.billingCycle === 'yearly' ? newPlan.pricing.yearly : newPlan.pricing.monthly;
    subscription.pricing.finalPrice = subscription.pricing.basePrice;
    subscription.pricing.totalAmount = subscription.pricing.basePrice + subscription.pricing.taxAmount;

    await subscription.save();

    // Add service history
    await subscription.addServiceHistory(
      'downgraded',
      `Plan downgraded from ${oldPlan.name} to ${newPlan.name}`,
      req.user._id,
      { oldPlan: oldPlan.name, newPlan: newPlan.name }
    );

    await subscription.populate('plan');

    res.status(200).json({
      status: 'success',
      message: 'Plan downgraded successfully',
      data: {
        subscription
      }
    });
  }
});

// @desc    Renew subscription
// @route   PUT /api/subscriptions/:id/renew
// @access  Private
const renewSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  if (subscription.status !== 'active' && subscription.status !== 'expired') {
    return res.status(400).json({
      status: 'error',
      message: 'Can only renew active or expired subscriptions'
    });
  }

  // Extend subscription
  const newEndDate = new Date(subscription.endDate);
  if (subscription.billingCycle === 'yearly') {
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
  } else {
    newEndDate.setMonth(newEndDate.getMonth() + 1);
  }

  subscription.endDate = newEndDate;
  subscription.status = 'active';
  subscription.autoRenewal.nextRenewalDate = newEndDate;

  await subscription.save();

  // Add payment record
  subscription.paymentHistory.push({
    date: new Date(),
    amount: subscription.pricing.totalAmount,
    paymentMethod: 'auto-renewal',
    status: 'completed',
    invoiceNumber: `INV-${Date.now()}`
  });

  await subscription.save();

  // Add service history
  await subscription.addServiceHistory(
    'renewed',
    'Subscription renewed successfully',
    req.user._id,
    { newEndDate }
  );

  res.status(200).json({
    status: 'success',
    message: 'Subscription renewed successfully',
    data: {
      subscription
    }
  });
});

// @desc    Pause subscription
// @route   PUT /api/subscriptions/:id/pause
// @access  Private
const pauseSubscription = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  if (subscription.status !== 'active') {
    return res.status(400).json({
      status: 'error',
      message: 'Can only pause active subscriptions'
    });
  }

  subscription.status = 'suspended';
  await subscription.save();

  // Add service history
  await subscription.addServiceHistory(
    'suspended',
    `Subscription paused. Reason: ${reason || 'User request'}`,
    req.user._id,
    { reason }
  );

  res.status(200).json({
    status: 'success',
    message: 'Subscription paused successfully',
    data: {
      subscription
    }
  });
});

// @desc    Resume subscription
// @route   PUT /api/subscriptions/:id/resume
// @access  Private
const resumeSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  if (subscription.status !== 'suspended') {
    return res.status(400).json({
      status: 'error',
      message: 'Can only resume suspended subscriptions'
    });
  }

  subscription.status = 'active';
  await subscription.save();

  // Add service history
  await subscription.addServiceHistory(
    'resumed',
    'Subscription resumed',
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    message: 'Subscription resumed successfully',
    data: {
      subscription
    }
  });
});

// @desc    Get subscription usage
// @route   GET /api/subscriptions/:id/usage
// @access  Private
const getSubscriptionUsage = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id).populate('plan');

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  const usageData = {
    currentMonth: subscription.usage.currentMonth,
    history: subscription.usage.history,
    usagePercentage: subscription.currentUsagePercentage,
    planLimit: subscription.plan.features.dataLimit.unlimited ? 'Unlimited' : 
               `${subscription.plan.features.dataLimit.amount} ${subscription.plan.features.dataLimit.unit}`
  };

  res.status(200).json({
    status: 'success',
    data: {
      usage: usageData
    }
  });
});

// @desc    Update usage (Admin only)
// @route   PUT /api/subscriptions/:id/usage
// @access  Private/Admin
const updateUsage = asyncHandler(async (req, res) => {
  const { dataUsed, month, year } = req.body;
  
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  // Update current month or add to history
  if (month && year) {
    // Update historical data
    const existingRecord = subscription.usage.history.find(
      record => record.month === month && record.year === year
    );
    
    if (existingRecord) {
      existingRecord.dataUsed = dataUsed;
    } else {
      subscription.usage.history.push({ month, year, dataUsed });
    }
  } else {
    // Update current month
    subscription.usage.currentMonth.dataUsed = dataUsed;
    subscription.usage.currentMonth.lastUpdated = new Date();
  }

  await subscription.save();

  res.status(200).json({
    status: 'success',
    message: 'Usage updated successfully',
    data: {
      subscription
    }
  });
});

// @desc    Schedule installation
// @route   POST /api/subscriptions/:id/schedule-installation
// @access  Private
const scheduleInstallation = asyncHandler(async (req, res) => {
  const { scheduledDate, address, instructions } = req.body;
  
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  subscription.installation = {
    ...subscription.installation,
    scheduled: true,
    scheduledDate: new Date(scheduledDate),
    address: address || subscription.installation.address,
    instructions
  };

  await subscription.save();

  // Add service history
  await subscription.addServiceHistory(
    'installation-scheduled',
    `Installation scheduled for ${scheduledDate}`,
    req.user._id,
    { scheduledDate, address }
  );

  res.status(200).json({
    status: 'success',
    message: 'Installation scheduled successfully',
    data: {
      installation: subscription.installation
    }
  });
});

// @desc    Add payment
// @route   POST /api/subscriptions/:id/payment
// @access  Private
const addPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, transactionId } = req.body;
  
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  const payment = {
    date: new Date(),
    amount,
    paymentMethod,
    transactionId,
    status: 'completed',
    invoiceNumber: `INV-${Date.now()}`
  };

  subscription.paymentHistory.push(payment);
  await subscription.save();

  res.status(201).json({
    status: 'success',
    message: 'Payment added successfully',
    data: {
      payment
    }
  });
});

// @desc    Get payment history
// @route   GET /api/subscriptions/:id/payments
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'Subscription not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      payments: subscription.paymentHistory
    }
  });
});

module.exports = {
  createSubscription,
  getUserSubscriptions,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  upgradePlan,
  downgradePlan,
  renewSubscription,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionUsage,
  updateUsage,
  scheduleInstallation,
  addPayment,
  getPaymentHistory
};