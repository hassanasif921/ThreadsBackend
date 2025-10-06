const squareService = require('../src/services/squareService');
require('dotenv').config();

async function testCardCreation() {
  try {
    console.log('🧪 Testing Card Creation with Square Service');
    console.log('============================================\n');

    // Test customer ID (replace with a real one from your Square account)
    const testCustomerId = '2TJJXTVJMNV2QWDH4G9TRPZSNM';
    
    // Test with a mock nonce (this should now pass SDK validation)
    const mockNonce = 'sq_cnon:CA4SEKJGvgGqywoZjOPQPgCbPDEYASgB';
    
    console.log(`📋 Test Parameters:`);
    console.log(`   Customer ID: ${testCustomerId}`);
    console.log(`   Payment Nonce: ${mockNonce}`);
    console.log(`   Nonce Format: ${mockNonce.startsWith('sq_cnon:') ? '✅ Valid' : '❌ Invalid'}\n`);

    console.log('🔄 Attempting to create card...');
    
    const result = await squareService.createCardOnFile(testCustomerId, mockNonce, false);
    
    console.log('\n✅ Card creation result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.errors && Array.isArray(error.errors)) {
      console.error('\nSquare API Errors:');
      error.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. ${err.category}: ${err.detail} (field: ${err.field})`);
      });
    }
  }
}

// Run the test
testCardCreation();
