const UsageLog = require('../models/UsageLog');

class UsageService {
  constructor() {
    this.activeConnections = new Map();
  }

  // Start tracking a user session
  async startSession(userId, deviceInfo) {
    const sessionId = `${userId}-${deviceInfo.deviceId}-${Date.now()}`;
    this.activeConnections.set(sessionId, {
      userId,
      deviceId: deviceInfo.deviceId,
      deviceType: deviceInfo.deviceType,
      startTime: Date.now(),
      download: 0,
      upload: 0,
      ipAddress: deviceInfo.ipAddress,
      location: deviceInfo.location,
    });
    return sessionId;
  }

  // Update usage metrics for a session
  async updateUsage(sessionId, metrics) {
    const session = this.activeConnections.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update session metrics
    session.download += metrics.download || 0;
    session.upload += metrics.upload || 0;
    session.lastMetrics = {
      downloadSpeed: metrics.downloadSpeed,
      uploadSpeed: metrics.uploadSpeed,
      latency: metrics.latency,
      packetLoss: metrics.packetLoss,
    };
  }

  // End a user session and log the final usage
  async endSession(sessionId) {
    const session = this.activeConnections.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const sessionDuration = Math.round((Date.now() - session.startTime) / (1000 * 60)); // in minutes

    // Create usage log
    await UsageLog.create({
      userId: session.userId,
      deviceId: session.deviceId,
      deviceType: session.deviceType,
      download: session.download,
      upload: session.upload,
      downloadSpeed: session.lastMetrics?.downloadSpeed || 0,
      uploadSpeed: session.lastMetrics?.uploadSpeed || 0,
      latency: session.lastMetrics?.latency || 0,
      packetLoss: session.lastMetrics?.packetLoss || 0,
      location: session.location,
      ipAddress: session.ipAddress,
      sessionDuration,
    });

    // Clean up session
    this.activeConnections.delete(sessionId);
  }

  // Get current active sessions
  getActiveSessions() {
    return Array.from(this.activeConnections.entries()).map(([sessionId, session]) => ({
      sessionId,
      userId: session.userId,
      deviceId: session.deviceId,
      deviceType: session.deviceType,
      duration: Math.round((Date.now() - session.startTime) / (1000 * 60)), // in minutes
      currentDownload: session.download,
      currentUpload: session.upload,
    }));
  }

  // Clean up stale sessions (older than 1 hour without updates)
  async cleanupStaleSessions() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [sessionId, session] of this.activeConnections.entries()) {
      if (session.startTime < oneHourAgo) {
        await this.endSession(sessionId);
      }
    }
  }

  // Schedule cleanup of stale sessions every hour
  startCleanupSchedule() {
    setInterval(() => {
      this.cleanupStaleSessions().catch(console.error);
    }, 60 * 60 * 1000); // Run every hour
  }
}

// Create singleton instance
const usageService = new UsageService();
usageService.startCleanupSchedule();

module.exports = usageService;