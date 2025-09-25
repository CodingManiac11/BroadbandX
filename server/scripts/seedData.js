const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const UsageAnalytics = require('../models/UsageAnalytics');

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

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Plan.deleteMany({});
    await Subscription.deleteMany({});
    await UsageAnalytics.deleteMany({});
    console.log('🧹 Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    const adminData = {
      firstName: 'Aditya',
      lastName: 'Utsav',
      email: 'adityautsav1901@gmail.com',
      password: 'admin123',
      phone: '+1234567890',
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      role: 'admin',
      status: 'active',
      emailVerified: true
    };

    const admin = await User.create(adminData);
    console.log('👤 Created admin user:', admin.email);
    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Create sample customers
const createCustomers = async () => {
  try {
    const customers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        password: 'customer123',
        phone: '+1234567891',
        address: {
          street: '456 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        role: 'customer',
        status: 'active',
        emailVerified: true
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@email.com',
        password: 'customer123',
        phone: '+1234567892',
        address: {
          street: '789 Oak Ave',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94101',
          country: 'USA'
        },
        role: 'customer',
        status: 'active',
        emailVerified: true
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@email.com',
        password: 'customer123',
        phone: '+1234567893',
        address: {
          street: '321 Pine St',
          city: 'San Diego',
          state: 'CA',
          zipCode: '92101',
          country: 'USA'
        },
        role: 'customer',
        status: 'active',
        emailVerified: true
      }
    ];

    const createdCustomers = await User.create(customers);
    console.log(`👥 Created ${createdCustomers.length} customers`);
    return createdCustomers;
  } catch (error) {
    console.error('Error creating customers:', error);
    return [];
  }
};

// Create broadband plans
const createPlans = async (adminId) => {
  try {
    const plans = [
      {
        name: 'Basic Broadband',
        description: 'Perfect for light internet usage, browsing, and email',
        category: 'residential',
        pricing: {
          monthly: 29.99,
          yearly: 299.99,
          setupFee: 0,
          currency: 'USD'
        },
        features: {
          speed: {
            download: 25,
            upload: 5,
            unit: 'Mbps'
          },
          dataLimit: {
            amount: 250,
            unit: 'GB',
            unlimited: false
          },
          features: [
            { name: 'Email Support', description: '24/7 email support', included: true },
            { name: 'Basic Security', description: 'Basic malware protection', included: true }
          ]
        },
        availability: {
          regions: ['California', 'Nevada', 'Arizona'],
          cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Las Vegas', 'Phoenix']
        },
        technicalSpecs: {
          technology: 'cable',
          latency: 20,
          reliability: 99.5,
          installation: {
            required: true,
            fee: 50,
            timeframe: '2-3 business days'
          }
        },
        targetAudience: 'light-users',
        contractTerms: {
          minimumTerm: 12,
          earlyTerminationFee: 50,
          autoRenewal: true
        },
        createdBy: adminId,
        popularity: 75
      },
      {
        name: 'Standard Fiber',
        description: 'High-speed fiber for families and remote workers',
        category: 'residential',
        pricing: {
          monthly: 59.99,
          yearly: 599.99,
          setupFee: 0,
          currency: 'USD'
        },
        features: {
          speed: {
            download: 100,
            upload: 20,
            unit: 'Mbps'
          },
          dataLimit: {
            unlimited: true
          },
          features: [
            { name: 'Phone Support', description: '24/7 phone support', included: true },
            { name: 'Advanced Security', description: 'Advanced malware and firewall protection', included: true },
            { name: 'Free Router', description: 'High-performance Wi-Fi router included', included: true }
          ]
        },
        availability: {
          regions: ['California', 'Nevada', 'Arizona', 'Oregon'],
          cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Las Vegas', 'Phoenix', 'Portland']
        },
        technicalSpecs: {
          technology: 'fiber',
          latency: 5,
          reliability: 99.9,
          installation: {
            required: true,
            fee: 0,
            timeframe: '1-2 business days'
          }
        },
        targetAudience: 'moderate-users',
        contractTerms: {
          minimumTerm: 12,
          earlyTerminationFee: 75,
          autoRenewal: true
        },
        createdBy: adminId,
        popularity: 120
      },
      {
        name: 'Premium Gigabit',
        description: 'Ultimate speed for heavy users, gamers, and content creators',
        category: 'residential',
        pricing: {
          monthly: 99.99,
          yearly: 999.99,
          setupFee: 0,
          currency: 'USD'
        },
        features: {
          speed: {
            download: 1000,
            upload: 100,
            unit: 'Mbps'
          },
          dataLimit: {
            unlimited: true
          },
          features: [
            { name: 'Priority Support', description: 'Premium 24/7 priority support', included: true },
            { name: 'Enterprise Security', description: 'Enterprise-grade security suite', included: true },
            { name: 'Gaming Optimization', description: 'Low-latency gaming mode', included: true },
            { name: 'Premium Router', description: 'High-end Wi-Fi 6 router', included: true }
          ]
        },
        availability: {
          regions: ['California', 'Nevada', 'Arizona', 'Oregon', 'Washington'],
          cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Las Vegas', 'Phoenix', 'Portland', 'Seattle']
        },
        technicalSpecs: {
          technology: 'fiber',
          latency: 2,
          reliability: 99.95,
          installation: {
            required: true,
            fee: 0,
            timeframe: 'Same day available'
          }
        },
        targetAudience: 'heavy-users',
        contractTerms: {
          minimumTerm: 12,
          earlyTerminationFee: 100,
          autoRenewal: true
        },
        createdBy: adminId,
        popularity: 95
      },
      {
        name: 'Business Essential',
        description: 'Reliable broadband solution for small businesses',
        category: 'business',
        pricing: {
          monthly: 149.99,
          yearly: 1499.99,
          setupFee: 100,
          currency: 'USD'
        },
        features: {
          speed: {
            download: 200,
            upload: 50,
            unit: 'Mbps'
          },
          dataLimit: {
            unlimited: true
          },
          features: [
            { name: 'Business Support', description: 'Dedicated business support team', included: true },
            { name: 'Static IP', description: 'Static IP address included', included: true },
            { name: 'SLA Guarantee', description: '99.9% uptime SLA', included: true },
            { name: 'Business Router', description: 'Enterprise-grade router', included: true }
          ]
        },
        availability: {
          regions: ['California', 'Nevada', 'Arizona', 'Oregon', 'Washington'],
          cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Las Vegas', 'Phoenix', 'Portland', 'Seattle']
        },
        technicalSpecs: {
          technology: 'fiber',
          latency: 3,
          reliability: 99.9,
          installation: {
            required: true,
            fee: 100,
            timeframe: '1-2 business days'
          }
        },
        targetAudience: 'businesses',
        contractTerms: {
          minimumTerm: 24,
          earlyTerminationFee: 200,
          autoRenewal: true
        },
        createdBy: adminId,
        popularity: 60
      },
      {
        name: 'Gaming Pro',
        description: 'Ultra-low latency connection optimized for professional gaming',
        category: 'residential',
        pricing: {
          monthly: 79.99,
          yearly: 799.99,
          setupFee: 0,
          currency: 'USD'
        },
        features: {
          speed: {
            download: 500,
            upload: 50,
            unit: 'Mbps'
          },
          dataLimit: {
            unlimited: true
          },
          features: [
            { name: 'Gaming Support', description: 'Specialized gaming support team', included: true },
            { name: 'Ultra-Low Latency', description: 'Sub-5ms latency guarantee', included: true },
            { name: 'Gaming Router', description: 'Gaming-optimized router', included: true },
            { name: 'Game Acceleration', description: 'Built-in game traffic prioritization', included: true }
          ]
        },
        availability: {
          regions: ['California', 'Nevada', 'Arizona'],
          cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Las Vegas', 'Phoenix']
        },
        technicalSpecs: {
          technology: 'fiber',
          latency: 1,
          reliability: 99.95,
          installation: {
            required: true,
            fee: 0,
            timeframe: '1 business day'
          }
        },
        targetAudience: 'gamers',
        contractTerms: {
          minimumTerm: 12,
          earlyTerminationFee: 80,
          autoRenewal: true
        },
        createdBy: adminId,
        popularity: 85
      }
    ];

    const createdPlans = await Plan.create(plans);
    console.log(`📋 Created ${createdPlans.length} broadband plans`);
    return createdPlans;
  } catch (error) {
    console.error('Error creating plans:', error);
    return [];
  }
};

// Create sample subscriptions
const createSubscriptions = async (customers, plans) => {
  try {
    const subscriptions = [];
    
    // Create subscriptions for each customer
    for (let i = 0; i < customers.length && i < plans.length; i++) {
      const customer = customers[i];
      const plan = plans[i];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90)); // Random start date within last 90 days
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 12); // 12-month subscription
      
      const subscription = {
        user: customer._id,
        plan: plan._id,
        status: 'active',
        startDate,
        endDate,
        billingCycle: 'monthly',
        pricing: {
          basePrice: plan.pricing.monthly,
          discountApplied: 0,
          finalPrice: plan.pricing.monthly,
          currency: plan.pricing.currency,
          taxAmount: plan.pricing.monthly * 0.08, // 8% tax
          totalAmount: plan.pricing.monthly * 1.08
        },
        installation: {
          scheduled: true,
          scheduledDate: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after start
          completed: true,
          completedDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after start
          address: customer.address
        },
        usage: {
          currentMonth: {
            dataUsed: Math.floor(Math.random() * 200) + 50, // Random usage between 50-250 GB
            lastUpdated: new Date()
          }
        },
        serviceHistory: [{
          date: startDate,
          type: 'created',
          description: 'Subscription created and activated',
          performedBy: customer._id
        }]
      };
      
      subscriptions.push(subscription);
    }

    const createdSubscriptions = await Subscription.create(subscriptions);
    console.log(`📊 Created ${createdSubscriptions.length} subscriptions`);
    return createdSubscriptions;
  } catch (error) {
    console.error('Error creating subscriptions:', error);
    return [];
  }
};

// Create sample usage analytics
const createUsageAnalytics = async (subscriptions) => {
  try {
    const usageData = [];
    
    for (const subscription of subscriptions) {
      // Create usage data for the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const usage = {
          user: subscription.user,
          subscription: subscription._id,
          date,
          metrics: {
            dataUsed: Math.floor(Math.random() * 20) + 5, // Random daily usage 5-25 GB
            speedTests: [{
              timestamp: date,
              downloadSpeed: Math.floor(Math.random() * 50) + 50, // Random speed 50-100 Mbps
              uploadSpeed: Math.floor(Math.random() * 20) + 10, // Random upload 10-30 Mbps
              latency: Math.floor(Math.random() * 10) + 5, // Random latency 5-15 ms
              location: 'Home',
              server: 'Local Test Server'
            }],
            sessionMetrics: {
              totalSessions: Math.floor(Math.random() * 10) + 5,
              avgSessionDuration: Math.floor(Math.random() * 120) + 30,
              peakUsageHours: [{
                hour: 20, // 8 PM
                dataUsed: Math.floor(Math.random() * 5) + 2
              }]
            },
            qualityMetrics: {
              uptime: 99.5 + Math.random() * 0.5, // 99.5-100% uptime
              packetLoss: Math.random() * 0.5, // 0-0.5% packet loss
              jitter: Math.random() * 5, // 0-5ms jitter
              dns_resolution_time: Math.random() * 10 + 5 // 5-15ms DNS
            }
          },
          applicationUsage: [
            {
              application: 'streaming',
              dataUsed: Math.floor(Math.random() * 8) + 2,
              duration: Math.floor(Math.random() * 180) + 60,
              qualityScore: Math.floor(Math.random() * 3) + 7 // 7-10 quality
            },
            {
              application: 'browsing',
              dataUsed: Math.floor(Math.random() * 3) + 1,
              duration: Math.floor(Math.random() * 120) + 30,
              qualityScore: Math.floor(Math.random() * 2) + 8 // 8-10 quality
            }
          ],
          networkConditions: {
            timeOfDay: i % 4 === 0 ? 'morning' : i % 4 === 1 ? 'afternoon' : i % 4 === 2 ? 'evening' : 'night',
            dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][date.getDay()],
            networkCongestion: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
          }
        };
        
        usageData.push(usage);
      }
    }

    const createdUsage = await UsageAnalytics.create(usageData);
    console.log(`📈 Created ${createdUsage.length} usage analytics records`);
    return createdUsage;
  } catch (error) {
    console.error('Error creating usage analytics:', error);
    return [];
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    await clearData();
    
    const admin = await createAdminUser();
    const customers = await createCustomers();
    const plans = await createPlans(admin._id);
    const subscriptions = await createSubscriptions(customers, plans);
    const usage = await createUsageAnalytics(subscriptions);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📝 BroadbandX Login Credentials:');
    console.log('Admin: adityautsav1901@gmail.com / admin123');
    console.log('Customer: john.doe@email.com / customer123');
    console.log('Customer: jane.smith@email.com / customer123');
    console.log('Customer: mike.johnson@email.com / customer123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };