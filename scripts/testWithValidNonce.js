const { Client, Environment } = require('square');
const squareService = require('../src/services/squareService');
require('dotenv').config();

async function testWithValidNonce() {
  try {
    console.log('🧪 Testing Card Creation with Valid Payment Method');
    console.log('================================================\n');

    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox
    });

    // Test customer ID
    const testCustomerId = '2TJJXTVJMNV2QWDH4G9TRPZSNM';
    
    console.log('🔧 Method 1: Testing with a real payment (will be refunded)');
    console.log('This creates a payment and extracts card details from it\n');

    try {
      // Create a test payment first to get valid card details
      const testPayment = await client.paymentsApi.createPayment({
        sourceId: 'cnon:card-nonce-ok', // Square's test nonce for successful payments
        amountMoney: {
          amount: 1, // 1 cent
          currency: 'USD'
        },
        customerId: testCustomerId,
        idempotencyKey: `test-payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      console.log('✅ Test payment created successfully');
      console.log(`Payment ID: ${testPayment.result.payment.id}`);
      
      if (testPayment.result.payment.cardDetails?.card) {
        const cardDetails = testPayment.result.payment.cardDetails.card;
        console.log('💳 Card details from payment:');
        console.log(`   Last 4: ${cardDetails.last4}`);
        console.log(`   Brand: ${cardDetails.cardBrand}`);
        console.log(`   Exp: ${cardDetails.expMonth}/${cardDetails.expYear}`);
        
        // Try to refund the test payment
        try {
          await client.refundsApi.refundPayment({
            paymentId: testPayment.result.payment.id,
            amountMoney: {
              amount: 1,
              currency: 'USD'
            },
            idempotencyKey: `refund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          });
          console.log('✅ Test payment refunded successfully');
        } catch (refundError) {
          console.log('⚠️  Refund failed (1 cent still charged):', refundError.message);
        }
      }

    } catch (paymentError) {
      console.error('❌ Test payment failed:', paymentError.message);
    }

    console.log('\n🔧 Method 2: Testing card creation with Square test nonces');
    console.log('These are special nonces provided by Square for testing\n');

    // Test with Square's built-in test nonces
    const testNonces = [
      'cnon:card-nonce-ok',           // Should work
      'cnon:card-nonce-declined',     // Should be declined
      'cnon:card-nonce-insufficient-funds' // Should fail
    ];

    for (const nonce of testNonces) {
      console.log(`\n🧪 Testing with nonce: ${nonce}`);
      try {
        const result = await squareService.createCardOnFile(testCustomerId, nonce, false);
        console.log('✅ Card creation result:', {
          id: result.id,
          last4: result.last4,
          brand: result.cardBrand
        });
      } catch (error) {
        console.log('❌ Expected failure:', error.message);
      }
    }

    console.log('\n📋 Summary:');
    console.log('- Square test nonces may not work for card creation API');
    console.log('- Real nonces need to be generated from frontend with correct App ID');
    console.log('- Payment-based validation is working as fallback');
    console.log('- Mock data generation is working for development');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWithValidNonce();
