import Match from '../models/Match';
import Bet from '../models/Bet';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { footballApiService } from './footballApiService';

let isSettling = false;
let settlementTimer: NodeJS.Timeout | null = null;
let liveRefreshTimer: NodeJS.Timeout | null = null;

const statusMap: Record<string, 'UPCOMING' | 'LIVE' | 'FINISHED' | 'SUSPENDED'> = {
  NS: 'UPCOMING',
  '1H': 'LIVE',
  HT: 'LIVE',
  '2H': 'LIVE',
  ET: 'LIVE',
  P: 'LIVE',
  FT: 'FINISHED',
  AET: 'FINISHED',
  PEN: 'FINISHED',
  SUSP: 'SUSPENDED',
};

import { refreshMatchesFromProvider } from '../controllers/matchController';
export const settlePendingBetsForMatch = async (matchId?: string) => {
  if (isSettling) {
    console.log('[Settlement] Settlement already in progress; skipping duplicate run.');
    return { settled: 0, matches: 0 };
  }

  isSettling = true;

  try {
    const matches = await Match.find(matchId ? { _id: matchId } : { status: 'FINISHED' });

    if (!matches.length) {
      return { settled: 0, matches: 0 };
    }

    let settled = 0;

    for (const match of matches) {
      const pendingBets = await Bet.find({ match: match._id as any, status: 'PENDING' });
      if (!pendingBets.length) continue;

      for (const bet of pendingBets) {
        const homeScore = match.scoreHome ?? 0;
        const awayScore = match.scoreAway ?? 0;
        const totalGoals = homeScore + awayScore;

        let isWon = false;

        switch (bet.selection) {
          case 'HOME':
            isWon = homeScore > awayScore;
            break;
          case 'DRAW':
            isWon = homeScore === awayScore;
            break;
          case 'AWAY':
            isWon = awayScore > homeScore;
            break;
          case 'OVER_25':
            isWon = totalGoals > 2.5;
            break;
          case 'UNDER_25':
            isWon = totalGoals < 2.5;
            break;
          case 'BTTS_YES':
            isWon = homeScore > 0 && awayScore > 0;
            break;
          case 'BTTS_NO':
            isWon = homeScore === 0 || awayScore === 0;
            break;
          default:
            isWon = false;
        }

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
            
            const { createNotification } = require('./notificationService');
            await createNotification(
              (user._id as any).toString(),
              'Trade Won! 🎉',
              `Congratulations! Your trade on ${match.homeTeam} vs ${match.awayTeam} (${bet.selection}) won. ₦${bet.potentialPayout} has been credited.`,
              'bet'
            );
          }
        } else {
          bet.status = 'LOST';
          await bet.save();

          const { createNotification } = require('./notificationService');
          await createNotification(
            (bet.user as any).toString(),
            'Trade Lost 😢',
            `Your trade on ${match.homeTeam} vs ${match.awayTeam} (${bet.selection}) did not win. Better luck next time!`,
            'bet'
          );
        }

        settled += 1;
      }
    }

    return { settled, matches: matches.length };
  } catch (error: any) {
    console.error('[Settlement] Settlement failed:', error.message);
    throw error;
  } finally {
    isSettling = false;
  }
};

export const startLiveSettlementScheduler = (intervalMs = 60000) => {
  if (settlementTimer) {
    return settlementTimer;
  }

  const run = async () => {
    try {
      await refreshMatchesFromProvider();
      const result = await settlePendingBetsForMatch();
      if (result.settled > 0) {
        console.log(`[Settlement] Auto-settled ${result.settled} bets for ${result.matches} finished match(es).`);
      }
    } catch (error: any) {
      console.error('[Settlement] Scheduler run failed:', error.message);
    }
  };

  void run();
  settlementTimer = setInterval(() => {
    void run();
  }, intervalMs);

  return settlementTimer;
};

export const startLiveRefreshScheduler = (intervalMs = 120000) => {
  if (liveRefreshTimer) {
    return liveRefreshTimer;
  }

  const run = async () => {
    try {
      // Disabled calling it twice to save rate limits
      // await refreshMatchesFromProvider();
    } catch (error: any) {
      console.error('[Live Refresh] Scheduler run failed:', error.message);
    }
  };

  void run();
  liveRefreshTimer = setInterval(() => {
    void run();
  }, intervalMs);

  return liveRefreshTimer;
};
