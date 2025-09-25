const Plan = require('../models/Plan');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
const getAllPlans = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = '-popularity',
    category,
    minPrice,
    maxPrice,
    minSpeed,
    technology,
    region,
    city
  } = req.query;

  // Build filter object
  const filter = { status: 'active' };
  
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter['pricing.monthly'] = {};
    if (minPrice) filter['pricing.monthly'].$gte = parseFloat(minPrice);
    if (maxPrice) filter['pricing.monthly'].$lte = parseFloat(maxPrice);
  }
  if (minSpeed) filter['features.speed.download'] = { $gte: parseFloat(minSpeed) };
  if (technology) filter['technicalSpecs.technology'] = technology;
  if (region) filter['availability.regions'] = region;
  if (city) filter['availability.cities'] = city;

  // Execute query
  const plans = await Plan.find(filter)
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get total count for pagination
  const total = await Plan.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    data: {
      plans,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get plan by ID
// @route   GET /api/plans/:id
// @access  Public
const getPlanById = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id)
    .populate('createdBy', 'firstName lastName');

  if (!plan) {
    return res.status(404).json({
      status: 'error',
      message: 'Plan not found'
    });
  }

  // If plan is not active, only allow admin to view
  if (plan.status !== 'active' && (!req.user || req.user.role !== 'admin')) {
    return res.status(404).json({
      status: 'error',
      message: 'Plan not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// @desc    Create new plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = asyncHandler(async (req, res) => {
  const planData = {
    ...req.body,
    createdBy: req.user._id,
    lastModifiedBy: req.user._id
  };

  const plan = await Plan.create(planData);

  await plan.populate('createdBy', 'firstName lastName');

  res.status(201).json({
    status: 'success',
    message: 'Plan created successfully',
    data: {
      plan
    }
  });
});

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (!plan) {
    return res.status(404).json({
      status: 'error',
      message: 'Plan not found'
    });
  }

  const updatedPlan = await Plan.findByIdAndUpdate(
    req.params.id,
    { 
      ...req.body, 
      lastModifiedBy: req.user._id 
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy lastModifiedBy', 'firstName lastName');

  res.status(200).json({
    status: 'success',
    message: 'Plan updated successfully',
    data: {
      plan: updatedPlan
    }
  });
});

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (!plan) {
    return res.status(404).json({
      status: 'error',
      message: 'Plan not found'
    });
  }

  // Check if plan has active subscriptions
  const Subscription = require('../models/Subscription');
  const activeSubscriptions = await Subscription.find({
    plan: req.params.id,
    status: 'active'
  });

  if (activeSubscriptions.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot delete plan with active subscriptions. Consider deprecating instead.'
    });
  }

  await Plan.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Plan deleted successfully'
  });
});

// @desc    Get popular plans
// @route   GET /api/plans/popular
// @access  Public
const getPopularPlans = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const plans = await Plan.getPopularPlans(parseInt(limit));

  res.status(200).json({
    status: 'success',
    data: {
      plans
    }
  });
});

// @desc    Search plans
// @route   GET /api/plans/search
// @access  Public
const searchPlans = asyncHandler(async (req, res) => {
  const {
    q: query,
    page = 1,
    limit = 10,
    category,
    minPrice,
    maxPrice,
    technology
  } = req.query;

  // Build filters
  const filters = {};
  if (category) filters.category = category;
  if (minPrice || maxPrice) {
    filters['pricing.monthly'] = {};
    if (minPrice) filters['pricing.monthly'].$gte = parseFloat(minPrice);
    if (maxPrice) filters['pricing.monthly'].$lte = parseFloat(maxPrice);
  }
  if (technology) filters['technicalSpecs.technology'] = technology;

  const plans = await Plan.searchPlans(query, filters)
    .populate('createdBy', 'firstName lastName')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.status(200).json({
    status: 'success',
    data: {
      plans,
      query
    }
  });
});

// @desc    Get plans by category
// @route   GET /api/plans/category/:category
// @access  Public
const getPlansByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const plans = await Plan.getPlansByCategory(category)
    .populate('createdBy', 'firstName lastName')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Plan.countDocuments({ category, status: 'active' });

  res.status(200).json({
    status: 'success',
    data: {
      plans,
      category,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Check plan availability
// @route   POST /api/plans/check-availability
// @access  Public
const checkPlanAvailability = asyncHandler(async (req, res) => {
  const { planId, region, city } = req.body;

  const plan = await Plan.findById(planId);

  if (!plan) {
    return res.status(404).json({
      status: 'error',
      message: 'Plan not found'
    });
  }

  const isAvailable = plan.isAvailableIn(region, city);

  res.status(200).json({
    status: 'success',
    data: {
      planId,
      region,
      city,
      available: isAvailable,
      plan: {
        name: plan.name,
        category: plan.category
      }
    }
  });
});

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPopularPlans,
  searchPlans,
  getPlansByCategory,
  checkPlanAvailability
};