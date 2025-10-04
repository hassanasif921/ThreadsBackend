const { Client, Environment } = require('square');
require('dotenv').config();

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox // Use Sandbox for testing
});

async function createSubscriptionPlans() {
  try {
    const catalogApi = client.catalogApi;
    
    // Create Monthly Plan
    const monthlyPlanRequest = {
      idempotencyKey: `monthly-plan-${Date.now()}`,
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#monthly-plan',
        subscriptionPlanData: {
          name: 'Premium Monthly',
          phases: [
            {
              cadence: 'MONTHLY',
              periods: null, // null means indefinite
              recurringPriceMoney: {
                amount: 999, // $9.99 in cents
                currency: 'USD'
              }
            }
          ]
        }
      }
    };

    // Create Yearly Plan
    const yearlyPlanRequest = {
      idempotencyKey: `yearly-plan-${Date.now()}`,
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#yearly-plan',
        subscriptionPlanData: {
          name: 'Premium Yearly',
          phases: [
            {
              cadence: 'ANNUAL',
              periods: null, // null means indefinite
              recurringPriceMoney: {
                amount: 9999, // $99.99 in cents (save ~17%)
                currency: 'USD'
              }
            }
          ]
        }
      }
    };

    console.log('Creating subscription plans...');

    // Create both plans in a batch
    const { result } = await catalogApi.batchUpsertCatalogObjects({
      idempotencyKey: `batch-plans-${Date.now()}`,
      batches: [
        {
          objects: [monthlyPlanRequest.object, yearlyPlanRequest.object]
        }
      ]
    });

    console.log('✅ Subscription plans created successfully!');
    console.log('\n📋 Plan Details:');
    
    if (result.objects && result.objects.length > 0) {
      result.objects.forEach(obj => {
        if (obj.type === 'SUBSCRIPTION_PLAN') {
          const planData = obj.subscriptionPlanData;
          console.log(`\n${planData.name}:`);
          console.log(`  Plan ID: ${obj.id}`);
          
          if (planData.phases && planData.phases.length > 0) {
            const price = planData.phases[0].recurringPriceMoney;
            const cadence = planData.phases[0].cadence;
            
            console.log(`  Price: $${(price.amount / 100).toFixed(2)} ${price.currency}`);
            console.log(`  Billing: ${cadence}`);
            
            // Add to .env format
            if (cadence === 'MONTHLY') {
              console.log(`\n🔧 Add to .env file:`);
              console.log(`SQUARE_MONTHLY_PLAN_ID=${obj.id}`);
            } else if (cadence === 'ANNUAL') {
              console.log(`SQUARE_YEARLY_PLAN_ID=${obj.id}`);
            }
          }
        }
      });
      
      console.log('\n🎉 Copy the Plan IDs above to your .env file!');
    } else {
      console.log('⚠️ No objects found in result. Plans may have been created but response structure is different.');
      console.log('Check your Square Dashboard to see the created plans.');
    }
    
  } catch (error) {
    console.error('❌ Error creating subscription plans:', error);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.category}: ${err.detail}`);
      });
    }
  }
}

// Run the script
createSubscriptionPlans();
