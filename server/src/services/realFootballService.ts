import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

export const realFootballService = {
  getNextEventsByLeagueId: async (leagueId: number) => {
    const response = await client.get(`/eventsnextleague.php?id=${leagueId}`);
    return response.data?.events || [];
  },

  getLeagueInfo: async (leagueId: number) => {
    const response = await client.get(`/lookupleague.php?id=${leagueId}`);
    return response.data?.leagues?.[0] || null;
  },

  getAllLeaguesByCountry: async (country: string) => {
    const response = await client.get(`/search_all_leagues.php?c=${encodeURIComponent(country)}`);
    return response.data?.countries || [];
  },
};
