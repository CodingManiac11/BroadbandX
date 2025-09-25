const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxLength: [100, 'Plan name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Plan description is required'],
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['residential', 'business', 'enterprise'],
    required: [true, 'Plan category is required'],
    default: 'residential'
  },
  pricing: {
    monthly: {
      type: Number,
      required: [true, 'Monthly price is required'],
      min: [0, 'Price cannot be negative']
    },
    yearly: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    setupFee: {
      type: Number,
      default: 0,
      min: [0, 'Setup fee cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR']
    }
  },
  features: {
    speed: {
      download: {
        type: Number,
        required: [true, 'Download speed is required'],
        min: [1, 'Download speed must be at least 1 Mbps']
      },
      upload: {
        type: Number,
        required: [true, 'Upload speed is required'],
        min: [1, 'Upload speed must be at least 1 Mbps']
      },
      unit: {
        type: String,
        enum: ['Mbps', 'Gbps'],
        default: 'Mbps'
      }
    },
    dataLimit: {
      amount: {
        type: Number,
        default: null // null means unlimited
      },
      unit: {
        type: String,
        enum: ['GB', 'TB'],
        default: 'GB'
      },
      unlimited: {
        type: Boolean,
        default: true
      }
    },
    features: [{
      name: String,
      description: String,
      included: { type: Boolean, default: true }
    }]
  },
  availability: {
    regions: [{
      type: String,
      required: true
    }],
    cities: [{
      type: String,
      required: true
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
    default: 'active'
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  promotions: [{
    title: String,
    description: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    discountValue: Number,
    validFrom: Date,
    validUntil: Date,
    conditions: String
  }],
  technicalSpecs: {
    technology: {
      type: String,
      enum: ['fiber', 'cable', 'dsl', 'satellite', '5g'],
      required: true
    },
    latency: {
      type: Number, // in milliseconds
      min: 0
    },
    reliability: {
      type: Number, // percentage uptime
      min: 0,
      max: 100,
      default: 99.9
    },
    installation: {
      required: { type: Boolean, default: true },
      fee: { type: Number, default: 0 },
      timeframe: String // e.g., "2-5 business days"
    }
  },
  targetAudience: {
    type: String,
    enum: ['light-users', 'moderate-users', 'heavy-users', 'gamers', 'streamers', 'remote-workers', 'families', 'businesses'],
    required: true
  },
  contractTerms: {
    minimumTerm: {
      type: Number, // in months
      default: 12
    },
    earlyTerminationFee: {
      type: Number,
      default: 0
    },
    autoRenewal: {
      type: Boolean,
      default: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted speed
planSchema.virtual('formattedSpeed').get(function() {
  return `${this.features.speed.download}/${this.features.speed.upload} ${this.features.speed.unit}`;
});

// Virtual for yearly savings
planSchema.virtual('yearlySavings').get(function() {
  if (this.pricing.yearly) {
    const monthlyTotal = this.pricing.monthly * 12;
    return monthlyTotal - this.pricing.yearly;
  }
  return 0;
});

// Virtual for data limit display
planSchema.virtual('formattedDataLimit').get(function() {
  if (this.features.dataLimit.unlimited) {
    return 'Unlimited';
  }
  return `${this.features.dataLimit.amount} ${this.features.dataLimit.unit}`;
});

// Indexes for performance
planSchema.index({ status: 1 });
planSchema.index({ category: 1 });
planSchema.index({ 'pricing.monthly': 1 });
planSchema.index({ popularity: -1 });
planSchema.index({ 'availability.regions': 1 });
planSchema.index({ 'availability.cities': 1 });
planSchema.index({ targetAudience: 1 });
planSchema.index({ tags: 1 });

// Text index for search functionality
planSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
});

// Pre-save middleware to calculate yearly pricing if not provided
planSchema.pre('save', function(next) {
  if (!this.pricing.yearly && this.pricing.monthly) {
    // Apply 10% discount for yearly plans
    this.pricing.yearly = Math.round(this.pricing.monthly * 12 * 0.9);
  }
  next();
});

// Static method to get popular plans
planSchema.statics.getPopularPlans = function(limit = 5) {
  return this.find({ status: 'active' })
    .sort({ popularity: -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName');
};

// Static method to get plans by category
planSchema.statics.getPlansByCategory = function(category) {
  return this.find({ category, status: 'active' })
    .sort({ 'pricing.monthly': 1 });
};

// Static method to search plans
planSchema.statics.searchPlans = function(query, filters = {}) {
  const searchCriteria = {
    status: 'active',
    ...filters
  };

  if (query) {
    searchCriteria.$text = { $search: query };
  }

  return this.find(searchCriteria)
    .sort(query ? { score: { $meta: 'textScore' } } : { popularity: -1 });
};

// Method to check if plan is available in region/city
planSchema.methods.isAvailableIn = function(region, city) {
  const regionMatch = this.availability.regions.includes(region);
  const cityMatch = city ? this.availability.cities.includes(city) : true;
  return regionMatch && cityMatch;
};

// Method to get active promotions
planSchema.methods.getActivePromotions = function() {
  const now = new Date();
  return this.promotions.filter(promo => 
    promo.validFrom <= now && promo.validUntil >= now
  );
};

// Static method to get plan statistics
planSchema.statics.getPlanStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$pricing.monthly' },
        minPrice: { $min: '$pricing.monthly' },
        maxPrice: { $max: '$pricing.monthly' }
      }
    }
  ]);
};

module.exports = mongoose.model('Plan', planSchema);