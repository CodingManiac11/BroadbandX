const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const updateAdminCredentials = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the existing admin user
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (!existingAdmin) {
      console.log('❌ No admin user found in database');
      process.exit(1);
    }
    
    console.log(`📝 Found existing admin: ${existingAdmin.email}`);
    
    // Update admin credentials
    const newEmail = 'adityautsav1901@gmail.com';
    const newPassword = 'demon';
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the admin user
    await User.findByIdAndUpdate(existingAdmin._id, {
      email: newEmail,
      password: hashedPassword
    });
    
    console.log('✅ Admin credentials updated successfully!');
    console.log(`📧 New admin email: ${newEmail}`);
    console.log(`🔑 New admin password: ${newPassword}`);
    
    // Verify the update
    const updatedAdmin = await User.findById(existingAdmin._id);
    console.log(`✅ Verification - Admin email is now: ${updatedAdmin.email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin credentials:', error);
    process.exit(1);
  }
};

updateAdminCredentials();