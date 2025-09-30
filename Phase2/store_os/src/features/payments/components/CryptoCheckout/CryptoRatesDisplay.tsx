import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  DollarSign,
  Zap
} from 'lucide-react';
import type { CryptoRate, SupportedCrypto } from '../../types';

interface CryptoRatesDisplayProps {
  rates: CryptoRate[];
  onCryptoSelect?: (crypto: SupportedCrypto) => void;
  selectedCrypto?: SupportedCrypto | null;
  showSelection?: boolean;
  compact?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const CryptoRatesDisplay: React.FC<CryptoRatesDisplayProps> = ({
  rates,
  onCryptoSelect,
  selectedCrypto,
  showSelection = false,
  compact = false,
  refreshable = false,
  onRefresh,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  useEffect(() => {
    if (rates.length > 0) {
      setLastUpdateTime(new Date());
    }
  }, [rates]);

  const getCryptoIcon = (symbol: string) => {
    const colors = {
      BTC: 'from-orange-400 to-yellow-500',
      ETH: 'from-blue-400 to-purple-500',
      SOL: 'from-purple-400 to-pink-500',
      AVAX: 'from-red-400 to-orange-500',
      USDC: 'from-blue-400 to-blue-600'
    };

    return (
      <div className={`w-10 h-10 bg-gradient-to-br ${colors[symbol as keyof typeof colors] || 'from-gray-400 to-gray-600'} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
        {symbol}
      </div>
    );
  };

  const getCryptoName = (symbol: string) => {
    const names = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      AVAX: 'Avalanche',
      USDC: 'USD Coin'
    };
    return names[symbol as keyof typeof names] || symbol;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price > 1000 ? 0 : price > 100 ? 2 : price > 1 ? 4 : 8
    }).format(price);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="font-medium">
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
    );
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence?: number) => {
    if (!confidence) return <AlertTriangle className="h-4 w-4" />;
    if (confidence >= 90) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 70) return <Clock className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const sortedRates = [...rates].sort((a, b) => {
    let aValue: number | string, bValue: number | string;

    switch (sortBy) {
      case 'symbol':
        aValue = a.symbol;
        bValue = b.symbol;
        break;
      case 'price':
        aValue = a.priceCAD;
        bValue = b.priceCAD;
        break;
      case 'change':
        aValue = a.change24h;
        bValue = b.change24h;
        break;
      default:
        aValue = a.symbol;
        bValue = b.symbol;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (field: 'symbol' | 'price' | 'change') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCryptoClick = (crypto: SupportedCrypto) => {
    if (showSelection && onCryptoSelect) {
      onCryptoSelect(crypto);
    }
  };

  const formatLastUpdate = () => {
    const minutes = Math.floor((Date.now() - lastUpdateTime.getTime()) / 60000);
    if (minutes < 1) return 'Just updated';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {sortedRates.map((rate) => (
          <div
            key={rate.symbol}
            onClick={() => handleCryptoClick(rate.symbol)}
            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
              showSelection
                ? selectedCrypto === rate.symbol
                  ? 'border-blue-500 bg-blue-50 cursor-pointer'
                  : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              {getCryptoIcon(rate.symbol)}
              <div className="ml-3">
                <div className="font-medium text-gray-900">{rate.symbol}</div>
                <div className="text-sm text-gray-500">{formatPrice(rate.priceCAD)}</div>
              </div>
            </div>
            <div className="text-right">
              {formatChange(rate.change24h)}
              {rate.confidence && (
                <div className={`text-xs mt-1 ${getConfidenceColor(rate.confidence)}`}>
                  {rate.confidence}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Cryptocurrency Rates</h3>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {formatLastUpdate()}
            </div>

            {refreshable && onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh rates"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {showSelection && (
          <p className="mt-2 text-sm text-gray-600">
            Select a cryptocurrency to continue with your payment.
          </p>
        )}
      </div>

      {/* Sorting Controls */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <button
            onClick={() => handleSort('symbol')}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              sortBy === 'symbol'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('price')}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              sortBy === 'price'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('change')}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              sortBy === 'change'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            24h Change {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Rates List */}
      <div className="divide-y divide-gray-200">
        {sortedRates.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">No rates available</p>
            <p className="mt-2 text-gray-600">Unable to fetch cryptocurrency rates at this time.</p>
          </div>
        ) : (
          sortedRates.map((rate) => (
            <div
              key={rate.symbol}
              onClick={() => handleCryptoClick(rate.symbol)}
              className={`px-6 py-4 transition-colors ${
                showSelection
                  ? selectedCrypto === rate.symbol
                    ? 'bg-blue-50 border-l-4 border-blue-500 cursor-pointer'
                    : 'hover:bg-gray-50 cursor-pointer'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getCryptoIcon(rate.symbol)}
                  <div className="ml-4">
                    <div className="flex items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {rate.symbol}
                      </span>
                      {showSelection && selectedCrypto === rate.symbol && (
                        <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getCryptoName(rate.symbol)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Price */}
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(rate.priceCAD)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${rate.priceUSD.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8
                      })} USD
                    </div>
                  </div>

                  {/* 24h Change */}
                  <div className="text-right min-w-[80px]">
                    {formatChange(rate.change24h)}
                  </div>

                  {/* Volume */}
                  <div className="text-right min-w-[100px] hidden md:block">
                    <div className="text-sm font-medium text-gray-900">
                      ${(rate.volume24h / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">24h Volume</div>
                  </div>

                  {/* Market Cap */}
                  <div className="text-right min-w-[100px] hidden lg:block">
                    <div className="text-sm font-medium text-gray-900">
                      ${(rate.marketCap / 1000000000).toFixed(1)}B
                    </div>
                    <div className="text-xs text-gray-500">Market Cap</div>
                  </div>

                  {/* Confidence */}
                  {rate.confidence && (
                    <div className={`flex items-center ${getConfidenceColor(rate.confidence)}`}>
                      {getConfidenceIcon(rate.confidence)}
                      <span className="ml-1 text-sm font-medium">
                        {rate.confidence}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div>
                  Source: {rate.source}
                </div>
                <div>
                  Updated: {new Date(rate.lastUpdated).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {rates.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {rates.length} cryptocurrencies
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Prices in CAD
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoRatesDisplay;