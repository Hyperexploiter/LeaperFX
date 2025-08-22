import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Bell, 
  Lock, 
  UnlockIcon, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  FileText,
  Database,
  User
} from 'lucide-react';
import { Modal, Toast } from './Modal';

// Import real services
import transactionService from '../services/transactionService';
import complianceNotificationService from '../services/complianceNotificationService';
import customerService from '../services/customerService';
import fintracReportingService, { type FINTRACSubmissionRecord } from '../services/fintracReportingService';
import secureDocumentService from '../services/secureDocumentService';

// Interface definitions for FINTRAC compliance data
interface ComplianceTransaction {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  commission?: number;
  profit?: number;
  status?: 'pending' | 'locked' | 'completed' | 'submitted';
  requiresLCTR?: boolean;
  requiresEnhancedRecords?: boolean;
  lctrDeadline?: string;
  daysUntilDeadline?: number;
  complianceStatus?: 'none' | 'enhanced_records' | 'lctr_required' | 'completed';
  customerId?: string;
  riskScore?: number;
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors?: string[];
}

interface ComplianceNotification {
  id: string;
  type: 'deadline_warning' | 'overdue_report' | 'risk_alert' | 'info';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  transactionId?: string;
  triggerDate: string;
  dueDate?: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  [key: string]: any; // Allow additional properties
}

// Main FINTRAC Compliance Component
const FintracCompliance: React.FC = () => {
  const [transactions, setTransactions] = useState<ComplianceTransaction[]>([]);
  const [notifications, setNotifications] = useState<ComplianceNotification[]>([]);
  // const [currentTime, setCurrentTime] = useState(new Date()); // Not currently used
  const [selectedTransaction, setSelectedTransaction] = useState<ComplianceTransaction | null>(null);
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [showCustomerAssignModal, setShowCustomerAssignModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    customerInfo: false,
    lctrSubmission: false,
    customerAssignment: false,
    lctrExport: false,
    auditExport: false,
    xmlExport: false
  });

  // FINTRAC submission records for audit
  const [submissionRecords, setSubmissionRecords] = useState<FINTRACSubmissionRecord[]>([]);
  
  // Prefill state for customer info modal
  const [prefillCustomer, setPrefillCustomer] = useState<Customer | null>(null);
  const [prefillSelectId, setPrefillSelectId] = useState<string>('');

  // Apply prefill to modal inputs when available
  useEffect(() => {
    if (!showCustomerInfoModal) return;
    const c = prefillCustomer;
    const setVal = (id: string, val: any) => {
      try {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) el.value = (val ?? '').toString();
      } catch (e) {
        // no-op
      }
    };
    if (c) {
      setVal('firstName', c.firstName);
      setVal('lastName', c.lastName);
      setVal('dateOfBirth', c.dateOfBirth || '');
      setVal('occupation', c.occupation || '');
      setVal('streetAddress', c.address || '');
      setVal('city', c.city || '');
      setVal('province', c.province || '');
      setVal('postalCode', c.postalCode || '');
      setVal('idType', c.idType || '');
      setVal('idNumber', c.idNumber || '');
      setVal('photoId', c.photoId || '');
      setVal('idExpiry', c.idExpiry || '');
      setVal('sourceOfFunds', c.sourceOfFunds || '');
    }
  }, [showCustomerInfoModal, prefillCustomer]);
  
  // FINTRAC Risk Assessment Algorithm with robust error handling
  const calculateRiskScore = (customerData: Record<string, any> | null, transactionData: { toAmount?: number; [key: string]: any } | null) => {
    let riskScore = 0;
    let riskFactors: string[] = [];

    try {
      // Validate input parameters with proper null checks
      const safeCustomerData = customerData && typeof customerData === 'object' ? customerData : {};
      const safeTransactionData = transactionData && typeof transactionData === 'object' ? transactionData : { toAmount: 0 };

      if (!customerData || typeof customerData !== 'object') {
        console.warn('Invalid customerData provided to calculateRiskScore');
      }

      if (!transactionData || typeof transactionData !== 'object') {
        console.warn('Invalid transactionData provided to calculateRiskScore');
      }

      // 1. Transaction Amount Risk (0-3 points)
      const transactionAmount = typeof safeTransactionData.toAmount === 'number' ? safeTransactionData.toAmount : 0;
      
      if (transactionAmount >= 50000) {
        riskScore += 3;
        riskFactors.push("Very high transaction amount (≥$50k)");
      } else if (transactionAmount >= 25000) {
        riskScore += 2;
        riskFactors.push("High transaction amount (≥$25k)");
      } else if (transactionAmount >= 10000) {
        riskScore += 1;
        riskFactors.push("Large transaction amount (≥$10k)");
      }

      // 2. Customer Occupation Risk (0-3 points)
      const highRiskOccupations = [
        'cash intensive business', 'money services', 'precious metals dealer',
        'art dealer', 'casino', 'real estate', 'lawyer', 'accountant'
      ];
      const mediumRiskOccupations = ['business owner', 'self-employed', 'consultant'];

      if (safeCustomerData.occupation && typeof safeCustomerData.occupation === 'string') {
        try {
          const occupation = safeCustomerData.occupation.toLowerCase();
          if (highRiskOccupations.some(occ => occupation.includes(occ))) {
            riskScore += 3;
            riskFactors.push(`High-risk occupation: ${safeCustomerData.occupation}`);
          } else if (mediumRiskOccupations.some(occ => occupation.includes(occ))) {
            riskScore += 1;
            riskFactors.push(`Medium-risk occupation: ${safeCustomerData.occupation}`);
          }
        } catch (error) {
          console.warn('Error processing occupation risk:', error);
        }
      }

      // 3. Geographic Risk (0-2 points)
      const highRiskCountries = ['afghanistan', 'iran', 'north korea', 'syria'];
      const mediumRiskCountries = ['russia', 'china', 'pakistan'];

      if (safeCustomerData.country && typeof safeCustomerData.country === 'string') {
        try {
          const country = safeCustomerData.country.toLowerCase();
          if (highRiskCountries.includes(country)) {
            riskScore += 2;
            riskFactors.push(`High-risk country: ${safeCustomerData.country}`);
          } else if (mediumRiskCountries.includes(country)) {
            riskScore += 1;
            riskFactors.push(`Medium-risk country: ${safeCustomerData.country}`);
          }
        } catch (error) {
          console.warn('Error processing geographic risk:', error);
        }
      }

      // 4. Third Party Activity (0-2 points)
      if (safeCustomerData.actingForThirdParty === 'yes') {
        riskScore += 2;
        riskFactors.push("Acting on behalf of third party");
      }

      // 5. Source of Funds Risk (0-2 points)
      const highRiskSources = ['gift', 'other', 'business income'];
      if (safeCustomerData.sourceOfFunds && typeof safeCustomerData.sourceOfFunds === 'string') {
        try {
          const sourceOfFunds = safeCustomerData.sourceOfFunds.toLowerCase();
          if (highRiskSources.includes(sourceOfFunds)) {
            riskScore += 1;
            riskFactors.push(`Medium-risk source: ${safeCustomerData.sourceOfFunds}`);
          }
        } catch (error) {
          console.warn('Error processing source of funds risk:', error);
        }
      }

      // Determine final risk rating
      let riskRating;
      if (riskScore >= 8) {
        riskRating = 'HIGH';
      } else if (riskScore >= 4) {
        riskRating = 'MEDIUM';
      } else {
        riskRating = 'LOW';
      }

      return {
        score: riskScore,
        rating: riskRating,
        factors: riskFactors,
        requiresEnhancedDueDiligence: riskScore >= 6,
        requiresOngoingMonitoring: riskScore >= 4
      };

    } catch (error) {
      console.error('Critical error in calculateRiskScore:', error);
      
      // Return safe fallback values
      return {
        score: 0,
        rating: 'LOW',
        factors: ['Error in risk calculation - manual review required'],
        requiresEnhancedDueDiligence: true, // Default to enhanced due diligence on error
        requiresOngoingMonitoring: true
      };
    }
  };
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning' | 'info', message: string, visible: boolean}>({
    type: 'success',
    message: '',
    visible: false
  });

  // Helper functions for toast notifications
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message, visible: true });
  };
  
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Update current time every minute - currently disabled
  // useEffect(() => {
  //   const timer = setInterval(() => setCurrentTime(new Date()), 60000);
  //   return () => clearInterval(timer);
  // }, []);

  // Load initial data
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        // Fetch transactions requiring FINTRAC compliance
        const complianceTransactions = await transactionService.getComplianceTransactions();
        
        // Fetch compliance notifications
        const complianceNotifications = await complianceNotificationService.getNotifications(10);
        
        // Fetch available customers for assignment
        const customers = await customerService.getAllCustomers();
        
        // Fetch FINTRAC submission records for audit
        const fintracRecords = await fintracReportingService.getAllSubmissionRecords();
        
        // Update state with fetched data
        setTransactions(complianceTransactions as ComplianceTransaction[]);
        setNotifications(complianceNotifications as unknown as ComplianceNotification[]);
        setAvailableCustomers(customers);
        setSubmissionRecords(fintracRecords);
      } catch (error) {
        console.error('Error loading FINTRAC compliance data:', error);
        // Fallback to empty arrays if there's an error
        setTransactions([]);
        setNotifications([]);
        setAvailableCustomers([]);
        setSubmissionRecords([]);
        showToast('error', 'Failed to load compliance data. Please refresh the page.');
      }
    };
    
    loadTransactions();
  }, []);
  
  // Check for transactions approaching deadlines
  useEffect(() => {
    // This function checks for transactions that are approaching their LCTR deadlines
    // and creates notifications for them
    const checkDeadlines = () => {
      const lockedTransactions = transactions.filter(txn => 
        txn.status === 'locked' && txn.requiresLCTR
      );
      
      // Get current notifications for deadlines
      const existingDeadlineNotifications = notifications.filter(
        notif => notif.type === 'deadline_warning'
      );
      
      // Calculate days until deadline for each transaction
      const now = new Date();
      const transactionsNeedingWarnings = lockedTransactions.filter(txn => {
        // Calculate days until deadline
        const deadlineDate = new Date(txn.lctrDeadline);
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if this transaction already has a notification
        const hasNotification = existingDeadlineNotifications.some(
          notif => notif.transactionId === txn.id
        );
        
        // Create warnings for transactions with 3 or fewer days until deadline
        // that don't already have a notification
        return daysUntilDeadline <= 3 && !hasNotification;
      });
      
      // Create new notifications
      const newNotifications = transactionsNeedingWarnings.map(txn => {
        const deadlineDate = new Date(txn.lctrDeadline);
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: `notif-deadline-${txn.id}-${Date.now()}`,
          type: 'deadline_warning',
          priority: daysUntilDeadline <= 1 ? 'urgent' : 'high',
          title: 'LCTR Deadline Approaching',
          message: `Transaction ${txn.id} LCTR report due in ${daysUntilDeadline} days`,
          transactionId: txn.id,
          triggerDate: now.toISOString(),
          dueDate: txn.lctrDeadline,
          status: 'active'
        };
      });
      
      // Add new notifications
      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      // Check for overdue transactions
      const overdueTransactions = lockedTransactions.filter(txn => {
        const deadlineDate = new Date(txn.lctrDeadline);
        return deadlineDate < now;
      });
      
      // Get existing overdue notifications
      const existingOverdueNotifications = notifications.filter(
        notif => notif.type === 'overdue_report'
      );
      
      // Find overdue transactions without notifications
      const overdueNeedingNotifications = overdueTransactions.filter(txn => {
        return !existingOverdueNotifications.some(
          notif => notif.transactionId === txn.id
        );
      });
      
      // Create overdue notifications
      const overdueNotifications = overdueNeedingNotifications.map(txn => {
        return {
          id: `notif-overdue-${txn.id}-${Date.now()}`,
          type: 'overdue_report',
          priority: 'urgent',
          title: 'LCTR Report Overdue',
          message: `Transaction ${txn.id} LCTR report is overdue. Immediate action required.`,
          transactionId: txn.id,
          triggerDate: now.toISOString(),
          dueDate: txn.lctrDeadline,
          status: 'active'
        };
      });
      
      // Add overdue notifications
      if (overdueNotifications.length > 0) {
        setNotifications(prev => [...prev, ...overdueNotifications]);
      }
    };
    
    // Check deadlines when component mounts and when transactions change
    checkDeadlines();
    
    // Set up interval to check deadlines regularly
    const deadlineTimer = setInterval(checkDeadlines, 60000 * 60); // Check every hour
    
    return () => clearInterval(deadlineTimer);
  }, [transactions, notifications]);


  // Complete customer information with prefill support
  const handleCompleteCustomerInfo = async (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowCustomerInfoModal(true);
    try {
      if (transaction?.customerId) {
        const customer = await customerService.getCustomerById(transaction.customerId);
        setPrefillCustomer(customer);
      } else {
        setPrefillCustomer(null);
      }
    } catch (e) {
      console.warn('Failed to prefill customer info:', e);
      setPrefillCustomer(null);
    }
  };

  // Open customer assignment modal
  const handleAssignCustomer = (transaction: any) => {
    setSelectedTransaction(transaction);
    setSelectedCustomerId('');
    setShowCustomerAssignModal(true);
  };

  // Handle customer assignment to transaction
  const handleCustomerAssignment = async () => {
    if (!selectedTransaction || !selectedCustomerId) {
      showToast('error', 'Please select a customer');
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, customerAssignment: true }));

      // Link customer to transaction
      const updatedTransaction = await transactionService.linkCustomerToTransaction(
        selectedTransaction.id,
        selectedCustomerId
      );

      if (updatedTransaction) {
        // Update local state
        setTransactions(prev => 
          prev.map(txn => 
            txn.id === selectedTransaction.id ? 
            { ...updatedTransaction, customerId: selectedCustomerId } : 
            txn
          )
        );

        // Notify other components via WebSocket about the transaction update
        try {
          const { default: webSocketService } = await import('../services/webSocketService');
          webSocketService.send({
            type: 'transaction_updated',
            data: {
              transactionId: selectedTransaction.id,
              customerId: selectedCustomerId,
              updateType: 'customer_assigned'
            }
          });
        } catch (wsError) {
          console.warn('Failed to send WebSocket notification:', wsError);
        }

        // Get customer info for display
        const customer = availableCustomers.find(c => c.id === selectedCustomerId);
        if (customer) {
          showToast('success', `Customer ${customer.firstName} ${customer.lastName} assigned to transaction`);
        } else {
          showToast('success', 'Customer assigned to transaction successfully');
        }

        setShowCustomerAssignModal(false);
        setSelectedTransaction(null);
        setSelectedCustomerId('');
      } else {
        throw new Error('Failed to assign customer to transaction');
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to assign customer');
    } finally {
      setIsLoading(prev => ({ ...prev, customerAssignment: false }));
    }
  };

  // Load existing customer into the info modal and link to transaction
  const loadExistingForModal = async () => {
    try {
      if (!prefillSelectId) {
        showToast('error', 'Please select a customer to load');
        return;
      }
      const customer = await customerService.getCustomerById(prefillSelectId);
      if (customer) {
        setPrefillCustomer(customer);
        setSelectedTransaction((prev: any) => prev ? { ...prev, customerId: prefillSelectId } : prev);
        showToast('info', 'Existing customer loaded into the form');
      } else {
        showToast('error', 'Selected customer not found');
      }
    } catch (e) {
      console.warn('Failed to load existing customer:', e);
    }
  };

  // Submit customer information
  const handleSubmitCustomerInfo = async () => {
    if (!selectedTransaction) {
      showToast('error', 'No transaction selected');
      return;
    }
    
    try {
      // Set loading state
      setIsLoading(prev => ({ ...prev, customerInfo: true }));
      
      // Robust DOM element access with error handling
      const getElementValue = (id: string): string => {
        try {
          const element = document.getElementById(id);
          return element?.value || '';
        } catch (error) {
          console.warn(`Failed to get value for element ${id}:`, error);
          return '';
        }
      };
      
      const getRadioValue = (name: string): string => {
        try {
          const element = document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement;
          return element?.value || 'no';
        } catch (error) {
          console.warn(`Failed to get radio value for ${name}:`, error);
          return 'no';
        }
      };
      
      // In a real implementation, this would validate and save the customer information
      // Get form data from the modal with robust error handling
      const customerData = {
        firstName: getElementValue('firstName'),
        lastName: getElementValue('lastName'),
        dateOfBirth: getElementValue('dateOfBirth'),
        occupation: getElementValue('occupation'),
        streetAddress: getElementValue('streetAddress'),
        city: getElementValue('city'),
        province: getElementValue('province'),
        postalCode: getElementValue('postalCode'),
        country: 'Canada',
        idType: getElementValue('idType'),
        idNumber: getElementValue('idNumber'),
        photoId: getElementValue('photoId'),
        idExpiry: getElementValue('idExpiry'),
        thirdPartyName: getElementValue('thirdPartyName'),
        relationshipToThirdParty: getElementValue('relationshipToThirdParty'),
        actingForThirdParty: getRadioValue('actingForThirdParty'),
        sourceOfFunds: getElementValue('sourceOfFunds')
      };
      
      // Basic validation
      if (!customerData.firstName || !customerData.lastName || !customerData.dateOfBirth) {
        throw new Error('Please fill in all required fields');
      }
      
      // Validate selectedTransaction before risk assessment
      if (!selectedTransaction || typeof selectedTransaction !== 'object') {
        throw new Error('Invalid transaction data for risk assessment');
      }
      
      // Ensure transaction has required fields for risk assessment
      if (typeof selectedTransaction.toAmount !== 'number' || selectedTransaction.toAmount <= 0) {
        throw new Error('Invalid transaction amount for risk assessment');
      }
      
      // Perform risk assessment with validated data
      const riskAssessment = calculateRiskScore(customerData, selectedTransaction);
      
      // Import the transaction service dynamically to avoid circular dependencies
      const { default: transactionService } = await import('../services/transactionService');
      
      // Create or update customer, then update transaction accordingly
      let finalCustomerId: string | null = selectedTransaction.customerId || null;
      const customerPayload: any = {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        dateOfBirth: customerData.dateOfBirth,
        occupation: customerData.occupation,
        address: customerData.streetAddress,
        city: customerData.city,
        province: customerData.province,
        postalCode: customerData.postalCode,
        country: 'Canada',
        idType: customerData.idType,
        idNumber: customerData.idNumber,
        photoId: customerData.photoId,
        idExpiry: customerData.idExpiry,
        sourceOfFunds: customerData.sourceOfFunds
      };

      if (finalCustomerId) {
        try {
          await customerService.updateCustomer(finalCustomerId, customerPayload);
        } catch (e) {
          console.warn('Failed to update existing customer, proceeding:', e);
        }
      } else {
        // No linked customer — create a new one
        const newCustomer = await customerService.createCustomer({
          ...customerPayload,
          // Keep minimal required fields and optional extras
        });
        finalCustomerId = newCustomer?.id || null;
      }

      // Refresh available customers cache
      try {
        const refreshed = await customerService.getAllCustomers();
        setAvailableCustomers(refreshed || []);
      } catch (e) {
        console.warn('Failed to refresh customers after save:', e);
      }

      const newComplianceStatus = selectedTransaction.requiresLCTR ? 'lctr_required' : 'completed';

      // Update transaction in the service
      const updatedTransaction = await transactionService.updateTransaction(selectedTransaction.id, {
        status: 'completed',
        customerId: finalCustomerId || undefined,
        customerData,
        riskScore: riskAssessment.score,
        riskRating: riskAssessment.rating,
        riskFactors: riskAssessment.factors,
        requiresEnhancedDueDiligence: riskAssessment.requiresEnhancedDueDiligence,
        requiresOngoingMonitoring: riskAssessment.requiresOngoingMonitoring,
        complianceStatus: newComplianceStatus,
        completedAt: new Date()
      });
      
      if (!updatedTransaction) {
        throw new Error('Failed to update transaction');
      }
      
      // Update local state
      setTransactions(prev => 
        prev.map(txn => 
          txn.id === selectedTransaction.id ? updatedTransaction : txn
        )
      );

      // Notify other components via WebSocket about the transaction update
      try {
        const { default: webSocketService } = await import('../services/webSocketService');
        webSocketService.send({
          type: 'transaction_updated',
          data: {
            transactionId: selectedTransaction.id,
            customerId: updatedTransaction.customerId,
            updateType: 'customer_assigned'
          }
        });
      } catch (wsError) {
        console.warn('Failed to send WebSocket notification:', wsError);
      }
  
      // Add notification if high risk
      if (riskAssessment.rating === 'HIGH') {
        const newNotification = {
          id: `notif-risk-${Date.now()}`,
          type: 'risk_alert',
          priority: 'urgent',
          title: 'High Risk Transaction',
          message: `Transaction ${selectedTransaction.id} has been flagged as high risk (Score: ${riskAssessment.score})`,
          transactionId: selectedTransaction.id,
          triggerDate: new Date().toISOString(),
          status: 'active'
        };
        
        setNotifications(prev => [...prev, newNotification]);
      }
  
      setShowCustomerInfoModal(false);
      setShowSuccessModal(true);
      showToast('success', 'Customer information added successfully');
    } catch (error) {
      console.error('Error submitting customer information:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to submit customer information');
    } finally {
      // Reset loading state
      setIsLoading(prev => ({ ...prev, customerInfo: false }));
    }
  };

  // Submit LCTR reports using production-grade FINTRAC service
  const handleSubmitLCTR = async () => {
    try {
      setIsLoading(prev => ({ ...prev, lctrSubmission: true }));
      
      const completedTransactions = transactions.filter(txn => 
        txn.status === 'completed' && txn.requiresLCTR && !txn.reportSubmitted
      );

      if (completedTransactions.length === 0) {
        showToast('warning', 'No completed transactions to report');
        setIsLoading(prev => ({ ...prev, lctrSubmission: false }));
        return;
      }

      // Validate all transactions have required data
      const customers = await customerService.getAllCustomers();
      const invalid = completedTransactions.filter(tx => {
        if (!tx.customerId) return true;
        const c = customers.find((cc: any) => cc.id === tx.customerId);
        return !c || !c.idType || !c.idNumber || !tx.customerData;
      });
      
      if (invalid.length > 0) {
        showToast('error', `Cannot submit LCTR: ${invalid.length} transaction(s) missing required customer data.`);
        setIsLoading(prev => ({ ...prev, lctrSubmission: false }));
        return;
      }

      // Submit to FINTRAC using production service (creates permanent audit record)
      const submissionRecord = await fintracReportingService.submitLCTRReport(
        completedTransactions,
        'FWR' // FINTRAC Web Reporting System
      );

      // Update transactions as submitted
      const { default: transactionService } = await import('../services/transactionService');
      const updatePromises = completedTransactions.map(txn => 
        transactionService.updateTransaction(txn.id, {
          status: 'submitted',
          reportSubmitted: true,
          reportSubmissionDate: submissionRecord.submissionDate,
          reportId: submissionRecord.reportReference
        })
      );
      
      await Promise.all(updatePromises);
      
      // Refresh data
      const complianceTransactions = await transactionService.getComplianceTransactions();
      const fintracRecords = await fintracReportingService.getAllSubmissionRecords();
      setTransactions(complianceTransactions);
      setSubmissionRecords(fintracRecords);
      
      // Remove related notifications
      setNotifications(prev =>
        prev.filter(notif =>
          !completedTransactions.some(txn => txn.id === notif.transactionId && 
            (notif.type === 'deadline_warning' || notif.type === 'overdue_report'))
        )
      );
      
      showToast('success', `LCTR submitted to FINTRAC: ${submissionRecord.reportReference} (${completedTransactions.length} transactions)`);
      
    } catch (error) {
      console.error('Error submitting LCTR reports:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to submit LCTR reports');
    } finally {
      setIsLoading(prev => ({ ...prev, lctrSubmission: false }));
    }
  };

  // Export FINTRAC-compliant XML report
  const handleExportLCTRXML = async () => {
    try {
      setIsLoading(prev => ({ ...prev, xmlExport: true }));
      const eligible = transactions.filter(txn => 
        txn.status === 'completed' && txn.requiresLCTR && !txn.reportSubmitted
      );

      if (eligible.length === 0) {
        showToast('warning', 'No completed LCTR transactions to export');
        setIsLoading(prev => ({ ...prev, xmlExport: false }));
        return;
      }

      // Generate FINTRAC-compliant XML report
      const { xml, json, csv, reportReference } = await fintracReportingService.generateLCTRReport(eligible);
      
      // Download XML file (FINTRAC primary format)
      const xmlBlob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const xmlUrl = URL.createObjectURL(xmlBlob);
      const xmlLink = document.createElement('a');
      xmlLink.href = xmlUrl;
      xmlLink.download = `FINTRAC_LCTR_${reportReference}.xml`;
      document.body.appendChild(xmlLink);
      xmlLink.click();
      document.body.removeChild(xmlLink);
      URL.revokeObjectURL(xmlUrl);
      
      // Also download JSON (FINTRAC API format)
      const jsonBlob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `FINTRAC_LCTR_${reportReference}.json`;
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      URL.revokeObjectURL(jsonUrl);
      
      showToast('success', `Exported FINTRAC XML/JSON: ${reportReference}`);
    } catch (e) {
      console.error('FINTRAC XML export failed', e);
      showToast('error', 'Failed to export FINTRAC XML report');
    } finally {
      setIsLoading(prev => ({ ...prev, xmlExport: false }));
    }
  };

  // Export CSV for internal use
  const handleExportLCTRCSV = async () => {
    try {
      setIsLoading(prev => ({ ...prev, lctrExport: true }));
      const eligible = transactions.filter(txn => 
        txn.status === 'completed' && txn.requiresLCTR && !txn.reportSubmitted
      );

      if (eligible.length === 0) {
        showToast('warning', 'No completed LCTR transactions to export');
        setIsLoading(prev => ({ ...prev, lctrExport: false }));
        return;
      }

      const { csv, reportReference } = await fintracReportingService.generateLCTRReport(eligible);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LCTR_Internal_${reportReference}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('success', `Exported CSV: ${reportReference}`);
    } catch (e) {
      console.error('LCTR CSV export failed', e);
      showToast('error', 'Failed to export LCTR CSV');
    } finally {
      setIsLoading(prev => ({ ...prev, lctrExport: false }));
    }
  };

  // Export audit records for government inspection
  const handleExportAuditRecords = async () => {
    try {
      setIsLoading(prev => ({ ...prev, auditExport: true }));
      
      // Export all submission records and document audit logs
      const auditCSV = await fintracReportingService.exportAuditRecords();
      const documentAuditCSV = await secureDocumentService.exportDocumentAuditLogs();
      
      // Combined audit export
      const combinedAudit = `# FINTRAC SUBMISSION RECORDS\n${auditCSV}\n\n# DOCUMENT AUDIT LOGS\n${documentAuditCSV}`;
      
      const blob = new Blob([combinedAudit], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `FINTRAC_Audit_Records_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('success', 'Audit records exported for government inspection');
    } catch (e) {
      console.error('Audit export failed', e);
      showToast('error', 'Failed to export audit records');
    } finally {
      setIsLoading(prev => ({ ...prev, auditExport: false }));
    }
  };

  // Dismiss notification
  const handleDismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">FINTRAC Compliance System</h2>
        <div className="flex items-center space-x-4">
          {/* Global Notifications */}
          {notifications.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Bell className="h-5 w-5 text-red-600 animate-pulse" />
              <span className="text-red-800 font-medium">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">FINTRAC Compliant</span>
          </div>
        </div>
      </div>
      
      {/* Instructional Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          FINTRAC Compliance Guide
        </h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>
            This system helps you comply with FINTRAC regulations for currency exchange transactions:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Large transactions (≥$10,000 CAD)</strong> require LCTR reporting within 15 days</li>
            <li><strong>Transactions ≥$3,000 CAD</strong> require enhanced record keeping</li>
            <li>Complete the <strong>Transaction Queue</strong> by collecting required customer information</li>
            <li>Submit <strong>LCTR Reports</strong> to FINTRAC before deadlines</li>
          </ul>
          <p className="mt-2">
            The calculator will automatically flag transactions that require compliance and direct you to this tab.
          </p>
        </div>
      </div>

      {/* Notification Details */}
      {notifications.length > 0 && (
        <div className="mt-4 space-y-2 mb-6">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-3 rounded border-l-4 ${
                notif.priority === 'urgent' 
                  ? 'bg-red-50 border-red-500 text-red-800' 
                  : 'bg-yellow-50 border-yellow-500 text-yellow-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{notif.title}</h3>
                  <p className="text-sm">{notif.message}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                    View Details
                  </button>
                  <button
                    onClick={() => handleDismissNotification(notif.id)}
                    className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold">FINTRAC Reports</h3>
            <div className="mt-2 space-y-2">
              <button
                onClick={handleExportLCTRXML}
                disabled={isLoading.xmlExport}
                className={`w-full flex items-center justify-center p-2 ${
                  isLoading.xmlExport ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
                } text-white rounded text-sm`}
              >
                {isLoading.xmlExport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-1" />
                    Export XML/JSON
                  </>
                )}
              </button>
              <button
                onClick={handleExportLCTRCSV}
                disabled={isLoading.lctrExport}
                className={`w-full flex items-center justify-center p-2 ${
                  isLoading.lctrExport ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white rounded text-sm`}
              >
                {isLoading.lctrExport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-1" />
                    Export CSV
                  </>
                )}
              </button>
              <button
                onClick={handleSubmitLCTR}
                disabled={isLoading.lctrSubmission}
                className={`w-full flex items-center justify-center p-2 ${
                  isLoading.lctrSubmission ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
                } text-white rounded text-sm`}
              >
                {isLoading.lctrSubmission ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Submit to FINTRAC
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold">Audit & Compliance</h3>
            <div className="mt-2 space-y-2">
              <button
                onClick={handleExportAuditRecords}
                disabled={isLoading.auditExport}
                className={`w-full flex items-center justify-center p-2 ${
                  isLoading.auditExport ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                } text-white rounded text-sm`}
              >
                {isLoading.auditExport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-1" />
                    Export Audit Records
                  </>
                )}
              </button>
              <div className="text-xs text-gray-500 mt-2">
                Submissions: {submissionRecords.length}<br/>
                Last: {submissionRecords[0]?.submissionDate || 'None'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">Document Security</h3>
            <p className="text-sm text-gray-600">AES-256 Encrypted Storage</p>
            <div className="mt-2 text-xs text-gray-500">
              5+ Year Retention<br/>
              FINTRAC Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Queue */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Transaction Queue</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>{transactions.filter(t => t.status === 'locked').length} locked transactions</span>
          </div>
        </div>

        <div className="space-y-4">
          {transactions.map(transaction => (
            <div
              key={transaction.id}
              className={`p-4 border rounded-lg ${
                transaction.status === 'locked' 
                  ? 'border-red-300 bg-red-50' 
                  : transaction.status === 'submitted'
                  ? 'border-green-300 bg-green-50'
                  : 'border-yellow-300 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {transaction.status === 'locked' ? (
                      <Lock className="h-5 w-5 text-red-600 mr-2" />
                    ) : transaction.status === 'submitted' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    )}
                    <span className="font-semibold">TXN-{transaction.id}</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    {transaction.fromAmount} {transaction.fromCurrency} → {transaction.toAmount} {transaction.toCurrency}
                  </div>

                  {transaction.requiresLCTR && (
                    <div className="flex items-center text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                      <span className="text-orange-700">LCTR Required</span>
                    </div>
                  )}

                  {transaction.riskRating && (
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.riskRating === 'HIGH' 
                        ? 'bg-red-100 text-red-800'
                        : transaction.riskRating === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      Risk: {transaction.riskRating} ({transaction.riskScore})
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {transaction.status === 'locked' && (
                    <>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">
                          Due in {transaction.daysUntilDeadline} days
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.lctrDeadline}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {!transaction.customerId ? (
                          <button
                            onClick={() => handleAssignCustomer(transaction)}
                            className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                            title="Assign existing customer"
                          >
                            <User className="h-4 w-4 mr-1 inline" />
                            Assign Customer
                          </button>
                        ) : (
                          <div className="text-right">
                            <div className="text-xs text-green-600">Customer Assigned</div>
                            <div className="text-xs text-gray-500">{transaction.customerId}</div>
                          </div>
                        )}

                        <button
                          onClick={() => handleCompleteCustomerInfo(transaction)}
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          <UnlockIcon className="h-4 w-4 mr-1 inline" />
                          Enter Info
                        </button>
                      </div>
                    </>
                  )}

                  {transaction.complianceStatus === 'enhanced_records' && (
                    <div className="flex space-x-2">
                      {!transaction.customerId ? (
                        <button
                          onClick={() => handleAssignCustomer(transaction)}
                          className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                        >
                          <User className="h-4 w-4 mr-1 inline" /> Assign Customer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssignCustomer(transaction)}
                          className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                        >
                          Change Customer
                        </button>
                      )}
                      <button
                        onClick={() => handleCompleteCustomerInfo(transaction)}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Complete Info
                      </button>
                    </div>
                  )}

                  {transaction.status === 'completed' && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-yellow-600">Ready for LCTR</div>
                      <div className="text-xs text-gray-500">
                        Customer ID: {transaction.customerId}
                      </div>
                    </div>
                  )}

                  {transaction.status === 'submitted' && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">Submitted</div>
                      <div className="text-xs text-green-500">
                        {transaction.reportSubmissionDate}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.reportId}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Factors Display */}
              {transaction.riskFactors && transaction.riskFactors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</div>
                  <div className="flex flex-wrap gap-2">
                    {transaction.riskFactors.map((factor: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* Customer Information Modal */}
      <Modal
        isOpen={showCustomerInfoModal}
        onClose={() => setShowCustomerInfoModal(false)}
        title="Enter Customer Information"
        size="lg"
      >
        <div className="py-4">
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <h3 className="font-medium text-blue-800 mb-1">Transaction Details</h3>
            {selectedTransaction && (
              <div className="text-sm text-blue-700">
                <p>ID: TXN-{selectedTransaction.id}</p>
                <p>Amount: {selectedTransaction.fromAmount} {selectedTransaction.fromCurrency} → {selectedTransaction.toAmount} {selectedTransaction.toCurrency}</p>
                <p>Date: {selectedTransaction.date}</p>
              </div>
            )}
          </div>

          {/* Existing Customer Loader */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex flex-col md:flex-row md:items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Load Existing Customer</label>
                <select
                  value={prefillSelectId}
                  onChange={(e) => setPrefillSelectId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select from database...</option>
                  {availableCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={loadExistingForModal}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Use This Customer
                </button>
              </div>
            </div>
            {prefillCustomer && (
              <div className="text-xs text-gray-600 mt-2">
                Loaded: {prefillCustomer.firstName} {prefillCustomer.lastName} • ID: {prefillCustomer.id}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Personal Information */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    id="firstName"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    id="lastName"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input 
                    id="dateOfBirth"
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input 
                    id="occupation"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter occupation"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input 
                    id="streetAddress"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter street address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input 
                    id="city"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <select id="province" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select Province</option>
                    <option value="AB">Alberta</option>
                    <option value="BC">British Columbia</option>
                    <option value="MB">Manitoba</option>
                    <option value="NB">New Brunswick</option>
                    <option value="NL">Newfoundland and Labrador</option>
                    <option value="NS">Nova Scotia</option>
                    <option value="ON">Ontario</option>
                    <option value="PE">Prince Edward Island</option>
                    <option value="QC">Quebec</option>
                    <option value="SK">Saskatchewan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input 
                    id="postalCode"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter postal code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input 
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value="Canada"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Identification */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                  <select id="idType" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select ID Type</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="passport">Passport</option>
                    <option value="provincial_id">Provincial ID Card</option>
                    <option value="other_government">Other Government ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                  <input 
                    id="idNumber"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ID number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo ID</label>
                  <input 
                    id="photoId"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter Photo ID reference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Expiry Date</label>
                  <input 
                    id="idExpiry"
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Transaction Details (for large transactions) */}
            {selectedTransaction && selectedTransaction.toAmount >= 10000 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Transaction Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Is this transaction being conducted on behalf of someone else?
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="actingForThirdParty"
                          value="no"
                          className="mr-2"
                          defaultChecked
                        />
                        <span>No, this is for myself</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="actingForThirdParty"
                          value="yes"
                          className="mr-2"
                        />
                        <span>Yes, for someone else</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Third Party Name</label>
                    <input 
                      id="thirdPartyName"
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Full name or organization (if acting for third party)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Third Party</label>
                    <input 
                      id="relationshipToThirdParty"
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Employee, Family member, Agent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source of Funds</label>
                    <select id="sourceOfFunds" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                      <option value="">Select source</option>
                      <option value="employment">Employment Income</option>
                      <option value="business">Business Income</option>
                      <option value="investment">Investment Income</option>
                      <option value="sale_of_asset">Sale of Asset</option>
                      <option value="gift">Gift</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setShowCustomerInfoModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitCustomerInfo}
              disabled={isLoading.customerInfo}
              className={`px-4 py-2 ${isLoading.customerInfo ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded flex items-center justify-center`}
            >
              {isLoading.customerInfo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Submit Information'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Customer Assignment Modal */}
      <Modal
        isOpen={showCustomerAssignModal}
        onClose={() => setShowCustomerAssignModal(false)}
        title="Assign Customer to Transaction"
        size="md"
      >
        <div className="py-4">
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <h3 className="font-medium text-blue-800 mb-1">Transaction Details</h3>
            {selectedTransaction && (
              <div className="text-sm text-blue-700">
                <p>ID: TXN-{selectedTransaction.id}</p>
                <p>Amount: {selectedTransaction.fromAmount} {selectedTransaction.fromCurrency} → {selectedTransaction.toAmount} {selectedTransaction.toCurrency}</p>
                <p>Date: {selectedTransaction.date}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select Customer --</option>
                {availableCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} {customer.email ? `(${customer.email})` : ''}
                  </option>
                ))}
              </select>
              {availableCustomers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No customers available. Please add customers in the Client Management section first.
                </p>
              )}
            </div>
            
            {selectedCustomerId && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Selected Customer Preview:</h4>
                {(() => {
                  const customer = availableCustomers.find(c => c.id === selectedCustomerId);
                  return customer ? (
                    <div className="text-sm text-gray-600">
                      <p><strong>Name:</strong> {customer.firstName} {customer.lastName}</p>
                      <p><strong>Email:</strong> {customer.email || 'Not provided'}</p>
                      <p><strong>Phone:</strong> {customer.phone || 'Not provided'}</p>
                      <p><strong>City:</strong> {customer.city || 'Not provided'}</p>
                      {customer.riskRating && (
                        <p>
                          <strong>Risk Rating:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            customer.riskRating === 'HIGH' ? 'bg-red-100 text-red-800' :
                            customer.riskRating === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {customer.riskRating}
                          </span>
                        </p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              onClick={() => {
                setShowCustomerAssignModal(false);
                setSelectedCustomerId('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isLoading.customerAssignment}
            >
              Cancel
            </button>
            <button
              onClick={handleCustomerAssignment}
              disabled={!selectedCustomerId || isLoading.customerAssignment}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                !selectedCustomerId || isLoading.customerAssignment
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isLoading.customerAssignment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Assigning...
                </>
              ) : (
                'Assign Customer'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Customer Information Added"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Customer information has been successfully added and risk assessment completed.
          </p>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Continue
          </button>
        </div>
      </Modal>

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};

export default FintracCompliance;