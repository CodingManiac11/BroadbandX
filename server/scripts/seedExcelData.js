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

// Your actual user data from Excel
const userData = [
  { id: 1, name: 'User1', phone: '1234567801', email: 'user1@example.com', status: 'active' },
  { id: 2, name: 'User2', phone: '1234567802', email: 'user2@example.com', status: 'inactive' },
  { id: 3, name: 'User3', phone: '1234567803', email: 'user3@example.com', status: 'inactive' },
  { id: 4, name: 'User4', phone: '1234567804', email: 'user4@example.com', status: 'active' },
  { id: 5, name: 'User5', phone: '1234567805', email: 'user5@example.com', status: 'inactive' },
  { id: 6, name: 'User6', phone: '1234567806', email: 'user6@example.com', status: 'active' },
  { id: 7, name: 'User7', phone: '1234567807', email: 'user7@example.com', status: 'inactive' },
  { id: 8, name: 'User8', phone: '1234567808', email: 'user8@example.com', status: 'inactive' },
  { id: 9, name: 'User9', phone: '1234567809', email: 'user9@example.com', status: 'active' },
  { id: 10, name: 'User10', phone: '1234567810', email: 'user10@example.com', status: 'active' }
];

// Your actual plan data from Excel
const planData = [
  { id: 1, name: 'Plan1', price: 57.65, autoRenewal: false, status: 'Active' },
  { id: 2, name: 'Plan2', price: 15.3, autoRenewal: true, status: 'Active' },
  { id: 3, name: 'Plan3', price: 73.86, autoRenewal: true, status: 'Active' },
  { id: 4, name: 'Plan4', price: 27.82, autoRenewal: true, status: 'Active' },
  { id: 5, name: 'Plan5', price: 42.58, autoRenewal: true, status: 'Active' },
  { id: 6, name: 'Plan6', price: 95.36, autoRenewal: false, status: 'Active' },
  { id: 7, name: 'Plan7', price: 23.3, autoRenewal: true, status: 'Active' },
  { id: 8, name: 'Plan8', price: 86.42, autoRenewal: true, status: 'Active' },
  { id: 9, name: 'Plan9', price: 96.42, autoRenewal: true, status: 'Active' },
  { id: 10, name: 'Plan10', price: 29.92, autoRenewal: false, status: 'Active' },
  { id: 11, name: 'Plan11', price: 60.47, autoRenewal: true, status: 'Active' },
  { id: 12, name: 'Plan12', price: 73.63, autoRenewal: false, status: 'Active' },
  { id: 13, name: 'Plan13', price: 22.09, autoRenewal: true, status: 'Active' }
];

// Your actual subscription data from Excel
const subscriptionData = [
  { id: 1, type: 'monthly', productId: 46, userId: 61, status: 'PAUSED', startDate: '2024-04-20', lastBilledDate: '2024-01-20', lastRenewedDate: '2024-09-06', graceTime: 5 },
  { id: 2, type: 'monthly', productId: 35, userId: 37, status: 'active', startDate: '2024-08-24', lastBilledDate: '2024-03-19', lastRenewedDate: '2024-10-29', graceTime: 5 },
  { id: 3, type: 'monthly', productId: 96, userId: 24, status: 'active', startDate: '2024-01-26', lastBilledDate: '2023-12-10', lastRenewedDate: '2024-09-04', graceTime: 5 },
  { id: 4, type: 'monthly', productId: 79, userId: 69, status: 'active', startDate: '2024-07-31', lastBilledDate: '2024-11-21', lastRenewedDate: '2024-07-30', graceTime: 5 },
  { id: 5, type: 'monthly', productId: 52, userId: 3, status: 'active', startDate: '2024-07-23', lastBilledDate: '2024-04-05', lastRenewedDate: '2024-10-08', graceTime: 5 },
  { id: 6, type: 'monthly', productId: 33, userId: 86, status: 'active', startDate: '2024-05-11', lastBilledDate: '2024-09-08', lastRenewedDate: '2024-10-05', graceTime: 5 }
];

// Your billing data from Excel
const billingData = [
  { id: 1, subscriptionId: 54, amount: 308.56, billingDate: '2024-01-04', paymentStatus: 'paid' },
  { id: 2, subscriptionId: 52, amount: 200.11, billingDate: '2024-05-26', paymentStatus: 'paid' },
  { id: 3, subscriptionId: 6, amount: 407.49, billingDate: '2024-06-24', paymentStatus: 'paid' },
  { id: 4, subscriptionId: 100, amount: 289.68, billingDate: '2024-04-09', paymentStatus: 'pending' },
  { id: 5, subscriptionId: 16, amount: 114.07, billingDate: '2024-11-22', paymentStatus: 'pending' },
  { id: 6, subscriptionId: 24, amount: 411.41, billingDate: '2024-11-26', paymentStatus: 'paid' },
  { id: 7, subscriptionId: 97, amount: 194.83, billingDate: '2024-08-27', paymentStatus: 'failed' },
  { id: 8, subscriptionId: 17, amount: 32.64, billingDate: '2024-09-13', paymentStatus: 'pending' },
  { id: 9, subscriptionId: 10, amount: 336.98, billingDate: '2024-09-12', paymentStatus: 'pending' },
  { id: 10, subscriptionId: 63, amount: 376.25, billingDate: '2023-12-02', paymentStatus: 'pending' },
  { id: 11, subscriptionId: 86, amount: 493.15, billingDate: '2024-06-26', paymentStatus: 'failed' },
  { id: 12, subscriptionId: 51, amount: 10.43, billingDate: '2024-07-02', paymentStatus: 'paid' },
  { id: 13, subscriptionId: 85, amount: 463.86, billingDate: '2024-02-12', paymentStatus: 'failed' },
  { id: 14, subscriptionId: 18, amount: 84.45, billingDate: '2024-08-08', paymentStatus: 'failed' },
  { id: 15, subscriptionId: 74, amount: 110.86, billingDate: '2024-07-24', paymentStatus: 'failed' }
];

// Create admin user
const createAdminUser = async () => {
  try {
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@broadbandx.com',
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

// Create users from your Excel data
const createUsersFromExcel = async () => {
  try {
    const users = [];
    const userMap = new Map(); // To store user ID mapping
    
    for (const userRecord of userData) {
      // Split name into first and last name
      const nameParts = userRecord.name.split(/(\d+)/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts[1] || userRecord.id.toString();
      
      const userData = {
        firstName,
        lastName,
        email: userRecord.email,
        password: 'user12345', // Default password for all users
        phone: `+${userRecord.phone}`,
        address: {
          street: `${userRecord.id}00 Main St`,
          city: 'User City',
          state: 'CA',
          zipCode: `9000${userRecord.id % 10}`,
          country: 'USA'
        },
        role: 'customer',
        status: userRecord.status,
        emailVerified: true,
        externalId: userRecord.id // Store original ID for reference
      };

      const createdUser = await User.create(userData);
      userMap.set(userRecord.id, createdUser._id);
      users.push(createdUser);
    }

    console.log(`👥 Created ${users.length} users from Excel data`);
    return { users, userMap };
  } catch (error) {
    console.error('Error creating users:', error);
    return { users: [], userMap: new Map() };
  }
};

// Create plans from your Excel data
const createPlansFromExcel = async (adminId) => {
  try {
    const plans = [];
    const planMap = new Map(); // To store plan ID mapping
    
    for (const planRecord of planData) {
      // Generate realistic broadband plan details based on price
      const speed = planRecord.price < 30 ? 25 : planRecord.price < 60 ? 100 : planRecord.price < 80 ? 500 : 1000;
      const isUnlimited = planRecord.price > 50;
      
      const planData = {
        name: planRecord.name,
        description: `Broadband plan with ${speed} Mbps speed - ${planRecord.name}`,
        category: planRecord.price > 80 ? 'business' : 'residential',
        pricing: {
          monthly: planRecord.price,
          yearly: Math.round(planRecord.price * 10), // 10 months price for yearly
          setupFee: planRecord.price > 80 ? 100 : 0,
          currency: 'USD'
        },
        features: {
          speed: {
            download: speed,
            upload: Math.round(speed * 0.2),
            unit: 'Mbps'
          },
          dataLimit: {
            amount: isUnlimited ? undefined : Math.round(speed * 10),
            unit: isUnlimited ? undefined : 'GB',
            unlimited: isUnlimited
          },
          features: [
            { name: 'Email Support', description: '24/7 email support', included: true },
            { name: 'Basic Security', description: 'Basic malware protection', included: true }
          ]
        },
        availability: {
          regions: ['California', 'Nevada', 'Arizona'],
          cities: ['Los Angeles', 'San Francisco', 'San Diego']
        },
        technicalSpecs: {
          technology: speed >= 500 ? 'fiber' : 'cable',
          latency: speed >= 500 ? 5 : 20,
          reliability: 99.5,
          installation: {
            required: true,
            fee: planRecord.price > 80 ? 100 : 50,
            timeframe: '2-3 business days'
          }
        },
        targetAudience: planRecord.price < 30 ? 'light-users' : planRecord.price < 60 ? 'moderate-users' : 'heavy-users',
        contractTerms: {
          minimumTerm: 12,
          earlyTerminationFee: Math.round(planRecord.price * 2),
          autoRenewal: planRecord.autoRenewal
        },
        createdBy: adminId,
        isActive: planRecord.status === 'Active',
        popularity: Math.floor(Math.random() * 100) + 50,
        externalId: planRecord.id // Store original ID for reference
      };

      const createdPlan = await Plan.create(planData);
      planMap.set(planRecord.id, createdPlan._id);
      plans.push(createdPlan);
    }

    console.log(`📋 Created ${plans.length} plans from Excel data`);
    return { plans, planMap };
  } catch (error) {
    console.error('Error creating plans:', error);
    return { plans: [], planMap: new Map() };
  }
};

// Create subscriptions from your Excel data
const createSubscriptionsFromExcel = async (userMap, planMap) => {
  try {
    const subscriptions = [];
    
    for (const subRecord of subscriptionData) {
      // Get available users and plans
      const userIds = Array.from(userMap.values());
      const planIds = Array.from(planMap.values());
      
      if (userIds.length === 0 || planIds.length === 0) {
        console.log('Skipping subscription creation - no users or plans available');
        continue;
      }
      
      // Use modulo to cycle through available users and plans
      const userId = userIds[(subRecord.id - 1) % userIds.length];
      const planId = planIds[(subRecord.productId - 1) % planIds.length];
      
      const subscriptionData = {
        user: userId,
        plan: planId,
        status: subRecord.status.toLowerCase() === 'paused' ? 'suspended' : subRecord.status.toLowerCase(),
        startDate: new Date(subRecord.startDate),
        endDate: new Date(new Date(subRecord.startDate).setFullYear(new Date(subRecord.startDate).getFullYear() + 1)),
        billingCycle: subRecord.type,
        pricing: {
          basePrice: Math.random() * 100 + 20, // Random price for now
          discountApplied: 0,
          finalPrice: Math.random() * 100 + 20,
          currency: 'USD',
          taxAmount: Math.random() * 10 + 2,
          totalAmount: Math.random() * 110 + 22
        },
        installation: {
          scheduled: true,
          scheduledDate: new Date(subRecord.startDate),
          completed: true,
          completedDate: new Date(subRecord.startDate),
          address: {
            street: '123 User St',
            city: 'User City',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          }
        },
        usage: {
          currentMonth: {
            dataUsed: Math.floor(Math.random() * 200) + 50,
            lastUpdated: new Date()
          }
        },
        serviceHistory: [{
          date: new Date(subRecord.startDate),
          type: 'created',
          description: 'Subscription created from Excel data',
          performedBy: userId
        }],
        externalId: subRecord.id // Store original ID for reference
      };

      const createdSubscription = await Subscription.create(subscriptionData);
      subscriptions.push(createdSubscription);
    }

    console.log(`📊 Created ${subscriptions.length} subscriptions from Excel data`);
    return subscriptions;
  } catch (error) {
    console.error('Error creating subscriptions:', error);
    return [];
  }
};

// Main seeding function
const seedWithExcelData = async () => {
  try {
    console.log('🌱 Starting database seeding with Excel data...');
    
    await connectDB();
    await clearData();
    
    const admin = await createAdminUser();
    const { users, userMap } = await createUsersFromExcel();
    const { plans, planMap } = await createPlansFromExcel(admin._id);
    const subscriptions = await createSubscriptionsFromExcel(userMap, planMap);
    
    console.log('✅ Database seeding with Excel data completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@broadbandx.com / admin123');
    console.log('Users: user1@example.com to user10@example.com / user12345');
    console.log('\n📊 Data Summary:');
    console.log(`- ${users.length} users imported`);
    console.log(`- ${plans.length} plans imported`);
    console.log(`- ${subscriptions.length} subscriptions imported`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database with Excel data:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedWithExcelData();
}

module.exports = { seedWithExcelData };