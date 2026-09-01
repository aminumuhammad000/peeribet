import mongoose from 'mongoose';
import P2POrder, { IP2POrder } from '../models/P2POrder';
import Match from '../models/Match';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { createNotification } from './notificationService';

export const SHARE_UNIT_PRICE = 1000; // ₦1,000 = 1 Share

/**
 * Maps selections to their counterparty selections for matching
 */
const getOpposingSelections = (selection: string): string[] => {
  switch (selection) {
    case 'HOME':
      return ['AWAY', 'DRAW'];
    case 'AWAY':
      return ['HOME', 'DRAW'];
    case 'DRAW':
      return ['HOME', 'AWAY'];
    case 'OVER_25':
      return ['UNDER_25'];
    case 'UNDER_25':
      return ['OVER_25'];
    case 'BTTS_YES':
      return ['BTTS_NO'];
    case 'BTTS_NO':
      return ['BTTS_YES'];
    default:
      return [];
  }
};

export const placeP2POrder = async ({
  userId,
  matchId,
  market = 'MATCH_OUTCOME',
  selection,
  shares,
}: {
  userId: string;
  matchId: string;
  market?: 'MATCH_OUTCOME' | 'OVER_UNDER_25' | 'BTTS';
  selection: 'HOME' | 'DRAW' | 'AWAY' | 'OVER_25' | 'UNDER_25' | 'BTTS_YES' | 'BTTS_NO';
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

  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');
  if (match.status !== 'UPCOMING' && match.status !== 'LIVE') {
    throw new Error('Trading market for this match is currently closed');
  }

  // Deduct stake from user balance
  user.balance -= totalAmount;
  await user.save();

  // Create initial order
  const order = new P2POrder({
    user: user._id,
    match: match._id,
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

  // ── Matching Engine ──
  const opposingSelections = getOpposingSelections(selection);
  let remainingToMatch = parsedShares;

  if (opposingSelections.length > 0) {
    const opposingOrders = await P2POrder.find({
      match: match._id as any,
      market: market as any,
      selection: { $in: opposingSelections as any },
      status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] },
      user: { $ne: user._id as any }, // No self-trading
    }).sort({ createdAt: 1 }); // FIFO price-time priority

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
        `${fillCount} share(s) of your ${oppOrder.selection} position on ${match.homeTeam} vs ${match.awayTeam} were matched against the order book.`,
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

  // Update Match P2P stats
  match.p2pStats.totalSharesTraded = (match.p2pStats.totalSharesTraded || 0) + parsedShares;
  match.p2pStats.matchedShares = (match.p2pStats.matchedShares || 0) + order.matchedShares;
  match.p2pStats.openShares = Math.max(0, (match.p2pStats.openShares || 0) + order.unmatchedShares);
  await match.save();

  // Log transaction
  await Transaction.create({
    user: user._id,
    type: 'p2p_order_placed',
    amount: totalAmount,
    status: 'completed',
    reference: order._id.toString(),
    description: `P2P Order: ${parsedShares} shares on ${match.homeTeam} vs ${match.awayTeam} (${selection})`,
  });

  return {
    order,
    instantMatchedShares: order.matchedShares,
    queuedPendingShares: order.unmatchedShares,
    balance: user.balance,
  };
};

export const getOrderBook = async (matchId: string, market = 'MATCH_OUTCOME') => {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');

  const orders = await P2POrder.find({
    match: match._id as any,
    market: market as any,
    status: { $in: ['OPEN', 'PARTIALLY_MATCHED', 'MATCHED'] },
  });

  const summary: Record<string, { openShares: number; matchedShares: number; totalShares: number; orderCount: number }> = {
    HOME: { openShares: 0, matchedShares: 0, totalShares: 0, orderCount: 0 },
    DRAW: { openShares: 0, matchedShares: 0, totalShares: 0, orderCount: 0 },
    AWAY: { openShares: 0, matchedShares: 0, totalShares: 0, orderCount: 0 },
    OVER_25: { openShares: 0, matchedShares: 0, totalShares: 0, orderCount: 0 },
    UNDER_25: { openShares: 0, matchedShares: 0, totalShares: 0, orderCount: 0 },
    BTTS_YES: { openShares: 0, matchedShares: 0, totalShares: 0, orderCount: 0 },
    BTTS_NO: { openShares: 0, matchedShares: 0, totalShares: 0, orderCount: 0 },
  };

  for (const ord of orders) {
    if (summary[ord.selection]) {
      summary[ord.selection].openShares += ord.unmatchedShares;
      summary[ord.selection].matchedShares += ord.matchedShares;
      summary[ord.selection].totalShares += ord.totalShares;
      summary[ord.selection].orderCount += 1;
    }
  }

  return {
    matchId,
    market,
    orderBook: summary,
    totalP2PVolume: (match.p2pStats?.totalSharesTraded || 0) * SHARE_UNIT_PRICE,
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
