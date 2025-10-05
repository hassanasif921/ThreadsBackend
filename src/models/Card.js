const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  squareCustomerId: {
    type: String,
    required: true,
    index: true
  },
  cardId: {
    type: String,
    required: true,
    unique: true
  },
  last4: {
    type: String,
    required: true
  },
  cardBrand: {
    type: String,
    required: true
  },
  expMonth: {
    type: Number,
    required: true
  },
  expYear: {
    type: Number,
    required: true
  },
  cardholderName: {
    type: String,
    default: 'Card Holder'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  paymentMethodId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Ensure only one default card per user
cardSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default status from other cards for this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Card', cardSchema);
