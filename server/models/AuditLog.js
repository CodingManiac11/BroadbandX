const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entity: {
    type: String,
    required: true,
    enum: ['User', 'Plan', 'Subscription', 'PricingHistory', 'Usage']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'approve', 'reject', 'suspend', 'activate', 'login', 'logout']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['customer', 'admin'],
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  sessionId: String,
  requestId: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userEmail: 1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function(options) {
  const {
    entity,
    entityId,
    action,
    userId,
    userEmail,
    userRole,
    ipAddress,
    userAgent,
    details = {},
    previousValues,
    newValues,
    success = true,
    errorMessage,
    sessionId,
    requestId
  } = options;

  try {
    const auditEntry = new this({
      entity,
      entityId,
      action,
      userId,
      userEmail,
      userRole,
      ipAddress,
      userAgent,
      details,
      previousValues,
      newValues,
      success,
      errorMessage,
      sessionId,
      requestId
    });

    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

// Static method to get audit trail for an entity
auditLogSchema.statics.getAuditTrail = async function(entity, entityId, limit = 50) {
  return this.find({ entity, entityId })
    .populate('userId', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, startDate, endDate, limit = 100) {
  const query = { userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

module.exports = mongoose.model('AuditLog', auditLogSchema);