const { Client, Environment } = require('square');
require('dotenv').config();

async function testListPayments() {
  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox
    });

    const paymentsApi = client.paymentsApi;

    console.log('🔍 Testing List Payments API');
    console.log('============================\n');

    // Test listing payments
    console.log('📋 Listing recent payments...');
    const { result } = await paymentsApi.listPayments({
      limit: 10,
      sortOrder: 'DESC'
    });

    const payments = result.payments || [];
    console.log(`✅ Found ${payments.length} payments`);

    payments.forEach((payment, index) => {
      console.log(`\n💳 Payment ${index + 1}:`);
      console.log(`   ID: ${payment.id}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Customer ID: ${payment.customerId || 'N/A'}`);
      console.log(`   Amount: $${(Number(payment.amountMoney.amount) / 100).toFixed(2)}`);
      
      if (payment.cardDetails?.card) {
        const card = payment.cardDetails.card;
        console.log(`   Card Details:`);
        console.log(`     Last 4: ${card.last4}`);
        console.log(`     Brand: ${card.cardBrand}`);
        console.log(`     Exp: ${card.expMonth}/${card.expYear}`);
        console.log(`     Fingerprint: ${card.fingerprint}`);
      }
    });

    // Test with specific customer ID
    const targetCustomerId = 'YRZW366AF1AK32DB5ZJFSSHC50';
    console.log(`\n🎯 Filtering payments for customer: ${targetCustomerId}`);
    
    const customerPayments = payments.filter(payment => 
      payment.customerId === targetCustomerId && payment.cardDetails?.card
    );
    
    console.log(`✅ Found ${customerPayments.length} payments for this customer`);
    
    customerPayments.forEach((payment, index) => {
      const card = payment.cardDetails.card;
      console.log(`\n💳 Customer Payment ${index + 1}:`);
      console.log(`   Payment ID: ${payment.id}`);
      console.log(`   Card Last 4: ${card.last4}`);
      console.log(`   Card Brand: ${card.cardBrand}`);
      console.log(`   Card Fingerprint: ${card.fingerprint}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.category}: ${err.detail}`);
      });
    }
  }
}

testListPayments();
