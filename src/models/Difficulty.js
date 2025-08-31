const mongoose = require('mongoose');

const difficultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Difficulty name is required'],
    trim: true,
    unique: true
  },
  level: {
    type: Number,
    required: [true, 'Difficulty level is required'],
    min: 1,
    max: 5
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String, // hex color code for UI
    default: '#000000'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

difficultySchema.index({ name: 1 });
difficultySchema.index({ level: 1 });

module.exports = mongoose.model('Difficulty', difficultySchema);
