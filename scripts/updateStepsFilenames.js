const mongoose = require('mongoose');
const Step = require('../src/models/Step');
require('dotenv').config();

// New URLs to replace filename values
const VIDEO_URL = 'https://res.cloudinary.com/dbgp2tpbj/video/upload/v1759782814/Running_Stitch_q2aycu.mp4';

const IMAGE_URLS = [
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1037_dblwhipchain_step1_draw_or4obo.jpg',
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1037_dblwhipchain_step2_draw_cgiywi.jpg',
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1037_dblwhipchain_step3_draw_n1r0st.jpg',
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1036_whipchain_step2_draw_tyc6vk.jpg',
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1036_whipchain_step3_draw_ykusc7.jpg'
];

async function updateStepsFilenames() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    console.log('\n📊 Analyzing current Steps data...');
    
    // Get all steps
    const allSteps = await Step.find({});
    console.log(`Found ${allSteps.length} total steps`);

    // Count steps with videos and images
    const stepsWithVideos = allSteps.filter(step => step.videos && step.videos.length > 0);
    const stepsWithImages = allSteps.filter(step => step.images && step.images.length > 0);
    
    console.log(`Steps with videos: ${stepsWithVideos.length}`);
    console.log(`Steps with images: ${stepsWithImages.length}`);

    let updatedSteps = 0;
    let updatedVideos = 0;
    let updatedImages = 0;

    console.log('\n🔄 Starting filename updates...');

    // Update video filenames
    if (stepsWithVideos.length > 0) {
      console.log(`\n📹 Updating video filenames...`);
      
      for (const step of stepsWithVideos) {
        let stepUpdated = false;
        
        for (let i = 0; i < step.videos.length; i++) {
          const oldFilename = step.videos[i].filename;
          step.videos[i].filename = VIDEO_URL;
          console.log(`   Step ${step.stepNumber}: ${oldFilename} → ${VIDEO_URL}`);
          updatedVideos++;
          stepUpdated = true;
        }
        
        if (stepUpdated) {
          await step.save();
          updatedSteps++;
        }
      }
    }

    // Update image filenames
    if (stepsWithImages.length > 0) {
      console.log(`\n🖼️  Updating image filenames...`);
      
      let imageUrlIndex = 0;
      
      for (const step of stepsWithImages) {
        let stepUpdated = false;
        
        for (let i = 0; i < step.images.length; i++) {
          const oldFilename = step.images[i].filename;
          
          // Cycle through available image URLs
          const newImageUrl = IMAGE_URLS[imageUrlIndex % IMAGE_URLS.length];
          step.images[i].filename = newImageUrl;
          
          console.log(`   Step ${step.stepNumber}: ${oldFilename} → ${newImageUrl}`);
          
          imageUrlIndex++;
          updatedImages++;
          stepUpdated = true;
        }
        
        if (stepUpdated) {
          await step.save();
          updatedSteps++;
        }
      }
    }

    console.log('\n✅ Update completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Steps updated: ${updatedSteps}`);
    console.log(`   - Video filenames updated: ${updatedVideos}`);
    console.log(`   - Image filenames updated: ${updatedImages}`);

    // Verify updates
    console.log('\n🔍 Verifying updates...');
    const updatedStepsData = await Step.find({});
    
    const verifyVideos = updatedStepsData.filter(step => 
      step.videos && step.videos.some(video => video.filename === VIDEO_URL)
    );
    
    const verifyImages = updatedStepsData.filter(step => 
      step.images && step.images.some(image => IMAGE_URLS.includes(image.filename))
    );
    
    console.log(`✅ Verification:`);
    console.log(`   - Steps with updated video URLs: ${verifyVideos.length}`);
    console.log(`   - Steps with updated image URLs: ${verifyImages.length}`);

  } catch (error) {
    console.error('❌ Error updating steps filenames:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('\n🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Add option to preview changes without applying them
async function previewChanges() {
  try {
    console.log('👀 PREVIEW MODE - No changes will be made');
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    const allSteps = await Step.find({});
    console.log(`\n📊 Found ${allSteps.length} total steps`);

    const stepsWithVideos = allSteps.filter(step => step.videos && step.videos.length > 0);
    const stepsWithImages = allSteps.filter(step => step.images && step.images.length > 0);
    
    console.log(`\n📹 Steps with videos (${stepsWithVideos.length}):`);
    stepsWithVideos.forEach(step => {
      step.videos.forEach((video, index) => {
        console.log(`   Step ${step.stepNumber}, Video ${index + 1}: ${video.filename} → ${VIDEO_URL}`);
      });
    });

    console.log(`\n🖼️  Steps with images (${stepsWithImages.length}):`);
    let imageUrlIndex = 0;
    stepsWithImages.forEach(step => {
      step.images.forEach((image, index) => {
        const newImageUrl = IMAGE_URLS[imageUrlIndex % IMAGE_URLS.length];
        console.log(`   Step ${step.stepNumber}, Image ${index + 1}: ${image.filename} → ${newImageUrl}`);
        imageUrlIndex++;
      });
    });

  } catch (error) {
    console.error('❌ Error previewing changes:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Command line argument handling
const args = process.argv.slice(2);
const isPreview = args.includes('--preview') || args.includes('-p');

if (isPreview) {
  console.log('🔍 Running in preview mode...\n');
  previewChanges();
} else {
  console.log('🚀 Running filename update script...\n');
  updateStepsFilenames();
}

// Export functions for potential reuse
module.exports = {
  updateStepsFilenames,
  previewChanges
};
