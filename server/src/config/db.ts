import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createOrUpdateAdmin } from '../scripts/createAdmin';

dotenv.config();

const autoSeedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@peeritrade.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    await createOrUpdateAdmin({
      email: adminEmail,
      password: adminPass,
      username: adminUsername,
      silent: true,
    });
    console.log(`[Auth] Default admin account ready: ${adminEmail}`);
  } catch (err: any) {
    console.warn('[Auth] Admin auto-seeding warning:', err.message);
  }
};

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    await autoSeedAdmin();
  } catch (error: any) {
    console.warn(`[Database] Could not connect to primary MongoDB (${uri}): ${error.message}`);
    console.log(`[Database] Attempting to start in-memory MongoDB instance for local development...`);
    try {
      // Dynamic import in case package is being resolved or loaded in dev
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] In-Memory MongoDB Connected successfully at ${memUri}`);
      await autoSeedAdmin();
    } catch (memErr: any) {
      console.error(`[Database] Failed to initialize database: ${memErr.message}`);
      console.error('Please ensure MongoDB is running or specify a valid MONGODB_URI in server/.env');
      process.exit(1);
    }
  }
};

export default connectDB;

