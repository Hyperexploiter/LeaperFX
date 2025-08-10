import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Modal, Toast, ConfirmDialog } from '../Modal';

interface RateEditorProps {
  onRateUpdate: (currency: string, buyRate: number, sellRate: number) => Promise<void>;
}

interface CurrencyRate {
  currency: string;
  buyRate: number;
  sellRate: number;
  lastUpdated: string;
}

const RateEditor: React.FC<RateEditorProps> = ({ onRateUpdate }) => {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<CurrencyRate | null>(null);
  const [newBuyRate, setNewBuyRate] = useState<string>('');
  const [newSellRate, setNewSellRate] = useState<string>('');
  
  // Modal and Toast states
  const [showConfirmUpdate, setShowConfirmUpdate] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning' | 'info', message: string, visible: boolean}>({
    type: 'success',
    message: '',
    visible: false
  });
  
  // Helper functions for toast notifications
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message, visible: true });
  };
  
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };
  
  // Fetch rates on component mount
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Import the inventory service dynamically to avoid circular dependencies
        const { default: inventoryService } = await import('../../services/inventoryService');
        
        // Fetch inventory items which contain currency rates
        const inventory = await inventoryService.getInventory();
        
        // Map inventory items to currency rates
        const currencyRates: CurrencyRate[] = inventory.map(item => ({
          currency: item.currency,
          buyRate: item.buyRate,
          sellRate: item.sellRate,
          lastUpdated: item.lastUpdated || new Date().toISOString().split('T')[0]
        }));
        
        setRates(currencyRates);
      } catch (err) {
        setError('Failed to fetch currency rates');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRates();
  }, []);
  
  // Start editing a rate
  const handleEditRate = (rate: CurrencyRate) => {
    setEditingRate(rate);
    setNewBuyRate(rate.buyRate.toString());
    setNewSellRate(rate.sellRate.toString());
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingRate(null);
    setNewBuyRate('');
    setNewSellRate('');
  };
  
  // Validate rate input
  const validateRateInput = () => {
    const buyRate = parseFloat(newBuyRate);
    const sellRate = parseFloat(newSellRate);
    
    if (isNaN(buyRate) || isNaN(sellRate)) {
      showToast('error', 'Please enter valid numbers');
      return false;
    }
    
    if (buyRate >= sellRate) {
      showToast('error', 'Sell rate must be higher than buy rate');
      return false;
    }
    
    return true;
  };
  
  // Show confirmation dialog
  const confirmUpdateRate = () => {
    if (!editingRate) return;
    if (!validateRateInput()) return;
    
    setShowConfirmUpdate(true);
  };
  
  // Update rate after confirmation
  const handleUpdateRate = async () => {
    if (!editingRate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const buyRate = parseFloat(newBuyRate);
      const sellRate = parseFloat(newSellRate);
      
      // Call the onRateUpdate prop function
      await onRateUpdate(editingRate.currency, buyRate, sellRate);
      
      // Update local state
      const updatedRates = rates.map(rate => 
        rate.currency === editingRate.currency 
          ? { 
              ...rate, 
              buyRate, 
              sellRate, 
              lastUpdated: new Date().toISOString().split('T')[0] 
            } 
          : rate
      );
      
      setRates(updatedRates);
      setEditingRate(null);
      setNewBuyRate('');
      setNewSellRate('');
      
      // Show success message
      setShowSuccessModal(true);
      showToast('success', `Successfully updated ${editingRate.currency} rates`);
    } catch (err) {
      setError('Failed to update rate');
      setShowErrorModal(true);
      showToast('error', 'Failed to update currency rate');
      console.error(err);
    } finally {
      setIsLoading(false);
      setShowConfirmUpdate(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Currency Rate Management</h3>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && rates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading rates...
                  </div>
                </td>
              </tr>
            ) : rates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No currency rates available
                </td>
              </tr>
            ) : (
              rates.map(rate => (
                <tr key={rate.currency} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{rate.currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRate?.currency === rate.currency ? (
                      <input
                        type="number"
                        value={newBuyRate}
                        onChange={(e) => setNewBuyRate(e.target.value)}
                        className="w-24 p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.0001"
                      />
                    ) : (
                      rate.buyRate.toFixed(4)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRate?.currency === rate.currency ? (
                      <input
                        type="number"
                        value={newSellRate}
                        onChange={(e) => setNewSellRate(e.target.value)}
                        className="w-24 p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.0001"
                      />
                    ) : (
                      rate.sellRate.toFixed(4)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{rate.lastUpdated}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRate?.currency === rate.currency ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={confirmUpdateRate}
                          disabled={isLoading}
                          className="p-1 text-green-600 hover:text-green-900"
                          title="Save"
                        >
                          <Save className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-600 hover:text-gray-900"
                          title="Cancel"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditRate(rate)}
                        className="p-1 text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmUpdate}
        onClose={() => setShowConfirmUpdate(false)}
        onConfirm={handleUpdateRate}
        title="Confirm Rate Update"
        message={`Are you sure you want to update ${editingRate?.currency} rates? This will affect all future transactions.`}
        confirmText="Update Rates"
        cancelText="Cancel"
        type="warning"
      />
      
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Rates Updated Successfully"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            The currency rates have been successfully updated.
          </p>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Continue
          </button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Failed to Update Rates"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            There was an error updating the currency rates. Please try again.
          </p>
          <button
            onClick={() => setShowErrorModal(false)}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};

export default RateEditor;