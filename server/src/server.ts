import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';
import { startLiveRefreshScheduler, startLiveSettlementScheduler } from './services/settlementService';
import { initSocket } from './services/socketService';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  initSocket(server);
  startLiveSettlementScheduler();
  startLiveRefreshScheduler();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
