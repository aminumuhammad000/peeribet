import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SystemSetting from '../models/SystemSetting';

dotenv.config();

const BASE_URL = 'https://v3.football.api-sports.io';
const HIGHLIGHTLY_BASE_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_ALL_SPORTS_BASE_URL = 'https://sports.highlightly.net';

export const HIGHLIGHTLY_SPORTS = [
  'football',
  'basketball',
  'nba',
  'cricket',
  'rugby',
  'american-football',
  'baseball',
  'nhl',
  'hockey',
  'volleyball',
  'handball',
] as const;

export type HighlightlySport = typeof HIGHLIGHTLY_SPORTS[number];

export const isHighlightlyKey = (key: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test((key || '').trim());
};

export const getFootballApiKey = async (): Promise<string> => {
  try {
    if (mongoose.connection.readyState === 1) {
      const settings = await SystemSetting.findOne();
      if (settings?.footballApiKey && settings.footballApiKey.trim()) {
        return settings.footballApiKey.trim();
      }
    }
  } catch (err) {
    console.error('Error reading footballApiKey from settings:', err);
  }
  return (
    process.env.FOOTBALL_API_KEY?.trim() ||
    process.env.API_FOOTBALL_KEY?.trim() ||
    process.env.APISPORTS_KEY?.trim() ||
    ''
  );
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use(async (config) => {
  const apiKey = (await getFootballApiKey()).trim().replace(/^["']|["']$/g, '');

  if (isHighlightlyKey(apiKey)) {
    // Highlightly Football API (UUID format key, e.g. becfcb74-de37-46b5-a9b5-5474df602229)
    config.baseURL = HIGHLIGHTLY_BASE_URL;
    config.headers['x-rapidapi-key'] = apiKey;
    delete config.headers['x-rapidapi-host'];
    delete config.headers['x-apisports-key'];
  } else if (apiKey.length > 35) {
    // RapidAPI format key (typically 50 chars)
    config.baseURL = 'https://api-football-v1.p.rapidapi.com/v3';
    config.headers['x-rapidapi-key'] = apiKey;
    config.headers['x-rapidapi-host'] = 'api-football-v1.p.rapidapi.com';
    delete config.headers['x-apisports-key'];
  } else {
    // Direct API-Sports format key (32 hex characters)
    config.baseURL = BASE_URL;
    config.headers['x-apisports-key'] = apiKey;
    delete config.headers['x-rapidapi-key'];
    delete config.headers['x-rapidapi-host'];
  }
  return config;
});

// Helper to normalize Highlightly match object to unified fixture format
const normalizeHighlightlyMatch = (m: any, timezone?: string, defaultSport = 'Football') => {
  let scoreHome = 0;
  let scoreAway = 0;
  if (m.state?.score?.current) {
    const parts = String(m.state.score.current).split('-').map((s: string) => parseInt(s.trim(), 10));
    if (!isNaN(parts[0])) scoreHome = parts[0];
    if (!isNaN(parts[1])) scoreAway = parts[1];
  }

  const stateDesc = (m.state?.description || '').toLowerCase();
  let shortStatus = 'NS';
  if (stateDesc.includes('first half') || stateDesc.includes('1st half') || stateDesc.includes('quarter 1') || stateDesc.includes('q1')) shortStatus = '1H';
  else if (stateDesc.includes('half time') || stateDesc.includes('halftime')) shortStatus = 'HT';
  else if (stateDesc.includes('second half') || stateDesc.includes('2nd half') || stateDesc.includes('q3') || stateDesc.includes('q4')) shortStatus = '2H';
  else if (stateDesc.includes('extra') || stateDesc.includes('overtime')) shortStatus = 'ET';
  else if (stateDesc.includes('penalt')) shortStatus = 'P';
  else if (stateDesc.includes('finish') || stateDesc.includes('ended')) shortStatus = 'FT';
  else if (stateDesc.includes('suspend')) shortStatus = 'SUSP';
  else if (stateDesc.includes('postpon')) shortStatus = 'PST';
  else if (stateDesc.includes('cancel')) shortStatus = 'CANC';

  return {
    sport: defaultSport,
    fixture: {
      id: m.id,
      date: m.date,
      timestamp: Math.floor(new Date(m.date).getTime() / 1000),
      timezone: timezone || 'Africa/Lagos',
      status: {
        short: shortStatus,
        long: m.state?.description || 'Not started',
        elapsed: m.state?.clock ? parseInt(m.state.clock, 10) : null,
      },
    },
    league: {
      id: m.league?.id,
      name: typeof m.league === 'string' ? m.league : (m.league?.name || 'League'),
      country: m.country?.name,
      logo: m.league?.logo,
      flag: m.country?.logo,
      season: m.league?.season || m.season,
    },
    teams: {
      home: {
        id: m.homeTeam?.id,
        name: m.homeTeam?.displayName || m.homeTeam?.name || 'Home Team',
        logo: m.homeTeam?.logo,
      },
      away: {
        id: m.awayTeam?.id,
        name: m.awayTeam?.displayName || m.awayTeam?.name || 'Away Team',
        logo: m.awayTeam?.logo,
      },
    },
    goals: {
      home: scoreHome,
      away: scoreAway,
    },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: scoreHome, away: scoreAway },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
    highlightly: m,
  };
};

export const footballApiService = {
  // Get fixtures for a specific date
  getFixturesByDate: async (date: string, timezone?: string) => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        // Highlightly endpoint: /matches?date=YYYY-MM-DD
        const params: any = { date, limit: 100 };
        if (timezone) params.timezone = timezone;
        const response = await apiClient.get('/matches', { params });
        const list = response.data?.data || [];
        return list.map((item: any) => normalizeHighlightlyMatch(item, timezone, 'Football'));
      }

      // API-Sports / RapidAPI Football Hub
      const params: any = { date };
      if (timezone) params.timezone = timezone;
      
      const response = await apiClient.get('/fixtures', { params });
      
      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        console.error('Fixture Sync API Error:', response.data.errors);
        return [];
      }
      
      return response.data.response || [];
    } catch (error: any) {
      console.error('Error fetching fixtures:', error.response?.data || error.message);
      return [];
    }
  },

  // Get a single fixture by id
  getFixtureById: async (fixtureId: number) => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        const response = await apiClient.get(`/matches/${fixtureId}`);
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        return data ? normalizeHighlightlyMatch(data) : null;
      }

      const response = await apiClient.get(`/fixtures?id=${fixtureId}`);
      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        return null;
      }
      return response.data.response?.[0] || null;
    } catch (error: any) {
      console.error('Error fetching fixture by id:', error.response?.data || error.message);
      return null;
    }
  },

  // Highlightly All Sports API: Get matches by any supported sport
  getMatchesBySport: async (sport: HighlightlySport, date: string, options?: { limit?: number; timezone?: string }) => {
    try {
      const apiKey = await getFootballApiKey();
      const params: any = { date, limit: options?.limit || 100 };
      if (options?.timezone) params.timezone = options.timezone;

      const response = await axios.get(`${HIGHLIGHTLY_ALL_SPORTS_BASE_URL}/${sport}/matches`, {
        params,
        headers: { 'x-rapidapi-key': apiKey },
        timeout: 20000,
      });

      const list = response.data?.data || [];
      const sportName = sport.charAt(0).toUpperCase() + sport.slice(1).replace('-', ' ');
      return list.map((item: any) => normalizeHighlightlyMatch(item, options?.timezone, sportName));
    } catch (error: any) {
      console.error(`Error fetching ${sport} matches:`, error.response?.data || error.message);
      return [];
    }
  },

  // Highlightly All Sports API: Get leagues by sport
  getLeaguesBySport: async (sport: HighlightlySport, params?: { name?: string; country?: string; limit?: number }) => {
    try {
      const apiKey = await getFootballApiKey();
      const queryParams: any = { limit: params?.limit || 50 };
      if (params?.name) queryParams.leagueName = params.name;
      if (params?.country) queryParams.countryName = params.country;

      const response = await axios.get(`${HIGHLIGHTLY_ALL_SPORTS_BASE_URL}/${sport}/leagues`, {
        params: queryParams,
        headers: { 'x-rapidapi-key': apiKey },
        timeout: 20000,
      });

      return response.data?.data || [];
    } catch (error: any) {
      console.error(`Error fetching ${sport} leagues:`, error.response?.data || error.message);
      return [];
    }
  },

  // Highlightly All Sports API: Get highlights by sport
  getHighlightsBySport: async (sport: HighlightlySport, date?: string) => {
    try {
      const apiKey = await getFootballApiKey();
      const params: any = { limit: 20 };
      if (date) params.date = date;

      const response = await axios.get(`${HIGHLIGHTLY_ALL_SPORTS_BASE_URL}/${sport}/highlights`, {
        params,
        headers: { 'x-rapidapi-key': apiKey },
        timeout: 20000,
      });

      return response.data?.data || [];
    } catch (error: any) {
      console.error(`Error fetching ${sport} highlights:`, error.response?.data || error.message);
      return [];
    }
  },

  // Get live odds
  getLiveOdds: async (leagueId?: number) => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        return [];
      }

      const params: any = {};
      if (leagueId) params.league = leagueId;
      
      const response = await apiClient.get('/odds/live', { params });
      
      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        console.error('Live Odds API Error:', response.data.errors);
        return [];
      }
      
      return response.data.response || [];
    } catch (error: any) {
      console.error('Error fetching live odds:', error.response?.data || error.message);
      return [];
    }
  },

  // Get odds for a specific date
  getOddsByDate: async (date: string) => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        return [];
      }

      const response = await apiClient.get('/odds', {
        params: { date },
      });
      return response.data.response || [];
    } catch (error: any) {
      console.warn('Pre-match odds unavailable, defaulting to empty array.');
      return [];
    }
  },

  // Get status of API account
  getStatus: async () => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        const response = await apiClient.get('/leagues?limit=1');
        return {
          account: { firstname: 'Highlightly', lastname: 'Account', email: 'verified' },
          subscription: { plan: response.data?.plan?.tier || 'BASIC', active: true },
          requests: { current: 'Active', limit_day: 'Unlimited/Per Plan' },
          coveredSports: HIGHLIGHTLY_SPORTS,
        };
      }

      const response = await apiClient.get('/status');
      return response.data.response;
    } catch (error: any) {
      console.error('Error fetching API status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check status');
    }
  },

  // Get available timezones
  getTimezones: async () => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        return ['UTC', 'Africa/Lagos', 'Europe/London', 'America/New_York'];
      }
      const response = await apiClient.get('/timezone');
      return response.data.response || [];
    } catch (error) {
      return ['UTC', 'Africa/Lagos'];
    }
  },

  // Get leagues
  getLeagues: async (params?: { id?: number; name?: string; country?: string; season?: number; limit?: number; offset?: number }) => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        const queryParams: any = { limit: params?.limit || 50 };
        if (params?.offset !== undefined) queryParams.offset = params.offset;
        if (params?.name) queryParams.leagueName = params.name;
        if (params?.season) queryParams.season = params.season;
        if (params?.country) queryParams.countryName = params.country;
        const response = await apiClient.get('/leagues', { params: queryParams });
        return response.data?.data || [];
      }

      const response = await apiClient.get('/leagues', { params });
      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        console.error('API Error:', response.data.errors);
        throw new Error(response.data.errors.bug || 'API returned an error');
      }
      return response.data.response || [];
    } catch (error: any) {
      console.error('Error fetching leagues:', error.response?.data || error.message);
      return [];
    }
  },

  // Get highlights (Highlightly specific feature)
  getHighlights: async (date?: string) => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        const params: any = { limit: 20 };
        if (date) params.date = date;
        const response = await apiClient.get('/highlights', { params });
        return response.data?.data || [];
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching highlights:', error.response?.data || error.message);
      return [];
    }
  },

  // Get mapping of fixtures for odds
  getOddsMapping: async (params?: { league?: number; season?: number; fixture?: number; date?: string; page?: number }) => {
    try {
      const apiKey = await getFootballApiKey();
      if (isHighlightlyKey(apiKey)) {
        return [];
      }
      const response = await apiClient.get('/odds/mapping', { params });
      return response.data.response;
    } catch (error: any) {
      console.error('Error fetching odds mapping:', error.response?.data || error.message);
      return [];
    }
  }
};

export const sportsApiService = footballApiService;
