import { Server } from 'socket.io';
import { eventBus } from '../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../domain/events/transport.events.js';
import { MATCHING_EVENTS } from '../domain/events/matching.events.js';
import logger from '../logger/index.js';
import { verifyAccessToken } from '../auth/utils/token.util.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Optional: JWT Middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id} (User: ${socket.user.id})`);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
    
    // Clients can join rooms based on missionId or organId if needed
    socket.on('join_mission', (missionId) => {
      socket.join(missionId);
      logger.info(`Socket ${socket.id} joined mission room: ${missionId}`);
    });
    
    socket.on('leave_mission', (missionId) => {
      socket.leave(missionId);
    });
  });

  bindEventBus();

  logger.info('WebSocket Service initialized');
  return io;
};

const bindEventBus = () => {
  // Transport Events
  eventBus.on(TRANSPORT_EVENTS.TELEMETRY_RECEIVED, (payload) => {
    io.emit('transport:telemetry', payload);
    // Also emit to specific mission room if active
    if (payload.missionId) {
      io.to(payload.missionId).emit('transport:telemetry', payload);
    }
  });

  eventBus.on(TRANSPORT_EVENTS.TELEMETRY_ALERT, (payload) => {
    io.emit('transport:alert', payload);
    if (payload.missionId) {
      io.to(payload.missionId).emit('transport:alert', payload);
    }
  });

  eventBus.on(TRANSPORT_EVENTS.HEALTH_STATUS_CHANGED, (payload) => {
    io.emit('transport:health_change', payload);
    if (payload.missionId) {
      io.to(payload.missionId).emit('transport:health_change', payload);
    }
  });

  // Matching Events
  eventBus.on(MATCHING_EVENTS.MATCH_FOUND, (payload) => {
    io.emit('match:update', payload);
  });

  eventBus.on(MATCHING_EVENTS.MATCH_ACCEPTED, (payload) => {
    io.emit('match:update', payload);
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
