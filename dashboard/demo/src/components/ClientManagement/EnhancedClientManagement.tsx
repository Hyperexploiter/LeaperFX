// Enhanced Client Management - Production Grade FINTRAC Compliance
// Complete client profiles with documents, transactions, compliance status, and risk assessment

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Edit2, Shield, AlertTriangle,
  CheckCircle, Clock, Filter, SortAsc, SortDesc, Eye,
  User, Mail, Phone, MapPin
} from 'lucide-react';
import { Modal, Toast } from '../Modal';
import customerService, { type CustomerProfile, type CustomerSearchFilters } from '../../services/customerService';
import webSocketService from '../../services/webSocketService';
import transactionService from '../../services/transactionService';
import secureDocumentService from '../../services/secureDocumentService';
import fintracValidationService from '../../services/fintracValidationService';

// Enhanced Client Interface with FINTRAC Compliance
interface EnhancedClient {
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
  lastUpdated: string;
  riskRating: 'low' | 'medium' | 'high';
  kycStatus: 'pending' | 'verified' | 'rejected';
  
  // FINTRAC Compliance Fields
  complianceStatus?: 'compliant' | 'pending' | 'non_compliant';
  documentsVerified?: boolean;
  totalTransactionVolume?: number;
  lastTransactionDate?: string;
  lastComplianceCheck?: string;
  totalTransactions?: number;
  isActive: boolean;
}

interface ViewConfig {
  view: 'list' | 'grid' | 'detailed';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: CustomerSearchFilters;
}

interface ComplianceStats {
  total: number;
  compliant: number;
  pending: number;
  requiresReview: number;
  highRisk: number;
}

const EnhancedClientManagement: React.FC = () => {
  // Core state
  const [clients, setClients] = useState<EnhancedClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<EnhancedClient[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Modal states
  const [, setShowAddClientModal] = useState<boolean>(false);
  const [showClientProfileModal, setShowClientProfileModal] = useState<boolean>(false);
  const [, setShowFiltersModal] = useState<boolean>(false);
  
  // Selected data
  const [, setSelectedClient] = useState<EnhancedClient | null>(null);
  const [selectedClientProfile, setSelectedClientProfile] = useState<CustomerProfile | null>(null);
  
  // View configuration
  const [viewConfig, setViewConfig] = useState<ViewConfig>({
    view: 'detailed',
    sortBy: 'lastUpdated',
    sortOrder: 'desc',
    filters: {}
  });
  
  // Compliance and analytics
  const [complianceStats, setComplianceStats] = useState<ComplianceStats>({
    total: 0,
    compliant: 0,
    pending: 0,
    requiresReview: 0,
    highRisk: 0
  });
  
  const [clientProfiles, setClientProfiles] = useState<Record<string, {
    transactionSummary: any;
    documentCount: number;
    lastActivity: string;
    complianceScore: number;
  }>>({});
  
  // UI state
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    visible: boolean;
  }>({
    type: 'success',
    message: '',
    visible: false
  });

  // Map raw customer to EnhancedClient shape (flattens address, normalizes types)
  const toEnhancedClient = (c: any): EnhancedClient => {
    const addr = c?.address;
    const flatAddress = typeof addr === 'string' ? addr : addr ? [addr.street, addr.city, addr.province, addr.postalCode, addr.country].filter(Boolean).join(', ') : '';
    const risk = typeof c?.riskRating === 'string' ? (c.riskRating as string).toLowerCase() : 'low';
    return {
      id: c.id,
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      email: c.email || '',
      phone: c.phone || '',
      dateOfBirth: c.dateOfBirth || '',
      occupation: c.occupation || '',
      address: flatAddress,
      city: c.city || (addr?.city || ''),
      postalCode: c.postalCode || (addr?.postalCode || ''),
      country: c.country || (addr?.country || ''),
      idType: c.idType || c.identification?.type,
      idNumber: c.idNumber || c.identification?.number,
      photoId: c.photoId,
      createdAt: c.createdAt || new Date().toISOString(),
      lastUpdated: c.lastUpdated || c.createdAt || new Date().toISOString(),
      riskRating: (['low','medium','high'].includes(risk) ? risk : 'low') as 'low' | 'medium' | 'high',
      kycStatus: (c.kycStatus || 'pending') as 'pending' | 'verified' | 'rejected',
      complianceStatus: c.complianceStatus,
      documentsVerified: c.documentsVerified,
      totalTransactionVolume: c.totalTransactionVolume,
      lastTransactionDate: c.lastTransactionDate,
      lastComplianceCheck: c.lastComplianceCheck,
      totalTransactions: Array.isArray(c.transactions) ? c.transactions.length : c.totalTransactions,
      isActive: typeof c.isActive === 'boolean' ? c.isActive : true,
    };
  };

  // Helper functions
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message, visible: true });
  };
  
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Load clients with enhanced profiles
  const loadClients = async () => {
    try {
      setIsLoading(true);
      
      // Get clients with advanced filtering and sorting
      const allClients = await customerService.getCustomersAdvanced(
        viewConfig.filters,
        viewConfig.sortBy,
        viewConfig.sortOrder
      );
      
      setClients(allClients.map(toEnhancedClient));
      
      // Build enhanced profiles for each client
      const profiles: Record<string, any> = {};
      let stats: ComplianceStats = { 
        total: allClients.length, 
        compliant: 0, 
        pending: 0, 
        requiresReview: 0, 
        highRisk: 0 
      };
      
      for (const client of allClients) {
        try {
          // Get transaction summary
          const transactionSummary = await transactionService.getCustomerTransactionSummary(client.id);
          
          // Get document count
          const documents = await secureDocumentService.getCustomerDocuments(client.id);
          
          // Calculate compliance score
          const complianceValidation = await fintracValidationService.validateCustomerDueDiligence(client.id);
          const complianceScore = complianceValidation.isCompliant ? 100 : 
            Math.max(0, 100 - (complianceValidation.missingRequirements.length * 20));
          
          profiles[client.id] = {
            transactionSummary,
            documentCount: documents.length,
            lastActivity: transactionSummary.latestTransactionDate || client.createdAt,
            complianceScore
          };
          
          // Update compliance stats
          if (client.complianceStatus === 'compliant') stats.compliant++;
          else if (client.complianceStatus === 'pending') stats.pending++;
          
          if (client.riskRating === 'high') stats.highRisk++;
          
          if (!client.documentsVerified || client.kycStatus === 'pending') stats.requiresReview++;
          
        } catch (e) {
          console.warn(`Failed to load profile for client ${client.id}:`, e);
          profiles[client.id] = {
            transactionSummary: { 
              totalTransactions: 0, 
              totalVolume: 0, 
              latestTransactionDate: null, 
              complianceTransactions: 0, 
              riskRating: 'low' 
            },
            documentCount: 0,
            lastActivity: client.createdAt,
            complianceScore: 0
          };
        }
      }
      
      setClientProfiles(profiles);
      setComplianceStats(stats);
      
    } catch (err) {
      console.error('Error loading clients:', err);
      showToast('error', 'Failed to load client data');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced filtering
  useEffect(() => {
    let filtered = [...clients];
    
    // Text search
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client => {
        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        const email = (client.email || '').toLowerCase();
        const phone = (client.phone || '').toLowerCase();
        const occupation = (client.occupation || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               phone.includes(searchLower) ||
               occupation.includes(searchLower) ||
               client.id.toLowerCase().includes(searchLower);
      });
    }
    
    setFilteredClients(filtered);
  }, [clients, searchTerm, viewConfig]);

  // Real-time updates via WebSocket
  useEffect(() => {
    const handleUpdate = (event: any) => {
      if (event.type === 'customer_created' || 
          event.type === 'customer_updated' || 
          event.type === 'customer_compliance_updated' ||
          event.type === 'transaction_updated' ||
          event.type === 'document_verified') {
        void loadClients();
      }
    };

    const unsubscribe = webSocketService.subscribe(handleUpdate);
    return () => unsubscribe();
  }, [viewConfig]);

  // Load data on mount
  useEffect(() => {
    void loadClients();
  }, [viewConfig.filters, viewConfig.sortBy, viewConfig.sortOrder]);

  // View client profile
  const handleViewProfile = async (client: EnhancedClient) => {
    try {
      setSelectedClient(client);
      const profile = await customerService.getCustomerProfile(client.id);
      setSelectedClientProfile(profile);
      setShowClientProfileModal(true);
    } catch (error) {
      console.error('Error loading client profile:', error);
      showToast('error', 'Failed to load client profile');
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    setViewConfig(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Update compliance for client
  const handleUpdateCompliance = async (clientId: string) => {
    try {
      await customerService.updateCustomerCompliance(clientId);
      showToast('success', 'Compliance status updated');
      await loadClients();
    } catch (error) {
      console.error('Error updating compliance:', error);
      showToast('error', 'Failed to update compliance status');
    }
  };

  // Risk rating badge component
  const RiskBadge: React.FC<{ rating: string }> = ({ rating }) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[rating as keyof typeof colors] || colors.medium}`}>
        {rating.toUpperCase()}
      </span>
    );
  };

  // Compliance status badge
  const ComplianceBadge: React.FC<{ status?: string; score: number }> = ({ status, score }) => {
    if (status === 'compliant' || score >= 90) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (status === 'pending' || score >= 70) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header with stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Users className="h-6 w-6 mr-2" />
            Client Management
          </h2>
          <div className="flex space-x-4 text-sm">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Total: {complianceStats.total}
            </span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              Compliant: {complianceStats.compliant}
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Pending: {complianceStats.pending}
            </span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
              High Risk: {complianceStats.highRisk}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </button>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Client
          </button>
        </div>
      </div>

      {/* Search and view controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={viewConfig.sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="lastUpdated">Last Updated</option>
            <option value="name">Name</option>
            <option value="createdAt">Created Date</option>
            <option value="lastTransactionDate">Last Transaction</option>
            <option value="totalTransactionVolume">Transaction Volume</option>
            <option value="riskRating">Risk Rating</option>
          </select>
          <button
            onClick={() => handleSort(viewConfig.sortBy)}
            className="p-1 border border-gray-300 rounded"
          >
            {viewConfig.sortOrder === 'desc' ? 
              <SortDesc className="h-4 w-4" /> : 
              <SortAsc className="h-4 w-4" />
            }
          </button>
        </div>
      </div>

      {/* Client list */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => {
                const profile = clientProfiles[client.id];
                return (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {client.id.slice(-8)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {client.occupation || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {client.phone}
                          </div>
                        )}
                        {client.city && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {client.city}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <ComplianceBadge 
                          status={client.complianceStatus} 
                          score={profile?.complianceScore || 0} 
                        />
                        <div className="text-sm">
                          <div>{client.kycStatus?.toUpperCase()}</div>
                          <div className="text-xs text-gray-500">
                            Docs: {profile?.documentCount || 0}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">
                          {profile?.transactionSummary?.totalTransactions || 0} txns
                        </div>
                        <div className="text-gray-500">
                          ${(profile?.transactionSummary?.totalVolume || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {profile?.lastActivity ? 
                            new Date(profile.lastActivity).toLocaleDateString() : 
                            'No activity'
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RiskBadge rating={client.riskRating} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewProfile(client)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateCompliance(client.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Update Compliance"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Client"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Client Profile Modal */}
      <Modal
        isOpen={showClientProfileModal}
        onClose={() => setShowClientProfileModal(false)}
        title="Complete Client Profile"
        size="xl"
      >
        {selectedClientProfile && (
          <div className="space-y-6">
            {/* Client Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedClientProfile.customer.firstName} {selectedClientProfile.customer.lastName}</div>
                  <div><strong>Email:</strong> {selectedClientProfile.customer.email}</div>
                  <div><strong>Phone:</strong> {selectedClientProfile.customer.phone}</div>
                  <div><strong>Date of Birth:</strong> {selectedClientProfile.customer.dateOfBirth}</div>
                  <div><strong>Occupation:</strong> {selectedClientProfile.customer.occupation}</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Compliance Status</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>KYC Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      selectedClientProfile.customer.kycStatus === 'verified' ? 'bg-green-100 text-green-800' :
                      selectedClientProfile.customer.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedClientProfile.customer.kycStatus?.toUpperCase()}
                    </span>
                  </div>
                  <div><strong>Risk Rating:</strong> 
                    <RiskBadge rating={selectedClientProfile.customer.riskRating} />
                  </div>
                  <div><strong>Documents:</strong> {selectedClientProfile.documents.length} uploaded</div>
                  <div><strong>Compliance Score:</strong> {selectedClientProfile.riskAssessment.score}/100</div>
                </div>
              </div>
            </div>

            {/* Transaction Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Transaction Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Total Transactions</div>
                  <div className="text-xl font-bold text-blue-600">
                    {selectedClientProfile.transactionSummary.totalTransactions}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Total Volume</div>
                  <div className="text-xl font-bold text-green-600">
                    ${selectedClientProfile.transactionSummary.totalVolume.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">FINTRAC Reports</div>
                  <div className="text-xl font-bold text-purple-600">
                    {selectedClientProfile.transactionSummary.complianceTransactions}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Last Transaction</div>
                  <div className="text-sm text-gray-600">
                    {selectedClientProfile.transactionSummary.latestTransactionDate ? 
                      new Date(selectedClientProfile.transactionSummary.latestTransactionDate).toLocaleDateString() :
                      'No transactions'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Documents ({selectedClientProfile.documents.length})</h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedClientProfile.documents.map((doc) => (
                  <div key={doc.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{doc.documentType.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-xs">
                        {doc.metadata.documentVerified ? 
                          <CheckCircle className="h-4 w-4 text-green-600" /> :
                          <Clock className="h-4 w-4 text-yellow-600" />
                        }
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Uploaded: {new Date(doc.metadata.uploadDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast notifications */}
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};

export default EnhancedClientManagement;