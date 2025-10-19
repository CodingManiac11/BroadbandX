import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private connectionAttempts = 0;
  private maxRetries = 5;
  private isConnecting = false;

  // Event listeners
  private eventListeners: { [key: string]: Function[] } = {};

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    if (this.isConnecting || this.socket?.connected) return;
    
    this.isConnecting = true;
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    console.log('🔌 Connecting to WebSocket server at:', serverUrl);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: this.maxRetries,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server:', this.socket?.id);
      this.connectionAttempts = 0;
      this.isConnecting = false;

      // Auto-authenticate if user ID is available
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId && !this.userId) {
        this.authenticate(storedUserId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
      this.isConnecting = false;
    });

    this.socket.on('authenticated', (data) => {
      console.log('🔐 WebSocket authentication successful:', data);
      this.userId = data.userId;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error);
      this.connectionAttempts++;
      this.isConnecting = false;

      if (this.connectionAttempts >= this.maxRetries) {
        console.error('❌ Max WebSocket connection retries reached');
      }
    });

    // Real-time event handlers
    this.socket.on('subscription_created', (data) => {
      console.log('📡 Subscription created event:', data);
      this.emit('subscription_created', data);
    });

    this.socket.on('subscription_cancelled', (data) => {
      console.log('📡 Subscription cancelled event:', data);
      this.emit('subscription_cancelled', data);
    });

    this.socket.on('subscription_modified', (data) => {
      console.log('📡 Subscription modified event:', data);
      this.emit('subscription_modified', data);
    });

    this.socket.on('subscription_status_changed', (data) => {
      console.log('📡 Subscription status changed event:', data);
      this.emit('subscription_status_changed', data);
    });

    this.socket.on('billing_updated', (data) => {
      console.log('📡 Billing updated event:', data);
      this.emit('billing_updated', data);
    });

    this.socket.on('payment_processed', (data) => {
      console.log('📡 Payment processed event:', data);
      this.emit('payment_processed', data);
    });

    this.socket.on('usage_updated', (data) => {
      console.log('📡 Usage updated event:', data);
      this.emit('usage_updated', data);
    });

    this.socket.on('system_notification', (data) => {
      console.log('📡 System notification event:', data);
      this.emit('system_notification', data);
    });

    this.socket.on('service_status_changed', (data) => {
      console.log('📡 Service status changed event:', data);
      this.emit('service_status_changed', data);
    });

    this.socket.on('maintenance_alert', (data) => {
      console.log('📡 Maintenance alert event:', data);
      this.emit('maintenance_alert', data);
    });
  }

  // Public methods
  authenticate(userId: string) {
    if (this.socket && userId) {
      this.userId = userId;
      this.socket.emit('authenticate', userId);
      console.log('🔐 Authenticating WebSocket with user ID:', userId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.isConnecting = false;
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.eventListeners[event]) return;

    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (listener) => listener !== callback
      );
    } else {
      delete this.eventListeners[event];
    }
  }

  private emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Subscription to updates
  subscribeToUpdates() {
    if (this.socket && this.userId) {
      this.socket.emit('subscribe_to_updates', { userId: this.userId });
    }
  }

  // Connection status
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get connectionId(): string | undefined {
    return this.socket?.id;
  }

  // Reconnect manually
  reconnect() {
    if (!this.isConnected && !this.isConnecting) {
      this.initializeConnection();
    }
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;