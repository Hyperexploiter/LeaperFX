// src/services/exchangeRateService.ts

const API_URL = 'https://api.frankfurter.app';

// --- Type Definitions ---
export interface RateData { [key: string]: number; }
export interface SupportedCurrency { value: string; label: string; }

/**
 * Fetches the latest exchange rates for a given base currency.
 */
export const fetchLatestRates = async (baseCurrency: string = 'CAD'): Promise<RateData | null> => {
  try {
    const response = await fetch(`${API_URL}/latest?from=${baseCurrency}`);
    if (!response.ok) throw new Error(`API Network Error: ${response.statusText}`);
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Failed to fetch latest rates:", error);
    return null;
  }
};

/**
 * Fetches historical exchange rates from the most recent day with available data,
 * intelligently skipping weekends and holidays.
 */
export const fetchHistoricalRate = async (baseCurrency: string = 'CAD'): Promise<RateData | null> => {
    let attempts = 0;
    const date = new Date();

    while (attempts < 7) {
        attempts++;
        date.setDate(date.getDate() - 1); // Go back one day
        const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

        try {
            console.log(`Attempting to fetch historical data for ${dateString}...`);
            const response = await fetch(`${API_URL}/${dateString}?from=${baseCurrency}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.rates) {
                    console.log(`Successfully fetched historical data for ${dateString}`);
                    return data.rates;
                }
            }
        } catch (error) {
            console.error(`Network error while fetching for ${dateString}:`, error);
            return null; // Stop trying on network error
        }
    }

    console.error("Failed to find any historical data after 7 attempts.");
    return null;
}

/**
 * Fetches the list of all supported currency codes.
 */
export const fetchSupportedCurrencies = async (): Promise<SupportedCurrency[]> => {
    try {
        const response = await fetch(`${API_URL}/currencies`);
        if (!response.ok) throw new Error(`API Network Error: ${response.statusText}`);
        const data = await response.json();
        return Object.entries(data).map(([code, name]) => ({
            value: code as string,
            label: `${code} - ${name as string}`
        }));
    } catch (error) {
        console.error("Failed to fetch supported currencies:", error);
        return [];
    }
}
