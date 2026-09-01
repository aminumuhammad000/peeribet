import P2POrder from '../models/P2POrder';
import PoolContract from '../models/PoolContract';
import Match from '../models/Match';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { createNotification } from './notificationService';
import { SHARE_UNIT_PRICE } from './p2pEngine';

let bridgeSchedulerTimer: NodeJS.Timeout | null = null;

/**
 * Scan for upcoming matches within the 60% countdown threshold and offer Bridge Protocol
 */
export const checkAndTriggerBridgeOffers = async () => {
  try {
    const now = new Date();
    // Matches starting within the next 2 hours
    const matches = await Match.find({
      status: 'UPCOMING',
      startTime: { $gt: now },
    });

    for (const match of matches) {
      const matchCreatedAt = (match as any).createdAt ? new Date((match as any).createdAt) : new Date(Date.now() - 3600000);
      const timeUntilStartMs = new Date(match.startTime).getTime() - now.getTime();
      const timeSinceCreatedMs = now.getTime() - matchCreatedAt.getTime();
      const totalLeadWindowMs = timeSinceCreatedMs + timeUntilStartMs;

      // Check if 60% of the lead window has elapsed or within 45 mins of kickoff
      const elapsedRatio = totalLeadWindowMs > 0 ? timeSinceCreatedMs / totalLeadWindowMs : 1.0;
      const isWithinThreshold = elapsedRatio >= 0.60 || timeUntilStartMs <= 45 * 60 * 1000;

      if (isWithinThreshold) {
        const pendingOrders = await P2POrder.find({
          match: match._id as any,
          status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] },
          unmatchedShares: { $gt: 0 },
          bridgeOffered: false,
        });

        for (const order of pendingOrders) {
          order.bridgeOffered = true;
          order.bridgeOfferedAt = new Date();
          await order.save();

          // Send in-app notification to prompt the user
          createNotification(
            order.user.toString(),
            '⚡ Bridge Protocol Activated!',
            `You have ${order.unmatchedShares} unmatched share(s) on ${match.homeTeam} vs ${match.awayTeam}. Bridge them to the Pool for a chance at 2x return or the Pro-Rata Jackpot!`,
            'bet'
          ).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('[Bridge Protocol] Scan error:', err);
  }
};

/**
 * Get all available bridge offers for a logged-in user
 */
export const getPendingBridgeOffers = async (userId: string) => {
  const orders = await P2POrder.find({
    user: userId,
    status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] },
    unmatchedShares: { $gt: 0 },
    bridgeOffered: true,
    isBridged: false,
  }).populate('match');

  return orders;
};

/**
 * Execute Bridge conversion from P2P Pending queue to Pool Participation
 */
export const acceptBridgeOffer = async (userId: string, orderId: string) => {
  const order = await P2POrder.findOne({ _id: orderId, user: userId });
  if (!order) throw new Error('Order not found');

  if (order.unmatchedShares <= 0) {
    throw new Error('No pending shares available to bridge');
  }

  const match = await Match.findById(order.match);
  if (!match) throw new Error('Match not found');

  const bridgedShares = order.unmatchedShares;
  const bridgedStake = bridgedShares * SHARE_UNIT_PRICE;

  // 1. Create Pool Contract tagged with isBridged: true
  const poolContract = await PoolContract.create({
    user: userId,
    match: match._id,
    market: order.market,
    selection: order.selection,
    stake: bridgedStake,
    isBridged: true,
    originalP2POrderId: order._id,
    status: 'PENDING',
  });

  // 2. Inject liquidity into the relevant Pool pot
  match.pool.totalPot = (match.pool.totalPot || 0) + bridgedStake;
  if (order.selection === 'HOME') match.pool.homePot = (match.pool.homePot || 0) + bridgedStake;
  else if (order.selection === 'DRAW') match.pool.drawPot = (match.pool.drawPot || 0) + bridgedStake;
  else if (order.selection === 'AWAY') match.pool.awayPot = (match.pool.awayPot || 0) + bridgedStake;
  else if (order.selection === 'OVER_25') match.pool.over25Pot = (match.pool.over25Pot || 0) + bridgedStake;
  else if (order.selection === 'UNDER_25') match.pool.under25Pot = (match.pool.under25Pot || 0) + bridgedStake;
  else if (order.selection === 'BTTS_YES') match.pool.bttsYesPot = (match.pool.bttsYesPot || 0) + bridgedStake;
  else if (order.selection === 'BTTS_NO') match.pool.bttsNoPot = (match.pool.bttsNoPot || 0) + bridgedStake;

  match.poolAmount = match.pool.totalPot;
  await match.save();

  // 3. Update P2P Order status
  order.isBridged = true;
  order.bridgedAt = new Date();
  order.unmatchedShares = 0;
  order.status = order.matchedShares > 0 ? 'MATCHED' : 'BRIDGED';
  await order.save();

  // 4. Log Transaction
  await Transaction.create({
    user: userId,
    type: 'bridge_liquidity_converted',
    amount: bridgedStake,
    status: 'completed',
    reference: poolContract._id.toString(),
    description: `Bridged ${bridgedShares} shares (₦${bridgedStake.toLocaleString()}) to Pool on ${match.homeTeam} vs ${match.awayTeam}`,
  });

  // 5. Notify user
  createNotification(
    userId,
    'Shares Successfully Bridged 🌉',
    `₦${bridgedStake.toLocaleString()} (${bridgedShares} shares) was bridged into the Pool. You are now in line for a guaranteed 2x payout or Pro-Rata share!`,
    'bet'
  ).catch(() => {});

  return {
    message: `Successfully bridged ${bridgedShares} shares into the Pool!`,
    order,
    poolContract,
  };
};

export const startBridgeScheduler = (intervalMs = 30000) => {
  if (bridgeSchedulerTimer) return bridgeSchedulerTimer;

  const run = async () => {
    await checkAndTriggerBridgeOffers();
  };

  void run();
  bridgeSchedulerTimer = setInterval(run, intervalMs);
  return bridgeSchedulerTimer;
};
