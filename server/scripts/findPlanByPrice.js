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
  isActive: Boolean
}, { timestamps: true });

const Plan = mongoose.model('Plan', PlanSchema);

const findPlanByPrice = async () => {
  await connectDB();
  
  try {
    console.log('🔍 Looking for plan with price around ₹29.92...');
    
    const plans = await Plan.find({
      'pricing.monthly': { $gte: 29, $lte: 30 }
    }).select('_id name pricing.monthly isActive');
    
    console.log(`Found ${plans.length} plans with monthly price between ₹29-30:`);
    plans.forEach(plan => {
      console.log(`  - ID: ${plan._id}`);
      console.log(`    Name: ${plan.name}`);
      console.log(`    Price: ₹${plan.pricing.monthly}`);
      console.log(`    Active: ${plan.isActive}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error finding plan:', error);
  } finally {
    mongoose.connection.close();
  }
};

findPlanByPrice();