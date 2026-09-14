import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User';

function getArgValue(flag: string): string | undefined {
  const arg = process.argv.slice(2).find((a) => a.startsWith(`--${flag}=`) || a.startsWith(`${flag}=`));
  if (arg) {
    return arg.split('=')[1];
  }
  return undefined;
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB database.');

    const positionalArgs = process.argv
      .slice(2)
      .filter((a) => !a.includes('=') && !a.startsWith('-'));

    let email =
      getArgValue('email') ||
      process.env.ADMIN_EMAIL ||
      positionalArgs[0];

    let password =
      getArgValue('password') ||
      process.env.ADMIN_PASSWORD ||
      positionalArgs[1];

    let username =
      getArgValue('username') ||
      process.env.ADMIN_USERNAME ||
      positionalArgs[2];

    const isInteractive =
      process.argv.includes('--interactive') ||
      process.argv.includes('-i');

    if (isInteractive) {
      console.log('\n--- Interactive Admin Account Setup ---');
      email = (await askQuestion('Admin Email [admin@peeritrade.com]: ')) || email || 'admin@peeritrade.com';
      password = (await askQuestion('Admin Password [Admin@123456]: ')) || password || 'Admin@123456';
      username = (await askQuestion(`Admin Username [${email.split('@')[0]}]: `)) || username || email.split('@')[0];
    } else {
      // Use defaults if not provided via arguments or env
      if (!email) email = 'admin@peeritrade.com';
      if (!password) password = 'Admin@123456';
      if (!username) username = email.includes('@') ? email.split('@')[0] : email;
    }

    email = email.trim().toLowerCase();
    username = username.trim().toLowerCase();

    if (password.length < 6) {
      console.error('Password must be at least 6 characters long.');
      process.exit(1);
    }

    console.log(`\nConfiguring admin account:`);
    console.log(`  Email:    ${email}`);
    console.log(`  Username: ${username}`);
    console.log(`  Role:     admin`);

    // Check if user exists by email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).select('+password');

    if (existingUser) {
      console.log(`Found existing user with email '${existingUser.email}'. Updating credentials and elevating to admin...`);
      existingUser.username = username;
      existingUser.email = email;
      existingUser.password = password; // Pre-save hook hashes this
      existingUser.role = 'admin';
      existingUser.isVerified = true;
      if (!existingUser.firstName) existingUser.firstName = 'System';
      if (!existingUser.lastName) existingUser.lastName = 'Admin';
      if (!existingUser.phone) existingUser.phone = '08000000000';
      await existingUser.save();
      console.log('\nSUCCESS: Existing account successfully elevated to Admin and password updated!');
    } else {
      console.log(`Creating new admin account...`);
      await User.create({
        firstName: 'Peeritrade',
        lastName: 'Admin',
        username,
        email,
        phone: '080' + Math.floor(10000000 + Math.random() * 90000000),
        password, // Pre-save hook hashes this
        role: 'admin',
        isVerified: true,
      });
      console.log('\nSUCCESS: New Admin user created successfully!');
    }

    console.log('----------------------------------------------------');
    console.log('ADMIN LOGIN CREDENTIALS:');
    console.log(`  Email / Username: ${email}  (or ${username})`);
    console.log(`  Password:         ${password}`);
    console.log('----------------------------------------------------\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error: any) {
    console.error('Failed to create or update admin:', error);
    process.exit(1);
  }
}

createAdmin();
