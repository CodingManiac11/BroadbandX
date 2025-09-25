const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// User schema (simplified)
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const checkAndCreateAdminUser = async () => {
  await connectDB();
  
  try {
    console.log('🔍 Checking for admin user...\n');
    
    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (adminUser) {
      console.log('✅ Admin user already exists:');
      console.log('  - Email:', adminUser.email);
      console.log('  - Role:', adminUser.role);
      console.log('  - Name:', adminUser.firstName, adminUser.lastName);
      console.log('  - Created:', adminUser.createdAt);
    } else {
      console.log('❌ Admin user not found. Creating admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin user
      const newAdmin = new User({
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+1234567890',
        address: {
          street: '123 Admin Street',
          city: 'Admin City',
          state: 'Admin State',
          zipCode: '12345',
          country: 'USA'
        }
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully:');
      console.log('  - Email: admin@example.com');
      console.log('  - Password: admin123');
      console.log('  - Role: admin');
    }
    
    // Also check all users and their roles
    const allUsers = await User.find({});
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking/creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkAndCreateAdminUser();