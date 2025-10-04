const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Stitch = require('../src/models/Stitch');

async function quickPremiumUpdate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // First, create some basic free stitches if none exist
    const existingStitches = await Stitch.countDocuments({ isActive: true });
    
    if (existingStitches === 0) {
      console.log('📝 Creating sample stitches...');
      
      const sampleStitches = [
        // Free stitches
        { name: 'Basic Knit Stitch', description: 'The fundamental knit stitch', tier: 'free', isActive: true },
        { name: 'Basic Purl Stitch', description: 'The basic purl stitch', tier: 'free', isActive: true },
        { name: 'Garter Stitch', description: 'Simple garter stitch pattern', tier: 'free', isActive: true },
        { name: 'Stockinette Stitch', description: 'Classic stockinette pattern', tier: 'free', isActive: true },
        { name: 'Seed Stitch', description: 'Textured seed stitch pattern', tier: 'free', isActive: true },
        
        // Premium stitches
        { name: 'Cable Knit Pattern', description: 'Complex cable knitting technique', tier: 'premium', isActive: true, premiumFeatures: ['highQualityImages', 'videoTutorials', 'detailedInstructions'] },
        { name: 'Fair Isle Colorwork', description: 'Traditional Fair Isle color patterns', tier: 'premium', isActive: true, premiumFeatures: ['highQualityImages', 'videoTutorials', 'colorChart'] },
        { name: 'Lace Knitting Pattern', description: 'Intricate lace knitting techniques', tier: 'premium', isActive: true, premiumFeatures: ['highQualityImages', 'videoTutorials', 'chartPatterns'] },
        { name: 'Aran Sweater Technique', description: 'Traditional Aran sweater patterns', tier: 'premium', isActive: true, premiumFeatures: ['highQualityImages', 'videoTutorials', 'patternDownload'] },
        { name: 'Intarsia Color Method', description: 'Advanced intarsia color technique', tier: 'premium', isActive: true, premiumFeatures: ['highQualityImages', 'videoTutorials', 'expertTips'] }
      ];

      for (const stitch of sampleStitches) {
        await Stitch.create(stitch);
        console.log(`✅ Created: ${stitch.name} (${stitch.tier})`);
      }
    } else {
      console.log(`📊 Found ${existingStitches} existing stitches`);
      
      // Update existing stitches to have tiers
      console.log('🔄 Updating existing stitches...');
      
      // Make stitches with certain keywords premium
      const premiumKeywords = ['cable', 'lace', 'advanced', 'complex', 'intricate', 'fair isle', 'aran', 'intarsia', 'colorwork'];
      
      for (const keyword of premiumKeywords) {
        const result = await Stitch.updateMany(
          { 
            name: { $regex: keyword, $options: 'i' },
            isActive: true,
            tier: { $ne: 'premium' } // Don't update if already premium
          },
          { 
            $set: { 
              tier: 'premium',
              premiumFeatures: ['highQualityImages', 'videoTutorials', 'detailedInstructions', 'expertTips']
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`✅ Made ${result.modifiedCount} stitches with "${keyword}" premium`);
        }
      }
      
      // Make basic stitches free
      const freeKeywords = ['basic', 'simple', 'beginner', 'knit', 'purl', 'garter', 'stockinette'];
      
      for (const keyword of freeKeywords) {
        const result = await Stitch.updateMany(
          { 
            name: { $regex: keyword, $options: 'i' },
            isActive: true,
            tier: { $ne: 'free' } // Don't update if already free
          },
          { 
            $set: { tier: 'free' },
            $unset: { premiumFeatures: 1 } // Remove premium features
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`✅ Made ${result.modifiedCount} stitches with "${keyword}" free`);
        }
      }
      
      // Make remaining stitches without tier free (to ensure good free content)
      const untieredResult = await Stitch.updateMany(
        { 
          isActive: true,
          $or: [{ tier: { $exists: false } }, { tier: null }]
        },
        { 
          $set: { tier: 'free' }
        }
      );
      
      if (untieredResult.modifiedCount > 0) {
        console.log(`✅ Made ${untieredResult.modifiedCount} untiered stitches free`);
      }
    }

    // Show final statistics
    console.log('\n📊 FINAL STATISTICS');
    console.log('===================');
    
    const totalStitches = await Stitch.countDocuments({ isActive: true });
    const freeCount = await Stitch.countDocuments({ tier: 'free', isActive: true });
    const premiumCount = await Stitch.countDocuments({ tier: 'premium', isActive: true });

    console.log(`📈 Total Stitches: ${totalStitches}`);
    console.log(`🆓 Free Stitches: ${freeCount} (${((freeCount/totalStitches)*100).toFixed(1)}%)`);
    console.log(`💎 Premium Stitches: ${premiumCount} (${((premiumCount/totalStitches)*100).toFixed(1)}%)`);

    // Show samples
    console.log('\n🆓 FREE STITCHES:');
    const freeSamples = await Stitch.find({ tier: 'free', isActive: true }).select('name').limit(5);
    freeSamples.forEach(stitch => console.log(`   • ${stitch.name}`));

    console.log('\n💎 PREMIUM STITCHES:');
    const premiumSamples = await Stitch.find({ tier: 'premium', isActive: true }).select('name premiumFeatures').limit(5);
    premiumSamples.forEach(stitch => {
      console.log(`   • ${stitch.name} (${stitch.premiumFeatures?.length || 0} premium features)`);
    });

    console.log('\n🎉 SUCCESS! Premium tier setup complete.');
    console.log('\n🧪 Test commands:');
    console.log('   curl -X GET "http://localhost:3000/api/stitches"');
    console.log('   curl -X GET "http://localhost:3000/api/stitches?tier=premium"');
    console.log('   curl -X GET "http://localhost:3000/api/stitches?tier=free"');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
quickPremiumUpdate();
