import P2POrder from '../models/P2POrder';
import PoolContract from '../models/PoolContract';
import Match from '../models/Match';
import Market from '../models/Market';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { createNotification } from './notificationService';
import { SHARE_UNIT_PRICE } from './p2pEngine';

let bridgeSchedulerTimer: NodeJS.Timeout | null = null;

/**
 * Scan for upcoming matches and active prediction markets within the 60% countdown threshold and offer Bridge Protocol
 */
export const checkAndTriggerBridgeOffers = async () => {
  try {
    const now = new Date();
    // 1. Matches (Football, Boxing, UFC, Basketball) starting in the future
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

    // 2. Prediction Markets (Entertainment, Politics, Real life events)
    const predictionMarkets = await Market.find({
      status: 'ACTIVE',
      closingDate: { $gt: now },
    });

    for (const pMarket of predictionMarkets) {
      const marketCreatedAt = (pMarket as any).createdAt ? new Date((pMarket as any).createdAt) : new Date(Date.now() - 3600000);
      const timeUntilCloseMs = pMarket.closingDate ? new Date(pMarket.closingDate).getTime() - now.getTime() : 3600000;
      const timeSinceCreatedMs = now.getTime() - marketCreatedAt.getTime();
      const totalWindowMs = timeSinceCreatedMs + timeUntilCloseMs;

      const elapsedRatio = totalWindowMs > 0 ? timeSinceCreatedMs / totalWindowMs : 1.0;
      const isWithinThreshold = elapsedRatio >= 0.60 || timeUntilCloseMs <= 2 * 60 * 60 * 1000;

      if (isWithinThreshold) {
        const pendingOrders = await P2POrder.find({
          predictionMarket: pMarket._id as any,
          status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] },
          unmatchedShares: { $gt: 0 },
          bridgeOffered: false,
        });

        for (const order of pendingOrders) {
          order.bridgeOffered = true;
          order.bridgeOfferedAt = new Date();
          await order.save();

          createNotification(
            order.user.toString(),
            '⚡ Bridge Protocol Activated!',
            `You have ${order.unmatchedShares} unmatched share(s) on "${pMarket.title}". Bridge them to the Pool for a chance at 2x return or the Pro-Rata Jackpot!`,
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
  })
    .populate('match')
    .populate('predictionMarket');

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

  const bridgedShares = order.unmatchedShares;
  const bridgedStake = bridgedShares * SHARE_UNIT_PRICE;

  let targetTitle = 'Market';
  let match: any = null;
  let predictionMarket: any = null;

  if (order.match) {
    match = await Match.findById(order.match);
    if (!match) throw new Error('Match not found');
    targetTitle = `${match.homeTeam} vs ${match.awayTeam}`;
  } else if (order.predictionMarket) {
    predictionMarket = await Market.findById(order.predictionMarket);
    if (!predictionMarket) throw new Error('Prediction market not found');
    targetTitle = predictionMarket.title;
  } else {
    throw new Error('Associated match or prediction market not found');
  }

  // 1. Create Pool Contract tagged with isBridged: true
  const poolContract = await PoolContract.create({
    user: userId,
    match: match ? match._id : undefined,
    predictionMarket: predictionMarket ? predictionMarket._id : undefined,
    market: order.market,
    selection: order.selection,
    stake: bridgedStake,
    isBridged: true,
    originalP2POrderId: order._id,
    status: 'PENDING',
  });

  // 2. Inject liquidity into the relevant Pool pot
  if (match) {
    match.pool.totalPot = (match.pool.totalPot || 0) + bridgedStake;

    const selNorm = String(order.selection).trim().toUpperCase();
    if (selNorm === 'HOME') match.pool.homePot = (match.pool.homePot || 0) + bridgedStake;
    else if (selNorm === 'DRAW') match.pool.drawPot = (match.pool.drawPot || 0) + bridgedStake;
    else if (selNorm === 'AWAY') match.pool.awayPot = (match.pool.awayPot || 0) + bridgedStake;
    else if (selNorm === 'OVER_25') match.pool.over25Pot = (match.pool.over25Pot || 0) + bridgedStake;
    else if (selNorm === 'UNDER_25') match.pool.under25Pot = (match.pool.under25Pot || 0) + bridgedStake;
    else if (selNorm === 'BTTS_YES') match.pool.bttsYesPot = (match.pool.bttsYesPot || 0) + bridgedStake;
    else if (selNorm === 'BTTS_NO') match.pool.bttsNoPot = (match.pool.bttsNoPot || 0) + bridgedStake;
    else if (selNorm === 'KO_TKO_SUB') match.pool.koTkoSubPot = (match.pool.koTkoSubPot || 0) + bridgedStake;
    else if (selNorm === 'DECISION') match.pool.decisionPot = (match.pool.decisionPot || 0) + bridgedStake;
    else if (selNorm === 'EARLY_STOPPAGE') match.pool.earlyStoppagePot = (match.pool.earlyStoppagePot || 0) + bridgedStake;
    else if (selNorm === 'GO_DISTANCE') match.pool.goDistancePot = (match.pool.goDistancePot || 0) + bridgedStake;
    else if (selNorm === 'SPREAD_HOME') match.pool.spreadHomePot = (match.pool.spreadHomePot || 0) + bridgedStake;
    else if (selNorm === 'SPREAD_AWAY') match.pool.spreadAwayPot = (match.pool.spreadAwayPot || 0) + bridgedStake;
    else if (selNorm === 'OVER_POINTS') match.pool.overPointsPot = (match.pool.overPointsPot || 0) + bridgedStake;
    else if (selNorm === 'UNDER_POINTS') match.pool.underPointsPot = (match.pool.underPointsPot || 0) + bridgedStake;
    else if (selNorm === 'HALF_HOME') match.pool.halfHomePot = (match.pool.halfHomePot || 0) + bridgedStake;
    else if (selNorm === 'HALF_AWAY') match.pool.halfAwayPot = (match.pool.halfAwayPot || 0) + bridgedStake;
    else if (selNorm === '1X') match.pool.doubleChance1xPot = (match.pool.doubleChance1xPot || 0) + bridgedStake;
    else if (selNorm === 'X2') match.pool.doubleChanceX2Pot = (match.pool.doubleChanceX2Pot || 0) + bridgedStake;

    if (!match.pool.optionPots) match.pool.optionPots = {};
    if (match.pool.optionPots instanceof Map) {
      const cur = match.pool.optionPots.get(selNorm) || 0;
      match.pool.optionPots.set(selNorm, cur + bridgedStake);
    } else {
      match.pool.optionPots[selNorm] = (match.pool.optionPots[selNorm] || 0) + bridgedStake;
    }

    match.poolAmount = match.pool.totalPot;
    await match.save();
  }

  if (predictionMarket) {
    predictionMarket.poolAmount = (predictionMarket.poolAmount || 0) + bridgedStake;
    if (!predictionMarket.pool) {
      predictionMarket.pool = { totalPot: 0, optionPots: {} };
    }
    predictionMarket.pool.totalPot = (predictionMarket.pool.totalPot || 0) + bridgedStake;

    const norm = String(order.selection).trim().toUpperCase();
    const opt = predictionMarket.options?.find(
      (o: any) =>
        String(o.label).trim().toUpperCase() === norm ||
        String(o.id).trim().toUpperCase() === norm ||
        (norm === 'YES' && o.id?.toLowerCase() === 'yes') ||
        (norm === 'NO' && o.id?.toLowerCase() === 'no')
    );
    if (opt) {
      opt.totalStaked = (opt.totalStaked || 0) + bridgedStake;
    }

    const currentVolNum = parseFloat(String(predictionMarket.volume || '0').replace(/[^0-9.]/g, '')) || 0;
    predictionMarket.volume = `₦${(currentVolNum + bridgedStake).toLocaleString()}`;
    await predictionMarket.save();
  }

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
    description: `Bridged ${bridgedShares} shares (₦${bridgedStake.toLocaleString()}) to Pool on ${targetTitle}`,
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
