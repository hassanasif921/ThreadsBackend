const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupUserProgress() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('userprogresses');

    // Find documents with null or missing stitch field
    const invalidDocs = await collection.find({
      $or: [
        { stitch: null },
        { stitch: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${invalidDocs.length} documents with null/missing stitch field`);

    if (invalidDocs.length > 0) {
      console.log('Invalid documents:', invalidDocs.map(doc => ({
        _id: doc._id,
        userId: doc.userId,
        stitch: doc.stitch,
        stitchId: doc.stitchId // Check if old field exists
      })));

      // Remove invalid documents
      const result = await collection.deleteMany({
        $or: [
          { stitch: null },
          { stitch: { $exists: false } }
        ]
      });

      console.log(`✅ Removed ${result.deletedCount} invalid documents`);
    }

    // Check for duplicate documents that might cause issues
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: { userId: "$userId", stitch: "$stitch" },
          count: { $sum: 1 },
          docs: { $push: "$_id" }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    console.log(`Found ${duplicates.length} sets of duplicate documents`);

    if (duplicates.length > 0) {
      for (const duplicate of duplicates) {
        // Keep the first document, remove the rest
        const docsToRemove = duplicate.docs.slice(1);
        await collection.deleteMany({ _id: { $in: docsToRemove } });
        console.log(`✅ Removed ${docsToRemove.length} duplicate documents for userId: ${duplicate._id.userId}, stitch: ${duplicate._id.stitch}`);
      }
    }

    console.log('✅ Cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupUserProgress();
