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

const activateAllPlans = async () => {
  await connectDB();
  
  try {
    console.log('🔄 Updating all plans to active status...');
    
    const result = await Plan.updateMany(
      {},  // Update all plans
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} plans to active status`);
    
    // Verify the update
    const activeCount = await Plan.countDocuments({ isActive: true });
    console.log(`📊 Active plans now: ${activeCount}`);
    
  } catch (error) {
    console.error('Error updating plans:', error);
  } finally {
    mongoose.connection.close();
  }
};

activateAllPlans();