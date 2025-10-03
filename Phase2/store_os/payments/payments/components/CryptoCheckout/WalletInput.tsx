import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  QrCode,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { paymentServices } from '../../index';
import type { SupportedCrypto, WalletValidationResult } from '../../types';

interface WalletInputProps {
  cryptocurrency: SupportedCrypto;
  onSubmit: (recipientWallet: string, senderWallet?: string) => void;
  onBack: () => void;
  requireSenderWallet?: boolean;
}

const WalletInput: React.FC<WalletInputProps> = ({
  cryptocurrency,
  onSubmit,
  onBack,
  requireSenderWallet = false
}) => {
  const [recipientWallet, setRecipientWallet] = useState('');
  const [senderWallet, setSenderWallet] = useState('');
  const [recipientValidation, setRecipientValidation] = useState<WalletValidationResult | null>(null);
  const [senderValidation, setSenderValidation] = useState<WalletValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced validation
  useEffect(() => {
    if (recipientWallet.trim()) {
      const timer = setTimeout(() => validateWallet(recipientWallet, 'recipient'), 500);
      return () => clearTimeout(timer);
    } else {
      setRecipientValidation(null);
    }
  }, [recipientWallet, cryptocurrency]);

  useEffect(() => {
    if (senderWallet.trim()) {
      const timer = setTimeout(() => validateWallet(senderWallet, 'sender'), 500);
      return () => clearTimeout(timer);
    } else {
      setSenderValidation(null);
    }
  }, [senderWallet, cryptocurrency]);

  const validateWallet = async (address: string, type: 'recipient' | 'sender') => {
    if (!address.trim()) return;

    setIsValidating(true);
    try {
      const result = paymentServices.crypto.validateWalletAddress(address, cryptocurrency);

      if (type === 'recipient') {
        setRecipientValidation(result);
      } else {
        setSenderValidation(result);
      }
    } catch (err) {
      console.error('Wallet validation error:', err);
      const errorResult: WalletValidationResult = {
        isValid: false,
        format: 'unknown',
        network: 'unknown',
        cryptocurrency: 'unknown',
        error: 'Validation failed'
      };

      if (type === 'recipient') {
        setRecipientValidation(errorResult);
      } else {
        setSenderValidation(errorResult);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const getValidationIcon = (validation: WalletValidationResult | null) => {
    if (!validation) return null;

    if (validation.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getValidationMessage = (validation: WalletValidationResult | null) => {
    if (!validation) return null;

    if (validation.isValid) {
      return (
        <div className="text-sm text-green-700">
          Valid {validation.cryptocurrency} address ({validation.format} format, {validation.network} network)
          {validation.confidence && ` - Confidence: ${validation.confidence}%`}
        </div>
      );
    } else {
      return (
        <div className="text-sm text-red-700">
          {validation.error || 'Invalid wallet address format'}
        </div>
      );
    }
  };

  const getPlaceholderText = (crypto: SupportedCrypto) => {
    switch (crypto) {
      case 'BTC':
        return 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 (Bech32) or 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa (Legacy)';
      case 'ETH':
      case 'USDC':
        return '0x742bC5d7D2D7Dd5a8C1E2a44bdF1a8C91E5C8D5A (ERC-20)';
      case 'SOL':
        return '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM (Solana)';
      case 'AVAX':
        return 'X-avax1d7m5vr6z8z9x4g5h6j7k8l9m0n1p2q3r4s5t6u7v8w9x0y1z2 (Avalanche)';
      default:
        return 'Enter wallet address';
    }
  };

  const getHelpText = (crypto: SupportedCrypto) => {
    const formats = {
      BTC: ['Legacy (1...)', 'SegWit (3...)', 'Bech32 (bc1...)'],
      ETH: ['ERC-20 (0x...)'],
      SOL: ['Base58 encoded'],
      AVAX: ['X-Chain (X-avax...), C-Chain (0x...)'],
      USDC: ['ERC-20 (0x...) - Ethereum network']
    };

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Supported {crypto} address formats:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {formats[crypto]?.map((format, index) => (
            <li key={index}>{format}</li>
          ))}
        </ul>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Make sure the address belongs to the correct network.
            Sending to the wrong network may result in permanent loss of funds.
          </p>
        </div>
      </div>
    );
  };

  const handleSubmit = () => {
    setError(null);

    // Validate required fields
    if (!recipientWallet.trim()) {
      setError('Recipient wallet address is required');
      return;
    }

    if (requireSenderWallet && !senderWallet.trim()) {
      setError('Sender wallet address is required');
      return;
    }

    // Check validation results
    if (!recipientValidation?.isValid) {
      setError('Please enter a valid recipient wallet address');
      return;
    }

    if (requireSenderWallet && senderWallet.trim() && !senderValidation?.isValid) {
      setError('Please enter a valid sender wallet address');
      return;
    }

    // Check if sender and recipient are the same
    if (senderWallet.trim() && recipientWallet.trim() === senderWallet.trim()) {
      setError('Sender and recipient addresses cannot be the same');
      return;
    }

    onSubmit(recipientWallet.trim(), senderWallet.trim() || undefined);
  };

  const handlePasteAddress = async (type: 'recipient' | 'sender') => {
    try {
      const text = await navigator.clipboard.readText();
      if (type === 'recipient') {
        setRecipientWallet(text);
      } else {
        setSenderWallet(text);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  const canSubmit = () => {
    const hasValidRecipient = recipientValidation?.isValid === true;
    const hasValidSender = !requireSenderWallet ||
      !senderWallet.trim() ||
      senderValidation?.isValid === true;

    return hasValidRecipient && hasValidSender && !isValidating;
  };

  return (
    <div className="space-y-6">
      {/* Recipient Wallet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipient Wallet Address *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Wallet className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={recipientWallet}
            onChange={(e) => setRecipientWallet(e.target.value)}
            className={`block w-full pl-10 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              recipientValidation === null ? 'border-gray-300' :
              recipientValidation.isValid ? 'border-green-300' : 'border-red-300'
            }`}
            placeholder={getPlaceholderText(cryptocurrency)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
            {isValidating && recipientWallet && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            {recipientValidation && getValidationIcon(recipientValidation)}
            <button
              type="button"
              onClick={() => handlePasteAddress('recipient')}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Paste from clipboard"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowQrScanner(true)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Scan QR code"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </div>
        </div>
        {recipientValidation && (
          <div className="mt-2">
            {getValidationMessage(recipientValidation)}
          </div>
        )}
      </div>

      {/* Sender Wallet (Optional) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Sender Wallet Address {requireSenderWallet && '*'}
          </label>
          <span className="text-xs text-gray-500">Optional for tracking</span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Wallet className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={senderWallet}
            onChange={(e) => setSenderWallet(e.target.value)}
            className={`block w-full pl-10 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              senderValidation === null ? 'border-gray-300' :
              senderValidation.isValid ? 'border-green-300' : 'border-red-300'
            }`}
            placeholder={`Your ${cryptocurrency} wallet address (optional)`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
            {isValidating && senderWallet && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            {senderValidation && getValidationIcon(senderValidation)}
            <button
              type="button"
              onClick={() => handlePasteAddress('sender')}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Paste from clipboard"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
        {senderValidation && (
          <div className="mt-2">
            {getValidationMessage(senderValidation)}
          </div>
        )}
        {!requireSenderWallet && (
          <p className="mt-1 text-xs text-gray-500">
            Providing your wallet address helps with transaction tracking and customer support
          </p>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center">
            <HelpCircle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Need help with {cryptocurrency} addresses?
            </span>
          </div>
          {showHelp ? (
            <EyeOff className="h-4 w-4 text-blue-600" />
          ) : (
            <Eye className="h-4 w-4 text-blue-600" />
          )}
        </button>

        {showHelp && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            {getHelpText(cryptocurrency)}
          </div>
        )}
      </div>

      {/* Security Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-800">Important Security Notice</h4>
            <div className="mt-1 text-sm text-amber-700 space-y-1">
              <p>• Double-check all wallet addresses before proceeding</p>
              <p>• Cryptocurrency transactions are irreversible</p>
              <p>• Ensure the address belongs to the correct network</p>
              <p>• Never share your private keys or seed phrases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex items-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>

      {/* QR Scanner Modal (placeholder) */}
      {showQrScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
              <button
                onClick={() => setShowQrScanner(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-center py-8">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">QR code scanner integration would go here</p>
              <button
                onClick={() => setShowQrScanner(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletInput;