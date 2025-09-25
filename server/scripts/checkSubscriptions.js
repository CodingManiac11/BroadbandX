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

// Define schemas
const UserSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String
}, { timestamps: true });

const PlanSchema = new mongoose.Schema({
  name: String,
  category: String,
  pricing: Object,
  features: Object,
  status: String
}, { timestamps: true });

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  status: String,
  startDate: Date,
  endDate: Date,
  billingCycle: String,
  pricing: Object
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Plan = mongoose.model('Plan', PlanSchema);
const Subscription = mongoose.model('Subscription', SubscriptionSchema);

const checkSubscriptions = async () => {
  await connectDB();
  
  try {
    console.log('🔍 Checking subscriptions for user6@example.com...\n');
    
    // Find the user
    const user = await User.findOne({ email: 'user6@example.com' });
    console.log('👤 User lookup:');
    console.log('  - User found:', !!user);
    if (user) {
      console.log('  - User ID:', user._id);
      console.log('  - User name:', user.firstName, user.lastName);
      console.log('  - User role:', user.role);
    }
    
    if (!user) {
      console.log('❌ User6@example.com not found in database');
      return;
    }
    
    // Find subscriptions for this user
    const subscriptions = await Subscription.find({ user: user._id })
      .populate('user', 'email firstName lastName')
      .populate('plan', 'name category pricing status');
    
    console.log('\n📋 Subscription lookup:');
    console.log('  - Subscriptions found:', subscriptions.length);
    
    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found for user6@example.com');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`\n📝 Subscription ${index + 1}:`);
        console.log('  - Subscription ID:', sub._id);
        console.log('  - Plan:', sub.plan?.name);
        console.log('  - Status:', sub.status);
        console.log('  - Billing Cycle:', sub.billingCycle);
        console.log('  - Start Date:', sub.startDate);
        console.log('  - End Date:', sub.endDate);
        console.log('  - Final Price:', sub.pricing?.finalPrice);
        console.log('  - Created:', sub.createdAt);
      });
    }
    
    // Check all subscriptions in database
    const allSubscriptions = await Subscription.find({})
      .populate('user', 'email firstName lastName')
      .populate('plan', 'name category');
    
    console.log(`\n📊 Total subscriptions in database: ${allSubscriptions.length}`);
    allSubscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.user?.email} -> ${sub.plan?.name} (${sub.status})`);
    });
    
  } catch (error) {
    console.error('Error checking subscriptions:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkSubscriptions();