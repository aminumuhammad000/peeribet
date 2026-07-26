import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function KYC() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/kyc/pending');
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.post('/admin/kyc-verify', { userId, status });
      setUsers(users.filter(u => u._id !== userId));
      alert(`User KYC ${status.toLowerCase()} successfully`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Pending KYC Reviews</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-gray-400">Loading pending applications...</div>
        ) : users.length === 0 ? (
          <div className="col-span-full text-gray-400">No pending KYC applications.</div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
              <div className="h-48 bg-gray-900 border-b border-gray-700 relative flex items-center justify-center p-4">
                {user.kycDocument ? (
                  <img 
                    src={user.kycDocument} 
                    alt="KYC Document" 
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <span className="text-gray-500">No Document Provided</span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">{user.firstName} {user.lastName}</h3>
                <p className="text-gray-400 text-sm mb-4">{user.email} • {user.phone}</p>
                
                <div className="flex space-x-3 mt-4">
                  <button 
                    onClick={() => handleAction(user._id, 'REJECTED')}
                    className="flex-1 flex items-center justify-center py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-medium transition-colors"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(user._id, 'APPROVED')}
                    className="flex-1 flex items-center justify-center py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
