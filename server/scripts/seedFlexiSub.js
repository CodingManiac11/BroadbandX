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
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample data generators
const generateUsers = async () => {
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = [
    // Admin users
    {
      firstName: 'Admin',
      lastName: 'SuperUser',
      email: 'admin@flexisub.com',
      password: hashedPassword,
      phone: '+15550001',
      address: {
        street: '123 Admin Street',
        city: 'Tech City',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      role: 'admin',
      status: 'active',
      lastLogin: new Date(),
      preferences: {
        notifications: {
          email: true,
          sms: true,
          push: true
        },
        theme: 'light',
        language: 'en'
      }
    },
    {
      firstName: 'Sarah',
      lastName: 'Manager',
      email: 'sarah.manager@flexisub.com',
      password: hashedPassword,
      phone: '+15550002',
      address: {
        street: '456 Management Ave',
        city: 'Business District',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      role: 'admin',
      status: 'active'
    },

    // Customer users
    {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      password: hashedPassword,
      phone: '+15551001',
      address: {
        street: '789 Residential Rd',
        city: 'Suburbia',
        state: 'TX',
        zipCode: '75001',
        country: 'USA'
      },
      role: 'customer',
      status: 'active',
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.johnson@email.com',
      password: hashedPassword,
      phone: '+15551002',
      address: {
        street: '321 Oak Street',
        city: 'Downtown',
        state: 'FL',
        zipCode: '33101',
        country: 'USA'
      },
      role: 'customer',
      status: 'active'
    },
    {
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@email.com',
      password: hashedPassword,
      phone: '+15551003',
      address: {
        street: '654 Pine Avenue',
        city: 'Uptown',
        state: 'WA',
        zipCode: '98101',
        country: 'USA'
      },
      role: 'customer',
      status: 'active'
    },
    {
      firstName: 'Jessica',
      lastName: 'Davis',
      email: 'jessica.davis@email.com',
      password: hashedPassword,
      phone: '+15551004',
      address: {
        street: '987 Elm Street',
        city: 'Midtown',
        state: 'CO',
        zipCode: '80201',
        country: 'USA'
      },
      role: 'customer',
      status: 'active'
    },
    {
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@email.com',
      password: hashedPassword,
      phone: '+15551005',
      address: {
        street: '147 Maple Drive',
        city: 'Riverside',
        state: 'AZ',
        zipCode: '85001',
        country: 'USA'
      },
      role: 'customer',
      status: 'suspended' // One suspended user for testing
    }
  ];

  return users;
};

const generatePlans = () => {
  return [
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
        dataLimit: 500, // GB
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
        dataLimit: 1000, // GB
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
        dataLimit: 2000, // GB
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
        dataLimit: -1, // Unlimited
        bandwidth: 'Up to 1 Gbps',
        extras: ['Mesh WiFi System', 'White Glove Service', 'Smart Home Integration', 'Cloud Storage']
      },
      active: true,
      currentSubscribers: 0
    },
    {
      name: 'Business Starter',
      description: 'Reliable internet for small businesses and home offices.',
      category: 'business',
      pricing: {
        monthly: 89.99,
        yearly: 899.99,
        setupFee: 149.99
      },
      features: {
        speed: {
          download: 100,
          upload: 100,
          unit: 'Mbps'
        },
        dataLimit: -1, // Unlimited
        bandwidth: 'Symmetric 100 Mbps',
        extras: ['Business Grade Router', 'SLA Guarantee', 'Static IP', 'Business Support']
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
        dataLimit: -1, // Unlimited
        bandwidth: 'Symmetric 500 Mbps',
        extras: ['Enterprise Router', '99.9% SLA', 'Multiple Static IPs', 'Dedicated Support', 'VPN Setup']
      },
      active: true,
      currentSubscribers: 0
    },
    {
      name: 'Enterprise Elite',
      description: 'Mission-critical connectivity for large enterprises.',
      category: 'business',
      pricing: {
        monthly: 499.99,
        yearly: 4999.99,
        setupFee: 999.99
      },
      features: {
        speed: {
          download: 1000,
          upload: 1000,
          unit: 'Mbps'
        },
        dataLimit: -1, // Unlimited
        bandwidth: 'Symmetric 1 Gbps',
        extras: ['Redundant Connection', '99.99% SLA', 'IPv6 Support', '24/7 NOC', 'Managed Services']
      },
      active: true,
      currentSubscribers: 0
    }
  ];
};

const generateSubscriptions = (users, plans) => {
  const customers = users.filter(user => user.role === 'customer');
  const subscriptions = [];

  customers.forEach((customer, index) => {
    if (customer.status === 'suspended') return; // Skip suspended users

    const plan = plans[index % (plans.length - 2)]; // Avoid business plans for most customers
    const startDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Random date in last year
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

    subscriptions.push({
      userId: customer._id,
      planId: plan._id,
      status: Math.random() > 0.1 ? 'active' : 'cancelled', // 90% active, 10% cancelled
      startDate,
      endDate,
      autoRenew: Math.random() > 0.2, // 80% have auto-renew
      currentPrice: plan.promotional ? plan.promotionalPrice : plan.pricing.monthly,
      usageGB: Math.floor(Math.random() * (plan.features.dataLimit > 0 ? plan.features.dataLimit : 2000)),
      paymentHistory: [
        {
          date: startDate,
          amount: plan.pricing.monthly,
          status: 'completed',
          paymentMethod: 'credit_card'
        }
      ]
    });
  });

  return subscriptions;
};

const generateUsageData = (users, plans, subscriptions) => {
  const usageData = [];
  const now = new Date();

  subscriptions.forEach(subscription => {
    if (subscription.status !== 'active') return;

    const plan = plans.find(p => p._id.equals(subscription.planId));
    const daysBack = 30;

    for (let i = 0; i < daysBack; i++) {
      const usageDate = new Date(now - i * 24 * 60 * 60 * 1000);
      
      // Generate 2-5 usage entries per day
      const entriesPerDay = Math.floor(Math.random() * 4) + 2;
      
      for (let j = 0; j < entriesPerDay; j++) {
        const sessionStart = new Date(usageDate);
        sessionStart.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        const downloadGB = Math.random() * 20; // 0-20 GB per session
        const uploadGB = Math.random() * 5; // 0-5 GB per session
        const latency = 20 + Math.random() * 100; // 20-120 ms
        const sessionDuration = 30 + Math.random() * 180; // 30-210 minutes

        usageData.push({
          userId: subscription.userId,
          planId: subscription.planId,
          subscriptionId: subscription._id,
          timestamp: sessionStart,
          downloadedGB: downloadGB,
          uploadedGB: uploadGB,
          latencyMs: latency,
          sessionDuration,
          deviceType: ['mobile', 'desktop', 'tablet', 'smart-tv'][Math.floor(Math.random() * 4)],
          applicationUsage: [
            {
              app: 'streaming',
              dataUsedGB: downloadGB * 0.6,
              duration: sessionDuration * 0.5
            },
            {
              app: 'browsing',
              dataUsedGB: downloadGB * 0.3,
              duration: sessionDuration * 0.3
            },
            {
              app: 'gaming',
              dataUsedGB: downloadGB * 0.1,
              duration: sessionDuration * 0.2
            }
          ],
          qualityMetrics: {
            downloadSpeed: plan.features.speed.download * (0.8 + Math.random() * 0.4), // 80-120% of plan speed
            uploadSpeed: plan.features.speed.upload * (0.8 + Math.random() * 0.4),
            packetLoss: Math.random() * 2, // 0-2% packet loss
            jitter: Math.random() * 20, // 0-20 ms jitter
            uptime: 95 + Math.random() * 5 // 95-100% uptime
          },
          location: {
            city: 'Virtual City',
            region: 'Test Region',
            country: 'USA',
            timezone: 'America/New_York'
          },
          peakHour: sessionStart.getHours() >= 18 && sessionStart.getHours() <= 23
        });
      }
    }
  });

  return usageData;
};

const generatePricingHistory = (plans, adminUsers) => {
  const pricingHistory = [];
  const admin = adminUsers[0];

  plans.forEach(plan => {
    // Generate 2-3 pricing history entries per plan
    const entriesCount = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < entriesCount; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Last 6 months
      const oldPrice = plan.pricing.monthly * (0.9 + Math.random() * 0.2); // ±10% variation
      const proposedPrice = plan.pricing.monthly * (0.95 + Math.random() * 0.1); // ±5% variation
      
      pricingHistory.push({
        planId: plan._id,
        proposedPrice,
        finalPrice: Math.random() > 0.2 ? proposedPrice : oldPrice, // 80% approval rate
        previousPrice: oldPrice,
        approvedBy: admin._id,
        approved: Math.random() > 0.2,
        approvalDate: new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        mlRecommendation: {
          confidence: 0.7 + Math.random() * 0.3,
          factors: [
            { factor: 'Market Demand', weight: 0.4, impact: 'positive' },
            { factor: 'Competition', weight: 0.3, impact: 'neutral' },
            { factor: 'Seasonality', weight: 0.2, impact: 'negative' },
            { factor: 'Usage Trends', weight: 0.1, impact: 'positive' }
          ],
          modelVersion: 'v1.2.3-mock'
        },
        marketConditions: {
          competitorPrices: [oldPrice * 0.9, oldPrice * 1.1],
          demandLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          seasonality: ['off-peak', 'normal', 'peak'][Math.floor(Math.random() * 3)]
        },
        status: Math.random() > 0.2 ? 'implemented' : 'rejected',
        reason: 'Market analysis and competitive positioning',
        notes: 'Automated pricing adjustment based on ML recommendations',
        createdAt
      });
    }
  });

  return pricingHistory;
};

// Main seeding function
const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Plan.deleteMany({}),
      Subscription.deleteMany({}),
      Usage.deleteMany({}),
      PricingHistory.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // Generate and insert users
    console.log('👥 Creating users...');
    const userData = await generateUsers();
    const users = await User.insertMany(userData);
    console.log(`✅ Created ${users.length} users`);

    // Generate and insert plans
    console.log('📦 Creating plans...');
    const planData = generatePlans();
    const plans = await Plan.insertMany(planData);
    console.log(`✅ Created ${plans.length} plans`);

    // Generate and insert subscriptions
    console.log('📋 Creating subscriptions...');
    const subscriptionData = generateSubscriptions(users, plans);
    const subscriptions = await Subscription.insertMany(subscriptionData);
    console.log(`✅ Created ${subscriptions.length} subscriptions`);

    // Update plan subscriber counts
    console.log('📊 Updating plan subscriber counts...');
    for (const plan of plans) {
      const subscriberCount = subscriptions.filter(
        s => s.planId.equals(plan._id) && s.status === 'active'
      ).length;
      await Plan.findByIdAndUpdate(plan._id, { currentSubscribers: subscriberCount });
    }

    // Generate and insert usage data
    console.log('📈 Creating usage data...');
    const usageData = generateUsageData(users, plans, subscriptions);
    await Usage.insertMany(usageData);
    console.log(`✅ Created ${usageData.length} usage records`);

    // Generate and insert pricing history
    console.log('💰 Creating pricing history...');
    const adminUsers = users.filter(u => u.role === 'admin');
    const pricingData = generatePricingHistory(plans, adminUsers);
    await PricingHistory.insertMany(pricingData);
    console.log(`✅ Created ${pricingData.length} pricing history records`);

    // Create initial audit logs
    console.log('📝 Creating audit logs...');
    await AuditLog.logAction({
      entity: 'System',
      entityId: new mongoose.Types.ObjectId(),
      action: 'create',
      userId: adminUsers[0]._id,
      userEmail: adminUsers[0].email,
      userRole: 'admin',
      ipAddress: '127.0.0.1',
      userAgent: 'FlexiSub Seeder Script',
      details: {
        message: 'Database seeded with initial data',
        userCount: users.length,
        planCount: plans.length,
        subscriptionCount: subscriptions.length,
        usageRecordCount: usageData.length
      }
    });

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  👥 Users: ${users.length} (${adminUsers.length} admins, ${users.length - adminUsers.length} customers)`);
    console.log(`  📦 Plans: ${plans.length}`);
    console.log(`  📋 Subscriptions: ${subscriptions.length}`);
    console.log(`  📈 Usage Records: ${usageData.length}`);
    console.log(`  💰 Pricing History: ${pricingData.length}`);
    
    console.log('\n🔑 Test Accounts:');
    console.log('  Admin: admin@flexisub.com / password123');
    console.log('  Customer: john.smith@email.com / password123');
    console.log('  Customer: emily.johnson@email.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run the seeder
const runSeeder = async () => {
  try {
    await connectDB();
    await seedDatabase();
    console.log('✅ Seeding process completed successfully');
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Execute if run directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedDatabase, runSeeder };