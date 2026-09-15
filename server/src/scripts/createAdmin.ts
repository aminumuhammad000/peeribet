import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

// Load environment variables from both server/.env and root/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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

export async function createOrUpdateAdmin(customConfig?: {
  email?: string;
  password?: string;
  username?: string;
  silent?: boolean;
}) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const positionalArgs = process.argv
    .slice(2)
    .filter((a) => !a.includes('=') && !a.startsWith('-'));

  let email =
    customConfig?.email ||
    getArgValue('email') ||
    process.env.ADMIN_EMAIL ||
    positionalArgs[0];

  let password =
    customConfig?.password ||
    getArgValue('password') ||
    process.env.ADMIN_PASSWORD ||
    positionalArgs[1];

  let username =
    customConfig?.username ||
    getArgValue('username') ||
    process.env.ADMIN_USERNAME ||
    positionalArgs[2];

  const isInteractive =
    process.argv.includes('--interactive') ||
    process.argv.includes('-i');

  if (isInteractive && !customConfig) {
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
    throw new Error('Password must be at least 6 characters long.');
  }

  console.log(`\nConfiguring admin account:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Username: ${username}`);
  console.log(`  Role:     admin`);

  // Check if user exists by email or username
  const userByEmail = await User.findOne({ email }).select('+password');
  const userByUsername = await User.findOne({ username }).select('+password');

  let targetUser = userByEmail || userByUsername;

  // Handle rare edge case where separate accounts exist for email and username
  if (userByEmail && userByUsername && userByEmail._id.toString() !== userByUsername._id.toString()) {
    console.log(`Resolving conflict: unifying admin account by removing conflicting secondary record...`);
    await User.deleteOne({ _id: userByUsername._id });
    targetUser = userByEmail;
  }

  if (targetUser) {
    console.log(`Found existing user (ID: ${targetUser._id}). Updating credentials, role, and verification status...`);
    targetUser.username = username;
    targetUser.email = email;
    targetUser.password = password; // Pre-save hook hashes this
    targetUser.role = 'admin';
    targetUser.isVerified = true;
    if (!targetUser.firstName) targetUser.firstName = 'Peeritrade';
    if (!targetUser.lastName) targetUser.lastName = 'Admin';
    if (!targetUser.phone) {
      targetUser.phone = '080' + Math.floor(10000000 + Math.random() * 90000000);
    }
    await targetUser.save();
    console.log('SUCCESS: Existing account successfully updated and elevated to Admin!');
  } else {
    console.log(`Creating new admin account...`);
    const randomPhone = '080' + Math.floor(10000000 + Math.random() * 90000000);
    targetUser = await User.create({
      firstName: 'Peeritrade',
      lastName: 'Admin',
      username,
      email,
      phone: randomPhone,
      password, // Pre-save hook hashes this
      role: 'admin',
      isVerified: true,
    });
    console.log('SUCCESS: New Admin user created successfully!');
  }

  // Verification sanity check: verify bcrypt hash against the raw password
  const savedUser = await User.findById(targetUser._id).select('+password');
  if (!savedUser) {
    throw new Error('Admin user could not be retrieved after save.');
  }

  const isPasswordValid = await savedUser.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Verification failed: Saved password does not match intended credentials.');
  }

  console.log('\n====================================================');
  console.log('        ADMIN LOGIN CREDENTIALS VERIFIED');
  console.log('====================================================');
  console.log(`  Login Identifier (Email):    ${email}`);
  console.log(`  Login Identifier (Username): ${username}`);
  console.log(`  Password:                    ${password}`);
  console.log(`  Role:                        ${savedUser.role}`);
  console.log(`  Verified:                    ${savedUser.isVerified}`);
  console.log('----------------------------------------------------');
  console.log('  You can log in at the Admin Portal with either:');
  console.log(`    - Email:    ${email}`);
  console.log(`    - Username: ${username}`);
  console.log(`    - Password: ${password}`);
  console.log('====================================================\n');

  return { email, username, password, user: savedUser };
}

// Run if called directly
if (require.main === module) {
  createOrUpdateAdmin()
    .then(async () => {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nERROR: Failed to configure admin account:', error.message || error);
      process.exit(1);
    });
}
