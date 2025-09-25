const http = require('http');

const testAdminAPIs = async () => {
  try {
    console.log('🔍 Testing admin API endpoints...\n');
    
    // First login to get the auth token
    const loginData = JSON.stringify({
      email: 'adityautsav1901@gmail.com',
      password: 'admin123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const login = () => {
      return new Promise((resolve, reject) => {
        const req = http.request(loginOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              console.log('Login status:', res.statusCode);
              if (res.statusCode === 200 && response.data && response.data.token) {
                console.log('✅ Login successful');
                resolve(response.data.token);
              } else {
                console.log('❌ Login failed:', response);
                reject(new Error('Login failed'));
              }
            } catch (e) {
              console.log('Login raw response:', data);
              reject(e);
            }
          });
        });
        
        req.on('error', reject);
        req.write(loginData);
        req.end();
      });
    };
    
    const testAPI = (path, token) => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 5000,
          path: path,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log(`\n📡 Testing ${path}`);
            console.log(`Status: ${res.statusCode}`);
            try {
              const response = JSON.parse(data);
              if (res.statusCode === 200) {
                console.log('✅ Success');
                if (response.data) {
                  if (Array.isArray(response.data)) {
                    console.log(`Data count: ${response.data.length}`);
                  } else if (response.data.users) {
                    console.log(`Users count: ${response.data.users.length}`);
                    console.log(`Total users: ${response.data.pagination?.total || 'N/A'}`);
                  } else {
                    console.log('Data keys:', Object.keys(response.data));
                  }
                } else {
                  console.log('Response keys:', Object.keys(response));
                }
              } else {
                console.log('❌ Error:', response);
              }
            } catch (e) {
              console.log('Raw response:', data.substring(0, 200));
            }
            resolve();
          });
        });
        
        req.on('error', (error) => {
          console.log(`❌ Request error for ${path}:`, error.message);
          resolve();
        });
        
        req.end();
      });
    };
    
    // Login and test endpoints
    const token = await login();
    
    // Test various admin endpoints
    await testAPI('/api/admin/users', token);
    await testAPI('/api/admin/subscriptions', token);
    await testAPI('/api/admin/dashboard', token);
    
  } catch (error) {
    console.error('❌ Error testing admin APIs:', error.message);
  }
};

// Wait a bit to avoid rate limiting then test
setTimeout(testAdminAPIs, 3000);