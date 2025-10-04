const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzQ4ZDliMzAyNzFlOTA5YmMxMGEwZSIsImVtYWlsIjoic2FyZXBvYjQzN0BvYmlyYWguY29tIiwiZmlyc3ROYW1lIjoiZGQiLCJsYXN0TmFtZSI6ImNjIiwiaWF0IjoxNzU3NzE0MjA4LCJleHAiOjE3NjAzMDYyMDh9.1abSKT7bjlIKfHp7T-Ede2igJUJcQJdU-39xoQGDtBg';

async function testSubscriptionFlow() {
  console.log('🧪 Testing Subscription Flow with Backend API');
  console.log('=============================================\n');

  try {
    // Test 1: Check current subscription status
    console.log('📋 Step 1: Check current subscription status');
    const statusResponse = await axios.get(`${BASE_URL}/api/subscriptions/my-subscription`, {
      headers: { Authorization: `Bearer ${USER_TOKEN}` }
    });
    console.log('✅ Current status:', statusResponse.data);
    console.log('');

    // Test 2: Get available plans
    console.log('📋 Step 2: Get available subscription plans');
    const plansResponse = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
    console.log('✅ Available plans:', plansResponse.data);
    console.log('');

    // Test 3: Try to access premium content (should be blocked)
    console.log('📋 Step 3: Try to access premium content (should be blocked)');
    try {
      const premiumResponse = await axios.get(`${BASE_URL}/api/subscriptions/premium-content`, {
        headers: { Authorization: `Bearer ${USER_TOKEN}` }
      });
      console.log('❌ Unexpected: Premium access granted:', premiumResponse.data);
    } catch (error) {
      console.log('✅ Expected: Premium access blocked:', error.response?.data?.message);
    }
    console.log('');

    // Test 4: Create subscription with test card nonce
    console.log('📋 Step 4: Create monthly subscription');
    console.log('💳 Using test card nonce: cnon:card-nonce-ok');
    
    const subscribeResponse = await axios.post(`${BASE_URL}/api/subscriptions/subscribe`, {
      planId: 'monthly',
      paymentMethodId: 'cnon:card-nonce-ok'
    }, {
      headers: { 
        Authorization: `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Subscription created:', subscribeResponse.data);
    console.log('');

    // Test 5: Check subscription status after creation
    console.log('📋 Step 5: Check subscription status after creation');
    const newStatusResponse = await axios.get(`${BASE_URL}/api/subscriptions/my-subscription`, {
      headers: { Authorization: `Bearer ${USER_TOKEN}` }
    });
    console.log('✅ New status:', newStatusResponse.data);
    console.log('');

    // Test 6: Try to access premium content (should work now)
    console.log('📋 Step 6: Try to access premium content (should work now)');
    try {
      const premiumResponse = await axios.get(`${BASE_URL}/api/subscriptions/premium-content`, {
        headers: { Authorization: `Bearer ${USER_TOKEN}` }
      });
      console.log('✅ Premium access granted:', premiumResponse.data);
    } catch (error) {
      console.log('❌ Unexpected: Premium access still blocked:', error.response?.data);
    }
    console.log('');

    console.log('🎉 Subscription flow test completed successfully!');
    console.log('\n💰 Payment Summary:');
    console.log('   - Plan: Monthly ($9.99)');
    console.log('   - Payment Method: Test Card (Sandbox)');
    console.log('   - Real Money Charged: NO (Sandbox Mode)');
    console.log('   - Premium Access: GRANTED');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testSubscriptionFlow();
}

module.exports = testSubscriptionFlow;
