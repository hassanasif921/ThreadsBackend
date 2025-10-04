const { Client, Environment } = require('square');
require('dotenv').config();

async function debugPlans() {
  try {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Sandbox
    });

    console.log('🔍 Fetching and analyzing Square plans...');
    
    const { result } = await client.catalogApi.listCatalog(
      undefined, // cursor
      'SUBSCRIPTION_PLAN' // types
    );
    
    if (result.objects && result.objects.length > 0) {
      console.log(`✅ Found ${result.objects.length} subscription plans:`);
      
      result.objects.forEach((obj, index) => {
        console.log(`\n📋 Plan ${index + 1}:`);
        console.log(`  ID: ${obj.id}`);
        console.log(`  Type: ${obj.type}`);
        
        if (obj.subscriptionPlanData) {
          const planData = obj.subscriptionPlanData;
          console.log(`  Name: ${planData.name}`);
          
          if (planData.subscriptionPlanVariations) {
            console.log(`  Variations: ${planData.subscriptionPlanVariations.length}`);
            planData.subscriptionPlanVariations.forEach((variation, vIndex) => {
              console.log(`    Variation ${vIndex + 1}:`);
              console.log(`      ID: ${variation.id}`);
              console.log(`      Name: ${variation.name || 'N/A'}`);
              
              if (variation.pricingPhase) {
                console.log(`      Cadence: ${variation.pricingPhase.cadence}`);
                if (variation.pricingPhase.priceMoney) {
                  console.log(`      Price: $${(variation.pricingPhase.priceMoney.amount / 100).toFixed(2)} ${variation.pricingPhase.priceMoney.currency}`);
                }
              }
            });
          } else {
            console.log(`  ❌ No variations found!`);
          }
        }
      });
      
      // Show which plan IDs we're looking for
      console.log('\n🎯 Target Plan IDs:');
      console.log(`  Monthly: ${process.env.SQUARE_MONTHLY_PLAN_ID}`);
      console.log(`  Yearly: ${process.env.SQUARE_YEARLY_PLAN_ID}`);
      
      // Check if our target plans exist
      const monthlyPlan = result.objects.find(obj => obj.id === process.env.SQUARE_MONTHLY_PLAN_ID);
      const yearlyPlan = result.objects.find(obj => obj.id === process.env.SQUARE_YEARLY_PLAN_ID);
      
      console.log('\n🔍 Plan Analysis:');
      console.log(`  Monthly plan found: ${monthlyPlan ? '✅' : '❌'}`);
      console.log(`  Yearly plan found: ${yearlyPlan ? '✅' : '❌'}`);
      
      if (monthlyPlan) {
        const hasVariations = monthlyPlan.subscriptionPlanData?.subscriptionPlanVariations?.length > 0;
        console.log(`  Monthly plan has variations: ${hasVariations ? '✅' : '❌'}`);
        if (hasVariations) {
          const variationId = monthlyPlan.subscriptionPlanData.subscriptionPlanVariations[0].id;
          console.log(`  Monthly variation ID: ${variationId}`);
        }
      }
      
      if (yearlyPlan) {
        const hasVariations = yearlyPlan.subscriptionPlanData?.subscriptionPlanVariations?.length > 0;
        console.log(`  Yearly plan has variations: ${hasVariations ? '✅' : '❌'}`);
        if (hasVariations) {
          const variationId = yearlyPlan.subscriptionPlanData.subscriptionPlanVariations[0].id;
          console.log(`  Yearly variation ID: ${variationId}`);
        }
      }
      
    } else {
      console.log('❌ No subscription plans found.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugPlans();
