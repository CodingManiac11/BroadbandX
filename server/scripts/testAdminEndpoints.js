const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const testAdminEndpoints = async () => {
  try {
    console.log('🧪 Testing Admin API Endpoints...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Test admin login
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('   Token received:', !!loginResponse.data.token);
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test dashboard stats
    console.log('\n2. Testing admin dashboard...');
    try {
      const dashboardResponse = await axios.get(`${baseURL}/admin/dashboard`, { headers });
      console.log('✅ Dashboard endpoint working!');
      console.log('   Total Users:', dashboardResponse.data.data?.totalUsers || 'N/A');
      console.log('   Active Subscriptions:', dashboardResponse.data.data?.activeSubscriptions || 'N/A');
      console.log('   Total Revenue:', dashboardResponse.data.data?.totalRevenue || 'N/A');
    } catch (error) {
      console.log('❌ Dashboard error:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test subscriptions endpoint
    console.log('\n3. Testing admin subscriptions...');
    try {
      const subscriptionsResponse = await axios.get(`${baseURL}/admin/subscriptions`, { headers });
      console.log('✅ Subscriptions endpoint working!');
      console.log('   Subscriptions found:', subscriptionsResponse.data.data?.length || 0);
      console.log('   Total count:', subscriptionsResponse.data.pagination?.total || 'N/A');
    } catch (error) {
      console.log('❌ Subscriptions error:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test users endpoint
    console.log('\n4. Testing admin users...');
    try {
      const usersResponse = await axios.get(`${baseURL}/admin/users`, { headers });
      console.log('✅ Users endpoint working!');
      console.log('   Users found:', usersResponse.data.data?.users?.length || 0);
      console.log('   Total count:', usersResponse.data.pagination?.total || 'N/A');
    } catch (error) {
      console.log('❌ Users error:', error.response?.status, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data?.message || error.message);
  }
};

testAdminEndpoints();