import React from 'react';
import { Modal } from '../Modal';
import { Lock, Calendar, Mail, Phone, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { RateLock } from '../../services/websiteService';

interface RateLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateLock: RateLock | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

/**
 * RateLockModal Component
 * 
 * Displays details of a rate lock and provides options to complete or cancel it.
 */
const RateLockModal: React.FC<RateLockModalProps> = ({
  isOpen,
  onClose,
  rateLock,
  onComplete,
  onCancel
}) => {
  if (!rateLock) return null;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time remaining for rate locks
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expired';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMinutes}m`;
    }
  };

  // Calculate total value
  const totalValue = rateLock.amount * rateLock.rate;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rate Lock Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Rate Lock #{rateLock.id}</h3>
          </div>
          <div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              rateLock.status === 'active' ? 'bg-green-100 text-green-800' :
              rateLock.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              rateLock.status === 'expired' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {rateLock.status.charAt(0).toUpperCase() + rateLock.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Customer Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Email</div>
                <div className="text-sm text-gray-600">{rateLock.customerEmail}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Phone</div>
                <div className="text-sm text-gray-600">{rateLock.customerPhone || 'Not provided'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Details */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Exchange Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-900">From</div>
              <div className="text-lg font-semibold text-gray-900">{rateLock.amount} {rateLock.fromCurrency}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">To</div>
              <div className="text-lg font-semibold text-gray-900">{totalValue.toFixed(2)} {rateLock.toCurrency}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Rate</div>
              <div className="text-lg font-semibold text-blue-600">{rateLock.rate}</div>
            </div>
          </div>
        </div>

        {/* Timing Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Timing Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Created</div>
                <div className="text-sm text-gray-600">{formatDate(rateLock.createdAt)}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Expires</div>
                <div className="text-sm text-gray-600">
                  {formatDate(rateLock.expiresAt)}
                  {rateLock.status === 'active' && (
                    <span className="ml-2 text-blue-600 font-medium">
                      ({getTimeRemaining(rateLock.expiresAt)} remaining)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Information (if completed) */}
        {rateLock.status === 'completed' && rateLock.transactionId && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Transaction Information</h4>
            <div className="flex items-start">
              <DollarSign className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Transaction ID</div>
                <div className="text-sm text-gray-600">#{rateLock.transactionId}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {rateLock.status === 'active' && (
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onComplete(rateLock.id)}
              className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Complete Exchange
            </button>
            <button
              onClick={() => onCancel(rateLock.id)}
              className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Cancel Rate Lock
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RateLockModal;