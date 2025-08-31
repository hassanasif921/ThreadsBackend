const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
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
usageSchema.index({ name: 1 });
usageSchema.index({ isActive: 1 });

module.exports = mongoose.model('Usage', usageSchema);
