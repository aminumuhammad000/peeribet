import { Request, Response } from 'express';
import Match from '../models/Match';
import { footballApiService } from '../services/footballApiService';

const statusMap: Record<string, 'UPCOMING' | 'LIVE' | 'FINISHED' | 'SUSPENDED'> = {
  NS: 'UPCOMING',
  '1H': 'LIVE',
  HT: 'LIVE',
  '2H': 'LIVE',
  ET: 'LIVE',
  P: 'LIVE',
  FT: 'FINISHED',
  AET: 'FINISHED',
  PEN: 'FINISHED',
  SUSP: 'SUSPENDED',
};

const parseOdds = (bookmakers: any[]) => {
  const result = { home: 1.0, draw: 1.0, away: 1.0, over25: 1.0, under25: 1.0, bttsYes: 1.0, bttsNo: 1.0 };
  if (!bookmakers || bookmakers.length === 0) return result;

  const bookmaker = bookmakers[0]; // Take the first available bookmaker
  if (!bookmaker.bets) return result;

  // Match Winner (1x2) - usually id 1
  const matchWinner = bookmaker.bets.find((b: any) => b.id === 1 || b.name === 'Match Winner');
  if (matchWinner && matchWinner.values) {
    const home = matchWinner.values.find((v: any) => v.value === 'Home' || v.value === '1');
    const draw = matchWinner.values.find((v: any) => v.value === 'Draw' || v.value === 'X');
    const away = matchWinner.values.find((v: any) => v.value === 'Away' || v.value === '2');
    
    if (home) result.home = parseFloat(home.odd);
    if (draw) result.draw = parseFloat(draw.odd);
    if (away) result.away = parseFloat(away.odd);
  }

  // Goals Over/Under (id 5)
  const goalsOU = bookmaker.bets.find((b: any) => b.id === 5 || b.name === 'Goals Over/Under');
  if (goalsOU && goalsOU.values) {
    const over25 = goalsOU.values.find((v: any) => v.value === 'Over 2.5');
    const under25 = goalsOU.values.find((v: any) => v.value === 'Under 2.5');
    
    if (over25) result.over25 = parseFloat(over25.odd);
    if (under25) result.under25 = parseFloat(under25.odd);
  }

  // Both Teams Score (id 8)
  const btts = bookmaker.bets.find((b: any) => b.id === 8 || b.name === 'Both Teams Score');
  if (btts && btts.values) {
    const yes = btts.values.find((v: any) => v.value === 'Yes');
    const no = btts.values.find((v: any) => v.value === 'No');
    
    if (yes) result.bttsYes = parseFloat(yes.odd);
    if (no) result.bttsNo = parseFloat(no.odd);
  }

  return result;
};

export const refreshMatchesFromProvider = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch fixtures and odds in parallel
    const [fixtures, oddsResponse] = await Promise.all([
      footballApiService.getFixturesByDate(today, 'Africa/Lagos').catch(() => []),
      footballApiService.getOddsByDate(today).catch(() => []),
    ]);

    // Map odds by fixture ID for quick lookup
    const oddsMap = new Map();
    if (Array.isArray(oddsResponse)) {
      oddsResponse.forEach((oddItem: any) => {
        if (oddItem.fixture && oddItem.fixture.id) {
          oddsMap.set(oddItem.fixture.id, parseOdds(oddItem.bookmakers));
        }
      });
    }

    for (const item of fixtures) {
      if (!item || !item.fixture) continue;
      const { fixture, league, teams, goals } = item;
      const fixtureStatus = statusMap[fixture?.status?.short] || 'UPCOMING';
      const now = new Date();
      const fixtureStartTime = new Date(fixture?.date || 0);
      const shouldBeLive = fixtureStartTime <= now && fixtureStatus === 'UPCOMING';
      const resolvedStatus = shouldBeLive ? 'LIVE' : fixtureStatus;

      const matchOdds = oddsMap.get(fixture.id) || parseOdds([]);

      const highProfileLeagues = [
        'premier league',
        'champions league',
        'uefa champions league',
        'la liga',
        'serie a',
        'bundesliga',
        'ligue 1',
        'world cup',
        'fa cup',
        'copa del rey',
        'major league soccer',
        'mls',
        'eredivisie',
        'primeira liga'
      ];
      const leagueLower = (league?.name || '').toLowerCase();
      const isHighProfile = highProfileLeagues.some((l) => leagueLower.includes(l));

      await Match.findOneAndUpdate(
        { fixtureId: fixture.id },
        {
          $set: {
            sport: 'Football',
            homeTeam: teams?.home?.name || 'Home Team',
            awayTeam: teams?.away?.name || 'Away Team',
            homeLogo: teams?.home?.logo || '',
            awayLogo: teams?.away?.logo || '',
            league: league?.name || 'Football League',
            startTime: new Date(fixture.date),
            status: resolvedStatus,
            scoreHome: goals?.home || 0,
            scoreAway: goals?.away || 0,
            odds: matchOdds,
            ...(isHighProfile ? { isPromoted: true } : {}),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    
    // Broadcast update to all connected clients
    const { getIO } = require('../services/socketService');
    const io = getIO();
    if (io) {
      io.emit('matches_updated');
    }
  } catch (error) {
    console.error('Failed to refresh matches from provider:', error);
  }
};

// @route  GET /api/matches
// @access Private
export const getMatches = async (req: Request, res: Response) => {
  try {
    const { status, isPromoted, sport, date, page: pageQuery, limit: limitQuery } = req.query;
    const filter: any = {};
    
    if (status) filter.status = status;
    if (isPromoted) filter.isPromoted = isPromoted === 'true';
    if (sport) {
      const normalizedSport = String(sport).trim();
      filter.$or = [
        { sport: { $regex: new RegExp(`^${normalizedSport}$`, 'i') } },
        { league: { $regex: new RegExp(normalizedSport, 'i') } },
      ];
    }
    if (date) {
      const start = new Date(String(date));
      start.setHours(0, 0, 0, 0);
      const end = new Date(String(date));
      end.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: start, $lte: end };
    }

    const page = parseInt(pageQuery as string) || 1;
    const limit = parseInt(limitQuery as string) || 50;
    const skip = (page - 1) * limit;

    let sortCriteria: any = { isPromoted: -1, status: 1, startTime: 1 };

    // When status is not explicitly passed, prioritize LIVE and UPCOMING matches
    if (!status && !date) {
      const activeFilter = {
        ...filter,
        status: { $in: ['LIVE', 'UPCOMING'] },
      };

      const activeCount = await Match.countDocuments(activeFilter);
      if (activeCount > 0) {
        filter.status = { $in: ['LIVE', 'UPCOMING'] };
        // 'LIVE' < 'UPCOMING'. Sorting status: 1 puts LIVE before UPCOMING.
        sortCriteria = { isPromoted: -1, status: 1, startTime: 1 };
      } else {
        // Trigger auto-refresh in the background if no active matches
        refreshMatchesFromProvider().catch((err) =>
          console.error('[Matches] Auto-refresh from provider failed:', err.message)
        );
        // Show most recent matches first instead of oldest
        sortCriteria = { startTime: -1 };
      }
    } else if (status === 'FINISHED') {
      sortCriteria = { startTime: -1 };
    } else if (status === 'LIVE' || status === 'UPCOMING') {
      sortCriteria = { isPromoted: -1, startTime: 1 };
    }

    const total = await Match.countDocuments(filter);
    const matches = await Match.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    res.json({
      matches,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/matches/sync
// @access Private
export const syncMatches = async (req: Request, res: Response) => {
  try {
    await refreshMatchesFromProvider();
    const count = await Match.countDocuments({ status: { $in: ['LIVE', 'UPCOMING'] } });
    res.json({ message: 'Matches synced successfully', activeMatchesCount: count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/matches/:id
// @access Private
export const getMatchById = async (req: Request, res: Response) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json(match);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin only routes would go here (createMatch, updateScore, etc.)
