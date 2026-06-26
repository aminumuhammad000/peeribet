import { Request, Response } from 'express';
import Bet from '../models/Bet';
import User from '../models/User';
import Match from '../models/Match';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middlewares/authMiddleware';

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

    if (user.balance < amount) {
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

    const potentialPayout = amount * odds;

    // 1. Create Bet
    const bet = await Bet.create({
      user: user._id,
      match: match._id,
      selection,
      amount,
      odds,
      potentialPayout,
      status: 'PENDING'
    });

    // 2. Deduct from User Balance
    user.balance -= amount;
    await user.save();

    // 3. Log Transaction
    await Transaction.create({
      user: user._id,
      type: 'bet_placed',
      amount,
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
    const bets = await Bet.find({ user: req.user?._id })
      .populate('match')
      .sort({ createdAt: -1 });
    res.json(bets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
