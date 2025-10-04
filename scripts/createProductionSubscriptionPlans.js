const { Client, Environment } = require('square');
require('dotenv').config();

async function createProductionSubscriptionPlans() {
  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox // Change to Environment.Production for live
    });

    const catalogApi = client.catalogApi;

    console.log('🚀 Creating production-ready subscription plans...');

    // Clean up existing plans first
    console.log('🧹 Cleaning up existing plans...');
    try {
      const { result: existingPlans } = await catalogApi.listCatalog(undefined, 'SUBSCRIPTION_PLAN');
      
      if (existingPlans.objects && existingPlans.objects.length > 0) {
        for (const plan of existingPlans.objects) {
          try {
            await catalogApi.deleteCatalogObject(plan.id);
            console.log(`   ✅ Deleted: ${plan.subscriptionPlanData?.name || plan.id}`);
          } catch (deleteError) {
            console.log(`   ⚠️  Could not delete ${plan.id}: ${deleteError.message}`);
          }
        }
      }
    } catch (error) {
      console.log('   ℹ️  No existing plans to clean up');
    }

    // Create Monthly Subscription Plan
    console.log('\n📝 Creating Monthly Subscription Plan...');
    const monthlyPlanRequest = {
      idempotencyKey: `monthly-plan-${Date.now()}`,
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#monthly-subscription-plan',
        subscriptionPlanData: {
          name: 'Premium Monthly',
          description: 'Monthly access to all premium stitches and features',
          phases: [
            {
              cadence: 'MONTHLY',
              recurringPriceMoney: {
                amount: 999, // $9.99
                currency: 'USD'
              },
              ordinal: 0
            }
          ]
        }
      }
    };

    const monthlyResult = await catalogApi.upsertCatalogObject(monthlyPlanRequest);
    const monthlyPlanId = monthlyResult.result.catalogObject.id;

    // Create Yearly Subscription Plan
    console.log('📝 Creating Yearly Subscription Plan...');
    const yearlyPlanRequest = {
      idempotencyKey: `yearly-plan-${Date.now() + 1}`,
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#yearly-subscription-plan',
        subscriptionPlanData: {
          name: 'Premium Yearly',
          description: 'Yearly access to all premium stitches with significant savings',
          phases: [
            {
              cadence: 'ANNUAL',
              recurringPriceMoney: {
                amount: 9999, // $99.99 (save ~17%)
                currency: 'USD'
              },
              ordinal: 0
            }
          ]
        }
      }
    };

    const yearlyResult = await catalogApi.upsertCatalogObject(yearlyPlanRequest);
    const yearlyPlanId = yearlyResult.result.catalogObject.id;

    console.log('\n✅ Subscription plans created successfully!');
    
    // Verify the plans
    console.log('\n🔍 Verifying created plans...');
    const { result: verifyResult } = await catalogApi.listCatalog(undefined, 'SUBSCRIPTION_PLAN');
    
    let monthlyPlan = null;
    let yearlyPlan = null;
    
    if (verifyResult.objects) {
      verifyResult.objects.forEach(plan => {
        const planData = plan.subscriptionPlanData;
        if (planData && planData.phases && planData.phases.length > 0) {
          const phase = planData.phases[0];
          const cadence = phase.cadence;
          const price = phase.recurringPriceMoney;
          
          console.log(`\n✅ Plan: ${planData.name}`);
          console.log(`   ID: ${plan.id}`);
          console.log(`   Cadence: ${cadence}`);
          console.log(`   Price: $${(price.amount / 100).toFixed(2)} ${price.currency}`);
          console.log(`   Has proper structure: ✅`);
          
          if (cadence === 'MONTHLY') {
            monthlyPlan = plan;
          } else if (cadence === 'ANNUAL') {
            yearlyPlan = plan;
          }
        }
      });
    }

    if (monthlyPlan && yearlyPlan) {
      console.log('\n🎉 SUCCESS! Both plans created with proper structure.');
      console.log('\n🔧 Update your .env file:');
      console.log(`SQUARE_MONTHLY_PLAN_ID=${monthlyPlan.id}`);
      console.log(`SQUARE_YEARLY_PLAN_ID=${yearlyPlan.id}`);
      
      console.log('\n📊 Plan Summary:');
      console.log(`Monthly: ${monthlyPlan.subscriptionPlanData.name} - $${(monthlyPlan.subscriptionPlanData.phases[0].recurringPriceMoney.amount / 100).toFixed(2)}/month`);
      console.log(`Yearly: ${yearlyPlan.subscriptionPlanData.name} - $${(yearlyPlan.subscriptionPlanData.phases[0].recurringPriceMoney.amount / 100).toFixed(2)}/year`);
      
      const monthlyCost = monthlyPlan.subscriptionPlanData.phases[0].recurringPriceMoney.amount * 12;
      const yearlyCost = yearlyPlan.subscriptionPlanData.phases[0].recurringPriceMoney.amount;
      const savings = ((monthlyCost - yearlyCost) / monthlyCost * 100).toFixed(1);
      console.log(`💰 Yearly savings: ${savings}%`);

      console.log('\n📋 Next Steps:');
      console.log('1. Update your .env file with the new plan IDs');
      console.log('2. Restart your server');
      console.log('3. Test subscription creation');
      console.log('4. Set up webhooks for subscription events');

      return {
        monthlyPlanId: monthlyPlan.id,
        yearlyPlanId: yearlyPlan.id,
        success: true
      };
    } else {
      throw new Error('Failed to create both subscription plans properly');
    }

  } catch (error) {
    console.error('❌ Error creating subscription plans:', error);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.category}: ${err.detail}`);
      });
    }
    return { success: false, error: error.message };
  }
}

// Run the script
if (require.main === module) {
  createProductionSubscriptionPlans()
    .then(result => {
      if (result.success) {
        console.log('\n🎊 Production subscription plans are ready!');
        process.exit(0);
      } else {
        console.log('\n💥 Failed to create subscription plans');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = createProductionSubscriptionPlans;
