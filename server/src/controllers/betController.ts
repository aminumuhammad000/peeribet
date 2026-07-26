import { Request, Response } from 'express';
import Bet from '../models/Bet';
import User from '../models/User';
import Match from '../models/Match';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middlewares/authMiddleware';
import { settlePendingBetsForMatch } from '../services/settlementService';

// @route  POST /api/bets
// @access Private
export const placeBet = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, selection, amount } = req.body;
    const user = await User.findById(req.user?._id);
    const match = await Match.findById(matchId);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.status !== 'UPCOMING' && match.status !== 'LIVE') {
      return res.status(400).json({ message: 'Market for this match is closed' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'A valid positive stake is required' });
    }

    if (user.balance < parsedAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Determine odds based on selection
    let odds = 1.0;
    if (selection === 'HOME') odds = match.odds.home;
    else if (selection === 'DRAW') odds = match.odds.draw;
    else if (selection === 'AWAY') odds = match.odds.away;
    else if (selection === 'OVER_25') odds = match.odds.over25 || 1.0;
    else if (selection === 'UNDER_25') odds = match.odds.under25 || 1.0;
    else if (selection === 'BTTS_YES') odds = match.odds.bttsYes || 1.0;
    else if (selection === 'BTTS_NO') odds = match.odds.bttsNo || 1.0;

    const potentialPayout = parsedAmount * odds;

    // 1. Create Bet
    const bet = await Bet.create({
      user: user._id,
      match: match._id,
      selection,
      amount: parsedAmount,
      odds,
      potentialPayout,
      status: 'PENDING'
    });

    // 2. Deduct from User Balance
    user.balance -= parsedAmount;
    await user.save();

    // 3. Log Transaction
    await Transaction.create({
      user: user._id,
      type: 'bet_placed',
      amount: parsedAmount,
      status: 'completed',
      reference: bet._id.toString(),
      description: `Bet placed on ${match.homeTeam} vs ${match.awayTeam} (${selection})`
    });

    res.status(201).json({ message: 'Bet placed successfully', bet, balance: user.balance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/bets/my-bets
// @access Private
export const getMyBets = async (req: AuthRequest, res: Response) => {
  try {
    await settlePendingBetsForMatch();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status as string;

    const query: any = { user: req.user?._id };
    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'ONGOING') {
        query.status = 'PENDING';
      } else if (statusFilter === 'WIN') {
        query.status = 'WON';
      } else if (statusFilter === 'LOSS') {
        query.status = 'LOST';
      }
      // Note: LIVE filtering is tricky because it depends on the match status.
      // We'll leave LIVE filtering to the frontend or implement a complex aggregate.
    }

    const total = await Bet.countDocuments(query);
    const bets = await Bet.find(query)
      .populate('match')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      bets,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
