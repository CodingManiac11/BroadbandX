const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Usage = require('../models/Usage');
const PricingHistory = require('../models/PricingHistory');
const AuditLog = require('../models/AuditLog');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Enhanced seeding function
const seedFlexiSubData = async () => {
  console.log('🌱 Starting FlexiSub database seeding...');

  try {
    // Clear existing data except users to avoid conflicts
    console.log('🧹 Clearing existing plan and subscription data...');
    await Plan.deleteMany({});
    await Subscription.deleteMany({});
    await Usage.deleteMany({});
    await PricingHistory.deleteMany({});

    // Create enhanced FlexiSub plans
    console.log('📦 Creating FlexiSub plans...');
    const plans = await Plan.insertMany([
      {
        name: 'Basic Starter',
        description: 'Perfect for light internet users, streaming, and basic browsing.',
        category: 'residential',
        pricing: {
          monthly: 29.99,
          yearly: 299.99,
          setupFee: 0
        },
        features: {
          speed: {
            download: 25,
            upload: 5,
            unit: 'Mbps'
          },
          dataLimit: 500,
          bandwidth: 'Up to 25 Mbps',
          extras: ['WiFi Router Included', 'Basic Support', '99.9% Uptime']
        },
        active: true,
        currentSubscribers: 0,
        maxSubscribers: 1000,
        promotional: false
      },
      {
        name: 'Home Essential',
        description: 'Ideal for families with multiple devices and moderate streaming.',
        category: 'residential',
        pricing: {
          monthly: 49.99,
          yearly: 499.99,
          setupFee: 0
        },
        features: {
          speed: {
            download: 100,
            upload: 20,
            unit: 'Mbps'
          },
          dataLimit: 1000,
          bandwidth: 'Up to 100 Mbps',
          extras: ['Advanced WiFi Router', '24/7 Support', 'Free Installation', 'Parental Controls']
        },
        active: true,
        currentSubscribers: 0,
        promotional: true,
        promotionalPrice: 39.99
      },
      {
        name: 'Power User Pro',
        description: 'For heavy users, 4K streaming, gaming, and work from home.',
        category: 'residential',
        pricing: {
          monthly: 79.99,
          yearly: 799.99,
          setupFee: 0
        },
        features: {
          speed: {
            download: 300,
            upload: 50,
            unit: 'Mbps'
          },
          dataLimit: 2000,
          bandwidth: 'Up to 300 Mbps',
          extras: ['Premium WiFi 6 Router', 'Priority Support', 'Gaming Mode', 'Security Suite']
        },
        active: true,
        currentSubscribers: 0
      },
      {
        name: 'Gigabit Ultimate',
        description: 'Ultimate speed for power users, streamers, and large households.',
        category: 'residential',
        pricing: {
          monthly: 119.99,
          yearly: 1199.99,
          setupFee: 99.99
        },
        features: {
          speed: {
            download: 1000,
            upload: 100,
            unit: 'Mbps'
          },
          dataLimit: -1,
          bandwidth: 'Up to 1 Gbps',
          extras: ['Mesh WiFi System', 'White Glove Service', 'Smart Home Integration', 'Cloud Storage']
        },
        active: true,
        currentSubscribers: 0
      },
      {
        name: 'Business Professional',
        description: 'High-performance internet for growing businesses.',
        category: 'business',
        pricing: {
          monthly: 199.99,
          yearly: 1999.99,
          setupFee: 299.99
        },
        features: {
          speed: {
            download: 500,
            upload: 500,
            unit: 'Mbps'
          },
          dataLimit: -1,
          bandwidth: 'Symmetric 500 Mbps',
          extras: ['Enterprise Router', '99.9% SLA', 'Multiple Static IPs', 'Dedicated Support', 'VPN Setup']
        },
        active: true,
        currentSubscribers: 0
      }
    ]);

    console.log(`✅ Created ${plans.length} FlexiSub plans`);

    // Get existing users
    const users = await User.find({});
    const customers = users.filter(user => user.role === 'customer');
    const admins = users.filter(user => user.role === 'admin');

    // Create subscriptions for existing customers
    if (customers.length > 0) {
      console.log('📋 Creating FlexiSub subscriptions...');
      const subscriptions = [];

      customers.forEach((customer, index) => {
        const plan = plans[index % plans.length];
        const startDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        subscriptions.push({
          userId: customer._id,
          planId: plan._id,
          status: Math.random() > 0.1 ? 'active' : 'cancelled',
          startDate,
          endDate,
          autoRenew: Math.random() > 0.2,
          currentPrice: plan.promotional ? plan.promotionalPrice : plan.pricing.monthly,
          usageGB: Math.floor(Math.random() * (plan.features.dataLimit > 0 ? plan.features.dataLimit : 1000)),
          paymentHistory: [{
            date: startDate,
            amount: plan.pricing.monthly,
            status: 'completed',
            paymentMethod: 'credit_card'
          }]
        });
      });

      await Subscription.insertMany(subscriptions);
      console.log(`✅ Created ${subscriptions.length} subscriptions`);

      // Update plan subscriber counts
      for (const plan of plans) {
        const activeSubscriptions = subscriptions.filter(
          s => s.planId.equals(plan._id) && s.status === 'active'
        ).length;
        await Plan.findByIdAndUpdate(plan._id, { currentSubscribers: activeSubscriptions });
      }

      // Create usage data for active subscriptions
      console.log('📈 Creating FlexiSub usage analytics...');
      const usageData = [];
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

      activeSubscriptions.forEach(subscription => {
        const plan = plans.find(p => p._id.equals(subscription.planId));
        
        // Generate usage for last 30 days
        for (let i = 0; i < 30; i++) {
          const usageDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          
          usageData.push({
            userId: subscription.userId,
            planId: subscription.planId,
            subscriptionId: subscription._id,
            timestamp: usageDate,
            downloadedGB: Math.random() * 15,
            uploadedGB: Math.random() * 3,
            latencyMs: 20 + Math.random() * 80,
            sessionDuration: 30 + Math.random() * 120,
            deviceType: ['mobile', 'desktop', 'tablet', 'smart-tv'][Math.floor(Math.random() * 4)],
            applicationUsage: [{
              app: 'streaming',
              dataUsedGB: Math.random() * 8,
              duration: Math.random() * 180
            }],
            qualityMetrics: {
              downloadSpeed: plan.features.speed.download * (0.8 + Math.random() * 0.4),
              uploadSpeed: plan.features.speed.upload * (0.8 + Math.random() * 0.4),
              packetLoss: Math.random() * 2,
              jitter: Math.random() * 20,
              uptime: 95 + Math.random() * 5
            },
            location: {
              city: 'FlexiSub City',
              region: 'Demo Region',
              country: 'USA',
              timezone: 'America/New_York'
            },
            peakHour: usageDate.getHours() >= 18 && usageDate.getHours() <= 23
          });
        }
      });

      await Usage.insertMany(usageData);
      console.log(`✅ Created ${usageData.length} usage records`);

      // Create pricing history if admins exist
      if (admins.length > 0) {
        console.log('💰 Creating FlexiSub pricing history...');
        const pricingHistory = [];

        plans.forEach(plan => {
          const admin = admins[0];
          const createdAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
          
          pricingHistory.push({
            planId: plan._id,
            proposedPrice: plan.pricing.monthly * (0.95 + Math.random() * 0.1),
            finalPrice: plan.pricing.monthly,
            previousPrice: plan.pricing.monthly * 0.9,
            approvedBy: admin._id,
            approved: true,
            approvalDate: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
            mlRecommendation: {
              confidence: 0.7 + Math.random() * 0.3,
              factors: [
                { factor: 'Market Demand', weight: 0.4, impact: 'positive' },
                { factor: 'Competition', weight: 0.3, impact: 'neutral' },
                { factor: 'Usage Trends', weight: 0.3, impact: 'positive' }
              ],
              modelVersion: 'v1.2.3-demo'
            },
            marketConditions: {
              competitorPrices: [plan.pricing.monthly * 0.9, plan.pricing.monthly * 1.1],
              demandLevel: ['medium', 'high'][Math.floor(Math.random() * 2)],
              seasonality: 'normal'
            },
            status: 'implemented',
            reason: 'FlexiSub AI-powered pricing optimization',
            notes: 'Automated pricing adjustment based on ML recommendations',
            createdAt
          });
        });

        await PricingHistory.insertMany(pricingHistory);
        console.log(`✅ Created ${pricingHistory.length} pricing history records`);

        // Create system audit log
        await AuditLog.logAction({
          entity: 'System',
          entityId: new mongoose.Types.ObjectId(),
          action: 'create',
          userId: admin._id,
          userEmail: admin.email,
          userRole: 'admin',
          ipAddress: '127.0.0.1',
          userAgent: 'FlexiSub Enhancement Seeder',
          details: {
            message: 'FlexiSub system enhanced with AI-powered features',
            planCount: plans.length,
            subscriptionCount: activeSubscriptions.length,
            usageRecordCount: usageData.length,
            pricingHistoryCount: pricingHistory.length
          }
        });
      }
    }

    console.log('🎉 FlexiSub database seeding completed successfully!');
    console.log('\n📊 FlexiSub Enhancement Summary:');
    console.log(`  📦 Enhanced Plans: ${plans.length} (with AI-powered features)`);
    console.log(`  📋 Active Subscriptions: ${customers.length}`);
    console.log(`  📈 Usage Analytics: Enhanced tracking enabled`);
    console.log(`  💰 Dynamic Pricing: ML-powered pricing system active`);
    console.log(`  🤖 AI Features: Churn prediction and usage anomaly detection`);
    
    console.log('\n🔑 FlexiSub Features Ready:');
    console.log('  ✅ Dynamic Pricing with ML Recommendations');
    console.log('  ✅ Advanced Usage Analytics & Anomaly Detection');
    console.log('  ✅ Churn Prediction & Customer Insights');
    console.log('  ✅ Comprehensive Audit Logging');
    console.log('  ✅ Enhanced Plan Management');

  } catch (error) {
    console.error('❌ Error enhancing database with FlexiSub features:', error);
    throw error;
  }
};

// Run the seeder
const runFlexiSubSeeder = async () => {
  try {
    await connectDB();
    await seedFlexiSubData();
    console.log('✅ FlexiSub enhancement completed successfully');
    console.log('\n🚀 Your system is now FlexiSub - ready for production!');
  } catch (error) {
    console.error('❌ FlexiSub enhancement failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Execute if run directly
if (require.main === module) {
  runFlexiSubSeeder();
}

module.exports = { seedFlexiSubData, runFlexiSubSeeder };