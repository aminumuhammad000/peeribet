import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5000/api'; // Local Server
// const API_URL = 'https://peeribet-production.up.railway.app/api'; // Production Server

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      // AsyncStorage may not be ready yet during early app startup — skip silently if so
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Native module not yet available; request proceeds without auth header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    }
    return response.data;
  },
  verifyOtp: async (data: any) => {
    const response = await api.post('/auth/verify-otp', data);
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
    }
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (data: { firstName?: string; lastName?: string; username?: string }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
  uploadProfileImage: async (formData: FormData) => {
    const response = await api.post('/auth/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  },
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      // Native module not yet available during early startup
      return false;
    }
  },
  resendOtp: async (email: string) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
  verifyResetOtp: async (data: { email: string; otp: string }) => {
    const response = await api.post('/auth/verify-reset-otp', data);
    return response.data;
  },
  checkAvailability: async (data: { email?: string; phone?: string }) => {
    const response = await api.post('/auth/check-availability', data);
    return response.data;
  },
};

// Transaction endpoints
export const transactionService = {
  getHistory: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },
  deposit: async (data: { amount: number; reference: string }) => {
    const response = await api.post('/transactions/deposit', data);
    return response.data;
  },
  withdraw: async (data: { amount: number }) => {
    const response = await api.post('/transactions/withdraw', data);
    return response.data;
  }
};

// Wallet endpoints
export const walletService = {
  getVirtualAccount: async () => {
    const response = await api.get('/wallet/virtual-account');
    return response.data;
  },
  provisionVirtualAccount: async (bvn: string) => {
    const response = await api.post('/wallet/virtual-account', { bvn });
    return response.data;
  },
  getBanks: async () => {
    const response = await api.get('/wallet/banks');
    return response.data;
  },
  verifyBankAccount: async (bankCode: string, accountNumber: string) => {
    const response = await api.get('/wallet/banks/verify', { params: { bankCode, accountNumber } });
    return response.data;
  },
  requestWithdrawal: async (data: { amount: number; bankCode: string; accountNumber: string; accountName: string }) => {
    const response = await api.post('/wallet/withdraw', data);
    return response.data;
  },
};

export const matchService = {
  getMatches: async (params?: { status?: string; isPromoted?: boolean }) => {
    const response = await api.get('/matches', { params });
    return response.data;
  },
  getMatchById: async (id: string) => {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  },
};

export const betService = {
  placeBet: async (data: { matchId: string; selection: 'HOME' | 'DRAW' | 'AWAY'; amount: number }) => {
    const response = await api.post('/bets', data);
    return response.data;
  },
  getMyBets: async () => {
    const response = await api.get('/bets/my-bets');
    return response.data;
  },
};

export const notificationService = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default api;
