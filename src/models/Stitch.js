const mongoose = require('mongoose');

const stitchSchema = new mongoose.Schema({
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
  hexCodes: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Invalid hex color code format'
    }
  }],
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
stitchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Stitch', stitchSchema);
