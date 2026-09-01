import mongoose from 'mongoose';
import PoolContract, { IPoolContract } from '../models/PoolContract';
import Match from '../models/Match';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { createNotification } from './notificationService';

export const enterPool = async ({
  userId,
  matchId,
  market = 'MATCH_OUTCOME',
  selection,
  amount,
}: {
  userId: string;
  matchId: string;
  market?: 'MATCH_OUTCOME' | 'OVER_UNDER_25' | 'BTTS';
  selection: 'HOME' | 'DRAW' | 'AWAY' | 'OVER_25' | 'UNDER_25' | 'BTTS_YES' | 'BTTS_NO';
  amount: number;
}) => {
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
    throw new Error('Minimum pool entry is ₦100');
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.balance < parsedAmount) {
    throw new Error(`Insufficient balance. ₦${parsedAmount.toLocaleString()} required.`);
  }

  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');
  if (match.status !== 'UPCOMING' && match.status !== 'LIVE') {
    throw new Error('Pool for this match is currently closed');
  }

  // Deduct stake from user
  user.balance -= parsedAmount;
  await user.save();

  // Create pool contract
  const contract = await PoolContract.create({
    user: user._id,
    match: match._id,
    market,
    selection,
    stake: parsedAmount,
    isBridged: false,
    status: 'PENDING',
  });

  // Increment match pot
  match.pool.totalPot = (match.pool.totalPot || 0) + parsedAmount;

  if (selection === 'HOME') match.pool.homePot = (match.pool.homePot || 0) + parsedAmount;
  else if (selection === 'DRAW') match.pool.drawPot = (match.pool.drawPot || 0) + parsedAmount;
  else if (selection === 'AWAY') match.pool.awayPot = (match.pool.awayPot || 0) + parsedAmount;
  else if (selection === 'OVER_25') match.pool.over25Pot = (match.pool.over25Pot || 0) + parsedAmount;
  else if (selection === 'UNDER_25') match.pool.under25Pot = (match.pool.under25Pot || 0) + parsedAmount;
  else if (selection === 'BTTS_YES') match.pool.bttsYesPot = (match.pool.bttsYesPot || 0) + parsedAmount;
  else if (selection === 'BTTS_NO') match.pool.bttsNoPot = (match.pool.bttsNoPot || 0) + parsedAmount;

  match.poolAmount = match.pool.totalPot;
  await match.save();

  // Log transaction
  await Transaction.create({
    user: user._id,
    type: 'pool_entry_placed',
    amount: parsedAmount,
    status: 'completed',
    reference: contract._id.toString(),
    description: `Pool Jackpot Entry: ₦${parsedAmount.toLocaleString()} on ${match.homeTeam} vs ${match.awayTeam} (${selection})`,
  });

  return {
    contract,
    pool: match.pool,
    balance: user.balance,
  };
};

export const getPoolDetails = async (matchId: string, market = 'MATCH_OUTCOME') => {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');

  const contracts = await PoolContract.find({
    match: match._id as any,
    market: market as any,
    status: 'PENDING',
  });

  const totalPot = match.pool?.totalPot || 0;
  const netPotAfterFee = totalPot * 0.95; // 5% House Fee deduction

  const outcomePots: Record<string, { pot: number; entries: number; projectedMultiplier: number }> = {
    HOME: { pot: match.pool?.homePot || 0, entries: 0, projectedMultiplier: 1.0 },
    DRAW: { pot: match.pool?.drawPot || 0, entries: 0, projectedMultiplier: 1.0 },
    AWAY: { pot: match.pool?.awayPot || 0, entries: 0, projectedMultiplier: 1.0 },
    OVER_25: { pot: match.pool?.over25Pot || 0, entries: 0, projectedMultiplier: 1.0 },
    UNDER_25: { pot: match.pool?.under25Pot || 0, entries: 0, projectedMultiplier: 1.0 },
    BTTS_YES: { pot: match.pool?.bttsYesPot || 0, entries: 0, projectedMultiplier: 1.0 },
    BTTS_NO: { pot: match.pool?.bttsNoPot || 0, entries: 0, projectedMultiplier: 1.0 },
  };

  for (const c of contracts) {
    if (outcomePots[c.selection]) {
      outcomePots[c.selection].entries += 1;
    }
  }

  // Calculate dynamic pro-rata multipliers
  for (const key of Object.keys(outcomePots)) {
    const pot = outcomePots[key].pot;
    if (pot > 0 && netPotAfterFee > 0) {
      outcomePots[key].projectedMultiplier = Math.max(1.05, Number((netPotAfterFee / pot).toFixed(2)));
    }
  }

  return {
    matchId,
    market,
    totalPot,
    netPotAfterFee,
    platformFeeRate: 0.05,
    outcomes: outcomePots,
  };
};
