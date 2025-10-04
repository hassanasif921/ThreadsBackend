const fs = require('fs');
const path = require('path');

// Read current .env file
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('Could not read .env file:', error.message);
  process.exit(1);
}

// Update location ID
const oldLocationId = 'SQUARE_LOCATION_ID=L6DDVN8557ZZG';
const newLocationId = 'SQUARE_LOCATION_ID=LQR06ZAM1XC8K';

if (envContent.includes(oldLocationId)) {
  const updatedContent = envContent.replace(oldLocationId, newLocationId);
  
  // Write updated content back to .env
  fs.writeFileSync(envPath, updatedContent);
  console.log('✅ Updated SQUARE_LOCATION_ID to: LQR06ZAM1XC8K');
  console.log('🚀 Restart your server and try the subscription again!');
} else {
  console.log('ℹ️  Location ID not found in expected format.');
  console.log('Please manually update your .env file with:');
  console.log('SQUARE_LOCATION_ID=LQR06ZAM1XC8K');
}
