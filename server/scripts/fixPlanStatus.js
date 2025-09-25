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
  status: String,
  isActive: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Plan = mongoose.model('Plan', PlanSchema);

const fixPlanStatus = async () => {
  await connectDB();
  
  try {
    console.log('🔄 Fixing plan status field...');
    
    // Update all plans to have status: 'active' and remove isActive field
    const result = await Plan.updateMany(
      {},  
      { 
        $set: { status: 'active' },
        $unset: { isActive: "" }  // Remove the isActive field
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} plans`);
    
    // Verify the update
    const samplePlans = await Plan.find({}).limit(5).select('name status isActive');
    console.log('\n📋 Sample plans after update:');
    samplePlans.forEach(plan => {
      console.log(`  - ${plan.name}: status=${plan.status}, isActive=${plan.isActive}`);
    });
    
    const activeCount = await Plan.countDocuments({ status: 'active' });
    console.log(`\n📊 Plans with status 'active': ${activeCount}`);
    
  } catch (error) {
    console.error('Error updating plans:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixPlanStatus();