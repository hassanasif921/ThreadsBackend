const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Stitch = require('../src/models/Stitch');

async function makeSomeStitchesPremium() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all existing stitches
    const allStitches = await Stitch.find({ isActive: true }).select('name _id tier');
    console.log(`📊 Found ${allStitches.length} active stitches`);

    if (allStitches.length === 0) {
      console.log('❌ No stitches found. Please create some stitches first.');
      await mongoose.disconnect();
      return;
    }

    // Show current stitches
    console.log('\n📋 Current Stitches:');
    allStitches.forEach((stitch, index) => {
      console.log(`   ${index + 1}. ${stitch.name} (${stitch.tier || 'no tier'})`);
    });

    // Determine which stitches to make premium (every 3rd stitch, or based on keywords)
    const stitchesToMakePremium = [];
    
    allStitches.forEach((stitch, index) => {
      const name = stitch.name.toLowerCase();
      
      // Make premium if:
      // 1. Contains premium keywords
      // 2. Every 3rd stitch (to create a good mix)
      // 3. Not already premium
      
      const hasKeywords = name.includes('advanced') || 
                         name.includes('complex') || 
                         name.includes('cable') || 
                         name.includes('lace') || 
                         name.includes('intricate') ||
                         name.includes('pattern') ||
                         name.includes('technique');
      
      const isEveryThird = (index + 1) % 3 === 0;
      const notAlreadyPremium = stitch.tier !== 'premium';
      
      if ((hasKeywords || isEveryThird) && notAlreadyPremium) {
        stitchesToMakePremium.push(stitch);
      }
    });

    console.log(`\n💎 Making ${stitchesToMakePremium.length} stitches premium:`);
    
    let updatedCount = 0;
    
    for (const stitch of stitchesToMakePremium) {
      // Define premium features based on stitch name/type
      let premiumFeatures = ['highQualityImages', 'detailedInstructions'];
      
      const name = stitch.name.toLowerCase();
      if (name.includes('cable') || name.includes('complex')) {
        premiumFeatures.push('videoTutorials', 'stepByStepGuide', 'troubleshootingTips');
      }
      if (name.includes('lace') || name.includes('pattern')) {
        premiumFeatures.push('videoTutorials', 'chartPatterns', 'patternDownload');
      }
      if (name.includes('advanced') || name.includes('technique')) {
        premiumFeatures.push('videoTutorials', 'expertTips', 'techniqueGuide');
      }
      if (name.includes('color') || name.includes('fair isle')) {
        premiumFeatures.push('colorChart', 'colorGuidance');
      }
      
      // Add some general premium features
      if (premiumFeatures.length < 4) {
        premiumFeatures.push('videoTutorials', 'expertTips');
      }

      const result = await Stitch.updateOne(
        { _id: stitch._id },
        { 
          $set: { 
            tier: 'premium',
            premiumFeatures: [...new Set(premiumFeatures)] // Remove duplicates
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`   ✅ ${stitch.name} → Premium (${premiumFeatures.length} features)`);
        updatedCount++;
      }
    }

    // Ensure some stitches remain free
    const freeStitchesCount = await Stitch.countDocuments({ tier: 'free', isActive: true });
    if (freeStitchesCount === 0) {
      console.log('\n🆓 Making some basic stitches free...');
      
      const basicStitches = await Stitch.find({
        isActive: true,
        $or: [
          { name: /basic/i },
          { name: /simple/i },
          { name: /beginner/i },
          { name: /knit/i },
          { name: /purl/i }
        ]
      }).limit(5);

      for (const stitch of basicStitches) {
        await Stitch.updateOne(
          { _id: stitch._id },
          { 
            $set: { 
              tier: 'free',
              $unset: { premiumFeatures: 1 }
            }
          }
        );
        console.log(`   ✅ ${stitch.name} → Free`);
      }
    }

    // Final statistics
    console.log('\n📊 FINAL STATISTICS');
    console.log('===================');
    
    const totalStitches = await Stitch.countDocuments({ isActive: true });
    const freeCount = await Stitch.countDocuments({ tier: 'free', isActive: true });
    const premiumCount = await Stitch.countDocuments({ tier: 'premium', isActive: true });
    const untieredCount = await Stitch.countDocuments({ 
      $or: [{ tier: { $exists: false } }, { tier: null }], 
      isActive: true 
    });

    console.log(`📈 Total Stitches: ${totalStitches}`);
    console.log(`🆓 Free Stitches: ${freeCount} (${((freeCount/totalStitches)*100).toFixed(1)}%)`);
    console.log(`💎 Premium Stitches: ${premiumCount} (${((premiumCount/totalStitches)*100).toFixed(1)}%)`);
    console.log(`❓ Untiered Stitches: ${untieredCount}`);
    console.log(`🔄 Updated in this run: ${updatedCount}`);

    // Show sample of each tier
    console.log('\n💎 PREMIUM STITCHES:');
    const premiumSamples = await Stitch.find({ tier: 'premium', isActive: true })
      .select('name premiumFeatures')
      .limit(5);
    
    premiumSamples.forEach(stitch => {
      console.log(`   • ${stitch.name} (${stitch.premiumFeatures?.length || 0} premium features)`);
    });

    console.log('\n🆓 FREE STITCHES:');
    const freeSamples = await Stitch.find({ tier: 'free', isActive: true })
      .select('name')
      .limit(5);
    
    freeSamples.forEach(stitch => {
      console.log(`   • ${stitch.name}`);
    });

    console.log('\n🎉 SUCCESS! Premium tier setup complete.');
    console.log('\n🚀 Next steps:');
    console.log('1. Test the API: GET /api/stitches');
    console.log('2. Try accessing premium content without subscription');
    console.log('3. Test the subscription flow');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
makeSomeStitchesPremium();
