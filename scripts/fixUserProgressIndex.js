const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserProgressIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('userprogresses');

    // Get current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the old problematic index if it exists
    try {
      await collection.dropIndex('userId_1_stitchId_1');
      console.log('✅ Dropped old index: userId_1_stitchId_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Old index userId_1_stitchId_1 does not exist');
      } else {
        console.log('⚠️  Error dropping old index:', error.message);
      }
    }

    // Create the correct index
    try {
      await collection.createIndex({ userId: 1, stitch: 1 }, { unique: true });
      console.log('✅ Created correct index: userId_1_stitch_1');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  Correct index already exists');
      } else {
        console.log('⚠️  Error creating index:', error.message);
      }
    }

    // Verify final indexes
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => ({ name: idx.name, key: idx.key })));

    console.log('✅ Index fix completed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixUserProgressIndex();
