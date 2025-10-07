const mongoose = require('mongoose');
const Step = require('../src/models/Step');
require('dotenv').config();

// URLs to replace filename values
const VIDEO_URL = 'https://res.cloudinary.com/dbgp2tpbj/video/upload/v1759782814/Running_Stitch_q2aycu.mp4';

const IMAGE_URLS = [
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1037_dblwhipchain_step1_draw_or4obo.jpg',
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1037_dblwhipchain_step2_draw_cgiywi.jpg',
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1037_dblwhipchain_step3_draw_n1r0st.jpg',
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1036_whipchain_step2_draw_tyc6vk.jpg',
  'https://res.cloudinary.com/dbgp2tpbj/image/upload/v1759781998/1036_whipchain_step3_draw_ykusc7.jpg'
];

async function updateFilenamesOnly() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all steps
    const allSteps = await Step.find({});
    console.log(`\n📊 Found ${allSteps.length} total steps`);

    let imageUrlIndex = 0;
    let stepsUpdated = 0;
    let stepsWithVideosRemoved = 0;
    let stepsWithImagesAdded = 0;
    let stepsWithImagesUpdated = 0;

    console.log('\n🔄 Processing steps...');

    for (const step of allSteps) {
      let hasChanges = false;
      
      // Clean up and validate existing arrays
      if (!Array.isArray(step.images)) {
        step.images = [];
      } else {
        // Filter out invalid image entries
        step.images = step.images.filter(img => img && typeof img === 'object' && img.filename);
      }
      
      if (!Array.isArray(step.videos)) {
        step.videos = [];
      } else {
        // Filter out invalid video entries
        step.videos = step.videos.filter(vid => vid && typeof vid === 'object' && vid.filename);
      }

      const hasImages = step.images.length > 0;
      const hasVideos = step.videos.length > 0;

      // Case 1: Step has both images and videos - keep only images, remove videos
      if (hasImages && hasVideos) {
        console.log(`📹➡️🖼️  Step ${step.stepNumber}: Removing videos, keeping images`);
        step.videos = [];
        hasChanges = true;
        stepsWithVideosRemoved++;
      }

      // Case 2: Step has no images and no videos - add images
      if (!hasImages && !hasVideos) {
        console.log(`➕ Step ${step.stepNumber}: Adding images (no media found)`);
        step.images = [{
          filename: IMAGE_URLS[imageUrlIndex % IMAGE_URLS.length],
          originalName: `step_${step.stepNumber}_image.jpg`,
          path: IMAGE_URLS[imageUrlIndex % IMAGE_URLS.length],
          uploadDate: new Date()
        }];
        imageUrlIndex++;
        hasChanges = true;
        stepsWithImagesAdded++;
      }
      // Case 3: Step has only videos - replace with images
      else if (!hasImages && hasVideos) {
        console.log(`📹➡️🖼️  Step ${step.stepNumber}: Replacing videos with images`);
        step.videos = [];
        step.images = [{
          filename: IMAGE_URLS[imageUrlIndex % IMAGE_URLS.length],
          originalName: `step_${step.stepNumber}_image.jpg`,
          path: IMAGE_URLS[imageUrlIndex % IMAGE_URLS.length],
          uploadDate: new Date()
        }];
        imageUrlIndex++;
        hasChanges = true;
        stepsWithImagesAdded++;
      }
      // Case 4: Step has images - update their filenames
      else if (hasImages) {
        console.log(`🖼️  Step ${step.stepNumber}: Updating existing image filenames`);
        for (let i = 0; i < step.images.length; i++) {
          const newImageUrl = IMAGE_URLS[imageUrlIndex % IMAGE_URLS.length];
          step.images[i].filename = newImageUrl;
          step.images[i].path = newImageUrl;
          // Ensure other required fields exist
          if (!step.images[i].originalName) {
            step.images[i].originalName = `step_${step.stepNumber}_image_${i + 1}.jpg`;
          }
          if (!step.images[i].uploadDate) {
            step.images[i].uploadDate = new Date();
          }
          imageUrlIndex++;
          hasChanges = true;
        }
        stepsWithImagesUpdated++;
      }

      // Save changes if any were made
      if (hasChanges) {
        try {
          await step.save();
          stepsUpdated++;
        } catch (saveError) {
          console.error(`❌ Error saving step ${step.stepNumber}:`, saveError.message);
          // Log the problematic step data for debugging
          console.error(`Step data:`, {
            stepNumber: step.stepNumber,
            imagesLength: step.images?.length,
            videosLength: step.videos?.length,
            images: step.images
          });
        }
      }
    }

    console.log('\n✅ Processing completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total steps processed: ${allSteps.length}`);
    console.log(`   - Steps updated: ${stepsUpdated}`);
    console.log(`   - Steps with videos removed: ${stepsWithVideosRemoved}`);
    console.log(`   - Steps with images added: ${stepsWithImagesAdded}`);
    console.log(`   - Steps with images updated: ${stepsWithImagesUpdated}`);

    console.log('\n🎉 All updates completed successfully!');

  } catch (error) {
    console.error('❌ Error updating filenames:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
updateFilenamesOnly();
