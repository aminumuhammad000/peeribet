import { Request, Response } from 'express';
import Market from '../models/Market';
import Bet from '../models/Bet';
import User from '../models/User';
import Transaction from '../models/Transaction';
import PoolContract from '../models/PoolContract';
import { placeP2POrder } from '../services/p2pEngine';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createNotification } from '../services/notificationService';
import { getIO } from '../services/socketService';

// @route  GET /api/markets
// @access Public / Private
export const getPublicMarkets = async (req: Request, res: Response) => {
  try {
    const { category, subcategory, search, status, sort } = req.query;
    const filter: any = {};

    // For public users, show ACTIVE and SUSPENDED (locked) markets by default
    if (status) {
      if (typeof status === 'string' && status.includes(',')) {
        filter.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        filter.status = status;
      }
    } else {
      filter.status = { $in: ['ACTIVE', 'SUSPENDED'] };
    }

    if (category && category !== 'ALL') {
      const catStr = String(category).trim().toLowerCase();
      if (catStr.includes('live event') || catStr.includes('prediction') || catStr.includes('real life')) {
        filter.category = { $regex: /live event|real life|politic|pop culture/i };
      } else if (catStr.includes('entertainment')) {
        filter.category = { $regex: /entertainment|music|movie|award/i };
      } else {
        filter.category = { $regex: new RegExp(`^${String(category).trim()}$`, 'i') };
      }
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
    const { selection, amount, tradeType, shares } = req.body;

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

    // ────────────────────────────────────────────────────────────────────────
    // If tradeType is P2P, route to P2P Order Engine
    // ────────────────────────────────────────────────────────────────────────
    if (tradeType === 'P2P') {
      const shareCount = Math.floor(Number(shares)) || Math.max(1, Math.floor(Number(amount) / 1000));
      const p2pResult = await placeP2POrder({
        userId: req.user._id.toString(),
        marketId: market._id.toString(),
        market: 'PREDICTION_OUTCOME',
        selection: selectedOption.label,
        shares: shareCount,
      });

      try {
        const io = getIO();
        if (io) io.emit('market_updated', { marketId: market._id, poolAmount: market.poolAmount });
      } catch (e) {}

      return res.status(201).json({
        message: `P2P Order placed: ${shareCount} share(s) on "${selectedOption.label}"`,
        ...p2pResult,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // PRO-RATA POOL CONTRACT
    // ────────────────────────────────────────────────────────────────────────
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

    const odds = selectedOption.odds || 1.9;
    const potentialPayout = Math.round(stakeAmount * odds);

    // 1. Deduct balance from user
    user.balance -= stakeAmount;
    await user.save();

    // 2. Create Bet record (backward compatibility)
    const bet = await Bet.create({
      user: user._id,
      market: market._id,
      selection: selectedOption.label,
      amount: stakeAmount,
      odds,
      potentialPayout,
      status: 'PENDING',
    });

    // 3. Create Pro-Rata PoolContract record
    const contract = await PoolContract.create({
      user: user._id,
      predictionMarket: market._id,
      market: 'PREDICTION_OUTCOME',
      selection: selectedOption.label,
      stake: stakeAmount,
      isBridged: false,
      status: 'PENDING',
    });

    // 4. Update Market total pool, volume, and option staked amount
    market.poolAmount = (market.poolAmount || 0) + stakeAmount;
    selectedOption.totalStaked = (selectedOption.totalStaked || 0) + stakeAmount;
    const currentVolNum = parseFloat(String(market.volume || '0').replace(/[^0-9.]/g, '')) || 0;
    market.volume = `₦${(currentVolNum + stakeAmount).toLocaleString()}`;
    await market.save();

    // 5. Log Transaction
    await Transaction.create({
      user: user._id,
      type: 'bet_placed',
      amount: stakeAmount,
      status: 'completed',
      reference: bet._id.toString(),
      description: `Prediction placed on "${market.title}" (${selectedOption.label} @ ${odds.toFixed(2)})`,
    });

    // 6. Send Notification
    await createNotification(
      user._id.toString(),
      'Prediction Placed 🎯',
      `You staked ₦${stakeAmount.toLocaleString()} on "${selectedOption.label}" for "${market.title}". Potential return: ₦${potentialPayout.toLocaleString()}.`,
      'bet'
    );

    // 7. Broadcast live market update
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
      contract,
      balance: user.balance,
      newBalance: user.balance,
      poolAmount: market.poolAmount,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
