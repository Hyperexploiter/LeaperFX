import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Modal, Toast, ConfirmDialog } from '../../components/Modal';
import RateEditor from '../../components/RateEditor';
import CSVImport from '../../components/CSVImport';
import webSocketService from '../../services/webSocketService';

// Inventory Management Tab (extracted)
const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [newStock, setNewStock] = useState({ currency: 'USD', amount: '', buyRate: '' });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null); // error setter only (value not used)
  const [isAddingStock, setIsAddingStock] = useState<boolean>(false);
  
  // Modal and Toast states
  const [showConfirmAddStock, setShowConfirmAddStock] = useState<boolean>(false);
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
  
  // Fetch inventory data on component mount
  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Import the inventory service dynamically to avoid circular dependencies
        const { default: inventoryService } = await import('../../services/inventoryService');
        
        const inventoryData = await inventoryService.getInventory();
        setInventory(inventoryData || []); // Ensure we have an array even if service fails
      } catch (err) {
        setError('Failed to fetch inventory data');
        console.error('Inventory fetch error:', err);
        // Set empty array to prevent further errors
        setInventory([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a small delay to prevent blocking the main thread
    const timer = setTimeout(fetchInventory, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Set up WebSocket for real-time inventory updates
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        // Connect to WebSocket (don't block if this fails)
        void webSocketService.connect().catch(err => console.warn('WebSocket connection failed:', err));
        
        // Subscribe to inventory updates
        const unsubscribe = webSocketService.subscribe((event) => {
          if (event.type === 'inventory_update') {
            // Refresh inventory data when an update is received
            const fetchInventory = async () => {
              try {
                const { default: inventoryService } = await import('../../services/inventoryService');
                const inventoryData = await inventoryService.getInventory();
                setInventory(inventoryData || []);
              } catch (err) {
                console.error('Failed to refresh inventory:', err);
              }
            };
            
            void fetchInventory();
          }
        });
        
        // Clean up WebSocket connection on component unmount
        return () => {
          try {
            unsubscribe();
            webSocketService.disconnect();
          } catch (err) {
            console.warn('WebSocket cleanup failed:', err);
          }
        };
      } catch (err) {
        console.error('Failed to set up WebSocket:', err);
        // Don't let WebSocket errors crash the component
      }
    };
    
    void setupWebSocket();
  }, []);
  
  // Function to validate stock input
  const validateStockInput = () => {
    const amount = parseFloat(newStock.amount);
    const buyRate = parseFloat(newStock.buyRate);
    
    if (isNaN(amount) || isNaN(buyRate)) {
      showToast('error', 'Please enter valid numbers');
      return false;
    }
    
    return true;
  };
  
  // Function to show confirmation dialog
  const confirmAddStock = () => {
    if (!validateStockInput()) return;
    
    // Show confirmation dialog
    setShowConfirmAddStock(true);
  };
  
  // Function to actually add stock after confirmation
  const handleAddStock = async () => {
    setIsAddingStock(true);
    setError(null);
    
    try {
      const amount = parseFloat(newStock.amount);
      const buyRate = parseFloat(newStock.buyRate);
      
      // Import the inventory service dynamically
      const { default: inventoryService } = await import('../../services/inventoryService');
      
      // Add stock to inventory
      const addedStock = await inventoryService.addStock({
        currency: newStock.currency,
        amount,
        buyRate
      });
      
      // Reset form
      setNewStock({ currency: 'USD', amount: '', buyRate: '' });
      
      // Refresh inventory data
      const inventoryData = await inventoryService.getInventory();
      setInventory(inventoryData);
      
      // Show success message
      setShowSuccessModal(true);
      showToast('success', `Successfully added ${amount} ${newStock.currency} to inventory`);
      
      // Return the added stock data
      return {
        success: true,
        data: addedStock,
        message: `Successfully added ${amount} ${newStock.currency} to inventory`
      };
    } catch (err) {
      setError('Failed to add stock');
      setShowErrorModal(true);
      showToast('error', 'Failed to add stock to inventory');
      console.error(err);
      
      // Return error information
      return {
        success: false,
        error: err,
        message: 'Failed to add stock to inventory'
      };
    } finally {
      setIsAddingStock(false);
      setShowConfirmAddStock(false);
    }
  };
  
  // Function to handle rate updates
  const handleRateUpdate = async (currency: string, buyRate: number, sellRate: number) => {
    try {
      // Import the inventory service dynamically
      const { default: inventoryService } = await import('../../services/inventoryService');
      
      // Find the inventory item for this currency
      const inventoryItem = inventory.find(item => item.currency === currency);
      
      if (inventoryItem) {
        // Update the inventory item with new rates
        await inventoryService.updateInventoryItem(inventoryItem.id, {
          buyRate,
          sellRate
        });
        
        // Refresh inventory data
        const inventoryData = await inventoryService.getInventory();
        setInventory(inventoryData);
        
        // Notify via WebSocket to update client dashboard
        webSocketService.send({
          type: 'rate_update',
          data: { currency, buyRate, sellRate }
        });
      }
    } catch (err) {
      console.error('Failed to update rates:', err);
      showToast('error', 'Failed to update rates');
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Rate Editor */}
      <div className="mb-6">
        <RateEditor onRateUpdate={handleRateUpdate} />
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Current Inventory</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {isLoading && inventory.length === 0 ? (
            <div className="flex justify-center items-center p-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No inventory data available
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.buyRate.toFixed(4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.sellRate.toFixed(4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.lastUpdated}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.amount < 1000 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Low
                        </span>
                      ) : item.amount < 3000 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Medium
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Good
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* CSV Import Section */}
      <div className="mb-6">
        <CSVImport 
          type="inventory" 
          onImportComplete={() => {
            // Refresh inventory after import
            const fetchInventory = async () => {
              try {
                const { default: inventoryService } = await import('../../services/inventoryService');
                const inventoryData = await inventoryService.getInventory();
                setInventory(inventoryData);
              } catch (err) {
                console.error('Failed to refresh inventory:', err);
              }
            };
            void fetchInventory();
          }} 
        />
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Stock</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select 
              value={newStock.currency}
              onChange={(e) => setNewStock({...newStock, currency: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isAddingStock}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="AUD">AUD</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input 
              type="number"
              value={newStock.amount}
              onChange={(e) => setNewStock({...newStock, amount: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
              disabled={isAddingStock}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buy Rate</label>
            <input 
              type="number"
              value={newStock.buyRate}
              onChange={(e) => setNewStock({...newStock, buyRate: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter buy rate"
              step="0.0001"
              disabled={isAddingStock}
            />
          </div>
        </div>
        <button 
          onClick={confirmAddStock}
          disabled={isAddingStock}
          className={`mt-4 flex items-center justify-center py-2 px-4 rounded-lg text-white transition-colors ${
            isAddingStock ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isAddingStock ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            'Add Stock'
          )}
        </button>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmAddStock}
        onClose={() => setShowConfirmAddStock(false)}
        onConfirm={handleAddStock}
        title="Confirm Add Stock"
        message={`Are you sure you want to add ${newStock.amount} ${newStock.currency} to inventory with buy rate ${newStock.buyRate}?`}
        confirmText="Add Stock"
        cancelText="Cancel"
        type="info"
      />
      
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Stock Added Successfully"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            The currency stock has been successfully added to your inventory.
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
        title="Failed to Add Stock"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            There was an error adding stock to your inventory. Please try again.
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

export default InventoryManagement;
