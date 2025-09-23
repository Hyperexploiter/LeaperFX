import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import saadatWhite from './assets/saadat_white.PNG';
import saadatBlack from './assets/saadat_black.PNG';

const SaadatExchangeDashboard = () => {
  // Generate realistic chart data
  const generateChartData = (trend = 'up', points = 30) => {
    const baseValue = trend === 'up' ? 1.35 : 1.42;
    return Array.from({ length: points }, (_, i) => ({
      time: i,
      value: baseValue + (trend === 'up' ? i * 0.001 : -i * 0.001) + (Math.random() - 0.5) * 0.005
    }));
  };

  // Core currency data
  const [currencies] = useState([
    {
      code: 'USD',
      name: 'US Dollar',
      flag: '🇺🇸',
      weBuy: '1.3668',
      weSell: '1.4086',
      change24h: '+0.46%',
      trend: 'up'
    },
    {
      code: 'EUR',
      name: 'Euro',
      flag: '🇪🇺',
      weBuy: '1.6075',
      weSell: '1.6565',
      change24h: '+0.30%',
      trend: 'up'
    },
    {
      code: 'GBP',
      name: 'British Pound',
      flag: '🇬🇧',
      weBuy: '1.8393',
      weSell: '1.8954',
      change24h: '+0.17%',
      trend: 'up'
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      flag: '🇯🇵',
      weBuy: '0.0092',
      weSell: '0.0095',
      change24h: '+0.31%',
      trend: 'up'
    },
    {
      code: 'AUD',
      name: 'Australian Dollar',
      flag: '🇦🇺',
      weBuy: '0.9043',
      weSell: '0.9318',
      change24h: '+0.79%',
      trend: 'up'
    },
    {
      code: 'CHF',
      name: 'Swiss Franc',
      flag: '🇨🇭',
      weBuy: '1.7144',
      weSell: '1.7666',
      change24h: '-0.01%',
      trend: 'down'
    }
  ]);

  // Additional market instruments for right sidebar
  const [marketData] = useState([
    { name: 'GOLD/CAD', symbol: 'GOLD', value: '3,592.80', change: '+12.40', changePercent: '0.35%', trend: 'up' },
    { name: 'SILVER/CAD', symbol: 'SILVER', value: '43.25', change: '+0.92', changePercent: '2.17%', trend: 'up' },
    { name: 'BTC/CAD', symbol: 'BTC', value: '86,420', change: '-1,240', changePercent: '-1.42%', trend: 'down' },
    { name: 'ETH/CAD', symbol: 'ETH', value: '3,580', change: '+85', changePercent: '2.43%', trend: 'up' },
    { name: 'CA 10Y YIELD', symbol: 'CA10Y', value: '3.15%', change: '+0.01', changePercent: '0.32%', trend: 'up' },
    { name: 'US 10Y YIELD', symbol: 'US10Y', value: '4.28%', change: '+0.03', changePercent: '0.71%', trend: 'up' }
  ]);

  // Ticker data for scrolling
  const tickerData = currencies.map(curr => `${curr.code}/CAD ${curr.weSell} ${curr.trend === 'up' ? '▲' : '▼'}${curr.change24h}`);

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const PriceDisplay = ({ change, changePercent, trend }) => {
    const isPositive = trend === 'up';
    return (
      <div className={`flex items-center space-x-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        <span className="text-xs">{isPositive ? '▲' : '▼'}</span>
        <span className="font-semibold">{change}</span>
        {changePercent && (
          <span className="text-xs opacity-80">({changePercent})</span>
        )}
      </div>
    );
  };

  const MiniChart = ({ trend, height = 24 }) => {
    const chartData = generateChartData(trend, 15);
    const color = trend === 'up' ? '#10b981' : '#ef4444';

    return (
      <div className="w-16" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${trend}-${Math.random()}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#gradient-${trend}-${Math.random()})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const CurrencyCard = ({ currency }) => (
    <div className="group bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-md border border-slate-800/60 rounded-xl hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:transform hover:-translate-y-1">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-b border-slate-700/50 px-5 py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-3xl drop-shadow-lg">{currency.flag}</span>
            <div>
              <h3 className="text-orange-400 font-bold text-xl tracking-wide">{currency.code}</h3>
              <p className="text-slate-300 text-sm font-medium">{currency.name}</p>
            </div>
          </div>
          <div className="text-right">
            <PriceDisplay change={currency.change24h} trend={currency.trend} />
            <p className="text-xs text-slate-500 mt-1 font-medium">24h Change</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-5">
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-lg border border-slate-800/30">
            <span className="text-slate-200 font-semibold">We Buy</span>
            <span className="text-cyan-400 font-mono font-bold text-xl tracking-wider">{currency.weBuy}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-950/40 rounded-lg border border-slate-800/30">
            <span className="text-slate-200 font-semibold">We Sell</span>
            <span className="text-emerald-400 font-mono font-bold text-xl tracking-wider">{currency.weSell}</span>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="mt-5 flex justify-center">
          <MiniChart trend={currency.trend} height={36} />
        </div>
      </div>
    </div>
  );

  const MarketInstrumentCard = ({ item }) => (
    <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-4 hover:border-cyan-600/30 hover:bg-slate-900/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-orange-400 font-semibold text-sm">{item.symbol}</div>
          <div className="text-slate-100 font-mono font-bold text-lg">{item.value}</div>
          <div className="text-slate-400 text-xs mt-1">{item.name}</div>
        </div>
        <div className="flex items-center space-x-3">
          <MiniChart trend={item.trend} height={24} />
          <div className="text-right">
            <PriceDisplay change={item.change} changePercent={item.changePercent} trend={item.trend} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 h-screen">

        {/* Main Content Area - Currencies */}
        <div className="col-span-9 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-b border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Professional SAADAT Logo */}
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <span className="text-white font-bold text-2xl">S</span>
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-3xl tracking-widest">SAADAT</h1>
                    <p className="text-cyan-300 text-sm font-medium tracking-wide">CURRENCY EXCHANGE</p>
                  </div>
                </div>

                {/* Live Indicator */}
                <div className="flex items-center space-x-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-emerald-400 font-medium text-sm">LIVE RATES</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-100 font-semibold text-lg">
                  {time.toLocaleDateString('en-CA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-cyan-400 font-mono text-xl font-bold">
                  {time.toLocaleTimeString('en-CA', { hour12: true })}
                </div>
              </div>
            </div>
          </div>

          {/* Currency Grid */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-100 mb-3">Exchange Rates</h2>
                <p className="text-slate-400 text-lg">All rates displayed in Canadian Dollars (CAD) • Updated in real-time</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {currencies.map((currency) => (
                  <CurrencyCard key={currency.code} currency={currency} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Ticker */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border-t border-slate-700/50 py-4 overflow-hidden">
            <div className="flex whitespace-nowrap animate-marquee">
              {[...tickerData, ...tickerData, ...tickerData].map((item, index) => (
                <span key={index} className="inline-block mx-12 text-slate-200 font-mono font-semibold text-lg">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Market Data */}
        <div className="col-span-3 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-l border-slate-700/50 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-cyan-400 font-bold text-xl mb-2">Market Watch</h2>
            <p className="text-slate-400 text-sm">Additional financial instruments</p>
          </div>

          {/* Market Instruments */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {marketData.map((item, index) => (
              <MarketInstrumentCard key={index} item={item} />
            ))}
          </div>

          {/* Large Yield Chart */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-4">
              <h3 className="text-cyan-400 font-semibold mb-3 text-lg">CA 10Y Yield Trend</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateChartData('up', 40)}>
                    <defs>
                      <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={['dataMin - 0.02', 'dataMax + 0.02']} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      fill="url(#yieldGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-slate-400 text-xs mt-3">Government of Canada 10-Year Bond Yield</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .animate-marquee {
          animation: marquee 90s linear infinite;
        }
        
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default SaadatExchangeDashboard;