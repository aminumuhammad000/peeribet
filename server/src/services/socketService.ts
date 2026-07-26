import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow all origins for the mobile app
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    console.warn('[Socket] Socket.io not initialized yet.');
  }
  return io;
};
