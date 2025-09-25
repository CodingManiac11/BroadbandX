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
  role: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const fixAdminUser = async () => {
  await connectDB();
  
  try {
    console.log('🔧 Fixing admin user...\n');
    
    // Delete any existing admin users (dummy data cleanup)
    const deletedAdmins = await User.deleteMany({ 
      $or: [
        { email: 'admin@example.com' },
        { email: /^user\d+@example\.com$/, role: 'admin' }
      ]
    });
    console.log('🗑️ Deleted existing admin/dummy users:', deletedAdmins.deletedCount);
    
    // Check if the real admin already exists
    const existingAdmin = await User.findOne({ email: 'adityautsav1901@gmail.com' });
    
    if (existingAdmin) {
      // Check if admin needs status update
      if (!existingAdmin.status) {
        existingAdmin.status = 'active';
        await existingAdmin.save();
        console.log('🔄 Updated admin user status to active');
      }
      
      console.log('✅ Real admin user already exists:');
      console.log('  - Email: adityautsav1901@gmail.com');
      console.log('  - Role:', existingAdmin.role);
      console.log('  - Status:', existingAdmin.status);
      console.log('  - Name:', existingAdmin.firstName, existingAdmin.lastName);
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create the real admin user
      const newAdmin = new User({
        email: 'adityautsav1901@gmail.com',
        password: hashedPassword,
        firstName: 'Aditya',
        lastName: 'Utsav',
        role: 'admin',
        status: 'active',
        phone: '+919876543210',
        address: {
          street: 'Admin Address',
          city: 'Your City',
          state: 'Your State',
          zipCode: '123456',
          country: 'India'
        }
      });
      
      await newAdmin.save();
      console.log('✅ Real admin user created successfully:');
      console.log('  - Email: adityautsav1901@gmail.com');
      console.log('  - Password: admin123');
      console.log('  - Role: admin');
      console.log('  - Name: Aditya Utsav');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixAdminUser();