// src/models/fintracModels.ts

/**
 * Extended Transaction interface with FINTRAC compliance fields
 */
export interface FintracTransaction {
  id: number;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  commission: number;
  profit: number;

  // FINTRAC Compliance Fields
  status: 'locked' | 'completed' | 'submitted'; // Transaction status
  customerId?: string; // Reference to customer data
  requiresLCTR: boolean; // Whether LCTR is required (≥$10,000)
  requiresEnhancedRecords: boolean; // Whether enhanced records are required (≥$3,000)
  lctrDeadline?: string; // Deadline for LCTR submission (15 days from transaction)
  daysUntilDeadline?: number; // Days until LCTR deadline
  riskScore?: number; // Risk assessment score
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH'; // Risk rating
  riskFactors?: string[]; // Risk factors identified
  requiresEnhancedDueDiligence?: boolean; // Whether enhanced due diligence is required
  requiresOngoingMonitoring?: boolean; // Whether ongoing monitoring is required
  reportSubmitted?: boolean; // Whether LCTR report has been submitted
  reportId?: string; // Reference to LCTR report
  reportSubmissionDate?: string; // Date of report submission

  // Cryptocurrency-specific fields
  isCryptoTransaction?: boolean; // Whether this involves cryptocurrency
  cryptocurrency?: string; // BTC, ETH, etc.
  cryptoAmount?: number; // Amount in cryptocurrency
  walletAddressSender?: string; // Sender wallet address
  walletAddressReceiver?: string; // Receiver wallet address
  transactionHash?: string; // Blockchain transaction hash
  blockHeight?: number; // Block height when confirmed
  confirmations?: number; // Number of confirmations
  networkFee?: number; // Network/gas fee paid
  exchangeRate?: number; // Crypto to CAD exchange rate used
  requiresVCTR?: boolean; // Whether VCTR is required (crypto ≥$1,000)
  requiresLVCTR?: boolean; // Whether LVCTR is required (crypto ≥$10,000)
  requiresSTR?: boolean; // Whether STR is required (suspicious activity)
  ipAddress?: string; // Customer IP address during transaction
  deviceId?: string; // Device identifier if applicable
  sessionId?: string; // Session identifier
}

/**
 * Customer model for FINTRAC compliance
 */
export interface Customer {
  id: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  occupation: string;
  
  // Address Information
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  
  // Identification
  idType: string;
  idNumber: string;
  idExpiry: string;
  idVerificationMethod?: string;
  idVerificationDate?: string;
  
  // Risk Factors
  actingForThirdParty: boolean;
  thirdPartyName?: string;
  thirdPartyAddress?: string;
  relationshipToThirdParty?: string;
  sourceOfFunds?: string;
  sourceDescription?: string;
  
  // Risk Assessment
  currentRiskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
  lastRiskAssessment?: string;
  riskFactors?: string[];
  requiresEnhancedMonitoring?: boolean;

  // PEP (Politically Exposed Person) Status
  pepStatus?: 'not_pep' | 'pep' | 'head_of_international_org' | 'family_member' | 'close_associate';
  pepDetails?: string;
  pepLastReview?: string;

  // Cryptocurrency-specific information
  cryptoExperience?: 'none' | 'beginner' | 'intermediate' | 'advanced';
  cryptoWallets?: Array<{
    address: string;
    type: string; // BTC, ETH, etc.
    verified: boolean;
    dateAdded: string;
  }>;
  cryptoVerificationLevel?: 'none' | 'basic' | 'enhanced' | 'full_kyc';
  cryptoTransactionHistory?: {
    totalTransactions: number;
    totalVolume: number;
    largestTransaction: number;
    firstTransaction?: string;
    lastTransaction?: string;
  };
  citizenship?: string;
  residenceCountry?: string;
  
  // Transaction History
  totalTransactionCount?: number;
  totalTransactionVolume?: number;
  lastTransactionDate?: string;
  averageTransactionAmount?: number;
  
  // Compliance Dates
  nextReviewDate?: string;
  lastMonitoringDate?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  retentionDate: string; // 5 years from creation
}

/**
 * Risk Assessment model
 */
export interface RiskAssessment {
  id: string;
  customerId: string;
  transactionId?: number;
  
  // Risk Calculation
  riskScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: string[];
  
  // Risk Components
  amountRisk: number;
  occupationRisk: number;
  geographicRisk: number;
  thirdPartyRisk: number;
  sourceOfFundsRisk: number;
  behaviorRisk: number;
  
  // Required Actions
  requiresEnhancedDueDiligence: boolean;
  requiresOngoingMonitoring: boolean;
  requiresSeniorApproval: boolean;
  
  // Assessment Metadata
  assessmentDate: string;
  assessedBy?: string;
  assessmentMethod: 'automatic' | 'manual' | 'hybrid';
  reviewDate?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Compliance Notification model
 */
export interface ComplianceNotification {
  id: string;
  type: 'deadline_warning' | 'overdue_report' | 'risk_alert' | 'review_due';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Content
  title: string;
  message: string;
  
  // Related Entities
  transactionId?: number;
  customerId?: string;
  reportId?: string;
  
  // Timing
  triggerDate: string;
  dueDate?: string;
  escalationDate?: string;
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * LCTR Report model
 */
export interface LCTRReport {
  id: string;
  reportNumber?: string; // FINTRAC reference number
  
  // Report Content
  transactionIds: number[]; // Array of included transaction IDs
  reportingPeriod?: string;
  totalTransactionCount: number;
  totalAmount: number;
  customerId: string;
  customerRiskRating?: string;
  
  // Submission Details
  submissionStatus: 'draft' | 'submitted' | 'acknowledged' | 'rejected';
  submissionDate?: string;
  submissionMethod?: 'api' | 'web' | 'paper';
  fintracAcknowledgment?: string;
  
  // FINTRAC Data
  reportData?: any; // Complete FINTRAC payload
  
  // Deadlines
  originalDeadline: string;
  submissionDeadline: string;
  
  // Metadata
  preparedBy?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  retentionDate: string; // 5 years from submission

  // Cryptocurrency-specific fields for LCTR
  involvesCryptocurrency?: boolean;
  cryptoTransactions?: Array<{
    transactionId: string;
    cryptocurrency: string;
    cryptoAmount: number;
    walletAddresses: {
      sender?: string;
      receiver: string;
    };
    transactionHash: string;
    exchangeRate: number;
  }>;
}

/**
 * Virtual Currency Transaction Report (VCTR) model
 */
export interface VCTRReport {
  id: string;
  reportType: 'VCTR';
  reportReference: string;
  submissionDate: string;

  // Virtual Currency Transaction Details
  transactionId: string;
  virtualCurrencyType: string; // BTC, ETH, etc.
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
  networkFee: number;
  confirmations: number;
  blockHeight?: number;

  // Customer Information
  customerId: string;
  customerData: any;
  verificationLevel: 'none' | 'basic' | 'enhanced' | 'full_kyc';

  // Risk Assessment
  riskScore: number;
  riskFactors: string[];
  suspicious: boolean;

  // Submission Details
  submissionStatus: 'draft' | 'submitted' | 'acknowledged' | 'rejected';
  submissionMethod: 'FWR' | 'API' | 'PAPER';
  acknowledgmentReference?: string;

  // Metadata
  preparedBy: string;
  reviewedBy?: string;
  retentionDate: string;
  auditHash: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Large Virtual Currency Transaction Report (LVCTR) model
 */
export interface LVCTRReport extends VCTRReport {
  reportType: 'LVCTR';
  aggregateTransactions: Array<{
    transactionId: string;
    date: string;
    amount: number;
    virtualCurrencyType: string;
    cadEquivalent: number;
  }>;
  totalAggregateAmount: number;
  aggregationPeriod: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Crypto Suspicious Transaction Report (STR) model
 */
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
  relatedTransactions?: Array<{
    transactionId: string;
    date: string;
    amount: number;
    relationship: string;
  }>;
}