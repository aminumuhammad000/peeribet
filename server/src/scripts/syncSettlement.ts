import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match';
import Bet from '../models/Bet';
import User from '../models/User';
import Transaction from '../models/Transaction';

dotenv.config();

const settleBets = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
    await mongoose.connect(mongoUri, {
      retryWrites: false,
    });
    console.log('Connected to MongoDB');

    let session: mongoose.ClientSession | null = null;
    const isReplicaSet = mongoUri.includes('replicaSet') || process.env.MONGODB_REPLICA_SET === 'true';
    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      // 1. Get all pending matches that are now FINISHED
      const finishedMatches = await Match.find({ 
        status: 'FINISHED'
      });

    console.log(`Processing settlement for ${finishedMatches.length} finished matches...`);

    for (const match of finishedMatches) {
      const pendingBets = await Bet.find({ 
        match: match._id as any,
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
          if (session) {
            await bet.save({ session });
          } else {
            await bet.save();
          }

          // Credit user wallet
          const user = session ? await User.findById(bet.user).session(session) : await User.findById(bet.user);
          if (user) {
            user.balance += bet.potentialPayout;
            if (session) {
              await user.save({ session });
            } else {
              await user.save();
            }

            const transactionData = {
              user: user._id,
              type: 'bet_won' as const,
              amount: bet.potentialPayout,
              status: 'completed' as const,
              reference: `bet_won_${bet._id}`,
              description: `Won trade: ${match.homeTeam} vs ${match.awayTeam} (${bet.selection})`
            };
            if (session) {
              await Transaction.create([transactionData], { session });
            } else {
              await Transaction.create(transactionData);
            }
          }
        } else {
          bet.status = 'LOST';
          if (session) {
            await bet.save({ session });
          } else {
            await bet.save();
          }
        }
      }
    }

      if (session) {
        await session.commitTransaction();
      }
      console.log('Settlement cycle completed successfully.');
      process.exit(0);
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      console.error('Settlement cycle failed:', error);
      process.exit(1);
    } finally {
      if (session) {
        session.endSession();
      }
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Settlement setup failed:', error);
    process.exit(1);
  }
};

settleBets();
