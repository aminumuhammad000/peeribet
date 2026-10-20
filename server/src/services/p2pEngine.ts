import mongoose from 'mongoose';
import P2POrder, { IP2POrder } from '../models/P2POrder';
import Match from '../models/Match';
import Market from '../models/Market';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { createNotification } from './notificationService';
import { resolveTargetMatchOrMarket } from '../utils/fixtureResolver';

export const SHARE_UNIT_PRICE = 1000; // ₦1,000 = 1 Share

/**
 * Maps selections to their counterparty selections for matching
 */
const getOpposingSelections = (selection: string, allOptions?: string[]): string[] => {
  const norm = String(selection).trim().toUpperCase();
  if (norm === 'HOME') return ['AWAY', 'DRAW', 'NO'];
  if (norm === 'AWAY') return ['HOME', 'DRAW', 'NO'];
  if (norm === 'DRAW') return ['HOME', 'AWAY', 'NO'];
  if (norm === 'OVER_25') return ['UNDER_25', 'NO'];
  if (norm === 'UNDER_25') return ['OVER_25', 'NO'];
  if (norm === 'OVER_POINTS') return ['UNDER_POINTS', 'NO'];
  if (norm === 'UNDER_POINTS') return ['OVER_POINTS', 'NO'];
  if (norm === 'BTTS_YES' || norm === 'YES' || norm === '1') return ['BTTS_NO', 'NO', '2'];
  if (norm === 'BTTS_NO' || norm === 'NO' || norm === '2') return ['BTTS_YES', 'YES', '1'];
  if (norm === 'OPTION_A') return ['OPTION_B'];
  if (norm === 'OPTION_B') return ['OPTION_A'];

  // Double Chance Hedges
  if (norm === '1X') return ['AWAY', 'NO'];
  if (norm === 'X2') return ['HOME', 'NO'];
  if (norm === '12') return ['DRAW', 'NO'];

  // Combat markets
  if (norm === 'KO_TKO_SUB') return ['DECISION', 'NO', 'GO_DISTANCE'];
  if (norm === 'DECISION') return ['KO_TKO_SUB', 'NO', 'EARLY_STOPPAGE'];
  if (norm === 'EARLY_STOPPAGE') return ['GO_DISTANCE', 'NO', 'DECISION'];
  if (norm === 'GO_DISTANCE') return ['EARLY_STOPPAGE', 'NO', 'KO_TKO_SUB'];

  // Basketball markets
  if (norm === 'SPREAD_HOME') return ['SPREAD_AWAY', 'NO'];
  if (norm === 'SPREAD_AWAY') return ['SPREAD_HOME', 'NO'];
  if (norm === 'HALF_HOME') return ['HALF_AWAY', 'NO'];
  if (norm === 'HALF_AWAY') return ['HALF_HOME', 'NO'];

  if (allOptions && allOptions.length > 0) {
    return allOptions.filter((opt) => String(opt).trim().toUpperCase() !== norm);
  }
  return [];
};

export const placeP2POrder = async ({
  userId,
  matchId,
  marketId,
  market = 'MATCH_OUTCOME',
  selection,
  shares,
}: {
  userId: string;
  matchId?: string;
  marketId?: string;
  market?: string;
  selection: string;
  shares: number;
}) => {
  const parsedShares = Math.floor(Number(shares));
  if (!Number.isFinite(parsedShares) || parsedShares < 1) {
    throw new Error('Please enter at least 1 share (₦1,000)');
  }

  const totalAmount = parsedShares * SHARE_UNIT_PRICE;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.balance < totalAmount) {
    throw new Error(`Insufficient balance. ₦${totalAmount.toLocaleString()} required for ${parsedShares} shares.`);
  }

  let match: any = null;
  let predictionMarket: any = null;
  let targetTitle = 'Market';

  const targetId = matchId || marketId;
  if (!targetId) throw new Error('Match ID or Market ID is required');

  const resolved = await resolveTargetMatchOrMarket(targetId);
  match = resolved.match;
  predictionMarket = resolved.predictionMarket;

  if (match) {
    const selNorm = String(selection).trim().toUpperCase();

    // Specific Contract Lock Safeguard: Only the locked contract is blocked, not the entire market
    const isContractLocked = match.lockedContracts && match.lockedContracts.some((c: string) => {
      const cNorm = String(c).trim().toUpperCase();
      return (
        cNorm === selNorm ||
        (cNorm === 'HOME' && (selNorm === '1' || selNorm === 'HOME')) ||
        (cNorm === 'AWAY' && (selNorm === '2' || selNorm === 'AWAY')) ||
        (cNorm === 'DRAW' && (selNorm === 'X' || selNorm === 'DRAW')) ||
        (cNorm === 'OVER_25' && selNorm === 'OVER_25') ||
        (cNorm === 'UNDER_25' && selNorm === 'UNDER_25') ||
        (cNorm === 'BTTS_YES' && selNorm === 'BTTS_YES') ||
        (cNorm === 'BTTS_NO' && selNorm === 'BTTS_NO')
      );
    });

    if (isContractLocked) {
      throw new Error(`The contract "${selection}" is currently locked by administrator safeguards. Other contracts remain open for trading.`);
    }

    if (match.isLocked && (!match.lockedContracts || match.lockedContracts.length === 0)) {
      throw new Error('This trading market is locked by administrator overpowered safeguards.');
    }
    if (match.status !== 'UPCOMING' && match.status !== 'LIVE') {
      throw new Error('Trading market for this match is currently closed');
    }

    // 70% Crowd Overpower check using background odds / pool concentration
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
    if (!predictionMarket) throw new Error('Market or Match not found');

    const normSel = String(selection).trim().toUpperCase();
    const opt = (predictionMarket.options || []).find((o: any) =>
      String(o.id).toUpperCase() === normSel ||
      String(o.label).toUpperCase() === normSel ||
      (normSel === 'YES' && o.label?.toUpperCase() === 'YES') ||
      (normSel === 'NO' && o.label?.toUpperCase() === 'NO')
    );

    // Specific Contract Lock Safeguard: Only the locked contract is blocked, not the entire market
    const isOptionLocked = Boolean(
      opt?.isLocked ||
      (predictionMarket.lockedContracts && predictionMarket.lockedContracts.some((c: string) => {
        const cNorm = String(c).trim().toUpperCase();
        return (
          cNorm === normSel ||
          (opt && cNorm === String(opt.id).toUpperCase()) ||
          (opt && cNorm === String(opt.label).toUpperCase())
        );
      }))
    );

    if (isOptionLocked) {
      throw new Error(`The contract "${opt?.label || selection}" is currently locked by administrator safeguards. Other contracts on this market remain open for trading.`);
    }

    if (predictionMarket.isLocked && (!predictionMarket.lockedContracts || predictionMarket.lockedContracts.length === 0)) {
      throw new Error('This prediction market is locked by administrator overpowered safeguards.');
    }
    if (predictionMarket.status !== 'ACTIVE') {
      throw new Error('This prediction market is currently closed for trading');
    }

    // 70% Crowd Overpower check for prediction market options
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

  // Deduct stake from user balance
  user.balance -= totalAmount;
  await user.save();

  // Create initial order
  const order = new P2POrder({
    user: user._id,
    match: match ? match._id : undefined,
    predictionMarket: predictionMarket ? predictionMarket._id : undefined,
    market,
    selection,
    totalShares: parsedShares,
    sharePrice: SHARE_UNIT_PRICE,
    totalAmount,
    matchedShares: 0,
    unmatchedShares: parsedShares,
    matchedFills: [],
    status: 'OPEN',
  });

  // Opposing selections
  const allOptionLabels = predictionMarket?.options?.map((o: any) => o.label || o.id) || [];
  const opposingSelections = getOpposingSelections(selection, allOptionLabels);
  let remainingToMatch = parsedShares;

  const orderQuery: any = {
    selection: { $in: opposingSelections as any },
    status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] },
    user: { $ne: user._id as any }, // No self-trading
  };
  if (match) {
    orderQuery.match = match._id;
  }
  if (predictionMarket) {
    orderQuery.predictionMarket = predictionMarket._id;
    if (market) orderQuery.market = market;
  }

  if (opposingSelections.length > 0) {
    const opposingOrders = await P2POrder.find(orderQuery).sort({ createdAt: 1 }); // FIFO price-time priority

    for (const oppOrder of opposingOrders) {
      if (remainingToMatch <= 0) break;
      if (oppOrder.unmatchedShares <= 0) continue;

      const fillCount = Math.min(remainingToMatch, oppOrder.unmatchedShares);

      // Update counterparty
      oppOrder.matchedShares += fillCount;
      oppOrder.unmatchedShares -= fillCount;
      oppOrder.matchedFills.push({
        counterpartyOrderId: order._id as any,
        counterpartyUserId: user._id as any,
        shares: fillCount,
        matchedAt: new Date(),
      });
      oppOrder.status = oppOrder.unmatchedShares === 0 ? 'MATCHED' : 'PARTIALLY_MATCHED';
      await oppOrder.save();

      // Notify counterparty
      createNotification(
        oppOrder.user.toString(),
        'P2P Shares Matched! ⚡',
        `${fillCount} share(s) of your ${oppOrder.selection} position on ${targetTitle} were matched against the order book.`,
        'bet'
      ).catch(() => {});

      // Update incoming order
      order.matchedShares += fillCount;
      order.unmatchedShares -= fillCount;
      order.matchedFills.push({
        counterpartyOrderId: oppOrder._id as any,
        counterpartyUserId: oppOrder.user as any,
        shares: fillCount,
        matchedAt: new Date(),
      });

      remainingToMatch -= fillCount;
    }
  }

  if (order.unmatchedShares === 0) {
    order.status = 'MATCHED';
  } else if (order.matchedShares > 0) {
    order.status = 'PARTIALLY_MATCHED';
  } else {
    order.status = 'OPEN';
  }

  await order.save();

  // Update Match or Market P2P stats
  if (match) {
    if (!match.p2pStats) {
      match.p2pStats = { totalSharesTraded: 0, matchedShares: 0, openShares: 0 };
    }
    match.p2pStats.totalSharesTraded = (match.p2pStats.totalSharesTraded || 0) + parsedShares;
    match.p2pStats.matchedShares = (match.p2pStats.matchedShares || 0) + order.matchedShares;
    match.p2pStats.openShares = Math.max(0, (match.p2pStats.openShares || 0) + order.unmatchedShares);
    await match.save();
  }

  if (predictionMarket) {
    if (!predictionMarket.p2pStats) {
      predictionMarket.p2pStats = { totalSharesTraded: 0, matchedShares: 0, openShares: 0 };
    }
    predictionMarket.p2pStats.totalSharesTraded = (predictionMarket.p2pStats.totalSharesTraded || 0) + parsedShares;
    predictionMarket.p2pStats.matchedShares = (predictionMarket.p2pStats.matchedShares || 0) + order.matchedShares;
    predictionMarket.p2pStats.openShares = Math.max(0, (predictionMarket.p2pStats.openShares || 0) + order.unmatchedShares);
    predictionMarket.poolAmount = (predictionMarket.poolAmount || 0) + totalAmount;
    await predictionMarket.save();
  }

  // Log transaction
  await Transaction.create({
    user: user._id,
    type: 'p2p_order_placed',
    amount: totalAmount,
    status: 'completed',
    reference: order._id.toString(),
    description: `P2P Order: ${parsedShares} shares on ${targetTitle} (${selection})`,
  });

  return {
    order,
    instantMatchedShares: order.matchedShares,
    queuedPendingShares: order.unmatchedShares,
    balance: user.balance,
  };
};

export const getOrderBook = async (targetId: string, market = 'MATCH_OUTCOME') => {
  const { match, predictionMarket } = await resolveTargetMatchOrMarket(targetId);

  if (!match && !predictionMarket) {
    return {
      targetId,
      market,
      orderBook: {},
      totalLiquidity: 0,
      totalMatchedShares: 0
    };
  }

  const query: any = {
    market: market as any,
    status: { $in: ['OPEN', 'PARTIALLY_MATCHED', 'MATCHED'] },
  };
  if (match) query.match = match._id;
  if (predictionMarket) query.predictionMarket = predictionMarket._id;

  const orders = await P2POrder.find(query);

  const summary: Record<string, { openShares: number; matchedShares: number; totalShares: number; orderCount: number }> = {};

  for (const ord of orders) {
    if (!summary[ord.selection]) {
      summary[ord.selection] = { openShares: 0, matchedShares: 0, totalShares: 0, orderCount: 0 };
    }
    summary[ord.selection].openShares += ord.unmatchedShares;
    summary[ord.selection].matchedShares += ord.matchedShares;
    summary[ord.selection].totalShares += ord.totalShares;
    summary[ord.selection].orderCount += 1;
  }

  const totalP2PVolume = match
    ? (match.p2pStats?.totalSharesTraded || 0) * SHARE_UNIT_PRICE
    : (predictionMarket?.p2pStats?.totalSharesTraded || 0) * SHARE_UNIT_PRICE;

  return {
    targetId,
    market,
    orderBook: summary,
    totalP2PVolume,
  };
};

export const cancelP2POrder = async (userId: string, orderId: string) => {
  const order = await P2POrder.findOne({ _id: orderId, user: userId });
  if (!order) throw new Error('Order not found');

  if (order.status !== 'OPEN' && order.status !== 'PARTIALLY_MATCHED') {
    throw new Error('Only open or partially matched orders with pending shares can be cancelled');
  }

  if (order.unmatchedShares <= 0) {
    throw new Error('No pending shares available to cancel');
  }

  const refundAmount = order.unmatchedShares * SHARE_UNIT_PRICE;
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.balance += refundAmount;
  await user.save();

  const cancelledShares = order.unmatchedShares;
  order.unmatchedShares = 0;
  order.status = order.matchedShares > 0 ? 'MATCHED' : 'CANCELLED';
  await order.save();

  // Log refund transaction
  await Transaction.create({
    user: user._id,
    type: 'p2p_order_cancelled',
    amount: refundAmount,
    status: 'completed',
    reference: `cancel_${order._id}`,
    description: `Refunded ${cancelledShares} unmatched shares (₦${refundAmount.toLocaleString()})`,
  });

  return {
    message: `Cancelled ${cancelledShares} pending shares. ₦${refundAmount.toLocaleString()} refunded to balance.`,
    order,
    balance: user.balance,
  };
};
