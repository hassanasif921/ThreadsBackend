const { Client, Environment } = require('square');
require('dotenv').config();

async function getLocations() {
  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox
    });

    console.log('🔍 Fetching Square locations...');
    
    const { result } = await client.locationsApi.listLocations();
    
    if (result.locations && result.locations.length > 0) {
      console.log('✅ Found locations:');
      result.locations.forEach((location, index) => {
        console.log(`\n📍 Location ${index + 1}:`);
        console.log(`  Name: ${location.name}`);
        console.log(`  ID: ${location.id}`);
        console.log(`  Status: ${location.status}`);
        console.log(`  Address: ${location.address ? `${location.address.addressLine1}, ${location.address.locality}` : 'N/A'}`);
      });
      
      console.log(`\n🔧 Add this to your .env file:`);
      console.log(`SQUARE_LOCATION_ID=${result.locations[0].id}`);
    } else {
      console.log('❌ No locations found. You may need to create a location in your Square Dashboard.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching locations:', error.message);
    if (error.statusCode === 401) {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. Your SQUARE_ACCESS_TOKEN is set in .env file');
      console.log('2. You\'re using the correct Sandbox access token');
      console.log('3. The token has the required permissions');
    }
  }
}

getLocations();
