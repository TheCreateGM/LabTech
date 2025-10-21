import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { userRepository } from '../repositories/UserRepository';

/**
 * JWT payload interface
 */
interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Authenticated socket interface
 */
interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  role?: string;
}

/**
 * Activity event data
 */
export interface ActivityEvent {
  id: string;
  userId: string | null;
  username?: string;
  action: string;
  resourceType: string;
  resourcePath: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Statistics update event data
 */
export interface StatsUpdateEvent {
  totalActivities: number;
  actionsBreakdown: Record<string, number>;
  topUsers: Array<{ userId: string; username: string; count: number }>;
  topFiles: Array<{ path: string; count: number }>;
  timestamp: string;
}

/**
 * WebSocket service for real-time updates
 */
export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();
  private eventThrottleMap: Map<string, number> = new Map();
  private readonly MAX_EVENTS_PER_SECOND = 10;
  private readonly THROTTLE_WINDOW_MS = 1000;
  private batchActivityBuffer: ActivityEvent[] = [];
  private batchEmitTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_EMIT_INTERVAL_MS = 10000; // 10 seconds
  private publicKey: string;

  constructor() {
    // Load RSA public key for JWT verification
    const keysPath = path.join(__dirname, '../../keys');
    this.publicKey = fs.readFileSync(path.join(keysPath, 'public.pem'), 'utf8');
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupConnectionHandlers();
    this.startBatchEmitScheduler();
    console.log('WebSocket server initialized');
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      console.log(`Client connected: ${socket.id}`);

      // Wait for authentication
      socket.on('authenticate', async (token: string) => {
        try {
          await this.authenticateSocket(socket, token);
        } catch (error) {
          console.error(`Authentication failed for socket ${socket.id}:`, error);
          socket.emit('authentication:error', {
            message: 'Authentication failed',
          });
          socket.disconnect(true);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      // Set timeout for authentication
      setTimeout(() => {
        if (!socket.userId) {
          console.log(`Socket ${socket.id} disconnected due to authentication timeout`);
          socket.emit('authentication:error', {
            message: 'Authentication timeout',
          });
          socket.disconnect(true);
        }
      }, 10000); // 10 seconds timeout
    });
  }

  /**
   * Authenticate socket connection using JWT token
   */
  private async authenticateSocket(socket: AuthenticatedSocket, token: string): Promise<void> {
    try {
      // Verify JWT token
      const decoded = verify(token, this.publicKey, {
        algorithms: ['RS256'],
      }) as JWTPayload;

      // Verify user exists
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Attach user info to socket
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      socket.role = decoded.role;

      // Store connected client
      this.connectedClients.set(socket.id, socket);

      // Join admin room if user is admin
      if (decoded.role === 'admin' || decoded.role === 'super_admin') {
        socket.join('admin-room');
        console.log(`Admin user ${decoded.username} joined admin-room`);
      }

      // Emit authentication success
      socket.emit('connection:authenticated', {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      });

      console.log(`Socket ${socket.id} authenticated as ${decoded.username} (${decoded.role})`);
    } catch (error) {
      console.error('Socket authentication error:', error);
      throw error;
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    console.log(`Client disconnected: ${socket.id}`);

    // Remove from connected clients
    this.connectedClients.delete(socket.id);

    // Clean up throttle map for this socket
    const throttleKeys = Array.from(this.eventThrottleMap.keys()).filter((key) =>
      key.startsWith(socket.id)
    );
    throttleKeys.forEach((key) => this.eventThrottleMap.delete(key));
  }

  /**
   * Check if event should be throttled
   */
  private shouldThrottle(socketId: string, eventType: string): boolean {
    const key = `${socketId}:${eventType}`;
    const now = Date.now();
    const lastEmit = this.eventThrottleMap.get(key) || 0;
    const timeSinceLastEmit = now - lastEmit;

    // Calculate events per second
    if (timeSinceLastEmit < this.THROTTLE_WINDOW_MS) {
      const eventsInWindow = Math.floor(this.THROTTLE_WINDOW_MS / timeSinceLastEmit);
      if (eventsInWindow >= this.MAX_EVENTS_PER_SECOND) {
        return true; // Throttle
      }
    }

    // Update last emit time
    this.eventThrottleMap.set(key, now);

    // Clean up old entries
    if (this.eventThrottleMap.size > 1000) {
      const cutoff = now - this.THROTTLE_WINDOW_MS * 2;
      for (const [k, v] of this.eventThrottleMap.entries()) {
        if (v < cutoff) {
          this.eventThrottleMap.delete(k);
        }
      }
    }

    return false;
  }

  /**
   * Start batch emit scheduler
   */
  private startBatchEmitScheduler(): void {
    this.batchEmitTimer = setInterval(() => {
      this.emitBufferedBatch();
    }, this.BATCH_EMIT_INTERVAL_MS);
  }

  /**
   * Emit buffered batch activities
   */
  private emitBufferedBatch(): void {
    if (this.batchActivityBuffer.length === 0) {
      return;
    }

    const batch = [...this.batchActivityBuffer];
    this.batchActivityBuffer = [];

    this.emitBatchActivities(batch);
  }

  /**
   * Emit new activity event to admin room
   */
  emitNewActivity(activity: ActivityEvent): void {
    if (!this.io) {
      console.warn('Socket.IO server not initialized, skipping activity emission');
      return;
    }

    try {
      // Add to batch buffer for periodic batch emission
      this.batchActivityBuffer.push(activity);

      // Check throttling for each connected admin
      const adminSockets = Array.from(this.connectedClients.values()).filter(
        (socket) => socket.role === 'admin' || socket.role === 'super_admin'
      );

      for (const socket of adminSockets) {
        if (!this.shouldThrottle(socket.id, 'activity:new')) {
          socket.emit('activity:new', activity);
        }
      }

      console.log(`Emitted activity:new event to ${adminSockets.length} admin(s)`);
    } catch (error) {
      console.error('Error emitting new activity:', error);
      // Don't throw - WebSocket failures shouldn't affect activity logging
    }
  }

  /**
   * Emit batch activity events to admin room
   */
  emitBatchActivities(activities: ActivityEvent[]): void {
    if (!this.io) {
      console.warn('Socket.IO server not initialized, skipping batch emission');
      return;
    }

    try {
      this.io.to('admin-room').emit('activity:batch', {
        activities,
        count: activities.length,
        timestamp: new Date().toISOString(),
      });

      console.log(`Emitted activity:batch event with ${activities.length} activities`);
    } catch (error) {
      console.error('Error emitting batch activities:', error);
    }
  }

  /**
   * Emit statistics update to admin room
   */
  emitStatsUpdate(stats: StatsUpdateEvent): void {
    if (!this.io) {
      console.warn('Socket.IO server not initialized, skipping stats emission');
      return;
    }

    try {
      this.io.to('admin-room').emit('stats:update', stats);
      console.log('Emitted stats:update event');
    } catch (error) {
      console.error('Error emitting stats update:', error);
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get connected admin clients count
   */
  getConnectedAdminsCount(): number {
    return Array.from(this.connectedClients.values()).filter(
      (socket) => socket.role === 'admin' || socket.role === 'super_admin'
    ).length;
  }

  /**
   * Close WebSocket server
   */
  async close(): Promise<void> {
    // Stop batch emit scheduler
    if (this.batchEmitTimer) {
      clearInterval(this.batchEmitTimer);
      this.batchEmitTimer = null;
    }

    // Emit any remaining buffered activities
    this.emitBufferedBatch();

    if (this.io) {
      // Disconnect all clients
      this.io.disconnectSockets(true);

      // Close server
      await new Promise<void>((resolve) => {
        this.io!.close(() => {
          console.log('WebSocket server closed');
          resolve();
        });
      });

      this.io = null;
    }

    // Clear maps and buffers
    this.connectedClients.clear();
    this.eventThrottleMap.clear();
    this.batchActivityBuffer = [];
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
