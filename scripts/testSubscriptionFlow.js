const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
let userToken = 'your_user_token_here'; // Replace with actual token

// Test configuration
const testConfig = {
  monthlyPlanId: process.env.SQUARE_MONTHLY_PLAN_ID,
  yearlyPlanId: process.env.SQUARE_YEARLY_PLAN_ID,
  testCardNonce: 'cnon:card-nonce-ok'
};

class SubscriptionTester {
  constructor() {
    this.results = [];
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      const result = await testFunction();
      console.log(`✅ PASSED: ${testName}`);
      this.results.push({ test: testName, status: 'PASSED', result });
      return result;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.results.push({ test: testName, status: 'FAILED', error: error.message });
      return null;
    }
  }

  async testGetSubscriptionPlans() {
    const response = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
    
    if (!response.data.success) {
      throw new Error('API returned success: false');
    }
    
    if (!response.data.data || response.data.data.length === 0) {
      throw new Error('No subscription plans found');
    }
    
    console.log(`   Found ${response.data.data.length} subscription plans`);
    return response.data;
  }

  async testGetFreeStitches() {
    const response = await axios.get(`${BASE_URL}/api/stitches?tier=free`);
    
    if (!response.data.success) {
      throw new Error('API returned success: false');
    }
    
    console.log(`   Found ${response.data.data.length} free stitches`);
    console.log(`   User subscription status: ${response.data.userSubscription?.status || 'unknown'}`);
    return response.data;
  }

  async testGetUserSubscription() {
    const response = await axios.get(`${BASE_URL}/api/subscriptions/my-subscription`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (!response.data.success) {
      throw new Error('API returned success: false');
    }
    
    console.log(`   Current plan: ${response.data.data.planType || 'free'}`);
    console.log(`   Premium access: ${response.data.data.hasPremiumAccess || false}`);
    return response.data;
  }

  async testStartFreeTrial() {
    const response = await axios.post(`${BASE_URL}/api/subscriptions/start-trial`, 
      { trialDays: 7 },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to start trial');
    }
    
    console.log(`   Trial status: ${response.data.data.user.subscriptionStatus}`);
    console.log(`   Trial ends: ${response.data.data.user.premiumAccessUntil}`);
    return response.data;
  }

  async testAccessPremiumContent() {
    const response = await axios.get(`${BASE_URL}/api/subscriptions/premium-content`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Premium access denied');
    }
    
    console.log(`   Premium features available: ${response.data.data.premiumFeatures?.length || 0}`);
    return response.data;
  }

  async testCreateSubscription() {
    const response = await axios.post(`${BASE_URL}/api/subscriptions/subscribe`, 
      {
        planId: testConfig.monthlyPlanId,
        paymentMethodId: testConfig.testCardNonce
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create subscription');
    }
    
    console.log(`   Subscription created: ${response.data.data.planType}`);
    console.log(`   Status: ${response.data.data.status}`);
    return response.data;
  }

  async testProcessPayment() {
    const response = await axios.post(`${BASE_URL}/api/subscriptions/payment`, 
      {
        amount: 1999,
        currency: 'USD',
        paymentMethodId: testConfig.testCardNonce,
        description: 'Test payment'
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Payment failed');
    }
    
    console.log(`   Payment processed: $${response.data.data.amountMoney?.amount / 100 || 'unknown'}`);
    console.log(`   Payment status: ${response.data.data.status || 'unknown'}`);
    return response.data;
  }

  async testCancelSubscription() {
    const response = await axios.post(`${BASE_URL}/api/subscriptions/cancel`, 
      { cancelAtPeriodEnd: true },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to cancel subscription');
    }
    
    console.log(`   Cancellation scheduled for period end`);
    return response.data;
  }

  async runAllTests() {
    console.log('🚀 Starting Subscription Flow Tests...');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`🔑 Monthly Plan ID: ${testConfig.monthlyPlanId}`);
    console.log(`🔑 Yearly Plan ID: ${testConfig.yearlyPlanId}`);

    // Test 1: Get subscription plans (public)
    await this.runTest('Get Subscription Plans', () => this.testGetSubscriptionPlans());

    // Test 2: Get free stitches (public)
    await this.runTest('Get Free Stitches', () => this.testGetFreeStitches());

    // Test 3: Get user subscription (requires auth)
    await this.runTest('Get User Subscription', () => this.testGetUserSubscription());

    // Test 4: Start free trial (requires auth)
    await this.runTest('Start Free Trial', () => this.testStartFreeTrial());

    // Test 5: Access premium content (should work after trial)
    await this.runTest('Access Premium Content', () => this.testAccessPremiumContent());

    // Test 6: Process one-time payment
    await this.runTest('Process One-time Payment', () => this.testProcessPayment());

    // Test 7: Create subscription (might fail if already exists)
    await this.runTest('Create Subscription', () => this.testCreateSubscription());

    // Test 8: Cancel subscription
    await this.runTest('Cancel Subscription', () => this.testCancelSubscription());

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`   - ${r.test}: ${r.error}`));
    }

    console.log('\n💡 Next Steps:');
    if (failed === 0) {
      console.log('   🎉 All tests passed! Your subscription system is working correctly.');
    } else {
      console.log('   🔧 Fix the failed tests and run again.');
      console.log('   📖 Check the full testing guide in docs/SUBSCRIPTION_TESTING_GUIDE.md');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new SubscriptionTester();
  
  if (userToken === 'your_user_token_here') {
    console.log('⚠️  Please update the userToken variable with a valid JWT token');
    console.log('   You can get a token by logging in through your auth endpoint');
    process.exit(1);
  }
  
  if (!testConfig.monthlyPlanId || !testConfig.yearlyPlanId) {
    console.log('⚠️  Please ensure SQUARE_MONTHLY_PLAN_ID and SQUARE_YEARLY_PLAN_ID are set in .env');
    process.exit(1);
  }
  
  tester.runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = SubscriptionTester;
