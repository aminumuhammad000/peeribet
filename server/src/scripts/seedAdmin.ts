import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peeritrade');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@peeritrade.com';
    const adminPassword = 'Admin@12345';

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin already exists. Updating password and role...');
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash(adminPassword, salt);
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      console.log('Admin updated successfully.');
    } else {
      console.log('Creating new admin...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        phone: '08000000000',
        password: hashedPassword,
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
