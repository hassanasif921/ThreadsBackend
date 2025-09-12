const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import models
const Stitch = require('../src/models/Stitch');
const Step = require('../src/models/Step');
const Family = require('../src/models/Family');
const Usage = require('../src/models/Usage');
const Difficulty = require('../src/models/Difficulty');
const Tag = require('../src/models/Tag');
const Swatch = require('../src/models/Swatch');

// CSV data parsed from the spreadsheet
const stitchData = [
  {
    referenceNumber: 1001,
    name: "Back Stitch",
    description: "A simple straight stitch worked in a dashed line.",
    tags: ["Running Stitch"],
    difficulty: "Beginner",
    notes: "Common for outlines, basting, or basic decorative lines. Can be spaced evenly or varied.",
    alternativeNames: ["Straight Stitch", "Basting Stitch"],
    steps: [
      "Bring the needle to the front of the fabric at the start of the stitching line.",
      "Go down a stitch length away.",
      "Come up a stitch length away. Repeat"
    ]
  },
  {
    referenceNumber: 1002,
    name: "Whipped Running Stitch",
    description: "A running stitch with a second thread whipped around each stitch for texture.",
    tags: ["running", "whipped", "decorative"],
    difficulty: "Intermediate",
    notes: "Adds dimension; use contrasting colors for more visual effect.",
    alternativeNames: ["Overcast Running Stitch"],
    steps: [
      "Complete the Running Stitch. Bring the needle to the front of the fabric next to the beginning of the first stitch.",
      "Tuck the needle under the first stitch, taking care not to catch any threads on the fabric or stitch.",
      "Continue to weave under each stitch always going the same direction."
    ]
  },
  {
    referenceNumber: 1003,
    name: "Woven/Laced Running Stitch",
    description: "A thread is woven or laced through the base running stitch.",
    tags: ["running", "woven", "laced", "texture"],
    difficulty: "Intermediate",
    notes: "Not pierced through fabric during weaving; often used in borders.",
    alternativeNames: ["Interlaced Running Stitch"],
    steps: [
      "Complete the Running Stitch. Bring the needle to the front of the fabric next to the beginning of the first stitch.",
      "Tuck the needle under the first stitch, taking care not to catch any threads on the fabric or stitch.",
      "Continue to weave under each stitch, always going the OPPOSITE direction."
    ]
  },
  {
    referenceNumber: 1004,
    name: "Interlaced Running Stitch",
    description: "Multiple threads interlaced over a base of running stitches.",
    tags: ["running", "interlaced", "decorative"],
    difficulty: "Intermediate",
    notes: "Works beautifully in geometric patterns or mandalas.",
    alternativeNames: ["Laced Running Stitch"],
    steps: [
      "Complete the Running Stitch. Bring the needle to the front of the fabric next to the beginning of the first stitch.",
      "Tuck the needle under the first stitch, taking care not to catch any threads on the fabric or stitch.",
      "Continue to weave under each stitch, always going the OPPOSITE direction.",
      "Bring the needle to the front of the fabric next to the beginning of the first stitch but on the opposite side as the first weave.",
      "Tuck the needle under the first stitch, taking care not to catch any threads on the fabric or backstitch going the OPPOSITE direction.",
      "Continue to weave under each stitch, always going the OPPOSITE direction as the first weave."
    ]
  },
  {
    referenceNumber: 1005,
    name: "Laced Edging (Running)",
    description: "Running stitch along an edge, laced with a decorative thread.",
    tags: ["running", "laced", "edging"],
    difficulty: "Intermediate",
    notes: "Often used in finishing edges of linen or hemstitch-style borders.",
    alternativeNames: [],
    steps: [
      "Complete the Running Stitch. Bring the needle to the front of the fabric a stitch length below the row of running stitches, and between the first two running stitches.",
      "Tuck the needle under the first stitch (heading away from where the thread started)",
      "Tuck the needle under the second stitch (heading toward where the thread started)",
      "Take the needle to the back of the fabric very near where it came out, forming a teardrop shape.",
      "Repeat for each pair of stitches."
    ]
  },
  {
    referenceNumber: 1006,
    name: "Parallel Running Stitch",
    description: "Multiple rows of running stitch spaced evenly for a meandering or glowing effect.",
    tags: ["running", "parallel", "decorative", "fairy lights"],
    difficulty: "Beginner",
    notes: "Soft, flowing designs; great for whimsical borders or filler.",
    alternativeNames: ["Meander", "Fairy Lights"],
    steps: [
      "Begin with two rows of equivalent running stitches. Bring the needle to the front of the fabric just above first stitch in the top row.",
      "Weave the needle down through the first stitch in both rows.",
      "Weave the needle up through the first stitch in the top row only.",
      "Repeat for the rest of the stitches."
    ]
  },
  {
    referenceNumber: 1036,
    name: "Whipped Chain Stitch",
    description: "A chain stitch with a second thread whipped around each chain for added texture and dimension.",
    tags: ["chain", "whipped", "decorative", "texture"],
    difficulty: "Intermediate",
    notes: "Creates a raised, rope-like effect. Use contrasting colors for visual impact.",
    alternativeNames: ["Overcast Chain Stitch"],
    steps: [
      "Complete a row of chain stitches as your foundation.",
      "Bring a second thread to the front at the beginning of the chain row and whip it around each chain link without piercing the fabric."
    ]
  },
  {
    referenceNumber: 1037,
    name: "Double Whipped Chain Stitch",
    description: "A chain stitch with two threads whipped around each chain in opposite directions for maximum texture.",
    tags: ["chain", "whipped", "decorative", "texture", "double"],
    difficulty: "Advanced",
    notes: "Creates a very dimensional, braided appearance. Requires careful tension control.",
    alternativeNames: ["Double Overcast Chain Stitch"],
    steps: [
      "Complete a row of chain stitches as your foundation.",
      "Whip the first thread around each chain link in one direction.",
      "Whip the second thread around each chain link in the opposite direction, creating a braided effect."
    ]
  }
];

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stitchdict');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Create taxonomy items
async function createTaxonomyItems() {
  console.log('Creating taxonomy items...');
  
  // Create families
  const families = [
    { name: "Running Stitch Family", description: "Basic running and related stitches" },
    { name: "Chain Stitch Family", description: "Chain and loop-based stitches" },
    { name: "Backstitch Family", description: "Backstitch and variations" },
    { name: "Straight Stitch Family", description: "Simple straight stitches and variations" },
    { name: "Couching Family", description: "Couching and laid work stitches" }
  ];

  const createdFamilies = {};
  for (const family of families) {
    const created = await Family.create(family);
    createdFamilies[family.name] = created._id;
  }

  // Create usages
  const usages = [
    { name: "Outline", description: "Used for outlining shapes and forms" },
    { name: "Filling", description: "Used to fill areas with texture or color" },
    { name: "Decorative", description: "Purely decorative stitches" },
    { name: "Border", description: "Used for creating borders and edges" },
    { name: "Texture", description: "Adds texture and dimension" }
  ];

  const createdUsages = {};
  for (const usage of usages) {
    const created = await Usage.create(usage);
    createdUsages[usage.name] = created._id;
  }

  // Create difficulties
  const difficulties = [
    { name: "Beginner", level: 1, description: "Easy stitches for beginners", color: "#4CAF50" },
    { name: "Intermediate", level: 3, description: "Moderate difficulty stitches", color: "#FF9800" },
    { name: "Advanced", level: 5, description: "Complex stitches requiring skill", color: "#F44336" }
  ];

  const createdDifficulties = {};
  for (const difficulty of difficulties) {
    const created = await Difficulty.create(difficulty);
    createdDifficulties[difficulty.name] = created._id;
  }

  // Create tags from the CSV data
  const allTags = new Set();
  stitchData.forEach(stitch => {
    if (Array.isArray(stitch.tags)) {
      stitch.tags.forEach(tag => allTags.add(tag.toLowerCase()));
    }
  });

  const createdTags = {};
  for (const tagName of allTags) {
    const created = await Tag.create({ name: tagName });
    createdTags[tagName] = created._id;
  }

  // Create some basic swatches
  const swatches = [
    { name: "Black", hexCode: "#000000", rgbCode: { r: 0, g: 0, b: 0 } },
    { name: "White", hexCode: "#FFFFFF", rgbCode: { r: 255, g: 255, b: 255 } },
    { name: "Red", hexCode: "#FF0000", rgbCode: { r: 255, g: 0, b: 0 } },
    { name: "Blue", hexCode: "#0000FF", rgbCode: { r: 0, g: 0, b: 255 } },
    { name: "Green", hexCode: "#00FF00", rgbCode: { r: 0, g: 255, b: 0 } }
  ];

  const createdSwatches = {};
  for (const swatch of swatches) {
    const created = await Swatch.create(swatch);
    createdSwatches[swatch.name] = created._id;
  }

  return { createdFamilies, createdUsages, createdDifficulties, createdTags, createdSwatches };
}

// Get all images for a stitch from images folder
function getAllStitchImages(referenceNumber) {
  const imagesDir = 'uploads/images';
  const images = [];
  
  try {
    if (!fs.existsSync(imagesDir)) {
      return images;
    }
    
    const files = fs.readdirSync(imagesDir);
    
    // Find all images that start with the reference number
    const matchingFiles = files.filter(file => {
      return file.startsWith(referenceNumber) && 
             (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) &&
             !file.includes('_step'); // Exclude step images (both old and new naming)
    });
    
    files.forEach(file => {
      const filePath = `uploads/images/${file}`;
      const stats = fs.statSync(filePath);
      images.push({
        filename: file,
        originalName: file,
        path: filePath,
        size: stats.size
      });
    });
    
  } catch (error) {
    console.log(`Error reading images for ${referenceNumber}:`, error.message);
  }
  
  return images;
}

// Get thumbnail image from thumbnails folder
function getThumbnailImage(referenceNumber) {
  const thumbnailsDir = 'uploads/thumbnails';
  
  try {
    if (!fs.existsSync(thumbnailsDir)) {
      return null;
    }
    
    const files = fs.readdirSync(thumbnailsDir);
    
    // Find thumbnail that starts with the reference number
    const thumbnailFile = files.find(file => {
      return file.startsWith(referenceNumber) && 
             (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'));
    });
    
    if (thumbnailFile) {
      const filePath = `uploads/thumbnails/${thumbnailFile}`;
      const stats = fs.statSync(filePath);
      return {
        filename: thumbnailFile,
        originalName: thumbnailFile,
        path: filePath,
        size: stats.size
      };
    }
    
  } catch (error) {
    console.log(`Error reading thumbnail for ${referenceNumber}:`, error.message);
  }
  
  return null;
}

// Check if step image exists
function getStepImagePath(referenceNumber, stepNumber) {
  const imagesDir = 'uploads/images';
  
  try {
    if (!fs.existsSync(imagesDir)) {
      return null;
    }
    
    const files = fs.readdirSync(imagesDir);
    
    // Find step image - support both old and new naming conventions
    const stepFile = files.find(file => {
      return (
        // Old naming: 1001_step1.jpg
        (file.startsWith(`${referenceNumber}_step${stepNumber}`) && 
         (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))) ||
        // New naming: 1036_whipchain_step1_draw.jpg
        (file.startsWith(referenceNumber) && 
         file.includes(`_step${stepNumber}_`) &&
         (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')))
      );
    });
    
    if (stepFile) {
      const filePath = `uploads/images/${stepFile}`;
      const stats = fs.statSync(filePath);
      return {
        filename: stepFile,
        originalName: stepFile,
        path: filePath,
        size: stats.size
      };
    }
    
  } catch (error) {
    console.log(`Error reading step image for ${referenceNumber}_step${stepNumber}:`, error.message);
  }
  
  return null;
}

// Create stitches and steps
async function createStitches(taxonomyItems) {
  console.log('Creating stitches and steps...');
  const { createdFamilies, createdUsages, createdDifficulties, createdTags, createdSwatches } = taxonomyItems;

  for (const stitchInfo of stitchData) {
    try {
      // Determine family based on stitch type
      let familyId = createdFamilies["Running Stitch Family"]; // default
      if (stitchInfo.name.toLowerCase().includes('chain')) {
        familyId = createdFamilies["Chain Stitch Family"];
      } else if (stitchInfo.name.toLowerCase().includes('back')) {
        familyId = createdFamilies["Backstitch Family"];
      } else if (stitchInfo.name.toLowerCase().includes('straight')) {
        familyId = createdFamilies["Straight Stitch Family"];
      }

      // Get difficulty
      const difficultyId = createdDifficulties[stitchInfo.difficulty];

      // Get tags
      const tagIds = [];
      if (Array.isArray(stitchInfo.tags)) {
        stitchInfo.tags.forEach(tag => {
          const tagId = createdTags[tag.toLowerCase()];
          if (tagId) tagIds.push(tagId);
        });
      }

      // Determine usage based on description and tags
      const usageIds = [];
      if (stitchInfo.description.toLowerCase().includes('outline') || 
          stitchInfo.tags.some(tag => tag.toLowerCase().includes('outline'))) {
        usageIds.push(createdUsages["Outline"]);
      }
      if (stitchInfo.description.toLowerCase().includes('decorative') || 
          stitchInfo.tags.some(tag => tag.toLowerCase().includes('decorative'))) {
        usageIds.push(createdUsages["Decorative"]);
      }
      if (stitchInfo.description.toLowerCase().includes('border') || 
          stitchInfo.tags.some(tag => tag.toLowerCase().includes('border'))) {
        usageIds.push(createdUsages["Border"]);
      }
      if (stitchInfo.description.toLowerCase().includes('texture') || 
          stitchInfo.tags.some(tag => tag.toLowerCase().includes('texture'))) {
        usageIds.push(createdUsages["Texture"]);
      }
      
      // Default to decorative if no usage found
      if (usageIds.length === 0) {
        usageIds.push(createdUsages["Decorative"]);
      }

      // Get all images and featured image for this stitch
      const allImages = getAllStitchImages(stitchInfo.referenceNumber);
      const featuredImage = getThumbnailImage(stitchInfo.referenceNumber);

      // Create stitch
      const stitchData = {
        name: stitchInfo.name,
        description: stitchInfo.description,
        referenceNumber: stitchInfo.referenceNumber,
        alternativeNames: stitchInfo.alternativeNames || [],
        notes: stitchInfo.notes || '',
        family: familyId,
        usages: usageIds,
        difficulty: difficultyId,
        tags: tagIds,
        swatches: [], // Leave empty for now as requested
        hexCodes: [], // Leave empty for now as requested
        featuredImage: featuredImage,
        images: allImages
      };

      const createdStitch = await Stitch.create(stitchData);
      console.log(`Created stitch: ${createdStitch.name}`);

      // Create steps
      if (stitchInfo.steps && stitchInfo.steps.length > 0) {
        for (let i = 0; i < stitchInfo.steps.length; i++) {
          const stepNumber = i + 1;
          const stepImage = getStepImagePath(stitchInfo.referenceNumber, stepNumber);

          const stepData = {
            stitch: createdStitch._id,
            stepNumber: stepNumber,
            instruction: stitchInfo.steps[i],
            images: stepImage ? [stepImage] : []
          };

          await Step.create(stepData);
        }
        console.log(`  Created ${stitchInfo.steps.length} steps`);
      }

    } catch (error) {
      console.error(`Error creating stitch ${stitchInfo.name}:`, error.message);
    }
  }
}

// Clear existing data
async function clearDatabase() {
  console.log('Clearing existing data...');
  
  // Drop collections to clear old indexes
  try {
    await mongoose.connection.db.dropCollection('steps');
    await mongoose.connection.db.dropCollection('stitches');
  } catch (error) {
    // Collections might not exist, ignore error
  }
  
  await Promise.all([
    Stitch.deleteMany({}),
    Step.deleteMany({}),
    Family.deleteMany({}),
    Usage.deleteMany({}),
    Difficulty.deleteMany({}),
    Tag.deleteMany({}),
    Swatch.deleteMany({})
  ]);
  console.log('Database cleared');
}

// Main seeding function
async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Create taxonomy items
    const taxonomyItems = await createTaxonomyItems();
    console.log('Taxonomy items created');
    
    // Create stitches and steps
    await createStitches(taxonomyItems);
    
    console.log('Database seeding completed successfully!');
    
    // Print summary
    const counts = await Promise.all([
      Stitch.countDocuments(),
      Step.countDocuments(),
      Family.countDocuments(),
      Usage.countDocuments(),
      Difficulty.countDocuments(),
      Tag.countDocuments(),
      Swatch.countDocuments()
    ]);
    
    console.log('\nDatabase Summary:');
    console.log(`Stitches: ${counts[0]}`);
    console.log(`Steps: ${counts[1]}`);
    console.log(`Families: ${counts[2]}`);
    console.log(`Usages: ${counts[3]}`);
    console.log(`Difficulties: ${counts[4]}`);
    console.log(`Tags: ${counts[5]}`);
    console.log(`Swatches: ${counts[6]}`);
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
