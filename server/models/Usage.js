const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  downloadedGB: {
    type: Number,
    required: true,
    min: [0, 'Downloaded data cannot be negative'],
    default: 0
  },
  uploadedGB: {
    type: Number,
    required: true,
    min: [0, 'Uploaded data cannot be negative'],
    default: 0
  },
  latencyMs: {
    type: Number,
    required: true,
    min: [0, 'Latency cannot be negative'],
    default: 0
  },
  // Additional FlexiSub-specific fields
  sessionDuration: {
    type: Number, // in minutes
    default: 0
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'smart-tv', 'gaming-console', 'iot', 'router'],
    default: 'desktop'
  },
  applicationUsage: [{
    app: {
      type: String,
      enum: ['streaming', 'gaming', 'browsing', 'video-call', 'file-transfer', 'social-media', 'work', 'other']
    },
    dataUsedGB: Number,
    duration: Number // in minutes
  }],
  qualityMetrics: {
    downloadSpeed: {
      type: Number, // in Mbps
      default: 0
    },
    uploadSpeed: {
      type: Number, // in Mbps
      default: 0
    },
    packetLoss: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100
    },
    jitter: {
      type: Number, // in ms
      default: 0
    },
    uptime: {
      type: Number, // percentage
      default: 100,
      min: 0,
      max: 100
    }
  },
  location: {
    city: String,
    region: String,
    country: String,
    timezone: String
  },
  peakHour: {
    type: Boolean,
    default: false
  },
  costImpact: {
    baseCost: Number,
    overage: Number,
    discount: Number,
    finalCost: Number
  },
  anomalyDetection: {
    isAnomaly: {
      type: Boolean,
      default: false
    },
    anomalyType: {
      type: String,
      enum: ['high-usage', 'unusual-pattern', 'quality-degradation', 'security-alert']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
usageSchema.index({ userId: 1, timestamp: -1 });
usageSchema.index({ planId: 1, timestamp: -1 });
usageSchema.index({ subscriptionId: 1, timestamp: -1 });
usageSchema.index({ timestamp: -1 });
usageSchema.index({ 'anomalyDetection.isAnomaly': 1 });

// Virtual for total data usage
usageSchema.virtual('totalDataGB').get(function() {
  return this.downloadedGB + this.uploadedGB;
});

// Virtual for usage efficiency (data per session time)
usageSchema.virtual('usageEfficiency').get(function() {
  if (this.sessionDuration === 0) return 0;
  return this.totalDataGB / (this.sessionDuration / 60); // GB per hour
});

// Static method to get user usage summary
usageSchema.statics.getUserUsageSummary = async function(userId, startDate, endDate) {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId)
  };

  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalDownloaded: { $sum: '$downloadedGB' },
        totalUploaded: { $sum: '$uploadedGB' },
        totalSessions: { $sum: 1 },
        avgLatency: { $avg: '$latencyMs' },
        avgDownloadSpeed: { $avg: '$qualityMetrics.downloadSpeed' },
        avgUploadSpeed: { $avg: '$qualityMetrics.uploadSpeed' },
        totalSessionTime: { $sum: '$sessionDuration' },
        anomalies: {
          $sum: {
            $cond: ['$anomalyDetection.isAnomaly', 1, 0]
          }
        }
      }
    }
  ]);
};

// Static method to get plan usage analytics
usageSchema.statics.getPlanUsageAnalytics = async function(planId, period = '30d') {
  const daysBack = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return this.aggregate([
    {
      $match: {
        planId: new mongoose.Types.ObjectId(planId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp'
          }
        },
        totalUsers: { $addToSet: '$userId' },
        totalData: { $sum: { $add: ['$downloadedGB', '$uploadedGB'] } },
        avgLatency: { $avg: '$latencyMs' },
        peakUsage: { $max: { $add: ['$downloadedGB', '$uploadedGB'] } }
      }
    },
    {
      $project: {
        date: '$_id',
        userCount: { $size: '$totalUsers' },
        totalDataGB: '$totalData',
        avgLatencyMs: '$avgLatency',
        peakUsageGB: '$peakUsage'
      }
    },
    { $sort: { date: 1 } }
  ]);
};

// Pre-save middleware to detect anomalies
usageSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Simple anomaly detection logic
    const userAvg = await this.constructor.aggregate([
      {
        $match: {
          userId: this.userId,
          timestamp: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDownload: { $avg: '$downloadedGB' },
          avgUpload: { $avg: '$uploadedGB' },
          avgLatency: { $avg: '$latencyMs' }
        }
      }
    ]);

    if (userAvg.length > 0) {
      const avg = userAvg[0];
      const downloadThreshold = avg.avgDownload * 3; // 3x average
      const uploadThreshold = avg.avgUpload * 3;
      const latencyThreshold = avg.avgLatency * 2; // 2x average

      if (this.downloadedGB > downloadThreshold || 
          this.uploadedGB > uploadThreshold || 
          this.latencyMs > latencyThreshold) {
        this.anomalyDetection.isAnomaly = true;
        this.anomalyDetection.anomalyType = 'high-usage';
        this.anomalyDetection.confidence = 0.8;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Usage', usageSchema);