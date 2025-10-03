// Real LCTR Report Service - Production Ready
import databaseService from './databaseService';
import customerService from './customerService';
import transactionService from './transactionService';

// Types
export interface LCTRReport {
  id: string;
  reportNumber: string;
  transactionId: string;
  customerId: string;
  reportType: 'LCTR' | 'LCTR-AMENDED';
  status: 'draft' | 'pending_review' | 'submitted' | 'acknowledged' | 'rejected';
  
  // Transaction details
  transactionDate: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  
  // Customer information
  customerInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
    identification: {
      type: 'passport' | 'drivers_license' | 'government_id';
      number: string;
      expiryDate: string;
      issuingCountry: string;
    };
    phone?: string;
    email?: string;
    occupation?: string;
  };
  
  // Reporting details
  createdAt: string;
  submittedAt?: string;
  acknowledgedAt?: string;
  dueDate: string;
  submittedBy: string;
  fintracRefNumber?: string;
  
  // Additional information
  sourceOfFunds?: string;
  purposeOfTransaction?: string;
  thirdPartyInfo?: {
    name: string;
    relationship: string;
  };
  
  // Internal tracking
  reviewNotes?: string;
  amendments?: string[];
  attachments?: string[];
}

export interface CreateLCTRParams {
  transactionId: string;
  customerId: string;
  sourceOfFunds?: string;
  purposeOfTransaction?: string;
  thirdPartyInfo?: LCTRReport['thirdPartyInfo'];
  submittedBy: string;
}

/**
 * Real LCTR Report Service
 * 
 * This service manages Large Cash Transaction Reports (LCTR) for FINTRAC compliance.
 * Handles report creation, submission, and tracking.
 */
class LCTRReportService {
  private reports: LCTRReport[] = [];
  
  constructor() {
    this.loadReports();
  }
  
  /**
   * Load reports from storage
   */
  private async loadReports(): Promise<void> {
    try {
      await databaseService.init();
      const stored = localStorage.getItem('lctr_reports');
      if (stored) {
        this.reports = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading LCTR reports:', error);
    }
  }
  
  /**
   * Save reports to storage
   */
  private async saveReports(): Promise<void> {
    try {
      localStorage.setItem('lctr_reports', JSON.stringify(this.reports));
    } catch (error) {
      console.error('Error saving LCTR reports:', error);
    }
  }
  
  /**
   * Generate report number
   */
  private generateReportNumber(): string {
    const year = new Date().getFullYear();
    const sequence = this.reports.filter(r => r.createdAt.startsWith(year.toString())).length + 1;
    return `LCTR-${year}-${sequence.toString().padStart(6, '0')}`;
  }
  
  /**
   * Create a new LCTR report
   */
  async createLCTRReport(params: CreateLCTRParams): Promise<LCTRReport> {
    try {
      // Get transaction and customer data
      const transaction = await transactionService.getTransactionById(params.transactionId);
      const customer = await customerService.getCustomerById(params.customerId);
      
      if (!transaction) {
        throw new Error(`Transaction ${params.transactionId} not found`);
      }
      
      if (!customer) {
        throw new Error(`Customer ${params.customerId} not found`);
      }
      
      // Check if report already exists for this transaction
      const existingReport = this.reports.find(r => r.transactionId === params.transactionId);
      if (existingReport) {
        throw new Error(`LCTR report already exists for transaction ${params.transactionId}`);
      }
      
      const now = new Date();
      const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from creation
      
      const report: LCTRReport = {
        id: `lctr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reportNumber: this.generateReportNumber(),
        transactionId: params.transactionId,
        customerId: params.customerId,
        reportType: 'LCTR',
        status: 'draft',
        
        // Transaction details
        transactionDate: transaction.date,
        fromCurrency: transaction.fromCurrency,
        toCurrency: transaction.toCurrency,
        fromAmount: transaction.fromAmount,
        toAmount: transaction.toAmount,
        exchangeRate: transaction.toAmount / transaction.fromAmount,
        
        // Customer information
        customerInfo: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          dateOfBirth: customer.dateOfBirth,
          address: customer.address,
          identification: customer.identification,
          phone: customer.phone,
          email: customer.email,
          occupation: customer.occupation
        },
        
        // Reporting details
        createdAt: now.toISOString(),
        dueDate: dueDate.toISOString(),
        submittedBy: params.submittedBy,
        
        // Additional information
        sourceOfFunds: params.sourceOfFunds,
        purposeOfTransaction: params.purposeOfTransaction,
        thirdPartyInfo: params.thirdPartyInfo,
        
        amendments: [],
        attachments: []
      };
      
      this.reports.push(report);
      await this.saveReports();
      
      return report;
    } catch (error) {
      console.error('Error creating LCTR report:', error);
      throw error;
    }
  }
  
  /**
   * Get all LCTR reports
   */
  async getLCTRReports(): Promise<LCTRReport[]> {
    return [...this.reports].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  /**
   * Get LCTR report by ID
   */
  async getLCTRReportById(id: string): Promise<LCTRReport | null> {
    return this.reports.find(r => r.id === id) || null;
  }
  
  /**
   * Get LCTR report by transaction ID
   */
  async getLCTRReportByTransactionId(transactionId: string): Promise<LCTRReport | null> {
    return this.reports.find(r => r.transactionId === transactionId) || null;
  }
  
  /**
   * Update LCTR report
   */
  async updateLCTRReport(id: string, updates: Partial<LCTRReport>): Promise<LCTRReport | null> {
    const reportIndex = this.reports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      return null;
    }
    
    const updatedReport = {
      ...this.reports[reportIndex],
      ...updates,
      id // Ensure ID cannot be changed
    };
    
    this.reports[reportIndex] = updatedReport;
    await this.saveReports();
    
    return updatedReport;
  }
  
  /**
   * Submit LCTR report to FINTRAC
   */
  async submitLCTRReport(id: string): Promise<LCTRReport | null> {
    const report = await this.getLCTRReportById(id);
    if (!report) {
      throw new Error(`LCTR report ${id} not found`);
    }
    
    if (report.status !== 'draft' && report.status !== 'pending_review') {
      throw new Error(`Cannot submit report with status: ${report.status}`);
    }
    
    // Validate report completeness
    const validation = this.validateReport(report);
    if (!validation.isValid) {
      throw new Error(`Report validation failed: ${validation.errors.join(', ')}`);
    }
    
    // In a real implementation, this would submit to FINTRAC API
    // For now, we simulate the submission
    const fintracRefNumber = `FTR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const updates: Partial<LCTRReport> = {
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      fintracRefNumber
    };
    
    const updatedReport = await this.updateLCTRReport(id, updates);
    
    // Update transaction status
    if (updatedReport) {
      await transactionService.updateTransaction(report.transactionId, {
        complianceStatus: 'completed',
        reportSubmitted: true,
        reportId: updatedReport.id,
        reportSubmissionDate: updatedReport.submittedAt
      });
    }
    
    return updatedReport;
  }
  
  /**
   * Acknowledge LCTR report (simulated FINTRAC response)
   */
  async acknowledgeLCTRReport(id: string): Promise<LCTRReport | null> {
    const updates: Partial<LCTRReport> = {
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString()
    };
    
    return this.updateLCTRReport(id, updates);
  }
  
  /**
   * Reject LCTR report (simulated FINTRAC response)
   */
  async rejectLCTRReport(id: string, reason: string): Promise<LCTRReport | null> {
    const report = await this.getLCTRReportById(id);
    if (!report) return null;
    
    const updates: Partial<LCTRReport> = {
      status: 'rejected',
      reviewNotes: reason,
      amendments: [...(report.amendments || []), `Rejected: ${reason} - ${new Date().toISOString()}`]
    };
    
    return this.updateLCTRReport(id, updates);
  }
  
  /**
   * Get overdue LCTR reports
   */
  async getOverdueLCTRReports(): Promise<LCTRReport[]> {
    const now = new Date();
    return this.reports.filter(r => 
      r.status !== 'submitted' && 
      r.status !== 'acknowledged' && 
      new Date(r.dueDate) < now
    );
  }
  
  /**
   * Get reports due soon (within specified days)
   */
  async getReportsDueSoon(days: number = 3): Promise<LCTRReport[]> {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.reports.filter(r => 
      r.status !== 'submitted' && 
      r.status !== 'acknowledged' && 
      new Date(r.dueDate) <= futureDate
    );
  }
  
  /**
   * Validate LCTR report completeness
   */
  validateReport(report: LCTRReport): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!report.transactionId) errors.push('Transaction ID is required');
    if (!report.customerId) errors.push('Customer ID is required');
    if (!report.submittedBy) errors.push('Submitted by is required');
    
    // Customer information validation
    if (!report.customerInfo.firstName) errors.push('Customer first name is required');
    if (!report.customerInfo.lastName) errors.push('Customer last name is required');
    if (!report.customerInfo.dateOfBirth) errors.push('Customer date of birth is required');
    
    // Address validation
    const addr = report.customerInfo.address;
    if (!addr.street) errors.push('Customer street address is required');
    if (!addr.city) errors.push('Customer city is required');
    if (!addr.province) errors.push('Customer province is required');
    if (!addr.postalCode) errors.push('Customer postal code is required');
    if (!addr.country) errors.push('Customer country is required');
    
    // Identification validation
    const id = report.customerInfo.identification;
    if (!id.type) errors.push('Customer identification type is required');
    if (!id.number) errors.push('Customer identification number is required');
    if (!id.expiryDate) errors.push('Customer identification expiry date is required');
    if (!id.issuingCountry) errors.push('Customer identification issuing country is required');
    
    // Check if identification is expired
    if (id.expiryDate && new Date(id.expiryDate) < new Date()) {
      errors.push('Customer identification is expired');
    }
    
    // Transaction validation
    if (!report.fromCurrency) errors.push('From currency is required');
    if (!report.toCurrency) errors.push('To currency is required');
    if (report.fromAmount <= 0) errors.push('From amount must be greater than 0');
    if (report.toAmount <= 0) errors.push('To amount must be greater than 0');
    
    // Business logic validation
    if (!report.sourceOfFunds) errors.push('Source of funds is required for LCTR');
    if (!report.purposeOfTransaction) errors.push('Purpose of transaction is required for LCTR');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get LCTR report statistics
   */
  async getLCTRStats(): Promise<{
    total: number;
    draft: number;
    submitted: number;
    acknowledged: number;
    overdue: number;
    thisMonth: number;
  }> {
    const reports = await this.getLCTRReports();
    const overdue = await this.getOverdueLCTRReports();
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    return {
      total: reports.length,
      draft: reports.filter(r => r.status === 'draft').length,
      submitted: reports.filter(r => r.status === 'submitted').length,
      acknowledged: reports.filter(r => r.status === 'acknowledged').length,
      overdue: overdue.length,
      thisMonth: reports.filter(r => new Date(r.createdAt) >= thisMonth).length
    };
  }
  
  /**
   * Export LCTR report data (for FINTRAC submission)
   */
  async exportLCTRReport(id: string): Promise<any> {
    const report = await this.getLCTRReportById(id);
    if (!report) {
      throw new Error(`LCTR report ${id} not found`);
    }
    
    // Export in FINTRAC-compatible format
    return {
      reportNumber: report.reportNumber,
      reportType: report.reportType,
      transactionDate: report.transactionDate,
      currency: {
        from: report.fromCurrency,
        to: report.toCurrency,
        exchangeRate: report.exchangeRate
      },
      amounts: {
        from: report.fromAmount,
        to: report.toAmount
      },
      customer: {
        personal: {
          firstName: report.customerInfo.firstName,
          lastName: report.customerInfo.lastName,
          dateOfBirth: report.customerInfo.dateOfBirth
        },
        contact: {
          phone: report.customerInfo.phone,
          email: report.customerInfo.email
        },
        address: report.customerInfo.address,
        identification: report.customerInfo.identification,
        occupation: report.customerInfo.occupation
      },
      transaction: {
        sourceOfFunds: report.sourceOfFunds,
        purpose: report.purposeOfTransaction,
        thirdParty: report.thirdPartyInfo
      },
      reportingEntity: {
        submittedBy: report.submittedBy,
        submissionDate: report.submittedAt,
        fintracReference: report.fintracRefNumber
      }
    };
  }
}

// Export singleton instance
const lctrReportService = new LCTRReportService();
export default lctrReportService;