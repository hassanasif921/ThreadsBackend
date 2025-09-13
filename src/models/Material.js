const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['thread', 'fabric', 'yarn', 'ribbon', 'wire', 'other'],
    default: 'thread'
  },
  weight: {
    type: String,
    trim: true // e.g., "6-strand", "worsted weight", "lightweight"
  },
  fiber: {
    type: String,
    trim: true // e.g., "cotton", "silk", "wool", "polyester"
  },
  brand: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  hexCode: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Invalid hex color code format'
    }
  },
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
materialSchema.index({ name: 1 });
materialSchema.index({ type: 1 });
materialSchema.index({ fiber: 1 });
materialSchema.index({ brand: 1 });
materialSchema.index({ isActive: 1 });
materialSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Material', materialSchema);
