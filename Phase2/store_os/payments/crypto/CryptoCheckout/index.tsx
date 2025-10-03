import React, { useState, useEffect } from 'react';
import {
  Zap,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  ArrowRight,
  Shield,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import WalletInput from './WalletInput';
import CryptoRatesDisplay from './CryptoRatesDisplay';
import { paymentServices } from '../../index';
import type { CryptoPaymentRequest, CryptoPaymentResult, SupportedCrypto, CryptoRate } from '../../types';

interface CryptoCheckoutProps {
  amount: number;
  description?: string;
  customerEmail?: string;
  onPaymentComplete?: (result: CryptoPaymentResult) => void;
  onCancel?: () => void;
  className?: string;
}

type CheckoutStep = 'currency' | 'wallet' | 'confirm' | 'processing' | 'complete' | 'error';

const CryptoCheckout: React.FC<CryptoCheckoutProps> = ({
  amount,
  description,
  customerEmail,
  onPaymentComplete,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('currency');
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto | null>(null);
  const [recipientWallet, setRecipientWallet] = useState('');
  const [senderWallet, setSenderWallet] = useState('');
  const [networkFee, setNetworkFee] = useState<'low' | 'medium' | 'high'>('medium');
  const [rates, setRates] = useState<CryptoRate[]>([]);
  const [paymentResult, setPaymentResult] = useState<CryptoPaymentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);

  useEffect(() => {
    loadCryptoRates();
  }, []);

  useEffect(() => {
    if (selectedCrypto && rates.length > 0) {
      calculateEstimate();
    }
  }, [selectedCrypto, amount, networkFee, rates]);

  const loadCryptoRates = async () => {
    try {
      const cryptoRates = await paymentServices.crypto.getCryptoRates(true);
      setRates(cryptoRates);
    } catch (err) {
      setError('Failed to load cryptocurrency rates');
      console.error('Error loading crypto rates:', err);
    }
  };

  const calculateEstimate = () => {
    if (!selectedCrypto || rates.length === 0) return;

    const rate = rates.find(r => r.symbol === selectedCrypto);
    if (!rate) return;

    const cryptoAmount = amount / rate.priceCAD;
    setEstimatedAmount(cryptoAmount);

    // Estimate network fees (simplified)
    const feeMultipliers = { low: 0.5, medium: 1, high: 2 };
    const baseFees = {
      BTC: 0.0001,
      ETH: 0.002,
      SOL: 0.00025,
      AVAX: 0.001,
      USDC: 0.002
    };

    const estimatedNetworkFee = (baseFees[selectedCrypto] || 0.001) * feeMultipliers[networkFee];
    setEstimatedFee(estimatedNetworkFee);
  };

  const handleCryptoSelection = (crypto: SupportedCrypto) => {
    setSelectedCrypto(crypto);
    setCurrentStep('wallet');
  };

  const handleWalletSubmit = (recipientAddr: string, senderAddr?: string) => {
    setRecipientWallet(recipientAddr);
    if (senderAddr) setSenderWallet(senderAddr);
    setCurrentStep('confirm');
  };

  const handleConfirmPayment = () => {
    setCurrentStep('processing');
    processPayment();
  };

  const processPayment = async () => {
    if (!selectedCrypto || !recipientWallet) {
      setError('Missing required payment information');
      setCurrentStep('error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: CryptoPaymentRequest = {
        amount,
        description,
        cryptocurrency: selectedCrypto,
        recipientWallet,
        senderWallet: senderWallet || undefined,
        networkFeePreference: networkFee,
        confirmationThreshold: 1,
        customerEmail
      };

      const result = await paymentServices.crypto.processPayment(request);
      setPaymentResult(result);

      if (result.success) {
        setCurrentStep('complete');
        onPaymentComplete?.(result);
      } else {
        setError(result.error || 'Payment processing failed');
        setCurrentStep('error');
      }
    } catch (err) {
      setError('Payment processing failed');
      setCurrentStep('error');
      console.error('Payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedRate = () => {
    return rates.find(r => r.symbol === selectedCrypto);
  };

  const getCryptoIcon = (symbol: string) => {
    // In a real implementation, you might use actual crypto icons
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

  const formatCrypto = (amount: number, symbol: string) => {
    const decimals = symbol === 'BTC' ? 8 : symbol === 'ETH' ? 6 : 4;
    return `${amount.toFixed(decimals)} ${symbol}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const renderCurrencySelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Cryptocurrency</h3>
        <p className="text-gray-600">Choose which cryptocurrency you'd like to use for payment.</p>
        <div className="mt-4 text-2xl font-bold text-gray-900">
          {formatCurrency(amount)}
        </div>
      </div>

      <CryptoRatesDisplay
        rates={rates}
        onCryptoSelect={handleCryptoSelection}
        selectedCrypto={selectedCrypto}
        showSelection={true}
      />
    </div>
  );

  const renderWalletInput = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {selectedCrypto && getCryptoIcon(selectedCrypto)}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter Wallet Details</h3>
        <p className="text-gray-600">Provide the wallet addresses for this {selectedCrypto} transaction.</p>
      </div>

      <WalletInput
        cryptocurrency={selectedCrypto!}
        onSubmit={handleWalletSubmit}
        onBack={() => setCurrentStep('currency')}
      />
    </div>
  );

  const renderConfirmation = () => {
    const rate = getSelectedRate();

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Payment</h3>
          <p className="text-gray-600">Review the payment details before processing.</p>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Payment Summary</h4>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount (CAD):</span>
              <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Cryptocurrency:</span>
              <div className="flex items-center">
                {selectedCrypto && getCryptoIcon(selectedCrypto)}
                <span className="ml-2 font-medium text-gray-900">{selectedCrypto}</span>
              </div>
            </div>

            {rate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate:</span>
                <span className="font-medium text-gray-900">
                  1 {selectedCrypto} = {formatCurrency(rate.priceCAD)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Amount ({selectedCrypto}):</span>
              <span className="font-medium text-gray-900">
                {formatCrypto(estimatedAmount, selectedCrypto!)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Network Fee ({networkFee}):</span>
              <span className="font-medium text-gray-900">
                {formatCrypto(estimatedFee, selectedCrypto!)}
              </span>
            </div>

            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="font-semibold text-gray-900">
                {formatCrypto(estimatedAmount + estimatedFee, selectedCrypto!)}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Details */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-4">Wallet Information</h4>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-blue-800">Recipient Wallet:</span>
              <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                {recipientWallet}
              </div>
            </div>

            {senderWallet && (
              <div>
                <span className="font-medium text-blue-800">Sender Wallet:</span>
                <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                  {senderWallet}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Network Fee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network Fee Priority
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => setNetworkFee(priority)}
                className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                  networkFee === priority
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium capitalize">{priority}</div>
                <div className="text-xs text-gray-500">
                  {priority === 'low' && '~1-2 hours'}
                  {priority === 'medium' && '~10-30 min'}
                  {priority === 'high' && '~1-5 min'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentStep('wallet')}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConfirmPayment}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Process Payment
          </button>
        </div>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
        <p className="text-gray-600">
          Your {selectedCrypto} payment is being processed. This may take a few moments.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-left">
            <h4 className="text-sm font-medium text-yellow-800">Please Wait</h4>
            <p className="mt-1 text-sm text-yellow-700">
              Do not close this window while the payment is being processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">
          Your {selectedCrypto} payment has been processed successfully.
        </p>
      </div>

      {paymentResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
          <h4 className="font-semibold text-green-900 mb-4">Transaction Details</h4>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Transaction ID:</span>
              <span className="font-mono text-green-900">{paymentResult.transactionId}</span>
            </div>

            {paymentResult.txHash && (
              <div className="flex justify-between">
                <span className="text-green-700">Transaction Hash:</span>
                <div className="flex items-center">
                  <span className="font-mono text-green-900 text-xs mr-2">
                    {paymentResult.txHash.substring(0, 10)}...{paymentResult.txHash.substring(-10)}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(paymentResult.txHash!)}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="Copy hash"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-green-700">Amount:</span>
              <span className="font-medium text-green-900">
                {formatCrypto(paymentResult.amountCrypto || 0, selectedCrypto!)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-green-700">CAD Equivalent:</span>
              <span className="font-medium text-green-900">
                {formatCurrency(paymentResult.amountCAD)}
              </span>
            </div>

            {paymentResult.networkFee && (
              <div className="flex justify-between">
                <span className="text-green-700">Network Fee:</span>
                <span className="font-medium text-green-900">
                  {formatCrypto(paymentResult.networkFee, selectedCrypto!)}
                </span>
              </div>
            )}
          </div>

          {paymentResult.blockExplorerUrl && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <a
                href={paymentResult.blockExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-green-700 hover:text-green-900"
              >
                View on Block Explorer
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onCancel}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Close
      </button>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h3>
        <p className="text-gray-600">
          There was an issue processing your cryptocurrency payment.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={() => {
            setCurrentStep('currency');
            setError(null);
            setPaymentResult(null);
          }}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'currency':
        return renderCurrencySelection();
      case 'wallet':
        return renderWalletInput();
      case 'confirm':
        return renderConfirmation();
      case 'processing':
        return renderProcessing();
      case 'complete':
        return renderComplete();
      case 'error':
        return renderError();
      default:
        return renderCurrencySelection();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'currency':
        return 'Select Cryptocurrency';
      case 'wallet':
        return 'Wallet Information';
      case 'confirm':
        return 'Confirm Payment';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Payment Complete';
      case 'error':
        return 'Payment Failed';
      default:
        return 'Crypto Payment';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-yellow-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">{getStepTitle()}</h2>
          </div>

          {onCancel && currentStep !== 'processing' && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {description && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {renderCurrentStep()}
      </div>

      {/* Security Notice */}
      {(currentStep === 'wallet' || currentStep === 'confirm') && (
        <div className="px-6 pb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Security Notice</h4>
                <p className="mt-1 text-sm text-amber-700">
                  Cryptocurrency transactions are irreversible. Please verify all wallet addresses carefully before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoCheckout;