import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match';
import { settlePendingBetsForMatch } from '../services/settlementService';

dotenv.config();

const matchId = process.argv[2];
const homeScore = Number(process.argv[3] ?? 1);
const awayScore = Number(process.argv[4] ?? 0);

if (!matchId) {
  console.error('Usage: ts-node src/scripts/finishMatch.ts <matchId> [homeScore] [awayScore]');
  process.exit(1);
}

const finish = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
  await mongoose.connect(mongoUri);

  const match = await Match.findById(matchId);
  if (!match) {
    console.error('Match not found:', matchId);
    process.exit(1);
  }

  match.status = 'FINISHED';
  match.scoreHome = homeScore;
  match.scoreAway = awayScore;
  await match.save();

  await settlePendingBetsForMatch(match._id.toString());

  console.log('MATCH_FINISHED:' + match._id);
  await mongoose.disconnect();
};

finish().catch(err => { console.error(err); process.exit(1); });
