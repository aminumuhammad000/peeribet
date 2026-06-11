const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Match = require('./dist/models/Match').default;

const matches = [
  {
    homeTeam: 'Chelsea',
    awayTeam: 'Arsenal',
    homeLogo: 'https://ui-avatars.com/api/?name=CH&background=034694&color=fff&rounded=true',
    awayLogo: 'https://ui-avatars.com/api/?name=AR&background=EF0107&color=fff&rounded=true',
    league: 'English Premier League',
    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    status: 'UPCOMING',
    isPromoted: true,
    odds: { home: 2.1, draw: 3.4, away: 3.0 },
    poolAmount: 8500
  },
  {
    homeTeam: 'Man City',
    awayTeam: 'Liverpool',
    homeLogo: 'https://ui-avatars.com/api/?name=MC&background=6CABDD&color=fff&rounded=true',
    awayLogo: 'https://ui-avatars.com/api/?name=LI&background=C8102E&color=fff&rounded=true',
    league: 'English Premier League',
    startTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    status: 'UPCOMING',
    isPromoted: true,
    odds: { home: 1.8, draw: 3.8, away: 4.2 },
    poolAmount: 78000
  },
  {
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    homeLogo: 'https://ui-avatars.com/api/?name=BA&background=004D98&color=fff&rounded=true',
    awayLogo: 'https://ui-avatars.com/api/?name=RM&background=FFFFFF&color=000&rounded=true',
    league: 'La Liga',
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago (LIVE)
    status: 'LIVE',
    isPromoted: false,
    scoreHome: 1,
    scoreAway: 1,
    odds: { home: 2.5, draw: 2.1, away: 3.2 },
    poolAmount: 120000
  }
];

const seedMatches = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Match.deleteMany({});
    console.log('Cleared existing matches');

    await Match.insertMany(matches);
    console.log('Seeded matches successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding matches:', error);
    process.exit(1);
  }
};

seedMatches();
