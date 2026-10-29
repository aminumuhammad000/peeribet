import axios from 'axios';
import dotenv from 'dotenv';
import SystemSetting from '../models/SystemSetting';

dotenv.config();

const getSportsDbKey = async (): Promise<string> => {
  try {
    const settings = await SystemSetting.findOne();
    if (settings?.theSportsDbApiKey && settings.theSportsDbApiKey.trim()) {
      return settings.theSportsDbApiKey.trim();
    }
  } catch (err) {}
  return process.env.THESPORTSDB_API_KEY || '3';
};

const getClient = async () => {
  const apiKey = await getSportsDbKey();
  return axios.create({
    baseURL: `https://www.thesportsdb.com/api/v1/json/${apiKey}`,
    timeout: 20000,
  });
};

export const realFootballService = {
  getNextEventsByLeagueId: async (leagueId: number) => {
    const client = await getClient();
    const response = await client.get(`/eventsnextleague.php?id=${leagueId}`);
    return response.data?.events || [];
  },

  getLeagueInfo: async (leagueId: number) => {
    const client = await getClient();
    const response = await client.get(`/lookupleague.php?id=${leagueId}`);
    return response.data?.leagues?.[0] || null;
  },

  getAllLeaguesByCountry: async (country: string) => {
    const client = await getClient();
    const response = await client.get(`/search_all_leagues.php?c=${encodeURIComponent(country)}`);
    return response.data?.countries || [];
  },
};
