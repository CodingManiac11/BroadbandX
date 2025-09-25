const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('../models/User');
const Plan = require('../models/Plan');

// Load extracted Excel data
const dataPath = path.join(__dirname, 'extracted-dataset.json');
const excelData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subscription-management');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Transform Excel plan data to our Plan schema
const transformPlans = (planData) => {
  const plans = [];
  const headers = planData[0]; // First row contains headers
  
  // Skip header row and process data
  for (let i = 1; i < planData.length; i++) {
    const row = planData[i];
    if (!row || row.length === 0) continue;
    
    const [productId, name, price, autoRenewal, status] = row;
    
    // Create different plan types with realistic features
    const planTypes = ['Basic', 'Standard', 'Premium', 'Enterprise'];
    const speeds = [
      { download: 25, upload: 5, unit: 'Mbps' },
      { download: 100, upload: 20, unit: 'Mbps' },
      { download: 200, upload: 50, unit: 'Mbps' },
      { download: 500, upload: 100, unit: 'Mbps' }
    ];
    
    const dataLimits = [
      { unlimited: false, amount: 100, unit: 'GB' },
      { unlimited: false, amount: 500, unit: 'GB' },
      { unlimited: true, amount: 0, unit: 'GB' },
      { unlimited: true, amount: 0, unit: 'GB' }
    ];
    
    const typeIndex = (productId - 1) % planTypes.length;
    
    const plan = {
      name: `${planTypes[typeIndex]} ${name}`,
      description: `${planTypes[typeIndex]} broadband plan with excellent features`,
      type: 'broadband',
      category: typeIndex === 0 ? 'residential' : typeIndex === 3 ? 'enterprise' : 'business',
      pricing: {
        monthly: Math.round(price * 100) / 100, // Round to 2 decimal places
        setup: typeIndex === 0 ? 0 : Math.round(price * 0.1 * 100) / 100,
        currency: 'INR'
      },
      features: {
        speed: speeds[typeIndex],
        dataLimit: dataLimits[typeIndex],
        connectionType: typeIndex < 2 ? 'fiber' : 'dedicated',
        staticIP: typeIndex > 1,
        support: typeIndex === 0 ? '24/7 online' : '24/7 phone + online',
        installation: typeIndex === 0 ? 'self' : 'professional'
      },
      // Required fields
      technicalSpecs: {
        technology: typeIndex < 2 ? 'fiber' : 'cable',
        latency: typeIndex === 0 ? 20 : 10,
        reliability: typeIndex === 0 ? 99.5 : 99.9,
        installation: {
          required: typeIndex !== 0,
          fee: typeIndex === 0 ? 0 : Math.round(price * 0.1),
          timeframe: '2-5 business days'
        }
      },
      targetAudience: ['light-users', 'moderate-users', 'heavy-users', 'businesses'][typeIndex],
      contractTerms: {
        minimumTerm: typeIndex === 3 ? 12 : 1, // months
        autoRenewal: autoRenewal === 'Yes',
        earlyTerminationFee: typeIndex === 3 ? price : 0
      },
      createdBy: null, // Will be set to admin user after creation
      benefits: [
        'High-speed internet',
        'Reliable connection',
        typeIndex > 0 ? 'Priority support' : 'Standard support',
        typeIndex > 1 ? 'Static IP included' : 'Dynamic IP',
        typeIndex === 3 ? 'Dedicated bandwidth' : 'Shared bandwidth'
      ].filter(Boolean),
      limitations: typeIndex === 0 ? ['Data caps apply', 'No static IP'] : [],
      availability: {
        regions: ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad'],
        serviceAreas: ['urban', 'suburban']
      },
      status: status.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    plans.push(plan);
  }
  
  return plans;
};

// Transform Excel user data to our User schema
const transformUsers = (userData) => {
  const users = [];
  const headers = userData[0]; // First row contains headers
  
  // Skip header row and process data
  for (let i = 1; i < userData.length; i++) {
    const row = userData[i];
    if (!row || row.length === 0) continue;
    
    const [userId, name, phone, email, status] = row;
    
    // Create different user types
    const roles = ['customer', 'admin'];
    const isAdmin = userId <= 5; // First 5 users are admins
    
    const user = {
      firstName: name.split(' ')[0] || name, // First word as firstName
      lastName: name.split(' ').slice(1).join(' ') || 'User', // Rest as lastName
      email: email,
      phone: phone,
      password: '$2a$10$placeholder', // Will be hashed properly below
      address: {
        street: `${userId} Main Street`,
        city: ['Delhi', 'Mumbai', 'Bangalore', 'Chennai'][userId % 4],
        state: ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu'][userId % 4],
        zipCode: `${110000 + userId}`,
        country: 'India'
      },
      role: isAdmin ? 'admin' : 'customer',
      status: status.toLowerCase(),
      profile: {
        preferences: {
          notifications: {
            email: true,
            sms: status === 'active',
            push: true
          },
          language: 'en',
          timezone: 'Asia/Kolkata'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    users.push(user);
  }
  
  return users;
};

// Hash passwords for users
const hashPasswords = async (users) => {
  for (const user of users) {
    // Default password for demo: password123
    const hashedPassword = await bcrypt.hash('password123', 10);
    user.password = hashedPassword;
  }
  return users;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Plan.deleteMany({});
    
    // Transform and seed users first
    console.log('Seeding users...');
    let users = transformUsers(excelData.User_Data);
    users = await hashPasswords(users);
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Seeded ${insertedUsers.length} users`);
    
    // Get the first admin user for createdBy field
    const adminUser = insertedUsers.find(user => user.role === 'admin');
    
    // Transform and seed plans
    console.log('Seeding plans...');
    const plans = transformPlans(excelData.Subscription_Plans);
    // Set createdBy field to admin user
    plans.forEach(plan => {
      plan.createdBy = adminUser._id;
    });
    await Plan.insertMany(plans);
    console.log(`✅ Seeded ${plans.length} plans`);
    
    // Display summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('-------------------------------------------');
    console.log(`📊 Data Summary:`);
    console.log(`   Users: ${insertedUsers.length} (${insertedUsers.filter(u => u.role === 'admin').length} admins, ${insertedUsers.filter(u => u.role === 'customer').length} customers)`);
    console.log(`   Plans: ${plans.length} (${plans.filter(p => p.status === 'active').length} active)`);
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Admin: user1@example.com / password123');
    console.log('   Customer: user6@example.com / password123');
    console.log('   (All users have password: password123)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding
if (require.main === module) {
  require('dotenv').config();
  seedDatabase();
}

module.exports = { seedDatabase, transformPlans, transformUsers };