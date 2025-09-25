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
  features: Object
}, { timestamps: true });

const Plan = mongoose.model('Plan', PlanSchema);

const checkPlans = async () => {
  await connectDB();
  
  try {
    console.log('📋 Checking plans in database...');
    
    const plans = await Plan.find().limit(5);
    console.log(`Found ${plans.length} plans in database:`);
    
    plans.forEach(plan => {
      console.log(`- ID: ${plan._id}`);
      console.log(`  Name: ${plan.name}`);
      console.log(`  Category: ${plan.category}`);
      console.log(`  Price: ₹${plan.pricing?.monthly || 'N/A'}/month`);
      console.log('');
    });
    
    const totalCount = await Plan.countDocuments();
    console.log(`Total plans in database: ${totalCount}`);
    
  } catch (error) {
    console.error('Error checking plans:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkPlans();