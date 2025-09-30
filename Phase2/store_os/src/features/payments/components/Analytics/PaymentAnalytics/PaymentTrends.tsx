import React, { useMemo, useState } from 'react';
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
  ComposedChart
} from 'recharts';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Sun,
  Moon,
  Coffee,
  Briefcase
} from 'lucide-react';
import type { PaymentAnalytics, UnifiedPaymentResult, PaymentMethod } from '../../../types';

interface PaymentTrendsProps {
  analytics: PaymentAnalytics;
  paymentHistory: UnifiedPaymentResult[];
}

interface HourlyPattern {
  hour: number;
  displayHour: string;
  transactions: number;
  volume: number;
  averageAmount: number;
  successRate: number;
  failureRate: number;
  peakIntensity: number;
  dayPart: 'night' | 'morning' | 'afternoon' | 'evening';
}

interface DayOfWeekPattern {
  day: string;
  dayIndex: number;
  transactions: number;
  volume: number;
  averageAmount: number;
  isWeekend: boolean;
}

interface SeasonalPattern {
  month: string;
  monthIndex: number;
  transactions: number;
  volume: number;
  trend: number;
}

interface PeakAnalysis {
  period: string;
  type: 'hour' | 'day' | 'method';
  peak: {
    time: string;
    transactions: number;
    volume: number;
  };
  valley: {
    time: string;
    transactions: number;
    volume: number;
  };
  variance: number;
  recommendation: string;
}

const PaymentTrends: React.FC<PaymentTrendsProps> = ({
  analytics,
  paymentHistory
}) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<'hourly' | 'weekly' | 'seasonal' | 'patterns'>('hourly');
  const [showFailures, setShowFailures] = useState(false);

  // Calculate hourly patterns
  const hourlyPatterns = useMemo(() => {
    const hourlyData: HourlyPattern[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      displayHour: `${hour.toString().padStart(2, '0')}:00`,
      transactions: 0,
      volume: 0,
      averageAmount: 0,
      successRate: 0,
      failureRate: 0,
      peakIntensity: 0,
      dayPart: hour >= 6 && hour < 12 ? 'morning' :
              hour >= 12 && hour < 18 ? 'afternoon' :
              hour >= 18 && hour < 22 ? 'evening' : 'night'
    }));

    const hourlyStats = new Map<number, { total: number; successful: number; totalVolume: number }>();

    paymentHistory.forEach(payment => {
      const hour = new Date(payment.timestamp).getHours();
      const current = hourlyStats.get(hour) || { total: 0, successful: 0, totalVolume: 0 };

      current.total++;
      if (payment.success) {
        current.successful++;
        current.totalVolume += payment.amount;
      }

      hourlyStats.set(hour, current);
    });

    // Calculate metrics for each hour
    hourlyStats.forEach((stats, hour) => {
      const hourData = hourlyData[hour];
      hourData.transactions = stats.total;
      hourData.volume = stats.totalVolume;
      hourData.averageAmount = stats.successful > 0 ? stats.totalVolume / stats.successful : 0;
      hourData.successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
      hourData.failureRate = stats.total > 0 ? ((stats.total - stats.successful) / stats.total) * 100 : 0;
    });

    // Calculate peak intensity (relative to max)
    const maxTransactions = Math.max(...hourlyData.map(h => h.transactions));
    hourlyData.forEach(hour => {
      hour.peakIntensity = maxTransactions > 0 ? (hour.transactions / maxTransactions) * 100 : 0;
    });

    return hourlyData;
  }, [paymentHistory]);

  // Calculate day of week patterns
  const weeklyPatterns = useMemo(() => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData: DayOfWeekPattern[] = daysOfWeek.map((day, index) => ({
      day,
      dayIndex: index,
      transactions: 0,
      volume: 0,
      averageAmount: 0,
      isWeekend: index === 0 || index === 6
    }));

    const dayStats = new Map<number, { transactions: number; volume: number }>();

    paymentHistory.forEach(payment => {
      if (!payment.success) return;

      const dayOfWeek = new Date(payment.timestamp).getDay();
      const current = dayStats.get(dayOfWeek) || { transactions: 0, volume: 0 };

      current.transactions++;
      current.volume += payment.amount;

      dayStats.set(dayOfWeek, current);
    });

    dayStats.forEach((stats, dayIndex) => {
      const dayData = weeklyData[dayIndex];
      dayData.transactions = stats.transactions;
      dayData.volume = stats.volume;
      dayData.averageAmount = stats.transactions > 0 ? stats.volume / stats.transactions : 0;
    });

    return weeklyData;
  }, [paymentHistory]);

  // Calculate seasonal patterns (by month)
  const seasonalPatterns = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const seasonalData: SeasonalPattern[] = months.map((month, index) => ({
      month,
      monthIndex: index,
      transactions: 0,
      volume: 0,
      trend: 0
    }));

    const monthStats = new Map<number, { transactions: number; volume: number }>();

    paymentHistory.forEach(payment => {
      if (!payment.success) return;

      const month = new Date(payment.timestamp).getMonth();
      const current = monthStats.get(month) || { transactions: 0, volume: 0 };

      current.transactions++;
      current.volume += payment.amount;

      monthStats.set(month, current);
    });

    monthStats.forEach((stats, monthIndex) => {
      const monthData = seasonalData[monthIndex];
      monthData.transactions = stats.transactions;
      monthData.volume = stats.volume;
    });

    // Calculate trends (mock data for demonstration)
    seasonalData.forEach((month, index) => {
      month.trend = Math.random() * 20 - 10; // -10% to +10%
    });

    return seasonalData;
  }, [paymentHistory]);

  // Peak analysis
  const peakAnalysis = useMemo(() => {
    const analyses: PeakAnalysis[] = [];

    // Hourly peak analysis
    const hourlyPeak = hourlyPatterns.reduce((max, current) =>
      current.transactions > max.transactions ? current : max
    );
    const hourlyValley = hourlyPatterns.reduce((min, current) =>
      current.transactions < min.transactions ? current : min
    );

    analyses.push({
      period: 'Daily',
      type: 'hour',
      peak: {
        time: hourlyPeak.displayHour,
        transactions: hourlyPeak.transactions,
        volume: hourlyPeak.volume
      },
      valley: {
        time: hourlyValley.displayHour,
        transactions: hourlyValley.transactions,
        volume: hourlyValley.volume
      },
      variance: hourlyPeak.transactions - hourlyValley.transactions,
      recommendation: `Peak traffic at ${hourlyPeak.displayHour}. Consider staffing optimization.`
    });

    // Weekly peak analysis
    const weeklyPeak = weeklyPatterns.reduce((max, current) =>
      current.transactions > max.transactions ? current : max
    );
    const weeklyValley = weeklyPatterns.reduce((min, current) =>
      current.transactions < min.transactions ? current : min
    );

    analyses.push({
      period: 'Weekly',
      type: 'day',
      peak: {
        time: weeklyPeak.day,
        transactions: weeklyPeak.transactions,
        volume: weeklyPeak.volume
      },
      valley: {
        time: weeklyValley.day,
        transactions: weeklyValley.transactions,
        volume: weeklyValley.volume
      },
      variance: weeklyPeak.transactions - weeklyValley.transactions,
      recommendation: `${weeklyPeak.day} is your busiest day. Plan inventory accordingly.`
    });

    return analyses;
  }, [hourlyPatterns, weeklyPatterns]);

  // Calculate payment method trends over time
  const methodTrends = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stripe_terminal: 0,
        cryptocurrency: 0,
        cash: 0,
        interac: 0,
        total: 0
      };
    }).reverse();

    paymentHistory.forEach(payment => {
      if (!payment.success) return;

      const paymentDate = payment.timestamp.split('T')[0];
      const dayData = last30Days.find(day => day.date === paymentDate);

      if (dayData) {
        dayData[payment.paymentMethod as keyof typeof dayData]++;
        dayData.total++;
      }
    });

    return last30Days.filter(day => day.total > 0).slice(-14); // Last 14 days with activity
  }, [paymentHistory]);

  const totalTransactions = hourlyPatterns.reduce((sum, hour) => sum + hour.transactions, 0);
  const peakHour = hourlyPatterns.reduce((max, current) =>
    current.transactions > max.transactions ? current : max
  );
  const averageHourlyVolume = hourlyPatterns.reduce((sum, hour) => sum + hour.volume, 0) / 24;

  const getTimeIcon = (dayPart: string) => {
    switch (dayPart) {
      case 'morning': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'afternoon': return <Coffee className="h-4 w-4 text-orange-500" />;
      case 'evening': return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'night': return <Moon className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderAnalysisView = () => {
    switch (selectedAnalysis) {
      case 'hourly':
        return (
          <div className="space-y-6">
            {/* Hourly Heatmap */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">24-Hour Transaction Heatmap</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyPatterns} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayHour" />
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
                    {showFailures && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="failureRate"
                        stroke="#EF4444"
                        strokeWidth={2}
                        name="failureRate"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {['morning', 'afternoon', 'evening', 'night'].map((period) => {
                const periodData = hourlyPatterns.filter(h => h.dayPart === period);
                const periodTransactions = periodData.reduce((sum, h) => sum + h.transactions, 0);
                const periodVolume = periodData.reduce((sum, h) => sum + h.volume, 0);
                const periodPercentage = totalTransactions > 0 ? (periodTransactions / totalTransactions) * 100 : 0;

                return (
                  <div key={period} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getTimeIcon(period)}
                        <h4 className="ml-2 font-medium text-gray-900 capitalize">{period}</h4>
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        {periodPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Transactions</p>
                        <p className="text-lg font-bold text-gray-900">{periodTransactions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Volume</p>
                        <p className="text-sm font-medium text-gray-700">${periodVolume.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'weekly':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Transaction Patterns</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyPatterns} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'transactions') return [value, 'Transactions'];
                        if (name === 'volume') return [`$${Number(value).toLocaleString()}`, 'Volume'];
                        if (name === 'averageAmount') return [`$${Number(value).toFixed(0)}`, 'Avg. Amount'];
                        return [value, name];
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="transactions"
                      fill="#3B82F6"
                      name="transactions"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="averageAmount"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="averageAmount"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              {weeklyPatterns.map((day) => (
                <div
                  key={day.day}
                  className={`p-4 rounded-lg border-2 ${
                    day.isWeekend
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <h4 className={`font-medium ${
                    day.isWeekend ? 'text-purple-900' : 'text-blue-900'
                  }`}>
                    {day.day}
                  </h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      {day.transactions} transactions
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      ${day.volume.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'seasonal':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={seasonalPatterns} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'transactions') return [value, 'Transactions'];
                        if (name === 'volume') return [`$${Number(value).toLocaleString()}`, 'Volume'];
                        if (name === 'trend') return [`${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(1)}%`, 'Trend'];
                        return [value, name];
                      }}
                    />
                    <Bar yAxisId="left" dataKey="volume" fill="#3B82F6" name="volume" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="trend"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="trend"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'patterns':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={methodTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayDate" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="stripe_terminal"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      name="Terminal"
                    />
                    <Area
                      type="monotone"
                      dataKey="cryptocurrency"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      name="Crypto"
                    />
                    <Area
                      type="monotone"
                      dataKey="cash"
                      stackId="1"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      name="Cash"
                    />
                    <Area
                      type="monotone"
                      dataKey="interac"
                      stackId="1"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      name="Interac"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Trends & Patterns</h2>
          <p className="text-gray-600">
            Time-based analysis, peak hours identification, and behavioral patterns
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showFailures}
              onChange={(e) => setShowFailures(e.target.checked)}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-700">Show Failures</span>
          </label>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Peak Hour</p>
              <p className="text-2xl font-bold">{peakHour.displayHour}</p>
              <p className="text-blue-200 text-xs mt-1">{peakHour.transactions} transactions</p>
            </div>
            <Clock className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Avg. Hourly Volume</p>
              <p className="text-2xl font-bold">${averageHourlyVolume.toFixed(0)}</p>
              <p className="text-green-200 text-xs mt-1">Per hour</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Peak Intensity</p>
              <p className="text-2xl font-bold">{peakHour.peakIntensity.toFixed(0)}%</p>
              <p className="text-purple-200 text-xs mt-1">Of daily max</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Daily Spread</p>
              <p className="text-2xl font-bold">{peakAnalysis[0]?.variance || 0}</p>
              <p className="text-orange-200 text-xs mt-1">Peak vs valley</p>
            </div>
            <Activity className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Analysis Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <nav className="flex space-x-1">
          {[
            { id: 'hourly', name: 'Hourly Patterns', icon: Clock },
            { id: 'weekly', name: 'Weekly Trends', icon: Calendar },
            { id: 'seasonal', name: 'Seasonal Analysis', icon: TrendingUp },
            { id: 'patterns', name: 'Method Patterns', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedAnalysis(tab.id as any)}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedAnalysis === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Analysis Content */}
      {renderAnalysisView()}

      {/* Peak Analysis Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {peakAnalysis.map((analysis, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{analysis.period} Peak Analysis</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Peak Period</p>
                  <p className="font-semibold text-green-600">{analysis.peak.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="font-semibold text-gray-900">{analysis.peak.transactions}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Valley Period</p>
                  <p className="font-semibold text-red-600">{analysis.valley.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="font-semibold text-gray-900">{analysis.valley.transactions}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Variance</p>
                <p className="font-semibold text-gray-900">{analysis.variance} transactions</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 mb-1">Recommendation</p>
                <p className="text-sm text-blue-700">{analysis.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Business Intelligence Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Trend-Based Business Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Peak Hour Optimization</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Busiest time: {peakHour.displayHour} ({peakHour.transactions} transactions)</li>
              <li>• Consider additional staffing during peak hours</li>
              <li>• Optimize terminal availability for high-traffic periods</li>
              <li>• Plan inventory restocking around valley hours</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Weekly Pattern Insights</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• {weeklyPatterns.reduce((max, day) => day.transactions > max.transactions ? day : max).day} is your busiest day</li>
              <li>• Weekend vs weekday patterns show distinct behavior</li>
              <li>• Consider special weekend operating hours</li>
              <li>• Plan marketing campaigns based on traffic patterns</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Method Adoption Trends</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Monitor cryptocurrency adoption growth</li>
              <li>• Terminal payments show consistent reliability</li>
              <li>• Cash transactions remain significant</li>
              <li>• Consider promoting lower-cost payment methods</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTrends;