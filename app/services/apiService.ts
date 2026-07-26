import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

const getDefaultApiUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api';
  }

  return 'http://2.24.138.115/api';
};

const API_URL = (process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl()).replace(/\/$/, '');

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

    if (process.env.NODE_ENV !== 'production') {
      console.debug('API Request:', {
        method: config.method,
        url: `${config.baseURL}${config.url}`,
        params: config.params,
        data: config.data,
        headers: config.headers,
      });
    }

    return config;
  },
  (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

const isWeb = Platform.OS === 'web';

const showAlert = (title: string, message: string) => {
  if (!message) return;
  if (isWeb && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const showErrorAlert = (message: string) => {
  showAlert('Error', message);
};

const showSuccessAlert = (message: string) => {
  showAlert('Success', message);
};

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('API Response:', {
        method: response.config.method,
        url: `${response.config.baseURL}${response.config.url}`,
        status: response.status,
        data: response.data,
      });
    }

    const successMethods = ['post', 'put', 'patch', 'delete'];
    if (successMethods.includes(response.config.method || '')) {
      const message = response.data?.message || 'Action completed successfully.';
      if (message) {
        showSuccessAlert(message);
      }
    }

    return response;
  },
  (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('API Response Error:', {
        method: error.config?.method,
        url: error.config ? `${error.config.baseURL}${error.config.url}` : undefined,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    const message = getApiErrorMessage(error, 'Request failed. Please try again.');
    showErrorAlert(message);
    return Promise.reject(error);
  }
);

const apiRequest = async (request: Promise<any>) => {
  return await request;
};

export const getApiErrorMessage = (error: any, fallback = 'Something went wrong. Please try again.') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return `Unable to reach the server at ${API_URL}. Make sure the backend and MongoDB are running, or set EXPO_PUBLIC_API_URL to the correct API address.`;
  }

  return fallback;
};

// Auth endpoints
export const authService = {
  register: async (userData: any) => {
    const response = await apiRequest(api.post('/auth/register', userData));
    return response.data;
  },
  login: async (credentials: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Login Credentials:', credentials);
    }
    const response = await apiRequest(api.post('/auth/login', credentials));
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Login Response:', response.data);
    }
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    }
    return response.data;
  },
  verifyOtp: async (data: any) => {
    const response = await apiRequest(api.post('/auth/verify-otp', data));
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
    }
    return response.data;
  },
  getMe: async () => {
    const response = await apiRequest(api.get('/auth/me'));
    return response.data;
  },
  updateProfile: async (data: { firstName?: string; lastName?: string; username?: string }) => {
    const response = await apiRequest(api.put('/auth/profile', data));
    return response.data;
  },
  updatePin: async (data: { currentPin?: string; newPin: string }) => {
    const response = await apiRequest(api.put('/auth/profile/pin', data));
    return response.data;
  },
  updatePassword: async (data: { currentPassword?: string; newPassword: string }) => {
    const response = await apiRequest(api.put('/auth/profile/password', data));
    return response.data;
  },
  uploadProfileImage: async (formData: any) => {
    const response = await apiRequest(api.post('/auth/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }));
    return response.data;
  },
  uploadKycDocument: async (formData: any) => {
    const response = await apiRequest(api.post('/auth/profile/kyc', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }));
    return response.data;
  },
  getLeaderboard: async () => {
    const response = await apiRequest(api.get('/auth/leaderboard'));
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
    const response = await apiRequest(api.post('/auth/resend-otp', { email }));
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await apiRequest(api.post('/auth/forgot-password', { email }));
    return response.data;
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const response = await apiRequest(api.post('/auth/reset-password', data));
    return response.data;
  },
  verifyResetOtp: async (data: { email: string; otp: string }) => {
    const response = await apiRequest(api.post('/auth/verify-reset-otp', data));
    return response.data;
  },
  checkAvailability: async (data: { email?: string; phone?: string }) => {
    const response = await apiRequest(api.post('/auth/check-availability', data));
    return response.data;
  },
};

// Transaction endpoints
export const transactionService = {
  getHistory: async (params?: { page?: number; limit?: number }) => {
    const response = await apiRequest(api.get('/transactions', { params }));
    return response.data;
  },
  deposit: async (data: { amount: number; reference: string }) => {
    const response = await apiRequest(api.post('/transactions/deposit', data));
    return response.data;
  },
  withdraw: async (data: { amount: number }) => {
    const response = await apiRequest(api.post('/transactions/withdraw', data));
    return response.data;
  }
};

// Wallet endpoints
export const walletService = {
  getVirtualAccount: async () => {
    const response = await apiRequest(api.get('/wallet/virtual-account'));
    return response.data;
  },
  provisionVirtualAccount: async (bvn: string) => {
    const response = await apiRequest(api.post('/wallet/virtual-account', { bvn }));
    return response.data;
  },
  getBanks: async () => {
    const response = await apiRequest(api.get('/wallet/banks'));
    return response.data;
  },
  verifyBankAccount: async (bankCode: string, accountNumber: string) => {
    const response = await apiRequest(api.get('/wallet/banks/verify', { params: { bankCode, accountNumber } }));
    return response.data;
  },
  requestWithdrawal: async (data: { amount: number; bankCode: string; accountNumber: string; accountName: string }) => {
    const response = await apiRequest(api.post('/wallet/withdraw', data));
    return response.data;
  },
};

export const matchService = {
  getMatches: async (params?: { status?: string; isPromoted?: boolean; sport?: string; page?: number; limit?: number }) => {
    const response = await apiRequest(api.get('/matches', { params }));
    return response.data;
  },
  getMatchById: async (id: string) => {
    const response = await apiRequest(api.get(`/matches/${id}`));
    return response.data;
  },
};

export const betService = {
  placeBet: async (data: { matchId: string; selection: 'HOME' | 'DRAW' | 'AWAY'; amount: number }) => {
    const response = await apiRequest(api.post('/bets', data));
    return response.data;
  },
  getMyBets: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await apiRequest(api.get('/bets/my-bets', { params }));
    return response.data;
  },
};

export const notificationService = {
  getAll: async () => {
    const response = await apiRequest(api.get('/notifications'));
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await apiRequest(api.patch(`/notifications/${id}/read`));
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await apiRequest(api.patch('/notifications/read-all'));
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiRequest(api.delete(`/notifications/${id}`));
    return response.data;
  },
};

export const supportService = {
  getTickets: async () => {
    const response = await apiRequest(api.get('/support/tickets'));
    return response.data;
  },
  createTicket: async (data: { subject: string; category: string; description: string }) => {
    const response = await apiRequest(api.post('/support/tickets', data));
    return response.data;
  },
};

export default api;
