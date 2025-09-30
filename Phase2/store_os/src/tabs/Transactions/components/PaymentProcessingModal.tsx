import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, AlertCircle, CreditCard, Zap } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import PaymentMethodSelector from './PaymentMethodSelector';
import type { PaymentMethod } from '../../../features/payments/types';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  onPaymentCompleted: (paymentData: any) => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  onPaymentCompleted
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'selecting' | 'processing' | 'completed' | 'failed'>('selecting');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('cash');
      setPaymentStatus('selecting');
      setPaymentData(null);
      setError(null);
    }
  }, [isOpen]);

  const handlePaymentProcessed = (data: any) => {
    setPaymentData(data);
    setPaymentStatus('completed');

    setTimeout(() => {
      onPaymentCompleted(data);
      onClose();
    }, 2000);
  };

  const handleConfirmPayment = () => {
    if (selectedMethod === 'cash') {
      // For cash payments, complete immediately
      const cashPaymentData = {
        paymentMethod: 'cash' as PaymentMethod,
        paymentReferenceId: `CASH-${Date.now()}`,
        paymentDetails: {}
      };
      handlePaymentProcessed(cashPaymentData);
    }
    // For other payment methods, the PaymentMethodSelector will handle the processing
  };

  const renderPaymentStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader className="h-8 w-8 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-600" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (paymentStatus === 'processing') {
      return (
        <div className="text-center py-8">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Payment</h3>
          <p className="text-gray-600">
            Processing {selectedMethod === 'cash' ? 'cash' : selectedMethod.replace('_', ' ')} payment...
          </p>
        </div>
      );
    }

    if (paymentStatus === 'completed') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Completed</h3>
          <p className="text-gray-600">
            Payment processed successfully!
          </p>
          {paymentData?.paymentReferenceId && (
            <p className="text-sm text-gray-500 mt-2">
              Reference: {paymentData.paymentReferenceId}
            </p>
          )}
        </div>
      );
    }

    if (paymentStatus === 'failed') {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h3>
          <p className="text-gray-600 mb-4">
            {error || 'An error occurred while processing the payment.'}
          </p>
          <button
            onClick={() => setPaymentStatus('selecting')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Payment</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {amount.toLocaleString()} {currency}
            </div>
            <div className="text-sm text-gray-600">Transaction Amount</div>
          </div>
        </div>

        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          amount={amount}
          currency={currency}
          onPaymentProcessed={handlePaymentProcessed}
        />

        {selectedMethod === 'cash' && (
          <div className="border-t pt-4">
            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Confirm Cash Payment
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={paymentStatus === 'processing' ? undefined : onClose}
      title={
        <div className="flex items-center">
          {paymentStatus === 'selecting' && selectedMethod === 'cash' && (
            <CreditCard className="h-5 w-5 text-green-600 mr-2" />
          )}
          {paymentStatus === 'selecting' && selectedMethod === 'stripe_terminal' && (
            <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
          )}
          {paymentStatus === 'selecting' && selectedMethod === 'cryptocurrency' && (
            <Zap className="h-5 w-5 text-orange-500 mr-2" />
          )}
          {renderPaymentStatusIcon()}
          <span className="ml-2">
            {paymentStatus === 'selecting' ? 'Payment Method' :
             paymentStatus === 'processing' ? 'Processing' :
             paymentStatus === 'completed' ? 'Payment Complete' :
             'Payment Failed'}
          </span>
        </div>
      }
      size="lg"
      hideCloseButton={paymentStatus === 'processing'}
    >
      {renderContent()}
    </Modal>
  );
};

export default PaymentProcessingModal;