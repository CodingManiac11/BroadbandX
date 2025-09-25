const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
require('dotenv').config();

const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const userCount = await User.countDocuments();
    const planCount = await Plan.countDocuments();
    const subscriptionCount = await Subscription.countDocuments();
    
    console.log('\n📊 Database Counts:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Plans: ${planCount}`);
    console.log(`- Subscriptions: ${subscriptionCount}`);
    
    console.log('\n👥 Sample Users:');
    const users = await User.find({}, 'firstName lastName email').limit(10);
    users.forEach((user, index) => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    console.log('\n📋 Last 5 Users:');
    const lastUsers = await User.find({}, 'firstName lastName email').sort({_id: -1}).limit(5);
    lastUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    // Check user emails to confirm range
    const firstUser = await User.findOne({email: 'user1@example.com'}, 'firstName lastName email');
    const lastUser = await User.findOne({email: 'user100@example.com'}, 'firstName lastName email');
    console.log(`\n🔢 First user: ${firstUser ? firstUser.email : 'Not found'}`);
    console.log(`🔢 Last user: ${lastUser ? lastUser.email : 'Not found'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkDatabase();