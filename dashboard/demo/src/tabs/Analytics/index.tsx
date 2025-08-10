import React, { useEffect, useMemo, useState } from 'react';
import webSocketService from '../../services/webSocketService';

const AnalyticsDashboard: React.FC = () => {
  // const [dailyPerformance, setDailyPerformance] = useState<any[]>([]); // Not currently used
  const [currencyPerformance, setCurrencyPerformance] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const totalTransactions = useMemo(
    () => currencyPerformance.reduce((sum, curr) => sum + (curr.transactions || 0), 0),
    [currencyPerformance]
  );
  const totalVolume = useMemo(
    () => currencyPerformance.reduce((sum, curr) => sum + (curr.volume || 0), 0),
    [currencyPerformance]
  );
  const totalProfit = useMemo(
    () => currencyPerformance.reduce((sum, curr) => sum + (curr.profit || 0), 0),
    [currencyPerformance]
  );

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { default: analyticsService } = await import('../../services/analyticsService');
        const [dailyData, currencyData, insightsData, profitData] = await Promise.all([
          analyticsService.getDailyPerformance().catch(() => []),
          analyticsService.getCurrencyPerformance().catch(() => []),
          analyticsService.getBusinessInsights().catch(() => []),
          analyticsService.getProfitAnalysis().catch(() => null)
        ]);

        const formattedDailyData = (dailyData || []).map((day: any) => ({
          name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
          value: day.volume
        }));

        setDailyPerformance(formattedDailyData);
        setCurrencyPerformance(currencyData || []);
        setInsights(insightsData || []);
        setProfitAnalysis(profitData);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Analytics fetch error:', err);
        setDailyPerformance([]);
        setCurrencyPerformance([]);
        setInsights([]);
        setProfitAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchAnalyticsData, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        await webSocketService.connect();
        const unsubscribe = webSocketService.subscribe(event => {
          if (event.type === 'transaction_created' || event.type === 'inventory_update') {
            const refreshAnalytics = async () => {
              try {
                const { default: analyticsService } = await import('../../services/analyticsService');
                if (event.type === 'transaction_created') {
                  const [dailyData, currencyData, profitData] = await Promise.all([
                    analyticsService.getDailyPerformance(),
                    analyticsService.getCurrencyPerformance(),
                    analyticsService.getProfitAnalysis()
                  ]);
                  const formattedDailyData = (dailyData || []).map((day: any) => ({
                    name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
                    value: day.volume
                  }));
                  setDailyPerformance(formattedDailyData);
                  setCurrencyPerformance(currencyData || []);
                  setProfitAnalysis(profitData);
                }
                const insightsData = await analyticsService.getBusinessInsights();
                setInsights(insightsData || []);
              } catch (err) {
                console.error('Failed to refresh analytics:', err);
              }
            };
            refreshAnalytics();
          }
        });
        return () => {
          unsubscribe();
          webSocketService.disconnect();
        };
      } catch (err) {
        console.error('Failed to set up WebSocket:', err);
      }
    };

    setupWebSocket();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Business Intelligence</h2>
        {isLoading && (
          <div className="flex items-center text-blue-600">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading analytics...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading && currencyPerformance.length === 0 ? (
        <div className="flex justify-center items-center p-16">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Total Transactions</h3>
              <p className="text-2xl font-bold text-blue-900">{totalTransactions}</p>
              <p className="text-xs text-blue-700 mt-1">Last 7 days</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-100 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-green-800 mb-1">Total Volume</h3>
              <p className="text-2xl font-bold text-green-900">${totalVolume.toLocaleString()}</p>
              <p className="text-xs text-green-700 mt-1">Last 7 days</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-100 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-purple-800 mb-1">Total Profit</h3>
              <p className="text-2xl font-bold text-purple-900">${totalProfit.toLocaleString()}</p>
              <p className="text-xs text-purple-700 mt-1">Last 7 days</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Currency Performance</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {currencyPerformance.length === 0 ? (
                <div className="text-center p-8 text-gray-500">No currency performance data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currencyPerformance.map((item: any) => (
                        <tr key={item.currency} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{item.currency}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.transactions}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${item.volume.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">${item.profit.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${totalVolume ? (item.volume / totalVolume) * 100 : 0}%` }}></div>
                              </div>
                              <span className="ml-2 text-sm text-gray-600">{totalVolume ? ((item.volume / totalVolume) * 100).toFixed(1) : '0.0'}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Insights & Recommendations</h3>
            {insights.length === 0 ? (
              <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">No insights available at this time</div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight: any, index: number) => {
                  let bgColor = 'bg-blue-50';
                  let borderColor = 'border-blue-400';
                  let textColor = 'text-blue-800';
                  let textBodyColor = 'text-blue-700';
                  let icon = (
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  );
                  if (insight.type === 'warning') {
                    bgColor = 'bg-yellow-50';
                    borderColor = 'border-yellow-400';
                    textColor = 'text-yellow-800';
                    textBodyColor = 'text-yellow-700';
                    icon = (
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    );
                  } else if (insight.type === 'opportunity') {
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-400';
                    textColor = 'text-green-800';
                    textBodyColor = 'text-green-700';
                    icon = (
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    );
                  }
                  return (
                    <div key={index} className={`${bgColor} border-l-4 ${borderColor} p-4 rounded shadow-sm transition-all hover:shadow-md`}>
                      <div className="flex">
                        <div className="flex-shrink-0">{icon}</div>
                        <div className="ml-3">
                          <h3 className={`text-sm font-medium ${textColor}`}>{insight.title}</h3>
                          <div className={`mt-2 text-sm ${textBodyColor}`}>
                            <p>{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {profitAnalysis && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Profit Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Total Profit</h4>
                  <p className="text-xl font-bold text-gray-800 mt-1">${profitAnalysis.totalProfit.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Avg. Profit/Transaction</h4>
                  <p className="text-xl font-bold text-gray-800 mt-1">${profitAnalysis.averageProfitPerTransaction.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Profit Trend</h4>
                  <p className="text-xl font-bold text-green-600 mt-1">+{profitAnalysis.profitTrend}%</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Top Profit Currency</h4>
                  <p className="text-xl font-bold text-gray-800 mt-1">{profitAnalysis.topProfitCurrency}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
