# Dashboard Integration Guide

This guide explains how to integrate the LeaperFX dashboard with the secure backend API.

## 🔄 Integration Steps

### 1. Update Environment Variables

Add to your dashboard's `.env.local`:

```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=dev-secret-key-12345

# Production
# VITE_API_BASE_URL=https://your-backend.vercel.app
# VITE_API_KEY=your-production-api-key
```

### 2. Create API Client

Create `/src/services/apiClient.ts`:

```typescript
/**
 * API Client for LeaperFX Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-secret-key-12345';

export class ApiClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Request-ID': crypto.randomUUID(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  }

  // Data Methods
  async getForexRates(pairs: string[]): Promise<any> {
    return this.request(`/api/data/forex?pairs=${pairs.join(',')}`);
  }

  async getCryptoPrices(symbols: string[]): Promise<any> {
    return this.request(`/api/data/crypto?symbols=${symbols.join(',')}`);
  }

  async getCommodityPrices(symbols: string[]): Promise<any> {
    return this.request(`/api/data/commodities?symbols=${symbols.join(',')}`);
  }

  async getIndicesData(symbols: string[]): Promise<any> {
    return this.request(`/api/data/indices?symbols=${symbols.join(',')}`);
  }

  async getYieldsData(instruments: string[]): Promise<any> {
    return this.request(`/api/data/yields?instruments=${instruments.join(',')}`);
  }

  // Configuration Methods
  async getConfiguration(key?: string): Promise<any> {
    const params = key ? `?key=${key}` : '';
    return this.request(`/api/config/get${params}`);
  }

  async setConfiguration(config: any): Promise<any> {
    return this.request('/api/config/set', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getProfiles(): Promise<any> {
    return this.request('/api/config/profiles');
  }

  async createProfile(profile: any): Promise<any> {
    return this.request('/api/config/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  // Health Check
  async getHealth(): Promise<any> {
    return this.request('/api/health');
  }
}

export const apiClient = new ApiClient();
```

### 3. Update Provider Services

Replace API key usage in your provider services:

#### Update `polygonFxProvider.ts`:

```typescript
import { apiClient } from '../apiClient';

export async function getFxRate(pair: string): Promise<number | null> {
  try {
    const rates = await apiClient.getForexRates([pair]);
    const rate = rates.find((r: any) => r.pair === pair);
    return rate ? rate.rate : null;
  } catch (error) {
    console.error('[Polygon] Error:', error);
    return null;
  }
}
```

#### Update `coinbaseWebSocketService.ts`:

```typescript
import { apiClient } from '../apiClient';

// Replace direct API calls with backend proxy
export async function getCryptoPrices(symbols: string[]): Promise<any> {
  try {
    return await apiClient.getCryptoPrices(symbols);
  } catch (error) {
    console.error('[Crypto] Error:', error);
    return [];
  }
}
```

#### Update `twelveDataProvider.ts`:

```typescript
import { apiClient } from '../apiClient';

export async function getCommodityPrices(symbols: string[]): Promise<any> {
  try {
    return await apiClient.getCommodityPrices(symbols);
  } catch (error) {
    console.error('[Commodities] Error:', error);
    return [];
  }
}
```

### 4. Update Configuration Manager

Replace local storage with backend API:

```typescript
// src/services/BackendConfigurationManager.ts
import { apiClient } from './apiClient';

export class BackendConfigurationManager {
  async getValue(key: string): Promise<any> {
    try {
      const config = await apiClient.getConfiguration(key);
      return config?.value;
    } catch (error) {
      console.warn(`[Config] Error getting ${key}:`, error);
      return null;
    }
  }

  async setValue(key: string, value: any, category = 'general'): Promise<boolean> {
    try {
      await apiClient.setConfiguration({
        key,
        value,
        category,
      });
      return true;
    } catch (error) {
      console.error(`[Config] Error setting ${key}:`, error);
      return false;
    }
  }

  async getAllValues(): Promise<Record<string, any>> {
    try {
      const configs = await apiClient.getConfiguration();
      const values: Record<string, any> = {};
      configs.forEach((config: any) => {
        values[config.key] = config.value;
      });
      return values;
    } catch (error) {
      console.error('[Config] Error getting all values:', error);
      return {};
    }
  }
}

export const backendConfigManager = new BackendConfigurationManager();
```

### 5. Update Real-Time Data Manager

Modify to use backend endpoints:

```typescript
// src/services/realTimeDataManager.ts
import { apiClient } from './apiClient';

class RealTimeDataManager {
  async fetchMarketData(): Promise<void> {
    try {
      // Fetch all data types in parallel
      const [forex, crypto, commodities, indices, yields] = await Promise.all([
        apiClient.getForexRates(['USD/CAD', 'EUR/USD', 'GBP/USD']),
        apiClient.getCryptoPrices(['BTC', 'ETH', 'SOL', 'AVAX']),
        apiClient.getCommodityPrices(['GOLD', 'SILVER', 'OIL']),
        apiClient.getIndicesData(['SPX', 'DJI', 'IXIC']),
        apiClient.getYieldsData(['CA_2Y', 'CA_5Y', 'CA_10Y']),
      ]);

      this.updateState({
        forex,
        crypto,
        commodities,
        indices,
        yields,
        lastUpdate: Date.now(),
      });
    } catch (error) {
      console.error('[RealTimeData] Fetch error:', error);
    }
  }
}
```

### 6. Update Configuration Panel

Connect to backend configuration:

```typescript
// src/components/ConfigurationPanel/hooks/useConfigurationState.ts
import { backendConfigManager } from '../../../services/BackendConfigurationManager';

export function useConfigurationState() {
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Load configuration from backend
    backendConfigManager.getAllValues().then(setConfig);
  }, []);

  const updateValue = async (key: string, value: any) => {
    const success = await backendConfigManager.setValue(key, value);
    if (success) {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  return { config, updateValue };
}
```

## 🚀 Deployment Integration

### Frontend Deployment

1. **Update Build Script** (`package.json`):
```json
{
  "scripts": {
    "build:prod": "VITE_API_BASE_URL=https://your-backend.vercel.app npm run build"
  }
}
```

2. **Environment Variables** (Vercel):
```bash
vercel env add VITE_API_BASE_URL production
# Enter: https://your-backend.vercel.app

vercel env add VITE_API_KEY production
# Enter: your-production-api-key
```

### Backend URL Configuration

Update your backend's CORS settings to allow your dashboard domain:

```bash
vercel env add CORS_ORIGIN production
# Enter: https://your-dashboard.vercel.app
```

## 🧪 Testing Integration

### 1. Test Local Development

```bash
# Start backend
cd Phase2/backend
npm run dev

# Start dashboard (in another terminal)
cd Phase2/dashboard
npm run dev

# Test integration
curl http://localhost:3000/api/health
```

### 2. Test Production

```bash
# Deploy backend
cd Phase2/backend
./scripts/deploy.sh production

# Update dashboard environment
cd Phase2/dashboard
vercel env add VITE_API_BASE_URL production

# Deploy dashboard
vercel --prod
```

## 🔧 Migration Checklist

- [ ] Remove hardcoded API keys from frontend
- [ ] Replace direct API calls with backend proxy calls
- [ ] Update configuration management to use backend
- [ ] Test all data endpoints
- [ ] Verify CORS configuration
- [ ] Test rate limiting
- [ ] Validate error handling
- [ ] Monitor performance impact
- [ ] Update documentation

## 🚨 Important Security Notes

1. **Never expose API keys in frontend code**
2. **Always use environment variables for sensitive data**
3. **Validate all API responses**
4. **Implement proper error boundaries**
5. **Monitor API usage and costs**

## 📊 Performance Considerations

- **Caching**: Backend provides intelligent caching
- **Rate Limits**: Respect backend rate limits
- **Error Handling**: Implement retry logic with exponential backoff
- **Monitoring**: Monitor API response times

The backend is designed to maintain your dashboard's sub-12ms frame budget requirements while providing secure, scalable data access.