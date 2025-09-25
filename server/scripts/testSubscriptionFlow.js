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

// Simple Plan schema (minimal)
const PlanSchema = new mongoose.Schema({
  name: String,
  category: String,
  pricing: Object,
  features: Object,
  status: String
}, { timestamps: true });

const Plan = mongoose.model('Plan', PlanSchema);

const testSubscriptionFlow = async () => {
  await connectDB();
  
  try {
    console.log('🧪 Testing the complete subscription validation flow...');
    
    // Test plan lookup with the plan that was failing
    const planId = '68cae95a4cfde6248e98b4fb'; // Premium Plan3 from logs
    
    console.log(`🔍 Looking up plan with ID: ${planId}`);
    
    const plan = await Plan.findById(planId);
    console.log('📋 Plan lookup result:');
    console.log('  - Plan found:', !!plan);
    if (plan) {
      console.log('  - Plan name:', plan.name);
      console.log('  - Plan status:', plan.status);
      console.log('  - Plan ID from DB:', plan._id);
    }
    
    // Test the exact validation logic from backend
    const isValid = plan && plan.status === 'active';
    console.log('\n🔬 Subscription validation:');
    console.log('  - Plan exists:', !!plan);
    console.log('  - Plan status === "active":', plan?.status === 'active');
    console.log('  - Validation passes:', isValid);
    
    if (!isValid) {
      console.log('❌ Would return: Plan not found or not available');
    } else {
      console.log('✅ Would create subscription successfully');
      console.log('🎉 The fix is working! Subscription creation should now succeed.');
    }
    
  } catch (error) {
    console.error('Error testing subscription flow:', error);
  } finally {
    mongoose.connection.close();
  }
};

testSubscriptionFlow();