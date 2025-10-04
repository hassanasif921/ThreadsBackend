const { Client, Environment } = require('square');
require('dotenv').config();

async function listSubscriptionPlans() {
  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox
    });

    console.log('🔍 Fetching existing subscription plans...');
    
    const { result } = await client.catalogApi.listCatalog(
      undefined, // cursor
      'SUBSCRIPTION_PLAN' // types
    );
    
    if (result.objects && result.objects.length > 0) {
      console.log('✅ Found subscription plans:');
      
      let monthlyPlanId = '';
      let yearlyPlanId = '';
      
      result.objects.forEach((obj, index) => {
        if (obj.type === 'SUBSCRIPTION_PLAN') {
          const planData = obj.subscriptionPlanData;
          console.log(`\n📋 Plan ${index + 1}:`);
          console.log(`  Name: ${planData.name}`);
          console.log(`  Plan ID: ${obj.id}`);
          
          if (planData.phases && planData.phases.length > 0) {
            const phase = planData.phases[0];
            const price = phase.recurringPriceMoney;
            console.log(`  Price: $${(price.amount / 100).toFixed(2)} ${price.currency}`);
            console.log(`  Billing: ${phase.cadence}`);
            
            // Store plan IDs based on cadence and price
            if (phase.cadence === 'MONTHLY' && !monthlyPlanId) {
              monthlyPlanId = obj.id;
            } else if (phase.cadence === 'ANNUAL' && !yearlyPlanId) {
              yearlyPlanId = obj.id;
            }
          }
        }
      });
      
      console.log('\n🔧 Add these to your .env file:');
      if (monthlyPlanId) {
        console.log(`SQUARE_MONTHLY_PLAN_ID=${monthlyPlanId}`);
      }
      if (yearlyPlanId) {
        console.log(`SQUARE_YEARLY_PLAN_ID=${yearlyPlanId}`);
      }
      
      if (!monthlyPlanId || !yearlyPlanId) {
        console.log('\n⚠️ Some plans are missing. You may need to create them.');
      }
      
    } else {
      console.log('❌ No subscription plans found.');
      console.log('💡 Run "node scripts/setupSquarePlans.js" to create them.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching subscription plans:', error.message);
    if (error.statusCode === 401) {
      console.log('\n💡 Authentication failed. Please check your SQUARE_ACCESS_TOKEN in .env file.');
    }
  }
}

listSubscriptionPlans();
