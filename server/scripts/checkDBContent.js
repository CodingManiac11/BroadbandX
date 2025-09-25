const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkDatabaseData = async () => {
  await connectDB();
  
  try {
    console.log('🔍 Checking database data...\n');
    
    // Count all users
    const totalUsers = await mongoose.connection.db.collection('users').countDocuments();
    console.log('Total users in database:', totalUsers);
    
    // Count users by role
    const usersByRole = await mongoose.connection.db.collection('users').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Users by role:', usersByRole);
    
    // Count users by status
    const usersByStatus = await mongoose.connection.db.collection('users').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Users by status:', usersByStatus);
    
    // Count all subscriptions
    const totalSubscriptions = await mongoose.connection.db.collection('subscriptions').countDocuments();
    console.log('\nTotal subscriptions in database:', totalSubscriptions);
    
    // Count subscriptions by status
    const subscriptionsByStatus = await mongoose.connection.db.collection('subscriptions').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Subscriptions by status:', subscriptionsByStatus);
    
    // Check for user6@example.com specifically
    const user6 = await mongoose.connection.db.collection('users').findOne({ email: 'user6@example.com' });
    console.log('\nuser6@example.com exists:', !!user6);
    if (user6) {
      console.log('user6 details:', {
        email: user6.email,
        role: user6.role,
        status: user6.status,
        _id: user6._id
      });
      
      // Check for subscriptions for user6
      const user6Subscriptions = await mongoose.connection.db.collection('subscriptions').find({ user: user6._id }).toArray();
      console.log('user6 subscriptions count:', user6Subscriptions.length);
      if (user6Subscriptions.length > 0) {
        console.log('user6 subscriptions:', user6Subscriptions.map(s => ({
          _id: s._id,
          status: s.status,
          plan: s.plan,
          createdAt: s.createdAt,
          endDate: s.endDate
        })));
      }
    }
    
    // Sample a few users to check structure
    console.log('\nSample users:');
    const sampleUsers = await mongoose.connection.db.collection('users').find({}).limit(3).toArray();
    sampleUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        email: user.email,
        role: user.role,
        status: user.status,
        hasPhone: !!user.phone,
        hasAddress: !!user.address
      });
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkDatabaseData();