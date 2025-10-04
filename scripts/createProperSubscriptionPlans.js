const { Client, Environment } = require('square');
require('dotenv').config();

async function createProperSubscriptionPlans() {
  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox
    });

    const catalogApi = client.catalogApi;

    console.log('🔄 Creating proper recurring subscription plans...');

    // First, let's delete existing plans to avoid duplicates
    console.log('🗑️  Cleaning up existing plans...');
    
    try {
      const { result: existingPlans } = await catalogApi.listCatalog(undefined, 'SUBSCRIPTION_PLAN');
      
      if (existingPlans.objects && existingPlans.objects.length > 0) {
        for (const plan of existingPlans.objects) {
          try {
            await catalogApi.deleteCatalogObject(plan.id);
            console.log(`   ✅ Deleted plan: ${plan.subscriptionPlanData?.name || plan.id}`);
          } catch (deleteError) {
            console.log(`   ⚠️  Could not delete plan ${plan.id}: ${deleteError.message}`);
          }
        }
      }
    } catch (listError) {
      console.log('   ℹ️  No existing plans to clean up');
    }

    // Create Monthly Subscription Plan
    const monthlyPlan = {
      type: 'SUBSCRIPTION_PLAN',
      id: '#monthly-subscription-plan',
      subscriptionPlanData: {
        name: 'Premium Monthly Subscription',
        phases: [
          {
            cadence: 'MONTHLY',
            recurringPriceMoney: {
              amount: 999, // $9.99
              currency: 'USD'
            }
          }
        ]
      }
    };

    // Create Yearly Subscription Plan  
    const yearlyPlan = {
      type: 'SUBSCRIPTION_PLAN',
      id: '#yearly-subscription-plan',
      subscriptionPlanData: {
        name: 'Premium Yearly Subscription',
        phases: [
          {
            cadence: 'ANNUAL',
            recurringPriceMoney: {
              amount: 9999, // $99.99
              currency: 'USD'
            }
          }
        ]
      }
    };

    console.log('📝 Creating new subscription plans...');

    // Create the plans using upsertCatalogObject (one at a time)
    const monthlyResult = await catalogApi.upsertCatalogObject({
      idempotencyKey: `monthly-plan-${Date.now()}`,
      object: monthlyPlan
    });

    const yearlyResult = await catalogApi.upsertCatalogObject({
      idempotencyKey: `yearly-plan-${Date.now() + 1}`,
      object: yearlyPlan
    });

    console.log('✅ Subscription plans created successfully!');
    
    const monthlyPlanId = monthlyResult.result.catalogObject.id;
    const yearlyPlanId = yearlyResult.result.catalogObject.id;

    console.log('\n📋 Plan Details:');
    console.log(`Monthly Plan:`);
    console.log(`  ID: ${monthlyPlanId}`);
    console.log(`  Name: ${monthlyResult.result.catalogObject.subscriptionPlanData.name}`);
    console.log(`  Price: $9.99/month`);

    console.log(`\nYearly Plan:`);
    console.log(`  ID: ${yearlyPlanId}`);
    console.log(`  Name: ${yearlyResult.result.catalogObject.subscriptionPlanData.name}`);
    console.log(`  Price: $99.99/year`);

    console.log('\n🔧 Update your .env file with these Plan IDs:');
    console.log(`SQUARE_MONTHLY_PLAN_ID=${monthlyPlanId}`);
    console.log(`SQUARE_YEARLY_PLAN_ID=${yearlyPlanId}`);

    // Verify the plans were created correctly
    console.log('\n🔍 Verifying plan structure...');
    
    const { result: verifyResult } = await catalogApi.listCatalog(undefined, 'SUBSCRIPTION_PLAN');
    
    if (verifyResult.objects) {
      verifyResult.objects.forEach(plan => {
        console.log(`\n✅ Plan: ${plan.subscriptionPlanData.name}`);
        console.log(`   ID: ${plan.id}`);
        console.log(`   Has phases: ${plan.subscriptionPlanData.phases ? '✅' : '❌'}`);
        if (plan.subscriptionPlanData.phases) {
          plan.subscriptionPlanData.phases.forEach((phase, index) => {
            console.log(`   Phase ${index + 1}: ${phase.cadence} - $${(phase.recurringPriceMoney.amount / 100).toFixed(2)}`);
          });
        }
      });
    }

    console.log('\n🎉 Recurring subscription plans are ready!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with the new Plan IDs');
    console.log('2. Restart your server');
    console.log('3. Test subscription creation');

    return {
      monthlyPlanId,
      yearlyPlanId
    };

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
createProperSubscriptionPlans();
