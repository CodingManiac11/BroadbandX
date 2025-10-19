// Real-time events utility for WebSocket communications
class RealTimeEvents {
  constructor(io) {
    this.io = io;
  }

  // Emit subscription events to user's personal room
  emitToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    console.log(`📡 Emitted ${event} to user ${userId}:`, data);
  }

  // Subscription Events
  subscriptionCreated(userId, subscription) {
    this.emitToUser(userId, 'subscription_created', {
      type: 'subscription_created',
      subscription,
      message: `New subscription created: ${subscription.plan?.name || 'Unknown Plan'}`
    });
  }

  subscriptionCancelled(userId, subscription) {
    this.emitToUser(userId, 'subscription_cancelled', {
      type: 'subscription_cancelled',
      subscription,
      message: `Subscription cancelled: ${subscription.plan?.name || 'Unknown Plan'}`
    });
  }

  subscriptionModified(userId, subscription, changes) {
    this.emitToUser(userId, 'subscription_modified', {
      type: 'subscription_modified',
      subscription,
      changes,
      message: `Subscription modified: ${subscription.plan?.name || 'Unknown Plan'}`
    });
  }

  subscriptionStatusChanged(userId, subscription, oldStatus, newStatus) {
    this.emitToUser(userId, 'subscription_status_changed', {
      type: 'subscription_status_changed',
      subscription,
      oldStatus,
      newStatus,
      message: `Subscription status changed from ${oldStatus} to ${newStatus}`
    });
  }

  // Billing Events
  billingUpdated(userId, billing) {
    this.emitToUser(userId, 'billing_updated', {
      type: 'billing_updated',
      billing,
      message: 'Billing information updated'
    });
  }

  paymentProcessed(userId, payment) {
    this.emitToUser(userId, 'payment_processed', {
      type: 'payment_processed',
      payment,
      message: `Payment processed: $${payment.amount}`
    });
  }

  // System Events
  systemNotification(userId, notification) {
    this.emitToUser(userId, 'system_notification', {
      type: 'system_notification',
      notification,
      message: notification.message
    });
  }

  // Usage Events
  usageUpdated(userId, usage) {
    this.emitToUser(userId, 'usage_updated', {
      type: 'usage_updated',
      usage,
      message: 'Usage data updated'
    });
  }

  // Broadcast to all users (admin events)
  broadcastToAll(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    console.log(`📡 Broadcasted ${event} to all users:`, data);
  }

  // Service status updates
  serviceStatusChanged(status) {
    this.broadcastToAll('service_status_changed', {
      type: 'service_status_changed',
      status,
      message: `Service status: ${status}`
    });
  }

  // Maintenance notifications
  maintenanceAlert(maintenance) {
    this.broadcastToAll('maintenance_alert', {
      type: 'maintenance_alert',
      maintenance,
      message: `Maintenance scheduled: ${maintenance.title}`
    });
  }
}

module.exports = RealTimeEvents;