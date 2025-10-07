const mongoose = require('mongoose');
const Step = require('../src/models/Step');
require('dotenv').config();

async function checkCurrentFilenames() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Current Steps Filename Analysis');
    console.log('=====================================');

    // Get all steps
    const allSteps = await Step.find({});
    console.log(`\nTotal steps found: ${allSteps.length}`);

    // Analyze videos
    const stepsWithVideos = allSteps.filter(step => step.videos && step.videos.length > 0);
    console.log(`\n📹 Video Analysis:`);
    console.log(`Steps with videos: ${stepsWithVideos.length}`);
    
    if (stepsWithVideos.length > 0) {
      console.log('\nCurrent video filenames:');
      stepsWithVideos.forEach((step, index) => {
        step.videos.forEach((video, videoIndex) => {
          console.log(`  Step ${step.stepNumber}, Video ${videoIndex + 1}: ${video.filename || 'No filename'}`);
        });
      });
    }

    // Analyze images
    const stepsWithImages = allSteps.filter(step => step.images && step.images.length > 0);
    console.log(`\n🖼️  Image Analysis:`);
    console.log(`Steps with images: ${stepsWithImages.length}`);
    
    if (stepsWithImages.length > 0) {
      console.log('\nCurrent image filenames:');
      stepsWithImages.forEach((step, index) => {
        step.images.forEach((image, imageIndex) => {
          console.log(`  Step ${step.stepNumber}, Image ${imageIndex + 1}: ${image.filename || 'No filename'}`);
        });
      });
    }

    // Summary
    const totalVideos = stepsWithVideos.reduce((sum, step) => sum + step.videos.length, 0);
    const totalImages = stepsWithImages.reduce((sum, step) => sum + step.images.length, 0);
    
    console.log(`\n📈 Summary:`);
    console.log(`  Total video files: ${totalVideos}`);
    console.log(`  Total image files: ${totalImages}`);
    console.log(`  Total media files: ${totalVideos + totalImages}`);

  } catch (error) {
    console.error('❌ Error checking filenames:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkCurrentFilenames();
