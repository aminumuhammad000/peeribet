import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User';
import Transaction from '../models/Transaction';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';

interface FundOptions {
  email?: string;
  userId?: string;
  amount: number;
}

const parseArgs = (): FundOptions => {
  const rawArgs = process.argv.slice(2);
  const args: Record<string, string> = {};

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = rawArgs[i + 1];
      if (value && !value.startsWith('--')) {
        args[key] = value;
        i += 1;
      } else {
        args[key] = 'true';
      }
    }
  }

  return {
    email: args.email,
    userId: args.userId,
    amount: Number(args.amount ?? '10000'),
  };
};

const showUsage = (): void => {
  console.log('Usage: ts-node src/scripts/fundWallet.ts --email <user-email> [--amount <amount>]');
  console.log('       ts-node src/scripts/fundWallet.ts --userId <user-id> [--amount <amount>]');
};

const main = async (): Promise<void> => {
  const { email, userId, amount } = parseArgs();

  if (!email && !userId) {
    showUsage();
    process.exit(1);
  }

  if (isNaN(amount) || amount <= 0) {
    console.error('Error: amount must be a positive number');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const user = email
    ? await User.findOne({ email: email.toLowerCase() })
    : await User.findById(userId);

  if (!user) {
    console.error('Error: user not found');
    await mongoose.disconnect();
    process.exit(1);
  }

  const reference = `script_deposit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  await Transaction.create({
    user: user._id,
    type: 'deposit',
    amount,
    status: 'completed',
    reference,
    description: 'Script wallet funding',
  });

  user.balance = Number(user.balance || 0) + amount;
  await user.save();

  console.log(`Funded ${amount} to ${user.email} (${user._id}).`);
  console.log(`New balance: ${user.balance}`);
  console.log(`Transaction reference: ${reference}`);

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error('Error funding wallet:', error);
  process.exit(1);
});
