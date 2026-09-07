import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match';
import Market from '../models/Market';
import User from '../models/User';

dotenv.config();

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peeritrade';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB at', mongoUri);

    const adminUser = await User.findOne({ role: 'admin' });

    // 1. European Football Matches
    const europeanFootballFixtures = [
      {
        sport: 'European Football',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        league: 'La Liga (El Clásico)',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours from now
        status: 'UPCOMING',
        isPromoted: true,
        odds: { home: 2.10, draw: 3.40, away: 3.10, over25: 1.70, under25: 2.10, bttsYes: 1.60, bttsNo: 2.25 },
        poolAmount: 4850000,
        homeLogo: 'https://media.api-sports.io/football/teams/541.png',
        awayLogo: 'https://media.api-sports.io/football/teams/529.png',
      },
      {
        sport: 'European Football',
        homeTeam: 'Arsenal',
        awayTeam: 'Manchester City',
        league: 'English Premier League',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 8),
        status: 'UPCOMING',
        isPromoted: true,
        odds: { home: 2.45, draw: 3.30, away: 2.80, over25: 1.85, under25: 1.95, bttsYes: 1.68, bttsNo: 2.10 },
        poolAmount: 6200000,
        homeLogo: 'https://media.api-sports.io/football/teams/42.png',
        awayLogo: 'https://media.api-sports.io/football/teams/50.png',
      },
      {
        sport: 'European Football',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        league: 'German Bundesliga (Der Klassiker)',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'UPCOMING',
        isPromoted: false,
        odds: { home: 1.75, draw: 3.90, away: 4.20, over25: 1.50, under25: 2.50, bttsYes: 1.52, bttsNo: 2.40 },
        poolAmount: 3100000,
        homeLogo: 'https://media.api-sports.io/football/teams/157.png',
        awayLogo: 'https://media.api-sports.io/football/teams/165.png',
      },
      {
        sport: 'European Football',
        homeTeam: 'Inter Milan',
        awayTeam: 'AC Milan',
        league: 'Italian Serie A (Derby della Madonnina)',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 30),
        status: 'UPCOMING',
        isPromoted: false,
        odds: { home: 2.05, draw: 3.25, away: 3.50, over25: 1.90, under25: 1.90, bttsYes: 1.75, bttsNo: 2.00 },
        poolAmount: 2900000,
        homeLogo: 'https://media.api-sports.io/football/teams/505.png',
        awayLogo: 'https://media.api-sports.io/football/teams/489.png',
      },
      {
        sport: 'European Football',
        homeTeam: 'Paris Saint-Germain',
        awayTeam: 'Marseille',
        league: 'French Ligue 1 (Le Classique)',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 48),
        status: 'UPCOMING',
        isPromoted: false,
        odds: { home: 1.65, draw: 3.80, away: 5.00, over25: 1.60, under25: 2.30, bttsYes: 1.70, bttsNo: 2.05 },
        poolAmount: 2400000,
        homeLogo: 'https://media.api-sports.io/football/teams/85.png',
        awayLogo: 'https://media.api-sports.io/football/teams/81.png',
      },
      {
        sport: 'European Football',
        homeTeam: 'Liverpool',
        awayTeam: 'Real Madrid',
        league: 'UEFA Champions League',
        startTime: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago (LIVE)
        status: 'LIVE',
        isPromoted: true,
        scoreHome: 1,
        scoreAway: 1,
        odds: { home: 2.20, draw: 2.90, away: 3.10, over25: 1.72, under25: 2.05, bttsYes: 1.40, bttsNo: 2.75 },
        poolAmount: 8900000,
        homeLogo: 'https://media.api-sports.io/football/teams/40.png',
        awayLogo: 'https://media.api-sports.io/football/teams/541.png',
      },
    ];

    // 2. UFC & Boxing Fights
    const combatSportsFights = [
      {
        sport: 'UFC & Boxing',
        homeTeam: 'Islam Makhachev',
        awayTeam: 'Arman Tsarukyan',
        league: 'UFC 311: Lightweight Championship',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 72),
        status: 'UPCOMING',
        isPromoted: true,
        odds: { home: 1.40, draw: 35.0, away: 2.95 },
        poolAmount: 3750000,
        homeLogo: 'https://ui-avatars.com/api/?name=Islam+Makhachev&background=1e293b&color=00D285',
        awayLogo: 'https://ui-avatars.com/api/?name=Arman+Tsarukyan&background=1e293b&color=EF4444',
      },
      {
        sport: 'UFC & Boxing',
        homeTeam: 'Tyson Fury',
        awayTeam: 'Oleksandr Usyk',
        league: 'Undisputed World Heavyweight Championship',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 120),
        status: 'UPCOMING',
        isPromoted: true,
        odds: { home: 2.15, draw: 22.0, away: 1.72 },
        poolAmount: 9400000,
        homeLogo: 'https://ui-avatars.com/api/?name=Tyson+Fury&background=1e293b&color=F59E0B',
        awayLogo: 'https://ui-avatars.com/api/?name=Oleksandr+Usyk&background=1e293b&color=3B82F6',
      },
      {
        sport: 'UFC & Boxing',
        homeTeam: 'Jon Jones',
        awayTeam: 'Tom Aspinall',
        league: 'UFC Heavyweight Unification Title',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 168),
        status: 'UPCOMING',
        isPromoted: true,
        odds: { home: 1.78, draw: 30.0, away: 2.05 },
        poolAmount: 5120000,
        homeLogo: 'https://ui-avatars.com/api/?name=Jon+Jones&background=1e293b&color=00D285',
        awayLogo: 'https://ui-avatars.com/api/?name=Tom+Aspinall&background=1e293b&color=EF4444',
      },
      {
        sport: 'UFC & Boxing',
        homeTeam: 'Canelo Alvarez',
        awayTeam: 'Terence Crawford',
        league: 'Super Middleweight World Championship',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 200),
        status: 'UPCOMING',
        isPromoted: false,
        odds: { home: 1.62, draw: 20.0, away: 2.30 },
        poolAmount: 4300000,
        homeLogo: 'https://ui-avatars.com/api/?name=Canelo+Alvarez&background=1e293b&color=F59E0B',
        awayLogo: 'https://ui-avatars.com/api/?name=Terence+Crawford&background=1e293b&color=3B82F6',
      },
      {
        sport: 'UFC & Boxing',
        homeTeam: 'Alex Pereira',
        awayTeam: 'Magomed Ankalaev',
        league: 'UFC Light Heavyweight Championship',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 96),
        status: 'UPCOMING',
        isPromoted: false,
        odds: { home: 1.85, draw: 28.0, away: 1.95 },
        poolAmount: 3200000,
        homeLogo: 'https://ui-avatars.com/api/?name=Alex+Pereira&background=1e293b&color=00D285',
        awayLogo: 'https://ui-avatars.com/api/?name=Magomed+Ankalaev&background=1e293b&color=EF4444',
      },
    ];

    // 3. NBA Basketball Games
    const nbaBasketballGames = [
      {
        sport: 'NBA Basketball',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Los Angeles Lakers',
        league: 'NBA Regular Season',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 6),
        status: 'UPCOMING',
        isPromoted: true,
        odds: { home: 1.55, draw: 15.0, away: 2.45 },
        poolAmount: 4100000,
        homeLogo: 'https://ui-avatars.com/api/?name=Boston+Celtics&background=008348&color=fff',
        awayLogo: 'https://ui-avatars.com/api/?name=LA+Lakers&background=552583&color=FDB927',
      },
      {
        sport: 'NBA Basketball',
        homeTeam: 'Golden State Warriors',
        awayTeam: 'Denver Nuggets',
        league: 'NBA Western Conference Clash',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 10),
        status: 'UPCOMING',
        isPromoted: true,
        odds: { home: 2.10, draw: 14.0, away: 1.75 },
        poolAmount: 3450000,
        homeLogo: 'https://ui-avatars.com/api/?name=GS+Warriors&background=1D428A&color=FFC72C',
        awayLogo: 'https://ui-avatars.com/api/?name=Denver+Nuggets&background=0E2240&color=FEC524',
      },
      {
        sport: 'NBA Basketball',
        homeTeam: 'Milwaukee Bucks',
        awayTeam: 'New York Knicks',
        league: 'NBA Eastern Conference',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 26),
        status: 'UPCOMING',
        isPromoted: false,
        odds: { home: 1.82, draw: 15.0, away: 2.02 },
        poolAmount: 2600000,
        homeLogo: 'https://ui-avatars.com/api/?name=Bucks&background=00471B&color=EEE1C6',
        awayLogo: 'https://ui-avatars.com/api/?name=Knicks&background=006BB6&color=F58426',
      },
      {
        sport: 'NBA Basketball',
        homeTeam: 'Dallas Mavericks',
        awayTeam: 'Phoenix Suns',
        league: 'NBA Regular Season',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 34),
        status: 'UPCOMING',
        isPromoted: false,
        odds: { home: 1.90, draw: 15.0, away: 1.90 },
        poolAmount: 2150000,
        homeLogo: 'https://ui-avatars.com/api/?name=Mavericks&background=00538C&color=B8C4CA',
        awayLogo: 'https://ui-avatars.com/api/?name=Suns&background=1D1160&color=E56020',
      },
    ];

    console.log('Seeding Sports Fixtures (European Football, UFC & Boxing, NBA Basketball)...');
    for (const item of [...europeanFootballFixtures, ...combatSportsFights, ...nbaBasketballGames]) {
      await Match.findOneAndUpdate(
        { homeTeam: item.homeTeam, awayTeam: item.awayTeam, league: item.league },
        { $set: item },
        { upsert: true, returnDocument: 'after' }
      );
    }

    // 4, 5, 6, 7: Prediction Markets (Manual Backdoor Trades)
    const predictionMarkets = [
      // 4. ENTERTAINMENT
      {
        title: 'Will Justin Bieber get 50M streams today yes or no',
        category: 'Entertainment',
        subcategory: 'Spotify & Music',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.85, totalStaked: 420000 },
          { id: 'no', label: 'No', odds: 1.95, totalStaked: 380000 },
        ],
        rules: 'Resolves to YES if Justin Bieber surpasses 50,000,000 official daily streams recorded on Spotify for Artists / Spotify Charts on the settlement date. Otherwise resolves to NO.',
        resolutionSource: 'Official Spotify Charts & Artist Portal',
        poolAmount: 800000,
        volume: '₦800,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 18),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Will Justin win a Grammy this year yes or no',
        category: 'Entertainment',
        subcategory: 'Awards & Grammys',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 2.35, totalStaked: 650000 },
          { id: 'no', label: 'No', odds: 1.58, totalStaked: 890000 },
        ],
        rules: 'Resolves to YES if Justin Bieber is announced as an award winner in any category at the annual Grammy Awards ceremony. Otherwise resolves to NO.',
        resolutionSource: 'Recording Academy (grammy.com)',
        poolAmount: 1540000,
        volume: '₦1,540,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 96),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 120),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Will a certain movie pass its initial budget yes or no',
        category: 'Entertainment',
        subcategory: 'Movies & Box Office',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.68, totalStaked: 720000 },
          { id: 'no', label: 'No', odds: 2.15, totalStaked: 480000 },
        ],
        rules: 'Resolves to YES if the movie passes its officially reported initial production budget in worldwide box office ticket sales within 30 days of premiere.',
        resolutionSource: 'Box Office Mojo / Variety Box Office Tracking',
        poolAmount: 1200000,
        volume: '₦1,200,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 48),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 72),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Who will get the most streams on Spotify',
        category: 'Entertainment',
        subcategory: 'Spotify & Music',
        marketType: 'MULTIPLE_CHOICE',
        options: [
          { id: 'drake', label: 'Drake', odds: 2.30, totalStaked: 1100000 },
          { id: 'taylor_swift', label: 'Taylor Swift', odds: 1.95, totalStaked: 1450000 },
          { id: 'the_weeknd', label: 'The Weeknd', odds: 3.10, totalStaked: 650000 },
          { id: 'justin_bieber', label: 'Justin Bieber', odds: 4.20, totalStaked: 420000 },
          { id: 'bad_bunny', label: 'Bad Bunny', odds: 3.60, totalStaked: 580000 },
        ],
        rules: 'Resolves to whichever artist has the highest total official stream count on the Spotify Global Weekly Charts at the end of the current tracking week.',
        resolutionSource: 'Spotify Global Weekly Charts (charts.spotify.com)',
        poolAmount: 4200000,
        volume: '₦4,200,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 72),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 96),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },

      // 5. POLITICS
      {
        title: 'Will the US Federal Reserve cut interest rates at the next FOMC meeting?',
        category: 'Politics',
        subcategory: 'Policy & Economy',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.72, totalStaked: 1800000 },
          { id: 'no', label: 'No', odds: 2.10, totalStaked: 1300000 },
        ],
        rules: 'Resolves to YES if the Federal Reserve announces a cut of at least 25 bps to the federal funds target rate following the upcoming FOMC meeting.',
        resolutionSource: 'Federal Reserve Board Official Statement',
        poolAmount: 3100000,
        volume: '₦3,100,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 60),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 65),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Will the presidential election result be officially certified without objection?',
        category: 'Politics',
        subcategory: 'Elections',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.45, totalStaked: 1500000 },
          { id: 'no', label: 'No', odds: 2.70, totalStaked: 600000 },
        ],
        rules: 'Resolves to YES if Congress certifies the electoral vote tally without any sustained objections from both houses under the Electoral Count Reform Act.',
        resolutionSource: 'US Congressional Record / Associated Press',
        poolAmount: 2100000,
        volume: '₦2,100,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 140),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 160),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Will the UK Prime Minister survive a parliamentary vote of confidence this session?',
        category: 'Politics',
        subcategory: 'World Leaders',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.50, totalStaked: 0 },
          { id: 'no', label: 'No', odds: 2.55, totalStaked: 0 },
        ],
        rules: 'Resolves to YES if the sitting Prime Minister wins the majority in any formal confidence motion tabled in the House of Commons this session.',
        resolutionSource: 'UK Parliament Hansard Records',
        poolAmount: 0,
        volume: '₦0',
        status: 'DRAFT', // Manual trade set behind backdoor, ready to be published!
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 180),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 200),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },

      // 6. REAL LIFE EVENTS
      {
        title: 'Will SpaceX Starship successfully complete full orbital catch & recovery test in Q4?',
        category: 'Real Life Events',
        subcategory: 'Space & Tech',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.88, totalStaked: 850000 },
          { id: 'no', label: 'No', odds: 1.92, totalStaked: 820000 },
        ],
        rules: 'Resolves to YES if SpaceX successfully soft-lands or catches the Starship upper stage or Super Heavy booster during an orbital flight test mission.',
        resolutionSource: 'SpaceX Official Mission Broadcast & FAA License Data',
        poolAmount: 1670000,
        volume: '₦1,670,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 110),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 120),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Will OpenAI announce AGI or launch GPT-5 before end of year?',
        category: 'Real Life Events',
        subcategory: 'AI & Computing',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 2.75, totalStaked: 950000 },
          { id: 'no', label: 'No', odds: 1.42, totalStaked: 1600000 },
        ],
        rules: 'Resolves to YES if OpenAI officially announces or launches a foundation model explicitly called GPT-5 or formally declares achieving Artificial General Intelligence.',
        resolutionSource: 'OpenAI Official Blog / Keynote',
        poolAmount: 2550000,
        volume: '₦2,550,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 150),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 180),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Will global average surface temperature hit a new all-time record high this summer?',
        category: 'Real Life Events',
        subcategory: 'Climate & Science',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.60, totalStaked: 450000 },
          { id: 'no', label: 'No', odds: 2.30, totalStaked: 280000 },
        ],
        rules: 'Resolves to YES if Copernicus Climate Change Service (C3S) or NOAA confirms a new all-time monthly global surface temperature record.',
        resolutionSource: 'Copernicus Climate Change Service (ERA5)',
        poolAmount: 730000,
        volume: '₦730,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 80),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 90),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },

      // 7. POP CULTURE
      {
        title: 'Will GTA VI break the worldwide gaming revenue record ($1B in 24 hours) upon release?',
        category: 'Pop Culture',
        subcategory: 'Gaming & Media',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.35, totalStaked: 3200000 },
          { id: 'no', label: 'No', odds: 3.20, totalStaked: 950000 },
        ],
        rules: 'Resolves to YES if Take-Two Interactive or Guinness World Records verifies that Grand Theft Auto VI generates $1 Billion or more in revenue in its first 24 hours of retail release.',
        resolutionSource: 'Take-Two Interactive SEC Filing / Official Press Release',
        poolAmount: 4150000,
        volume: '₦4,150,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 160),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 190),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Will MrBeast reach 400M YouTube subscribers before December?',
        category: 'Pop Culture',
        subcategory: 'Social Media & Creators',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.82, totalStaked: 680000 },
          { id: 'no', label: 'No', odds: 1.98, totalStaked: 620000 },
        ],
        rules: 'Resolves to YES if the main @MrBeast YouTube channel publicly reaches or exceeds 400,000,000 subscribers before 23:59 UTC on November 30.',
        resolutionSource: 'Official YouTube Channel Subscriber Count / SocialBlade',
        poolAmount: 1300000,
        volume: '₦1,300,000',
        status: 'ACTIVE',
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 70),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 85),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
      {
        title: 'Will the Met Gala theme spark a viral #1 worldwide trending hashtag on X/Twitter?',
        category: 'Pop Culture',
        subcategory: 'Viral Trends & Fashion',
        marketType: 'YES_NO',
        options: [
          { id: 'yes', label: 'Yes', odds: 1.55, totalStaked: 0 },
          { id: 'no', label: 'No', odds: 2.40, totalStaked: 0 },
        ],
        rules: 'Resolves to YES if the official Met Gala hashtag reaches the #1 worldwide trend spot on X during the evening of the event.',
        resolutionSource: 'Trends24 / X Worldwide Trends',
        poolAmount: 0,
        volume: '₦0',
        status: 'DRAFT', // Manual trade set behind backdoor
        closingDate: new Date(Date.now() + 1000 * 60 * 60 * 200),
        resolutionDate: new Date(Date.now() + 1000 * 60 * 60 * 210),
        isBackdoorManual: true,
        creator: adminUser?._id,
      },
    ];

    console.log('Seeding Prediction Markets & Backdoor Trades (Entertainment, Politics, Real Life Events, Pop Culture)...');
    for (const item of predictionMarkets) {
      await Market.findOneAndUpdate(
        { title: item.title },
        { $set: { ...item, pair: item.title } },
        { upsert: true, returnDocument: 'after' }
      );
    }

    console.log('Successfully seeded all 7 categories: European Football, UFC & Boxing, NBA Basketball, Entertainment, Politics, Real Life Events, Pop Culture!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
