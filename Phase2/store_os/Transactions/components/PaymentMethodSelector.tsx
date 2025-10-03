import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Zap, Smartphone, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import type { PaymentMethod, SupportedCrypto, TerminalDevice, ConnectionStatus } from '../../../features/payments/types';
import { paymentServices } from '../../../features/payments';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amount: number;
  currency: string;
  onPaymentProcessed?: (result: any) => void;
  className?: string;
}

interface CryptoOption {
  symbol: SupportedCrypto;
  name: string;
  icon: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  amount,
  currency,
  onPaymentProcessed,
  className = ''
}) => {
  const [terminalStatus, setTerminalStatus] = useState<ConnectionStatus | null>(null);
  const [availableDevices, setAvailableDevices] = useState<TerminalDevice[]>([]);
  const [cryptoRates, setCryptoRates] = useState<any[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto>('BTC');
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedCard, setSelectedCard] = useState<'debit' | 'credit'>('debit');

  const cryptoOptions: CryptoOption[] = [
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'SOL', name: 'Solana', icon: '◎' },
    { symbol: 'AVAX', name: 'Avalanche', icon: '🔺' },
    { symbol: 'USDC', name: 'USD Coin', icon: '$' }
  ];

  useEffect(() => {
    loadPaymentSystemStatus();
    if (selectedMethod === 'cryptocurrency') {
      loadCryptoRates();
    }
  }, [selectedMethod]);

  const loadPaymentSystemStatus = async () => {
    try {
      const systemStatus = paymentServices.main.getSystemStatus();
      setTerminalStatus(systemStatus.stripeTerminal.connectionStatus);
      setAvailableDevices(systemStatus.stripeTerminal.availableDevices);
    } catch (error) {
      console.error('Error loading payment system status:', error);
    }
  };

  const loadCryptoRates = async () => {
    try {
      const rates = await paymentServices.crypto.getCryptoRates();
      setCryptoRates(rates);
    } catch (error) {
      console.error('Error loading crypto rates:', error);
    }
  };

  const handleTerminalPayment = async () => {
    if (!terminalStatus?.device) return;

    setIsProcessingPayment(true);
    try {
      const paymentRequest = {
        amount,
        currency,
        description: `Currency exchange: ${amount} ${currency}`,
        metadata: {
          transactionType: 'currency_exchange',
          paymentType: selectedCard
        }
      };

      const result = await paymentServices.terminal.processPayment(paymentRequest);

      if (result.success && onPaymentProcessed) {
        onPaymentProcessed({
          paymentMethod: 'stripe_terminal',
          paymentResult: result,
          paymentReferenceId: result.paymentIntent?.id,
          paymentDetails: {
            terminalDeviceId: terminalStatus.device.id,
            cardLast4: result.paymentMethod?.cardDetails?.last4,
            cardBrand: result.paymentMethod?.cardDetails?.brand
          }
        });
      }
    } catch (error) {
      console.error('Terminal payment failed:', error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!cryptoWallet) return;

    setIsProcessingPayment(true);
    try {
      const cryptoRequest = {
        amount,
        cryptocurrency: selectedCrypto,
        recipientWallet: cryptoWallet,
        description: `Currency exchange: ${amount} ${currency}`,
        metadata: {
          transactionType: 'currency_exchange'
        }
      };

      const result = await paymentServices.crypto.processPayment(cryptoRequest);

      if (result.success && onPaymentProcessed) {
        const rate = cryptoRates.find(r => r.symbol === selectedCrypto);
        onPaymentProcessed({
          paymentMethod: 'cryptocurrency',
          paymentResult: result,
          paymentReferenceId: result.txHash,
          paymentDetails: {
            cryptoTxHash: result.txHash,
            cryptoWallet: cryptoWallet,
            cryptoAmount: result.amountCrypto,
            exchangeRate: rate?.priceCAD
          }
        });
      }
    } catch (error) {
      console.error('Crypto payment failed:', error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getCryptoAmount = (cryptoSymbol: SupportedCrypto) => {
    const rate = cryptoRates.find(r => r.symbol === cryptoSymbol);
    return rate ? (amount / rate.priceCAD).toFixed(8) : '0';
  };

  const renderCashOption = () => (
    <div
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        selectedMethod === 'cash'
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onMethodChange('cash')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Cash</h3>
            <p className="text-sm text-gray-500">Traditional cash payment</p>
          </div>
        </div>
        {selectedMethod === 'cash' && (
          <CheckCircle className="h-5 w-5 text-blue-500" />
        )}
      </div>
    </div>
  );

  const renderTerminalOption = () => (
    <div
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        selectedMethod === 'stripe_terminal'
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onMethodChange('stripe_terminal')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Card Payment</h3>
            <p className="text-sm text-gray-500">Debit/Credit/Interac via Terminal</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {terminalStatus?.status === 'connected' ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          {selectedMethod === 'stripe_terminal' && (
            <CheckCircle className="h-5 w-5 text-blue-500" />
          )}
        </div>
      </div>

      {selectedMethod === 'stripe_terminal' && (
        <div className="mt-4 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCard('debit');
              }}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                selectedCard === 'debit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Debit Card
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCard('credit');
              }}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                selectedCard === 'credit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Credit Card
            </button>
          </div>

          {terminalStatus?.status === 'connected' && terminalStatus.device && (
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {terminalStatus.device.label}
                  </p>
                  <p className="text-xs text-green-600">
                    {terminalStatus.device.deviceType} • Ready
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTerminalPayment();
                  }}
                  disabled={isProcessingPayment}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </div>
          )}

          {terminalStatus?.status !== 'connected' && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Terminal not connected. Please connect a terminal device first.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderInteracOption = () => (
    <div
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        selectedMethod === 'interac'
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onMethodChange('interac')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Smartphone className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Interac</h3>
            <p className="text-sm text-gray-500">Interac debit payment</p>
          </div>
        </div>
        {selectedMethod === 'interac' && (
          <CheckCircle className="h-5 w-5 text-blue-500" />
        )}
      </div>
    </div>
  );

  const renderCryptoOption = () => (
    <div
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        selectedMethod === 'cryptocurrency'
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onMethodChange('cryptocurrency')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Zap className="h-6 w-6 text-orange-500 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Cryptocurrency</h3>
            <p className="text-sm text-gray-500">Bitcoin, Ethereum, and more</p>
          </div>
        </div>
        {selectedMethod === 'cryptocurrency' && (
          <CheckCircle className="h-5 w-5 text-blue-500" />
        )}
      </div>

      {selectedMethod === 'cryptocurrency' && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Cryptocurrency
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cryptoOptions.map((crypto) => (
                <button
                  key={crypto.symbol}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCrypto(crypto.symbol);
                  }}
                  className={`p-2 rounded text-sm font-medium transition-colors ${
                    selectedCrypto === crypto.symbol
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{crypto.icon}</span>
                  {crypto.symbol}
                </button>
              ))}
            </div>
          </div>

          {cryptoRates.length > 0 && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">
                <strong>Amount:</strong> {getCryptoAmount(selectedCrypto)} {selectedCrypto}
              </div>
              <div className="text-xs text-gray-500">
                Rate: {cryptoRates.find(r => r.symbol === selectedCrypto)?.priceCAD?.toLocaleString()} CAD
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Wallet Address
            </label>
            <input
              type="text"
              value={cryptoWallet}
              onChange={(e) => setCryptoWallet(e.target.value)}
              placeholder={`Enter ${selectedCrypto} wallet address`}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {cryptoWallet && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCryptoPayment();
              }}
              disabled={isProcessingPayment}
              className="w-full py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {isProcessingPayment ? 'Processing...' : `Pay with ${selectedCrypto}`}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
        <div className="space-y-3">
          {renderCashOption()}
          {renderTerminalOption()}
          {renderInteracOption()}
          {renderCryptoOption()}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;