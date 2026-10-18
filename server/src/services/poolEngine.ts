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
    if (match.isLocked || match.isOverpowered || match.status === 'SUSPENDED') {
      throw new Error('This match pool is locked by administrator overpowered safeguards.');
    }
    if (match.status !== 'UPCOMING' && match.status !== 'LIVE') {
      throw new Error('Pool for this match is currently closed');
    }

    // 70% Crowd Overpower check using background odds / pool concentration
    const selNorm = String(selection).trim().toUpperCase();
    let selOdds = 2.0;
    if (selNorm === 'HOME' || selNorm === '1') selOdds = match.odds?.home || 1.85;
    else if (selNorm === 'AWAY' || selNorm === '2') selOdds = match.odds?.away || 2.40;
    else if (selNorm === 'DRAW' || selNorm === 'X') selOdds = match.odds?.draw || 3.10;
    else if (selNorm === 'OVER_25') selOdds = match.odds?.over25 || 1.95;
    else if (selNorm === 'UNDER_25') selOdds = match.odds?.under25 || 1.85;
    else if (selNorm === 'BTTS_YES') selOdds = match.odds?.bttsYes || 1.80;
    else if (selNorm === 'BTTS_NO') selOdds = match.odds?.bttsNo || 2.00;

    const impliedProb = selOdds > 0 ? 1 / selOdds : 0;
    const totalMatchPot = match.pool?.totalPot || 0;
    let selPot = 0;
    if (selNorm === 'HOME') selPot = match.pool?.homePot || 0;
    else if (selNorm === 'AWAY') selPot = match.pool?.awayPot || 0;
    else if (selNorm === 'DRAW') selPot = match.pool?.drawPot || 0;

    const potShare = totalMatchPot > 50000 ? selPot / totalMatchPot : 0;
    if (impliedProb >= 0.70 || selOdds <= 1.43 || potShare >= 0.70) {
      throw new Error('Trading on this outcome is automatically locked due to extreme crowd concentration (70%+ overpowered).');
    }

    targetTitle = `${match.homeTeam} vs ${match.awayTeam}`;
  } else {
    predictionMarket = await Market.findById(targetId);
    if (!predictionMarket) throw new Error('Match or Market not found');
    if (predictionMarket.isLocked || predictionMarket.isOverpowered || predictionMarket.status === 'SUSPENDED') {
      throw new Error('This prediction market pool is locked by administrator overpowered safeguards.');
    }
    if (predictionMarket.status !== 'ACTIVE') {
      throw new Error('Pool for this market is currently closed');
    }

    // 70% Crowd Overpower check for prediction market options
    const normSel = String(selection).trim().toUpperCase();
    const opt = (predictionMarket.options || []).find((o: any) =>
      String(o.id).toUpperCase() === normSel ||
      String(o.label).toUpperCase() === normSel ||
      (normSel === 'YES' && o.label?.toUpperCase() === 'YES') ||
      (normSel === 'NO' && o.label?.toUpperCase() === 'NO')
    );
    if (opt) {
      const optOdds = opt.odds || 1.9;
      const optProb = optOdds > 0 ? 1 / optOdds : 0;
      const totalStaked = (predictionMarket.options || []).reduce((acc: number, item: any) => acc + (item.totalStaked || 0), 0);
      const stakeShare = totalStaked > 50000 ? (opt.totalStaked || 0) / totalStaked : 0;
      if (optProb >= 0.70 || optOdds <= 1.43 || stakeShare >= 0.70) {
        throw new Error('Trading on this outcome is automatically locked due to extreme crowd concentration (70%+ overpowered).');
      }
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

    const selNorm = String(selection).trim().toUpperCase();
    if (selNorm === 'HOME') match.pool.homePot = (match.pool.homePot || 0) + parsedAmount;
    else if (selNorm === 'DRAW') match.pool.drawPot = (match.pool.drawPot || 0) + parsedAmount;
    else if (selNorm === 'AWAY') match.pool.awayPot = (match.pool.awayPot || 0) + parsedAmount;
    else if (selNorm === 'OVER_25') match.pool.over25Pot = (match.pool.over25Pot || 0) + parsedAmount;
    else if (selNorm === 'UNDER_25') match.pool.under25Pot = (match.pool.under25Pot || 0) + parsedAmount;
    else if (selNorm === 'BTTS_YES') match.pool.bttsYesPot = (match.pool.bttsYesPot || 0) + parsedAmount;
    else if (selNorm === 'BTTS_NO') match.pool.bttsNoPot = (match.pool.bttsNoPot || 0) + parsedAmount;
    else if (selNorm === 'KO_TKO_SUB') match.pool.koTkoSubPot = (match.pool.koTkoSubPot || 0) + parsedAmount;
    else if (selNorm === 'DECISION') match.pool.decisionPot = (match.pool.decisionPot || 0) + parsedAmount;
    else if (selNorm === 'EARLY_STOPPAGE') match.pool.earlyStoppagePot = (match.pool.earlyStoppagePot || 0) + parsedAmount;
    else if (selNorm === 'GO_DISTANCE') match.pool.goDistancePot = (match.pool.goDistancePot || 0) + parsedAmount;
    else if (selNorm === 'SPREAD_HOME') match.pool.spreadHomePot = (match.pool.spreadHomePot || 0) + parsedAmount;
    else if (selNorm === 'SPREAD_AWAY') match.pool.spreadAwayPot = (match.pool.spreadAwayPot || 0) + parsedAmount;
    else if (selNorm === 'OVER_POINTS') match.pool.overPointsPot = (match.pool.overPointsPot || 0) + parsedAmount;
    else if (selNorm === 'UNDER_POINTS') match.pool.underPointsPot = (match.pool.underPointsPot || 0) + parsedAmount;
    else if (selNorm === 'HALF_HOME') match.pool.halfHomePot = (match.pool.halfHomePot || 0) + parsedAmount;
    else if (selNorm === 'HALF_AWAY') match.pool.halfAwayPot = (match.pool.halfAwayPot || 0) + parsedAmount;
    else if (selNorm === '1X') match.pool.doubleChance1xPot = (match.pool.doubleChance1xPot || 0) + parsedAmount;
    else if (selNorm === 'X2') match.pool.doubleChanceX2Pot = (match.pool.doubleChanceX2Pot || 0) + parsedAmount;

    if (!match.pool.optionPots) match.pool.optionPots = {};
    if (match.pool.optionPots instanceof Map) {
      const cur = match.pool.optionPots.get(selNorm) || 0;
      match.pool.optionPots.set(selNorm, cur + parsedAmount);
    } else {
      match.pool.optionPots[selNorm] = (match.pool.optionPots[selNorm] || 0) + parsedAmount;
    }

    match.poolAmount = match.pool.totalPot;
    await match.save();
  }

  if (predictionMarket) {
    predictionMarket.poolAmount = (predictionMarket.poolAmount || 0) + parsedAmount;
    if (!predictionMarket.pool) {
      predictionMarket.pool = { totalPot: 0, optionPots: {} };
    }
    predictionMarket.pool.totalPot = (predictionMarket.pool.totalPot || 0) + parsedAmount;

    // Update specific option totalStaked
    const norm = String(selection).trim().toUpperCase();
    const opt = predictionMarket.options?.find(
      (o: any) =>
        String(o.label).trim().toUpperCase() === norm ||
        String(o.id).trim().toUpperCase() === norm ||
        (norm === 'YES' && o.id?.toLowerCase() === 'yes') ||
        (norm === 'NO' && o.id?.toLowerCase() === 'no')
    );
    if (opt) {
      opt.totalStaked = (opt.totalStaked || 0) + parsedAmount;
    }

    const currentVolNum = parseFloat(String(predictionMarket.volume || '0').replace(/[^0-9.]/g, '')) || 0;
    predictionMarket.volume = `₦${(currentVolNum + parsedAmount).toLocaleString()}`;
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
    outcomePots.KO_TKO_SUB = { pot: match.pool?.koTkoSubPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.DECISION = { pot: match.pool?.decisionPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.EARLY_STOPPAGE = { pot: match.pool?.earlyStoppagePot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.GO_DISTANCE = { pot: match.pool?.goDistancePot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.SPREAD_HOME = { pot: match.pool?.spreadHomePot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.SPREAD_AWAY = { pot: match.pool?.spreadAwayPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.OVER_POINTS = { pot: match.pool?.overPointsPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.UNDER_POINTS = { pot: match.pool?.underPointsPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.HALF_HOME = { pot: match.pool?.halfHomePot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.HALF_AWAY = { pot: match.pool?.halfAwayPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots['1X'] = { pot: match.pool?.doubleChance1xPot || 0, entries: 0, projectedMultiplier: 1.0 };
    outcomePots.X2 = { pot: match.pool?.doubleChanceX2Pot || 0, entries: 0, projectedMultiplier: 1.0 };

    if (match.pool?.optionPots) {
      if (match.pool.optionPots instanceof Map) {
        match.pool.optionPots.forEach((val, k) => {
          if (!outcomePots[k]) outcomePots[k] = { pot: val || 0, entries: 0, projectedMultiplier: 1.0 };
        });
      } else {
        const optPots: any = match.pool.optionPots;
        Object.keys(optPots).forEach((k) => {
          if (!outcomePots[k]) outcomePots[k] = { pot: optPots[k] || 0, entries: 0, projectedMultiplier: 1.0 };
        });
      }
    }
  } else if (predictionMarket) {
    for (const opt of predictionMarket.options || []) {
      const optKey = opt.id || opt.label;
      outcomePots[optKey] = { pot: opt.totalStaked || 0, entries: 0, projectedMultiplier: 1.0 };
      if (opt.label && opt.label !== opt.id) {
        outcomePots[opt.label] = { pot: opt.totalStaked || 0, entries: 0, projectedMultiplier: 1.0 };
      }
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
