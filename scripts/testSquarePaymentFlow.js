const { Client, Environment } = require('square');
require('dotenv').config();

async function testSquarePaymentFlow() {
  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox
    });

    const paymentsApi = client.paymentsApi;
    const customersApi = client.customersApi;

    console.log('🧪 Testing Square Payment Flow');
    console.log('================================\n');

    // Step 1: Create a customer
    console.log('📋 Step 1: Creating customer...');
    const customerResult = await customersApi.createCustomer({
      givenName: 'Test',
      familyName: 'User',
      emailAddress: 'test@example.com'
    });

    const customerId = customerResult.result.customer.id;
    console.log(`✅ Customer created: ${customerId}`);

    // Step 2: Make a payment with card nonce
    console.log('\n💳 Step 2: Processing payment...');
    const paymentResult = await paymentsApi.createPayment({
      sourceId: 'cnon:card-nonce-ok', // Test card nonce
      amountMoney: {
        amount: 999, // $9.99
        currency: 'USD'
      },
      customerId: customerId,
      idempotencyKey: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    const payment = paymentResult.result.payment;
    
    // Handle BigInt conversion
    const paymentAmount = typeof payment.amountMoney.amount === 'bigint' 
      ? Number(payment.amountMoney.amount) 
      : payment.amountMoney.amount;
    
    console.log(`✅ Payment processed: ${payment.id}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Amount: $${(paymentAmount / 100).toFixed(2)}`);
    console.log(`   Card: **** **** **** ${payment.cardDetails?.card?.last4 || 'N/A'}`);
    console.log(`   Brand: ${payment.cardDetails?.card?.cardBrand || 'N/A'}`);

    // Step 3: Try to list customer cards
    console.log('\n📋 Step 3: Listing customer cards...');
    try {
      const cardsResult = await customersApi.listCards(customerId);
      console.log(`✅ Cards found: ${cardsResult.result.cards?.length || 0}`);
      
      if (cardsResult.result.cards && cardsResult.result.cards.length > 0) {
        cardsResult.result.cards.forEach((card, index) => {
          console.log(`   Card ${index + 1}:`);
          console.log(`     ID: ${card.id}`);
          console.log(`     Last 4: ${card.last4}`);
          console.log(`     Brand: ${card.cardBrand}`);
          console.log(`     Enabled: ${card.enabled}`);
        });
      } else {
        console.log('   ℹ️  No cards found (expected in Sandbox)');
      }
    } catch (error) {
      console.log('   ⚠️  Error listing cards:', error.message);
    }

    // Step 4: Try to create a card on file
    console.log('\n💾 Step 4: Attempting to create card on file...');
    try {
      const cardResult = await customersApi.createCustomerCard(customerId, {
        cardNonce: 'cnon:card-nonce-ok',
        billingAddress: {
          addressLine1: '123 Test St',
          locality: 'San Francisco',
          administrativeDistrictLevel1: 'CA',
          postalCode: '94102',
          country: 'US'
        },
        cardholderName: 'Test User'
      });

      console.log('✅ Card created successfully:');
      console.log(`   ID: ${cardResult.result.card.id}`);
      console.log(`   Last 4: ${cardResult.result.card.last4}`);
      console.log(`   Brand: ${cardResult.result.card.cardBrand}`);
    } catch (error) {
      console.log('   ❌ Card creation failed:', error.message);
      if (error.errors) {
        error.errors.forEach(err => {
          console.log(`     - ${err.category}: ${err.detail}`);
        });
      }
    }

    // Step 5: List cards again after creation attempt
    console.log('\n📋 Step 5: Listing cards after creation attempt...');
    try {
      const cardsResult2 = await customersApi.listCards(customerId);
      console.log(`✅ Cards found: ${cardsResult2.result.cards?.length || 0}`);
      
      if (cardsResult2.result.cards && cardsResult2.result.cards.length > 0) {
        cardsResult2.result.cards.forEach((card, index) => {
          console.log(`   Card ${index + 1}:`);
          console.log(`     ID: ${card.id}`);
          console.log(`     Last 4: ${card.last4}`);
          console.log(`     Brand: ${card.cardBrand}`);
          console.log(`     Enabled: ${card.enabled}`);
        });
      } else {
        console.log('   ℹ️  Still no cards found');
      }
    } catch (error) {
      console.log('   ⚠️  Error listing cards:', error.message);
    }

    // Step 6: Get payment details to see card info
    console.log('\n🔍 Step 6: Retrieving payment details...');
    try {
      const paymentDetails = await paymentsApi.getPayment(payment.id);
      const retrievedPayment = paymentDetails.result.payment;
      
      console.log('✅ Payment details retrieved:');
      console.log(`   Payment ID: ${retrievedPayment.id}`);
      console.log(`   Status: ${retrievedPayment.status}`);
      console.log(`   Customer ID: ${retrievedPayment.customerId}`);
      
      if (retrievedPayment.cardDetails) {
        console.log('   Card Details:');
        console.log(`     Last 4: ${retrievedPayment.cardDetails.card?.last4}`);
        console.log(`     Brand: ${retrievedPayment.cardDetails.card?.cardBrand}`);
        console.log(`     Exp Month: ${retrievedPayment.cardDetails.card?.expMonth}`);
        console.log(`     Exp Year: ${retrievedPayment.cardDetails.card?.expYear}`);
        console.log(`     Fingerprint: ${retrievedPayment.cardDetails.card?.fingerprint}`);
      }
    } catch (error) {
      console.log('   ❌ Error retrieving payment:', error.message);
    }

    console.log('\n🎯 Summary:');
    console.log('- Payment processing: ✅ Works');
    console.log('- Card storage: ❓ Limited in Sandbox');
    console.log('- Card retrieval: ❓ Limited in Sandbox');
    console.log('- Payment details: ✅ Contains card info');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.category}: ${err.detail}`);
      });
    }
  }
}

// Run the test
testSquarePaymentFlow();
