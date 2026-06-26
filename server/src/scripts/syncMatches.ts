import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { footballApiService } from '../services/footballApiService';
import Match from '../models/Match';

dotenv.config();

const syncMatches = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const today = new Date().toISOString().split('T')[0];
    console.log(`Fetching fixtures for ${today} (Timezone: Africa/Lagos)...`);

    // Fetch fixtures with timezone specified
    const fixtures = await footballApiService.getFixturesByDate(today, 'Africa/Lagos');
    console.log(`Found ${fixtures.length} fixtures.`);

    // Major leagues IDs (Premier League, La Liga, Serie A, etc.)
    const majorLeagues = [39, 140, 135, 78, 61, 2, 3]; 

    const filteredFixtures = fixtures.filter((f: any) => 
      majorLeagues.includes(f.league.id)
    );

    console.log(`Processing ${filteredFixtures.length} major league fixtures...`);

    // Fetch pre-match odds for today to populate initial data
    const oddsToday = await footballApiService.getOddsByDate(today);
    console.log(`Fetched pre-match odds for today.`);

    for (const item of filteredFixtures) {
      const { fixture, league, teams, goals } = item;
      
      // Find odds for this fixture from the pre-match odds data
      const fixtureOddsData = oddsToday.find((o: any) => o.fixture.id === fixture.id);
      let initialOdds = { home: 1.0, draw: 1.0, away: 1.0, over25: 0, under25: 0, bttsYes: 0, bttsNo: 0 };

      if (fixtureOddsData && fixtureOddsData.bookmakers && fixtureOddsData.bookmakers.length > 0) {
        // Use the first bookmaker (usually 10Bet or Bwin)
        const bets = fixtureOddsData.bookmakers[0].bets;
        
        // Match Winner
        const winBet = bets.find((b: any) => b.id === 1);
        if (winBet) {
          initialOdds.home = parseFloat(winBet.values.find((v: any) => v.value === 'Home')?.odd || '1.0');
          initialOdds.draw = parseFloat(winBet.values.find((v: any) => v.value === 'Draw')?.odd || '1.0');
          initialOdds.away = parseFloat(winBet.values.find((v: any) => v.value === 'Away')?.odd || '1.0');
        }

        // Over/Under 2.5
        const ouBet = bets.find((b: any) => b.id === 5);
        if (ouBet) {
          initialOdds.over25 = parseFloat(ouBet.values.find((v: any) => v.value === 'Over 2.5')?.odd || '0');
          initialOdds.under25 = parseFloat(ouBet.values.find((v: any) => v.value === 'Under 2.5')?.odd || '0');
        }

        // BTTS
        const bttsBet = bets.find((b: any) => b.id === 8);
        if (bttsBet) {
          initialOdds.bttsYes = parseFloat(bttsBet.values.find((v: any) => v.value === 'Yes')?.odd || '0');
          initialOdds.bttsNo = parseFloat(bttsBet.values.find((v: any) => v.value === 'No')?.odd || '0');
        }
      }

      const statusMap: any = {
        'NS': 'UPCOMING',
        '1H': 'LIVE',
        'HT': 'LIVE',
        '2H': 'LIVE',
        'ET': 'LIVE',
        'P': 'LIVE',
        'FT': 'FINISHED',
        'AET': 'FINISHED',
        'PEN': 'FINISHED',
        'SUSP': 'SUSPENDED',
      };

      const matchStatus = statusMap[fixture.status.short] || 'UPCOMING';

      await Match.findOneAndUpdate(
        { fixtureId: fixture.id },
        {
          homeTeam: teams.home.name,
          awayTeam: teams.away.name,
          homeLogo: teams.home.logo,
          awayLogo: teams.away.logo,
          league: league.name,
          startTime: new Date(fixture.date),
          status: matchStatus,
          scoreHome: goals.home || 0,
          scoreAway: goals.away || 0,
          fixtureId: fixture.id,
          odds: initialOdds,
          $setOnInsert: {
            poolAmount: Math.floor(Math.random() * 10000) + 1000,
            isPromoted: league.id === 39 // Promote Premier League by default
          }
        },
        { upsert: true, new: true }
      );
    }

    console.log('Sync completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
};

syncMatches();
