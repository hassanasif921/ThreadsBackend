const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  squareCustomerId: {
    type: String,
    required: true,
    unique: true
  },
  squareSubscriptionId: {
    type: String,
    unique: true,
    sparse: true
  },
  squarePaymentId: {
    type: String,
    sparse: true
  },
  planType: {
    type: String,
    enum: ['free', 'premium_monthly', 'premium_yearly'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due', 'pending'],
    default: 'inactive'
  },
  currentPeriodStart: {
    type: Date
  },
  currentPeriodEnd: {
    type: Date
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  trialStart: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  isTrialActive: {
    type: Boolean,
    default: false
  },
  paymentMethodId: {
    type: String
  },
  lastPaymentDate: {
    type: Date
  },
  nextPaymentDate: {
    type: Date
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  metadata: {
    type: Map,
    of: String
  },
  webhookEvents: [{
    eventType: String,
    eventId: String,
    processedAt: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ squareCustomerId: 1 });
subscriptionSchema.index({ squareSubscriptionId: 1 });
subscriptionSchema.index({ squarePaymentId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ planType: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && 
         (!this.currentPeriodEnd || this.currentPeriodEnd > new Date());
});

// Virtual for checking if user has premium access
subscriptionSchema.virtual('hasPremiumAccess').get(function() {
  const now = new Date();
  
  // Check if trial is active
  if (this.isTrialActive && this.trialEnd && this.trialEnd > now) {
    return true;
  }
  
  // Check if subscription is active and premium (monthly or yearly)
  return this.isActive && 
         (this.planType === 'premium_monthly' || this.planType === 'premium_yearly');
});

// Method to check if subscription needs renewal
subscriptionSchema.methods.needsRenewal = function() {
  if (!this.currentPeriodEnd) return false;
  
  const daysUntilExpiry = Math.ceil((this.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 7; // Needs renewal within 7 days
};

// Method to cancel subscription
subscriptionSchema.methods.cancelSubscription = function(cancelAtPeriodEnd = true) {
  this.cancelAtPeriodEnd = cancelAtPeriodEnd;
  if (!cancelAtPeriodEnd) {
    this.status = 'cancelled';
    this.currentPeriodEnd = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
