import mongoose from 'mongoose';
import PoolContract, { IPoolContract } from '../models/PoolContract';
import Match from '../models/Match';
import Market from '../models/Market';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { createNotification } from './notificationService';

export const enterPool = async ({
  userId,
  matchId,
  marketId,
  market = 'MATCH_OUTCOME',
  selection,
  amount,
}: {
  userId: string;
  matchId?: string;
  marketId?: string;
  market?: string;
  selection: string;
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

  const targetId = matchId || marketId;
  if (!targetId) throw new Error('Match ID or Market ID is required');

  let match: any = null;
  let predictionMarket: any = null;
  let targetTitle = 'Market';

  match = await Match.findById(targetId);
  if (match) {
    if (match.status !== 'UPCOMING' && match.status !== 'LIVE') {
      throw new Error('Pool for this match is currently closed');
    }
    targetTitle = `${match.homeTeam} vs ${match.awayTeam}`;
  } else {
    predictionMarket = await Market.findById(targetId);
    if (!predictionMarket) throw new Error('Match or Market not found');
    if (predictionMarket.status !== 'ACTIVE') {
      throw new Error('Pool for this market is currently closed');
    }
    targetTitle = predictionMarket.title;
  }

  // Deduct stake from user
  user.balance -= parsedAmount;
  await user.save();

  // Create pool contract
  const contract = await PoolContract.create({
    user: user._id,
    match: match ? match._id : undefined,
    predictionMarket: predictionMarket ? predictionMarket._id : undefined,
    market,
    selection,
    stake: parsedAmount,
    isBridged: false,
    status: 'PENDING',
  });

  // Increment match or market pot
  if (match) {
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
  }

  if (predictionMarket) {
    predictionMarket.poolAmount = (predictionMarket.poolAmount || 0) + parsedAmount;
    if (!predictionMarket.pool) {
      predictionMarket.pool = { totalPot: 0, optionPots: {} };
    }
    predictionMarket.pool.totalPot = (predictionMarket.pool.totalPot || 0) + parsedAmount;
    await predictionMarket.save();
  }

  // Log transaction
  await Transaction.create({
    user: user._id,
    type: 'pool_entry_placed',
    amount: parsedAmount,
    status: 'completed',
    reference: contract._id.toString(),
    description: `Pool Jackpot Entry: ₦${parsedAmount.toLocaleString()} on ${targetTitle} (${selection})`,
  });

  return {
    contract,
    pool: match ? match.pool : predictionMarket?.pool,
    balance: user.balance,
  };
};

export const getPoolDetails = async (targetId: string, market = 'MATCH_OUTCOME') => {
  const match = await Match.findById(targetId);
  const predictionMarket = !match ? await Market.findById(targetId) : null;

  if (!match && !predictionMarket) throw new Error('Match or Market not found');

  const query: any = {
    market: market as any,
    status: 'PENDING',
  };
  if (match) query.match = match._id;
  if (predictionMarket) query.predictionMarket = predictionMarket._id;

  const contracts = await PoolContract.find(query);

  const totalPot = match ? match.pool?.totalPot || 0 : predictionMarket?.poolAmount || 0;
  const netPotAfterFee = totalPot * 0.95; // 5% House Fee deduction

  const outcomePots: Record<string, { pot: number; entries: number; projectedMultiplier: number }> = {};

  if (match) {
    outcomePots.HOME = { pot: match.pool?.homePot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.DRAW = { pot: match.pool?.drawPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.AWAY = { pot: match.pool?.awayPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.OVER_25 = { pot: match.pool?.over25Pot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.UNDER_25 = { pot: match.pool?.under25Pot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.BTTS_YES = { pot: match.pool?.bttsYesPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.BTTS_NO = { pot: match.pool?.bttsNoPot || 0, entries: 0, projectedMultiplier: 1.0 };
  } else if (predictionMarket) {
    for (const opt of predictionMarket.options || []) {
      outcomePots[opt.id] = { pot: opt.totalStaked || 0, entries: 0, projectedMultiplier: 1.0 };
    }
  }

  for (const c of contracts) {
    if (!outcomePots[c.selection]) {
      outcomePots[c.selection] = { pot: 0, entries: 0, projectedMultiplier: 1.0 };
    }
    outcomePots[c.selection].entries += 1;
    outcomePots[c.selection].pot += c.stake;
  }

  // Calculate dynamic pro-rata multipliers
  for (const key of Object.keys(outcomePots)) {
    const pot = outcomePots[key].pot;
    if (pot > 0 && netPotAfterFee > 0) {
      outcomePots[key].projectedMultiplier = Math.max(1.05, Number((netPotAfterFee / pot).toFixed(2)));
    }
  }

  return {
    targetId,
    market,
    totalPot,
    netPotAfterFee,
    platformFeeRate: 0.05,
    outcomes: outcomePots,
  };
};
