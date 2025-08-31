const mongoose = require('mongoose');

const swatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  hexCode: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Invalid hex color code format'
    }
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
swatchSchema.index({ name: 1 });
swatchSchema.index({ hexCode: 1 });
swatchSchema.index({ isActive: 1 });

module.exports = mongoose.model('Swatch', swatchSchema);
