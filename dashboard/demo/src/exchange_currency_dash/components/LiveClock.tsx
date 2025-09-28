import React, { useEffect, useState } from 'react';

const LiveClock: React.FC<{ tz?: string; fmt?: Intl.DateTimeFormatOptions }> = ({ tz = 'America/Toronto', fmt }) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const options: Intl.DateTimeFormatOptions = fmt || {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: tz
  };

  return (
    <span className="font-mono font-bold text-xs" style={{ color: '#00D4FF' }}>
      {now.toLocaleTimeString('en-CA', options)}
    </span>
  );
};

export default LiveClock;

