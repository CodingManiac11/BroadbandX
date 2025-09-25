const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const path = require('path');
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

// Read Excel file and extract all worksheets
const readExcelFile = () => {
  try {
    const excelPath = path.join(__dirname, '../../SubscriptionUseCase_Dataset.xlsx');
    console.log('📖 Reading Excel file from:', excelPath);
    
    const workbook = XLSX.readFile(excelPath);
    const worksheetNames = workbook.SheetNames;
    console.log('📋 Found worksheets:', worksheetNames);
    
    const data = {};
    
    worksheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      data[sheetName] = jsonData;
      console.log(`📊 Sheet "${sheetName}": ${jsonData.length} records`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error reading Excel file:', error);
    return null;
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'adityautsav1901@gmail.com',
      password: 'demon',
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
    return null;
  }
};

// Import users from Excel
const importUsers = async (userData) => {
  try {
    if (!userData || userData.length === 0) {
      console.log('⚠️ No user data found in Excel');
      return { users: [], userMap: new Map() };
    }

    const users = [];
    const userMap = new Map();
    
    console.log('👥 Importing users...');
    console.log('Sample user data:', userData[0]);
    
    for (const userRecord of userData) {
      // Extract user information from Excel columns
      const name = userRecord.Name || userRecord.name || `User${userRecord['User Id'] || users.length + 1}`;
      const nameParts = name.split(/(\d+)/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts[1] || userRecord['User Id']?.toString() || (users.length + 1).toString();
      
      const email = userRecord.Email || userRecord.email || `user${userRecord['User Id'] || users.length + 1}@example.com`;
      const phone = userRecord.Phone || userRecord.phone || userRecord.phoneNumber || `+1234567${String(userRecord['User Id'] || users.length + 1).padStart(3, '0')}`;
      const status = userRecord.Status || userRecord.status || 'active';
      
      const userData = {
        firstName: firstName.toString(),
        lastName: lastName.toString(),
        email: email.toString(),
        password: 'user12345', // Default password
        phone: phone.toString(),
        address: {
          street: userRecord.address || `${userRecord['User Id'] || users.length + 1}00 Main St`,
          city: userRecord.city || 'User City',
          state: userRecord.state || 'CA',
          zipCode: userRecord.zipCode || `9000${(userRecord['User Id'] || users.length + 1) % 10}`,
          country: userRecord.country || 'USA'
        },
        role: 'customer',
        status: status.toLowerCase(),
        emailVerified: true,
        externalId: userRecord['User Id'] || userRecord.ID || users.length + 1
      };

      try {
        const createdUser = await User.create(userData);
        userMap.set(userRecord['User Id'] || userRecord.ID || users.length + 1, createdUser._id);
        users.push(createdUser);
      } catch (error) {
        console.error(`Error creating user ${email}:`, error.message);
      }
    }

    console.log(`✅ Created ${users.length} users from Excel data`);
    return { users, userMap };
  } catch (error) {
    console.error('Error importing users:', error);
    return { users: [], userMap: new Map() };
  }
};

// Import plans from Excel
const importPlans = async (planData, adminId) => {
  try {
    if (!planData || planData.length === 0) {
      console.log('⚠️ No plan data found in Excel');
      return { plans: [], planMap: new Map() };
    }

    const plans = [];
    const planMap = new Map();
    
    console.log('📋 Importing plans...');
    console.log('Sample plan data:', planData[0]);
    
    for (const planRecord of planData) {
      const planName = planRecord.Name || planRecord.name || planRecord.planName || `Plan${planRecord['Product Id'] || plans.length + 1}`;
      const price = parseFloat(planRecord.Price || planRecord.price || planRecord.monthlyPrice || 29.99);
      const autoRenewal = planRecord['Auto Renewal Allowed'] === 'Yes' || planRecord.autoRenewal === true;
      const status = planRecord.Status || planRecord.status || 'Active';
      
      // Generate realistic broadband plan details based on price
      const speed = price < 30 ? 25 : price < 60 ? 100 : price < 80 ? 500 : 1000;
      const isUnlimited = price > 50;
      
      const planData = {
        name: planName.toString(),
        description: planRecord.description || `Broadband plan with ${speed} Mbps speed - ${planName}`,
        category: price > 80 ? 'business' : 'residential',
        pricing: {
          monthly: price,
          yearly: Math.round(price * 10), // 10 months price for yearly
          setupFee: price > 80 ? 100 : 0,
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
            fee: price > 80 ? 100 : 50,
            timeframe: '2-3 business days'
          }
        },
        targetAudience: price < 30 ? 'light-users' : price < 60 ? 'moderate-users' : 'heavy-users',
        contractTerms: {
          minimumTerm: 12,
          earlyTerminationFee: Math.round(price * 2),
          autoRenewal: autoRenewal
        },
        createdBy: adminId,
        isActive: status.toLowerCase() === 'active',
        popularity: Math.floor(Math.random() * 100) + 50,
        externalId: planRecord['Product Id'] || planRecord.ID || plans.length + 1
      };

      try {
        const createdPlan = await Plan.create(planData);
        planMap.set(planRecord['Product Id'] || planRecord.ID || plans.length + 1, createdPlan._id);
        plans.push(createdPlan);
      } catch (error) {
        console.error(`Error creating plan ${planName}:`, error.message);
      }
    }

    console.log(`✅ Created ${plans.length} plans from Excel data`);
    return { plans, planMap };
  } catch (error) {
    console.error('Error importing plans:', error);
    return { plans: [], planMap: new Map() };
  }
};

// Import subscriptions from Excel
const importSubscriptions = async (subscriptionData, userMap, planMap) => {
  try {
    if (!subscriptionData || subscriptionData.length === 0) {
      console.log('⚠️ No subscription data found in Excel');
      return [];
    }

    const subscriptions = [];
    
    console.log('📊 Importing subscriptions...');
    console.log('Sample subscription data:', subscriptionData[0]);
    
    for (const subRecord of subscriptionData) {
      try {
        // Map subscription to actual users and plans from Excel data
        const userId = userMap.get(subRecord['User Id']);
        const planId = planMap.get(subRecord['Product Id']);
        
        if (!userId || !planId) {
          console.log(`Skipping subscription ${subRecord['Subscription Id']} - missing user (${subRecord['User Id']}) or plan (${subRecord['Product Id']})`);
          continue;
        }
        
        const status = (subRecord.Status || 'active').toLowerCase();
        const startDate = new Date(subRecord['Start Date'] || new Date());
        const billingCycle = subRecord['Subscription Type'] || 'monthly';
        
        const subscriptionData = {
          user: userId,
          plan: planId,
          status: status === 'paused' ? 'suspended' : status,
          startDate: startDate,
          endDate: new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 1)),
          billingCycle: billingCycle,
          pricing: {
            basePrice: Math.random() * 100 + 20, // We'll update this with billing data later
            discountApplied: 0,
            finalPrice: Math.random() * 100 + 20,
            currency: 'USD',
            taxAmount: Math.random() * 10 + 2,
            totalAmount: Math.random() * 100 + 20 + Math.random() * 10 + 2
          },
          billingHistory: {
            lastBilledDate: subRecord['Last Billed Date'] ? new Date(subRecord['Last Billed Date']) : startDate,
            lastRenewedDate: subRecord['Last Renewed Date'] ? new Date(subRecord['Last Renewed Date']) : startDate,
            graceTime: subRecord['Grace Time'] || 5
          },
          installation: {
            scheduled: true,
            scheduledDate: startDate,
            completed: true,
            completedDate: startDate,
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
            date: startDate,
            type: 'created',
            description: 'Subscription created from Excel data',
            performedBy: userId
          }],
          externalId: subRecord['Subscription Id']
        };

        const createdSubscription = await Subscription.create(subscriptionData);
        subscriptions.push(createdSubscription);
      } catch (error) {
        console.error(`Error creating subscription ${subRecord['Subscription Id']}:`, error.message);
      }
    }

    console.log(`✅ Created ${subscriptions.length} subscriptions from Excel data`);
    return subscriptions;
  } catch (error) {
    console.error('Error importing subscriptions:', error);
    return [];
  }
};

// Import usage analytics from Excel (if available)
const importUsageAnalytics = async (usageData, userMap) => {
  try {
    if (!usageData || usageData.length === 0) {
      console.log('⚠️ No usage analytics data found in Excel');
      return [];
    }

    const analytics = [];
    const userIds = Array.from(userMap.values());
    
    console.log('📈 Importing usage analytics...');
    console.log('Sample usage data:', usageData[0]);
    
    for (const usageRecord of usageData) {
      try {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        
        const analyticsData = {
          user: userId,
          date: new Date(usageRecord.date || usageRecord.Date || new Date()),
          dataUsage: {
            download: parseFloat(usageRecord.download || usageRecord.downloadGB || Math.random() * 100),
            upload: parseFloat(usageRecord.upload || usageRecord.uploadGB || Math.random() * 20),
            total: parseFloat(usageRecord.total || usageRecord.totalGB || Math.random() * 120)
          },
          sessionMetrics: {
            sessions: parseInt(usageRecord.sessions || Math.floor(Math.random() * 50) + 1),
            averageSessionDuration: parseInt(usageRecord.duration || Math.floor(Math.random() * 180) + 30),
            peakUsageHour: parseInt(usageRecord.peakHour || Math.floor(Math.random() * 24))
          },
          deviceInfo: {
            deviceType: usageRecord.deviceType || 'unknown',
            osType: usageRecord.osType || 'unknown',
            browserType: usageRecord.browserType || 'unknown'
          },
          location: {
            city: usageRecord.city || 'Unknown',
            state: usageRecord.state || 'CA',
            country: usageRecord.country || 'USA'
          }
        };

        const createdAnalytics = await UsageAnalytics.create(analyticsData);
        analytics.push(createdAnalytics);
      } catch (error) {
        console.error(`Error creating usage analytics:`, error.message);
      }
    }

    console.log(`✅ Created ${analytics.length} usage analytics records from Excel data`);
    return analytics;
  } catch (error) {
    console.error('Error importing usage analytics:', error);
    return [];
  }
};

// Main import function
const importExcelData = async () => {
  try {
    console.log('🚀 Starting Excel data import...');
    
    await connectDB();
    await clearData();
    
    // Read Excel file
    const excelData = readExcelFile();
    if (!excelData) {
      console.error('❌ Failed to read Excel file');
      process.exit(1);
    }
    
    console.log('\n📋 Available worksheets:', Object.keys(excelData));
    
    // Create admin user
    const admin = await createAdminUser();
    
    // Import data from different worksheets
    // Try to identify worksheets by common names
    let userData = null;
    let planData = null;
    let subscriptionData = null;
    let usageData = null;
    let billingData = null;
    
    // Look for user data
    for (const [sheetName, data] of Object.entries(excelData)) {
      const lowerSheetName = sheetName.toLowerCase();
      if (lowerSheetName.includes('user_data') || lowerSheetName.includes('user')) {
        userData = data;
        console.log(`📝 Using "${sheetName}" for user data`);
      } else if (lowerSheetName.includes('subscription_plans') || lowerSheetName.includes('plan')) {
        planData = data;
        console.log(`📝 Using "${sheetName}" for plan data`);
      } else if (lowerSheetName === 'subscriptions') {
        subscriptionData = data;
        console.log(`📝 Using "${sheetName}" for subscription data`);
      } else if (lowerSheetName.includes('subscription_logs') || lowerSheetName.includes('logs')) {
        usageData = data;
        console.log(`📝 Using "${sheetName}" for usage logs data`);
      } else if (lowerSheetName.includes('billing') || lowerSheetName.includes('payment')) {
        billingData = data;
        console.log(`📝 Using "${sheetName}" for billing data`);
      }
    }
    
    // If no specific sheets found, use the first few sheets
    const sheetNames = Object.keys(excelData);
    if (!userData && sheetNames.length > 0) userData = excelData[sheetNames[0]];
    if (!planData && sheetNames.length > 1) planData = excelData[sheetNames[1]];
    if (!subscriptionData && sheetNames.length > 2) subscriptionData = excelData[sheetNames[2]];
    if (!usageData && sheetNames.length > 3) usageData = excelData[sheetNames[3]];
    if (!billingData && sheetNames.length > 4) billingData = excelData[sheetNames[4]];
    
    // Import data
    const { users, userMap } = await importUsers(userData);
    const { plans, planMap } = await importPlans(planData, admin._id);
    const subscriptions = await importSubscriptions(subscriptionData, userMap, planMap);
    const analytics = await importUsageAnalytics(usageData, userMap);
    
    console.log('\n✅ Excel data import completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: adityautsav1901@gmail.com / demon');
    console.log('Users: Check the imported user emails / user12345');
    console.log('\n📊 Data Summary:');
    console.log(`- ${users.length} users imported`);
    console.log(`- ${plans.length} plans imported`);
    console.log(`- ${subscriptions.length} subscriptions imported`);
    console.log(`- ${analytics.length} usage analytics imported`);
    
    // Display sample data
    if (users.length > 0) {
      console.log('\n👤 Sample user:', {
        email: users[0].email,
        name: `${users[0].firstName} ${users[0].lastName}`,
        status: users[0].status
      });
    }
    
    if (plans.length > 0) {
      console.log('\n📋 Sample plan:', {
        name: plans[0].name,
        price: plans[0].pricing.monthly,
        speed: plans[0].features.speed.download
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing Excel data:', error);
    process.exit(1);
  }
};

// Run import if this file is executed directly
if (require.main === module) {
  importExcelData();
}

module.exports = { importExcelData };