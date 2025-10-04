const { Client, Environment } = require('square');
require('dotenv').config();

async function getSquareAppId() {
  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox
    });

    console.log('🔍 Getting Square Application information...');
    
    // Try to get application info
    try {
      const { result } = await client.oAuthApi.obtainToken({
        clientId: 'test', // This will fail but might give us info
        grantType: 'authorization_code'
      });
    } catch (error) {
      // Expected to fail, but error might contain app info
      console.log('Expected OAuth error (this is normal)');
    }

    // The Application ID is typically found in your Square Developer Dashboard
    console.log('\n📋 Square Configuration:');
    console.log(`Access Token: ${process.env.SQUARE_ACCESS_TOKEN?.substring(0, 20)}...`);
    console.log(`Location ID: ${process.env.SQUARE_LOCATION_ID}`);
    
    console.log('\n🔧 To get your Application ID:');
    console.log('1. Go to https://developer.squareup.com/');
    console.log('2. Select your application');
    console.log('3. Go to "Credentials" tab');
    console.log('4. Copy the "Sandbox Application ID"');
    console.log('   (It looks like: sandbox-sq0idb-XXXXXXXXXX)');
    
    console.log('\n💡 For now, I\'ll update the frontend with a placeholder.');
    console.log('   You can replace it with your actual App ID later.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

getSquareAppId();
