const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: function() {
      // Only required if not using social login
      return !this.googleId && !this.appleId;
    },
    unique: true,
    sparse: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: function() {
      // Only required if not using social login
      return !this.googleId && !this.appleId;
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  appleId: {
    type: String,
    sparse: true,
    unique: true
  },
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  termsAcceptedAt: {
    type: Date,
    default: null
  },
  profilePicture: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  squareCustomerId: {
    type: String,
    unique: true,
    sparse: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'premium_monthly', 'premium_yearly', 'trial', 'cancelled'],
    default: 'free'
  },
  premiumAccessUntil: {
    type: Date,
    default: null
  },
  trialUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user's full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if user has premium access
userSchema.methods.hasPremiumAccess = function() {
  const now = new Date();
  
  // Check if user has active premium subscription (monthly or yearly)
  if (this.subscriptionStatus === 'premium_monthly' || this.subscriptionStatus === 'premium_yearly') {
    return !this.premiumAccessUntil || this.premiumAccessUntil > now;
  }
  
  // Check if user is in trial period
  if (this.subscriptionStatus === 'trial') {
    return this.premiumAccessUntil && this.premiumAccessUntil > now;
  }
  
  return false;
};

// Method to start free trial
userSchema.methods.startFreeTrial = function(trialDays = 7) {
  if (this.trialUsed) {
    throw new Error('Free trial already used');
  }
  
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + trialDays);
  
  this.subscriptionStatus = 'trial';
  this.premiumAccessUntil = trialEnd;
  this.trialUsed = true;
  
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
