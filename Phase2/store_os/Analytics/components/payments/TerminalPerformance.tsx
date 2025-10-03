import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Terminal,
  Wifi,
  WifiOff,
  Battery,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertTriangle,
  Settings,
  RefreshCw
} from 'lucide-react';
import paymentProcessingService from '../../../paymentProcessingService';
import type { PaymentAnalytics, UnifiedPaymentResult } from '../../../types';

interface TerminalPerformanceProps {
  analytics: PaymentAnalytics;
  paymentHistory: UnifiedPaymentResult[];
}

interface TerminalMetrics {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  status: 'online' | 'offline' | 'busy' | 'needs_reboot';
  batteryLevel?: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  totalVolume: number;
  averageTransactionTime: number;
  lastTransaction?: string;
  uptime: number;
  processingErrors: string[];
}

const TerminalPerformance: React.FC<TerminalPerformanceProps> = ({
  analytics,
  paymentHistory
}) => {
  const [terminalData, setTerminalData] = useState<TerminalMetrics[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load terminal data
  useEffect(() => {
    const loadTerminalData = async () => {
      setIsLoading(true);
      try {
        const status = paymentProcessingService.getSystemStatus();
        setSystemStatus(status);

        // Generate mock terminal metrics based on real payment data
        const terminalPayments = paymentHistory.filter(p => p.paymentMethod === 'stripe_terminal');

        const mockTerminals: TerminalMetrics[] = [
          {
            deviceId: 'tmr_verifone_p400_001',
            deviceName: 'Verifone P400 - Counter',
            deviceType: 'verifone_P400',
            status: 'online',
            batteryLevel: 87,
            totalTransactions: Math.floor(terminalPayments.length * 0.6),
            successfulTransactions: Math.floor(terminalPayments.filter(p => p.success).length * 0.6),
            failedTransactions: Math.floor(terminalPayments.filter(p => !p.success).length * 0.6),
            successRate: 98.5,
            totalVolume: terminalPayments.reduce((sum, p) => sum + p.amount, 0) * 0.6,
            averageTransactionTime: 12.3,
            lastTransaction: terminalPayments.length > 0 ? terminalPayments[0].timestamp : undefined,
            uptime: 99.2,
            processingErrors: ['Card read timeout', 'Network timeout']
          },
          {
            deviceId: 'tmr_bbpos_wisepad3_001',
            deviceName: 'BBPOS WisePad 3 - Mobile',
            deviceType: 'bbpos_wisepad3',
            status: 'online',
            batteryLevel: 64,
            totalTransactions: Math.floor(terminalPayments.length * 0.4),
            successfulTransactions: Math.floor(terminalPayments.filter(p => p.success).length * 0.4),
            failedTransactions: Math.floor(terminalPayments.filter(p => !p.success).length * 0.4),
            successRate: 96.8,
            totalVolume: terminalPayments.reduce((sum, p) => sum + p.amount, 0) * 0.4,
            averageTransactionTime: 15.7,
            lastTransaction: terminalPayments.length > 1 ? terminalPayments[1].timestamp : undefined,
            uptime: 97.8,
            processingErrors: ['Low battery warning', 'Bluetooth disconnect']
          }
        ];

        setTerminalData(mockTerminals);
      } catch (error) {
        console.error('Failed to load terminal data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTerminalData();
  }, [paymentHistory]);

  // Calculate hourly transaction distribution for terminals
  const hourlyData = useMemo(() => {
    const terminalPayments = paymentHistory.filter(p => p.paymentMethod === 'stripe_terminal');
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      transactions: 0,
      volume: 0,
      successRate: 0
    }));

    terminalPayments.forEach(payment => {
      const hour = new Date(payment.timestamp).getHours();
      hourlyStats[hour].transactions++;
      if (payment.success) {
        hourlyStats[hour].volume += payment.amount;
      }
    });

    // Calculate success rates
    hourlyStats.forEach(stat => {
      const hourPayments = terminalPayments.filter(p => {
        const paymentHour = new Date(p.timestamp).getHours();
        return paymentHour === hourlyStats.indexOf(stat);
      });
      const successful = hourPayments.filter(p => p.success).length;
      stat.successRate = hourPayments.length > 0 ? (successful / hourPayments.length) * 100 : 0;
    });

    return hourlyStats.filter(stat => stat.transactions > 0);
  }, [paymentHistory]);

  // Device status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'needs_reboot': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      case 'busy': return <Clock className="h-4 w-4" />;
      case 'needs_reboot': return <RefreshCw className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const totalTerminalVolume = terminalData.reduce((sum, terminal) => sum + terminal.totalVolume, 0);
  const totalTerminalTransactions = terminalData.reduce((sum, terminal) => sum + terminal.totalTransactions, 0);
  const averageSuccessRate = terminalData.length > 0
    ? terminalData.reduce((sum, terminal) => sum + terminal.successRate, 0) / terminalData.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading terminal performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Terminal Performance Dashboard</h2>
        <p className="text-gray-600">
          Device utilization, success rates, and operational metrics for payment terminals
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Volume</p>
              <p className="text-2xl font-bold">${totalTerminalVolume.toLocaleString()}</p>
              <p className="text-blue-200 text-xs mt-1">Via terminals</p>
            </div>
            <Terminal className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Transactions</p>
              <p className="text-2xl font-bold">{totalTerminalTransactions}</p>
              <p className="text-green-200 text-xs mt-1">Processed</p>
            </div>
            <Activity className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Success Rate</p>
              <p className="text-2xl font-bold">{averageSuccessRate.toFixed(1)}%</p>
              <p className="text-purple-200 text-xs mt-1">Average</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Active Devices</p>
              <p className="text-2xl font-bold">
                {terminalData.filter(t => t.status === 'online').length}
              </p>
              <p className="text-orange-200 text-xs mt-1">
                of {terminalData.length} total
              </p>
            </div>
            <Wifi className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {terminalData.map((terminal) => (
          <div
            key={terminal.deviceId}
            className={`bg-white border-2 rounded-lg p-6 shadow-sm transition-all cursor-pointer ${
              selectedDevice === terminal.deviceId
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedDevice(
              selectedDevice === terminal.deviceId ? null : terminal.deviceId
            )}
          >
            {/* Device Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg mr-3">
                  <Terminal className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{terminal.deviceName}</h3>
                  <p className="text-sm text-gray-500">{terminal.deviceType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {terminal.batteryLevel && (
                  <div className="flex items-center">
                    <Battery className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">{terminal.batteryLevel}%</span>
                  </div>
                )}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(terminal.status)}`}>
                  {getStatusIcon(terminal.status)}
                  <span className="ml-1 capitalize">{terminal.status}</span>
                </span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-lg font-semibold text-gray-900">{terminal.totalTransactions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-lg font-semibold text-green-600">{terminal.successRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Volume</p>
                <p className="text-lg font-semibold text-gray-900">${terminal.totalVolume.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Time</p>
                <p className="text-lg font-semibold text-gray-900">{terminal.averageTransactionTime}s</p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium">{terminal.successRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${terminal.successRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Uptime</span>
                  <span className="font-medium">{terminal.uptime}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${terminal.uptime}%` }}
                  />
                </div>
              </div>

              {terminal.batteryLevel && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Battery</span>
                    <span className="font-medium">{terminal.batteryLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        terminal.batteryLevel > 60 ? 'bg-green-600' :
                        terminal.batteryLevel > 30 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${terminal.batteryLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recent Errors */}
            {terminal.processingErrors.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">Recent Issues</span>
                </div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {terminal.processingErrors.slice(0, 2).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hourly Performance Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Terminal Activity</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'transactions') return [value, 'Transactions'];
                  if (name === 'volume') return [`$${Number(value).toLocaleString()}`, 'Volume'];
                  if (name === 'successRate') return [`${Number(value).toFixed(1)}%`, 'Success Rate'];
                  return [value, name];
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="transactions"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                name="transactions"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                stroke="#10B981"
                strokeWidth={2}
                name="successRate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Volume Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume Distribution by Device</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={terminalData.map(terminal => ({
                    name: terminal.deviceName.split(' - ')[1] || terminal.deviceName,
                    value: terminal.totalVolume,
                    transactions: terminal.totalTransactions
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {terminalData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#10B981'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={([value]: [number]) => [`$${value.toLocaleString()}`, 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Performance Comparison */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={terminalData.map(terminal => ({
                  name: terminal.deviceName.split(' - ')[1] || terminal.deviceName,
                  successRate: terminal.successRate,
                  uptime: terminal.uptime,
                  avgTime: terminal.averageTransactionTime
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'avgTime') return [`${value}s`, 'Avg. Time'];
                    return [`${Number(value).toFixed(1)}%`, name];
                  }}
                />
                <Bar dataKey="successRate" fill="#10B981" name="Success Rate" />
                <Bar dataKey="uptime" fill="#3B82F6" name="Uptime" />
                <Bar dataKey="avgTime" fill="#F59E0B" name="avgTime" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROI Analysis */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Terminal ROI Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Investment Performance</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Total terminal revenue: ${totalTerminalVolume.toLocaleString()}</li>
              <li>• Processing efficiency: {averageSuccessRate.toFixed(1)}% success rate</li>
              <li>• Device utilization: {terminalData.filter(t => t.status === 'online').length}/{terminalData.length} active</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Optimization Opportunities</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Consider load balancing between devices</li>
              <li>• Monitor battery levels for mobile terminals</li>
              <li>• Schedule maintenance during low-traffic hours</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Cost Analysis</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Processing fees: ~2.9% + $0.30 per transaction</li>
              <li>• Terminal rental: $75-150/month per device</li>
              <li>• Expected monthly ROI: 15-25%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalPerformance;