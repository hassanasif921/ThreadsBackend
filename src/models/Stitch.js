const mongoose = require('mongoose');

const stitchSchema = new mongoose.Schema({
  author: {
    name: {
      type: String,
      required: true,
      default: 'John'
    },
    image: {
      type: String,
      default: 'https://www.shutterstock.com/image-vector/vector-bright-portrait-beautiful-brunette-600nw-2452267975.jpg'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  alternativeNames: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Difficulty'
  },
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family'
  },
  usages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usage'
  }],
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  swatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Swatch'
  }],
  materials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  hexCodes: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Invalid hex color code format'
    }
  }],
  featuredImage: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  images: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  videos: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    duration: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  premiumFeatures: [{
    type: String,
    enum: ['high_quality_images', 'video_tutorials', 'detailed_instructions', 'pattern_downloads', 'exclusive_content']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
stitchSchema.index({ name: 1 });
stitchSchema.index({ referenceNumber: 1 });
stitchSchema.index({ difficulty: 1 });
stitchSchema.index({ family: 1 });
stitchSchema.index({ tags: 1 });
stitchSchema.index({ isActive: 1 });
stitchSchema.index({ isFeatured: 1 });
stitchSchema.index({ tier: 1 });
stitchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Stitch', stitchSchema);
