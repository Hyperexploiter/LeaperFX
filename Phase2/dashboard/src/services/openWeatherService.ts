/**
 * OpenWeather Service (current conditions)
 * Env: VITE_OPENWEATHER_KEY, VITE_WEATHER_CITY (e.g., Toronto,CA) or VITE_WEATHER_LAT/LON
 */

export interface WeatherNow {
  name: string;
  tempC: number;
  icon: string; // openweather icon code
  description: string;
}

function readEnv(key: string): string | undefined {
  try {
    const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.[key] : undefined;
    const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.[key] : undefined;
    const node = (typeof process !== 'undefined') ? (process as any).env?.[key] : undefined;
    return (vite as any) || (win as any) || (node as any);
  } catch { return undefined; }
}

export async function getCurrentWeather(): Promise<WeatherNow | null> {
  try {
    const apiKey = readEnv('VITE_OPENWEATHER_KEY');
    if (!apiKey) return null;
    const city = readEnv('VITE_WEATHER_CITY');
    const lat = readEnv('VITE_WEATHER_LAT');
    const lon = readEnv('VITE_WEATHER_LON');
    let url = '';
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    } else if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
      return null;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const j: any = await res.json();
    const tempC = typeof j?.main?.temp === 'number' ? j.main.temp : NaN;
    const icon = (j?.weather?.[0]?.icon) || '01d';
    const description = (j?.weather?.[0]?.description) || '';
    const name = j?.name || (city || '');
    return { name, tempC, icon, description };
  } catch {
    return null;
  }
}

export default { getCurrentWeather };

