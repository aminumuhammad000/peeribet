import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match';
import Bet from '../models/Bet';
import User from '../models/User';
import Transaction from '../models/Transaction';

dotenv.config();

const settleBets = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Get all pending matches that are now FINISHED
    const finishedMatches = await Match.find({ 
      status: 'FINISHED'
    });

    console.log(`Processing settlement for ${finishedMatches.length} finished matches...`);

    for (const match of finishedMatches) {
      const pendingBets = await Bet.find({ 
        match: match._id, 
        status: 'PENDING' 
      });

      if (pendingBets.length === 0) continue;

      console.log(`Settling ${pendingBets.length} trades for ${match.homeTeam} vs ${match.awayTeam}`);

      for (const bet of pendingBets) {
        let isWon = false;

        const homeScore = match.scoreHome;
        const awayScore = match.scoreAway;
        const totalGoals = homeScore + awayScore;

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
        }

        if (isWon) {
          // Payout logic
          bet.status = 'WON';
          await bet.save({ session });

          // Credit user wallet
          const user = await User.findById(bet.user).session(session);
          if (user) {
            user.balance += bet.potentialPayout;
            await user.save({ session });

            // Create credit transaction
            await Transaction.create([{
              user: user._id,
              type: 'bet_won',
              amount: bet.potentialPayout,
              status: 'completed',
              description: `Won trade: ${match.homeTeam} vs ${match.awayTeam} (${bet.selection})`
            }], { session });
          }
        } else {
          bet.status = 'LOST';
          await bet.save({ session });
        }
      }
    }

    await session.commitTransaction();
    console.log('Settlement cycle completed successfully.');
    process.exit(0);
  } catch (error) {
    await session.abortTransaction();
    console.error('Settlement cycle failed:', error);
    process.exit(1);
  } finally {
    session.endSession();
  }
};

settleBets();
