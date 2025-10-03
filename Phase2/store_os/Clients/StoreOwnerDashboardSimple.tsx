import React, { useState } from 'react';
import { LogOut, Package, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Simple version to test basic rendering
export default function StoreOwnerDashboardSimple(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Store Owner Dashboard</h1>
                <p className="text-gray-600">Simplified version for testing</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </header>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'inventory' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Package className="h-5 w-5 mr-2" />
                Inventory
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'analytics' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Activity className="h-5 w-5 mr-2" />
                Analytics
              </button>
            </div>
            
            <div className="space-y-4">
              {activeTab === 'inventory' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-blue-900">✓ Inventory Tab Active</h2>
                  <p className="text-blue-700">Basic inventory management would be here.</p>
                </div>
              )}
              
              {activeTab === 'analytics' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-green-900">✓ Analytics Tab Active</h2>
                  <p className="text-green-700">Analytics and reporting would be here.</p>
                </div>
              )}
              
              <div className="mt-6">
                <button 
                  onClick={() => window.location.href = '/owner-full'}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Full Dashboard (May Show Error)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}