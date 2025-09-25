const https = require('https');
const http = require('http');

const makeRequest = (options, data) => {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
};

const testAdminEndpoints = async () => {
  try {
    console.log('🧪 Testing Admin API Endpoints...\n');
    
    // Test admin login
    console.log('1. Testing admin login...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = JSON.stringify({
      email: 'adityautsav1901@gmail.com',
      password: 'admin123'
    });
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('Login status:', loginResponse.status);
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.token) {
      const token = loginResponse.data.token;
      
      // Test dashboard
      console.log('\n2. Testing admin dashboard...');
      const dashboardOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/dashboard',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const dashboardResponse = await makeRequest(dashboardOptions);
      console.log('Dashboard status:', dashboardResponse.status);
      console.log('Dashboard response:', dashboardResponse.data);
      
      // Test subscriptions
      console.log('\n3. Testing admin subscriptions...');
      const subscriptionsOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/subscriptions',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const subscriptionsResponse = await makeRequest(subscriptionsOptions);
      console.log('Subscriptions status:', subscriptionsResponse.status);
      console.log('Subscriptions response:', subscriptionsResponse.data);
      
      // Test users
      console.log('\n4. Testing admin users...');
      const usersOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/users',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const usersResponse = await makeRequest(usersOptions);
      console.log('Users status:', usersResponse.status);
      console.log('Users response:', usersResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAdminEndpoints();