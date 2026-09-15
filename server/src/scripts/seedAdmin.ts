import mongoose from 'mongoose';
import { createOrUpdateAdmin } from './createAdmin';

async function seedAdmin() {
  try {
    console.log('Seeding default administrator credentials...');
    await createOrUpdateAdmin({
      email: process.env.ADMIN_EMAIL || 'admin@peeritrade.com',
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    });
    await mongoose.disconnect();
    console.log('Admin seeding completed successfully.');
    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding admin:', error.message || error);
    process.exit(1);
  }
}

seedAdmin();
