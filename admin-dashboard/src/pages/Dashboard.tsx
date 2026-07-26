import { useEffect, useState } from 'react';
import { Users, Activity, DollarSign, Wallet, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const triggerSettlement = async () => {
    try {
      setSettling(true);
      const { data } = await api.post('/admin/settlement/trigger');
      alert(`Settlement Triggered!\nSettled: ${data.result.settled} bets\nMatches: ${data.result.matches}`);
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to trigger settlement');
    } finally {
      setSettling(false);
    }
  };

  if (loading) return <div className="p-8">Loading stats...</div>;

  const statCards = [
    { name: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-blue-500' },
    { name: 'Active Trades', value: stats?.activeTrades || 0, icon: Activity, color: 'text-green-500' },
    { name: 'Total Volume', value: `₦${(stats?.volume || 0).toLocaleString()}`, icon: DollarSign, color: 'text-purple-500' },
    { name: 'In Escrow', value: `₦${(stats?.inEscrow || 0).toLocaleString()}`, icon: Wallet, color: 'text-yellow-500' },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Overview</h1>
        
        <button
          onClick={triggerSettlement}
          disabled={settling}
          className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${settling ? 'animate-spin' : ''}`} />
          Force Settlement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">{stat.name}</h3>
                <div className={`p-2 bg-gray-900 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
