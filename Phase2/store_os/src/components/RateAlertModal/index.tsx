import React from 'react';
import { Modal } from '../Modal';
import { Bell, Calendar, Mail, Phone, DollarSign, AlertTriangle, Target } from 'lucide-react';
import { RateAlert } from '../../services/websiteService';

interface RateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateAlert: RateAlert | null;
  onTrigger?: (id: string) => void;
}

/**
 * RateAlertModal Component
 * 
 * Displays details of a rate alert and provides option to trigger it.
 */
const RateAlertModal: React.FC<RateAlertModalProps> = ({
  isOpen,
  onClose,
  rateAlert,
  onTrigger
}) => {
  if (!rateAlert) return null;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rate Alert Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Rate Alert #{rateAlert.id}</h3>
          </div>
          <div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              rateAlert.status === 'active' ? 'bg-green-100 text-green-800' :
              rateAlert.status === 'triggered' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {rateAlert.status.charAt(0).toUpperCase() + rateAlert.status.slice(1)}
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
                <div className="text-sm text-gray-600">{rateAlert.customerEmail}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Phone</div>
                <div className="text-sm text-gray-600">{rateAlert.customerPhone || 'Not provided'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Details */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Alert Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-900">Exchange</div>
              <div className="text-lg font-semibold text-gray-900">{rateAlert.fromCurrency} → {rateAlert.toCurrency}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Target Rate</div>
              <div className="text-lg font-semibold text-yellow-600">{rateAlert.targetRate}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Amount</div>
              <div className="text-lg font-semibold text-gray-900">
                {rateAlert.amount ? `${rateAlert.amount} ${rateAlert.fromCurrency}` : 'Not specified'}
              </div>
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
                <div className="text-sm text-gray-600">{formatDate(rateAlert.createdAt)}</div>
              </div>
            </div>
            {rateAlert.status === 'triggered' && rateAlert.triggeredAt && (
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Triggered</div>
                  <div className="text-sm text-gray-600">{formatDate(rateAlert.triggeredAt)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Market Rate */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Current Market Information</h4>
          <div className="flex items-start">
            <Target className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">Current Market Rate</div>
              <div className="text-sm text-gray-600">
                {/* In a real implementation, this would show the current market rate */}
                1 {rateAlert.fromCurrency} = 1.3450 {rateAlert.toCurrency}
                <span className="ml-2 text-sm text-yellow-600 font-medium">
                  (Target: {rateAlert.targetRate})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {rateAlert.status === 'active' && onTrigger && (
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onTrigger(rateAlert.id)}
              className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              Trigger Alert
            </button>
          </div>
        )}

        {/* Notification Preview */}
        {rateAlert.status === 'triggered' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Notification Sent to Customer</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your rate alert for {rateAlert.fromCurrency}/{rateAlert.toCurrency} at {rateAlert.targetRate} has been triggered!
                    Please visit our store or contact us to take advantage of this rate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RateAlertModal;