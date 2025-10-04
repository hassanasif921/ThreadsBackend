const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Stitch = require('../src/models/Stitch');

async function setupTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create test user
    const testUser = await User.findOneAndUpdate(
      { email: 'test@example.com' },
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subscriptionStatus: 'free',
        trialUsed: false,
        isActive: true
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Test user created/updated: ${testUser._id}`);

    // Create sample free stitches
    const freeStitches = [
      {
        name: 'Basic Knit Stitch',
        description: 'A simple knit stitch for beginners',
        tier: 'free',
        difficulty: 'beginner',
        isActive: true
      },
      {
        name: 'Basic Purl Stitch',
        description: 'A simple purl stitch for beginners',
        tier: 'free',
        difficulty: 'beginner',
        isActive: true
      }
    ];

    for (const stitchData of freeStitches) {
      await Stitch.findOneAndUpdate(
        { name: stitchData.name },
        stitchData,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Created ${freeStitches.length} free stitches`);

    // Create sample premium stitches
    const premiumStitches = [
      {
        name: 'Advanced Cable Stitch',
        description: 'Complex cable pattern with detailed instructions',
        tier: 'premium',
        difficulty: 'advanced',
        premiumFeatures: ['highQualityImages', 'videoTutorials', 'detailedInstructions'],
        isActive: true
      },
      {
        name: 'Intricate Lace Pattern',
        description: 'Beautiful lace pattern with premium content',
        tier: 'premium',
        difficulty: 'intermediate',
        premiumFeatures: ['highQualityImages', 'videoTutorials'],
        isActive: true
      }
    ];

    for (const stitchData of premiumStitches) {
      await Stitch.findOneAndUpdate(
        { name: stitchData.name },
        stitchData,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Created ${premiumStitches.length} premium stitches`);

    // Generate JWT token for testing (simplified)
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      { 
        id: testUser._id,
        email: testUser.email,
        role: 'user'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('\n🎯 TEST SETUP COMPLETE!');
    console.log('========================');
    console.log(`📧 Test User Email: ${testUser.email}`);
    console.log(`🆔 Test User ID: ${testUser._id}`);
    console.log(`🔑 Test JWT Token: ${testToken}`);
    console.log('\n📝 Next Steps:');
    console.log('1. Copy the JWT token above');
    console.log('2. Update the userToken in scripts/testSubscriptionFlow.js');
    console.log('3. Run: node scripts/testSubscriptionFlow.js');
    console.log('\n📖 For detailed testing: docs/SUBSCRIPTION_TESTING_GUIDE.md');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupTestData();
