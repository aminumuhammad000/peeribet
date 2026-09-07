import { Request, Response } from 'express';
import Market from '../models/Market';
import Bet from '../models/Bet';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createNotification } from '../services/notificationService';
import { getIO } from '../services/socketService';

// @route  GET /api/markets
// @access Public / Private
export const getPublicMarkets = async (req: Request, res: Response) => {
  try {
    const { category, subcategory, search, status, sort } = req.query;
    const filter: any = {};

    // For public users, only show ACTIVE / PUBLISHED markets by default
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'ACTIVE';
    }

    if (category && category !== 'ALL') {
      const catStr = String(category).trim();
      filter.category = { $regex: new RegExp(`^${catStr}$`, 'i') };
    }

    if (subcategory && subcategory !== 'ALL') {
      const subcatStr = String(subcategory).trim();
      filter.subcategory = { $regex: new RegExp(`^${subcatStr}$`, 'i') };
    }

    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { subcategory: { $regex: q, $options: 'i' } },
        { rules: { $regex: q, $options: 'i' } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'pool') sortOption = { poolAmount: -1 };
    if (sort === 'closingSoon') sortOption = { closingDate: 1 };

    const markets = await Market.find(filter).sort(sortOption);
    res.json({ markets, count: markets.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/markets/:id
// @access Public / Private
export const getMarketById = async (req: Request, res: Response) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) {
      return res.status(404).json({ message: 'Market not found' });
    }
    res.json(market);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/markets/:id/bet
// @access Private
export const placeMarketBet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { selection, amount } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const market = await Market.findById(id);
    if (!market) {
      return res.status(404).json({ message: 'Market not found' });
    }

    if (market.status !== 'ACTIVE') {
      return res.status(400).json({ message: `Market is currently ${market.status.toLowerCase()}` });
    }

    if (market.closingDate && new Date(market.closingDate) < new Date()) {
      return res.status(400).json({ message: 'Trading on this market has closed' });
    }

    const stakeAmount = Number(amount);
    if (!Number.isFinite(stakeAmount) || stakeAmount < 100) {
      return res.status(400).json({ message: 'Minimum stake is ₦100' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < stakeAmount) {
      return res.status(400).json({
        message: `Insufficient balance. Available: ₦${user.balance.toLocaleString()}, Required: ₦${stakeAmount.toLocaleString()}`,
      });
    }

    // Match selection against market options
    const normalizedSelection = String(selection).trim().toUpperCase();
    let selectedOption = market.options.find(
      (opt) => opt.id.toUpperCase() === normalizedSelection || opt.label.toUpperCase() === normalizedSelection
    );

    // Fallback for YES/NO
    if (!selectedOption) {
      if (normalizedSelection === 'YES' || normalizedSelection === '1') {
        selectedOption = market.options.find((opt) => opt.id.toLowerCase() === 'yes') || market.options[0];
      } else if (normalizedSelection === 'NO' || normalizedSelection === '2') {
        selectedOption = market.options.find((opt) => opt.id.toLowerCase() === 'no') || market.options[1];
      }
    }

    if (!selectedOption) {
      return res.status(400).json({ message: `Invalid option selected: ${selection}` });
    }

    const odds = selectedOption.odds || 1.9;
    const potentialPayout = Math.round(stakeAmount * odds);

    // 1. Deduct balance from user
    user.balance -= stakeAmount;
    await user.save();

    // 2. Create Bet record
    const bet = await Bet.create({
      user: user._id,
      market: market._id,
      selection: selectedOption.label,
      amount: stakeAmount,
      odds,
      potentialPayout,
      status: 'PENDING',
    });

    // 3. Update Market total pool, volume, and option staked amount
    market.poolAmount = (market.poolAmount || 0) + stakeAmount;
    selectedOption.totalStaked = (selectedOption.totalStaked || 0) + stakeAmount;
    const currentVolNum = parseFloat(String(market.volume || '0').replace(/[^0-9.]/g, '')) || 0;
    market.volume = `₦${(currentVolNum + stakeAmount).toLocaleString()}`;
    await market.save();

    // 4. Log Transaction
    await Transaction.create({
      user: user._id,
      type: 'bet_placed',
      amount: stakeAmount,
      status: 'completed',
      reference: bet._id.toString(),
      description: `Prediction placed on "${market.title}" (${selectedOption.label} @ ${odds.toFixed(2)})`,
    });

    // 5. Send Notification
    await createNotification(
      user._id.toString(),
      'Prediction Placed 🎯',
      `You staked ₦${stakeAmount.toLocaleString()} on "${selectedOption.label}" for "${market.title}". Potential return: ₦${potentialPayout.toLocaleString()}.`,
      'bet'
    );

    // 6. Broadcast live market update
    try {
      const io = getIO();
      if (io) {
        io.emit('market_updated', { marketId: market._id, poolAmount: market.poolAmount });
      }
    } catch (e) {
      // Non-critical socket error
    }

    res.status(201).json({
      message: 'Prediction trade placed successfully',
      bet,
      balance: user.balance,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
