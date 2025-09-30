import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Bitcoin,
  Zap
} from 'lucide-react';
import type { PaymentAnalytics, UnifiedPaymentResult, SupportedCrypto } from '../../../types';

interface CryptoAnalyticsProps {
  analytics: PaymentAnalytics;
  paymentHistory: UnifiedPaymentResult[];
}

interface CryptoMetrics {
  symbol: SupportedCrypto;
  name: string;
  transactions: number;
  volume: number;
  volumeCAD: number;
  averageRate: number;
  currentRate: number;
  priceChange24h: number;
  marketShare: number;
  averageTransactionSize: number;
  totalFees: number;
  adoptionTrend: number;
  complianceRequired: number;
}

interface NetworkMetrics {
  symbol: SupportedCrypto;
  confirmationTime: number;
  networkFee: number;
  successRate: number;
  blockExplorerUrl: string;
}

const CryptoAnalytics: React.FC<CryptoAnalyticsProps> = ({
  analytics,
  paymentHistory
}) => {
  const [cryptoRates, setCryptoRates] = useState<Record<SupportedCrypto, number>>({
    BTC: 89500,
    ETH: 3200,
    SOL: 195,
    AVAX: 45,
    USDC: 1.37
  });
  const [isLoading, setIsLoading] = useState(false);

  // Crypto icons mapping
  const cryptoIcons = {
    BTC: '₿',
    ETH: 'Ξ',
    SOL: '◎',
    AVAX: '▲',
    USDC: '$'
  } as const;

  const cryptoColors = {
    BTC: '#F7931A',
    ETH: '#627EEA',
    SOL: '#14F195',
    AVAX: '#E84142',
    USDC: '#2775CA'
  } as const;

  const cryptoNames = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    AVAX: 'Avalanche',
    USDC: 'USD Coin'
  } as const;

  // Filter crypto payments
  const cryptoPayments = useMemo(() => {
    return paymentHistory.filter(p => p.paymentMethod === 'cryptocurrency' && p.cryptoResult);
  }, [paymentHistory]);

  // Calculate crypto metrics
  const cryptoMetrics = useMemo(() => {
    const metrics: CryptoMetrics[] = [];
    const cryptoCounts = new Map<SupportedCrypto, {
      transactions: number;
      volume: number;
      volumeCAD: number;
      rates: number[];
      fees: number;
      complianceRequired: number;
    }>();

    // Process crypto payments
    cryptoPayments.forEach(payment => {
      const crypto = payment.cryptoResult!.cryptocurrency;
      const current = cryptoCounts.get(crypto) || {
        transactions: 0,
        volume: 0,
        volumeCAD: 0,
        rates: [],
        fees: 0,
        complianceRequired: 0
      };

      current.transactions++;
      current.volume += payment.cryptoAmount || 0;
      current.volumeCAD += payment.amount;
      if (payment.exchangeRate) {
        current.rates.push(payment.exchangeRate);
      }
      current.fees += payment.cryptoResult?.networkFee || 0;

      if (payment.requiresFintracReport) {
        current.complianceRequired++;
      }

      cryptoCounts.set(crypto, current);
    });

    const totalVolumeCAD = Array.from(cryptoCounts.values()).reduce((sum, data) => sum + data.volumeCAD, 0);

    // Convert to metrics array
    Array.from(cryptoCounts.entries()).forEach(([crypto, data]) => {
      const averageRate = data.rates.length > 0 ? data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length : 0;
      const currentRate = cryptoRates[crypto] || 0;
      const priceChange24h = Math.random() * 10 - 5; // Mock price change
      const marketShare = totalVolumeCAD > 0 ? (data.volumeCAD / totalVolumeCAD) * 100 : 0;

      metrics.push({
        symbol: crypto,
        name: cryptoNames[crypto],
        transactions: data.transactions,
        volume: data.volume,
        volumeCAD: data.volumeCAD,
        averageRate,
        currentRate,
        priceChange24h,
        marketShare,
        averageTransactionSize: data.transactions > 0 ? data.volumeCAD / data.transactions : 0,
        totalFees: data.fees,
        adoptionTrend: Math.random() * 20 - 10, // Mock adoption trend
        complianceRequired: data.complianceRequired
      });
    });

    return metrics.sort((a, b) => b.volumeCAD - a.volumeCAD);
  }, [cryptoPayments, cryptoRates]);

  // Calculate daily crypto volume trends
  const dailyTrends = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalVolume: 0,
        transactions: 0,
        BTC: 0,
        ETH: 0,
        SOL: 0,
        AVAX: 0,
        USDC: 0
      };
    }).reverse();

    cryptoPayments.forEach(payment => {
      const paymentDate = payment.timestamp.split('T')[0];
      const dayData = dailyTrends.find(day => day.date === paymentDate);
      if (dayData && payment.success) {
        dayData.totalVolume += payment.amount;
        dayData.transactions++;
        const crypto = payment.cryptoResult!.cryptocurrency;
        dayData[crypto] += payment.amount;
      }
    });

    return dailyTrends.filter(day => day.totalVolume > 0).slice(-14); // Last 14 days with activity
  }, [cryptoPayments]);

  // Network performance metrics
  const networkMetrics: NetworkMetrics[] = [
    {
      symbol: 'BTC',
      confirmationTime: 15,
      networkFee: 2.50,
      successRate: 99.1,
      blockExplorerUrl: 'https://blockstream.info/tx/'
    },
    {
      symbol: 'ETH',
      confirmationTime: 3,
      networkFee: 5.20,
      successRate: 98.5,
      blockExplorerUrl: 'https://etherscan.io/tx/'
    },
    {
      symbol: 'SOL',
      confirmationTime: 1,
      networkFee: 0.01,
      successRate: 97.8,
      blockExplorerUrl: 'https://solscan.io/tx/'
    },
    {
      symbol: 'AVAX',
      confirmationTime: 2,
      networkFee: 0.25,
      successRate: 98.9,
      blockExplorerUrl: 'https://snowtrace.io/tx/'
    },
    {
      symbol: 'USDC',
      confirmationTime: 3,
      networkFee: 1.80,
      successRate: 99.3,
      blockExplorerUrl: 'https://etherscan.io/tx/'
    }
  ];

  const totalCryptoVolume = cryptoMetrics.reduce((sum, crypto) => sum + crypto.volumeCAD, 0);
  const totalCryptoTransactions = cryptoMetrics.reduce((sum, crypto) => sum + crypto.transactions, 0);
  const averageTransactionSize = totalCryptoTransactions > 0 ? totalCryptoVolume / totalCryptoTransactions : 0;
  const totalComplianceRequired = cryptoMetrics.reduce((sum, crypto) => sum + crypto.complianceRequired, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cryptocurrency Analytics</h2>
          <p className="text-gray-600">
            Multi-chain transaction analysis, adoption trends, and compliance metrics
          </p>
        </div>
        <button
          onClick={() => setIsLoading(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Rates
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Crypto Volume</p>
              <p className="text-2xl font-bold">${totalCryptoVolume.toLocaleString()}</p>
              <p className="text-orange-200 text-xs mt-1">Total processed</p>
            </div>
            <Bitcoin className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Transactions</p>
              <p className="text-2xl font-bold">{totalCryptoTransactions}</p>
              <p className="text-green-200 text-xs mt-1">Crypto payments</p>
            </div>
            <Zap className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Avg. Transaction</p>
              <p className="text-2xl font-bold">${averageTransactionSize.toFixed(0)}</p>
              <p className="text-blue-200 text-xs mt-1">Per crypto payment</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Compliance</p>
              <p className="text-2xl font-bold">{totalComplianceRequired}</p>
              <p className="text-purple-200 text-xs mt-1">Reports required</p>
            </div>
            <AlertCircle className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Cryptocurrency Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {cryptoMetrics.map((crypto) => (
          <div key={crypto.symbol} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3"
                  style={{ backgroundColor: cryptoColors[crypto.symbol] }}
                >
                  {cryptoIcons[crypto.symbol]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{crypto.name}</h3>
                  <p className="text-sm text-gray-500">{crypto.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ${crypto.currentRate.toLocaleString()}
                </p>
                <div className="flex items-center">
                  {crypto.priceChange24h > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      crypto.priceChange24h > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {crypto.priceChange24h > 0 ? '+' : ''}{crypto.priceChange24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Volume (CAD)</span>
                <span className="font-medium">${crypto.volumeCAD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="font-medium">{crypto.transactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Market Share</span>
                <span className="font-medium">{crypto.marketShare.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg. Size</span>
                <span className="font-medium">${crypto.averageTransactionSize.toFixed(0)}</span>
              </div>

              {/* Market Share Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Market Share</span>
                  <span className="font-medium">{crypto.marketShare.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${crypto.marketShare}%`,
                      backgroundColor: cryptoColors[crypto.symbol]
                    }}
                  />
                </div>
              </div>

              {crypto.complianceRequired > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">Compliance Required</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-900">
                    {crypto.complianceRequired} reports
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Volume Trends */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Crypto Volume Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'transactions') return [value, 'Transactions'];
                    return [`$${Number(value).toLocaleString()}`, name];
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalVolume"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  name="Total Volume"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="transactions"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="transactions"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crypto Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cryptocurrency Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cryptoMetrics.map(crypto => ({
                    name: crypto.symbol,
                    value: crypto.volumeCAD,
                    transactions: crypto.transactions
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cryptoMetrics.map((crypto, index) => (
                    <Cell key={`cell-${index}`} fill={cryptoColors[crypto.symbol]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={([value]: [number]) => [`$${value.toLocaleString()}`, 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Network Performance Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Network Performance Metrics</h3>
          <p className="text-sm text-gray-600 mt-1">Confirmation times, fees, and success rates across networks</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Network
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confirmation Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Network Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block Explorer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {networkMetrics.map((network) => (
                <tr key={network.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3"
                        style={{ backgroundColor: cryptoColors[network.symbol] }}
                      >
                        {cryptoIcons[network.symbol]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{network.symbol}</div>
                        <div className="text-sm text-gray-500">{cryptoNames[network.symbol]}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{network.confirmationTime} min</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${network.networkFee.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${network.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {network.successRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={network.blockExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      <span className="text-sm">Explorer</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adoption and Compliance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Crypto Adoption & Compliance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Market Position</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• First-to-market crypto payment integration in Canada</li>
              <li>• {cryptoMetrics.length} active cryptocurrencies supported</li>
              <li>• Average transaction size: ${averageTransactionSize.toFixed(0)}</li>
              <li>• Total volume processed: ${totalCryptoVolume.toLocaleString()}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">FINTRAC Compliance</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• VCTR threshold: $1,000 CAD</li>
              <li>• LVCTR threshold: $10,000 CAD</li>
              <li>• Reports required: {totalComplianceRequired} transactions</li>
              <li>• Automated compliance processing active</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Growth Opportunities</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Consider adding more stablecoins (USDT, DAI)</li>
              <li>• Implement dynamic fee optimization</li>
              <li>• Monitor DeFi integration opportunities</li>
              <li>• Expand to Layer 2 solutions for lower fees</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoAnalytics;