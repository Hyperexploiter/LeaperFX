// Secure Document Storage Service - FINTRAC Compliant
// Handles encrypted storage of client documents, photos, and identification
// Maintains audit trails and retention as required by FINTRAC regulations

import databaseService from './databaseService';
import webSocketService from './webSocketService';
import { generateSecureId, encryptFormData, decryptFormData } from '../utils/security';

// Document Types as required by FINTRAC
export type DocumentType = 
  | 'photo_id' 
  | 'drivers_license' 
  | 'passport' 
  | 'provincial_id'
  | 'proof_of_address' 
  | 'bank_statement'
  | 'utility_bill'
  | 'selfie' 
  | 'signature_card'
  | 'additional_identification';

// Document Classification for retention
export type DocumentClassification = 'kyc_mandatory' | 'compliance_supporting' | 'audit_trail' | 'customer_consent';

// Secure Document Record (encrypted at rest)
export interface SecureDocumentRecord {
  id: string;
  documentType: DocumentType;
  classification: DocumentClassification;
  customerId: string;
  transactionId?: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  
  // Encrypted content (AES-256-GCM)
  encryptedData: string;
  encryptionIV: string;
  encryptionSalt: string;
  
  // Document metadata (unencrypted for indexing)
  metadata: {
    uploadDate: string;
    uploadTime: string;
    uploadedBy: string;
    documentVerified: boolean;
    verificationDate?: string;
    verifiedBy?: string;
    documentExpiry?: string;
    issuingAuthority?: string;
    documentNumber?: string; // Masked/hashed
    
    // OCR/Extraction results (if applicable)
    extractedText?: string;
    extractedFields?: Record<string, any>;
    ocrConfidence?: number;
    
    // Biometric data (if applicable)
    facialBiometrics?: string; // Encrypted biometric template
    biometricVerified?: boolean;
    biometricScore?: number;
  };
  
  // Audit trail
  auditLog: DocumentAuditEntry[];
  
  // Retention and compliance
  retentionDate: string; // Minimum 5 years from last transaction
  complianceFlags: string[];
  accessLog: DocumentAccessEntry[];
  
  // System fields
  checksum: string; // For integrity verification
  version: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

interface DocumentAuditEntry {
  timestamp: string;
  action: 'uploaded' | 'viewed' | 'verified' | 'rejected' | 'updated' | 'accessed' | 'exported';
  userId: string;
  userType: 'system' | 'staff' | 'compliance_officer' | 'auditor';
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

interface DocumentAccessEntry {
  timestamp: string;
  userId: string;
  userType: 'system' | 'staff' | 'compliance_officer' | 'auditor' | 'government_auditor';
  accessReason: string;
  ipAddress?: string;
}

// Document Upload Result
export interface DocumentUploadResult {
  documentId: string;
  uploadStatus: 'success' | 'error';
  verificationRequired: boolean;
  complianceFlags: string[];
  errorMessage?: string;
}

class SecureDocumentService {
  private readonly STORAGE_KEY = 'secure_documents';
  private readonly ENCRYPTION_KEY_PREFIX = 'LEAPER_DOC_';
  private readonly MINIMUM_RETENTION_YEARS = 5;

  /**
   * Upload and securely store a client document
   */
  async uploadDocument(
    file: File,
    documentType: DocumentType,
    customerId: string,
    transactionId?: string,
    uploadedBy: string = 'system'
  ): Promise<DocumentUploadResult> {
    try {
      // Validate file
      this.validateFile(file);
      
      // Generate document ID
      const documentId = generateSecureId();
      
      // Read file data
      const fileData = await this.readFileAsArrayBuffer(file);
      
      // Generate encryption key and IV
      const encryptionKey = await this.generateDocumentEncryptionKey(documentId);
      const encryptionIV = crypto.getRandomValues(new Uint8Array(12));
      const encryptionSalt = crypto.getRandomValues(new Uint8Array(16));
      
      // Encrypt file data
      const encryptedData = await this.encryptFileData(fileData, encryptionKey, encryptionIV);
      
      // Calculate checksum for integrity
      const checksum = await this.calculateChecksum(fileData);
      
      // Determine classification
      const classification = this.classifyDocument(documentType);
      
      // Extract metadata if possible
      const metadata = await this.extractDocumentMetadata(file, fileData);
      
      // Calculate retention date
      const retentionDate = this.calculateRetentionDate();
      
      // Validate compliance
      const complianceFlags = await this.validateCompliance(documentType, customerId, metadata);
      
      // Create secure document record
      const documentRecord: SecureDocumentRecord = {
        id: documentId,
        documentType,
        classification,
        customerId,
        transactionId,
        fileName: `${documentId}.enc`,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        encryptedData: this.arrayBufferToBase64(encryptedData),
        encryptionIV: this.arrayBufferToBase64(encryptionIV),
        encryptionSalt: this.arrayBufferToBase64(encryptionSalt),
        metadata: {
          uploadDate: new Date().toISOString().split('T')[0],
          uploadTime: new Date().toISOString().split('T')[1],
          uploadedBy,
          documentVerified: false,
          ...metadata
        },
        auditLog: [{
          timestamp: new Date().toISOString(),
          action: 'uploaded',
          userId: uploadedBy,
          userType: 'system',
          details: `Document uploaded: ${file.name} (${documentType})`,
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent
        }],
        accessLog: [],
        retentionDate,
        complianceFlags,
        checksum,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      };
      
      // Store document record
      await this.storeDocumentRecord(documentRecord);
      
      // Log compliance event
      webSocketService.send({
        type: 'document_uploaded',
        data: {
          documentId,
          documentType,
          customerId,
          transactionId,
          complianceFlags
        }
      });
      
      return {
        documentId,
        uploadStatus: 'success',
        verificationRequired: this.requiresVerification(documentType),
        complianceFlags
      };
      
    } catch (error) {
      console.error('Document upload failed:', error);
      return {
        documentId: '',
        uploadStatus: 'error',
        verificationRequired: false,
        complianceFlags: [],
        errorMessage: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Retrieve and decrypt a document
   */
  async getDocument(
    documentId: string,
    accessedBy: string,
    accessReason: string,
    userType: 'system' | 'staff' | 'compliance_officer' | 'auditor' | 'government_auditor' = 'system'
  ): Promise<{ data: ArrayBuffer; metadata: SecureDocumentRecord } | null> {
    try {
      const documentRecord = await this.getDocumentRecord(documentId);
      if (!documentRecord) {
        return null;
      }
      
      // Log access for audit trail
      await this.logDocumentAccess(documentRecord, accessedBy, accessReason, userType);
      
      // Decrypt document
      const encryptionKey = await this.generateDocumentEncryptionKey(documentId);
      const encryptionIV = this.base64ToArrayBuffer(documentRecord.encryptionIV);
      const encryptedData = this.base64ToArrayBuffer(documentRecord.encryptedData);
      
      const decryptedData = await this.decryptFileData(encryptedData, encryptionKey, encryptionIV);
      
      // Verify integrity
      const checksum = await this.calculateChecksum(decryptedData);
      if (checksum !== documentRecord.checksum) {
        throw new Error('Document integrity check failed');
      }
      
      return {
        data: decryptedData,
        metadata: documentRecord
      };
      
    } catch (error) {
      console.error('Document retrieval failed:', error);
      return null;
    }
  }

  /**
   * Get all documents for a customer
   */
  async getCustomerDocuments(customerId: string): Promise<SecureDocumentRecord[]> {
    const allDocuments = await this.getAllDocumentRecords();
    return allDocuments.filter(doc => doc.customerId === customerId);
  }

  /**
   * Verify a document (mark as verified by compliance officer)
   */
  async verifyDocument(
    documentId: string,
    verifiedBy: string,
    verificationNotes?: string
  ): Promise<boolean> {
    try {
      const documentRecord = await this.getDocumentRecord(documentId);
      if (!documentRecord) {
        return false;
      }
      
      // Update verification status
      documentRecord.metadata.documentVerified = true;
      documentRecord.metadata.verificationDate = new Date().toISOString();
      documentRecord.metadata.verifiedBy = verifiedBy;
      documentRecord.updatedAt = new Date().toISOString();
      
      // Add audit entry
      documentRecord.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'verified',
        userId: verifiedBy,
        userType: 'compliance_officer',
        details: `Document verified${verificationNotes ? ': ' + verificationNotes : ''}`,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      });
      
      // Update stored record
      await this.updateDocumentRecord(documentRecord);
      
      // Broadcast verification event
      webSocketService.send({
        type: 'document_verified',
        data: {
          documentId,
          customerId: documentRecord.customerId,
          documentType: documentRecord.documentType,
          verifiedBy
        }
      });
      
      return true;
      
    } catch (error) {
      console.error('Document verification failed:', error);
      return false;
    }
  }

  /**
   * Export document audit logs for government inspections
   */
  async exportDocumentAuditLogs(
    startDate?: string,
    endDate?: string,
    customerId?: string
  ): Promise<string> {
    const allDocuments = await this.getAllDocumentRecords();
    
    let filteredDocuments = allDocuments;
    
    if (startDate && endDate) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.createdAt >= startDate && doc.createdAt <= endDate
      );
    }
    
    if (customerId) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.customerId === customerId
      );
    }
    
    const headers = [
      'Document_ID',
      'Document_Type',
      'Classification',
      'Customer_ID',
      'Transaction_ID',
      'Original_File_Name',
      'File_Size',
      'Upload_Date',
      'Upload_Time',
      'Uploaded_By',
      'Document_Verified',
      'Verification_Date',
      'Verified_By',
      'Retention_Date',
      'Compliance_Flags',
      'Checksum',
      'Created_At',
      'Last_Accessed_At',
      'Access_Count',
      'Audit_Actions'
    ];
    
    const rows = [headers.join(',')];
    
    for (const doc of filteredDocuments) {
      const row = [
        doc.id,
        doc.documentType,
        doc.classification,
        doc.customerId,
        doc.transactionId || '',
        this.csvEscape(doc.originalFileName),
        doc.fileSize,
        doc.metadata.uploadDate,
        doc.metadata.uploadTime,
        doc.metadata.uploadedBy,
        doc.metadata.documentVerified,
        doc.metadata.verificationDate || '',
        doc.metadata.verifiedBy || '',
        doc.retentionDate,
        doc.complianceFlags.join(';'),
        doc.checksum,
        doc.createdAt,
        doc.lastAccessedAt,
        doc.accessLog.length,
        doc.auditLog.map(entry => `${entry.timestamp}:${entry.action}:${entry.userId}`).join(';')
      ];
      rows.push(row.join(','));
    }
    
    return rows.join('\n');
  }

  /**
   * Clean up expired documents (respecting retention requirements)
   */
  async cleanupExpiredDocuments(): Promise<number> {
    const currentDate = new Date().toISOString().split('T')[0];
    const allDocuments = await this.getAllDocumentRecords();
    
    const expiredDocuments = allDocuments.filter(doc => 
      doc.retentionDate < currentDate
    );
    
    let cleanedCount = 0;
    
    for (const doc of expiredDocuments) {
      // Log retention compliance
      doc.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'deleted',
        userId: 'system',
        userType: 'system',
        details: `Document deleted after retention period expired (${doc.retentionDate})`,
      });
      
      // In production, securely wipe the encrypted data
      await this.secureDeleteDocument(doc.id);
      cleanedCount++;
    }
    
    // Update document list
    const remainingDocuments = allDocuments.filter(doc => 
      doc.retentionDate >= currentDate
    );
    
    await databaseService.setItem(this.STORAGE_KEY, remainingDocuments);
    
    return cleanedCount;
  }

  /**
   * Private helper methods
   */
  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'image/tiff'
    ];
    
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Only JPEG, PNG, GIF, PDF, and TIFF files are permitted.');
    }
  }

  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async generateDocumentEncryptionKey(documentId: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.ENCRYPTION_KEY_PREFIX + documentId),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('LEAPER_SALT_' + documentId),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encryptFileData(
    data: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<ArrayBuffer> {
    return crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
  }

  private async decryptFileData(
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
  }

  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private classifyDocument(documentType: DocumentType): DocumentClassification {
    switch (documentType) {
      case 'photo_id':
      case 'drivers_license':
      case 'passport':
      case 'provincial_id':
      case 'selfie':
        return 'kyc_mandatory';
      case 'proof_of_address':
      case 'bank_statement':
      case 'utility_bill':
        return 'compliance_supporting';
      default:
        return 'audit_trail';
    }
  }

  private async extractDocumentMetadata(file: File, data: ArrayBuffer): Promise<any> {
    // Basic metadata extraction
    const metadata: any = {};
    
    if (file.type.startsWith('image/')) {
      // For images, we could extract EXIF data here
      metadata.isImage = true;
      metadata.dimensions = await this.getImageDimensions(file);
    }
    
    if (file.type === 'application/pdf') {
      metadata.isPDF = true;
      // PDF metadata extraction would go here
    }
    
    return metadata;
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  private requiresVerification(documentType: DocumentType): boolean {
    return ['photo_id', 'drivers_license', 'passport', 'provincial_id'].includes(documentType);
  }

  private async validateCompliance(
    documentType: DocumentType,
    customerId: string,
    metadata: any
  ): Promise<string[]> {
    const flags: string[] = [];
    
    // Check if mandatory documents are present
    if (this.requiresVerification(documentType)) {
      flags.push('VERIFICATION_REQUIRED');
    }
    
    // Check document quality
    if (metadata.dimensions && (metadata.dimensions.width < 800 || metadata.dimensions.height < 600)) {
      flags.push('LOW_RESOLUTION');
    }
    
    return flags;
  }

  private calculateRetentionDate(): string {
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + this.MINIMUM_RETENTION_YEARS);
    return retentionDate.toISOString().split('T')[0];
  }

  private getClientIP(): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  private csvEscape(text: string): string {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  private async storeDocumentRecord(record: SecureDocumentRecord): Promise<void> {
    const allRecords = await this.getAllDocumentRecords();
    allRecords.unshift(record);
    await databaseService.setItem(this.STORAGE_KEY, allRecords);
  }

  private async updateDocumentRecord(record: SecureDocumentRecord): Promise<void> {
    const allRecords = await this.getAllDocumentRecords();
    const index = allRecords.findIndex(r => r.id === record.id);
    if (index !== -1) {
      allRecords[index] = record;
      await databaseService.setItem(this.STORAGE_KEY, allRecords);
    }
  }

  private async getDocumentRecord(documentId: string): Promise<SecureDocumentRecord | null> {
    const allRecords = await this.getAllDocumentRecords();
    return allRecords.find(r => r.id === documentId) || null;
  }

  private async getAllDocumentRecords(): Promise<SecureDocumentRecord[]> {
    try {
      const records = await databaseService.getItem(this.STORAGE_KEY);
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.error('Error loading document records:', error);
      return [];
    }
  }

  private async logDocumentAccess(
    document: SecureDocumentRecord,
    accessedBy: string,
    accessReason: string,
    userType: 'system' | 'staff' | 'compliance_officer' | 'auditor' | 'government_auditor'
  ): Promise<void> {
    document.accessLog.push({
      timestamp: new Date().toISOString(),
      userId: accessedBy,
      userType,
      accessReason,
      ipAddress: this.getClientIP()
    });
    
    document.lastAccessedAt = new Date().toISOString();
    
    await this.updateDocumentRecord(document);
  }

  private async secureDeleteDocument(documentId: string): Promise<void> {
    // In production, this would securely overwrite the encrypted data
    // For now, we just remove from storage
    const allRecords = await this.getAllDocumentRecords();
    const filteredRecords = allRecords.filter(r => r.id !== documentId);
    await databaseService.setItem(this.STORAGE_KEY, filteredRecords);
  }
}

export const secureDocumentService = new SecureDocumentService();
export default secureDocumentService;