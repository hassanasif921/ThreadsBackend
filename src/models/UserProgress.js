const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  stitch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stitch',
    required: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  completedSteps: [{
    step: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  practiceCount: {
    type: Number,
    default: 0
  },
  lastPracticed: {
    type: Date
  },
  difficultyRating: {
    type: Number,
    min: 1,
    max: 5
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for user and stitch
userProgressSchema.index({ userId: 1, stitch: 1 }, { unique: true });
userProgressSchema.index({ userId: 1 });
userProgressSchema.index({ stitch: 1 });
userProgressSchema.index({ isFavorite: 1 });
userProgressSchema.index({ isActive: 1 });

module.exports = mongoose.model('UserProgress', userProgressSchema);
