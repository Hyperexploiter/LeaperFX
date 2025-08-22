import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Toast } from '../../components/Modal';
import webSocketService from '../../services/webSocketService';
import riskAssessmentService from '../../services/riskAssessmentService';
import { Transaction } from '../../services/transactionService';
import { MoreVertical, Printer, Search as SearchIcon, Mail } from 'lucide-react';

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface TransactionWithRisk {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  commission?: number;
  profit?: number;
  status?: string;
  customerId?: string;
  complianceStatus?: 'none' | 'enhanced_records' | 'lctr_required' | 'completed';
  riskRating?: 'low' | 'medium' | 'high' | 'critical';
  riskScore?: number;
  requiresLCTR?: boolean;
  requiresEnhancedRecords?: boolean;
  [key: string]: any; // Allow additional properties for flexibility
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [riskAssessments, setRiskAssessments] = useState<Array<{ id: string; customerId: string; riskRating: string; riskScore: number }>>([]);

  // Customer assignment states
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showCustomerAssignModal, setShowCustomerAssignModal] = useState<boolean>(false);
  const [isAssigningCustomer, setIsAssigningCustomer] = useState<boolean>(false);

  // Row actions menu state
  const [openMenuTxnId, setOpenMenuTxnId] = useState<string | null>(null);

  // Email receipt states
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [selectedTxForEmail, setSelectedTxForEmail] = useState<any>(null);
  const [showEmailSavePrompt, setShowEmailSavePrompt] = useState<boolean>(false);
  const [emailToSaveToCustomer, setEmailToSaveToCustomer] = useState<string>('');
  const [customerIdToUpdate, setCustomerIdToUpdate] = useState<string>('');

  // Filter bar state
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');
  const [quickRange, setQuickRange] = useState<'24h' | '7d' | 'month' | ''>('');

  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    visible: boolean;
  }>({ type: 'success', message: '', visible: false });

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message, visible: true });
  };

  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  // Load risk assessments
  useEffect(() => {
    const loadRiskAssessments = async () => {
      try {
        const assessments = await riskAssessmentService.getRiskAssessments();
        setRiskAssessments(assessments || []);
      } catch (err) {
        console.error('Error loading risk assessments:', err);
        setRiskAssessments([]);
      }
    };

    void loadRiskAssessments();
  }, []);

  // Enhanced transaction data with risk information
  const transactionsWithRisk = useMemo(() => {
    return transactions.map(tx => {
      let riskRating: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let riskScore = 0;

      // Check for existing risk score from transaction service
      if (tx.riskScore) {
        riskScore = tx.riskScore;
        if (riskScore >= 85) riskRating = 'critical';
        else if (riskScore >= 70) riskRating = 'high';
        else if (riskScore >= 50) riskRating = 'medium';
        else riskRating = 'low';
      } else if (tx.customerId) {
        // Check customer risk assessments
        const customerAssessment = riskAssessments.find(ra => ra.customerId === tx.customerId);
        if (customerAssessment) {
          // Type guard to ensure riskRating matches expected type
          const validRiskRating = customerAssessment.riskRating;
          if (['low', 'medium', 'high', 'critical'].includes(validRiskRating)) {
            riskRating = validRiskRating as 'low' | 'medium' | 'high' | 'critical';
          } else {
            riskRating = 'medium'; // Default fallback
          }
          riskScore = customerAssessment.riskScore;
        }
      }

      // Additional risk factors based on transaction amount and compliance status
      if (tx.complianceStatus === 'lctr_required') {
        riskScore = Math.max(riskScore, 70); // LCTR required = at least high risk
        riskRating = riskScore >= 85 ? 'critical' : 'high';
      } else if (tx.complianceStatus === 'enhanced_records') {
        riskScore = Math.max(riskScore, 50); // Enhanced records = at least medium risk
        riskRating = riskScore >= 70 ? 'high' : 'medium';
      }

      return {
        ...tx,
        riskRating,
        riskScore
      };
    });
  }, [transactions, riskAssessments]);

  // Sorting function
  // Apply filters
  const filteredTransactions = useMemo(() => {
    const nameMatches = (tx: any) => {
      if (!filterSearch.trim()) return true;
      const text = filterSearch.toLowerCase();
      const customer = customers.find(c => c.id === tx.customerId);
      const hay = [
        tx.fromCurrency, tx.toCurrency,
        customer?.firstName, customer?.lastName, customer?.email, customer?.phone
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(text);
    };

    const dateMatches = (tx: any) => {
      if (!filterDateFrom && !filterDateTo && !quickRange) return true;
      const txDate = new Date(tx.date.replace(' ', 'T'));
      let from = filterDateFrom ? new Date(filterDateFrom) : null;
      let to = filterDateTo ? new Date(filterDateTo) : null;
      if (quickRange) {
        const now = new Date();
        if (quickRange === '24h') from = new Date(now.getTime() - 24*60*60*1000);
        if (quickRange === '7d') from = new Date(now.getTime() - 7*24*60*60*1000);
        if (quickRange === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
      }
      if (from && txDate < from) return false;
      if (to && txDate > to) return false;
      return true;
    };

    const amountMatches = (tx: any) => {
      const min = filterAmountMin ? parseFloat(filterAmountMin) : null;
      const max = filterAmountMax ? parseFloat(filterAmountMax) : null;
      if (min !== null && tx.fromAmount < min) return false;
      if (max !== null && tx.fromAmount > max) return false;
      return true;
    };

    return transactionsWithRisk.filter(tx => nameMatches(tx) && dateMatches(tx) && amountMatches(tx));
  }, [transactionsWithRisk, customers, filterSearch, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, quickRange]);

  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return filteredTransactions;

    return [...filteredTransactions].sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key!);
      const bValue = getSortValue(b, sortConfig.key!);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let result = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        result = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        result = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        result = aValue.getTime() - bValue.getTime();
      } else {
        result = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'desc' ? -result : result;
    });
  }, [transactionsWithRisk, sortConfig]);

  // Get sort value based on key
  const getSortValue = (transaction: TransactionWithRisk, key: string) => {
    switch (key) {
      case 'date':
        return new Date(transaction.date);
      case 'amount':
        return transaction.fromAmount;
      case 'customer':
        return getCustomerName(transaction.customerId || '');
      case 'commission':
        return transaction.commission || 0;
      case 'profit':
        return transaction.profit || 0;
      case 'risk':
        const riskValues = { low: 1, medium: 2, high: 3, critical: 4 };
        return riskValues[transaction.riskRating || 'low'];
      default:
        return transaction[key];
    }
  };

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // If same key, toggle direction
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New key, start with desc for numerical fields, asc for text
        const numericFields = ['amount', 'commission', 'profit', 'risk'];
        return {
          key,
          direction: numericFields.includes(key) ? 'desc' : 'asc'
        };
      }
    });
  };

  // Clear sort
  const clearSort = () => {
    setSortConfig({ key: null, direction: 'asc' });
  };

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400 opacity-50" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    }

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  // Render risk badge
  const renderRiskBadge = (riskRating: 'low' | 'medium' | 'high' | 'critical') => {
    const badgeClasses = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeClasses[riskRating]}`}>
        {riskRating.toUpperCase()}
      </span>
    );
  };

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const { default: customerService } = await import('../../services/customerService');
        const customerData = await customerService.getAllCustomers();
        setCustomers(customerData || []);
      } catch (err) {
        console.error('Error loading customers:', err);
        setCustomers([]);
      }
    };

    void loadCustomers();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { default: transactionService } = await import('../../services/transactionService');
        const transactionData = await transactionService.getTransactions();
        setTransactions(transactionData || []);
      } catch (err) {
        setError('Failed to fetch transaction data');
        console.error('Transaction fetch error:', err);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchTransactions, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAssignCustomer = (transaction: any) => {
    setSelectedTransaction(transaction);
    setSelectedCustomerId('');
    setShowCustomerAssignModal(true);
  };

  const handleCustomerAssignment = async () => {
    if (!selectedTransaction || !selectedCustomerId) {
      showToast('error', 'Please select a customer');
      return;
    }

    try {
      setIsAssigningCustomer(true);
      const { default: transactionService } = await import('../../services/transactionService');
      const updatedTransaction = await transactionService.linkCustomerToTransaction(
        selectedTransaction.id,
        selectedCustomerId
      );

      if (updatedTransaction) {
        setTransactions(prev =>
          prev.map(txn => (txn.id === selectedTransaction.id ? updatedTransaction as Transaction : txn))
        );

        const customer = customers.find(c => c.id === selectedCustomerId);
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
    } catch (error: any) {
      console.error('Error assigning customer:', error);
      showToast('error', error?.message || 'Failed to assign customer');
    } finally {
      setIsAssigningCustomer(false);
    }
  };

  const getCustomerName = (customerId: string | undefined) => {
    if (!customerId) return 'No Customer';
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer';
  };

  const toggleMenu = (transactionId: string) => {
    setOpenMenuTxnId(prev => (prev === transactionId ? null : transactionId));
  };

  const printReceipt = (tx: any) => {
    try {
      const w = window.open('', 'PRINT', 'height=700,width=480');
      if (!w) return;
      const html = generateReceiptHTML(tx).replace('</body></html>', '<script>window.addEventListener(\'load\',()=>{setTimeout(()=>{window.print();window.close();},150);});</script></body></html>');
      
      if (w.document) {
        w.document.open();
        w.document.write(html);
        w.document.close();
      }
      w.focus();
      try {
        webSocketService.send({
          type: 'transaction_receipt_generated',
          data: {
            transactionId: tx.id,
            fromAmount: tx.fromAmount,
            fromCurrency: tx.fromCurrency,
            toAmount: tx.toAmount,
            toCurrency: tx.toCurrency,
            printedAt: new Date().toISOString()
          }
        });
      } catch (err) {
        console.warn('WS emit failed for receipt:', err);
      }
    } catch (e) {
      console.error('Print failed', e);
      showToast('error', 'Failed to print receipt');
    }
  };

  const generateReceiptHTML = (tx: any) => {
    const owner = JSON.parse(localStorage.getItem('ownerSettings') || '{}');
    const businessName = owner.businessName || 'Leaper FX';
    const customerName = getCustomerName(tx.customerId);
    const rate = tx.fromAmount > 0 ? (tx.toAmount / tx.fromAmount) : 0;
    const type = `${tx.fromCurrency}→${tx.toCurrency}`;
    
    return `<!doctype html><html><head><title>Receipt ${tx.id}</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto; padding:16px;color:#111}
        .hdr{font-weight:700;font-size:18px;margin-bottom:8px}
        .sub{color:#555;margin-bottom:16px}
        .row{display:flex;justify-content:space-between;margin:6px 0}
        .muted{color:#666}
        .total{font-weight:700}
        hr{border:none;border-top:1px solid #e5e7eb;margin:12px 0}
        .center{text-align:center}
      </style>
    </head><body>
      <div class="hdr">${businessName}</div>
      <div class="sub">Receipt • TXN-${tx.id}</div>
      <div class="row"><div>Date/Time</div><div>${tx.date}</div></div>
      <div class="row"><div>Customer</div><div>${customerName}</div></div>
      <div class="row"><div>Type</div><div>${type}</div></div>
      <hr/>
      <div class="row"><div>From</div><div>${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}</div></div>
      <div class="row"><div>To</div><div>${tx.toAmount.toLocaleString()} ${tx.toCurrency}</div></div>
      <div class="row"><div>Rate</div><div>${rate.toFixed(6)}</div></div>
      <div class="row"><div class="muted">Commission</div><div class="muted">$${(tx.commission ?? 0).toFixed(2)}</div></div>
      <hr/>
      <div class="row total"><div>Total</div><div>${tx.toAmount.toLocaleString()} ${tx.toCurrency}</div></div>
      <div class="center muted" style="margin-top:16px">Thank you</div>
    </body></html>`;
  };

  // Check if transaction requires FINTRAC compliance for email workflow
  const checkFintracThreshold = (amount: number, currency: string): boolean => {
    let cadAmount = amount;
    if (currency !== 'CAD') {
      const exchangeRates: { [key: string]: number } = {
        'USD': 1.35, 'EUR': 1.45, 'GBP': 1.70, 'JPY': 0.009, 'AUD': 0.95, 'CHF': 1.47
      };
      cadAmount = amount * (exchangeRates[currency] || 1);
    }
    return cadAmount >= 3000; // $3,000 CAD threshold for enhanced records
  };

  const handleEmailReceipt = async (tx: any) => {
    setSelectedTxForEmail(tx);
    setCustomEmail('');
    
    // Check if transaction has customer with email
    if (tx.customerId) {
      const customer = customers.find(c => c.id === tx.customerId);
      if (customer?.email) {
        setEmailRecipient(customer.email);
        setShowEmailModal(true);
        return;
      }
    }
    
    // Check FINTRAC threshold
    const requiresCompliance = checkFintracThreshold(tx.fromAmount, tx.fromCurrency);
    
    if (!tx.customerId && requiresCompliance) {
      // Force customer creation for high-value transactions
      showToast('warning', 'High-value transactions require customer profile. Please assign a customer first.');
      handleAssignCustomer(tx);
      return;
    }
    
    // Show email modal for manual entry
    setEmailRecipient('');
    setShowEmailModal(true);
  };

  const sendEmailReceipt = async () => {
    if (!selectedTxForEmail) return;
    
    const emailToSend = emailRecipient || customEmail;
    if (!emailToSend || !emailToSend.includes('@')) {
      showToast('error', 'Please enter a valid email address');
      return;
    }
    
    setIsSendingEmail(true);
    
    try {
      // Import email service
      const { default: emailService } = await import('../../services/emailService');
      
      // Generate receipt HTML for email
      const receiptHTML = generateReceiptHTML(selectedTxForEmail);
      const owner = JSON.parse(localStorage.getItem('ownerSettings') || '{}');
      const businessName = owner.businessName || 'Leaper FX';
      
      // Send email using real email service
      const result = await emailService.sendTransactionReceipt(
        emailToSend,
        receiptHTML,
        selectedTxForEmail.id,
        businessName
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }
      
      // Log email action
      try {
        webSocketService.send({
          type: 'transaction_receipt_emailed',
          data: {
            transactionId: selectedTxForEmail.id,
            recipientEmail: emailToSend,
            messageId: result.messageId,
            sentAt: new Date().toISOString()
          }
        });
      } catch (err) {
        console.warn('WS emit failed for email receipt:', err);
      }
      
      // Check if we should save email to customer profile
      if (selectedTxForEmail.customerId && customEmail && !emailRecipient) {
        const customer = customers.find(c => c.id === selectedTxForEmail.customerId);
        if (customer && !customer.email) {
          setEmailToSaveToCustomer(customEmail);
          setCustomerIdToUpdate(selectedTxForEmail.customerId);
          setShowEmailSavePrompt(true);
        }
      }
      
      showToast('success', `📧 Receipt sent to ${emailToSend} (ID: ${result.messageId?.slice(-8)})`);
      setShowEmailModal(false);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      showToast('error', `Failed to send receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const saveEmailToCustomer = async () => {
    try {
      const { default: customerService } = await import('../../services/customerService');
      await customerService.updateCustomer(customerIdToUpdate, { email: emailToSaveToCustomer });
      
      // Update local customer state
      setCustomers(prev => prev.map(c => 
        c.id === customerIdToUpdate ? { ...c, email: emailToSaveToCustomer } : c
      ));
      
      showToast('success', 'Email saved to customer profile');
      setShowEmailSavePrompt(false);
    } catch (error) {
      console.error('Failed to save email to customer:', error);
      showToast('error', 'Failed to save email to customer profile');
    }
  };

  const testEmailService = async () => {
    try {
      const { default: emailService } = await import('../../services/emailService');
      showToast('info', 'Sending test email...');
      
      const result = await emailService.sendTestEmail('yourpersonalizednew@yahoo.com');
      
      if (result.success) {
        showToast('success', `✅ Test email sent successfully! Check yourpersonalizednew@yahoo.com`);
      } else {
        showToast('error', `❌ Test email failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Email test failed:', error);
      showToast('error', 'Email service test failed');
    }
  };

  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        await webSocketService.connect();
        const unsubscribe = webSocketService.subscribe(event => {
          if (event.type === 'transaction_created' || event.type === 'transaction_updated') {
            const refresh = async () => {
              try {
                const { default: transactionService } = await import('../../services/transactionService');
                const transactionData = await transactionService.getTransactions();
                setTransactions(transactionData || []);
              } catch (err) {
                console.error('Failed to refresh transactions:', err);
              }
            };
            void refresh();
          }
        });
        return () => {
          unsubscribe();
          webSocketService.disconnect();
        };
      } catch (err) {
        console.error('Failed to set up WebSocket:', err);
      }
    };

    void setupWebSocket();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={testEmailService}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            title="Test email service"
          >
            📧 Test Email
          </button>
          {sortConfig.key && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Sorted by: {sortConfig.key} ({sortConfig.direction})
              </span>
              <button
                onClick={clearSort}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear Sort
              </button>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading transactions...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <div className="relative">
              <SearchIcon className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
              <input
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                placeholder="Name, email, phone, currency..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setQuickRange('24h')} className={`px-3 py-2 text-xs rounded border ${quickRange==='24h'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>24h</button>
            <button onClick={() => setQuickRange('7d')} className={`px-3 py-2 text-xs rounded border ${quickRange==='7d'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>7d</button>
            <button onClick={() => setQuickRange('month')} className={`px-3 py-2 text-xs rounded border ${quickRange==='month'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Month</button>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount Min</label>
            <input type="number" value={filterAmountMin} onChange={e=>setFilterAmountMin(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount Max</label>
            <input type="number" value={filterAmountMax} onChange={e=>setFilterAmountMax(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="flex space-x-2">
            <button onClick={() => {setFilterSearch(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterAmountMin(''); setFilterAmountMax(''); setQuickRange('');}} className="px-3 py-2 text-xs rounded border border-gray-300">Clear</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading && transactions.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="mt-2">Use the Smart Calculator to create new transactions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      {renderSortIcon('date')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount
                      {renderSortIcon('amount')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Converted</th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('customer')}
                  >
                    <div className="flex items-center">
                      Customer
                      {renderSortIcon('customer')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('commission')}
                  >
                    <div className="flex items-center">
                      Commission
                      {renderSortIcon('commission')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('profit')}
                  >
                    <div className="flex items-center">
                      Profit
                      {renderSortIcon('profit')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('risk')}
                  >
                    <div className="flex items-center">
                      FINTRAC Risk
                      {renderSortIcon('risk')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tx.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tx.fromCurrency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tx.toCurrency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tx.fromAmount.toLocaleString()} {tx.fromCurrency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tx.toAmount.toLocaleString()} {tx.toCurrency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          tx.customerId ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getCustomerName(tx.customerId)}
                        </span>
                        {tx.requiresLCTR || tx.complianceStatus === 'lctr_required' ? (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">LCTR required</span>
                        ) : tx.requiresEnhancedRecords || tx.complianceStatus === 'enhanced_records' ? (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Enhanced records</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${tx.commission?.toFixed(2) ?? '0.00'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${tx.profit?.toFixed(2) ?? '0.00'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        {renderRiskBadge(tx.riskRating!)}
                        {tx.riskScore && tx.riskScore > 0 && (
                          <div className="text-xs text-gray-500">
                            Score: {tx.riskScore}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAssignCustomer(tx)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          {tx.customerId ? 'Change Customer' : 'Assign Customer'}
                        </button>
                        <button
                          onClick={() => toggleMenu(tx.id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                          title="More actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuTxnId === tx.id && (
                          <div className="absolute right-6 top-10 z-10 bg-white border rounded shadow-md w-48">
                            <button
                              onClick={() => { printReceipt(tx); setOpenMenuTxnId(null); }}
                              className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <Printer className="h-4 w-4 mr-2" /> Print receipt
                            </button>
                            <button
                              onClick={() => { handleEmailReceipt(tx); setOpenMenuTxnId(null); }}
                              className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <Mail className="h-4 w-4 mr-2" /> Email receipt
                            </button>
                            <button
                              onClick={() => { handleAssignCustomer(tx); setOpenMenuTxnId(null); }}
                              className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              Assign to client
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Customer Modal */}
      <Modal isOpen={showCustomerAssignModal} onClose={() => setShowCustomerAssignModal(false)} title="Assign Customer" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowCustomerAssignModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomerAssignment}
              disabled={!selectedCustomerId || isAssigningCustomer}
              className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                !selectedCustomerId || isAssigningCustomer
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAssigningCustomer ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Assigning...
                </div>
              ) : (
                'Assign Customer'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Email Receipt Modal */}
      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Email Receipt" size="md">
        <div className="space-y-4">
          {selectedTxForEmail && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                Transaction: {selectedTxForEmail.fromAmount.toLocaleString()} {selectedTxForEmail.fromCurrency} → {selectedTxForEmail.toAmount.toLocaleString()} {selectedTxForEmail.toCurrency}
              </p>
              <p className="text-sm text-gray-600">
                Customer: {getCustomerName(selectedTxForEmail.customerId)}
              </p>
            </div>
          )}
          
          {emailRecipient ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send receipt to:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={emailRecipient}
                  disabled
                  className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={() => setEmailRecipient('')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address:</label>
              <input
                type="email"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={sendEmailReceipt}
              disabled={(!emailRecipient && !customEmail) || isSendingEmail}
              className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                (!emailRecipient && !customEmail) || isSendingEmail
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSendingEmail ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </div>
              ) : (
                'Send Receipt'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Save Email to Customer Prompt */}
      <Modal isOpen={showEmailSavePrompt} onClose={() => setShowEmailSavePrompt(false)} title="Save Email" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Would you like to save this email address ({emailToSaveToCustomer}) to the customer's profile for future use?
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowEmailSavePrompt(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              No, thanks
            </button>
            <button
              onClick={saveEmailToCustomer}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Yes, save email
            </button>
          </div>
        </div>
      </Modal>

      <Toast type={toast.type} message={toast.message} isVisible={toast.visible} onClose={hideToast} />
    </div>
  );
};

export default TransactionHistory;
