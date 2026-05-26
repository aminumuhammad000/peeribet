import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Get user transaction history
// @route   GET /api/transactions
// @access  Private
export const getTransactionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({ user: req.user?._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a deposit transaction (Mock)
// @route   POST /api/transactions/deposit
// @access  Private
export const deposit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, reference } = req.body;

    const transaction = await Transaction.create({
      user: req.user?._id,
      type: 'deposit',
      amount,
      status: 'completed', // For demo/mock purposes
      reference,
      description: 'Wallet deposit',
    });

    // Update user balance
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.balance += Number(amount);
        await user.save();
      }
    }

    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request a withdrawal
// @route   POST /api/transactions/withdraw
// @access  Private
export const withdraw = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (req.user && req.user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const transaction = await Transaction.create({
      user: req.user?._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      reference: `WITH-${Date.now()}`,
      description: 'Wallet withdrawal',
    });

    // Deduct from balance
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.balance -= Number(amount);
        await user.save();
      }
    }

    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
