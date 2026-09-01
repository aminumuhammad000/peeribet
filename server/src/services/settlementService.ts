import Match from '../models/Match';
import Bet from '../models/Bet';
import P2POrder from '../models/P2POrder';
import PoolContract from '../models/PoolContract';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { recordTreasuryIncome } from '../models/HouseTreasury';
import { createNotification } from './notificationService';
import { refreshMatchesFromProvider } from '../controllers/matchController';
import { SHARE_UNIT_PRICE } from './p2pEngine';

let isSettling = false;
let settlementTimer: NodeJS.Timeout | null = null;

/**
 * Checks whether a given selection won based on final match scores
 */
export const evaluateSelectionResult = (
  selection: string,
  homeScore: number,
  awayScore: number
): boolean => {
  const totalGoals = homeScore + awayScore;
  switch (selection) {
    case 'HOME':
      return homeScore > awayScore;
    case 'DRAW':
      return homeScore === awayScore;
    case 'AWAY':
      return awayScore > homeScore;
    case 'OVER_25':
      return totalGoals > 2.5;
    case 'UNDER_25':
      return totalGoals < 2.5;
    case 'BTTS_YES':
      return homeScore > 0 && awayScore > 0;
    case 'BTTS_NO':
      return homeScore === 0 || awayScore === 0;
    default:
      return false;
  }
};

/**
 * Master Settlement Engine: Handles P2P Flow, Pool Jackpot Pro-Rata, and Bridge Double Hook
 */
export const settlePendingBetsForMatch = async (matchId?: string) => {
  if (isSettling) {
    console.log('[Settlement] Settlement already in progress; skipping duplicate run.');
    return { settledP2P: 0, settledPool: 0, settledBets: 0, matches: 0 };
  }

  isSettling = true;

  try {
    const matches = await Match.find(matchId ? { _id: matchId } : { status: 'FINISHED' });

    if (!matches.length) {
      return { settledP2P: 0, settledPool: 0, settledBets: 0, matches: 0 };
    }

    let totalP2PSettled = 0;
    let totalPoolSettled = 0;
    let totalBetsSettled = 0;

    for (const match of matches) {
      const homeScore = match.scoreHome ?? 0;
      const awayScore = match.scoreAway ?? 0;

      // ────────────────────────────────────────────────────────────────────────
      // 1. P2P TRADING SETTLEMENT
      // ────────────────────────────────────────────────────────────────────────
      const pendingP2POrders = await P2POrder.find({
        match: match._id,
        status: { $in: ['OPEN', 'PARTIALLY_MATCHED', 'MATCHED'] },
        outcomeResult: 'PENDING',
      });

      for (const order of pendingP2POrders) {
        // A. If there are remaining unmatched non-bridged shares, refund them
        if (order.unmatchedShares > 0 && !order.isBridged) {
          const refundAmount = order.unmatchedShares * SHARE_UNIT_PRICE;
          const user = await User.findById(order.user);
          if (user) {
            user.balance += refundAmount;
            await user.save();
            await Transaction.create({
              user: user._id,
              type: 'p2p_unmatched_refund',
              amount: refundAmount,
              status: 'completed',
              reference: `refund_${order._id}`,
              description: `Refunded ${order.unmatchedShares} unmatched shares on match finish`,
            });
          }
          order.unmatchedShares = 0;
        }

        // B. Settle matched shares if any
        if (order.matchedShares > 0) {
          const isWon = evaluateSelectionResult(order.selection, homeScore, awayScore);

          if (isWon) {
            order.outcomeResult = 'WON';
            order.status = 'SETTLED';

            const user = await User.findById(order.user);
            if (user) {
              const matchedStake = order.matchedShares * SHARE_UNIT_PRICE;
              const grossProfit = matchedStake; // 1:1 match payout (winner takes loser's stake)
              const platformFee = grossProfit * 0.05; // 5% fee on net profit
              const netPayout = matchedStake + (grossProfit - platformFee);

              user.balance += netPayout;
              await user.save();

              order.grossProfit = grossProfit;
              order.feePaid = platformFee;
              order.payout = netPayout;

              // Record 5% platform fee into House Treasury
              await recordTreasuryIncome(
                'P2P_FEE',
                platformFee,
                `5% P2P Profit Fee on ${match.homeTeam} vs ${match.awayTeam}`,
                match._id,
                order._id
              );

              // Log transaction
              await Transaction.create({
                user: user._id,
                type: 'p2p_trade_won',
                amount: netPayout,
                status: 'completed',
                reference: order._id.toString(),
                description: `P2P Win: ${order.matchedShares} shares on ${match.homeTeam} vs ${match.awayTeam} (${order.selection})`,
              });

              // Notification
              createNotification(
                user._id.toString(),
                'P2P Trade Won! 🎉',
                `Your ${order.matchedShares} share(s) on ${match.homeTeam} vs ${match.awayTeam} won. ₦${netPayout.toLocaleString()} (after 5% platform fee) credited to your balance.`,
                'bet'
              ).catch(() => {});
            }
          } else {
            order.outcomeResult = 'LOST';
            order.status = 'SETTLED';
            order.payout = 0;

            createNotification(
              order.user.toString(),
              'P2P Trade Settled',
              `Your trade on ${match.homeTeam} vs ${match.awayTeam} (${order.selection}) did not win.`,
              'bet'
            ).catch(() => {});
          }

          await order.save();
          totalP2PSettled += 1;
        } else {
          // If 0 matched shares, mark as SETTLED/REFUNDED
          order.status = order.isBridged ? 'BRIDGED' : 'SETTLED';
          order.outcomeResult = order.isBridged ? 'REFUNDED' : 'REFUNDED';
          await order.save();
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // 2. POOL TRADING & BRIDGE SETTLEMENT (Pro-Rata & Double Hook)
      // ────────────────────────────────────────────────────────────────────────
      const pendingPoolContracts = await PoolContract.find({
        match: match._id,
        status: 'PENDING',
      });

      if (pendingPoolContracts.length > 0) {
        // Calculate Total Pool Pot across all entries
        const totalPoolPot = pendingPoolContracts.reduce((sum, c) => sum + c.stake, 0);
        const houseFeeAmount = totalPoolPot * 0.05; // 5% House Fee on Total Pot
        const netDistributablePot = totalPoolPot - houseFeeAmount;

        // Record 5% House Fee into Treasury
        await recordTreasuryIncome(
          'POOL_FEE',
          houseFeeAmount,
          `5% Pool Pot Fee on ${match.homeTeam} vs ${match.awayTeam} (Pot: ₦${totalPoolPot.toLocaleString()})`,
          match._id
        );

        match.pool.houseFeeCollected = (match.pool.houseFeeCollected || 0) + houseFeeAmount;

        // Find winning pool entries
        const winningContracts: typeof pendingPoolContracts = [];
        const losingContracts: typeof pendingPoolContracts = [];

        for (const contract of pendingPoolContracts) {
          const isWon = evaluateSelectionResult(contract.selection, homeScore, awayScore);
          if (isWon) {
            winningContracts.push(contract);
          } else {
            losingContracts.push(contract);
          }
        }

        const totalWinningStakes = winningContracts.reduce((sum, c) => sum + c.stake, 0);

        // Process Winning Pool Contracts
        for (const contract of winningContracts) {
          const user = await User.findById(contract.user);
          if (!user) continue;

          // Calculate standard Pro-Rata Share
          const proRataShare = totalWinningStakes > 0
            ? (contract.stake / totalWinningStakes) * netDistributablePot
            : contract.stake * 0.95;

          contract.proRataShare = proRataShare;
          contract.status = 'WON';

          let actualPayout = proRataShare;

          if (contract.isBridged) {
            // ── The Bridge "Double" Hook Algorithm ──
            const target2x = contract.stake * 2;

            if (target2x <= proRataShare) {
              // Case A (Big Pool): Pay user 2x, capture surplus for Platform Profit
              actualPayout = target2x;
              const surplus = proRataShare - target2x;
              contract.surplus = surplus;
              contract.payoutType = 'DOUBLE_BRIDGE';

              if (surplus > 0) {
                match.pool.surplusCollected = (match.pool.surplusCollected || 0) + surplus;
                await recordTreasuryIncome(
                  'BRIDGE_SURPLUS',
                  surplus,
                  `Bridge Surplus Captured (2x Payout) on ${match.homeTeam} vs ${match.awayTeam}`,
                  match._id,
                  contract._id
                );
              }
            } else {
              // Case B (Shallow Pool Safety Valve): Pay exact Pro-Rata share
              actualPayout = proRataShare;
              contract.surplus = 0;
              contract.payoutType = 'SAFETY_VALVE';
            }
          } else {
            // Pure Pool User: Exact Pro-Rata share
            actualPayout = proRataShare;
            contract.surplus = 0;
            contract.payoutType = 'PRO_RATA';
          }

          contract.payout = actualPayout;
          await contract.save();

          // Credit User Balance
          user.balance += actualPayout;
          await user.save();

          // Log transaction
          await Transaction.create({
            user: user._id,
            type: contract.isBridged ? 'bridge_pool_won' : 'pool_jackpot_won',
            amount: actualPayout,
            status: 'completed',
            reference: contract._id.toString(),
            description: `${contract.isBridged ? 'Bridged (2x / Safety Valve)' : 'Pool Pro-Rata Jackpot'} Win on ${match.homeTeam} vs ${match.awayTeam}`,
          });

          // Send Win Notification
          const typeLabel = contract.isBridged
            ? (contract.payoutType === 'DOUBLE_BRIDGE' ? '2x Bridged Return' : 'Pro-Rata Safety Valve')
            : 'Pool Jackpot';

          createNotification(
            user._id.toString(),
            'Pool Jackpot Won! 💰',
            `Congratulations! Your ${typeLabel} on ${match.homeTeam} vs ${match.awayTeam} won. ₦${Math.round(actualPayout).toLocaleString()} has been credited to your wallet.`,
            'bet'
          ).catch(() => {});

          totalPoolSettled += 1;
        }

        // Process Losing Pool Contracts
        for (const contract of losingContracts) {
          contract.status = 'LOST';
          contract.payout = 0;
          await contract.save();

          createNotification(
            contract.user.toString(),
            'Pool Trade Settled',
            `Your pool trade on ${match.homeTeam} vs ${match.awayTeam} (${contract.selection}) did not win.`,
            'bet'
          ).catch(() => {});

          totalPoolSettled += 1;
        }

        await match.save();
      }

      // ────────────────────────────────────────────────────────────────────────
      // 3. LEGACY BET MODEL SETTLEMENT (Backward Compatibility)
      // ────────────────────────────────────────────────────────────────────────
      const pendingLegacyBets = await Bet.find({ match: match._id as any, status: 'PENDING' });
      for (const bet of pendingLegacyBets) {
        const isWon = evaluateSelectionResult(bet.selection, homeScore, awayScore);

        if (isWon) {
          bet.status = 'WON';
          await bet.save();

          const user = await User.findById(bet.user);
          if (user) {
            user.balance += bet.potentialPayout;
            await user.save();

            await Transaction.create({
              user: user._id,
              type: 'bet_won',
              amount: bet.potentialPayout,
              status: 'completed',
              reference: `bet_won_${bet._id}`,
              description: `Won trade: ${match.homeTeam} vs ${match.awayTeam} (${bet.selection})`,
            });

            createNotification(
              (user._id as any).toString(),
              'Trade Won! 🎉',
              `Your trade on ${match.homeTeam} vs ${match.awayTeam} (${bet.selection}) won. ₦${bet.potentialPayout} credited.`,
              'bet'
            ).catch(() => {});
          }
        } else {
          bet.status = 'LOST';
          await bet.save();
        }
        totalBetsSettled += 1;
      }
    }

    return {
      settledP2P: totalP2PSettled,
      settledPool: totalPoolSettled,
      settledBets: totalBetsSettled,
      matches: matches.length,
    };
  } catch (error: any) {
    console.error('[Settlement] Settlement failed:', error.message);
    throw error;
  } finally {
    isSettling = false;
  }
};

export const startLiveSettlementScheduler = (intervalMs = 60000) => {
  if (settlementTimer) return settlementTimer;

  const run = async () => {
    try {
      await refreshMatchesFromProvider();
      const result = await settlePendingBetsForMatch();
      if (result.settledP2P > 0 || result.settledPool > 0 || result.settledBets > 0) {
        console.log(
          `[Settlement] Auto-settled: ${result.settledP2P} P2P orders, ${result.settledPool} Pool entries for ${result.matches} match(es).`
        );
      }
    } catch (error: any) {
      console.error('[Settlement] Scheduler run failed:', error.message);
    }
  };

  void run();
  settlementTimer = setInterval(run, intervalMs);
  return settlementTimer;
};
