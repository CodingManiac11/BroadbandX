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

const updateAdminStatus = async () => {
  await connectDB();
  
  try {
    // Direct MongoDB update to add status field
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'adityautsav1901@gmail.com' },
      { $set: { status: 'active' } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const user = await mongoose.connection.db.collection('users').findOne(
      { email: 'adityautsav1901@gmail.com' }
    );
    
    console.log('Updated user status:', user.status);
    console.log('User role:', user.role);
    
  } catch (error) {
    console.error('❌ Error updating admin status:', error);
  } finally {
    mongoose.connection.close();
  }
};

updateAdminStatus();