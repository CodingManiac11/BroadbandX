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

// User schema
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  phone: String,
  status: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }
}, { timestamps: true });

// Add the comparePassword method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add the findByEmail static method
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', UserSchema);

const testAdminLogin = async () => {
  await connectDB();
  
  try {
    console.log('🔍 Testing admin user login process...\n');
    
    const testEmail = 'adityautsav1901@gmail.com';
    const testPassword = 'admin123';
    
    // Step 1: Find user by email
    console.log('1. Looking up user by email...');
    const user = await User.findByEmail(testEmail).select('+password +status');
    
    if (!user) {
      console.log('❌ User not found with email:', testEmail);
      return;
    }
    
    console.log('✅ User found:');
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Status:', user.status);
    console.log('  - Has password:', !!user.password);
    console.log('  - Password length:', user.password ? user.password.length : 0);
    
    // Step 2: Test password comparison
    console.log('\n2. Testing password comparison...');
    const isPasswordValid = await user.comparePassword(testPassword);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password comparison failed');
      
      // Let's also test with the hash directly
      console.log('\n3. Testing direct bcrypt comparison...');
      const directComparison = await bcrypt.compare(testPassword, user.password);
      console.log('Direct bcrypt comparison:', directComparison);
    } else {
      console.log('✅ Password comparison successful!');
    }
    
    // Step 3: Check user status
    console.log('\n4. Checking user status...');
    if (user.status !== 'active') {
      console.log('❌ User status is not active:', user.status);
    } else {
      console.log('✅ User status is active');
    }
    
    // Summary
    console.log('\n📊 Login Test Summary:');
    console.log('  - User exists:', !!user);
    console.log('  - Password valid:', isPasswordValid);
    console.log('  - Status active:', user.status === 'active');
    console.log('  - Should login:', !!user && isPasswordValid && user.status === 'active');
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  } finally {
    mongoose.connection.close();
  }
};

testAdminLogin();