import databaseService from './databaseService';
import customerService from './customerService';
import transactionService from './transactionService';
import webSocketService from './webSocketService';
import secureDocumentService from './secureDocumentService';
import fintracValidationService from './fintracValidationService';
import { generateSecureId } from '../utils/security';

// Form-related type definitions
export interface FormSubmission {
  id: string;
  qrCodeId: string;
  customerData: any;
  documents: SecureDocument[];
  status: 'pending' | 'processing' | 'verified' | 'completed' | 'rejected';
  submissionDate: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  complianceFlags: string[];
  assignedTransactionId?: string;
  createdCustomerId?: string;
  createdAt: string;
  updatedAt: string;
  source: 'qr_scan' | 'manual_entry' | 'scanner_fallback';
  ipAddress?: string;
  userAgent?: string;
  
  // Enhanced FINTRAC fields
  fintracValidation?: any;
  riskAssessment?: any;
  complianceScore?: number;
}

export interface SecureDocument {
  id: string;
  type: 'photo_id' | 'proof_of_address' | 'selfie' | 'additional';
  fileName: string;
  fileSize: number;
  mimeType: string;
  encryptedData?: string;
  metadata: DocumentMetadata;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface DocumentMetadata {
  originalFileName: string;
  extractedText?: string;
  confidence?: number;
  documentType?: string;
  expiryDate?: string;
  issuer?: string;
  biometricMatch?: number;
}

export interface QRCodeSession {
  id: string;
  qrCodeUrl: string;
  sessionToken: string;
  expiresAt: string;
  isActive: boolean;
  scannedAt?: string;
  customerIP?: string;
  createdAt: string;
}

class FormService {
  private readonly STORAGE_KEY = 'form_submissions';
  private readonly QR_SESSIONS_KEY = 'qr_sessions';

  // Create a new form session for QR code generation
  async createFormSession(options?: {
    expiresIn?: number;
    requiredDocuments?: string[];
  }): Promise<{ sessionId: string; sessionUrl: string; expiresAt: string }> {
    try {
      console.log('Creating form session...');
      
      const sessionId = generateSecureId();
      const expiresIn = options?.expiresIn || 30 * 60 * 1000; // 30 minutes default
      const expiresAt = new Date(Date.now() + expiresIn).toISOString();

      const sessionToken = generateSecureId();
      
      const session: QRCodeSession = {
        id: sessionId,
        qrCodeUrl: `${window.location.origin}/form/${sessionId}?token=${sessionToken}`,
        sessionToken,
        expiresAt,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      console.log('Generated session:', session);

      // Store QR session
      const sessions = await this.getQRSessions();
      sessions.push(session);
      await databaseService.setItem(this.QR_SESSIONS_KEY, sessions);

      console.log('Stored session successfully');

      // Notify dashboard of new session (optional, ignore if WebSocket fails)
      try {
        webSocketService.send({ type: 'form_session_created', data: session });
      } catch (wsError) {
        console.warn('WebSocket notification failed:', wsError);
      }

      return {
        sessionId,
        sessionUrl: session.qrCodeUrl,
        expiresAt
      };
    } catch (error) {
      console.error('Error creating form session:', error);
      throw new Error(`Failed to create form session: ${error.message}`);
    }
  }

  // Generate secure QR code for customer form access
  async generateFormQR(options: {
    transactionId?: string;
    expiresIn?: number;
    requiredDocuments?: string[];
  }): Promise<QRCodeSession> {
    const sessionId = generateSecureId();
    const sessionToken = generateSecureId();
    const expiresIn = options.expiresIn || 30 * 60 * 1000; // 30 minutes default

    const session: QRCodeSession = {
      id: sessionId,
      qrCodeUrl: `${window.location.origin}/customer-form/${sessionId}?token=${sessionToken}`,
      sessionToken,
      expiresAt: new Date(Date.now() + expiresIn).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Store QR session
    const sessions = await this.getQRSessions();
    sessions.push(session);
    await databaseService.setItem(this.QR_SESSIONS_KEY, sessions);

    // Notify dashboard of new QR code
    webSocketService.send({ type: 'qr_code_generated', data: session });

    return session;
  }

  // Validate QR code session
  async validateQRSession(sessionId: string, token: string): Promise<boolean> {
    const sessions = await this.getQRSessions();
    const session = sessions.find(s => s.id === sessionId && s.sessionToken === token);

    if (!session || !session.isActive) {
      return false;
    }

    if (new Date(session.expiresAt) < new Date()) {
      // Mark session as expired
      session.isActive = false;
      await databaseService.setItem(this.QR_SESSIONS_KEY, sessions);
      return false;
    }

    return true;
  }

  // Submit new form from customer
  async submitCustomerForm(formData: {
    sessionId: string;
    customerData: any;
    documents: File[];
    submissionSource: string;
  }): Promise<FormSubmission> {
    const formId = generateSecureId();
    
    // Process uploaded documents
    const processedDocuments: SecureDocument[] = [];
    for (const file of formData.documents) {
      const doc = await this.processDocument(file);
      processedDocuments.push(doc);
    }

    // Validate customer data
    const validationResult = customerService.validateCustomerDataSimplified(formData.customerData);
    
    const submission: FormSubmission = {
      id: formId,
      qrCodeId: formData.sessionId,
      customerData: formData.customerData,
      documents: processedDocuments,
      status: 'pending',
      submissionDate: new Date().toISOString(),
      verificationStatus: 'pending',
      complianceFlags: validationResult.warnings || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'qr_scan',
    };

    // Store form submission
    const submissions = await this.getAllFormSubmissions();
    submissions.unshift(submission);
    await databaseService.setItem(this.STORAGE_KEY, submissions);

    // Update QR session as scanned
    await this.markQRSessionAsScanned(formData.sessionId);

    // Notify store owner dashboard
    webSocketService.send({ type: 'form_submission_received', data: submission });

    // Log audit trail
    this.logAuditAction(formId, 'submitted', { source: formData.submissionSource });

    return submission;
  }

  // Get all form submissions
  async getAllFormSubmissions(): Promise<FormSubmission[]> {
    try {
      const submissions = await databaseService.getItem(this.STORAGE_KEY);
      return Array.isArray(submissions) ? submissions : [];
    } catch (error) {
      console.error('Error getting form submissions:', error);
      return [];
    }
  }

  // Get form submission by ID
  async getFormSubmissionById(id: string): Promise<FormSubmission | null> {
    const submissions = await this.getAllFormSubmissions();
    return submissions.find(s => s.id === id) || null;
  }

  // Process form submission (store owner action)
  async processFormSubmission(formId: string): Promise<FormSubmission> {
    const submissions = await this.getAllFormSubmissions();
    const formIndex = submissions.findIndex(s => s.id === formId);
    
    if (formIndex === -1) {
      throw new Error('Form submission not found');
    }

    // Update status to processing
    submissions[formIndex].status = 'processing';
    submissions[formIndex].updatedAt = new Date().toISOString();

    // Perform compliance checks
    const complianceResult = await this.performComplianceValidation(submissions[formIndex]);
    submissions[formIndex].complianceFlags = complianceResult.flags;

    // Save updated submission
    await databaseService.setItem(this.STORAGE_KEY, submissions);

    // Notify real-time updates
    webSocketService.send({ type: 'form_status_updated', data: submissions[formIndex] });

    // Log audit trail
    this.logAuditAction(formId, 'processed', { complianceFlags: complianceResult.flags });

    return submissions[formIndex];
  }

  // Update form status
  async updateFormStatus(formId: string, status: FormSubmission['status']): Promise<void> {
    const submissions = await this.getAllFormSubmissions();
    const formIndex = submissions.findIndex(s => s.id === formId);
    
    if (formIndex === -1) {
      throw new Error('Form submission not found');
    }

    submissions[formIndex].status = status;
    submissions[formIndex].updatedAt = new Date().toISOString();

    await databaseService.setItem(this.STORAGE_KEY, submissions);
    webSocketService.send({ type: 'form_status_updated', data: submissions[formIndex] });

    this.logAuditAction(formId, 'status_updated', { newStatus: status });
  }

  // Create customer from form data
  async createCustomerFromForm(formId: string): Promise<any> {
    const form = await this.getFormSubmissionById(formId);
    if (!form) {
      throw new Error('Form not found');
    }

    try {
      // Create customer using existing customerService
      const customer = await customerService.createCustomer({
        ...form.customerData,
        source: 'forms_tab',
        formId: formId,
        documents: form.documents.map(doc => ({
          type: doc.type,
          fileName: doc.fileName,
          verified: doc.verificationStatus === 'verified'
        }))
      });

      // Persist customerId back into the form for downstream linking
      const submissions = await this.getAllFormSubmissions();
      const idx = submissions.findIndex(s => s.id === formId);
      if (idx !== -1) {
        submissions[idx].customerData = {
          ...(submissions[idx].customerData || {}),
          id: customer.id
        };
        // If all docs verified, reflect verification status on form/customerData as appropriate
        const allDocsVerified = submissions[idx].documents.length > 0 && submissions[idx].documents.every(d => d.verificationStatus === 'verified');
        if (allDocsVerified) {
          submissions[idx].verificationStatus = 'verified';
          // Do not set status here; leave to updateFormStatus
        }
        submissions[idx].updatedAt = new Date().toISOString();
        await databaseService.setItem(this.STORAGE_KEY, submissions);
      }

      // Update form status (emits event)
      await this.updateFormStatus(formId, 'completed');

      // Log audit trail
      this.logAuditAction(formId, 'customer_created', { customerId: customer.id });

      return customer;
    } catch (error) {
      // Update form status to rejected if customer creation fails
      await this.updateFormStatus(formId, 'rejected');
      throw error;
    }
  }

  // Assign transaction to form
  async assignTransactionToForm(formId: string, transactionId: string): Promise<void> {
    const submissions = await this.getAllFormSubmissions();
    const formIndex = submissions.findIndex(s => s.id === formId);
    
    if (formIndex === -1) {
      throw new Error('Form submission not found');
    }

    const form = submissions[formIndex];

    // Ensure we have a customerId on the form; try to look up by email if missing
    try {
      if ((!form.customerData || !form.customerData.id) && form.customerData?.email) {
        const existing = await customerService.getCustomerByEmail(form.customerData.email);
        if (existing) {
          submissions[formIndex].customerData = { ...(form.customerData || {}), id: existing.id };
        }
      }
    } catch (lookupErr) {
      console.warn('Customer lookup during assignment failed:', lookupErr);
    }

    submissions[formIndex].assignedTransactionId = transactionId;
    submissions[formIndex].updatedAt = new Date().toISOString();

    await databaseService.setItem(this.STORAGE_KEY, submissions);

    // Link transaction in the transaction service with enhanced tracking
    const customerId = submissions[formIndex].createdCustomerId || submissions[formIndex].customerData?.id;
    if (customerId) {
      try {
        await transactionService.linkCustomerToTransaction(transactionId, customerId);
        
        // Update customer compliance after transaction assignment
        await customerService.updateCustomerCompliance(customerId);
        
      } catch (error) {
        console.error('Error linking transaction:', error);
      }
    }

    webSocketService.send({ type: 'form_transaction_assigned', data: {
      formId,
      transactionId,
      customerId,
      complianceValidated: !!submissions[formIndex].fintracValidation,
      form: submissions[formIndex]
    } });

    this.logAuditAction(formId, 'transaction_assigned', { 
      transactionId,
      customerId,
      complianceStatus: transaction.complianceStatus,
      validationResult: submissions[formIndex].fintracValidation?.isCompliant 
    });
  }

  // Upload document for existing form (scanner fallback)
  async uploadDocumentForForm(formId: string, file: File, documentType: string): Promise<SecureDocument> {
    const form = await this.getFormSubmissionById(formId);
    if (!form) {
      throw new Error('Form not found');
    }

    const document = await this.processDocument(file, documentType);
    
    // Add document to form
    const submissions = await this.getAllFormSubmissions();
    const formIndex = submissions.findIndex(s => s.id === formId);
    
    if (formIndex !== -1) {
      submissions[formIndex].documents.push(document);
      submissions[formIndex].updatedAt = new Date().toISOString();
      
      await databaseService.setItem(this.STORAGE_KEY, submissions);
      webSocketService.send({ type: 'form_document_uploaded', data: { formId, document } });
    }

    this.logAuditAction(formId, 'document_uploaded', { documentId: document.id, type: documentType });

    return document;
  }

  // Approve document for a form
  async approveDocument(formId: string, documentId: string): Promise<void> {
    const submissions = await this.getAllFormSubmissions();
    const index = submissions.findIndex(s => s.id === formId);
    if (index === -1) {
      throw new Error('Form not found');
    }
    const form = submissions[index];
    let changed = false;
    form.documents = form.documents.map(doc => {
      if (doc.id === documentId) {
        if (doc.verificationStatus !== 'verified') {
          changed = true;
          return { ...doc, verificationStatus: 'verified', rejectionReason: undefined };
        }
      }
      return doc;
    });
    if (!changed) return;
    form.updatedAt = new Date().toISOString();
    if (form.documents.length > 0 && form.documents.every(d => d.verificationStatus === 'verified')) {
      form.verificationStatus = 'verified';
      form.status = 'verified';
    }
    submissions[index] = form;
    await databaseService.setItem(this.STORAGE_KEY, submissions);
    webSocketService.send({ type: 'form_document_approved', data: { formId, documentId, form } });
    if (form.status === 'verified') {
      webSocketService.send({ type: 'form_status_updated', data: form });
      // If the form is linked to a customer, update KYC status accordingly
      if ((form as any).customerData?.id) {
        try {
          await customerService.verifyCustomerKYC((form as any).customerData.id, true, 'Documents verified via Forms');
          webSocketService.send({ type: 'customer_updated', data: { id: (form as any).customerData.id, kycStatus: 'verified' } });
        } catch (e) {
          console.warn('Failed to update customer KYC to verified:', e);
        }
      }
    }
    this.logAuditAction(formId, 'document_approved', { documentId });
  }

  // Reject document for a form
  async rejectDocument(formId: string, documentId: string, reason: string): Promise<void> {
    const submissions = await this.getAllFormSubmissions();
    const index = submissions.findIndex(s => s.id === formId);
    if (index === -1) {
      throw new Error('Form not found');
    }
    const form = submissions[index];
    let changed = false;
    form.documents = form.documents.map(doc => {
      if (doc.id === documentId) {
        if (doc.verificationStatus !== 'rejected' || doc.rejectionReason !== reason) {
          changed = true;
          return { ...doc, verificationStatus: 'rejected', rejectionReason: reason };
        }
      }
      return doc;
    });
    if (!changed) return;
    form.verificationStatus = 'rejected';
    form.status = 'rejected';
    form.updatedAt = new Date().toISOString();
    submissions[index] = form;
    await databaseService.setItem(this.STORAGE_KEY, submissions);
    webSocketService.send({ type: 'form_document_rejected', data: { formId, documentId, reason, form } });
    webSocketService.send({ type: 'form_status_updated', data: form });
    // If the form is linked to a customer, update KYC status to rejected
    if ((form as any).customerData?.id) {
      try {
        await customerService.verifyCustomerKYC((form as any).customerData.id, false, reason || 'Documents rejected via Forms');
        webSocketService.send({ type: 'customer_updated', data: { id: (form as any).customerData.id, kycStatus: 'rejected' } });
      } catch (e) {
        console.warn('Failed to update customer KYC to rejected:', e);
      }
    }
    this.logAuditAction(formId, 'document_rejected', { documentId, reason });
  }

  // Private helper methods
  private async processDocument(file: File, type?: string): Promise<SecureDocument> {
    const documentId = generateSecureId();

    // Attempt to generate a preview for image types (JPEG/PNG). In production, encrypt and store securely.
    let previewDataUrl: string | undefined = undefined;
    try {
      if (file && file.type && file.type.startsWith('image/')) {
        previewDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
      }
    } catch (e) {
      console.warn('Failed to generate document preview:', e);
    }
    
    const document: SecureDocument = {
      id: documentId,
      type: (type as any) || this.inferDocumentType(file.name),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      encryptedData: previewDataUrl, // used as a preview for images; replace with real encryption/storage in production
      metadata: {
        originalFileName: file.name,
      },
      verificationStatus: 'pending',
      uploadedAt: new Date().toISOString(),
    };

    return document;
  }

  private inferDocumentType(fileName: string): SecureDocument['type'] {
    const name = fileName.toLowerCase();
    if (name.includes('id') || name.includes('license') || name.includes('passport')) {
      return 'photo_id';
    }
    if (name.includes('selfie') || name.includes('photo')) {
      return 'selfie';
    }
    if (name.includes('address') || name.includes('bill') || name.includes('statement')) {
      return 'proof_of_address';
    }
    return 'additional';
  }

  private async performComplianceValidation(form: FormSubmission): Promise<{ flags: string[] }> {
    const flags: string[] = [];

    // Check for high-risk indicators
    if (form.customerData?.occupation?.toLowerCase().includes('cash')) {
      flags.push('HIGH_RISK_OCCUPATION');
    }

    // Check document completeness
    const hasPhotoId = form.documents.some(doc => doc.type === 'photo_id');
    const hasSelfie = form.documents.some(doc => doc.type === 'selfie');
    
    if (!hasPhotoId) flags.push('MISSING_PHOTO_ID');
    if (!hasSelfie) flags.push('MISSING_SELFIE');

    // Check for compliance thresholds
    if (form.assignedTransactionId) {
      try {
        const transaction = await transactionService.getTransactionById(form.assignedTransactionId);
        if (transaction && transaction.amount >= 10000) {
          flags.push('LARGE_TRANSACTION');
        }
      } catch (error) {
        console.error('Error checking transaction amount:', error);
      }
    }

    return { flags };
  }

  private async getQRSessions(): Promise<QRCodeSession[]> {
    try {
      const sessions = await databaseService.getItem(this.QR_SESSIONS_KEY);
      return Array.isArray(sessions) ? sessions : [];
    } catch (error) {
      console.error('Error getting QR sessions:', error);
      return [];
    }
  }

  private async markQRSessionAsScanned(sessionId: string): Promise<void> {
    const sessions = await this.getQRSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].scannedAt = new Date().toISOString();
      await databaseService.setItem(this.QR_SESSIONS_KEY, sessions);
    }
  }

  private logAuditAction(formId: string, action: string, details: any = {}): void {
    const auditEntry = {
      formId,
      action,
      timestamp: new Date().toISOString(),
      details,
      userAgent: navigator.userAgent,
    };

    // Log to console for now (in production, send to audit service)
    console.log('[FORM AUDIT]', auditEntry);

    // Store in WebSocket for real-time monitoring
    webSocketService.send({ type: 'form_audit_log', data: auditEntry });
  }

  // Clean up expired sessions (should be called periodically)
  async cleanupExpiredSessions(): Promise<void> {
    const sessions = await this.getQRSessions();
    const now = new Date();
    
    const activeSessions = sessions.filter(session => {
      const expiryDate = new Date(session.expiresAt);
      return expiryDate > now;
    });

    if (activeSessions.length !== sessions.length) {
      await databaseService.setItem(this.QR_SESSIONS_KEY, activeSessions);
      console.log(`Cleaned up ${sessions.length - activeSessions.length} expired QR sessions`);
    }
  }

  // Get form statistics for dashboard
  async getFormStatistics(): Promise<{
    totalSubmissions: number;
    pendingForms: number;
    completedForms: number;
    rejectedForms: number;
    todaySubmissions: number;
  }> {
    const submissions = await this.getAllFormSubmissions();
    const today = new Date().toDateString();

    return {
      totalSubmissions: submissions.length,
      pendingForms: submissions.filter(f => f.status === 'pending').length,
      completedForms: submissions.filter(f => f.status === 'completed').length,
      rejectedForms: submissions.filter(f => f.status === 'rejected').length,
      todaySubmissions: submissions.filter(f => 
        new Date(f.submissionDate).toDateString() === today
      ).length,
    };
  }

  // Enhanced statistics with FINTRAC compliance metrics
  async getEnhancedFormStatistics(): Promise<{
    total: number;
    today: number;
    pending: number;
    verified: number;
    completed: number;
    rejected: number;
    todayPending: number;
    todayCompleted: number;
    // Enhanced FINTRAC metrics
    withTransactions: number;
    complianceValidated: number;
    requiresReview: number;
    averageComplianceScore: number;
  }> {
    const submissions = await this.getAllFormSubmissions();
    const today = new Date().toISOString().split('T')[0];
    
    const todaySubmissions = submissions.filter(s => s.createdAt.startsWith(today));
    const withTransactions = submissions.filter(s => !!s.assignedTransactionId).length;
    const complianceValidated = submissions.filter(s => !!s.fintracValidation).length;
    const requiresReview = submissions.filter(s => 
      s.status === 'pending' || 
      (s.fintracValidation && !s.fintracValidation.isCompliant)
    ).length;
    
    const scoresSum = submissions.reduce((sum, s) => sum + (s.complianceScore || 0), 0);
    const averageComplianceScore = submissions.length > 0 ? scoresSum / submissions.length : 0;
    
    return {
      total: submissions.length,
      today: todaySubmissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      verified: submissions.filter(s => s.status === 'verified').length,
      completed: submissions.filter(s => s.status === 'completed').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
      todayPending: todaySubmissions.filter(s => s.status === 'pending').length,
      todayCompleted: todaySubmissions.filter(s => s.status === 'completed').length,
      withTransactions,
      complianceValidated,
      requiresReview,
      averageComplianceScore
    };
  }

  // Get forms by compliance status
  async getFormsByComplianceStatus(status: 'compliant' | 'pending' | 'non_compliant'): Promise<FormSubmission[]> {
    const submissions = await this.getAllFormSubmissions();
    return submissions.filter(s => {
      if (!s.fintracValidation) return status === 'pending';
      
      if (status === 'compliant') {
        return s.fintracValidation.isCompliant && (s.complianceScore || 0) >= 90;
      } else if (status === 'non_compliant') {
        return !s.fintracValidation.isCompliant || (s.complianceScore || 0) < 70;
      } else {
        return !s.fintracValidation.isCompliant && (s.complianceScore || 0) >= 70;
      }
    });
  }
  
  // Get forms requiring compliance review
  async getFormsRequiringComplianceReview(): Promise<FormSubmission[]> {
    const submissions = await this.getAllFormSubmissions();
    return submissions.filter(s => 
      s.status !== 'rejected' && (
        !s.fintracValidation ||
        !s.fintracValidation.isCompliant ||
        (s.complianceScore || 0) < 80 ||
        (s.complianceFlags && s.complianceFlags.length > 0)
      )
    );
  }

  // Get all forms that need transaction assignment
  async getFormsNeedingTransactionAssignment(): Promise<FormSubmission[]> {
    const submissions = await this.getAllFormSubmissions();
    return submissions.filter(s => 
      s.status === 'completed' && 
      !s.assignedTransactionId &&
      s.createdCustomerId // Only include forms with created customers
    );
  }

  // Create transaction directly from form (for new transactions)
  async createTransactionFromForm(formId: string, transactionParams: {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    commission: number;
  }): Promise<any> {
    try {
      const form = await this.getFormSubmissionById(formId);
      if (!form) {
        throw new Error('Form not found');
      }
      
      if (!form.createdCustomerId) {
        throw new Error('Form must have an associated customer before creating transaction');
      }

      // Create transaction with customer assignment
      const transaction = await transactionService.createTransaction({
        ...transactionParams,
        customerId: form.createdCustomerId
      });

      // Assign the new transaction to the form
      await this.assignTransactionToForm(formId, transaction.id);

      return transaction;
    } catch (error) {
      console.error('Error creating transaction from form:', error);
      throw error;
    }
  }
}

// Using generateSecureId from ../utils/security

const formService = new FormService();
export default formService;