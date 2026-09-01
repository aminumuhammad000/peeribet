import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      const role = data.role || data.user?.role;
      if (role !== 'admin') {
        alert('Access denied: You are not an administrator.');
        return;
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-sm border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 p-2 flex items-center justify-center mb-3 shadow-lg">
            <img src="/favicon.svg" alt="Peeritrade Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Admin Login</h2>
          <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Peeritrade Admin Portal</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider">Username / Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@peeritrade.com"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 placeholder-opacity-50 focus:outline-none focus:border-green-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider">Access Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 placeholder-opacity-50 focus:outline-none focus:border-green-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
          >
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
