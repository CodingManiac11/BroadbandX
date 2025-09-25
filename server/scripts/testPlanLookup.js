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

const testPlanLookup = async () => {
  await connectDB();
  
  try {
    console.log('🧪 Testing plan lookup with exact ID from price ₹29.92...');
    
    const planId = '68cae95a4cfde6248e98b502'; // The exact ID we found earlier
    
    console.log(`🔍 Looking up plan with ID: ${planId}`);
    
    // Test 1: Find by string ID (how frontend sends it)
    const planByString = await Plan.findById(planId);
    console.log('📋 Plan lookup by string ID:');
    console.log('  - Found:', !!planByString);
    if (planByString) {
      console.log('  - Name:', planByString.name);
      console.log('  - Price:', planByString.pricing.monthly);
      console.log('  - isActive:', planByString.isActive);
      console.log('  - ID type:', typeof planByString._id);
      console.log('  - ID string:', planByString._id.toString());
    }
    
    // Test 2: Find by ObjectId (how mongoose might expect it)
    const ObjectId = mongoose.Types.ObjectId;
    const planByObjectId = await Plan.findById(new ObjectId(planId));
    console.log('\n📋 Plan lookup by ObjectId:');
    console.log('  - Found:', !!planByObjectId);
    if (planByObjectId) {
      console.log('  - Same plan:', planByString?._id.equals(planByObjectId._id));
    }
    
    // Test 3: Simulate the exact backend validation
    console.log('\n🔬 Simulating backend validation:');
    const plan = await Plan.findById(planId);
    const isValid = plan && plan.isActive;
    console.log('  - Plan exists:', !!plan);
    console.log('  - Plan isActive:', plan?.isActive);
    console.log('  - Validation passes:', isValid);
    
    if (!isValid) {
      console.log('❌ Would return: Plan not found or not available');
    } else {
      console.log('✅ Would create subscription successfully');
    }
    
  } catch (error) {
    console.error('Error testing plan lookup:', error);
  } finally {
    mongoose.connection.close();
  }
};

testPlanLookup();