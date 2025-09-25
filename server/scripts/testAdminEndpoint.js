const mongoose = require('mongoose');
require('dotenv').config();

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

// Test the admin subscriptions endpoint logic
const testAdminEndpoint = async () => {
  await connectDB();
  
  try {
    console.log('🧪 Testing admin subscriptions endpoint logic...\n');
    
    // Import the models (same as the controller)
    const User = require('../models/User');
    const Plan = require('../models/Plan');
    const Subscription = require('../models/Subscription');
    
    const page = 1;
    const limit = 10;
    const status = 'all';
    const search = '';
    
    let query = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search by user email or plan name
    if (search) {
      const users = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const plans = await Plan.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { user: { $in: users.map(u => u._id) } },
        { plan: { $in: plans.map(p => p._id) } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const subscriptions = await Subscription.find(query)
      .populate('user', 'email firstName lastName')
      .populate('plan', 'name category pricing status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Subscription.countDocuments(query);
    
    console.log('📋 Admin Subscriptions API Test Results:');
    console.log('  - Total subscriptions found:', total);
    console.log('  - Subscriptions returned:', subscriptions.length);
    console.log('  - Page:', page);
    console.log('  - Limit:', limit);
    console.log('\n📝 Subscription Details:');
    
    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.user?.email || 'No email'} -> ${sub.plan?.name || 'No plan'} (${sub.status})`);
      console.log(`   Created: ${sub.createdAt}`);
      console.log(`   Amount: ₹${sub.pricing?.finalPrice || 'N/A'}`);
    });
    
    console.log('\n✅ Admin endpoint test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing admin endpoint:', error);
  } finally {
    mongoose.connection.close();
  }
};

testAdminEndpoint();