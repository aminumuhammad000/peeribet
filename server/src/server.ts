import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';
import { startLiveSettlementScheduler } from './services/settlementService';
import { startBridgeScheduler } from './services/bridgeProtocol';
import { initSocket } from './services/socketService';
import { refreshMatchesFromProvider } from './controllers/matchController';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  initSocket(server);
  startLiveSettlementScheduler();
  startBridgeScheduler();

  // Initial match sync with Highlightly API & recurring periodic sync every 15 minutes
  refreshMatchesFromProvider().catch((err) =>
    console.warn('[Sync] Initial match refresh failed:', err.message)
  );
  setInterval(() => {
    refreshMatchesFromProvider().catch((err) =>
      console.warn('[Sync] Periodic match refresh failed:', err.message)
    );
  }, 15 * 60 * 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
