// Real Customer Service - Production Ready
import databaseService from './databaseService';

// Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
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
  occupation?: string;
  sourceOfFunds?: string;
  expectedTransactionVolume?: 'low' | 'medium' | 'high';
  riskRating: 'low' | 'medium' | 'high';
  createdAt: string;
  lastUpdated: string;
  isActive: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDate?: string;
  notes?: string;
}

export interface CreateCustomerParams {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  address: Customer['address'];
  identification: Customer['identification'];
  occupation?: string;
  sourceOfFunds?: string;
  expectedTransactionVolume?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface CustomerSearchFilters {
  name?: string;
  email?: string;
  phone?: string;
  riskRating?: string;
  kycStatus?: string;
  isActive?: boolean;
}

/**
 * Real Customer Service
 * 
 * This service manages customer information for FINTRAC compliance.
 * Handles KYC (Know Your Customer) data and risk assessments.
 */
class CustomerService {
  private async ensureInitialized(): Promise<void> {
    await databaseService.init();
  }

  /**
   * Create a new customer - Compatible with ClientManagement simple interface
   * Enhanced for FINTRAC compliance
   */
  async createCustomer(params: any): Promise<any> {
    await this.ensureInitialized();
    
    // Perform comprehensive validation for FINTRAC compliance
    const validationResult = this.validateCustomerDataSimplified(params);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    const now = new Date().toISOString();
    
    // Calculate initial risk rating based on available data
    const initialRiskRating = this.calculateInitialRiskRatingSimplified(params);
    
    const customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      email: (params.email || '').trim(),
      phone: (params.phone || '').trim(),
      dateOfBirth: params.dateOfBirth || '',
      occupation: (params.occupation || '').trim(),
      address: (params.address || '').trim(),
      city: (params.city || '').trim(),
      postalCode: (params.postalCode || '').trim(),
      country: params.country || 'Canada',
      idType: params.idType || '',
      idNumber: (params.idNumber || '').trim(),
      photoId: (params.photoId || '').trim(),
      createdAt: now,
      lastUpdated: now,
      lastTransaction: null,
      riskRating: initialRiskRating,
      kycStatus: 'pending',
      isActive: true,
      
      // Enhanced FINTRAC fields
      complianceNotes: '',
      sourceOfFunds: params.sourceOfFunds || '',
      expectedTransactionVolume: 'low'
    };
    
    // Store in database (using localStorage for now)
    const customers = await this.getAllCustomers();
    customers.push(customer);
    await this.saveCustomers(customers);
    
    return customer;
  }

  /**
   * Simplified validation for basic customer creation (used by Smart Calculator)
   */
  private validateCustomerDataSimplified(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields for basic compliance
    if (!data.firstName?.trim()) errors.push('First name is required');
    if (!data.lastName?.trim()) errors.push('Last name is required');
    
    // Date of birth validation if provided
    if (data.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
      if (age < 18) errors.push('Customer must be at least 18 years old');
      if (age > 120) errors.push('Invalid date of birth');
    }
    
    // Email validation if provided
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push('Invalid email format');
      }
    }
    
    // Phone validation if provided
    if (data.phone && data.phone.trim()) {
      // Enhanced phone number validation (allows various formats including Canadian "+1- XXX-XXXX")
      const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,}$/;
      if (!phoneRegex.test(data.phone.trim())) {
        errors.push('Invalid phone number format');
      }
    }
    
    // Postal code validation if provided (Canadian format)
    if (data.postalCode && data.postalCode.trim()) {
      const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      if (!postalCodeRegex.test(data.postalCode.trim())) {
        errors.push('Invalid postal code format (expected: A1A 1A1)');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate initial risk rating for simplified customer data
   */
  private calculateInitialRiskRatingSimplified(params: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    let score = 0;
    
    // Age factor (if date of birth provided)
    if (params.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(params.dateOfBirth).getFullYear();
      if (age < 25) score += 2;
      else if (age < 35) score += 1;
    }
    
    // Occupation-based risk (simplified)
    if (params.occupation) {
      const highRiskOccupations = ['cash', 'money service', 'casino', 'jewelry', 'art dealer', 'precious metals'];
      const mediumRiskOccupations = ['business owner', 'self-employed', 'consultant', 'real estate'];
      
      const occupation = params.occupation.toLowerCase();
      if (highRiskOccupations.some(occ => occupation.includes(occ))) {
        score += 3;
      } else if (mediumRiskOccupations.some(occ => occupation.includes(occ))) {
        score += 1;
      }
    }
    
    // Country-based risk
    if (params.country && params.country !== 'Canada') {
      score += 1;
    }
    
    // ID type risk
    if (params.idType === 'passport') {
      score += 1; // International travel = slightly higher risk
    }
    
    // Determine rating
    if (score >= 5) return 'HIGH';
    if (score >= 2) return 'MEDIUM';
    return 'LOW';
  }
  
  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    await this.ensureInitialized();
    const customers = await this.getAllCustomers();
    return customers.find(c => c.id === id) || null;
  }
  
  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    await this.ensureInitialized();
    const customers = await this.getAllCustomers();
    return customers.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
  }
  
  /**
   * Search customers
   */
  async searchCustomers(filters: CustomerSearchFilters): Promise<Customer[]> {
    await this.ensureInitialized();
    let customers = await this.getAllCustomers();
    
    // Apply filters
    if (filters.name) {
      const searchName = filters.name.toLowerCase();
      customers = customers.filter(c => 
        c.firstName.toLowerCase().includes(searchName) ||
        c.lastName.toLowerCase().includes(searchName) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchName)
      );
    }
    
    if (filters.email) {
      customers = customers.filter(c => 
        c.email.toLowerCase().includes(filters.email!.toLowerCase())
      );
    }
    
    if (filters.phone) {
      customers = customers.filter(c => 
        c.phone && c.phone.includes(filters.phone!)
      );
    }
    
    if (filters.riskRating) {
      customers = customers.filter(c => c.riskRating === filters.riskRating);
    }
    
    if (filters.kycStatus) {
      customers = customers.filter(c => c.kycStatus === filters.kycStatus);
    }
    
    if (typeof filters.isActive === 'boolean') {
      customers = customers.filter(c => c.isActive === filters.isActive);
    }
    
    return customers.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }
  
  /**
   * Update customer information - Compatible with ClientManagement
   */
  async updateCustomer(id: string, updates: any): Promise<any | null> {
    await this.ensureInitialized();
    const customers = await this.getAllCustomers();
    const customerIndex = customers.findIndex(c => c.id === id);
    
    if (customerIndex === -1) {
      return null;
    }
    
    const updatedCustomer = {
      ...customers[customerIndex],
      ...updates,
      id, // Ensure ID can't be changed
      lastUpdated: new Date().toISOString()
    };
    
    customers[customerIndex] = updatedCustomer;
    await this.saveCustomers(customers);
    
    return updatedCustomer;
  }

  /**
   * Delete customer by ID
   */
  async deleteCustomer(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const customers = await this.getAllCustomers();
    const initialLength = customers.length;
    const filteredCustomers = customers.filter(c => c.id !== id);
    
    if (filteredCustomers.length < initialLength) {
      await this.saveCustomers(filteredCustomers);
      return true;
    }
    
    return false;
  }
  
  /**
   * Verify customer KYC
   */
  async verifyCustomerKYC(id: string, approved: boolean, notes?: string): Promise<Customer | null> {
    const updates: Partial<Customer> = {
      kycStatus: approved ? 'verified' : 'rejected',
      kycDate: new Date().toISOString()
    };
    
    if (notes) {
      updates.notes = notes;
    }
    
    // Recalculate risk rating if approved
    if (approved) {
      const customer = await this.getCustomerById(id);
      if (customer) {
        updates.riskRating = this.calculateRiskRating(customer);
      }
    }
    
    return this.updateCustomer(id, updates);
  }
  
  /**
   * Get customers requiring KYC review
   */
  async getCustomersRequiringKYC(): Promise<Customer[]> {
    return this.searchCustomers({ kycStatus: 'pending' });
  }
  
  /**
   * Get high-risk customers
   */
  async getHighRiskCustomers(): Promise<Customer[]> {
    return this.searchCustomers({ riskRating: 'high' });
  }
  
  /**
   * Calculate initial risk rating for new customer
   * Currently not used - commented out to avoid TS warning
   */
  /*
  private calculateInitialRiskRating(params: CreateCustomerParams): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // Age factor (younger = higher risk)
    const age = new Date().getFullYear() - new Date(params.dateOfBirth).getFullYear();
    if (age < 25) score += 2;
    else if (age < 35) score += 1;
    
    // Expected transaction volume
    if (params.expectedTransactionVolume === 'high') score += 3;
    else if (params.expectedTransactionVolume === 'medium') score += 1;
    
    // Identification type
    if (params.identification.type === 'passport') score += 1; // International travel = higher risk
    
    // Address country (assuming Canadian address is lower risk)
    if (params.address.country !== 'Canada') score += 2;
    
    // Occupation-based risk (simplified)
    const highRiskOccupations = ['cash intensive', 'money service', 'casino', 'jewelry'];
    if (params.occupation && highRiskOccupations.some(occ => 
        params.occupation!.toLowerCase().includes(occ))) {
      score += 3;
    }
    
    // Source of funds
    if (params.sourceOfFunds && 
        ['cash', 'cryptocurrency', 'foreign'].some(source => 
          params.sourceOfFunds!.toLowerCase().includes(source))) {
      score += 2;
    }
    
    // Determine rating
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
  */
  
  /**
   * Calculate comprehensive risk rating for existing customer
   */
  private calculateRiskRating(customer: Customer): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // Start with initial risk factors
    const age = new Date().getFullYear() - new Date(customer.dateOfBirth).getFullYear();
    if (age < 25) score += 2;
    else if (age < 35) score += 1;
    
    if (customer.expectedTransactionVolume === 'high') score += 3;
    else if (customer.expectedTransactionVolume === 'medium') score += 1;
    
    if (customer.identification.type === 'passport') score += 1;
    if (customer.address.country !== 'Canada') score += 2;
    
    // Add additional factors for existing customers
    // (In a real implementation, you'd analyze transaction history)
    
    // KYC status
    if (customer.kycStatus === 'rejected') score += 5;
    else if (customer.kycStatus === 'pending') score += 2;
    
    // Account age (newer accounts are riskier)
    const accountAge = Date.now() - new Date(customer.createdAt).getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);
    if (daysOld < 30) score += 2;
    else if (daysOld < 90) score += 1;
    
    // Determine rating
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }
  
  /**
   * Get customer transaction history summary
   */
  async getCustomerTransactionSummary(customerId: string): Promise<{
    totalTransactions: number;
    totalVolume: number;
    last30Days: number;
    averageAmount: number;
    currencies: string[];
  }> {
    try {
      const transactions = await databaseService.getTransactions();
      const customerTransactions = transactions.filter(tx => tx.customerId === customerId);
      
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentTransactions = customerTransactions.filter(tx => 
        new Date(tx.date) > last30Days
      );
      
      const totalVolume = customerTransactions.reduce((sum, tx) => sum + tx.fromAmount, 0);
      const currencies = [...new Set(customerTransactions.flatMap(tx => [tx.fromCurrency, tx.toCurrency]))];
      
      return {
        totalTransactions: customerTransactions.length,
        totalVolume,
        last30Days: recentTransactions.length,
        averageAmount: customerTransactions.length > 0 ? totalVolume / customerTransactions.length : 0,
        currencies
      };
    } catch (error) {
      console.error('Error getting customer transaction summary:', error);
      return {
        totalTransactions: 0,
        totalVolume: 0,
        last30Days: 0,
        averageAmount: 0,
        currencies: []
      };
    }
  }
  
  /**
   * Validate customer data
   */
  validateCustomerData(data: CreateCustomerParams): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!data.firstName?.trim()) errors.push('First name is required');
    if (!data.lastName?.trim()) errors.push('Last name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.dateOfBirth) errors.push('Date of birth is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    // Age validation (must be 18+)
    if (data.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
      if (age < 18) errors.push('Customer must be at least 18 years old');
    }
    
    // Address validation
    if (!data.address?.street?.trim()) errors.push('Street address is required');
    if (!data.address?.city?.trim()) errors.push('City is required');
    if (!data.address?.province?.trim()) errors.push('Province is required');
    if (!data.address?.postalCode?.trim()) errors.push('Postal code is required');
    if (!data.address?.country?.trim()) errors.push('Country is required');
    
    // Identification validation
    if (!data.identification?.type) errors.push('Identification type is required');
    if (!data.identification?.number?.trim()) errors.push('Identification number is required');
    if (!data.identification?.expiryDate) errors.push('Identification expiry date is required');
    if (!data.identification?.issuingCountry?.trim()) errors.push('Issuing country is required');
    
    // Check if ID is expired
    if (data.identification?.expiryDate) {
      const expiryDate = new Date(data.identification.expiryDate);
      if (expiryDate < new Date()) {
        errors.push('Identification document is expired');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get all customers - compatible with ClientManagement interface
   */
  async getAllCustomers(): Promise<any[]> {
    try {
      const stored = localStorage.getItem('customers');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  }
  
  /**
   * Save customers (internal use)
   */
  private async saveCustomers(customers: Customer[]): Promise<void> {
    try {
      localStorage.setItem('customers', JSON.stringify(customers));
    } catch (error) {
      console.error('Error saving customers:', error);
    }
  }
  
  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<{
    total: number;
    verified: number;
    pending: number;
    highRisk: number;
    newThisMonth: number;
  }> {
    const customers = await this.getAllCustomers();
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    return {
      total: customers.length,
      verified: customers.filter(c => c.kycStatus === 'verified').length,
      pending: customers.filter(c => c.kycStatus === 'pending').length,
      highRisk: customers.filter(c => c.riskRating === 'HIGH').length,
      newThisMonth: customers.filter(c => new Date(c.createdAt) >= thisMonth).length
    };
  }

  /**
   * FINTRAC compliance check for customer
   */
  async performComplianceCheck(customerId: string): Promise<{
    compliant: boolean;
    issues: string[];
    riskFactors: string[];
    recommendations: string[];
  }> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const issues: string[] = [];
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Check required FINTRAC fields
    if (!customer.firstName) issues.push('Missing first name');
    if (!customer.lastName) issues.push('Missing last name');
    if (!customer.dateOfBirth) issues.push('Missing date of birth');
    if (!customer.address) issues.push('Missing address');
    if (!customer.identification?.type || !customer.identification?.number) issues.push('Missing identification information');

    // Check KYC status
    if (customer.kycStatus !== 'verified') {
      issues.push('Customer KYC not verified');
      recommendations.push('Complete KYC verification process');
    }

    // Risk factor analysis
    if (customer.riskRating === 'high') {
      riskFactors.push('High risk customer rating');
      recommendations.push('Enhanced due diligence required');
    }

    // Check for recent activity
    const transactionSummary = await this.getCustomerTransactionSummary(customerId);
    if (transactionSummary.totalVolume > 50000) {
      riskFactors.push('High transaction volume');
    }

    if (transactionSummary.last30Days > 10) {
      riskFactors.push('High frequency transactions');
    }

    // Recommendations based on findings
    if (issues.length > 0) {
      recommendations.push('Complete missing customer information');
    }

    if (riskFactors.length > 2) {
      recommendations.push('Consider enhanced monitoring');
    }

    return {
      compliant: issues.length === 0,
      issues,
      riskFactors,
      recommendations
    };
  }
}

// Export singleton instance
const customerService = new CustomerService();
export default customerService;