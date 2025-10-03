import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Save,
  Settings,
  DollarSign,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { paymentServices } from '../../index';
import type { CryptoRate, SupportedCrypto, CryptoConfiguration } from '../../types';

interface CryptoPaymentConfigProps {
  onRefresh?: () => void;
}

const CryptoPaymentConfig: React.FC<CryptoPaymentConfigProps> = ({ onRefresh }) => {
  const [rates, setRates] = useState<CryptoRate[]>([]);
  const [config, setConfig] = useState<CryptoConfiguration>({
    supportedCurrencies: ['BTC', 'ETH', 'SOL', 'AVAX', 'USDC'],
    rateUpdateInterval: 30000, // 30 seconds
    confirmationThresholds: {
      BTC: 1,
      ETH: 12,
      SOL: 1,
      AVAX: 1,
      USDC: 12
    },
    networkFeePreferences: {
      BTC: { low: 1, medium: 5, high: 10 },
      ETH: { low: 20, medium: 30, high: 50 },
      SOL: { low: 0.00025, medium: 0.0005, high: 0.001 },
      AVAX: { low: 0.001, medium: 0.005, high: 0.01 },
      USDC: { low: 20, medium: 30, high: 50 }
    },
    walletValidationLevel: 'extended'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastRateUpdate, setLastRateUpdate] = useState<string | null>(null);

  useEffect(() => {
    loadCryptoRates();
  }, []);

  const loadCryptoRates = async (forceRefresh = false) => {
    setIsRefreshingRates(true);
    setError(null);
    try {
      const cryptoRates = await paymentServices.crypto.getCryptoRates(forceRefresh);
      setRates(cryptoRates);
      setLastRateUpdate(new Date().toISOString());
      if (forceRefresh) {
        setSuccess('Rates updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to load cryptocurrency rates');
      console.error('Error loading crypto rates:', err);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real implementation, this would save the configuration
      // For now, we'll simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Configuration saved successfully');
      onRefresh?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save configuration');
      console.error('Error saving config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyToggle = (currency: SupportedCrypto) => {
    setConfig(prev => ({
      ...prev,
      supportedCurrencies: prev.supportedCurrencies.includes(currency)
        ? prev.supportedCurrencies.filter(c => c !== currency)
        : [...prev.supportedCurrencies, currency]
    }));
  };

  const updateConfirmationThreshold = (currency: SupportedCrypto, value: number) => {
    setConfig(prev => ({
      ...prev,
      confirmationThresholds: {
        ...prev.confirmationThresholds,
        [currency]: value
      }
    }));
  };

  const updateNetworkFee = (currency: SupportedCrypto, level: 'low' | 'medium' | 'high', value: number) => {
    setConfig(prev => ({
      ...prev,
      networkFeePreferences: {
        ...prev.networkFeePreferences,
        [currency]: {
          ...prev.networkFeePreferences[currency],
          [level]: value
        }
      }
    }));
  };

  const getCryptoIcon = (symbol: string) => {
    // In a real implementation, you might use actual crypto icons
    return <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
      {symbol}
    </div>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 mr-1" />
        )}
        {Math.abs(change).toFixed(2)}%
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Rates Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-orange-900">Current Crypto Rates</h3>
          <button
            onClick={() => loadCryptoRates(true)}
            disabled={isRefreshingRates}
            className="flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshingRates ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {lastRateUpdate && (
          <p className="text-sm text-orange-700 mb-4">
            Last updated: {new Date(lastRateUpdate).toLocaleString()}
          </p>
        )}

        {isRefreshingRates ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-8 text-orange-600">
            <Zap className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <p className="text-lg font-medium">No rates available</p>
            <p className="mt-2">Unable to fetch cryptocurrency rates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rates.map((rate) => (
              <div key={rate.symbol} className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getCryptoIcon(rate.symbol)}
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900">{rate.symbol}</h4>
                    </div>
                  </div>
                  {formatChange(rate.change24h)}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {formatPrice(rate.priceCAD)}
                </div>
                <div className="text-sm text-gray-500">
                  Confidence: {rate.confidence ? `${rate.confidence}%` : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Section */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Cryptocurrency Configuration</h3>
          <button
            onClick={handleSaveConfig}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </button>
        </div>

        <div className="space-y-6">
          {/* Supported Currencies */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Supported Cryptocurrencies</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(['BTC', 'ETH', 'SOL', 'AVAX', 'USDC'] as SupportedCrypto[]).map((currency) => (
                <label key={currency} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={config.supportedCurrencies.includes(currency)}
                    onChange={() => handleCurrencyToggle(currency)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900">{currency}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rate Update Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate Update Interval (seconds)
            </label>
            <select
              value={config.rateUpdateInterval / 1000}
              onChange={(e) => setConfig(prev => ({ ...prev, rateUpdateInterval: parseInt(e.target.value) * 1000 }))}
              className="w-full md:w-48 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              How frequently to update cryptocurrency rates
            </p>
          </div>

          {/* Wallet Validation Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Validation Level
            </label>
            <select
              value={config.walletValidationLevel}
              onChange={(e) => setConfig(prev => ({ ...prev, walletValidationLevel: e.target.value as 'basic' | 'extended' }))}
              className="w-full md:w-48 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="basic">Basic</option>
              <option value="extended">Extended</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Level of validation for wallet addresses
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Thresholds */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmation Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.supportedCurrencies.map((currency) => (
            <div key={currency} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                {getCryptoIcon(currency)}
                <h4 className="ml-2 font-medium text-gray-900">{currency}</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Confirmations
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.confirmationThresholds[currency]}
                  onChange={(e) => updateConfirmationThreshold(currency, parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Fee Preferences */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Fee Preferences</h3>
        <div className="space-y-6">
          {config.supportedCurrencies.map((currency) => (
            <div key={currency} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                {getCryptoIcon(currency)}
                <h4 className="ml-2 font-medium text-gray-900">{currency}</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <div key={level}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {level} Priority
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.000001"
                        value={config.networkFeePreferences[currency][level]}
                        onChange={(e) => updateNetworkFee(currency, level, parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">
                        {currency === 'BTC' || currency === 'SOL' || currency === 'AVAX' ? currency : 'Gwei'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Security Notice</h3>
            <p className="mt-1 text-sm text-amber-700">
              Cryptocurrency transactions are irreversible. Always verify wallet addresses and amounts before processing payments.
              Consider implementing additional verification steps for large transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
};

export default CryptoPaymentConfig;