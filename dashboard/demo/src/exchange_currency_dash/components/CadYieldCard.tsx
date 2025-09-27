import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, CartesianGrid, Tooltip, XAxis } from 'recharts';
import unifiedDataAggregator, { MarketDataPoint } from '../services/unifiedDataAggregator';

const MAX_HISTORY_POINTS = 60;

const CadYieldCard: React.FC = () => {
  const [latestPoint, setLatestPoint] = useState<MarketDataPoint | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; value: number }>>([]);

  useEffect(() => {
    const unsubscribe = unifiedDataAggregator.subscribe('CA-30Y-YIELD', (md) => {
      const value = typeof md.priceCAD === 'number' && Number.isFinite(md.priceCAD)
        ? md.priceCAD
        : typeof md.price === 'number' && Number.isFinite(md.price)
          ? md.price
          : NaN;

      if (!Number.isFinite(value)) {
        return;
      }

      const rounded = Number(value.toFixed(3));
      setLatestPoint({ ...md, priceCAD: rounded });
      setHistory(prev => {
        const label = new Date(md.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const next = [...prev, { time: label, value: rounded }];
        return next.length > MAX_HISTORY_POINTS ? next.slice(-MAX_HISTORY_POINTS) : next;
      });
    });

    return () => {
      try { unsubscribe(); } catch { /* noop */ }
    };
  }, []);

  const chartData = useMemo(() => {
    if (history.length > 0) {
      return history;
    }
    const fallbackValue = latestPoint?.priceCAD ?? 4.5;
    return Array.from({ length: MAX_HISTORY_POINTS }, (_, idx) => ({
      time: `${idx}`,
      value: fallbackValue
    }));
  }, [history, latestPoint]);

  return (
    <div
      className="bg-black border transition-all duration-300 flex flex-col justify-between"
      style={{ borderColor: 'rgba(0, 212, 255, 0.15)', borderWidth: '0.5px' }}
    >
      <div className="p-4 pb-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#00D4FF' }}>
            CAD 30-Year Yield
          </h2>
          <span className="text-[10px] text-gray-500">
            {latestPoint ? new Date(latestPoint.timestamp).toLocaleDateString('en-CA') : '—'}
          </span>
        </div>
        <p className="text-2xl font-bold" style={{ color: '#FFB000' }}>
          {latestPoint ? `${latestPoint.priceCAD.toFixed(3)}%` : '—'}
        </p>
      </div>
      <div className="h-36 px-4 pb-4" style={{
        background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.15) 0%, rgba(0, 20, 35, 0.25) 50%, rgba(0, 8, 20, 0.35) 100%)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cadYieldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
                <stop offset="25%" stopColor="#FFB000" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#FF8C00" stopOpacity={0.4} />
                <stop offset="75%" stopColor="#FF6B00" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FF4500" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeWidth={0.5} vertical={false} horizontal={true} strokeDasharray="2 2" />
            <XAxis dataKey="time" hide tick={{ fill: '#666', fontSize: 9 }} />
            <YAxis tick={{ fill: '#666', fontSize: 9 }} domain={[ (dataMin: number) => dataMin - 0.1, (dataMax: number) => dataMax + 0.1 ]} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(0, 8, 20, 0.98)', border: '0.5px solid rgba(255, 215, 0, 0.3)', borderRadius: '2px', padding: '3px 6px' }}
              labelStyle={{ color: '#FFD700', fontSize: 10 }}
              itemStyle={{ color: '#FFB000', fontSize: 9 }}
            />
            <Area type="monotoneX" dataKey="value" stroke="#FFD700" strokeWidth={1.2} fill="url(#cadYieldGradient)" filter="drop-shadow(0 0 2px rgba(255, 215, 0, 0.3))" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CadYieldCard;
