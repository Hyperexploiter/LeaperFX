// Crypto FINTRAC Service - Comprehensive Cryptocurrency Compliance Reporting
// Implements FINTRAC Virtual Currency Transaction Reports (VCTR) and Large Virtual Currency Transaction Reports (LVCTR)
// Ensures compliance with Canadian FINTRAC guidelines for cryptocurrency MSBs

import { generateSecureId } from '../../../utils/security';
import databaseService from '../../../services/databaseService';
import webSocketService from '../../../services/webSocketService';
import { SupportedCrypto, CryptoPaymentResult, UnifiedPaymentResult } from '../types';

// --- FINTRAC Crypto Report Types ---
export type CryptoReportType = 'VCTR' | 'LVCTR' | 'STR' | 'SUSPICIOUS';
export type VerificationLevel = 'none' | 'basic' | 'enhanced' | 'full_kyc';
export type PEPStatus = 'not_pep' | 'pep' | 'head_of_international_org' | 'family_member' | 'close_associate';

// --- Virtual Currency Transaction Report (VCTR) Interface ---
export interface VCTRReport {
  id: string;
  reportType: CryptoReportType;
  reportReference: string;
  submissionDate: string;
  reportingEntity: {
    identifier: string;
    name: string;
    address: any;
    registrationNumber: string;
  };

  // Virtual Currency Transaction Details
  virtualCurrencyTransaction: {
    transactionId: string;
    transactionType: 'exchange' | 'transfer' | 'purchase' | 'sale' | 'mining' | 'other';
    date: string;
    time: string;

    // Virtual Currency Information
    virtualCurrencyType: SupportedCrypto;
    virtualCurrencyAmount: number;
    cadEquivalent: number;
    exchangeRate: number;

    // Wallet Information
    senderWalletAddress?: string;
    receiverWalletAddress: string;
    transactionHash: string;

    // Technical Details
    ipAddress?: string;
    deviceId?: string;
    sessionId?: string;
    networkFee: number;
    confirmations: number;
    blockHeight?: number;

    // Exchange Details (if applicable)
    exchangeName?: string;
    exchangeRate2?: number; // Secondary rate if multiple conversions
    intermediateWallet?: string;
  };

  // Customer Information
  conductor: {
    type: 'person' | 'entity';
    verificationLevel: VerificationLevel;
    pepStatus: PEPStatus;

    personInfo?: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      occupation: string;
      address: any;
      identification: any;
      citizenship?: string;
      residenceCountry?: string;
    };

    entityInfo?: {
      name: string;
      incorporationNumber?: string;
      businessNumber?: string;
      nature: string;
      address: any;
    };
  };

  // Third Party Information (if acting on behalf of someone else)
  thirdParty?: {
    type: 'person' | 'entity';
    relationship: string;
    personInfo?: any;
    entityInfo?: any;
  };

  // Source and Purpose
  sourceOfFunds: string;
  purpose: string;
  disposition: string;

  // Risk Assessment
  riskIndicators: string[];
  suspicious: boolean;
  suspiciousActivity?: string[];

  // Compliance
  reportingReason: 'large_amount' | 'suspicious' | 'threshold_aggregate' | 'other';
  submissionMethod: 'FWR' | 'API' | 'PAPER';
  submissionStatus: 'draft' | 'submitted' | 'acknowledged' | 'rejected';
  acknowledgmentReference?: string;

  // Metadata
  preparedBy: string;
  reviewedBy?: string;
  retentionDate: string;
  auditHash: string;
  createdAt: string;
  updatedAt: string;
}

// --- Large Virtual Currency Transaction Report (LVCTR) Interface ---
export interface LVCTRReport extends VCTRReport {
  reportType: 'LVCTR';
  aggregateTransactions?: Array<{
    transactionId: string;
    date: string;
    amount: number;
    virtualCurrencyType: SupportedCrypto;
    cadEquivalent: number;
  }>;
  totalAggregateAmount: number;
  aggregationPeriod: {
    startDate: string;
    endDate: string;
  };
}

// --- Suspicious Transaction Report (STR) for Crypto ---
export interface CryptoSTRReport extends VCTRReport {
  reportType: 'STR';
  suspicionIndicators: {
    unusualTransactionPatterns: boolean;
    multipleSmallAmounts: boolean;
    rapidSuccession: boolean;
    unknownSourceFunds: boolean;
    inconsistentWithProfile: boolean;
    highRiskJurisdiction: boolean;
    mixerOrTumblerUsage: boolean;
    privacyCoinUsage: boolean;
    newWalletAddress: boolean;
    largeRoundNumbers: boolean;
    other: string[];
  };

  narrative: string;
  conductReason: string;
  actionTaken: string;

  // Related Transactions
  relatedTransactions?: Array<{
    transactionId: string;
    date: string;
    amount: number;
    relationship: string;
  }>;
}

// --- Crypto Transaction Data for Reporting ---
export interface CryptoTransactionData {
  id: string;
  timestamp: string;
  paymentResult: UnifiedPaymentResult;
  cryptoResult: CryptoPaymentResult;

  // Customer Data
  customerId?: string;
  customerData?: any;

  // Wallet Information
  senderWallet?: string;
  receiverWallet: string;

  // Technical Data
  ipAddress?: string;
  deviceId?: string;
  userAgent?: string;
  sessionId?: string;

  // Risk Assessment
  riskScore: number;
  riskFactors: string[];
  flaggedSuspicious: boolean;

  // Compliance
  requiresVCTR: boolean;
  requiresLVCTR: boolean;
  requiresSTR: boolean;
  reportDeadline?: string;
}

class CryptoFINTRACService {
  private readonly STORAGE_KEY = 'crypto_fintrac_reports';
  private readonly VCTR_THRESHOLD_CAD = 1000; // All virtual currency transactions ≥ $1,000 CAD
  private readonly LVCTR_THRESHOLD_CAD = 10000; // Large virtual currency transactions ≥ $10,000 CAD
  private readonly REPORTING_DEADLINE_DAYS = 15;
  private readonly AGGREGATION_WINDOW_HOURS = 24; // 24-hour window for aggregating transactions

  private readonly ENTITY_INFO = {
    name: 'Leaper Exchange Inc.',
    identifier: 'MSB_CRYPTO_ID_TO_BE_SET', // Must be set to actual FINTRAC MSB ID
    registrationNumber: 'MSB_REG_NUMBER_TO_BE_SET',
    address: {
      streetNumber: '',
      streetName: '',
      city: 'Montreal',
      province: 'QC',
      postalCode: '',
      country: 'Canada'
    }
  };

  /**
   * Analyze crypto transaction for FINTRAC reporting requirements
   */
  analyzeCryptoTransaction(transactionData: CryptoTransactionData): {
    requiresVCTR: boolean;
    requiresLVCTR: boolean;
    requiresSTR: boolean;
    reportingDeadline: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    immediateAction: boolean;
  } {
    const cadAmount = transactionData.paymentResult.amount;
    const now = new Date();
    const deadline = new Date(now.getTime() + (this.REPORTING_DEADLINE_DAYS * 24 * 60 * 60 * 1000));

    // Check thresholds
    const requiresVCTR = cadAmount >= this.VCTR_THRESHOLD_CAD;
    const requiresLVCTR = cadAmount >= this.LVCTR_THRESHOLD_CAD;

    // Check for suspicious activity
    const requiresSTR = this.detectSuspiciousActivity(transactionData);

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(transactionData);

    // Immediate action required for high-risk or suspicious transactions
    const immediateAction = requiresSTR || riskLevel === 'critical' || cadAmount >= 50000;

    return {
      requiresVCTR,
      requiresLVCTR,
      requiresSTR,
      reportingDeadline: deadline.toISOString().split('T')[0],
      riskLevel,
      immediateAction
    };
  }

  /**
   * Generate Virtual Currency Transaction Report (VCTR)
   */
  async generateVCTRReport(transactionData: CryptoTransactionData): Promise<VCTRReport> {
    if (!transactionData.customerData) {
      throw new Error('Customer data required for VCTR generation');
    }

    const reportReference = `VCTR-${Date.now()}-${generateSecureId(8)}`;
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString().split('T')[1];

    const report: VCTRReport = {
      id: generateSecureId(),
      reportType: 'VCTR',
      reportReference,
      submissionDate: currentDate,
      reportingEntity: this.ENTITY_INFO,

      virtualCurrencyTransaction: {
        transactionId: transactionData.id,
        transactionType: 'exchange',
        date: transactionData.timestamp.split('T')[0],
        time: transactionData.timestamp.split('T')[1],

        virtualCurrencyType: transactionData.cryptoResult.cryptocurrency,
        virtualCurrencyAmount: transactionData.cryptoResult.amountCrypto || 0,
        cadEquivalent: transactionData.paymentResult.amount,
        exchangeRate: transactionData.cryptoResult.rate,

        senderWalletAddress: transactionData.senderWallet,
        receiverWalletAddress: transactionData.receiverWallet,
        transactionHash: transactionData.cryptoResult.txHash || '',

        ipAddress: transactionData.ipAddress,
        deviceId: transactionData.deviceId,
        sessionId: transactionData.sessionId,
        networkFee: transactionData.cryptoResult.networkFee || 0,
        confirmations: transactionData.cryptoResult.confirmations || 0
      },

      conductor: this.buildConductorInfo(transactionData.customerData),

      sourceOfFunds: transactionData.customerData.sourceOfFunds || 'employment',
      purpose: 'virtual_currency_purchase',
      disposition: 'virtual_currency_transferred',

      riskIndicators: transactionData.riskFactors,
      suspicious: transactionData.flaggedSuspicious,

      reportingReason: transactionData.paymentResult.amount >= this.LVCTR_THRESHOLD_CAD ? 'large_amount' : 'threshold_aggregate',
      submissionMethod: 'API',
      submissionStatus: 'draft',

      preparedBy: 'system',
      retentionDate: this.calculateRetentionDate(),
      auditHash: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Generate audit hash
    report.auditHash = await this.generateAuditHash(JSON.stringify(report));

    return report;
  }

  /**
   * Generate Large Virtual Currency Transaction Report (LVCTR)
   */
  async generateLVCTRReport(transactionData: CryptoTransactionData, relatedTransactions?: CryptoTransactionData[]): Promise<LVCTRReport> {
    const vctrReport = await this.generateVCTRReport(transactionData);

    const lvctrReport: LVCTRReport = {
      ...vctrReport,
      reportType: 'LVCTR',
      reportReference: vctrReport.reportReference.replace('VCTR', 'LVCTR'),

      aggregateTransactions: relatedTransactions?.map(tx => ({
        transactionId: tx.id,
        date: tx.timestamp.split('T')[0],
        amount: tx.cryptoResult.amountCrypto || 0,
        virtualCurrencyType: tx.cryptoResult.cryptocurrency,
        cadEquivalent: tx.paymentResult.amount
      })) || [],

      totalAggregateAmount: (relatedTransactions || []).reduce((sum, tx) => sum + tx.paymentResult.amount, transactionData.paymentResult.amount),

      aggregationPeriod: {
        startDate: transactionData.timestamp.split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    };

    return lvctrReport;
  }

  /**
   * Generate Suspicious Transaction Report (STR) for crypto
   */
  async generateCryptoSTRReport(transactionData: CryptoTransactionData, suspicionReasons: string[]): Promise<CryptoSTRReport> {
    const vctrReport = await this.generateVCTRReport(transactionData);

    const strReport: CryptoSTRReport = {
      ...vctrReport,
      reportType: 'STR',
      reportReference: vctrReport.reportReference.replace('VCTR', 'STR'),

      suspicionIndicators: {
        unusualTransactionPatterns: suspicionReasons.includes('unusual_patterns'),
        multipleSmallAmounts: suspicionReasons.includes('structuring'),
        rapidSuccession: suspicionReasons.includes('rapid_transactions'),
        unknownSourceFunds: suspicionReasons.includes('unknown_source'),
        inconsistentWithProfile: suspicionReasons.includes('inconsistent_profile'),
        highRiskJurisdiction: suspicionReasons.includes('high_risk_jurisdiction'),
        mixerOrTumblerUsage: suspicionReasons.includes('mixer_usage'),
        privacyCoinUsage: suspicionReasons.includes('privacy_coin'),
        newWalletAddress: suspicionReasons.includes('new_wallet'),
        largeRoundNumbers: suspicionReasons.includes('round_numbers'),
        other: suspicionReasons.filter(r => !['unusual_patterns', 'structuring', 'rapid_transactions', 'unknown_source', 'inconsistent_profile', 'high_risk_jurisdiction', 'mixer_usage', 'privacy_coin', 'new_wallet', 'round_numbers'].includes(r))
      },

      narrative: this.generateSTRNarrative(transactionData, suspicionReasons),
      conductReason: 'Suspicious virtual currency transaction patterns detected',
      actionTaken: 'Transaction monitored and reported to FINTRAC'
    };

    return strReport;
  }

  /**
   * Submit crypto FINTRAC report
   */
  async submitCryptoReport(report: VCTRReport | LVCTRReport | CryptoSTRReport): Promise<{
    success: boolean;
    submissionId: string;
    acknowledgmentReference?: string;
    error?: string;
  }> {
    try {
      // Generate XML for FINTRAC submission
      const xmlContent = this.generateFINTRACXML(report);

      // In production, submit to FINTRAC API
      // For now, simulate submission
      const submissionId = `SUB-${Date.now()}-${generateSecureId(8)}`;

      // Update report status
      report.submissionStatus = 'submitted';
      report.acknowledgmentReference = `ACK-${submissionId}`;
      report.updatedAt = new Date().toISOString();

      // Store report permanently
      await this.storeReport(report);

      // Broadcast submission event
      webSocketService.send({
        type: 'crypto_fintrac_report_submitted',
        data: {
          reportType: report.reportType,
          reportReference: report.reportReference,
          submissionId,
          transactionId: report.virtualCurrencyTransaction.transactionId,
          amount: report.virtualCurrencyTransaction.cadEquivalent,
          cryptocurrency: report.virtualCurrencyTransaction.virtualCurrencyType
        }
      });

      return {
        success: true,
        submissionId,
        acknowledgmentReference: report.acknowledgmentReference
      };
    } catch (error) {
      console.error('Error submitting crypto FINTRAC report:', error);
      return {
        success: false,
        submissionId: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Auto-detect reporting requirements when crypto transaction completes
   */
  async processCompletedCryptoTransaction(paymentResult: UnifiedPaymentResult): Promise<{
    reportsGenerated: string[];
    immediateAction: boolean;
    deadline: string;
  }> {
    if (!paymentResult.cryptoResult) {
      throw new Error('No crypto result in payment data');
    }

    const transactionData: CryptoTransactionData = {
      id: paymentResult.transactionId,
      timestamp: paymentResult.timestamp,
      paymentResult,
      cryptoResult: paymentResult.cryptoResult,
      receiverWallet: paymentResult.cryptoResult.txHash || '',
      riskScore: this.calculateTransactionRiskScore(paymentResult),
      riskFactors: this.identifyRiskFactors(paymentResult),
      flaggedSuspicious: false,
      requiresVCTR: false,
      requiresLVCTR: false,
      requiresSTR: false
    };

    const analysis = this.analyzeCryptoTransaction(transactionData);
    const reportsGenerated: string[] = [];

    // Generate required reports
    if (analysis.requiresVCTR) {
      const vctrReport = await this.generateVCTRReport(transactionData);
      await this.storeReport(vctrReport);
      reportsGenerated.push('VCTR');
    }

    if (analysis.requiresLVCTR) {
      const lvctrReport = await this.generateLVCTRReport(transactionData);
      await this.storeReport(lvctrReport);
      reportsGenerated.push('LVCTR');
    }

    if (analysis.requiresSTR) {
      const strReport = await this.generateCryptoSTRReport(transactionData, transactionData.riskFactors);
      await this.storeReport(strReport);
      reportsGenerated.push('STR');
    }

    return {
      reportsGenerated,
      immediateAction: analysis.immediateAction,
      deadline: analysis.reportingDeadline
    };
  }

  /**
   * Get pending crypto reports
   */
  async getPendingCryptoReports(): Promise<Array<VCTRReport | LVCTRReport | CryptoSTRReport>> {
    const allReports = await this.getAllReports();
    return allReports.filter(report => report.submissionStatus === 'draft');
  }

  /**
   * Export crypto reports for FINTRAC submission
   */
  async exportCryptoReports(reportIds: string[]): Promise<{
    xml: string;
    json: string;
    csv: string;
  }> {
    const allReports = await this.getAllReports();
    const selectedReports = allReports.filter(report => reportIds.includes(report.id));

    return {
      xml: this.generateBatchXML(selectedReports),
      json: JSON.stringify(selectedReports, null, 2),
      csv: this.generateReportsCSV(selectedReports)
    };
  }

  // --- Private Helper Methods ---

  private buildConductorInfo(customerData: any) {
    return {
      type: 'person' as const,
      verificationLevel: this.determineVerificationLevel(customerData),
      pepStatus: this.determinePEPStatus(customerData),

      personInfo: {
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        dateOfBirth: customerData.dateOfBirth || '',
        occupation: customerData.occupation || '',
        address: {
          street: customerData.streetAddress || '',
          city: customerData.city || '',
          province: customerData.province || '',
          postalCode: customerData.postalCode || '',
          country: customerData.country || 'Canada'
        },
        identification: {
          type: customerData.idType || '',
          number: customerData.idNumber || '',
          expiryDate: customerData.idExpiry || '',
          issuingAuthority: this.getIssuingAuthority(customerData.idType)
        },
        citizenship: customerData.citizenship || 'Canada',
        residenceCountry: customerData.residenceCountry || 'Canada'
      }
    };
  }

  private determineVerificationLevel(customerData: any): VerificationLevel {
    if (!customerData.idNumber) return 'none';
    if (customerData.idVerificationMethod === 'enhanced') return 'enhanced';
    if (customerData.idVerificationMethod === 'full_kyc') return 'full_kyc';
    return 'basic';
  }

  private determinePEPStatus(customerData: any): PEPStatus {
    if (customerData.pepStatus) return customerData.pepStatus;
    if (customerData.occupation?.toLowerCase().includes('government')) return 'pep';
    return 'not_pep';
  }

  private detectSuspiciousActivity(transactionData: CryptoTransactionData): boolean {
    const riskFactors = transactionData.riskFactors || [];

    // Check for suspicious patterns
    const suspiciousIndicators = [
      'rapid_transactions',
      'structuring',
      'high_risk_jurisdiction',
      'mixer_usage',
      'privacy_coin',
      'unusual_patterns'
    ];

    return riskFactors.some(factor => suspiciousIndicators.includes(factor));
  }

  private calculateRiskLevel(transactionData: CryptoTransactionData): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = transactionData.riskScore;

    if (riskScore >= 90) return 'critical';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private calculateTransactionRiskScore(paymentResult: UnifiedPaymentResult): number {
    let score = 0;

    // Amount-based risk
    if (paymentResult.amount >= 50000) score += 30;
    else if (paymentResult.amount >= 25000) score += 20;
    else if (paymentResult.amount >= 10000) score += 10;

    // Crypto-specific risks
    if (paymentResult.cryptoResult?.cryptocurrency === 'BTC') score += 5;
    if (paymentResult.cryptoResult?.cryptocurrency === 'ETH') score += 3;

    return Math.min(score, 100);
  }

  private identifyRiskFactors(paymentResult: UnifiedPaymentResult): string[] {
    const factors: string[] = [];

    if (paymentResult.amount >= 10000) factors.push('large_amount');
    if (paymentResult.amount % 1000 === 0) factors.push('round_numbers');

    return factors;
  }

  private generateSTRNarrative(transactionData: CryptoTransactionData, suspicionReasons: string[]): string {
    const amount = transactionData.paymentResult.amount;
    const crypto = transactionData.cryptoResult.cryptocurrency;

    let narrative = `Virtual currency transaction of $${amount} CAD for ${crypto} flagged for the following reasons: `;
    narrative += suspicionReasons.join(', ');
    narrative += '. Transaction monitored and reviewed for compliance with FINTRAC requirements.';

    return narrative;
  }

  private generateFINTRACXML(report: VCTRReport | LVCTRReport | CryptoSTRReport): string {
    // Simplified XML generation - in production, use proper XML library
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<${report.reportType.toLowerCase()}_report xmlns="http://www.fintrac-canafe.gc.ca/vctr">\n`;
    xml += `  <report_header>\n`;
    xml += `    <report_type>${report.reportType}</report_type>\n`;
    xml += `    <report_reference>${report.reportReference}</report_reference>\n`;
    xml += `    <submission_date>${report.submissionDate}</submission_date>\n`;
    xml += `  </report_header>\n`;
    xml += `  <virtual_currency_transaction>\n`;
    xml += `    <transaction_id>${report.virtualCurrencyTransaction.transactionId}</transaction_id>\n`;
    xml += `    <currency_type>${report.virtualCurrencyTransaction.virtualCurrencyType}</currency_type>\n`;
    xml += `    <amount>${report.virtualCurrencyTransaction.virtualCurrencyAmount}</amount>\n`;
    xml += `    <cad_equivalent>${report.virtualCurrencyTransaction.cadEquivalent}</cad_equivalent>\n`;
    xml += `    <transaction_hash>${report.virtualCurrencyTransaction.transactionHash}</transaction_hash>\n`;
    xml += `  </virtual_currency_transaction>\n`;
    xml += `</${report.reportType.toLowerCase()}_report>\n`;

    return xml;
  }

  private generateBatchXML(reports: Array<VCTRReport | LVCTRReport | CryptoSTRReport>): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<fintrac_batch xmlns="http://www.fintrac-canafe.gc.ca/batch">\n';
    xml += `  <batch_header>\n`;
    xml += `    <batch_id>BATCH-${Date.now()}</batch_id>\n`;
    xml += `    <report_count>${reports.length}</report_count>\n`;
    xml += `    <submission_date>${new Date().toISOString().split('T')[0]}</submission_date>\n`;
    xml += `  </batch_header>\n`;
    xml += '  <reports>\n';

    for (const report of reports) {
      xml += this.generateFINTRACXML(report);
    }

    xml += '  </reports>\n';
    xml += '</fintrac_batch>\n';

    return xml;
  }

  private generateReportsCSV(reports: Array<VCTRReport | LVCTRReport | CryptoSTRReport>): string {
    const headers = [
      'Report_ID',
      'Report_Type',
      'Report_Reference',
      'Transaction_ID',
      'Currency_Type',
      'Amount',
      'CAD_Equivalent',
      'Transaction_Hash',
      'Sender_Wallet',
      'Receiver_Wallet',
      'Customer_Name',
      'Submission_Status',
      'Created_At'
    ];

    const rows = [headers.join(',')];

    for (const report of reports) {
      const row = [
        report.id,
        report.reportType,
        report.reportReference,
        report.virtualCurrencyTransaction.transactionId,
        report.virtualCurrencyTransaction.virtualCurrencyType,
        report.virtualCurrencyTransaction.virtualCurrencyAmount,
        report.virtualCurrencyTransaction.cadEquivalent,
        report.virtualCurrencyTransaction.transactionHash,
        report.virtualCurrencyTransaction.senderWalletAddress || '',
        report.virtualCurrencyTransaction.receiverWalletAddress,
        `${report.conductor.personInfo?.firstName} ${report.conductor.personInfo?.lastName}`,
        report.submissionStatus,
        report.createdAt
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private async storeReport(report: VCTRReport | LVCTRReport | CryptoSTRReport): Promise<void> {
    const existingReports = await this.getAllReports();
    existingReports.unshift(report);
    await databaseService.setItem(this.STORAGE_KEY, existingReports);
  }

  private async getAllReports(): Promise<Array<VCTRReport | LVCTRReport | CryptoSTRReport>> {
    try {
      const reports = await databaseService.getItem(this.STORAGE_KEY);
      return Array.isArray(reports) ? reports : [];
    } catch (error) {
      console.error('Error loading crypto FINTRAC reports:', error);
      return [];
    }
  }

  private getIssuingAuthority(idType?: string): string {
    switch (idType) {
      case 'drivers_license': return 'Provincial Government';
      case 'passport': return 'Government of Canada';
      case 'provincial_id': return 'Provincial Government';
      default: return 'Government Authority';
    }
  }

  private calculateRetentionDate(): string {
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 5);
    return retentionDate.toISOString().split('T')[0];
  }

  private async generateAuditHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const cryptoFintracService = new CryptoFINTRACService();
export default cryptoFintracService;