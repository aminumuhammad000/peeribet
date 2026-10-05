import mongoose from 'mongoose';
import P2POrder, { IP2POrder } from '../models/P2POrder';
import Match from '../models/Match';
import Market from '../models/Market';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { createNotification } from './notificationService';

export const SHARE_UNIT_PRICE = 1000; // ₦1,000 = 1 Share

/**
 * Maps selections to their counterparty selections for matching
 */
const getOpposingSelections = (selection: string, allOptions?: string[]): string[] => {
  const norm = String(selection).trim().toUpperCase();
  if (norm === 'HOME') return ['AWAY', 'DRAW'];
  if (norm === 'AWAY') return ['HOME', 'DRAW'];
  if (norm === 'DRAW') return ['HOME', 'AWAY'];
  if (norm === 'OVER_25') return ['UNDER_25'];
  if (norm === 'UNDER_25') return ['OVER_25'];
  if (norm === 'BTTS_YES' || norm === 'YES') return ['BTTS_NO', 'NO'];
  if (norm === 'BTTS_NO' || norm === 'NO') return ['BTTS_YES', 'YES'];
  if (norm === 'OPTION_A') return ['OPTION_B'];
  if (norm === 'OPTION_B') return ['OPTION_A'];

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

  match = await Match.findById(targetId);
  if (match) {
    if (match.status !== 'UPCOMING' && match.status !== 'LIVE') {
      throw new Error('Trading market for this match is currently closed');
    }
    targetTitle = `${match.homeTeam} vs ${match.awayTeam}`;
  } else {
    predictionMarket = await Market.findById(targetId);
    if (!predictionMarket) throw new Error('Market or Match not found');
    if (predictionMarket.status !== 'ACTIVE') {
      throw new Error('This prediction market is currently closed for trading');
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
    market: market as any,
    selection: { $in: opposingSelections as any },
    status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] },
    user: { $ne: user._id as any }, // No self-trading
  };
  if (match) orderQuery.match = match._id;
  if (predictionMarket) orderQuery.predictionMarket = predictionMarket._id;

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
  const match = await Match.findById(targetId);
  const predictionMarket = !match ? await Market.findById(targetId) : null;

  if (!match && !predictionMarket) throw new Error('Match or Market not found');

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
