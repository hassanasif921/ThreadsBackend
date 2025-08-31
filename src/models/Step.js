const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  stitch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stitch',
    required: true
  },
  stepNumber: {
    type: Number,
    required: true
  },
  instruction: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for stitch and step number
stepSchema.index({ stitch: 1, stepNumber: 1 }, { unique: true });
stepSchema.index({ stitch: 1 });
stepSchema.index({ isActive: 1 });

module.exports = mongoose.model('Step', stepSchema);
