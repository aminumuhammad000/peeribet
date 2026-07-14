import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match';
import { realFootballService } from '../services/realFootballService';

dotenv.config();

const syncRealMatches = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const leagueIds = [4328, 4335, 4332, 4331, 4334];
    const matchesToInsert: any[] = [];

    for (const leagueId of leagueIds) {
      const events = await realFootballService.getNextEventsByLeagueId(leagueId);
      const leagueInfo = await realFootballService.getLeagueInfo(leagueId);

      for (const event of events.slice(0, 8)) {
        const [homeTeam, awayTeam] = (event.strEvent || 'Team vs Team').split(' vs ');
        const startTime = event.strTimestamp ? new Date(event.strTimestamp) : new Date();

        matchesToInsert.push({
          homeTeam: homeTeam || event.strEvent || 'Home Team',
          awayTeam: awayTeam || 'Away Team',
          homeLogo: event.strHomeTeamBadge || event.strThumb || '',
          awayLogo: event.strAwayTeamBadge || event.strThumb || '',
          league: leagueInfo?.strLeague || event.strLeague || 'Football League',
          startTime,
          status: new Date(startTime) < new Date() ? 'LIVE' : 'UPCOMING',
          isPromoted: leagueId === 4328,
          scoreHome: 0,
          scoreAway: 0,
          odds: {
            home: 2.1,
            draw: 3.4,
            away: 3.8,
            over25: 1.95,
            under25: 1.85,
            bttsYes: 1.9,
            bttsNo: 1.8,
          },
          poolAmount: 10000 + Math.floor(Math.random() * 50000),
          fixtureId: Number(event.idEvent) || undefined,
        });
      }
    }

    await Match.deleteMany({});
    await Match.insertMany(matchesToInsert);
    console.log(`Inserted ${matchesToInsert.length} real match records.`);
    process.exit(0);
  } catch (error) {
    console.error('Real match sync failed:', error);
    process.exit(1);
  }
};

syncRealMatches();
