const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Stitch = require('../src/models/Stitch');

// Define which stitches should be premium and their features
const premiumStitchUpdates = [
  {
    searchCriteria: { name: /cable/i }, // Any stitch with "cable" in name
    updateData: {
      tier: 'premium',
      premiumFeatures: [
        'highQualityImages',
        'videoTutorials',
        'detailedInstructions',
        'patternDownload',
        'expertTips'
      ]
    }
  },
  {
    searchCriteria: { name: /lace/i }, // Any stitch with "lace" in name
    updateData: {
      tier: 'premium',
      premiumFeatures: [
        'highQualityImages',
        'videoTutorials',
        'detailedInstructions',
        'chartPatterns'
      ]
    }
  },
  {
    searchCriteria: { name: /advanced/i }, // Any stitch with "advanced" in name
    updateData: {
      tier: 'premium',
      premiumFeatures: [
        'highQualityImages',
        'videoTutorials',
        'detailedInstructions',
        'stepByStepGuide',
        'troubleshootingTips'
      ]
    }
  },
  {
    searchCriteria: { name: /intricate/i }, // Any stitch with "intricate" in name
    updateData: {
      tier: 'premium',
      premiumFeatures: [
        'highQualityImages',
        'videoTutorials',
        'detailedInstructions',
        'patternDownload'
      ]
    }
  },
  {
    searchCriteria: { name: /complex/i }, // Any stitch with "complex" in name
    updateData: {
      tier: 'premium',
      premiumFeatures: [
        'highQualityImages',
        'videoTutorials',
        'detailedInstructions',
        'expertGuidance'
      ]
    }
  }
];

// Specific stitches to make premium by exact name
const specificPremiumStitches = [
  {
    name: 'Fair Isle Colorwork',
    tier: 'premium',
    premiumFeatures: [
      'highQualityImages',
      'videoTutorials',
      'colorChart',
      'patternDownload',
      'colorGuidance'
    ]
  },
  {
    name: 'Aran Sweater Pattern',
    tier: 'premium',
    premiumFeatures: [
      'highQualityImages',
      'videoTutorials',
      'detailedInstructions',
      'sizingGuide',
      'patternDownload'
    ]
  },
  {
    name: 'Entrelac Technique',
    tier: 'premium',
    premiumFeatures: [
      'highQualityImages',
      'videoTutorials',
      'stepByStepGuide',
      'troubleshootingTips'
    ]
  },
  {
    name: 'Double Knitting Method',
    tier: 'premium',
    premiumFeatures: [
      'highQualityImages',
      'videoTutorials',
      'detailedInstructions',
      'expertTips'
    ]
  },
  {
    name: 'Brioche Stitch Pattern',
    tier: 'premium',
    premiumFeatures: [
      'highQualityImages',
      'videoTutorials',
      'detailedInstructions',
      'patternVariations'
    ]
  }
];

async function updateStitchesToPremium() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let totalUpdated = 0;

    // Update stitches based on search criteria
    console.log('\n🔍 Updating stitches based on search criteria...');
    
    for (const update of premiumStitchUpdates) {
      const result = await Stitch.updateMany(
        { 
          ...update.searchCriteria,
          isActive: true,
          tier: { $ne: 'premium' } // Only update if not already premium
        },
        { 
          $set: update.updateData 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} stitches matching: ${JSON.stringify(update.searchCriteria)}`);
        totalUpdated += result.modifiedCount;
      }
    }

    // Update specific stitches by name
    console.log('\n🎯 Updating specific stitches by name...');
    
    for (const stitchData of specificPremiumStitches) {
      const result = await Stitch.updateOne(
        { 
          name: stitchData.name,
          isActive: true 
        },
        { 
          $set: {
            tier: stitchData.tier,
            premiumFeatures: stitchData.premiumFeatures
          }
        },
        { upsert: true } // Create if doesn't exist
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated: ${stitchData.name}`);
        totalUpdated++;
      } else if (result.upsertedCount > 0) {
        console.log(`✅ Created: ${stitchData.name}`);
        totalUpdated++;
      } else {
        console.log(`ℹ️  Already exists: ${stitchData.name}`);
      }
    }

    // Create some sample free stitches if they don't exist
    console.log('\n🆓 Ensuring free stitches exist...');
    
    // First, try to find a beginner difficulty ObjectId
    const Difficulty = require('../src/models/Difficulty');
    let beginnerDifficultyId = null;
    
    try {
      const beginnerDifficulty = await Difficulty.findOne({ 
        $or: [
          { name: /beginner/i },
          { level: 1 },
          { name: /easy/i },
          { name: /basic/i }
        ]
      });
      beginnerDifficultyId = beginnerDifficulty?._id;
    } catch (error) {
      console.log('ℹ️  No difficulty collection found, skipping difficulty assignment');
    }
    
    const freeStitches = [
      {
        name: 'Basic Knit Stitch',
        description: 'The fundamental knit stitch - perfect for beginners',
        tier: 'free',
        ...(beginnerDifficultyId && { difficulty: beginnerDifficultyId }),
        isActive: true
      },
      {
        name: 'Basic Purl Stitch',
        description: 'The basic purl stitch to complement your knit stitch',
        tier: 'free',
        ...(beginnerDifficultyId && { difficulty: beginnerDifficultyId }),
        isActive: true
      },
      {
        name: 'Stockinette Stitch',
        description: 'Classic stockinette stitch pattern',
        tier: 'free',
        ...(beginnerDifficultyId && { difficulty: beginnerDifficultyId }),
        isActive: true
      },
      {
        name: 'Garter Stitch',
        description: 'Simple garter stitch for scarves and blankets',
        tier: 'free',
        ...(beginnerDifficultyId && { difficulty: beginnerDifficultyId }),
        isActive: true
      },
      {
        name: 'Ribbing Pattern',
        description: 'Basic 1x1 ribbing pattern for cuffs and hems',
        tier: 'free',
        ...(beginnerDifficultyId && { difficulty: beginnerDifficultyId }),
        isActive: true
      }
    ];

    for (const stitchData of freeStitches) {
      const result = await Stitch.updateOne(
        { name: stitchData.name },
        { $set: stitchData },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        console.log(`✅ Created free stitch: ${stitchData.name}`);
      }
    }

    // Get summary statistics
    console.log('\n📊 SUMMARY STATISTICS');
    console.log('=====================');
    
    const totalStitches = await Stitch.countDocuments({ isActive: true });
    const freeStitchesCount = await Stitch.countDocuments({ tier: 'free', isActive: true });
    const premiumStitchesCount = await Stitch.countDocuments({ tier: 'premium', isActive: true });
    const untieredStitches = await Stitch.countDocuments({ 
      $or: [{ tier: { $exists: false } }, { tier: null }], 
      isActive: true 
    });

    console.log(`📈 Total Active Stitches: ${totalStitches}`);
    console.log(`🆓 Free Stitches: ${freeStitchesCount}`);
    console.log(`💎 Premium Stitches: ${premiumStitchesCount}`);
    console.log(`❓ Untiered Stitches: ${untieredStitches}`);
    console.log(`🔄 Total Updated: ${totalUpdated}`);
    
    const premiumPercentage = totalStitches > 0 ? ((premiumStitchesCount / totalStitches) * 100).toFixed(1) : 0;
    console.log(`💰 Premium Content: ${premiumPercentage}%`);

    // List some premium stitches
    console.log('\n💎 PREMIUM STITCHES SAMPLE:');
    const premiumSample = await Stitch.find({ tier: 'premium', isActive: true })
      .select('name premiumFeatures')
      .limit(10);
    
    premiumSample.forEach(stitch => {
      console.log(`   • ${stitch.name} (${stitch.premiumFeatures?.length || 0} premium features)`);
    });

    // List free stitches
    console.log('\n🆓 FREE STITCHES:');
    const freeSample = await Stitch.find({ tier: 'free', isActive: true })
      .select('name')
      .limit(10);
    
    freeSample.forEach(stitch => {
      console.log(`   • ${stitch.name}`);
    });

    // Suggest fixing untiered stitches
    if (untieredStitches > 0) {
      console.log('\n⚠️  RECOMMENDATION:');
      console.log(`   You have ${untieredStitches} stitches without a tier.`);
      console.log('   Consider running this script again or manually setting their tier.');
      
      // Show some untiered stitches
      const untieredSample = await Stitch.find({ 
        $or: [{ tier: { $exists: false } }, { tier: null }], 
        isActive: true 
      }).select('name').limit(5);
      
      console.log('\n   Untiered stitches sample:');
      untieredSample.forEach(stitch => {
        console.log(`   • ${stitch.name}`);
      });
    }

    console.log('\n🎉 PREMIUM TIER UPDATE COMPLETE!');
    console.log('================================');
    console.log('Next steps:');
    console.log('1. Test the API endpoints to see the new tier structure');
    console.log('2. Run: node scripts/testSubscriptionFlow.js');
    console.log('3. Check the subscription flow with premium content');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error updating stitches:', error.message);
    process.exit(1);
  }
}

// Run the script
updateStitchesToPremium();
