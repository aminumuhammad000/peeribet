import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match';

dotenv.config();

const createMatch = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
  await mongoose.connect(mongoUri);

  const match = await Match.create({
    homeTeam: 'Test Home FC',
    awayTeam: 'Test Away FC',
    league: 'Test League',
    startTime: new Date(Date.now() + 60 * 60 * 1000),
    status: 'UPCOMING',
    odds: {
      home: 1.8,
      draw: 3.2,
      away: 4.0
    }
  });

  console.log('MATCH_CREATED:' + match._id);
  await mongoose.disconnect();
};

createMatch().catch(err => { console.error(err); process.exit(1); });
