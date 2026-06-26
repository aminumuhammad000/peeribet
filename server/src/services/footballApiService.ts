import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.FOOTBALL_API_KEY || 'XxXxXxXxXxXxXxXxXxXxXxXx';
const BASE_URL = 'https://v3.football.api-sports.io';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-apisports-key': API_KEY,
  },
});

export const footballApiService = {
  // Get fixtures for a specific date
  getFixturesByDate: async (date: string, timezone?: string) => {
    try {
      const params: any = { date };
      if (timezone) params.timezone = timezone;
      
      const response = await apiClient.get('/fixtures', { params });
      
      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        console.error('Fixture Sync API Error:', response.data.errors);
        return []; // Return empty instead of crashing sync
      }
      
      return response.data.response;
    } catch (error: any) {
      console.error('Error fetching fixtures:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch fixtures');
    }
  },

  // Get live odds
  getLiveOdds: async (leagueId?: number) => {
    try {
      const params: any = {};
      if (leagueId) params.league = leagueId;
      
      const response = await apiClient.get('/odds/live', { params });
      
      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        console.error('Live Odds API Error:', response.data.errors);
        return [];
      }
      
      return response.data.response;
    } catch (error: any) {
      console.error('Error fetching live odds:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch live odds');
    }
  },

  // Get odds for a specific date
  getOddsByDate: async (date: string) => {
    try {
      const response = await apiClient.get('/odds', {
        params: { date },
      });
      return response.data.response;
    } catch (error: any) {
      console.error('Error fetching odds:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch odds');
    }
  },

  // Get status of API account
  getStatus: async () => {
    try {
      const response = await apiClient.get('/status');
      return response.data.response;
    } catch (error: any) {
      console.error('Error fetching API status:', error);
      throw new Error(error.response?.data?.message || 'Failed to check status');
    }
  },

  // Get available timezones
  getTimezones: async () => {
    try {
      const response = await apiClient.get('/timezone');
      return response.data.response;
    } catch (error) {
      console.error('Error fetching timezones:', error);
      throw error;
    }
  },

  // Get leagues
  getLeagues: async (params?: { id?: number; name?: string; country?: string; season?: number }) => {
    try {
      const response = await apiClient.get('/leagues', { params });
      
      // Handle API-side errors (sometimes returned in the object instead of HTTP status)
      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        console.error('API Error:', response.data.errors);
        throw new Error(response.data.errors.bug || 'API returned an error');
      }
      
      return response.data.response;
    } catch (error: any) {
      console.error('Error fetching leagues:', error);
      const message = error.response?.data?.message || error.message || 'Something went wrong while fetching details. Try again later.';
      throw new Error(message);
    }
  },

  // Get mapping of fixtures for odds
  getOddsMapping: async (params?: { league?: number; season?: number; fixture?: number; date?: string; page?: number }) => {
    try {
      const response = await apiClient.get('/odds/mapping', { params });
      return response.data.response;
    } catch (error: any) {
      console.error('Error fetching odds mapping:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch odds mapping');
    }
  }
};
