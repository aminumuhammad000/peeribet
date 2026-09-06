import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';
import { startLiveSettlementScheduler } from './services/settlementService';
import { startBridgeScheduler } from './services/bridgeProtocol';
import { initSocket } from './services/socketService';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

import { refreshMatchesFromProvider } from './controllers/matchController';

const server = app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  initSocket(server);
  startLiveSettlementScheduler();
  startBridgeScheduler();

  // Auto-refresh today's fixtures on boot
  refreshMatchesFromProvider().catch((err) => {
    console.warn('[Matches] Initial server boot sync warning:', err.message);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
