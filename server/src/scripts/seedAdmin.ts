import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peeritrade');
    console.log('Connected to MongoDB');

    const adminUsername = 'peeritrade.com';
    const adminEmail = 'admin@peeritrade.com';
    const adminPassword = 'Admin@123456';

    const existingAdmin = await User.findOne({
      $or: [{ username: adminUsername }, { email: adminEmail }, { email: adminUsername }]
    });
    
    if (existingAdmin) {
      console.log('Admin already exists. Updating username, email, password and role...');
      existingAdmin.username = adminUsername;
      existingAdmin.password = adminPassword; // Pre-save hook will hash this
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      console.log('Admin updated successfully.');
    } else {
      console.log('Creating new admin...');
      await User.create({
        firstName: 'Peeritrade',
        lastName: 'Admin',
        username: adminUsername,
        email: adminEmail,
        phone: '08000000000',
        password: adminPassword, // Pre-save hook will hash this
        role: 'admin',
        isVerified: true
      });
      console.log('Admin created successfully.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
