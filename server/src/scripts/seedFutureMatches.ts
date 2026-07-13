import mongoose from 'mongoose';
import Match from '../models/Match';
import dotenv from 'dotenv';

dotenv.config();

const TEAMS = [
  { home: 'Arsenal', away: 'Liverpool' },
  { home: 'Man City', away: 'Chelsea' },
  { home: 'Man United', away: 'Tottenham' },
  { home: 'Brighton', away: 'Newcastle' },
  { home: 'Aston Villa', away: 'Fulham' },
  { home: 'Brentford', away: 'Everton' },
  { home: 'Leicester', away: 'Leeds' },
  { home: 'Real Madrid', away: 'Barcelona' },
  { home: 'Bayern Munich', away: 'Borussia Dortmund' },
  { home: 'Paris SG', away: 'Lyon' },
];

async function seedFutureMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade');
    console.log('Connected to MongoDB');

    // Delete existing matches to start fresh
    await Match.deleteMany({});

    // Create matches for the next 7 days starting from today
    const today = new Date();
    const matches = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const matchDate = new Date(today);
      matchDate.setDate(matchDate.getDate() + dayOffset);
      matchDate.setHours(12 + dayOffset * 2, 30, 0, 0); // Spread times across the day

      const team = TEAMS[dayOffset % TEAMS.length];
      const status = dayOffset === 0 ? 'LIVE' : 'UPCOMING';
      const isPromoted = dayOffset < 3; // First 3 days get promoted

      matches.push({
        homeTeam: team.home,
        awayTeam: team.away,
        league: 'English Premier League',
        startTime: matchDate,
        status: status,
        isPromoted: isPromoted,
        odds: {
          home: 1.8 + Math.random() * 0.5,
          draw: 3.2 + Math.random() * 0.5,
          away: 3.8 + Math.random() * 0.5,
        },
        poolAmount: Math.floor(Math.random() * 100000) + 50000,
        scoreHome: 0,
        scoreAway: 0,
        homeLogo: `https://ui-avatars.com/api/?name=${team.home.substring(0, 2)}&background=random&color=fff&rounded=true`,
        awayLogo: `https://ui-avatars.com/api/?name=${team.away.substring(0, 2)}&background=random&color=fff&rounded=true`,
      });
    }

    await Match.insertMany(matches);
    console.log(`✅ Seeded ${matches.length} matches for the next 7 days`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding matches:', error);
    process.exit(1);
  }
}

seedFutureMatches();
