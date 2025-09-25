const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');
const PricingHistory = require('../models/PricingHistory');
const Plan = require('../models/Plan');
const AuditLog = require('../models/AuditLog');
const Usage = require('../models/Usage');

// Mock ML Service Integration
const mockMLService = {
  // Mock dynamic pricing prediction
  predictPrice: async (planData, marketConditions) => {
    // Simulate ML processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { basePrice, category, features } = planData;
    const { demandLevel, competitorPrices, seasonality } = marketConditions;
    
    // Mock pricing algorithm
    let adjustmentFactor = 1;
    
    // Demand-based adjustment
    if (demandLevel === 'high') adjustmentFactor += 0.15;
    else if (demandLevel === 'low') adjustmentFactor -= 0.10;
    
    // Competitive pricing adjustment
    if (competitorPrices && competitorPrices.length > 0) {
      const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
      if (basePrice > avgCompetitorPrice * 1.2) adjustmentFactor -= 0.05;
      else if (basePrice < avgCompetitorPrice * 0.8) adjustmentFactor += 0.05;
    }
    
    // Seasonal adjustment
    if (seasonality === 'peak') adjustmentFactor += 0.08;
    else if (seasonality === 'off-peak') adjustmentFactor -= 0.05;
    
    // Speed tier adjustment
    if (features?.speed?.download > 100) adjustmentFactor += 0.05;
    
    const suggestedPrice = Math.round(basePrice * adjustmentFactor);
    
    return {
      originalPrice: basePrice,
      suggestedPrice,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
      factors: [
        {
          factor: 'Market Demand',
          weight: 0.4,
          impact: demandLevel === 'high' ? 'positive' : demandLevel === 'low' ? 'negative' : 'neutral'
        },
        {
          factor: 'Competitive Position',
          weight: 0.3,
          impact: 'neutral'
        },
        {
          factor: 'Seasonality',
          weight: 0.2,
          impact: seasonality === 'peak' ? 'positive' : 'negative'
        },
        {
          factor: 'Service Tier',
          weight: 0.1,
          impact: features?.speed?.download > 100 ? 'positive' : 'neutral'
        }
      ],
      modelVersion: 'v1.2.3-mock',
      processingTime: Math.random() * 200 + 100 // 100-300ms
    };
  },

  // Mock churn prediction
  predictChurn: async (userUsageData) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const churnProbability = Math.random() * 0.4 + 0.1; // 0.1-0.5 probability
    const riskLevel = churnProbability > 0.3 ? 'high' : churnProbability > 0.15 ? 'medium' : 'low';
    
    return {
      churnProbability,
      riskLevel,
      factors: [
        { factor: 'Usage Pattern', impact: 0.25 },
        { factor: 'Service Quality', impact: 0.20 },
        { factor: 'Payment History', impact: 0.15 },
        { factor: 'Support Interactions', impact: 0.10 }
      ],
      recommendations: [
        'Consider offering loyalty discount',
        'Proactive customer support outreach',
        'Plan upgrade recommendation'
      ]
    };
  }
};

// POST /admin/pricing/propose - Get ML pricing suggestion
router.post('/propose', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { planId, marketConditions } = req.body;

    // Validate input
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Get plan data
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Prepare plan data for ML service
    const planData = {
      basePrice: plan.pricing.monthly,
      category: plan.category,
      features: plan.features,
      currentUsers: plan.currentSubscribers || 0
    };

    // Default market conditions if not provided
    const defaultMarketConditions = {
      demandLevel: 'medium',
      competitorPrices: [plan.pricing.monthly * 0.9, plan.pricing.monthly * 1.1],
      seasonality: 'normal'
    };

    const conditions = { ...defaultMarketConditions, ...marketConditions };

    // Call mock ML service
    const mlPrediction = await mockMLService.predictPrice(planData, conditions);

    // Create pricing history entry
    const pricingEntry = new PricingHistory({
      planId,
      proposedPrice: mlPrediction.suggestedPrice,
      finalPrice: mlPrediction.suggestedPrice,
      previousPrice: plan.pricing.monthly,
      approvedBy: req.user.id,
      mlRecommendation: {
        confidence: mlPrediction.confidence,
        factors: mlPrediction.factors,
        modelVersion: mlPrediction.modelVersion
      },
      marketConditions: conditions,
      status: 'pending'
    });

    await pricingEntry.save();

    // Log the action
    await AuditLog.logAction({
      entity: 'PricingHistory',
      entityId: pricingEntry._id,
      action: 'create',
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: {
        planId,
        proposedPrice: mlPrediction.suggestedPrice,
        previousPrice: plan.pricing.monthly
      }
    });

    res.status(200).json({
      success: true,
      data: {
        pricingId: pricingEntry._id,
        originalPrice: mlPrediction.originalPrice,
        suggestedPrice: mlPrediction.suggestedPrice,
        confidence: mlPrediction.confidence,
        factors: mlPrediction.factors,
        priceChange: {
          amount: mlPrediction.suggestedPrice - mlPrediction.originalPrice,
          percentage: ((mlPrediction.suggestedPrice - mlPrediction.originalPrice) / mlPrediction.originalPrice * 100).toFixed(2)
        },
        marketConditions: conditions,
        processingTime: mlPrediction.processingTime
      }
    });

  } catch (error) {
    console.error('Error in pricing proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate pricing proposal',
      error: error.message
    });
  }
});

// POST /admin/pricing/:id/approve - Approve or reject pricing suggestion
router.post('/:id/approve', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, finalPrice, reason, notes } = req.body;

    const pricingEntry = await PricingHistory.findById(id).populate('planId');
    if (!pricingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Pricing entry not found'
      });
    }

    if (pricingEntry.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Pricing entry has already been processed'
      });
    }

    // Update pricing entry
    pricingEntry.approved = approved;
    pricingEntry.status = approved ? 'approved' : 'rejected';
    pricingEntry.approvalDate = new Date();
    pricingEntry.reason = reason;
    pricingEntry.notes = notes;

    if (approved && finalPrice) {
      pricingEntry.finalPrice = finalPrice;
    }

    await pricingEntry.save();

    // If approved, update the plan price
    if (approved) {
      const plan = await Plan.findById(pricingEntry.planId);
      const oldPrice = plan.pricing.monthly;
      
      plan.pricing.monthly = pricingEntry.finalPrice;
      plan.lastPriceUpdate = new Date();
      await plan.save();

      pricingEntry.status = 'implemented';
      pricingEntry.implementedAt = new Date();
      await pricingEntry.save();

      // Log plan update
      await AuditLog.logAction({
        entity: 'Plan',
        entityId: plan._id,
        action: 'update',
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: {
          field: 'pricing.monthly',
          oldValue: oldPrice,
          newValue: pricingEntry.finalPrice,
          pricingHistoryId: pricingEntry._id
        },
        previousValues: { 'pricing.monthly': oldPrice },
        newValues: { 'pricing.monthly': pricingEntry.finalPrice }
      });
    }

    // Log the approval/rejection
    await AuditLog.logAction({
      entity: 'PricingHistory',
      entityId: pricingEntry._id,
      action: approved ? 'approve' : 'reject',
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: {
        approved,
        finalPrice: pricingEntry.finalPrice,
        reason,
        notes
      }
    });

    res.status(200).json({
      success: true,
      message: `Pricing ${approved ? 'approved' : 'rejected'} successfully`,
      data: {
        pricingId: pricingEntry._id,
        status: pricingEntry.status,
        finalPrice: pricingEntry.finalPrice,
        implementedAt: pricingEntry.implementedAt
      }
    });

  } catch (error) {
    console.error('Error in pricing approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process pricing approval',
      error: error.message
    });
  }
});

// GET /admin/pricing/history - Get pricing history
router.get('/history', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, planId, status } = req.query;
    
    const query = {};
    if (planId) query.planId = planId;
    if (status) query.status = status;

    const pricingHistory = await PricingHistory.find(query)
      .populate('planId', 'name category')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PricingHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        pricingHistory,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: pricingHistory.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pricing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing history',
      error: error.message
    });
  }
});

// GET /admin/pricing/churn-risk - Get churn risk predictions
router.get('/churn-risk', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Get recent usage data for active subscriptions
    const recentUsage = await Usage.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          avgUsage: { $avg: { $add: ['$downloadedGB', '$uploadedGB'] } },
          avgLatency: { $avg: '$latencyMs' },
          sessionCount: { $sum: 1 },
          anomalies: { $sum: { $cond: ['$anomalyDetection.isAnomaly', 1, 0] } }
        }
      },
      { $limit: parseInt(limit) }
    ]);

    // Generate mock churn predictions for each user
    const churnPredictions = await Promise.all(
      recentUsage.map(async (usage) => {
        const prediction = await mockMLService.predictChurn(usage);
        return {
          userId: usage._id,
          ...prediction,
          usageMetrics: {
            avgUsage: usage.avgUsage,
            avgLatency: usage.avgLatency,
            sessionCount: usage.sessionCount,
            anomalies: usage.anomalies
          }
        };
      })
    );

    // Sort by churn probability (highest risk first)
    churnPredictions.sort((a, b) => b.churnProbability - a.churnProbability);

    res.status(200).json({
      success: true,
      data: {
        churnPredictions,
        summary: {
          totalUsers: churnPredictions.length,
          highRisk: churnPredictions.filter(p => p.riskLevel === 'high').length,
          mediumRisk: churnPredictions.filter(p => p.riskLevel === 'medium').length,
          lowRisk: churnPredictions.filter(p => p.riskLevel === 'low').length,
          avgChurnProbability: (churnPredictions.reduce((sum, p) => sum + p.churnProbability, 0) / churnPredictions.length).toFixed(3)
        }
      }
    });

  } catch (error) {
    console.error('Error generating churn predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate churn predictions',
      error: error.message
    });
  }
});

module.exports = router;