const fs = require('fs').promises;
const path = require('path');

const createEnvFile = async () => {
  try {
    const envExamplePath = path.join(__dirname, '../.env.example');
    const envPath = path.join(__dirname, '../.env');
    
    // Check if .env already exists
    try {
      await fs.access(envPath);
      console.log('⚠️  .env file already exists. Please configure it manually.');
      return;
    } catch (error) {
      // File doesn't exist, create it
    }
    
    // Copy .env.example to .env
    const envExampleContent = await fs.readFile(envExamplePath, 'utf8');
    await fs.writeFile(envPath, envExampleContent);
    
    console.log('✅ Created .env file from .env.example');
    console.log('🔧 Please update the following variables in your .env file:');
    console.log('   - MONGODB_URI: Your MongoDB Atlas connection string');
    console.log('   - JWT_SECRET: A secure random string');
    console.log('   - JWT_REFRESH_SECRET: Another secure random string');
    console.log('   - EMAIL_USER and EMAIL_PASS: Your email credentials');
    console.log('   - Other service-specific credentials as needed');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }
};

if (require.main === module) {
  createEnvFile();
}

module.exports = { createEnvFile };