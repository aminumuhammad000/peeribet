import mongoose from 'mongoose';
import Match from '../models/Match';
import Market from '../models/Market';

export const KNOWN_FIXTURE_MAP: Record<string, any> = {
  fb_1: {
    hexId: '65f100000000000000000001',
    sport: 'Football',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League Super Derby',
    status: 'LIVE',
    odds: { home: 1.85, draw: 3.10, away: 2.40 },
    poolAmount: 4850000,
  },
  '65f100000000000000000001': {
    sport: 'Football',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League Super Derby',
    status: 'LIVE',
    odds: { home: 1.85, draw: 3.10, away: 2.40 },
    poolAmount: 4850000,
  },
  fb_2: {
    hexId: '65f100000000000000000002',
    sport: 'Football',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga El Clásico',
    status: 'UPCOMING',
    odds: { home: 1.95, draw: 3.40, away: 2.30 },
    poolAmount: 7200000,
  },
  '65f100000000000000000002': {
    sport: 'Football',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga El Clásico',
    status: 'UPCOMING',
    odds: { home: 1.95, draw: 3.40, away: 2.30 },
    poolAmount: 7200000,
  },
  fb_3: {
    hexId: '65f100000000000000000003',
    sport: 'Football',
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    league: 'Premier League Title Clash',
    status: 'UPCOMING',
    odds: { home: 1.75, draw: 3.60, away: 2.70 },
    poolAmount: 6400000,
  },
  '65f100000000000000000003': {
    sport: 'Football',
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    league: 'Premier League Title Clash',
    status: 'UPCOMING',
    odds: { home: 1.75, draw: 3.60, away: 2.70 },
    poolAmount: 6400000,
  },
  box_1: {
    hexId: '65f1a0000000000000000001',
    sport: 'Boxing',
    homeTeam: 'Tyson Fury',
    awayTeam: 'Oleksandr Usyk',
    league: 'Undisputed World Heavyweight Championship',
    odds: { home: 2.15, draw: 22.0, away: 1.72 },
    poolAmount: 9400000,
  },
  '65f1a0000000000000000001': {
    sport: 'Boxing',
    homeTeam: 'Tyson Fury',
    awayTeam: 'Oleksandr Usyk',
    league: 'Undisputed World Heavyweight Championship',
    odds: { home: 2.15, draw: 22.0, away: 1.72 },
    poolAmount: 9400000,
  },
  box_2: {
    hexId: '65f1a0000000000000000002',
    sport: 'Boxing',
    homeTeam: 'Canelo Alvarez',
    awayTeam: 'Terence Crawford',
    league: 'Super Middleweight World Championship',
    odds: { home: 1.62, draw: 20.0, away: 2.30 },
    poolAmount: 4300000,
  },
  '65f1a0000000000000000002': {
    sport: 'Boxing',
    homeTeam: 'Canelo Alvarez',
    awayTeam: 'Terence Crawford',
    league: 'Super Middleweight World Championship',
    odds: { home: 1.62, draw: 20.0, away: 2.30 },
    poolAmount: 4300000,
  },
  box_3: {
    hexId: '65f1a0000000000000000003',
    sport: 'Boxing',
    homeTeam: 'Anthony Joshua',
    awayTeam: 'Daniel Dubois',
    league: 'IBF Heavyweight World Title',
    odds: { home: 1.70, draw: 24.0, away: 2.10 },
    poolAmount: 5600000,
  },
  '65f1a0000000000000000003': {
    sport: 'Boxing',
    homeTeam: 'Anthony Joshua',
    awayTeam: 'Daniel Dubois',
    league: 'IBF Heavyweight World Title',
    odds: { home: 1.70, draw: 24.0, away: 2.10 },
    poolAmount: 5600000,
  },
  ufc_1: {
    hexId: '65f1b0000000000000000001',
    sport: 'UFC',
    homeTeam: 'Islam Makhachev',
    awayTeam: 'Arman Tsarukyan',
    league: 'UFC 311: Lightweight Championship',
    odds: { home: 1.40, draw: 35.0, away: 2.95 },
    poolAmount: 4650000,
  },
  '65f1b0000000000000000001': {
    sport: 'UFC',
    homeTeam: 'Islam Makhachev',
    awayTeam: 'Arman Tsarukyan',
    league: 'UFC 311: Lightweight Championship',
    odds: { home: 1.40, draw: 35.0, away: 2.95 },
    poolAmount: 4650000,
  },
  ufc_2: {
    hexId: '65f1b0000000000000000002',
    sport: 'UFC',
    homeTeam: 'Jon Jones',
    awayTeam: 'Tom Aspinall',
    league: 'UFC Heavyweight Unification Title',
    odds: { home: 1.78, draw: 30.0, away: 2.05 },
    poolAmount: 5120000,
  },
  '65f1b0000000000000000002': {
    sport: 'UFC',
    homeTeam: 'Jon Jones',
    awayTeam: 'Tom Aspinall',
    league: 'UFC Heavyweight Unification Title',
    odds: { home: 1.78, draw: 30.0, away: 2.05 },
    poolAmount: 5120000,
  },
  ufc_3: {
    hexId: '65f1b0000000000000000003',
    sport: 'UFC',
    homeTeam: 'Alex Pereira',
    awayTeam: 'Magomed Ankalaev',
    league: 'UFC Light Heavyweight Championship',
    odds: { home: 1.85, draw: 28.0, away: 1.95 },
    poolAmount: 3200000,
  },
  '65f1b0000000000000000003': {
    sport: 'UFC',
    homeTeam: 'Alex Pereira',
    awayTeam: 'Magomed Ankalaev',
    league: 'UFC Light Heavyweight Championship',
    odds: { home: 1.85, draw: 28.0, away: 1.95 },
    poolAmount: 3200000,
  },
  bb_1: {
    hexId: '65f1c0000000000000000001',
    sport: 'Basketball',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    league: 'NBA Regular Season Matchup',
    status: 'LIVE',
    odds: { home: 1.55, draw: 15.0, away: 2.45 },
    poolAmount: 3820000,
  },
  '65f1c0000000000000000001': {
    sport: 'Basketball',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    league: 'NBA Regular Season Matchup',
    status: 'LIVE',
    odds: { home: 1.55, draw: 15.0, away: 2.45 },
    poolAmount: 3820000,
  },
  bb_2: {
    hexId: '65f1c0000000000000000002',
    sport: 'Basketball',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Denver Nuggets',
    league: 'NBA Western Conference Clash',
    odds: { home: 2.10, draw: 14.0, away: 1.75 },
    poolAmount: 3450000,
  },
  '65f1c0000000000000000002': {
    sport: 'Basketball',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Denver Nuggets',
    league: 'NBA Western Conference Clash',
    odds: { home: 2.10, draw: 14.0, away: 1.75 },
    poolAmount: 3450000,
  },
};

export const KNOWN_MARKET_MAP: Record<string, any> = {
  pol_1: {
    hexId: '65f1d0000000000000000001',
    title: 'Central Bank to cut benchmark interest rate in Q4?',
    category: 'Politics',
    subcategory: 'Policy & Economy',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 3450000,
  },
  '65f1d0000000000000000001': {
    title: 'Central Bank to cut benchmark interest rate in Q4?',
    category: 'Politics',
    subcategory: 'Policy & Economy',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 3450000,
  },
  pol_2: {
    hexId: '65f1d0000000000000000002',
    title: 'US Federal Reserve to lower rates at upcoming FOMC meeting?',
    category: 'Politics',
    subcategory: 'Global Affairs',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 5120000,
  },
  '65f1d0000000000000000002': {
    title: 'US Federal Reserve to lower rates at upcoming FOMC meeting?',
    category: 'Politics',
    subcategory: 'Global Affairs',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 5120000,
  },
  pol_3: {
    hexId: '65f1d0000000000000000003',
    title: 'Nigeria Inflation Rate to drop below 28% in official NBS report?',
    category: 'Politics',
    subcategory: 'Policy & Economy',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2180000,
  },
  '65f1d0000000000000000003': {
    title: 'Nigeria Inflation Rate to drop below 28% in official NBS report?',
    category: 'Politics',
    subcategory: 'Policy & Economy',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2180000,
  },
  ent_1: {
    hexId: '65f1e0000000000000000001',
    title: 'Grammy Awards: Album of the Year Winner 2026',
    category: 'Entertainment',
    subcategory: 'Awards & Grammys',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2850000,
  },
  '65f1e0000000000000000001': {
    title: 'Grammy Awards: Album of the Year Winner 2026',
    category: 'Entertainment',
    subcategory: 'Awards & Grammys',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2850000,
  },
  ev_1: {
    hexId: '65f1f0000000000000000001',
    title: 'SpaceX Starship to successfully complete next orbital test flight?',
    category: 'Live Events',
    subcategory: 'Space & Science',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 4320000,
  },
  '65f1f0000000000000000001': {
    title: 'SpaceX Starship to successfully complete next orbital test flight?',
    category: 'Live Events',
    subcategory: 'Space & Science',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 4320000,
  },
};

export async function resolveTargetMatchOrMarket(targetId: string): Promise<{ match: any; predictionMarket: any }> {
  if (!targetId || typeof targetId !== 'string') {
    return { match: null, predictionMarket: null };
  }

  const cleanId = targetId.trim();

  // 1. Try finding by valid ObjectId
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    const match = await Match.findById(cleanId);
    if (match) return { match, predictionMarket: null };

    const predictionMarket = await Market.findById(cleanId);
    if (predictionMarket) return { match: null, predictionMarket };
  }

  // 2. Check if Match or Market has custom slug / custom id field
  let match = await Match.findOne({ $or: [{ id: cleanId }, { slug: cleanId }] });
  if (match) return { match, predictionMarket: null };

  let predictionMarket = await Market.findOne({ $or: [{ id: cleanId }, { slug: cleanId }] });
  if (predictionMarket) return { match: null, predictionMarket };

  // 3. Check known fixture map (handles box_1, ufc_1, etc.)
  if (KNOWN_FIXTURE_MAP[cleanId]) {
    const fix = KNOWN_FIXTURE_MAP[cleanId];
    match = await Match.findOne({ homeTeam: fix.homeTeam, awayTeam: fix.awayTeam });
    if (!match) {
      try {
        const doc: any = {
          sport: fix.sport,
          homeTeam: fix.homeTeam,
          awayTeam: fix.awayTeam,
          league: fix.league,
          status: fix.status || 'UPCOMING',
          startTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
          poolAmount: fix.poolAmount || 2000000,
          odds: fix.odds || { home: 2.0, draw: 3.0, away: 2.0 },
          isPromoted: true,
        };
        if (fix.hexId && mongoose.Types.ObjectId.isValid(fix.hexId)) {
          doc._id = new mongoose.Types.ObjectId(fix.hexId);
        }
        match = await Match.create(doc);
      } catch (err) {
        match = await Match.findOne({ homeTeam: fix.homeTeam, awayTeam: fix.awayTeam });
      }
    }
    if (match) return { match, predictionMarket: null };
  }

  // 4. Check known market map (handles pol_1, ent_1, ev_1, etc.)
  if (KNOWN_MARKET_MAP[cleanId]) {
    const mkt = KNOWN_MARKET_MAP[cleanId];
    predictionMarket = await Market.findOne({ title: mkt.title });
    if (!predictionMarket) {
      try {
        const mdoc: any = {
          title: mkt.title,
          category: mkt.category,
          subcategory: mkt.subcategory,
          marketType: mkt.marketType || 'YES_NO',
          status: mkt.status || 'ACTIVE',
          poolAmount: mkt.poolAmount || 2000000,
          closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        };
        if (mkt.hexId && mongoose.Types.ObjectId.isValid(mkt.hexId)) {
          mdoc._id = new mongoose.Types.ObjectId(mkt.hexId);
        }
        predictionMarket = await Market.create(mdoc);
      } catch (merr) {
        predictionMarket = await Market.findOne({ title: mkt.title });
      }
    }
    if (predictionMarket) return { match: null, predictionMarket };
  }

  return { match: null, predictionMarket: null };
}
