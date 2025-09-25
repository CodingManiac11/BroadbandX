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

// User schema
const UserSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const cleanupDummyData = async () => {
  await connectDB();
  
  try {
    console.log('🧹 Cleaning up dummy data...\n');
    
    // Count current users
    const totalUsers = await User.countDocuments();
    console.log('Total users before cleanup:', totalUsers);
    
    // Delete dummy users (pattern: user1@example.com, user2@example.com, etc.)
    const dummyUserResult = await User.deleteMany({
      email: { $regex: /^user\d+@example\.com$/ }
    });
    console.log('🗑️ Deleted dummy users (userN@example.com):', dummyUserResult.deletedCount);
    
    // Delete any other example.com users except the real admin
    const exampleUsers = await User.deleteMany({
      email: { $regex: /@example\.com$/ },
      email: { $ne: 'adityautsav1901@gmail.com' }
    });
    console.log('🗑️ Deleted other example.com users:', exampleUsers.deletedCount);
    
    // Count remaining users
    const remainingUsers = await User.countDocuments();
    console.log('\nUsers remaining after cleanup:', remainingUsers);
    
    // Show breakdown by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const customerCount = await User.countDocuments({ role: 'customer' });
    
    console.log('\nUser breakdown:');
    console.log('  - Admins:', adminCount);
    console.log('  - Customers:', customerCount);
    
    // Show admin users
    const adminUsers = await User.find({ role: 'admin' }, 'email firstName lastName');
    console.log('\nAdmin users:');
    adminUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - ${user.firstName} ${user.lastName}`);
    });
    
    console.log('\n✅ Cleanup completed!');
    console.log('Now only real users from Excel dataset + your admin account should remain.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
};

cleanupDummyData();