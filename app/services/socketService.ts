import { io, Socket } from 'socket.io-client';

// Define the backend URL directly or use an env variable
const BACKEND_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }
  return socket;
};
