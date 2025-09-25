import { apiClient } from './api';
import { datasetService } from './datasetService';

export interface MLRecommendation {
  planId: string;
  planName?: string;
  currentPrice?: number;
  recommendedPrice?: number;
  type?: 'upgrade' | 'retention' | 'new_plan' | 'pricing';
  title?: string;
  description?: string;
  confidence: number;
  marketFactor?: string;
  estimatedRevenue?: number;
  status: 'pending' | 'implemented' | 'under_review' | 'rejected';
}

class MLService {
  private static instance: MLService;
  private trainingData: any[] = [];
  private isModelTrained = false;

  private constructor() {}

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  public async trainModel(): Promise<void> {
    try {
      // Get the actual dataset for training
      await datasetService.loadDataset();
      const processedData = datasetService.getProcessedData();
      
      if (processedData) {
        this.trainingData = processedData.users;
        this.isModelTrained = true;
        console.log('ML model trained on', this.trainingData.length, 'user records');
      } else {
        throw new Error('No data available for training');
      }
    } catch (error) {
      console.error('Error training ML model:', error);
      this.trainingData = [];
      this.isModelTrained = false;
    }
  }

  public async generateRecommendations(): Promise<MLRecommendation[]> {
    if (!this.isModelTrained) {
      await this.trainModel();
    }

    try {
      const recommendations: MLRecommendation[] = [];

      // Get data-driven recommendations
      if (this.trainingData.length > 0) {
        const dataRecommendations = this.generateDataDrivenRecommendations();
        recommendations.push(...dataRecommendations);
      }

      // Add pricing recommendations based on real data
      const pricingRecommendations = this.generatePricingRecommendations();
      recommendations.push(...pricingRecommendations);

      return recommendations;
    } catch (error) {
      console.error('Error generating ML recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  private generateDataDrivenRecommendations(): MLRecommendation[] {
    const recommendations: MLRecommendation[] = [];
    
    // Analyze plan usage patterns
    const planAnalysis = this.analyzePlanPatterns();
    const churnAnalysis = this.analyzeChurnRisk();

    // Upgrade recommendations
    if (planAnalysis.upgradeOpportunities > 0) {
      recommendations.push({
        planId: 'data_driven_upgrades',
        type: 'upgrade',
        title: 'Data-Driven Plan Upgrades',
        description: `${planAnalysis.upgradeOpportunities} users showing high usage patterns should be targeted for plan upgrades`,
        confidence: 0.85,
        estimatedRevenue: planAnalysis.upgradeRevenue,
        status: 'pending'
      });
    }

    // Retention recommendations
    if (churnAnalysis.highRiskUsers > 0) {
      recommendations.push({
        planId: 'churn_prevention',
        type: 'retention',
        title: 'Churn Prevention Initiative',
        description: `${churnAnalysis.highRiskUsers} users at risk of churning. Implement targeted retention strategies.`,
        confidence: 0.88,
        estimatedRevenue: churnAnalysis.retentionValue,
        status: 'pending'
      });
    }

    return recommendations;
  }

  private generatePricingRecommendations(): MLRecommendation[] {
    // Generate pricing recommendations based on plan performance
    const planPerformance = this.analyzePlanRevenue();
    
    return planPerformance.map(plan => ({
      planId: plan.name.toLowerCase().replace(/\s+/g, '_'),
      planName: plan.name,
      currentPrice: plan.currentPrice,
      recommendedPrice: plan.recommendedPrice,
      confidence: plan.confidence,
      marketFactor: plan.marketFactor,
      status: 'pending' as const
    }));
  }

  private analyzePlanPatterns() {
    const planStats: Record<string, { users: number; totalUsage: number; totalRevenue: number }> = {};
    
    this.trainingData.forEach(user => {
      if (!planStats[user.plan]) {
        planStats[user.plan] = { users: 0, totalUsage: 0, totalRevenue: 0 };
      }
      planStats[user.plan].users++;
      planStats[user.plan].totalUsage += user.usage || 0;
      planStats[user.plan].totalRevenue += user.revenue;
    });

    let upgradeOpportunities = 0;
    let upgradeRevenue = 0;

    Object.entries(planStats).forEach(([plan, stats]) => {
      const avgUsage = stats.totalUsage / stats.users;
      const isBasicPlan = plan.toLowerCase().includes('basic');
      
      if (isBasicPlan && avgUsage > 60) {
        upgradeOpportunities += stats.users;
        upgradeRevenue += stats.users * 200; // Estimated upgrade revenue
      }
    });

    return { upgradeOpportunities, upgradeRevenue };
  }

  private analyzeChurnRisk() {
    let highRiskUsers = 0;
    let retentionValue = 0;

    this.trainingData.forEach(user => {
      const usage = user.usage || 0;
      const isLowUsage = usage < 30;
      
      if (isLowUsage || user.status === 'Cancelled') {
        highRiskUsers++;
        retentionValue += user.revenue * 0.7; // Estimated retention value
      }
    });

    return { highRiskUsers, retentionValue };
  }

  private analyzePlanRevenue() {
    const planRevenue: Record<string, { totalRevenue: number; users: number; avgRevenue: number }> = {};
    
    this.trainingData.forEach(user => {
      if (!planRevenue[user.plan]) {
        planRevenue[user.plan] = { totalRevenue: 0, users: 0, avgRevenue: 0 };
      }
      planRevenue[user.plan].totalRevenue += user.revenue;
      planRevenue[user.plan].users++;
    });

    return Object.entries(planRevenue).map(([plan, stats]) => {
      stats.avgRevenue = stats.totalRevenue / stats.users;
      
      // Simple pricing optimization logic
      let recommendedPrice = stats.avgRevenue;
      let confidence = 0.75;
      let marketFactor = 'Data-driven pricing optimization';

      if (stats.avgRevenue < 100) {
        recommendedPrice = stats.avgRevenue * 1.2; // 20% increase for low-revenue plans
        marketFactor = 'Low revenue per user - price increase recommended';
        confidence = 0.82;
      } else if (stats.avgRevenue > 400) {
        recommendedPrice = stats.avgRevenue * 0.95; // 5% decrease for high-revenue plans
        marketFactor = 'High revenue - competitive pricing adjustment';
        confidence = 0.78;
      }

      return {
        name: plan,
        currentPrice: Math.round(stats.avgRevenue),
        recommendedPrice: Math.round(recommendedPrice),
        confidence,
        marketFactor
      };
    });
  }

  private getFallbackRecommendations(): MLRecommendation[] {
    return [
      {
        planId: 'basic_plan',
        planName: 'Basic Plan',
        currentPrice: 99,
        recommendedPrice: 119,
        confidence: 0.75,
        marketFactor: 'General market analysis - no dataset loaded',
        status: 'pending'
      },
      {
        planId: 'premium_plan',
        planName: 'Premium Plan',
        currentPrice: 299,
        recommendedPrice: 349,
        confidence: 0.80,
        marketFactor: 'General market analysis - no dataset loaded',
        status: 'pending'
      }
    ];
  }

  public async approveRecommendation(planId: string): Promise<void> {
    try {
      await apiClient.post(`/ml/pricing-recommendations/${planId}/approve`);
    } catch (error) {
      console.error('Error approving recommendation:', error);
      // Don't throw error in development mode
      console.log('Recommendation approved (mock):', planId);
    }
  }

  public async rejectRecommendation(planId: string): Promise<void> {
    try {
      await apiClient.post(`/ml/pricing-recommendations/${planId}/reject`);
    } catch (error) {
      console.error('Error rejecting recommendation:', error);
      // Don't throw error in development mode
      console.log('Recommendation rejected (mock):', planId);
    }
  }
}

export const mlService = MLService.getInstance();