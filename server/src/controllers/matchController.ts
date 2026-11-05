import { Request, Response } from 'express';
import Match from '../models/Match';
import { footballApiService, sportsApiService } from '../services/footballApiService';
import { resolveTargetMatchOrMarket } from '../utils/fixtureResolver';

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

const generateDefaultOdds = (homeSeed = 1.9, awaySeed = 2.4) => {
  const home = parseFloat((homeSeed + (Math.random() * 0.4 - 0.2)).toFixed(2));
  const away = parseFloat((awaySeed + (Math.random() * 0.4 - 0.2)).toFixed(2));
  const draw = parseFloat((3.10 + (Math.random() * 0.4 - 0.2)).toFixed(2));
  return {
    home: Math.max(1.3, home),
    draw: Math.max(2.6, draw),
    away: Math.max(1.4, away),
    over25: 1.85,
    under25: 1.95,
    bttsYes: 1.80,
    bttsNo: 2.00,
  };
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

export const refreshMatchesFromProvider = async (targetDate?: string) => {
  try {
    // 1. Clean up stale past matches: any matches starting > 4 hours ago still marked LIVE or UPCOMING
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    await Match.updateMany(
      { status: { $in: ['LIVE', 'UPCOMING'] }, startTime: { $lt: fourHoursAgo } },
      { $set: { status: 'FINISHED' } }
    ).catch(() => {});

    // 2. Mark demo fixtures without fixtureId as FINISHED so real matches take precedence
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Match.updateMany(
      { fixtureId: null as any, startTime: { $lt: oneDayAgo } },
      { $set: { status: 'FINISHED' } }
    ).catch(() => {});

    // 3. Determine target dates: if targetDate specified, use that, else sync next 4 days
    const datesToSync: string[] = targetDate 
      ? [targetDate] 
      : [0, 1, 2, 3].map((offset) => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          return d.toISOString().split('T')[0];
        });

    for (const syncDate of datesToSync) {
      // Fetch football fixtures and odds
      const [fixtures, oddsResponse] = await Promise.all([
        footballApiService.getFixturesByDate(syncDate, 'Africa/Lagos').catch(() => []),
        footballApiService.getOddsByDate(syncDate).catch(() => []),
      ]);

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

        if (resolvedStatus === 'FINISHED') continue;

        let matchOdds = oddsMap.get(fixture.id);
        if (!matchOdds || matchOdds.home <= 1) {
          matchOdds = generateDefaultOdds();
        }

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
          'primeira liga',
          'copa libertadores',
          'copa sudamericana'
        ];
        const leagueLower = (league?.name || '').toLowerCase();
        const isHighProfile = highProfileLeagues.some((l) => leagueLower.includes(l));

        const existing = await Match.findOne({ fixtureId: fixture.id });
        const poolAmount = existing?.poolAmount && existing.poolAmount > 0
          ? existing.poolAmount
          : 1500000 + Math.floor(Math.random() * 3500000);

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
              startTime: fixtureStartTime,
              status: resolvedStatus,
              scoreHome: goals?.home || 0,
              scoreAway: goals?.away || 0,
              odds: matchOdds,
              poolAmount,
              ...(isHighProfile ? { isPromoted: true } : {}),
            },
          },
          { upsert: true, returnDocument: 'after' }
        );
      }

      // Also sync Basketball matches from Highlightly All Sports API
      try {
        const basketballMatches = await sportsApiService.getMatchesBySport('basketball', syncDate, { limit: 25 });
        for (const bMatch of basketballMatches) {
          if (!bMatch || !bMatch.fixture) continue;
          const { fixture, league, teams } = bMatch;
          const fixtureStartTime = new Date(fixture.date);
          if (fixtureStartTime.getTime() < Date.now() - 3 * 60 * 60 * 1000) continue;
          const resolvedStatus = fixtureStartTime <= new Date() ? 'LIVE' : 'UPCOMING';

          const existingB = await Match.findOne({ fixtureId: fixture.id });
          const bPool = existingB?.poolAmount && existingB.poolAmount > 0
            ? existingB.poolAmount
            : 2000000 + Math.floor(Math.random() * 2500000);

          await Match.findOneAndUpdate(
            { fixtureId: fixture.id },
            {
              $set: {
                sport: 'Basketball',
                homeTeam: teams?.home?.name || 'Home Team',
                awayTeam: teams?.away?.name || 'Away Team',
                homeLogo: teams?.home?.logo || '',
                awayLogo: teams?.away?.logo || '',
                league: league?.name || 'Basketball League',
                startTime: fixtureStartTime,
                status: resolvedStatus,
                scoreHome: bMatch.goals?.home || 0,
                scoreAway: bMatch.goals?.away || 0,
                odds: generateDefaultOdds(1.75, 2.05),
                poolAmount: bPool,
                isPromoted: true,
              },
            },
            { upsert: true, returnDocument: 'after' }
          );
        }
      } catch (bErr: any) {
        // Silently continue if basketball rate-limited
      }
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
      const normalizedSport = String(sport).trim().toLowerCase();
      if (normalizedSport.includes('football') || normalizedSport.includes('soccer')) {
        filter.$and = [
          {
            $or: [
              { sport: { $regex: /football|soccer/i } },
              { league: { $regex: /premier league|champions league|la liga|serie a|bundesliga|ligue 1|europa|eredivisie|primeira/i } },
            ],
          },
          { sport: { $not: /boxing|ufc|mma|combat|basketball|nba/i } },
          { league: { $not: /boxing|ufc|mma|nba|wba|wbc/i } },
          { homeTeam: { $not: /fury|usyk|canelo|crawford|joshua|makhachev|jones|aspinall|celtics|lakers|warriors/i } },
        ];
      } else if (normalizedSport.includes('box')) {
        filter.$and = [
          {
            $or: [
              { sport: { $regex: /^boxing$/i } },
              { league: { $regex: /boxing|wba|wbc|ibf|wbo|heavyweight|championship/i } },
              { homeTeam: { $regex: /fury|usyk|canelo|crawford|joshua|wilder|haney|davis/i } },
              { awayTeam: { $regex: /fury|usyk|canelo|crawford|joshua|wilder|haney|davis/i } },
            ],
          },
          { league: { $not: /ufc|mma|bellator|pfl|octag/i } },
          { homeTeam: { $not: /makhachev|tsarukyan|jones|aspinall|pereira|ankalaev/i } },
          { awayTeam: { $not: /makhachev|tsarukyan|jones|aspinall|pereira|ankalaev/i } },
        ];
      } else if (normalizedSport.includes('ufc') || normalizedSport.includes('mma')) {
        filter.$and = [
          {
            $or: [
              { sport: { $regex: /^ufc$|^mma$/i } },
              { league: { $regex: /ufc|mma|bellator|pfl|lightweight|unification/i } },
              { homeTeam: { $regex: /makhachev|tsarukyan|jones|aspinall|pereira|ankalaev|adesanya/i } },
              { awayTeam: { $regex: /makhachev|tsarukyan|jones|aspinall|pereira|ankalaev|adesanya/i } },
            ],
          },
          { homeTeam: { $not: /fury|usyk|canelo|crawford|joshua|wilder|haney|davis/i } },
          { awayTeam: { $not: /fury|usyk|canelo|crawford|joshua|wilder|haney|davis/i } },
        ];
      } else if (normalizedSport.includes('basket') || normalizedSport.includes('nba')) {
        filter.$or = [
          { sport: { $regex: /basketball|nba/i } },
          { league: { $regex: /nba|euroleague|wnba/i } },
          { homeTeam: { $regex: /celtics|lakers|warriors|nuggets|mavericks/i } },
          { awayTeam: { $regex: /celtics|lakers|warriors|nuggets|mavericks/i } },
        ];
      } else {
        filter.$or = [
          { sport: { $regex: new RegExp(`^${String(sport).trim()}$`, 'i') } },
          { league: { $regex: new RegExp(String(sport).trim(), 'i') } },
        ];
      }
    }
    if (date) {
      const start = new Date(String(date));
      start.setHours(0, 0, 0, 0);
      const end = new Date(String(date));
      end.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: start, $lte: end };

      // Auto-refresh fixtures for this date if none exist in DB
      Match.countDocuments(filter).then((c) => {
        if (c === 0) {
          refreshMatchesFromProvider(String(date)).catch((err) =>
            console.warn(`[Matches] Auto-refresh for date ${date} failed:`, err.message)
          );
        }
      });
    }

    const page = parseInt(pageQuery as string) || 1;
    const limit = parseInt(limitQuery as string) || 50;
    const skip = (page - 1) * limit;

    let sortCriteria: any = { isPromoted: -1, status: 1, startTime: 1 };

    // When status is not explicitly passed, prioritize LIVE and UPCOMING matches
    if (!status && !date) {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      
      const activeFilter = {
        ...filter,
        $or: [
          { status: 'LIVE' },
          { status: 'UPCOMING', startTime: { $gte: threeHoursAgo } }
        ]
      };

      const activeCount = await Match.countDocuments(activeFilter);
      if (activeCount > 0) {
        filter.$or = activeFilter.$or;
        sortCriteria = { isPromoted: -1, status: 1, startTime: 1 };
      } else {
        // Trigger auto-refresh in the background if no active matches
        refreshMatchesFromProvider().catch((err) =>
          console.error('[Matches] Auto-refresh from provider failed:', err.message)
        );
        sortCriteria = { startTime: -1 };
      }
    } else if (status === 'FINISHED') {
      sortCriteria = { startTime: -1 };
    } else if (status === 'LIVE' || status === 'UPCOMING') {
      sortCriteria = { isPromoted: -1, status: 1, startTime: 1 };
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
    const id = String(req.params.id || '');
    const { match } = await resolveTargetMatchOrMarket(id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json(match);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin only routes would go here (createMatch, updateScore, etc.)
