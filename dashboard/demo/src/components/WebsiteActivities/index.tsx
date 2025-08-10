import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Lock, 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  Mail, 
  Phone, 
  ExternalLink,
  Search,
  Filter,
  BarChart2
} from 'lucide-react';
import websiteService, { RateLock, RateAlert, WebsiteOrder, WebsiteMetrics } from '../../services/websiteService';

// Types
interface WebsiteActivitiesProps {
  onViewRateLock?: (id: string) => void;
  onViewRateAlert?: (id: string) => void;
}

/**
 * WebsiteActivities Component
 * 
 * Displays website activities such as rate locks, rate alerts, and website orders.
 * Also shows website metrics.
 */
const WebsiteActivities: React.FC<WebsiteActivitiesProps> = ({
  onViewRateLock,
  onViewRateAlert
}) => {
  const [activeTab, setActiveTab] = useState<'locks' | 'alerts' | 'orders' | 'metrics'>('locks');
  const [rateLocks, setRateLocks] = useState<RateLock[]>([]);
  const [rateAlerts, setRateAlerts] = useState<RateAlert[]>([]);
  const [websiteOrders, setWebsiteOrders] = useState<WebsiteOrder[]>([]);
  const [websiteMetrics, setWebsiteMetrics] = useState<WebsiteMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        switch (activeTab) {
          case 'locks':
            const locks = await websiteService.getRateLocks();
            setRateLocks(locks);
            break;
            
          case 'alerts':
            const alerts = await websiteService.getRateAlerts();
            setRateAlerts(alerts);
            break;
            
          case 'orders':
            const orders = await websiteService.getWebsiteOrders();
            setWebsiteOrders(orders);
            break;
            
          case 'metrics':
            const metrics = await websiteService.getWebsiteMetrics();
            setWebsiteMetrics(metrics);
            break;
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} data:`, error);
        setError(`Failed to load ${activeTab} data. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [activeTab]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate time remaining for rate locks
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expired';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMinutes}m`;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'expired':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'triggered':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  // Render rate locks tab
  const renderRateLocks = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (rateLocks.length === 0) {
      return (
        <div className="text-center p-12 text-gray-500">
          <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No rate locks found</p>
          <p className="mt-2">Rate locks from the website will appear here.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rateLocks.map(lock => (
              <tr key={lock.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lock.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lock.customerEmail}</div>
                  {lock.customerPhone && (
                    <div className="text-xs text-gray-500">{lock.customerPhone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lock.amount} {lock.fromCurrency}</div>
                  <div className="text-xs text-gray-500">to {lock.toCurrency}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lock.rate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(lock.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lock.status === 'active' ? (
                    <div className="text-sm text-gray-900">{getTimeRemaining(lock.expiresAt)}</div>
                  ) : (
                    <div className="text-sm text-gray-500">-</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lock.status)}`}>
                    {lock.status.charAt(0).toUpperCase() + lock.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onViewRateLock && onViewRateLock(lock.id)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </button>
                  {lock.status === 'active' && (
                    <>
                      <button
                        onClick={() => websiteService.completeRateLock(lock.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => websiteService.cancelRateLock(lock.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render rate alerts tab
  const renderRateAlerts = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (rateAlerts.length === 0) {
      return (
        <div className="text-center p-12 text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No rate alerts found</p>
          <p className="mt-2">Rate alerts from the website will appear here.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rateAlerts.map(alert => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{alert.customerEmail}</div>
                  {alert.customerPhone && (
                    <div className="text-xs text-gray-500">{alert.customerPhone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{alert.fromCurrency} → {alert.toCurrency}</div>
                  {alert.amount && (
                    <div className="text-xs text-gray-500">Amount: {alert.amount}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.targetRate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(alert.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                    {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onViewRateAlert && onViewRateAlert(alert.id)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </button>
                  {alert.status === 'active' && (
                    <button
                      onClick={() => websiteService.triggerRateAlert(alert.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Trigger
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render website orders tab
  const renderWebsiteOrders = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (websiteOrders.length === 0) {
      return (
        <div className="text-center p-12 text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No website orders found</p>
          <p className="mt-2">Orders from the website will appear here.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Related ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {websiteOrders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.type === 'rate_lock' ? 'bg-blue-100 text-blue-800' :
                    order.type === 'rate_alert' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.type === 'rate_lock' ? 'Rate Lock' :
                     order.type === 'rate_alert' ? 'Rate Alert' :
                     'Direct Exchange'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.customerEmail}</div>
                  {order.customerPhone && (
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.rateLockId || order.rateAlertId || order.transactionId || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => {
                      if (order.type === 'rate_lock' && order.rateLockId && onViewRateLock) {
                        onViewRateLock(order.rateLockId);
                      } else if (order.type === 'rate_alert' && order.rateAlertId && onViewRateAlert) {
                        onViewRateAlert(order.rateAlertId);
                      }
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render website metrics tab
  const renderWebsiteMetrics = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (!websiteMetrics) {
      return (
        <div className="text-center p-12 text-gray-500">
          <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No website metrics available</p>
          <p className="mt-2">Website metrics will appear here once available.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Visitors</h3>
              <div className="p-2 bg-blue-100 rounded-full">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{websiteMetrics.visitors.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-2">Total website visitors</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Page Views</h3>
              <div className="p-2 bg-green-100 rounded-full">
                <ExternalLink className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{websiteMetrics.pageViews.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-2">Total page views</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Calculator Uses</h3>
              <div className="p-2 bg-purple-100 rounded-full">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{websiteMetrics.calculatorUses.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-2">Total calculator uses</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Conversion Rate</h3>
              <div className="p-2 bg-yellow-100 rounded-full">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{websiteMetrics.conversionRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-500 mt-2">Visitor to order conversion</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Rate Locks</h3>
              <div className="p-2 bg-blue-100 rounded-full">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{websiteMetrics.rateLocks.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-2">Total rate locks created</p>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Conversion from Calculator:</span>
                <span className="font-medium text-gray-900">
                  {websiteMetrics.calculatorUses > 0 
                    ? ((websiteMetrics.rateLocks / websiteMetrics.calculatorUses) * 100).toFixed(1) 
                    : '0.0'}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Rate Alerts</h3>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{websiteMetrics.rateAlerts.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-2">Total rate alerts created</p>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Conversion from Calculator:</span>
                <span className="font-medium text-gray-900">
                  {websiteMetrics.calculatorUses > 0 
                    ? ((websiteMetrics.rateAlerts / websiteMetrics.calculatorUses) * 100).toFixed(1) 
                    : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Website Activities</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('locks')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'locks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Lock className="h-5 w-5 inline-block mr-2" />
            Rate Locks
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="h-5 w-5 inline-block mr-2" />
            Rate Alerts
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DollarSign className="h-5 w-5 inline-block mr-2" />
            Website Orders
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart2 className="h-5 w-5 inline-block mr-2" />
            Website Metrics
          </button>
        </nav>
      </div>
      
      <div>
        {activeTab === 'locks' && renderRateLocks()}
        {activeTab === 'alerts' && renderRateAlerts()}
        {activeTab === 'orders' && renderWebsiteOrders()}
        {activeTab === 'metrics' && renderWebsiteMetrics()}
      </div>
    </div>
  );
};

export default WebsiteActivities;