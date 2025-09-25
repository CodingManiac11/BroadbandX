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

const checkPlanStatus = async () => {
  await connectDB();
  
  try {
    console.log('📋 Checking plan status in database...');
    
    const plans = await Plan.find().limit(5);
    console.log(`Found ${plans.length} plans in database:`);
    
    plans.forEach(plan => {
      console.log(`- ID: ${plan._id}`);
      console.log(`  Name: ${plan.name}`);
      console.log(`  Category: ${plan.category}`);
      console.log(`  Price: ₹${plan.pricing?.monthly || 'N/A'}/month`);
      console.log(`  isActive: ${plan.isActive}`);
      console.log('');
    });
    
    const activeCount = await Plan.countDocuments({ isActive: true });
    const inactiveCount = await Plan.countDocuments({ isActive: false });
    const totalCount = await Plan.countDocuments();
    
    console.log(`📊 Plan Status Summary:`);
    console.log(`Total plans: ${totalCount}`);
    console.log(`Active plans: ${activeCount}`);
    console.log(`Inactive plans: ${inactiveCount}`);
    
  } catch (error) {
    console.error('Error checking plans:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkPlanStatus();