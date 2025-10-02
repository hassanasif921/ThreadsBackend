const mongoose = require('mongoose');

const legalContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['privacy_policy', 'terms_conditions'],
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  effectiveDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    author: {
      type: String,
      default: 'Admin'
    },
    language: {
      type: String,
      default: 'en'
    },
    jurisdiction: {
      type: String,
      default: 'US'
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
legalContentSchema.index({ type: 1, isActive: 1 });
legalContentSchema.index({ effectiveDate: -1 });

// Update lastUpdated on save
legalContentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

module.exports = mongoose.model('LegalContent', legalContentSchema);
