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
}