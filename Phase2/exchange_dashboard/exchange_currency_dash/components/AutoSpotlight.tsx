import React, { useEffect, useMemo, useState } from 'react';
import { HighPerformanceSparkline } from './HighPerformanceSparkline';
import { getSparklineTheme } from '../services/themePresets';

interface EngineLike {
  getBuffer: (symbol: string) => any;
  engineState: { topSignal: { symbol: string } | null };
}

interface AutoSpotlightProps {
  engine: EngineLike;
  forexSymbols: string[]; // engine keys like USDCAD, EURCAD
  commoditySymbols: string[]; // engine keys like XAUCAD, XAGCAD
  cryptoSymbols?: string[]; // engine keys like BTCCAD
  intervalMs?: number;
  show?: boolean;
}

const AutoSpotlight: React.FC<AutoSpotlightProps> = ({
  engine,
  forexSymbols,
  commoditySymbols,
  cryptoSymbols = [],
  intervalMs = 12000,
  show = true
}) => {
  const playlist = useMemo(() => {
    // Alternate FX → Commodity → Crypto
    const out: { key: string; cat: 'forex' | 'commodity' | 'crypto' }[] = [];
    const maxLen = Math.max(forexSymbols.length, commoditySymbols.length, cryptoSymbols.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < forexSymbols.length) out.push({ key: forexSymbols[i], cat: 'forex' });
      if (i < commoditySymbols.length) out.push({ key: commoditySymbols[i], cat: 'commodity' });
      if (i < cryptoSymbols.length) out.push({ key: cryptoSymbols[i], cat: 'crypto' });
    }
    return out;
  }, [forexSymbols, commoditySymbols, cryptoSymbols]);

  const [index, setIndex] = useState(0);
  const current = playlist.length > 0 ? playlist[index % playlist.length] : null;

  useEffect(() => {
    if (!show || playlist.length === 0) return;
    const id = setInterval(() => setIndex(i => (i + 1)), intervalMs);
    return () => clearInterval(id);
  }, [show, playlist, intervalMs]);

  if (!show || !current) return null;

  const th = getSparklineTheme(current.cat);
  const name = current.key;
  const buf = engine.getBuffer(current.key);

  return (
    <div className="pointer-events-none absolute bottom-16 right-6 z-30" style={{ width: 320 }}>
      <div
        className="bloomberg-terminal-card"
        style={{ padding: '8px', borderWidth: '0.5px' }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-bold" style={{ color: '#FFA500', fontFamily: 'monospace' }}>
            SPOTLIGHT
          </div>
          <div className="text-xs font-mono" style={{ color: '#00D4FF' }}>{name}</div>
        </div>
        <HighPerformanceSparkline
          symbol={name}
          buffer={buf}
          width={300}
          height={120}
          color={th.colorUp}
          glowIntensity={th.glowIntensity}
          showStats={false}
          isSignalActive={false}
          volatilityAdaptive={true}
          baseLineWidth={th.baseLineWidth}
          maxLineWidth={th.maxLineWidth}
          smoothingFactor={th.smoothingFactor}
          expandOnHover={false}
        />
      </div>
    </div>
  );
};

export default AutoSpotlight;

