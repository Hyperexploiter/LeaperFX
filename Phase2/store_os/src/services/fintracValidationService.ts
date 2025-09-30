// FINTRAC Validation Service - Comprehensive Regulatory Compliance
// Ensures all transactions and processes meet FINTRAC requirements
// Based on official FINTRAC guidelines and PCMLTFA regulations

import customerService from './customerService';
import secureDocumentService from './secureDocumentService';
import fintracReportingService from './fintracReportingService';

// FINTRAC Compliance Levels
export type ComplianceLevel = 'none' | 'basic_records' | 'enhanced_records' | 'lctr_required' | 'str_required';

// Validation Result Interface
export interface FINTRACValidationResult {
  isCompliant: boolean;
  complianceLevel: ComplianceLevel;
  requiredActions: string[];
  mandatoryFields: string[];
  missingDocuments: string[];
  deadlines: {
    lctrDeadline?: string;
    strDeadline?: string;
    recordRetentionDate: string;
  };
  riskFactors: string[];
  regulatoryFlags: string[];
}

// Transaction Validation Context
export interface TransactionValidationContext {
  transactionId: string;
  amount: number;
  currency: string;
  customerId?: string;
  customerData?: any;
  paymentMethod: string;
  sourceOfFunds?: string;
  purpose?: string;
  conductorType: 'individual' | 'entity';
  thirdPartyInvolved: boolean;
  country: string;
  date: string;
}

class FINTRACValidationService {
  // FINTRAC Thresholds (as per PCMLTFA)
  private readonly LCTR_THRESHOLD_CAD = 10000; // Large Cash Transaction Report
  private readonly ENHANCED_RECORDS_THRESHOLD_CAD = 3000; // Enhanced record keeping
  private readonly LCTR_DEADLINE_DAYS = 15; // 15 calendar days
  private readonly STR_DEADLINE_DAYS = 30; // 30 calendar days for STR
  private readonly RECORD_RETENTION_YEARS = 5; // Minimum 5 years

  /**
   * Comprehensive FINTRAC validation for a transaction
   */
  async validateTransaction(context: TransactionValidationContext): Promise<FINTRACValidationResult> {
    const cadAmount = this.convertToCad(context.amount, context.currency);
    const result: FINTRACValidationResult = {
      isCompliant: true,
      complianceLevel: 'none',
      requiredActions: [],
      mandatoryFields: [],
      missingDocuments: [],
      deadlines: {
        recordRetentionDate: this.calculateRetentionDate()
      },
      riskFactors: [],
      regulatoryFlags: []
    };

    // 1. Determine compliance level based on amount
    result.complianceLevel = this.determineComplianceLevel(cadAmount, context.paymentMethod);

    // 2. Validate customer information requirements
    await this.validateCustomerRequirements(context, result);

    // 3. Validate document requirements
    await this.validateDocumentRequirements(context, result);

    // 4. Check for suspicious activity indicators
    this.validateSuspiciousActivityIndicators(context, result);

    // 5. Validate record keeping requirements
    this.validateRecordKeepingRequirements(context, result);

    // 6. Set deadlines
    this.setComplianceDeadlines(context, result);

    // 7. Final compliance determination
    result.isCompliant = result.requiredActions.length === 0;

    return result;
  }

  /**
   * Validate MSB registration requirements
   */
  async validateMSBRegistration(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if FINTRAC MSB ID is configured
    const msbId = process.env.FINTRAC_MSB_ID || localStorage.getItem('fintrac_msb_id');
    if (!msbId) {
      issues.push('FINTRAC MSB registration ID not configured');
      recommendations.push('Set FINTRAC_MSB_ID environment variable or configure in settings');
    }

    // Check Quebec provincial license (if operating in Quebec)
    const provincialLicense = localStorage.getItem('quebec_msb_license');
    if (!provincialLicense) {
      issues.push('Quebec MSB license not configured');
      recommendations.push('Obtain and configure Quebec Money Services Business license');
    }

    // Check compliance officer designation
    const complianceOfficer = localStorage.getItem('compliance_officer');
    if (!complianceOfficer) {
      issues.push('Compliance officer not designated');
      recommendations.push('Designate a compliance officer as required by FINTRAC');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Validate customer due diligence requirements
   */
  async validateCustomerDueDiligence(customerId: string): Promise<{
    isCompliant: boolean;
    missingRequirements: string[];
    documentStatus: string[];
  }> {
    const missingRequirements: string[] = [];
    const documentStatus: string[] = [];

    try {
      // Get customer data
      const customer = await customerService.getCustomerById(customerId);
      if (!customer) {
        return {
          isCompliant: false,
          missingRequirements: ['Customer record not found'],
          documentStatus: []
        };
      }

      // Check mandatory customer information
      const requiredFields = [
        'firstName',
        'lastName', 
        'dateOfBirth',
        'address',
        'identification'
      ];

      for (const field of requiredFields) {
        if (!this.hasValidValue(customer as any, field)) {
          missingRequirements.push(`Missing required field: ${field}`);
        }
      }

      // Validate identification document
      if (customer.identification) {
        const id = customer.identification;
        if (!id.type || !id.number || !id.expiryDate) {
          missingRequirements.push('Incomplete identification information');
        }

        // Check if ID is expired
        if (id.expiryDate && new Date(id.expiryDate) < new Date()) {
          missingRequirements.push('Identification document has expired');
        }
      }

      // Check document verification status
      const customerDocuments = await secureDocumentService.getCustomerDocuments(customerId);
      const mandatoryDocTypes = ['photo_id', 'proof_of_address'];
      
      for (const docType of mandatoryDocTypes) {
        const doc = customerDocuments.find(d => d.documentType === docType);
        if (!doc) {
          missingRequirements.push(`Missing mandatory document: ${docType}`);
        } else if (!doc.metadata.documentVerified) {
          documentStatus.push(`Document pending verification: ${docType}`);
        }
      }

      return {
        isCompliant: missingRequirements.length === 0,
        missingRequirements,
        documentStatus
      };

    } catch (error) {
      console.error('Error validating customer due diligence:', error);
      return {
        isCompliant: false,
        missingRequirements: ['Error accessing customer data'],
        documentStatus: []
      };
    }
  }

  /**
   * Generate compliance report for government audit
   */
  async generateComplianceReport(startDate: string, endDate: string): Promise<{
    summary: any;
    transactions: any[];
    submissions: any[];
    documents: any[];
    violations: any[];
  }> {
    try {
      // Get all submission records
      const submissions = await fintracReportingService.getSubmissionRecordsByDateRange(startDate, endDate);
      
      // Get document audit logs
      await secureDocumentService.exportDocumentAuditLogs(startDate, endDate);
      
      // Analyze compliance gaps
      const violations: any[] = [];
      
      // Check for late submissions
      submissions.forEach(submission => {
        const submissionDate = new Date(submission.submissionDate);
        const reportDate = new Date(submission.createdAt);
        const daysDiff = Math.ceil((submissionDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > this.LCTR_DEADLINE_DAYS) {
          violations.push({
            type: 'late_submission',
            reportReference: submission.reportReference,
            daysPastDeadline: daysDiff - this.LCTR_DEADLINE_DAYS,
            severity: 'high'
          });
        }
      });

      return {
        summary: {
          reportPeriod: { startDate, endDate },
          totalSubmissions: submissions.length,
          totalTransactions: submissions.reduce((sum, s) => sum + s.totalTransactions, 0),
          totalAmount: submissions.reduce((sum, s) => sum + s.totalAmount, 0),
          violationsFound: violations.length,
          complianceScore: violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 10)
        },
        transactions: submissions.flatMap(s => s.reportData.transactions || []),
        submissions,
        documents: [], // Would be populated with document summaries
        violations
      };

    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  /**
   * Private helper methods
   */
  private determineComplianceLevel(cadAmount: number, paymentMethod: string): ComplianceLevel {
    const isCash = paymentMethod.toLowerCase().includes('cash');
    
    if (cadAmount >= this.LCTR_THRESHOLD_CAD && isCash) {
      return 'lctr_required';
    } else if (cadAmount >= this.ENHANCED_RECORDS_THRESHOLD_CAD) {
      return 'enhanced_records';
    } else {
      return 'basic_records';
    }
  }

  private async validateCustomerRequirements(
    context: TransactionValidationContext,
    result: FINTRACValidationResult
  ): Promise<void> {
    if (!context.customerId) {
      result.requiredActions.push('Customer identification required');
      result.mandatoryFields.push('customerId');
      return;
    }

    try {
      const customer = await customerService.getCustomerById(context.customerId);
      if (!customer) {
        result.requiredActions.push('Customer record not found');
        return;
      }

      // Check mandatory fields based on compliance level
      const requiredFields = this.getRequiredCustomerFields(result.complianceLevel);
      
      for (const field of requiredFields) {
        if (!this.hasValidValue(customer, field)) {
          result.mandatoryFields.push(field);
          result.requiredActions.push(`Missing required customer field: ${field}`);
        }
      }

      // Validate identification
      if (customer.identification) {
        if (new Date(customer.identification.expiryDate) < new Date()) {
          result.requiredActions.push('Customer identification has expired');
        }
      }

    } catch (error) {
      result.requiredActions.push('Error validating customer information');
    }
  }

  private async validateDocumentRequirements(
    context: TransactionValidationContext,
    result: FINTRACValidationResult
  ): Promise<void> {
    if (!context.customerId) return;

    try {
      const documents = await secureDocumentService.getCustomerDocuments(context.customerId);
      const requiredDocTypes = this.getRequiredDocuments(result.complianceLevel);

      for (const docType of requiredDocTypes) {
        const doc = documents.find(d => d.documentType === docType);
        if (!doc) {
          result.missingDocuments.push(docType);
          result.requiredActions.push(`Missing required document: ${docType}`);
        } else if (!doc.metadata.documentVerified) {
          result.requiredActions.push(`Document requires verification: ${docType}`);
        }
      }

    } catch (error) {
      result.requiredActions.push('Error validating document requirements');
    }
  }

  private validateSuspiciousActivityIndicators(
    context: TransactionValidationContext,
    result: FINTRACValidationResult
  ): void {
    // Check for suspicious patterns
    const suspiciousIndicators = [
      {
        condition: context.amount === 9999.99 || context.amount === 9999,
        message: 'Amount appears to be structured to avoid reporting threshold'
      },
      {
        condition: context.sourceOfFunds === 'gift' && context.amount > 50000,
        message: 'Large gift transaction may require additional scrutiny'
      },
      {
        condition: context.thirdPartyInvolved && !context.customerData?.thirdPartyName,
        message: 'Third party transaction missing third party details'
      },
      {
        condition: context.country && this.isHighRiskCountry(context.country),
        message: `Transaction involves high-risk country: ${context.country}`
      }
    ];

    for (const indicator of suspiciousIndicators) {
      if (indicator.condition) {
        result.riskFactors.push(indicator.message);
        result.regulatoryFlags.push('SUSPICIOUS_ACTIVITY_REVIEW');
      }
    }
  }

  private validateRecordKeepingRequirements(
    _context: TransactionValidationContext,
    result: FINTRACValidationResult
  ): void {
    // All transactions require basic record keeping
    const requiredRecords = [
      'transaction_receipt',
      'customer_identification_record'
    ];

    if (result.complianceLevel === 'enhanced_records' || result.complianceLevel === 'lctr_required') {
      requiredRecords.push(
        'source_of_funds_verification',
        'purpose_of_transaction',
        'beneficial_ownership_information'
      );
    }

    // In a real implementation, we would verify these records exist
    // For now, we assume they need to be created
    for (const record of requiredRecords) {
      result.requiredActions.push(`Ensure ${record} is properly documented and retained`);
    }
  }

  private setComplianceDeadlines(
    context: TransactionValidationContext,
    result: FINTRACValidationResult
  ): void {
    const transactionDate = new Date(context.date);

    if (result.complianceLevel === 'lctr_required') {
      const lctrDeadline = new Date(transactionDate);
      lctrDeadline.setDate(lctrDeadline.getDate() + this.LCTR_DEADLINE_DAYS);
      result.deadlines.lctrDeadline = lctrDeadline.toISOString().split('T')[0];
    }

    if (result.riskFactors.length > 0) {
      const strDeadline = new Date(transactionDate);
      strDeadline.setDate(strDeadline.getDate() + this.STR_DEADLINE_DAYS);
      result.deadlines.strDeadline = strDeadline.toISOString().split('T')[0];
    }
  }

  private getRequiredCustomerFields(complianceLevel: ComplianceLevel): string[] {
    const basicFields = ['firstName', 'lastName', 'dateOfBirth', 'address'];
    
    if (complianceLevel === 'enhanced_records' || complianceLevel === 'lctr_required') {
      return [
        ...basicFields,
        'occupation',
        'sourceOfFunds',
        'identification.type',
        'identification.number',
        'identification.expiryDate'
      ];
    }
    
    return basicFields;
  }

  private getRequiredDocuments(complianceLevel: ComplianceLevel): string[] {
    const basicDocs = ['photo_id'];
    
    if (complianceLevel === 'enhanced_records' || complianceLevel === 'lctr_required') {
      return [...basicDocs, 'proof_of_address', 'selfie'];
    }
    
    return basicDocs;
  }

  private convertToCad(amount: number, currency: string): number {
    if (currency === 'CAD') return amount;
    
    // Exchange rates for compliance calculations (use real rates in production)
    const rates: { [key: string]: number } = {
      'USD': 1.35,
      'EUR': 1.45,
      'GBP': 1.70,
      'JPY': 0.009,
      'AUD': 0.95,
      'CHF': 1.47
    };
    
    return amount * (rates[currency] || 1);
  }

  private isHighRiskCountry(country: string): boolean {
    const highRiskCountries = [
      'afghanistan',
      'iran',
      'north korea',
      'syria',
      'russia',
      'belarus'
    ];
    
    return highRiskCountries.includes(country.toLowerCase());
  }

  private hasValidValue(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (!current || typeof current !== 'object') return false;
      current = current[key];
    }
    
    return current !== null && current !== undefined && 
           (typeof current !== 'string' || current.trim() !== '');
  }

  private calculateRetentionDate(): string {
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + this.RECORD_RETENTION_YEARS);
    return retentionDate.toISOString().split('T')[0];
  }
}

export const fintracValidationService = new FINTRACValidationService();
export default fintracValidationService;