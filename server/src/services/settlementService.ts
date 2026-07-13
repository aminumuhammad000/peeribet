import Match from '../models/Match';
import Bet from '../models/Bet';
import User from '../models/User';
import Transaction from '../models/Transaction';

let isSettling = false;
let settlementTimer: NodeJS.Timeout | null = null;

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
          }
        } else {
          bet.status = 'LOST';
          await bet.save();
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

export const startLiveSettlementScheduler = (intervalMs = 30000) => {
  if (settlementTimer) {
    return settlementTimer;
  }

  const run = async () => {
    try {
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
