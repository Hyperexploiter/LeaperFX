// ID Validation Models for FINTRAC Compliance System
// Comprehensive types for document processing, biometric matching, and validation workflow

/**
 * Supported document types for ID validation
 */
export type DocumentType = 
  | 'drivers_license' 
  | 'passport' 
  | 'provincial_id' 
  | 'health_card' 
  | 'citizenship_card' 
  | 'permanent_resident_card'
  | 'other_government_id';

/**
 * Document validation status
 */
export type ValidationStatus = 
  | 'pending'           // Initial upload
  | 'processing'        // OCR/Analysis in progress
  | 'review_required'   // Store owner review needed
  | 'approved'          // Validation passed
  | 'rejected'          // Validation failed
  | 'expired';          // Document expired

/**
 * Biometric matching confidence levels
 */
export type BiometricConfidence = 'low' | 'medium' | 'high' | 'very_high';

/**
 * File upload source tracking
 */
export type UploadSource = 
  | 'customer_mobile'   // Customer's phone camera
  | 'store_scanner'     // Store owner scanner
  | 'airdrop'          // AirDrop transfer
  | 'bluetooth'        // Bluetooth transfer
  | 'email'            // Email attachment
  | 'drag_drop'        // Drag and drop upload
  | 'file_browser';    // File browser selection

/**
 * Core document information extracted from ID
 */
export interface ExtractedDocumentData {
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  
  // Document Details
  documentType: DocumentType;
  documentNumber: string;
  issuingAuthority: string;
  issuingProvince?: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  isExpired: boolean;
  
  // Address Information (if available)
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  
  // Additional Fields
  gender?: 'M' | 'F' | 'X';
  height?: string;
  eyeColor?: string;
  restrictions?: string[];
  
  // Extracted with OCR confidence
  extractionConfidence: number; // 0-100%
  fieldsExtracted: string[];
  fieldsWithLowConfidence: string[];
}

/**
 * Document authenticity verification results
 */
export interface DocumentAuthenticity {
  isAuthentic: boolean;
  confidenceScore: number; // 0-100%
  
  // Security Feature Checks
  securityFeatures: {
    hologram: { present: boolean; authentic: boolean; confidence: number };
    watermark: { present: boolean; authentic: boolean; confidence: number };
    microtext: { present: boolean; authentic: boolean; confidence: number };
    uvFeatures: { present: boolean; authentic: boolean; confidence: number };
    barcodeQR: { present: boolean; valid: boolean; dataMatches: boolean };
    magneticStripe: { present: boolean; valid: boolean };
  };
  
  // Document Quality Checks
  qualityChecks: {
    imageQuality: number; // 0-100%
    lighting: 'poor' | 'fair' | 'good' | 'excellent';
    blur: number; // 0-100%, lower is better
    glare: number; // 0-100%, lower is better
    completeness: number; // 0-100%, higher is better
  };
  
  // Template Matching
  templateMatch: {
    matched: boolean;
    templateVersion: string;
    similarityScore: number;
    expectedFeatures: string[];
    missingFeatures: string[];
  };
  
  // Red Flags
  redFlags: string[];
  warningFlags: string[];
}

/**
 * Biometric matching results between selfie and ID photo
 */
export interface BiometricMatch {
  isMatch: boolean;
  confidence: BiometricConfidence;
  similarityScore: number; // 0-100%
  
  // Face Analysis
  faceAnalysis: {
    faceDetected: boolean;
    faceQuality: number; // 0-100%
    pose: { yaw: number; pitch: number; roll: number };
    landmarks: { detected: number; total: number };
    occlusion: { forehead: boolean; eyes: boolean; nose: boolean; mouth: boolean };
  };
  
  // Matching Details
  matchingFeatures: {
    facialStructure: number;
    eyeShape: number;
    noseShape: number;
    mouthShape: number;
    jawline: number;
    overallSimilarity: number;
  };
  
  // Liveness Detection (for selfie)
  livenessCheck?: {
    isLive: boolean;
    confidence: number;
    flags: string[];
  };
  
  // Quality Metrics
  photoQuality: {
    selfieQuality: number;
    idPhotoQuality: number;
    bothSuitableForMatching: boolean;
  };
}

/**
 * Document file information
 */
export interface DocumentFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  source: UploadSource;
  
  // File Security
  encrypted: boolean;
  encryptionKey?: string;
  hash: string;
  
  // Processing Status
  processed: boolean;
  processingStarted?: string;
  processingCompleted?: string;
  
  // File Metadata
  dimensions?: { width: number; height: number };
  format: string;
  pages?: number; // For PDF documents
  
  // Storage Information
  storagePath: string;
  backupPath?: string;
  retentionDate: string; // Auto-delete date for compliance
}

/**
 * Store owner review decision
 */
export interface ReviewDecision {
  decision: 'approve' | 'reject' | 'request_resubmission';
  reviewedBy: string;
  reviewedAt: string;
  
  // Detailed Review
  documentQuality: 'poor' | 'fair' | 'good' | 'excellent';
  dataAccuracy: 'poor' | 'fair' | 'good' | 'excellent';
  authenticityAssessment: 'suspicious' | 'uncertain' | 'likely_authentic' | 'authentic';
  biometricMatch: 'no_match' | 'poor_match' | 'good_match' | 'excellent_match';
  
  // Comments and Corrections
  comments: string;
  dataCorrections: { [field: string]: string };
  flaggedIssues: string[];
  
  // Compliance Flags
  complianceNotes: string;
  requiresEscalation: boolean;
  escalationReason?: string;
}

/**
 * Validation workflow audit entry
 */
export interface ValidationAuditEntry {
  id: string;
  validationSessionId: string;
  timestamp: string;
  
  // Action Details
  action: 'upload' | 'ocr_complete' | 'authenticity_check' | 'biometric_match' | 'store_review' | 'final_decision' | 'file_access';
  performedBy: 'system' | 'customer' | 'store_owner';
  userId?: string;
  
  // Action Data
  details: any;
  previousState?: ValidationStatus;
  newState?: ValidationStatus;
  
  // System Information
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: { lat: number; lng: number };
}

/**
 * Complete ID validation session
 */
export interface IDValidationSession {
  id: string;
  customerId: string;
  transactionId?: string;
  
  // Session Status
  status: ValidationStatus;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
  
  // Documents
  primaryDocument: DocumentFile;
  selfieDocument?: DocumentFile;
  supportingDocuments: DocumentFile[];
  
  // Processing Results
  extractedData?: ExtractedDocumentData;
  authenticityResult?: DocumentAuthenticity;
  biometricResult?: BiometricMatch;
  
  // Store Owner Review
  reviewDecision?: ReviewDecision;
  reviewNotes: string;
  
  // Compliance Information
  fintracCompliant: boolean;
  complianceFlags: string[];
  riskScore: number;
  riskFactors: string[];
  
  // File Sharing History
  sharingHistory: {
    method: UploadSource;
    timestamp: string;
    success: boolean;
    error?: string;
  }[];
  
  // Processing Timeline
  processingTimeline: {
    step: string;
    startTime: string;
    endTime?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    error?: string;
  }[];
  
  // Audit Trail
  auditTrail: ValidationAuditEntry[];
  
  // System Metadata
  version: string;
  processingEngine: string;
  lastUpdated: string;
}

/**
 * Scanner integration configuration
 */
export interface ScannerConfig {
  id: string;
  name: string;
  type: 'twain' | 'wia' | 'network' | 'usb';
  
  // Connection Details
  connectionString: string;
  isOnline: boolean;
  lastSeen: string;
  
  // Capabilities
  maxResolution: number;
  supportedFormats: string[];
  hasAdf: boolean; // Automatic Document Feeder
  supportsDuplex: boolean;
  
  // Settings
  defaultResolution: number;
  defaultFormat: string;
  autoDetectDocuments: boolean;
  enhanceImage: boolean;
  
  // Status
  currentStatus: 'idle' | 'scanning' | 'error' | 'offline';
  errorMessage?: string;
  documentsInQueue: number;
}

/**
 * File sharing detection result
 */
export interface FileShareDetection {
  detected: boolean;
  method: UploadSource;
  
  // Detection Details
  deviceInfo?: {
    name: string;
    type: string;
    identifier: string;
  };
  
  // File Transfer Info
  transferStarted: string;
  transferCompleted?: string;
  transferSuccess: boolean;
  transferError?: string;
  
  // Security
  encryptedTransfer: boolean;
  verificationCode?: string;
  
  // Files Received
  files: {
    name: string;
    size: number;
    type: string;
    path: string;
  }[];
}

/**
 * Validation workflow configuration
 */
export interface ValidationWorkflowConfig {
  // OCR Settings
  ocrProvider: 'azure' | 'aws' | 'google' | 'tesseract';
  ocrConfidenceThreshold: number;
  
  // Biometric Settings
  biometricProvider: 'azure' | 'aws' | 'faceplusplus' | 'local';
  biometricThreshold: number;
  requireLivenessCheck: boolean;
  
  // Review Requirements
  autoApproveThreshold: number;
  requireStoreOwnerReview: boolean;
  escalationThreshold: number;
  
  // Security Settings
  encryptDocuments: boolean;
  documentRetentionDays: number;
  requireSecureTransfer: boolean;
  
  // Integration Settings
  enableScannerFallback: boolean;
  enableFileSharing: boolean;
  allowedShareMethods: UploadSource[];
  maxFileSize: number;
  allowedFileTypes: string[];
}

/**
 * Real-time validation status update
 */
export interface ValidationStatusUpdate {
  sessionId: string;
  status: ValidationStatus;
  timestamp: string;
  
  // Progress Information
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  
  // Step Details
  stepDetails: {
    name: string;
    description: string;
    started: string;
    completed?: string;
    error?: string;
  };
  
  // Results (if step completed)
  stepResult?: any;
  
  // User Notifications
  userMessage: string;
  showProgress: boolean;
  requiresUserAction: boolean;
  actionRequired?: string;
}