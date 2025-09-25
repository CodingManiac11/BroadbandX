const https = require('https');
const http = require('http');

const testAdminLoginAPI = async () => {
  try {
    console.log('🔍 Testing admin login via API...\n');
    
    const loginData = {
      email: 'adityautsav1901@gmail.com',
      password: 'admin123'
    };
    
    console.log('Attempting login with:', loginData.email);
    
    const postData = JSON.stringify(loginData);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Login status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('Login response:', response);
          
          if (res.statusCode === 200 && response.token) {
            console.log('✅ Admin login successful!');
            console.log('Token received:', response.token.substring(0, 20) + '...');
            console.log('User role:', response.user?.role);
          } else {
            console.log('❌ Admin login failed');
          }
        } catch (e) {
          console.log('Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error testing login:', error.message);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
  }
};

// Wait a bit to avoid rate limiting
setTimeout(testAdminLoginAPI, 2000);

// Wait a bit to avoid rate limiting
setTimeout(testAdminLoginAPI, 2000);