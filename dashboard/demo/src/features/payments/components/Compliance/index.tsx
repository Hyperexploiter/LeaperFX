// Compliance Components Index
// Centralized exports for all FINTRAC compliance components

export { default as CryptoComplianceReport } from './CryptoComplianceReport';
export { default as FintracExportModal } from './FintracExportModal';
export { default as ComplianceAlerts } from './ComplianceAlerts';

// Re-export types for convenience
export type {
  VCTRReport,
  LVCTRReport,
  CryptoSTRReport,
  FintracTransaction,
  Customer
} from '../../../../models/fintracModels';

// Export services for use in components
export { cryptoFintracService } from '../../services/cryptoFintracService';
export { fintracReportingService } from '../../../../services/fintracReportingService';