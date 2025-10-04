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

// Update plan IDs based on the API response you showed
const updates = {
  'SQUARE_MONTHLY_PLAN_ID=your_monthly_plan_id': 'SQUARE_MONTHLY_PLAN_ID=BKWHGZNOZJ3NAYFHKK3GXWRK',
  'SQUARE_YEARLY_PLAN_ID=your_yearly_plan_id': 'SQUARE_YEARLY_PLAN_ID=CQF77RXHW5LF6T7ISZ7VWVZ3'
};

let updatedContent = envContent;
let changesCount = 0;

for (const [oldValue, newValue] of Object.entries(updates)) {
  if (updatedContent.includes(oldValue)) {
    updatedContent = updatedContent.replace(oldValue, newValue);
    changesCount++;
    console.log(`✅ Updated: ${newValue}`);
  }
}

if (changesCount > 0) {
  // Write updated content back to .env
  fs.writeFileSync(envPath, updatedContent);
  console.log(`\n🎉 Successfully updated ${changesCount} plan IDs in .env file`);
  console.log('\n📋 Current plan configuration:');
  console.log('SQUARE_MONTHLY_PLAN_ID=BKWHGZNOZJ3NAYFHKK3GXWRK');
  console.log('SQUARE_YEARLY_PLAN_ID=CQF77RXHW5LF6T7ISZ7VWVZ3');
  console.log('\n🚀 Restart your server and test the API again!');
} else {
  console.log('ℹ️  No placeholder values found to update.');
  console.log('Please manually update your .env file with:');
  console.log('SQUARE_MONTHLY_PLAN_ID=BKWHGZNOZJ3NAYFHKK3GXWRK');
  console.log('SQUARE_YEARLY_PLAN_ID=CQF77RXHW5LF6T7ISZ7VWVZ3');
}
