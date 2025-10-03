import React, { useState, useEffect } from 'react';
import { FileText, QrCode, UserPlus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import StoreQRCode from '../../components/StoreQRCode';
import DocumentReviewer from '../../components/DocumentReviewer';
import ScannerFallback from '../../components/ScannerFallback';
import formService from '../../services/formService';
// databaseService removed: all mutations go through formService to ensure events and consistency
import webSocketService from '../../services/webSocketService';

import type { FormSubmission } from '../../services/formService';

const FormsTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'qr-management' | 'submissions' | 'id-validation'>('qr-management');
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [pendingForms, setPendingForms] = useState<FormSubmission[]>([]);
  const [processingForms, setProcessingForms] = useState<FormSubmission[]>([]);
  const [completedForms, setCompletedForms] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal and component states
  const [showDocumentReviewer, setShowDocumentReviewer] = useState(false);
  const [showScannerFallback, setShowScannerFallback] = useState(false);
  const [selectedFormForReview, setSelectedFormForReview] = useState<FormSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    loadFormSubmissions();
    (async () => {
      try {
        await webSocketService.connect();
        unsubscribe = webSocketService.subscribe((event) => {
          if (!event || !event.type) return;
          if (event.type === 'form_submission_received') {
            const submission = event.data as FormSubmission;
            setFormSubmissions(prev => [submission, ...prev]);
            if (submission.status === 'pending') {
              setPendingForms(prev => [submission, ...prev]);
            }
          } else if (event.type === 'form_status_updated') {
            const updatedForm = event.data as FormSubmission;
            setFormSubmissions(prev => 
              prev.map(f => f.id === updatedForm.id ? updatedForm : f)
            );
            // Update categorized lists
            loadFormSubmissions();
          } else if (event.type === 'form_document_approved' || event.type === 'form_document_rejected') {
            loadFormSubmissions();
          }
        });
      } catch (err) {
        // No-op: if WebSocket connection fails, component will still function with manual refresh
      }
    })();
    
    return () => {
      try { if (unsubscribe) unsubscribe(); webSocketService.disconnect(); } catch (e) { /* noop */ }
    };
  }, []);

  // Filter forms based on search and status
  const filteredForms = formSubmissions.filter(form => {
    const matchesSearch = !searchTerm ||
      form.customerData?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.customerData?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.customerData?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handlers for bulk actions
  const handleSelectAll = () => {
    if (selectedForms.size === pendingForms.length) {
      setSelectedForms(new Set());
    } else {
      setSelectedForms(new Set(pendingForms.map(f => f.id)));
    }
  };

  const handleFormSelect = (formId: string) => {
    const newSelected = new Set(selectedForms);
    if (newSelected.has(formId)) {
      newSelected.delete(formId);
    } else {
      newSelected.add(formId);
    }
    setSelectedForms(newSelected);
  };

  const handleBulkProcess = async () => {
    if (selectedForms.size === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(
        Array.from(selectedForms).map(formId => handleProcessForm(formId))
      );
      setSelectedForms(new Set());
    } catch (error) {
      console.error('Bulk processing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedForms.size === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(
        Array.from(selectedForms).map(formId => handleCreateClientFromForm(formId))
      );
      setSelectedForms(new Set());
    } catch (error) {
      console.error('Bulk approval failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFormSubmissions = async () => {
    setIsLoading(true);
    try {
      const submissions = await formService.getAllFormSubmissions();
      setFormSubmissions(submissions);
      
      // Categorize submissions
      setPendingForms(submissions.filter(f => f.status === 'pending'));
      setProcessingForms(submissions.filter(f => f.status === 'processing' || f.status === 'verified'));
      setCompletedForms(submissions.filter(f => f.status === 'completed'));
    } catch (error) {
      console.error('Error loading form submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleProcessForm = async (formId: string) => {
    try {
      setIsLoading(true);
      await formService.processFormSubmission(formId);
      await loadFormSubmissions();
    } catch (error) {
      console.error('Error processing form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClientFromForm = async (formId: string) => {
    try {
      setIsLoading(true);
      const form = formSubmissions.find(f => f.id === formId);
      if (!form) throw new Error('Form not found');

      // Create customer via formService to ensure form is updated with customerId and events are emitted
      const customer = await formService.createCustomerFromForm(formId);

      await loadFormSubmissions();
      console.log('Client created successfully:', customer);
    } catch (error) {
      console.error('Error creating client from form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTransaction = async (formId: string, transactionId: string) => {
    try {
      setIsLoading(true);
      
      // First create the client
      await handleCreateClientFromForm(formId);
      
      // Then assign transaction
      const form = formSubmissions.find(f => f.id === formId);
      if (form) {
        await formService.assignTransactionToForm(formId, transactionId);
        await loadFormSubmissions();
      }
    } catch (error) {
      console.error('Error assigning transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Document reviewer handlers
  const handleApproveDocument = async (formId: string, documentId: string) => {
    try {
      setIsLoading(true);
      await formService.approveDocument(formId, documentId);
      await loadFormSubmissions();
    } catch (error) {
      console.error('Error approving document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectDocument = async (formId: string, documentId: string, reason: string) => {
    try {
      setIsLoading(true);
      await formService.rejectDocument(formId, documentId, reason);
      await loadFormSubmissions();
    } catch (error) {
      console.error('Error rejecting document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderQRManagement = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <QrCode className="h-5 w-5 text-blue-600" />
          Store QR Code Management
        </h3>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">
                FINTRAC Compliance Features Active
              </p>
              <ul className="text-blue-600 text-xs space-y-1">
                <li>• Automated KYC/AML validation</li>
                <li>• Real-time suspicious activity monitoring</li>
                <li>• Complete audit trail maintenance</li>
                <li>• Secure document encryption and storage</li>
              </ul>
            </div>
          </div>
        </div>
        <StoreQRCode />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">QR Code Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-700 mb-1">{formSubmissions.length}</div>
            <div className="text-sm font-medium text-blue-600">Total Submissions</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-700 mb-1">{completedForms.length}</div>
            <div className="text-sm font-medium text-green-600">Completed</div>
            <div className="text-xs text-gray-500 mt-1">Ready for transactions</div>
          </div>
          <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-700 mb-1">{pendingForms.length}</div>
            <div className="text-sm font-medium text-yellow-600">Pending Review</div>
            <div className="text-xs text-gray-500 mt-1">Requires attention</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormSubmissions = () => (
    <div className="space-y-6">
      {/* Enhanced Form Processing Dashboard */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <FileText className="h-5 w-5 text-blue-600" />
            Customer Form Submissions
          </h3>
          
          <div className="flex items-center gap-3">
            <select
              className="text-sm border border-gray-300 rounded px-3 py-1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
            
            <input
              type="search"
              placeholder="Search customers..."
              className="text-sm border border-gray-300 rounded px-3 py-1 w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <button
              onClick={() => console.log('Analytics opened for forms:', filteredForms.length)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Analytics
            </button>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-yellow-700">{pendingForms.length}</div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-sm font-medium text-yellow-700">Pending Review</div>
            <div className="text-xs text-yellow-600 mt-1">Requires immediate attention</div>
          </div>
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-blue-700">{processingForms.length}</div>
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-blue-700">In Process</div>
            <div className="text-xs text-blue-600 mt-1">Being reviewed</div>
          </div>
          <div className="bg-green-50 p-5 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-green-700">{completedForms.length}</div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-sm font-medium text-green-700">Completed</div>
            <div className="text-xs text-green-600 mt-1">Ready for transactions</div>
          </div>
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-gray-700">{formSubmissions.length}</div>
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-sm font-medium text-gray-700">Total Forms</div>
            <div className="text-xs text-gray-600 mt-1">All submissions</div>
          </div>
        </div>
        
        {pendingForms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h4 className="text-lg font-medium mb-2">No Pending Forms</h4>
            <p className="text-sm">All form submissions have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bulk Actions */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedForms.size === pendingForms.length && pendingForms.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  Select All ({selectedForms.size} selected)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkProcess}
                  disabled={selectedForms.size === 0 || isLoading}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Bulk Process ({selectedForms.size})
                </button>
                <button
                  onClick={handleBulkApprove}
                  disabled={selectedForms.size === 0 || isLoading}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Bulk Approve ({selectedForms.size})
                </button>
              </div>
            </div>

            {pendingForms.map((form) => (
              <div key={form.id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedForms.has(form.id)}
                      onChange={() => handleFormSelect(form.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold text-gray-900 text-base">
                          {form.customerData?.firstName} {form.customerData?.lastName}
                        </span>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                          PENDING REVIEW
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium min-w-[45px]">Email:</span>
                          <span className="truncate">{form.customerData?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium min-w-[45px]">Phone:</span>
                          <span>{form.customerData?.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium min-w-[40px]">Date:</span>
                          <span>{new Date(form.submissionDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {form.complianceFlags && form.complianceFlags.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">
                              Compliance Review Required
                            </span>
                          </div>
                          <div className="text-xs text-amber-700 mt-1">
                            Flags: {form.complianceFlags.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProcessForm(form.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Review Details
                      </button>
                      <button
                        onClick={() => handleCreateClientFromForm(form.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        Create Client
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssignTransaction(form.id, '')}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Link Transaction
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        View Documents
                      </button>
                    </div>
                  </div>
                </div>

                {/* Document Preview */}
                {form.documents && form.documents.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-700">Documents:</span>
                      {form.documents.map((doc, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {doc.type.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {form.documents.slice(0, 3).map((doc, index) => (
                        <div key={index} className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                          {doc && (doc.type === 'photo_id' ? 'ID' : doc.type === 'selfie' ? 'PHOTO' : doc.type === 'proof_of_address' ? 'ADDR' : 'DOC')}
                        </div>
                      ))}
                      {form.documents.length > 3 && (
                        <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                          +{form.documents.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Actions Bar */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Form ID: {form.id} • Submitted: {new Date(form.submissionDate).toLocaleString()}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => console.log('Contact customer:', form.customerData?.email)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Contact Customer
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={() => console.log('Flag for review:', form.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Flag for Review
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={() => handleCreateClientFromForm(form.id)}
                        disabled={isLoading}
                        className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        Quick Approve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Processing Queue</h3>
        
        {processingForms.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No forms currently being processed</p>
        ) : (
          <div className="space-y-3">
            {processingForms.map((form) => (
              <div key={form.id} className="border rounded p-4 bg-yellow-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Processing</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Customer: {form.customerData?.firstName} {form.customerData?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">Status: {form.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAssignTransaction(form.id, '')}
                      disabled={isLoading}
                      className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      Assign Transaction
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderIDValidation = () => (
    <div className="space-y-6">
      {/* Document Review Interface */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <UserPlus className="h-5 w-5 text-blue-600" />
            ID Document Validation & Review
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowDocumentReviewer(!showDocumentReviewer)}
              className="text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Review Documents
            </button>
            <button
              onClick={() => setShowScannerFallback(!showScannerFallback)}
              className="text-sm bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Scanner Fallback
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Forms Requiring Review */}
          <div className="lg:col-span-2">
            <h4 className="text-md font-medium text-gray-900 mb-3">Forms Awaiting Document Review</h4>
            
            {formSubmissions.filter(f => f.documents && f.documents.length > 0 && f.status !== 'completed').length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents pending review</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {formSubmissions
                  .filter(f => f.documents && f.documents.length > 0 && f.status !== 'completed')
                  .map((form) => (
                    <div key={form.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {form.customerData?.firstName} {form.customerData?.lastName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {form.documents.length} docs
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFormForReview(form);
                              setShowDocumentReviewer(true);
                            }}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 mb-2">
                        {form.documents.map((doc, index) => (
                          <span key={index} className={`text-xs px-2 py-1 rounded ${
                            doc.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                            doc.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Submitted: {new Date(form.submissionDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded border">
              <div className="text-lg font-bold text-blue-700">
                {formSubmissions.filter(f => f.documents && f.documents.some(d => d.verificationStatus === 'pending')).length}
              </div>
              <div className="text-sm text-blue-600">Pending Review</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded border">
              <div className="text-lg font-bold text-green-700">
                {formSubmissions.filter(f => f.documents && f.documents.every(d => d.verificationStatus === 'verified')).length}
              </div>
              <div className="text-sm text-green-600">All Verified</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded border">
              <div className="text-lg font-bold text-red-700">
                {formSubmissions.filter(f => f.documents && f.documents.some(d => d.verificationStatus === 'rejected')).length}
              </div>
              <div className="text-sm text-red-600">Has Rejections</div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded border">
              <div className="text-lg font-bold text-amber-700">
                {formSubmissions.filter(f => f.complianceFlags && f.complianceFlags.length > 0).length}
              </div>
              <div className="text-sm text-amber-600">Compliance Flags</div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Processing Workflow */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Document Processing Workflow
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            FINTRAC VALIDATED
          </span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-sm font-medium">1. Customer Capture</div>
            <div className="text-xs text-gray-600 mt-1">Via mobile form or in-store</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-sm font-medium">2. AI Analysis</div>
            <div className="text-xs text-gray-600 mt-1">OCR, authenticity check</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-sm font-medium">3. Human Review</div>
            <div className="text-xs text-gray-600 mt-1">Store owner validation</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-sm font-medium">4. Client Creation</div>
            <div className="text-xs text-gray-600 mt-1">
              FINTRAC compliant record with audit trail
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Forms Management
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
              FINTRAC COMPLIANT
            </span>
          </h2>
          <p className="text-gray-600 mt-1">
            Secure customer onboarding with automated compliance validation and audit trails
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingForms.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {pendingForms.length} pending review
              </span>
            </div>
          )}
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('qr-management')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'qr-management'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <QrCode className="inline h-4 w-4 mr-2" />
            QR Management
          </button>
          <button
            onClick={() => setActiveSection('submissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'submissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            Form Submissions
            {pendingForms.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {pendingForms.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('id-validation')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'id-validation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserPlus className="inline h-4 w-4 mr-2" />
            ID Validation
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}
      
      {activeSection === 'qr-management' && renderQRManagement()}
      {activeSection === 'submissions' && renderFormSubmissions()}
      {activeSection === 'id-validation' && renderIDValidation()}

      {/* Document Reviewer Modal */}
      {showDocumentReviewer && selectedFormForReview && (
        <DocumentReviewer
          form={selectedFormForReview}
          onApprove={handleApproveDocument}
          onReject={handleRejectDocument}
          onClose={() => {
            setShowDocumentReviewer(false);
            setSelectedFormForReview(null);
          }}
        />
      )}

      {/* Scanner Fallback Modal */}
      {showScannerFallback && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <ScannerFallback
              onUploadComplete={(files) => {
                console.log('Files uploaded:', files);
                // Refresh form submissions
                loadFormSubmissions();
              }}
              onClose={() => setShowScannerFallback(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsTab;