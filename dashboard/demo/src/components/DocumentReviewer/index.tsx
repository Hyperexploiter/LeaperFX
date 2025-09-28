import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, Check, X, AlertTriangle, Eye, RefreshCw, Upload } from 'lucide-react';
import { SecureDocument, FormSubmission } from '../../services/formService';

interface DocumentReviewerProps {
  form: FormSubmission;
  onApprove: (formId: string, documentId: string) => void;
  onReject: (formId: string, documentId: string, reason: string) => void;
  onClose: () => void;
}

interface DocumentAnalysis {
  extractedText?: string;
  confidence: number;
  authenticity: 'verified' | 'suspicious' | 'unknown';
  biometricMatch?: number;
  qualityScore: number;
  flags: string[];
}

const DocumentReviewer: React.FC<DocumentReviewerProps> = ({
  form,
  onApprove,
  onReject,
  onClose
}) => {
  const [selectedDocument, setSelectedDocument] = useState<SecureDocument | null>(
    form.documents?.[0] || null
  );
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);

  // Simulate document analysis (in production, this would call AI/ML services)
  const analyzeDocument = async (document: SecureDocument) => {
    setIsAnalyzing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockAnalysis: DocumentAnalysis = {
      extractedText: generateMockExtractedText(document.type),
      confidence: 0.85 + Math.random() * 0.1,
      authenticity: Math.random() > 0.2 ? 'verified' : 'suspicious',
      qualityScore: 0.75 + Math.random() * 0.2,
      flags: generateMockFlags(document.type),
      ...(document.type === 'selfie' && { biometricMatch: 0.88 + Math.random() * 0.1 })
    };
    
    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  };

  const generateMockExtractedText = (type: string): string => {
    switch (type) {
      case 'photo_id':
        return `DOCUMENT TYPE: Driver's License
PROVINCE: Ontario, Canada
NAME: ${form.customerData?.firstName} ${form.customerData?.lastName}
DATE OF BIRTH: ${form.customerData?.dateOfBirth}
LICENSE NUMBER: ${form.customerData?.idNumber}
EXPIRY DATE: ${form.customerData?.idExpiryDate}
CLASS: G
ADDRESS: ${form.customerData?.address}
CITY: ${form.customerData?.city}
POSTAL CODE: ${form.customerData?.postalCode}

SECURITY FEATURES DETECTED:
✓ Holographic overlay present
✓ UV reactive ink detected  
✓ Microprinting verified
✓ RFID chip readable
✓ Barcode scannable

DATA VALIDATION:
✓ Checksum validation passed
✓ Format compliance verified
✓ Cross-reference match confirmed`;

      case 'proof_of_address':
        return `DOCUMENT TYPE: Utility Bill
PROVIDER: Hydro One
ACCOUNT HOLDER: ${form.customerData?.firstName} ${form.customerData?.lastName}
SERVICE ADDRESS: ${form.customerData?.address}
${form.customerData?.city}, ${form.customerData?.province} ${form.customerData?.postalCode}
BILLING PERIOD: November 2024
ISSUE DATE: December 1, 2024
AMOUNT: $127.45

VERIFICATION CHECKS:
✓ Address matches customer data
✓ Name matches provided information  
✓ Document date within 90 days
✓ Format matches known templates
✓ No tampering detected`;

      case 'selfie':
        return `BIOMETRIC ANALYSIS RESULTS:
Face Detection: SUCCESSFUL
Quality Score: 94/100
Lighting: Adequate
Resolution: 1920x1080 (HD)
Face Coverage: 87% visible
Eye Detection: Both eyes clearly visible
Expression: Neutral
Head Position: Frontal (±5°)

LIVENESS DETECTION:
✓ Real person detected
✓ No screen reflection
✓ Natural skin texture
✓ Micro-expressions detected
✓ Anti-spoofing passed

COMPARISON METRICS:
Facial geometry match: 92%
Eye pattern similarity: 89%  
Nose structure: 95%
Mouth region: 88%
Overall confidence: 91%`;

      default:
        return 'Document processing completed with advanced OCR analysis';
    }
  };

  const generateMockFlags = (type: string): string[] => {
    const flags = [];
    if (Math.random() > 0.7) flags.push('Low image quality detected');
    if (Math.random() > 0.8) flags.push('Potential tampering detected');
    if (type === 'photo_id' && Math.random() > 0.9) flags.push('Expiry date approaching');
    if (type === 'selfie' && Math.random() > 0.8) flags.push('Face partially obscured');
    return flags;
  };

  React.useEffect(() => {
    if (selectedDocument) {
      analyzeDocument(selectedDocument);
    }
  }, [selectedDocument]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleApprove = (documentId: string) => {
    onApprove(form.id, documentId);
  };

  const handleReject = (documentId: string) => {
    setPendingDocumentId(documentId);
    setShowRejectionDialog(true);
  };

  const submitRejection = () => {
    if (pendingDocumentId && rejectionReason.trim()) {
      onReject(form.id, pendingDocumentId, rejectionReason);
      setShowRejectionDialog(false);
      setRejectionReason('');
      setPendingDocumentId(null);
    }
  };

  const getDocumentTypeDisplay = (type: string) => {
    switch (type) {
      case 'photo_id': return '🆔 Photo ID';
      case 'proof_of_address': return '🏠 Proof of Address';
      case 'selfie': return '🤳 Selfie';
      default: return '📄 Document';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAuthenticityColor = (authenticity: string) => {
    switch (authenticity) {
      case 'verified': return 'text-green-600';
      case 'suspicious': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const calculateOverallScore = () => {
    if (!analysis) return 0;
    return Math.round((analysis.confidence + analysis.qualityScore + (analysis.biometricMatch || 1)) / 3 * 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Document Review</h2>
            <p className="text-sm text-gray-600">
              Customer: {form.customerData?.firstName} {form.customerData?.lastName}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {analysis && (
              <div className="flex items-center gap-2">
                <div className={`text-sm font-medium px-3 py-1 rounded ${
                  calculateOverallScore() >= 80 ? 'bg-green-100 text-green-800' :
                  calculateOverallScore() >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Overall Score: {calculateOverallScore()}%
                </div>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Document List Sidebar */}
          <div className="w-64 border-r bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Documents</h3>
              
              <div className="space-y-2">
                {form.documents?.map((document) => (
                  <button
                    key={document.id}
                    onClick={() => setSelectedDocument(document)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedDocument?.id === document.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {getDocumentTypeDisplay(document.type)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(document.verificationStatus)}`}>
                        {document.verificationStatus.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {document.fileName}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {(document.fileSize / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Document Viewer */}
          <div className="flex-1 flex flex-col">
            
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedDocument ? getDocumentTypeDisplay(selectedDocument.type) : 'No Document Selected'}
                </span>
                
                {selectedDocument && (
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedDocument.verificationStatus)}`}>
                    {selectedDocument.verificationStatus.toUpperCase()}
                  </span>
                )}
              </div>

              {selectedDocument && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 mr-4">
                    <span className="text-xs text-gray-600">Zoom:</span>
                    <span className="text-xs font-mono">{zoom}%</span>
                  </div>
                  
                  <button
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={handleRotate}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Document Display Area */}
            <div className="flex-1 relative overflow-auto bg-gray-100">
              {selectedDocument ? (
                <div className="flex items-center justify-center h-full p-4">
                  <div 
                    className="bg-white border shadow-lg relative"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: 'center',
                    }}
                  >
                    {selectedDocument.encryptedData && selectedDocument.mimeType?.startsWith('image/') ? (
                      <img
                        ref={imageRef}
                        src={selectedDocument.encryptedData}
                        alt={selectedDocument.fileName}
                        style={{ maxWidth: '80vw', maxHeight: '65vh', display: 'block' }}
                      />
                    ) : (
                      <div className="w-96 h-64 flex items-center justify-center text-6xl">
                        {selectedDocument.type === 'photo_id' && '🆔'}
                        {selectedDocument.type === 'selfie' && '🤳'}
                        {selectedDocument.type === 'proof_of_address' && '📄'}
                      </div>
                    )}

                    {/* Overlay info */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                      <div className="text-center text-white opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-sm font-medium mb-2">{selectedDocument.fileName}</p>
                        <p className="text-xs">Click to enhance</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a document to review</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="w-80 border-l bg-white overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Analysis Results</h3>
                
                {selectedDocument && (
                  <button
                    onClick={() => analyzeDocument(selectedDocument)}
                    disabled={isAnalyzing}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    Re-analyze
                  </button>
                )}
              </div>

              {isAnalyzing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Analyzing document...</p>
                </div>
              ) : analysis && selectedDocument ? (
                <div className="space-y-4">
                  
                  {/* Authenticity Score */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Authenticity</span>
                      <span className={`text-xs font-medium ${getAuthenticityColor(analysis.authenticity)}`}>
                        {analysis.authenticity.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span>{Math.round(analysis.confidence * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality:</span>
                        <span>{Math.round(analysis.qualityScore * 100)}%</span>
                      </div>
                      {analysis.biometricMatch && (
                        <div className="flex justify-between">
                          <span>Face Match:</span>
                          <span>{Math.round(analysis.biometricMatch * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extracted Information */}
                  {analysis.extractedText && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Extracted Data</h4>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-white p-2 rounded border">
                        {analysis.extractedText}
                      </pre>
                    </div>
                  )}

                  {/* Flags and Warnings */}
                  {analysis.flags.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Issues Detected
                      </h4>
                      <ul className="text-xs text-amber-700 space-y-1">
                        {analysis.flags.map((flag, index) => (
                          <li key={index}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Document Comparison */}
                  {selectedDocument.type === 'selfie' && form.documents?.find(d => d.type === 'photo_id') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-blue-800 mb-2">Biometric Comparison</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center">
                          <div className="w-full h-16 bg-gray-200 rounded mb-1 flex items-center justify-center text-lg">🆔</div>
                          <p className="text-xs text-gray-600">ID Photo</p>
                        </div>
                        <div className="text-center">
                          <div className="w-full h-16 bg-gray-200 rounded mb-1 flex items-center justify-center text-lg">🤳</div>
                          <p className="text-xs text-gray-600">Selfie</p>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className={`text-sm font-medium ${
                          (analysis.biometricMatch || 0) > 0.8 ? 'text-green-600' : 
                          (analysis.biometricMatch || 0) > 0.6 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round((analysis.biometricMatch || 0) * 100)}% Match
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t">
                    <button
                      onClick={() => selectedDocument && handleApprove(selectedDocument.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      Approve Document
                    </button>
                    
                    <button
                      onClick={() => selectedDocument && handleReject(selectedDocument.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Reject Document
                    </button>
                    
                    <button className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      Request Better Image
                    </button>
                  </div>

                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a document to view analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rejection Dialog */}
        {showRejectionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reject Document</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please provide a detailed reason for rejecting this document..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectionDialog(false);
                    setRejectionReason('');
                    setPendingDocumentId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Document
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default DocumentReviewer;