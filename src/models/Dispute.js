const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  disputeId: {
    type: String,
    unique: true,
    required: true
  },
  category: {
    type: String,
    enum: [
      'billing',
      'technical_issue',
      'content_issue',
      'account_access',
      'privacy_concern',
      'inappropriate_content',
      'feature_request',
      'other'
    ],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'cancelled'],
    default: 'open'
  },
  contactInfo: {
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'in_app'],
      default: 'email'
    }
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  relatedItems: {
    stitchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stitch'
    },
    orderId: String,
    transactionId: String
  },
  adminNotes: [{
    note: String,
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    resolvedBy: String,
    resolvedAt: Date,
    resolutionNote: String,
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate dispute ID before saving
disputeSchema.pre('save', function(next) {
  if (this.isNew && !this.disputeId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.disputeId = `DSP-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Indexes for efficient querying
disputeSchema.index({ userId: 1, createdAt: -1 });
disputeSchema.index({ disputeId: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ category: 1 });
disputeSchema.index({ priority: 1 });
disputeSchema.index({ createdAt: -1 });
disputeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
