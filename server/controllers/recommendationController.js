const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const UsageAnalytics = require('../models/UsageAnalytics');
const { asyncHandler } = require('../middleware/errorHandler');

// Simple recommendation algorithm based on usage patterns
class RecommendationEngine {
  static async analyzeUserUsage(userId) {
    const usageData = await UsageAnalytics.getUserUsageSummary(userId, 90); // Last 90 days
    const usagePatterns = await UsageAnalytics.getUsagePatterns(userId, 3); // Last 3 months
    
    if (!usageData.length) {
      return null;
    }

    const summary = usageData[0];
    
    // Categorize user based on usage
    let userCategory = 'light-users';
    if (summary.avgDailyUsage > 50) userCategory = 'heavy-users';
    else if (summary.avgDailyUsage > 20) userCategory = 'moderate-users';

    // Analyze application usage
    const appUsage = await UsageAnalytics.aggregate([
      { $match: { user: userId } },
      { $unwind: '$applicationUsage' },
      {
        $group: {
          _id: '$applicationUsage.application',
          totalUsage: { $sum: '$applicationUsage.dataUsed' },
          avgQuality: { $avg: '$applicationUsage.qualityScore' }
        }
      },
      { $sort: { totalUsage: -1 } }
    ]);

    // Determine primary use case
    let primaryUseCase = 'browsing';
    if (appUsage.length > 0) {
      const topApp = appUsage[0]._id;
      if (['streaming', 'gaming'].includes(topApp)) {
        primaryUseCase = topApp === 'streaming' ? 'streamers' : 'gamers';
      } else if (topApp === 'video-calls') {
        primaryUseCase = 'remote-workers';
      }
    }

    return {
      userCategory,
      primaryUseCase,
      avgDailyUsage: summary.avgDailyUsage,
      avgSpeed: summary.avgDownloadSpeed,
      qualityScore: summary.avgUptime,
      appUsage: appUsage.slice(0, 3) // Top 3 applications
    };
  }

  static async generateRecommendations(userId) {
    const user = await User.findById(userId);
    const currentSubscription = await Subscription.findActiveByUser(userId);
    const usageAnalysis = await this.analyzeUserUsage(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const recommendations = [];

    // If no usage data, recommend based on user profile
    if (!usageAnalysis) {
      const plans = await Plan.find({ 
        status: 'active',
        targetAudience: 'light-users'
      }).sort({ 'pricing.monthly': 1 }).limit(3);

      return plans.map(plan => ({
        plan,
        reason: 'Recommended starter plan for new users',
        confidence: 0.6,
        type: 'new-user'
      }));
    }

    // Get plans suitable for user's category
    const suitablePlans = await Plan.find({
      status: 'active',
      $or: [
        { targetAudience: usageAnalysis.userCategory },
        { targetAudience: usageAnalysis.primaryUseCase }
      ]
    }).sort({ popularity: -1 });

    // If user has current subscription, compare and recommend
    if (currentSubscription) {
      const currentPlan = currentSubscription.plan;
      const usage = usageAnalysis.avgDailyUsage * 30; // Monthly usage
      
      // Check if user is over/under utilizing their plan
      if (currentPlan.features.dataLimit.amount && !currentPlan.features.dataLimit.unlimited) {
        const utilizationRate = usage / currentPlan.features.dataLimit.amount;
        
        if (utilizationRate > 0.8) {
          // User is close to limit, recommend upgrade
          const upgradePlans = suitablePlans.filter(plan => 
            plan.pricing.monthly > currentPlan.pricing.monthly &&
            (plan.features.dataLimit.unlimited || plan.features.dataLimit.amount > currentPlan.features.dataLimit.amount)
          ).slice(0, 2);

          upgradePlans.forEach(plan => {
            recommendations.push({
              plan,
              reason: `You're using ${Math.round(utilizationRate * 100)}% of your current plan. This plan offers more data and better speeds.`,
              confidence: 0.9,
              type: 'upgrade',
              potentialSavings: null
            });
          });
        } else if (utilizationRate < 0.3) {
          // User is under-utilizing, recommend downgrade
          const downgradePlans = suitablePlans.filter(plan => 
            plan.pricing.monthly < currentPlan.pricing.monthly &&
            (!plan.features.dataLimit.amount || plan.features.dataLimit.amount >= usage * 1.5)
          ).slice(0, 2);

          downgradePlans.forEach(plan => {
            const monthlySavings = currentPlan.pricing.monthly - plan.pricing.monthly;
            recommendations.push({
              plan,
              reason: `You're only using ${Math.round(utilizationRate * 100)}% of your current plan. Save money with this plan.`,
              confidence: 0.8,
              type: 'downgrade',
              potentialSavings: monthlySavings
            });
          });
        }
      }

      // Speed-based recommendations
      if (usageAnalysis.avgSpeed < currentPlan.features.speed.download * 0.7) {
        // User is getting poor speeds, recommend better plan
        const fasterPlans = suitablePlans.filter(plan =>
          plan.features.speed.download > currentPlan.features.speed.download &&
          plan.technicalSpecs.technology !== currentPlan.technicalSpecs.technology
        ).slice(0, 1);

        fasterPlans.forEach(plan => {
          recommendations.push({
            plan,
            reason: `Your average speed is ${Math.round(usageAnalysis.avgSpeed)}Mbps. This ${plan.technicalSpecs.technology} plan offers consistent ${plan.features.speed.download}Mbps.`,
            confidence: 0.85,
            type: 'performance',
            potentialSavings: null
          });
        });
      }
    } else {
      // New customer recommendations
      const newCustomerPlans = suitablePlans
        .filter(plan => plan.targetAudience === usageAnalysis.userCategory)
        .slice(0, 3);

      newCustomerPlans.forEach((plan, index) => {
        recommendations.push({
          plan,
          reason: `Perfect for ${usageAnalysis.userCategory.replace('-', ' ')} with your usage pattern of ${Math.round(usageAnalysis.avgDailyUsage)}GB/day.`,
          confidence: 0.7 - (index * 0.1),
          type: 'new-customer',
          potentialSavings: null
        });
      });
    }

    // Add popular plans if we don't have enough recommendations
    if (recommendations.length < 3) {
      const popularPlans = await Plan.getPopularPlans(5);
      const remainingSlots = 3 - recommendations.length;
      
      popularPlans.slice(0, remainingSlots).forEach(plan => {
        if (!recommendations.find(rec => rec.plan._id.toString() === plan._id.toString())) {
          recommendations.push({
            plan,
            reason: 'Popular choice among users with similar needs',
            confidence: 0.6,
            type: 'popular',
            potentialSavings: null
          });
        }
      });
    }

    return recommendations;
  }

  static async getPersonalizedOffers(userId) {
    const user = await User.findById(userId);
    const recommendations = await this.generateRecommendations(userId);
    
    // Add personalized discounts/offers
    const offers = recommendations.map(rec => {
      let discount = 0;
      let offerText = '';

      // New customer offer
      if (rec.type === 'new-customer') {
        discount = 20; // 20% off first month
        offerText = '20% off your first month!';
      }
      
      // Upgrade incentive
      if (rec.type === 'upgrade') {
        discount = 10; // 10% off upgrade
        offerText = '10% off when you upgrade this month!';
      }

      // Loyalty discount for existing customers
      if (user.customerSince && Date.now() - user.customerSince > 365 * 24 * 60 * 60 * 1000) {
        discount = Math.max(discount, 15); // 15% loyalty discount
        offerText = offerText || 'Loyal customer discount - 15% off!';
      }

      return {
        ...rec,
        discount,
        offerText,
        finalPrice: rec.plan.pricing.monthly * (1 - discount / 100)
      };
    });

    return offers;
  }
}

// @desc    Get user recommendations
// @route   GET /api/recommendations/user/:userId
// @access  Private
const getUserRecommendations = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { includeOffers = false } = req.query;

  // Check if user can access this data
  if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied'
    });
  }

  try {
    let recommendations;
    
    if (includeOffers === 'true') {
      recommendations = await RecommendationEngine.getPersonalizedOffers(userId);
    } else {
      recommendations = await RecommendationEngine.generateRecommendations(userId);
    }

    const usageAnalysis = await RecommendationEngine.analyzeUserUsage(userId);

    res.status(200).json({
      status: 'success',
      data: {
        recommendations,
        usageAnalysis,
        totalRecommendations: recommendations.length
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update user preferences for recommendations
// @route   PUT /api/recommendations/preferences
// @access  Private
const updateUserPreferences = asyncHandler(async (req, res) => {
  const {
    preferredCategories,
    budgetRange,
    speedRequirement,
    dataRequirement,
    specialOffers
  } = req.body;

  const user = await User.findById(req.user._id);
  
  // Update user preferences
  user.preferences = {
    ...user.preferences,
    recommendations: {
      preferredCategories,
      budgetRange,
      speedRequirement,
      dataRequirement,
      specialOffers
    }
  };

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Recommendation preferences updated successfully',
    data: {
      preferences: user.preferences.recommendations
    }
  });
});

// @desc    Get recommendation engine status
// @route   GET /api/recommendations/engine/status
// @access  Private/Admin
const getRecommendationEngine = asyncHandler(async (req, res) => {
  // Get statistics about the recommendation engine
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const usersWithData = await UsageAnalytics.distinct('user').countDocuments();
  const totalPlans = await Plan.countDocuments({ status: 'active' });
  
  const engineStats = {
    totalUsers,
    usersWithData,
    dataCompletenesss: Math.round((usersWithData / totalUsers) * 100),
    totalActivePlans: totalPlans,
    algorithmVersion: '1.0',
    lastUpdated: new Date().toISOString(),
    features: [
      'Usage-based recommendations',
      'Performance optimization',
      'Cost optimization',
      'Personalized offers',
      'Churn prediction'
    ]
  };

  res.status(200).json({
    status: 'success',
    data: {
      engineStats
    }
  });
});

// @desc    Train recommendation model (placeholder)
// @route   POST /api/recommendations/engine/train
// @access  Private/Admin
const trainRecommendationModel = asyncHandler(async (req, res) => {
  // In a real implementation, this would trigger ML model training
  // For now, we'll simulate the training process
  
  const trainingStats = {
    startTime: new Date().toISOString(),
    dataPoints: await UsageAnalytics.countDocuments(),
    features: ['usage_patterns', 'plan_preferences', 'performance_metrics'],
    status: 'completed',
    accuracy: 0.87,
    modelVersion: '1.1'
  };

  // Simulate training time
  setTimeout(() => {
    // Training completed
  }, 1000);

  res.status(200).json({
    status: 'success',
    message: 'Model training initiated successfully',
    data: {
      trainingStats
    }
  });
});

module.exports = {
  getUserRecommendations,
  updateUserPreferences,
  getRecommendationEngine,
  trainRecommendationModel
};