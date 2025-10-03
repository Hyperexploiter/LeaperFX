// src/services/exchangeRateService.ts

const API_URL = 'https://api.frankfurter.app';
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// --- Type Definitions ---
export interface RateData { [key: string]: number; }
export interface SupportedCurrency { value: string; label: string; }

// Fallback rates data (updated as of August 2025)
const FALLBACK_RATES: RateData = {
  AUD: 1.1159,
  BGN: 1.2221,
  BRL: 3.9509,
  CHF: 0.58801,
  CNY: 5.2288,
  CZK: 15.2759,
  DKK: 4.6637,
  EUR: 0.62488,
  GBP: 0.54184,
  HKD: 5.7137,
  HUF: 247.38,
  IDR: 11836,
  ILS: 2.5013,
  INR: 63.776,
  ISK: 89.36,
  JPY: 107.59,
  KRW: 1012.27,
  MXN: 13.5381,
  MYR: 3.0862,
  NOK: 7.4698,
  NZD: 1.2224,
  PHP: 41.424,
  PLN: 2.6564,
  RON: 3.1697,
  SEK: 6.9849,
  SGD: 0.93539,
  THB: 23.561,
  TRY: 29.617,
  USD: 0.72786,
  ZAR: 12.8901
};

/**
 * Creates a fetch request with timeout
 */
const fetchWithTimeout = async (url: string, timeout: number = REQUEST_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Delay function for retry mechanism
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches the latest exchange rates for a given base currency with retry mechanism.
 */
export const fetchLatestRates = async (baseCurrency: string = 'CAD'): Promise<RateData | null> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching latest rates (attempt ${attempt}/${MAX_RETRIES}) for ${baseCurrency}`);
      
      const response = await fetchWithTimeout(`${API_URL}/latest?from=${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`API Network Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.rates) {
        throw new Error('Invalid response format: missing rates data');
      }
      
      console.log(`✅ Successfully fetched latest rates for ${baseCurrency}`);
      return data.rates;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ Attempt ${attempt} failed:`, error);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
        await delay(RETRY_DELAY * attempt); // Exponential backoff
      }
    }
  }
  
  // All attempts failed, log the error and return fallback data
  console.error("❌ All attempts to fetch latest rates failed. Using fallback data.", lastError);
  console.log("📊 Using fallback exchange rates (may not be current)");
  
  // Return fallback rates to prevent complete failure
  return FALLBACK_RATES;
};

/**
 * Fetches historical exchange rates from the most recent day with available data,
 * intelligently skipping weekends and holidays with retry mechanism.
 */
export const fetchHistoricalRate = async (baseCurrency: string = 'CAD'): Promise<RateData | null> => {
    let attempts = 0;
    const date = new Date();

    while (attempts < 7) {
        attempts++;
        date.setDate(date.getDate() - 1); // Go back one day
        const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

        // Try to fetch historical data for this date with retry mechanism
        for (let retryAttempt = 1; retryAttempt <= MAX_RETRIES; retryAttempt++) {
            try {
                console.log(`Fetching historical rates for ${dateString} (attempt ${retryAttempt}/${MAX_RETRIES})`);
                
                const response = await fetchWithTimeout(`${API_URL}/${dateString}?from=${baseCurrency}`);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.rates) {
                        console.log(`✅ Successfully fetched historical rates for ${dateString}`);
                        return data.rates;
                    }
                }
                
                // If response is not ok, try next date
                break;
                
            } catch (error) {
                console.warn(`❌ Historical rate fetch attempt ${retryAttempt} failed for ${dateString}:`, error);
                
                // If this is not the last retry attempt, wait before retrying
                if (retryAttempt < MAX_RETRIES) {
                    await delay(RETRY_DELAY * retryAttempt);
                } else {
                    // If all retries failed for this date, try the next date
                    break;
                }
            }
        }
    }

    console.warn("❌ No historical data found after checking 7 days. Using fallback data.");
    // Return fallback rates as historical data
    return FALLBACK_RATES;
}

// Fallback supported currencies data
const FALLBACK_CURRENCIES: SupportedCurrency[] = [
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'BGN', label: 'BGN - Bulgarian Lev' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'CZK', label: 'CZK - Czech Koruna' },
    { value: 'DKK', label: 'DKK - Danish Krone' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
    { value: 'HUF', label: 'HUF - Hungarian Forint' },
    { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
    { value: 'ILS', label: 'ILS - Israeli Shekel' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'ISK', label: 'ISK - Icelandic Krona' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'KRW', label: 'KRW - South Korean Won' },
    { value: 'MXN', label: 'MXN - Mexican Peso' },
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'NOK', label: 'NOK - Norwegian Krone' },
    { value: 'NZD', label: 'NZD - New Zealand Dollar' },
    { value: 'PHP', label: 'PHP - Philippine Peso' },
    { value: 'PLN', label: 'PLN - Polish Zloty' },
    { value: 'RON', label: 'RON - Romanian Leu' },
    { value: 'SEK', label: 'SEK - Swedish Krona' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'THB', label: 'THB - Thai Baht' },
    { value: 'TRY', label: 'TRY - Turkish Lira' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'ZAR', label: 'ZAR - South African Rand' }
];

/**
 * Fetches the list of all supported currency codes with retry mechanism.
 */
export const fetchSupportedCurrencies = async (): Promise<SupportedCurrency[]> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Fetching supported currencies (attempt ${attempt}/${MAX_RETRIES})`);
            
            const response = await fetchWithTimeout(`${API_URL}/currencies`);
            
            if (!response.ok) {
                throw new Error(`API Network Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format: expected currency object');
            }
            
            const currencies = Object.entries(data).map(([code, name]) => ({
                value: code as string,
                label: `${code} - ${name as string}`
            }));
            
            console.log(`✅ Successfully fetched ${currencies.length} supported currencies`);
            return currencies;
            
        } catch (error) {
            lastError = error as Error;
            console.warn(`❌ Attempt ${attempt} failed:`, error);
            
            // If this is not the last attempt, wait before retrying
            if (attempt < MAX_RETRIES) {
                console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
                await delay(RETRY_DELAY * attempt);
            }
        }
    }
    
    // All attempts failed, log the error and return fallback data
    console.error("❌ All attempts to fetch supported currencies failed. Using fallback data.", lastError);
    console.log("📊 Using fallback currency list");
    
    return FALLBACK_CURRENCIES;
}
