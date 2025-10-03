import React, { useState, useRef } from 'react';
import { Upload, Scan, Smartphone, Bluetooth, Mail, Share, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import formService, { FormSubmission } from '../../services/formService';

interface ScannerFallbackProps {
  onUploadComplete?: (files: File[]) => void;
  onClose?: () => void;
}

interface PendingUpload {
  id: string;
  file: File;
  customerName?: string;
  formId?: string;
  status: 'pending' | 'processing' | 'linked' | 'error';
  timestamp: string;
}

const ScannerFallback: React.FC<ScannerFallbackProps> = ({ onUploadComplete, onClose }) => {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'pending' | 'sharing'>('upload');
  const [pendingForms, setPendingForms] = useState<FormSubmission[]>([]);
  const [shareMethod, setShareMethod] = useState<'airdrop' | 'bluetooth' | 'email' | 'qr'>('airdrop');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load pending forms that need documents
  React.useEffect(() => {
    loadPendingForms();
    loadPendingUploads();
  }, []);

  const loadPendingForms = async () => {
    try {
      const submissions = await formService.getAllFormSubmissions();
      const formsNeedingDocs = submissions.filter(f => 
        f.status === 'pending' && 
        (!f.documents || f.documents.length === 0)
      );
      setPendingForms(formsNeedingDocs);
    } catch (error) {
      console.error('Error loading pending forms:', error);
    }
  };

  const loadPendingUploads = () => {
    // Load from localStorage (in production, this would be from a proper database)
    const stored = localStorage.getItem('pending_scanner_uploads');
    if (stored) {
      try {
        setPendingUploads(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading pending uploads:', error);
      }
    }
  };

  const savePendingUploads = (uploads: PendingUpload[]) => {
    localStorage.setItem('pending_scanner_uploads', JSON.stringify(uploads));
    setPendingUploads(uploads);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) return false;
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) return false;
      
      return true;
    });

    if (validFiles.length !== files.length) {
      alert(`${files.length - validFiles.length} file(s) were rejected. Please ensure files are images (JPG, PNG) or PDF under 10MB.`);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processUploads = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);

    try {
      // Create pending upload entries
      const newUploads: PendingUpload[] = selectedFiles.map(file => ({
        id: `upload-${Date.now()}-${Math.random()}`,
        file,
        status: 'pending' as const,
        timestamp: new Date().toISOString()
      }));

      const updatedUploads = [...pendingUploads, ...newUploads];
      savePendingUploads(updatedUploads);

      // Clear selected files
      setSelectedFiles([]);
      
      // Switch to pending tab
      setActiveTab('pending');
      
      if (onUploadComplete) {
        onUploadComplete(selectedFiles);
      }

    } catch (error) {
      console.error('Error processing uploads:', error);
      alert('Error processing uploads. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const linkToCustomer = async (uploadId: string, formId: string) => {
    const upload = pendingUploads.find(u => u.id === uploadId);
    const form = pendingForms.find(f => f.id === formId);
    
    if (!upload || !form) return;

    try {
      // Update upload status
      const updatedUploads = pendingUploads.map(u => 
        u.id === uploadId 
          ? { 
              ...u, 
              status: 'processing' as const,
              formId,
              customerName: `${form.customerData?.firstName} ${form.customerData?.lastName}`
            }
          : u
      );
      savePendingUploads(updatedUploads);

      // Upload document to form
      await formService.uploadDocumentForForm(formId, upload.file, 'additional');

      // Update final status
      const finalUploads = updatedUploads.map(u => 
        u.id === uploadId ? { ...u, status: 'linked' as const } : u
      );
      savePendingUploads(finalUploads);

      // Refresh pending forms
      await loadPendingForms();

    } catch (error) {
      console.error('Error linking document to customer:', error);
      
      const errorUploads = pendingUploads.map(u => 
        u.id === uploadId ? { ...u, status: 'error' as const } : u
      );
      savePendingUploads(errorUploads);
    }
  };

  const deleteUpload = (uploadId: string) => {
    const updatedUploads = pendingUploads.filter(u => u.id !== uploadId);
    savePendingUploads(updatedUploads);
  };

  const renderUploadTab = () => (
    <div className="space-y-6">
      
      {/* Main Upload Area */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Customer Documents
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag & drop customer ID documents here, or click to browse
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              Choose Files
            </button>
            
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              <Scan className="h-4 w-4" />
              Scan Document
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* File Format Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Accepted File Types</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded"></div>
            Photo ID (JPG, PNG)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded"></div>
            Proof of Address (PDF, JPG)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded"></div>
            Supporting Documents
          </div>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({selectedFiles.length})
            </h4>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  <div className="text-lg">
                    {file.type.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={processUploads}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Process Uploads
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPendingTab = () => (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Pending Document Links</h3>
        <button
          onClick={loadPendingUploads}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {pendingUploads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h4 className="text-lg font-medium mb-2">No Pending Uploads</h4>
          <p className="text-sm">Upload documents to link them to customer forms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUploads.map((upload) => (
            <div key={upload.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {upload.file.type.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                  
                  <div>
                    <div className="font-medium">{upload.file.name}</div>
                    <div className="text-sm text-gray-600">
                      {(upload.file.size / 1024 / 1024).toFixed(1)} MB • 
                      Uploaded {new Date(upload.timestamp).toLocaleString()}
                    </div>
                    
                    {upload.customerName && (
                      <div className="text-sm text-blue-600 mt-1">
                        Linked to: {upload.customerName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    upload.status === 'linked' ? 'bg-green-100 text-green-800' :
                    upload.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    upload.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {upload.status.toUpperCase()}
                  </span>
                  
                  {upload.status === 'pending' && (
                    <button
                      onClick={() => deleteUpload(upload.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {upload.status === 'pending' && pendingForms.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium text-gray-900 mb-2">Link to Customer:</div>
                  
                  <div className="grid gap-2">
                    {pendingForms.slice(0, 3).map((form) => (
                      <button
                        key={form.id}
                        onClick={() => linkToCustomer(upload.id, form.id)}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 text-left"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {form.customerData?.firstName} {form.customerData?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {form.customerData?.email} • Form #{form.id.slice(-8)}
                          </div>
                        </div>
                        <div className="text-blue-600">
                          Link →
                        </div>
                      </button>
                    ))}
                    
                    {pendingForms.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        +{pendingForms.length - 3} more customers available
                      </div>
                    )}
                  </div>
                </div>
              )}

              {upload.status === 'error' && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Failed to link document. Please try again.</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSharingTab = () => (
    <div className="space-y-6">
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Alternative Sharing Methods</h3>
        <p className="text-sm text-gray-600">
          For customers who can't use their camera, help them share documents using these methods:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* AirDrop */}
        <div className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
          shareMethod === 'airdrop' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`} onClick={() => setShareMethod('airdrop')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">📡</div>
            <div>
              <h4 className="font-medium">AirDrop (iOS/Mac)</h4>
              <p className="text-sm text-gray-600">Direct device-to-device sharing</p>
            </div>
          </div>
          
          {shareMethod === 'airdrop' && (
            <div className="mt-4 p-3 bg-white border rounded text-sm">
              <p className="font-medium mb-2">Instructions for customer:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Take photos of documents on iPhone/iPad</li>
                <li>Select photos in Photos app</li>
                <li>Tap Share button</li>
                <li>Select AirDrop and choose store device</li>
                <li>Accept transfer on store device</li>
              </ol>
            </div>
          )}
        </div>

        {/* Bluetooth */}
        <div className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
          shareMethod === 'bluetooth' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`} onClick={() => setShareMethod('bluetooth')}>
          <div className="flex items-center gap-3 mb-3">
            <Bluetooth className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-medium">Bluetooth Transfer</h4>
              <p className="text-sm text-gray-600">Cross-platform sharing</p>
            </div>
          </div>
          
          {shareMethod === 'bluetooth' && (
            <div className="mt-4 p-3 bg-white border rounded text-sm">
              <p className="font-medium mb-2">Instructions for customer:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Enable Bluetooth on both devices</li>
                <li>Pair customer device with store device</li>
                <li>Select photos and choose "Send via Bluetooth"</li>
                <li>Accept transfer on store device</li>
              </ol>
            </div>
          )}
        </div>

        {/* Email */}
        <div className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
          shareMethod === 'email' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`} onClick={() => setShareMethod('email')}>
          <div className="flex items-center gap-3 mb-3">
            <Mail className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-medium">Email Transfer</h4>
              <p className="text-sm text-gray-600">Send documents via email</p>
            </div>
          </div>
          
          {shareMethod === 'email' && (
            <div className="mt-4 p-3 bg-white border rounded text-sm">
              <p className="font-medium mb-2">Store email for documents:</p>
              <div className="bg-gray-50 p-2 rounded font-mono text-sm">
                documents@store-domain.com
              </div>
              <p className="mt-2 text-gray-600">
                Customer can email documents directly to this address
              </p>
            </div>
          )}
        </div>

        {/* QR Code Sharing */}
        <div className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
          shareMethod === 'qr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`} onClick={() => setShareMethod('qr')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">📱</div>
            <div>
              <h4 className="font-medium">QR Upload Link</h4>
              <p className="text-sm text-gray-600">Generate upload link</p>
            </div>
          </div>
          
          {shareMethod === 'qr' && (
            <div className="mt-4 p-3 bg-white border rounded text-sm">
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-3">
                Generate Upload QR Code
              </button>
              <p className="text-gray-600">
                Customer scans QR code to access secure upload form
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <span className="font-medium text-amber-800">Security Reminder</span>
        </div>
        <p className="text-sm text-amber-700">
          Always verify customer identity before accepting documents through alternative methods. 
          Ensure all shared documents are encrypted and handled according to FINTRAC compliance requirements.
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="border-b">
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Scanner Fallback System</h2>
            <p className="text-sm text-gray-600 mt-1">
              Alternative document collection for customers with camera issues
            </p>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-4 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Documents
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-4 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Links ({pendingUploads.filter(u => u.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('sharing')}
              className={`pb-4 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'sharing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sharing Methods
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'pending' && renderPendingTab()}
        {activeTab === 'sharing' && renderSharingTab()}
      </div>
    </div>
  );
};

export default ScannerFallback;