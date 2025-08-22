// Enhanced Client Management with FINTRAC Compliance
import EnhancedClientManagement from './EnhancedClientManagement';

// Export the enhanced version
export default EnhancedClientManagement;

// Legacy import for backward compatibility
import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, FileText } from 'lucide-react';
import { Modal, Toast } from '../Modal';
import CSVImport from '../CSVImport';
import customerService from '../../services/customerService';
import webSocketService from '../../services/webSocketService';
import transactionService from '../../services/transactionService';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  occupation?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  idType?: string;
  idNumber?: string;
  photoId?: string;
  createdAt: string;
  lastTransaction?: string;
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
  kycStatus?: 'pending' | 'verified' | 'rejected';
}

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [showEditClientModal, setShowEditClientModal] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning' | 'info', message: string, visible: boolean}>({
    type: 'success',
    message: '',
    visible: false
  });

  // Latest transaction per client (summary)
  const [lastTxMap, setLastTxMap] = useState<Record<string, {
    date: string;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    commission?: number;
    profit?: number;
    effectiveRate?: number;
  }>>({});

  // Client details modal
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [detailsTransactions, setDetailsTransactions] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // Form state for adding/editing clients
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    occupation: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Canada',
    idType: '',
    idNumber: '',
    photoId: ''
  });

  // Helper functions for toast notifications
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message, visible: true });
  };
  
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Load clients on component mount
  useEffect(() => {
    void loadClients();
  }, []);

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [clients, searchTerm]);

  const loadClients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const clientData = await customerService.getAllCustomers();
      setClients(clientData || []);
    } catch (err) {
      setError('Failed to load clients');
      console.error('Error loading clients:', err);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute latest transaction per client
  const refreshLastTransactions = async () => {
    try {
      const map: Record<string, { date: string; fromCurrency: string; toCurrency: string; fromAmount: number; toAmount: number; commission?: number; profit?: number; effectiveRate?: number; }> = {};
      for (const c of clients) {
        try {
          const txns = await transactionService.getTransactionsByCustomerId(c.id);
          if (txns && txns.length > 0) {
            const latest = txns[0];
            const effectiveRate = latest.fromAmount > 0 ? latest.toAmount / latest.fromAmount : undefined;
            map[c.id] = {
              date: latest.date,
              fromCurrency: latest.fromCurrency,
              toCurrency: latest.toCurrency,
              fromAmount: latest.fromAmount,
              toAmount: latest.toAmount,
              commission: latest.commission,
              profit: latest.profit,
              effectiveRate
            };
          }
        } catch (e) {
          // ignore per-client errors
        }
      }
      setLastTxMap(map);
    } catch (e) {
      console.error('Error computing last transaction summaries:', e);
    }
  };

  useEffect(() => {
    if (clients && clients.length > 0) {
      void refreshLastTransactions();
    } else {
      setLastTxMap({});
    }
  }, [clients]);

  useEffect(() => {
    let unsubscribe: any = null;
    (async () => {
      try {
        await webSocketService.connect();
        unsubscribe = webSocketService.subscribe((event: any) => {
          if (event.type === 'transaction_created' || event.type === 'transaction_updated') {
            void refreshLastTransactions();
          } else if (event.type === 'customer_created' || event.type === 'customer_updated') {
            void loadClients();
          }
        });
      } catch (err) {
        console.error('ClientManagement WebSocket setup failed:', err);
      }
    })();
    return () => {
      try { if (unsubscribe) unsubscribe(); webSocketService.disconnect(); } catch (e) { /* noop */ }
    };
  }, []);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      occupation: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Canada',
      idType: '',
      idNumber: '',
      photoId: ''
    });
  };

  const handleAddClient = () => {
    resetForm();
    setShowAddClientModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      phone: client.phone || '',
      dateOfBirth: client.dateOfBirth || '',
      occupation: client.occupation || '',
      address: client.address || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
      country: client.country || 'Canada',
      idType: client.idType || '',
      idNumber: client.idNumber || '',
      photoId: client.photoId || ''
    });
    setShowEditClientModal(true);
  };

  const handleViewDetails = async (client: Client) => {
    setDetailsClient(client);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setDetailsTransactions([]);
    try {
      const txns = await transactionService.getTransactionsByCustomerId(client.id);
      setDetailsTransactions(txns || []);
    } catch (e) {
      console.error('Failed to load client transactions:', e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showToast('error', 'First name and last name are required');
      return;
    }

    try {
      if (showEditClientModal && selectedClient) {
        // Update existing client
        const updatedClient = await customerService.updateCustomer(selectedClient.id, formData);
        if (updatedClient) {
          setClients(prev => prev.map(client => 
            client.id === selectedClient.id ? updatedClient : client
          ));
          showToast('success', 'Client updated successfully');
        }
        setShowEditClientModal(false);
      } else {
        // Add new client
        const newClient = await customerService.createCustomer(formData);
        if (newClient) {
          setClients(prev => [...prev, newClient]);
          showToast('success', 'Client added successfully');
        }
        setShowAddClientModal(false);
      }
      
      resetForm();
      setSelectedClient(null);
    } catch (err) {
      console.error('Error saving client:', err);
      showToast('error', 'Failed to save client information');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      await customerService.deleteCustomer(clientId);
      setClients(prev => prev.filter(client => client.id !== clientId));
      showToast('success', 'Client deleted successfully');
    } catch (err) {
      console.error('Error deleting client:', err);
      showToast('error', 'Failed to delete client');
    }
  };

  const ClientForm = () => (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
          <select
            value={formData.idType}
            onChange={(e) => setFormData(prev => ({ ...prev, idType: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select ID Type</option>
            <option value="drivers_license">Driver's License</option>
            <option value="passport">Passport</option>
            <option value="provincial_id">Provincial ID Card</option>
            <option value="other_government">Other Government ID</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
          <input
            type="text"
            value={formData.idNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo ID</label>
          <input
            type="text"
            value={formData.photoId}
            onChange={(e) => setFormData(prev => ({ ...prev, photoId: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Reference or number"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={() => {
            setShowAddClientModal(false);
            setShowEditClientModal(false);
            resetForm();
          }}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showEditClientModal ? 'Update Client' : 'Add Client'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Client Management</h2>
        </div>
        <button
          onClick={handleAddClient}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Client
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Search and Import Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <CSVImport 
            type="clients" 
            onImportComplete={async () => {
              await loadClients();
              showToast('success', 'Client list imported successfully');
            }} 
          />
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">No clients found</p>
            <p className="mt-2">Add your first client or import an existing client list</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </div>
                        {client.occupation && (
                          <div className="text-sm text-gray-500">{client.occupation}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.email || '-'}</div>
                      <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.city || '-'}</div>
                      <div className="text-sm text-gray-500">{client.country || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.riskRating === 'HIGH' ? 'bg-red-100 text-red-800' :
                        client.riskRating === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {client.riskRating || 'LOW'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lastTxMap[client.id] ? (
                        <div>
                          <div className="text-gray-900">
                            {lastTxMap[client.id].fromAmount.toLocaleString()} {lastTxMap[client.id].fromCurrency}
                            {' → '}
                            {lastTxMap[client.id].toAmount.toLocaleString()} {lastTxMap[client.id].toCurrency}
                          </div>
                          <div className="text-gray-500 text-xs">
                            on {lastTxMap[client.id].date} {lastTxMap[client.id].effectiveRate ? `(rate ${lastTxMap[client.id].effectiveRate?.toFixed(4)})` : ''}
                          </div>
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(client)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit Client"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        title="Add New Client"
        size="2xl"
      >
        <ClientForm />
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={showEditClientModal}
        onClose={() => setShowEditClientModal(false)}
        title="Edit Client Information"
        size="2xl"
      >
        <ClientForm />
      </Modal>

      {/* Client Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Client Details"
        size="2xl"
      >
        {detailsClient ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Profile</h4>
                <div className="text-sm text-gray-700">
                  <div><span className="font-medium">Name:</span> {detailsClient.firstName} {detailsClient.lastName}</div>
                  <div><span className="font-medium">Email:</span> {detailsClient.email || '-'}</div>
                  <div><span className="font-medium">Phone:</span> {detailsClient.phone || '-'}</div>
                  <div><span className="font-medium">Date of Birth:</span> {detailsClient.dateOfBirth || '-'}</div>
                  <div><span className="font-medium">Occupation:</span> {detailsClient.occupation || '-'}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Address & ID</h4>
                <div className="text-sm text-gray-700">
                  <div><span className="font-medium">Address:</span> {detailsClient.address || '-'}</div>
                  <div><span className="font-medium">City:</span> {detailsClient.city || '-'}</div>
                  <div><span className="font-medium">Postal Code:</span> {detailsClient.postalCode || '-'}</div>
                  <div><span className="font-medium">Country:</span> {detailsClient.country || '-'}</div>
                  <div><span className="font-medium">ID:</span> {detailsClient.idType || '-'} {detailsClient.idNumber ? `(${detailsClient.idNumber})` : ''}</div>
                  <div><span className="font-medium">Photo ID:</span> {detailsClient.photoId || '-'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-xs text-gray-500">Risk</div>
                <div>
                  <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    detailsClient.riskRating === 'HIGH' ? 'bg-red-100 text-red-800' :
                    detailsClient.riskRating === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {detailsClient.riskRating || 'LOW'}
                  </span>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-xs text-gray-500">KYC Status</div>
                <div>
                  <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    detailsClient.kycStatus === 'verified' ? 'bg-green-100 text-green-800' :
                    detailsClient.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {detailsClient.kycStatus || 'pending'}
                  </span>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-xs text-gray-500">Created</div>
                <div className="text-sm text-gray-700">{detailsClient.createdAt ? new Date(detailsClient.createdAt).toLocaleString() : '-'}</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Latest Transaction</h4>
              {lastTxMap[detailsClient.id] ? (
                <div className="text-sm text-blue-900">
                  <div className="font-medium">
                    {lastTxMap[detailsClient.id].fromAmount.toLocaleString()} {lastTxMap[detailsClient.id].fromCurrency} → {lastTxMap[detailsClient.id].toAmount.toLocaleString()} {lastTxMap[detailsClient.id].toCurrency}
                  </div>
                  <div className="text-blue-700">
                    Date: {lastTxMap[detailsClient.id].date} {lastTxMap[detailsClient.id].effectiveRate ? `• Rate ${lastTxMap[detailsClient.id].effectiveRate?.toFixed(4)}` : ''}
                  </div>
                  {(lastTxMap[detailsClient.id].commission !== undefined || lastTxMap[detailsClient.id].profit !== undefined) && (
                    <div className="text-blue-700">
                      {lastTxMap[detailsClient.id].commission !== undefined ? `Commission: $${lastTxMap[detailsClient.id].commission?.toFixed(2)} ` : ''}
                      {lastTxMap[detailsClient.id].profit !== undefined ? `Profit: $${lastTxMap[detailsClient.id].profit?.toFixed(2)}` : ''}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-blue-900">No transactions yet</div>
              )}
            </div>

            {/* Full Transaction History */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">All Transactions</h4>
              {detailsLoading ? (
                <div className="flex items-center text-blue-600">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading transactions...</span>
                </div>
              ) : detailsTransactions.length === 0 ? (
                <div className="text-sm text-gray-500">No transactions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailsTransactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tx.date}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{tx.fromCurrency} → {tx.toCurrency}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tx.fromAmount.toLocaleString()} {tx.fromCurrency}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tx.toAmount.toLocaleString()} {tx.toCurrency}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{(tx.fromAmount > 0 ? (tx.toAmount / tx.fromAmount) : 0).toFixed(6)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${(tx.commission ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${(tx.profit ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
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

export { ClientManagement as LegacyClientManagement };