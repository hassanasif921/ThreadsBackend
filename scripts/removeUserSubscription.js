const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');

async function removeUserSubscription() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Decode the JWT token to get user ID
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzQ4ZDliMzAyNzFlOTA5YmMxMGEwZSIsImVtYWlsIjoic2FyZXBvYjQzN0BvYmlyYWguY29tIiwiZmlyc3ROYW1lIjoiZGQiLCJsYXN0TmFtZSI6ImNjIiwiaWF0IjoxNzU3NzE0MjA4LCJleHAiOjE3NjAzMDYyMDh9.1abSKT7bjlIKfHp7T-Ede2igJUJcQJdU-39xoQGDtBg';
    
    let decoded;
    try {
      decoded = jwt.decode(token);
      console.log('📋 Decoded token:', decoded);
    } catch (error) {
      console.error('❌ Error decoding token:', error.message);
      process.exit(1);
    }

    const userId = decoded.id;
    console.log(`🎯 Target user ID: ${userId}`);

    // Find and display current user status
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('\n👤 Current User Status:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Subscription Status: ${user.subscriptionStatus || 'free'}`);
    console.log(`   Premium Access Until: ${user.premiumAccessUntil || 'N/A'}`);
    console.log(`   Trial Used: ${user.trialUsed || false}`);

    // Find and display current subscriptions
    const subscriptions = await Subscription.find({ userId });
    console.log(`\n💳 Found ${subscriptions.length} subscription(s):`);
    
    subscriptions.forEach((sub, index) => {
      console.log(`\n   Subscription ${index + 1}:`);
      console.log(`     ID: ${sub._id}`);
      console.log(`     Plan Type: ${sub.planType}`);
      console.log(`     Status: ${sub.status}`);
      console.log(`     Amount: $${(sub.amount / 100).toFixed(2)}`);
      console.log(`     Period: ${sub.currentPeriodStart} to ${sub.currentPeriodEnd}`);
      console.log(`     Square Customer ID: ${sub.squareCustomerId}`);
      console.log(`     Square Payment ID: ${sub.squarePaymentId || sub.squareSubscriptionId}`);
    });

    // Remove all subscriptions
    if (subscriptions.length > 0) {
      console.log('\n🗑️  Removing subscriptions...');
      const deleteResult = await Subscription.deleteMany({ userId });
      console.log(`   ✅ Deleted ${deleteResult.deletedCount} subscription(s)`);
    } else {
      console.log('\n   ℹ️  No subscriptions to remove');
    }

    // Reset user subscription status
    console.log('\n🔄 Resetting user subscription status...');
    const updateResult = await User.findByIdAndUpdate(
      userId,
      {
        subscriptionStatus: 'free',
        premiumAccessUntil: null,
        trialUsed: false // Reset trial so you can test trial flow too
      },
      { new: true }
    );

    console.log('   ✅ User status reset to:');
    console.log(`     Subscription Status: ${updateResult.subscriptionStatus}`);
    console.log(`     Premium Access Until: ${updateResult.premiumAccessUntil}`);
    console.log(`     Trial Used: ${updateResult.trialUsed}`);

    console.log('\n🎉 User subscription removed successfully!');
    console.log('\n📋 You can now test:');
    console.log('   1. Free trial signup');
    console.log('   2. Premium content access (should be blocked)');
    console.log('   3. New subscription creation');
    console.log('   4. Premium content access after subscription');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
removeUserSubscription();
