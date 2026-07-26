import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Get user transaction history
// @route   GET /api/transactions
// @access  Private
export const getTransactionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const total = await Transaction.countDocuments({ user: req.user?._id });
    const transactions = await Transaction.find({ user: req.user?._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a deposit transaction
// @route   POST /api/transactions/deposit
// @access  Private
export const deposit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, reference } = req.body;
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'A valid positive amount is required' });
    }

    const existing = await Transaction.findOne({ reference });
    if (existing) {
      return res.status(409).json({ message: 'This reference has already been used' });
    }

    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transaction = await Transaction.create({
      user: user._id,
      type: 'deposit',
      amount: parsedAmount,
      status: 'completed',
      reference,
      description: 'Wallet deposit',
    });

    user.balance += parsedAmount;
    await user.save();

    res.status(201).json({ message: 'Deposit completed successfully', transaction, balance: user.balance });
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
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'A valid positive amount is required' });
    }

    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.balance < parsedAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const transaction = await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount: parsedAmount,
      status: 'pending',
      reference: `WITH-${Date.now()}`,
      description: 'Wallet withdrawal',
    });

    user.balance -= parsedAmount;
    await user.save();

    res.status(201).json({ message: 'Withdrawal request received', transaction, balance: user.balance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
