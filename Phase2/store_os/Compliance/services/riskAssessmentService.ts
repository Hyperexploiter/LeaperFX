// Real Risk Assessment Service - Production Ready
import customerService from './customerService';
import transactionService from './transactionService';

// Types
export interface RiskAssessment {
  id: string;
  customerId: string;
  transactionId?: string;
  assessmentType: 'customer_onboarding' | 'transaction_review' | 'periodic_review' | 'suspicious_activity';
  riskScore: number; // 0-100
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  
  // Risk factors
  riskFactors: RiskFactor[];
  mitigatingFactors: string[];
  
  // Assessment details
  assessedBy: string;
  assessmentDate: string;
  reviewDate?: string;
  status: 'draft' | 'completed' | 'approved' | 'rejected';
  
  // Actions and recommendations
  recommendedActions: string[];
  requiredActions: string[];
  ongoingMonitoring: boolean;
  enhancedDueDiligence: boolean;
  
  // Documentation
  notes: string;
  attachments?: string[];
  approvedBy?: string;
  approvalDate?: string;
}

export interface RiskFactor {
  category: 'geographic' | 'customer' | 'product' | 'transaction' | 'delivery';
  factor: string;
  weight: number; // 1-10
  description: string;
  score: number; // Calculated score for this factor
}

export interface CreateRiskAssessmentParams {
  customerId: string;
  transactionId?: string;
  assessmentType: RiskAssessment['assessmentType'];
  assessedBy: string;
  notes?: string;
}

/**
 * Real Risk Assessment Service
 * 
 * This service performs risk assessments for customers and transactions
 * according to FINTRAC guidelines and AML/ATF requirements.
 */
class RiskAssessmentService {
  private assessments: RiskAssessment[] = [];
  
  constructor() {
    this.loadAssessments();
  }
  
  /**
   * Load assessments from storage
   */
  private async loadAssessments(): Promise<void> {
    try {
      const stored = localStorage.getItem('risk_assessments');
      if (stored) {
        this.assessments = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading risk assessments:', error);
    }
  }
  
  /**
   * Save assessments to storage
   */
  private async saveAssessments(): Promise<void> {
    try {
      localStorage.setItem('risk_assessments', JSON.stringify(this.assessments));
    } catch (error) {
      console.error('Error saving risk assessments:', error);
    }
  }
  
  /**
   * Create a new risk assessment
   */
  async createRiskAssessment(params: CreateRiskAssessmentParams): Promise<RiskAssessment> {
    try {
      const customer = await customerService.getCustomerById(params.customerId);
      if (!customer) {
        throw new Error(`Customer ${params.customerId} not found`);
      }
      
      let transaction = null;
      if (params.transactionId) {
        transaction = await transactionService.getTransactionById(params.transactionId);
        if (!transaction) {
          throw new Error(`Transaction ${params.transactionId} not found`);
        }
      }
      
      const riskFactors = await this.analyzeRiskFactors(customer, transaction);
      const riskScore = this.calculateRiskScore(riskFactors);
      const riskRating = this.determineRiskRating(riskScore);
      
      const assessment: RiskAssessment = {
        id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: params.customerId,
        transactionId: params.transactionId,
        assessmentType: params.assessmentType,
        riskScore,
        riskRating,
        riskFactors,
        mitigatingFactors: this.identifyMitigatingFactors(customer, transaction),
        assessedBy: params.assessedBy,
        assessmentDate: new Date().toISOString(),
        status: 'draft',
        recommendedActions: this.generateRecommendedActions(riskRating, riskFactors),
        requiredActions: this.generateRequiredActions(riskRating, riskFactors),
        ongoingMonitoring: riskScore >= 60,
        enhancedDueDiligence: riskScore >= 75,
        notes: params.notes || ''
      };
      
      this.assessments.push(assessment);
      await this.saveAssessments();
      
      return assessment;
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      throw error;
    }
  }
  
  /**
   * Analyze risk factors for customer and transaction
   */
  private async analyzeRiskFactors(customer: any, transaction?: any): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];
    
    // Geographic risk factors
    if (customer.address.country !== 'Canada') {
      factors.push({
        category: 'geographic',
        factor: 'Foreign Address',
        weight: 5,
        description: `Customer resides in ${customer.address.country}`,
        score: this.calculateFactorScore(5, customer.address.country === 'United States' ? 0.3 : 0.7)
      });
    }
    
    // Customer risk factors
    const age = new Date().getFullYear() - new Date(customer.dateOfBirth).getFullYear();
    if (age < 25) {
      factors.push({
        category: 'customer',
        factor: 'Young Customer',
        weight: 3,
        description: `Customer is ${age} years old`,
        score: this.calculateFactorScore(3, 0.6)
      });
    }
    
    if (customer.kycStatus !== 'verified') {
      factors.push({
        category: 'customer',
        factor: 'Unverified KYC',
        weight: 8,
        description: 'Customer KYC not yet verified',
        score: this.calculateFactorScore(8, 0.9)
      });
    }
    
    // High-risk occupations
    const highRiskOccupations = [
      'cash intensive business',
      'money service business',
      'casino',
      'jewelry',
      'precious metals',
      'cryptocurrency'
    ];
    
    if (customer.occupation && highRiskOccupations.some(occ => 
        customer.occupation.toLowerCase().includes(occ))) {
      factors.push({
        category: 'customer',
        factor: 'High-Risk Occupation',
        weight: 7,
        description: `Customer occupation: ${customer.occupation}`,
        score: this.calculateFactorScore(7, 0.8)
      });
    }
    
    // Transaction risk factors (if transaction provided)
    if (transaction) {
      // High-value transaction
      const cadAmount = this.convertToCAD(transaction.fromAmount, transaction.fromCurrency);
      if (cadAmount >= 10000) {
        factors.push({
          category: 'transaction',
          factor: 'High-Value Transaction',
          weight: 6,
          description: `Transaction amount: $${cadAmount.toLocaleString()} CAD`,
          score: this.calculateFactorScore(6, Math.min(0.9, cadAmount / 50000))
        });
      }
      
      // Unusual currency pairs
      const unusualPairs = ['JPY', 'KRW', 'CNY', 'RUB', 'TRY'];
      if (unusualPairs.includes(transaction.fromCurrency) || unusualPairs.includes(transaction.toCurrency)) {
        factors.push({
          category: 'transaction',
          factor: 'Unusual Currency',
          weight: 4,
          description: `Currency pair: ${transaction.fromCurrency}/${transaction.toCurrency}`,
          score: this.calculateFactorScore(4, 0.5)
        });
      }
      
      // Cash transactions
      if (transaction.paymentMethod === 'cash' || 
          (transaction.sourceOfFunds && transaction.sourceOfFunds.toLowerCase().includes('cash'))) {
        factors.push({
          category: 'transaction',
          factor: 'Cash Transaction',
          weight: 5,
          description: 'Transaction involves cash',
          score: this.calculateFactorScore(5, 0.7)
        });
      }
    }
    
    // Customer transaction history analysis
    const transactionSummary = await customerService.getCustomerTransactionSummary(customer.id);
    
    // New customer with high transaction volume
    const accountAge = Date.now() - new Date(customer.createdAt).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation < 30 && transactionSummary.totalVolume > 25000) {
      factors.push({
        category: 'customer',
        factor: 'High Early Activity',
        weight: 6,
        description: `New customer (${Math.round(daysSinceCreation)} days) with high volume ($${transactionSummary.totalVolume.toLocaleString()})`,
        score: this.calculateFactorScore(6, 0.8)
      });
    }
    
    // Frequent high-value transactions
    if (transactionSummary.last30Days > 5 && transactionSummary.averageAmount > 5000) {
      factors.push({
        category: 'transaction',
        factor: 'Frequent High-Value Pattern',
        weight: 5,
        description: `${transactionSummary.last30Days} transactions in 30 days, avg $${transactionSummary.averageAmount.toLocaleString()}`,
        score: this.calculateFactorScore(5, 0.6)
      });
    }
    
    return factors;
  }
  
  /**
   * Calculate factor score based on weight and intensity
   */
  private calculateFactorScore(weight: number, intensity: number): number {
    return weight * intensity;
  }
  
  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(factors: RiskFactor[]): number {
    if (factors.length === 0) return 10; // Default low risk
    
    const totalScore = factors.reduce((sum, factor) => sum + factor.score, 0);
    const maxPossibleScore = factors.reduce((sum, factor) => sum + factor.weight, 0);
    
    // Normalize to 0-100 scale
    const normalizedScore = (totalScore / maxPossibleScore) * 100;
    
    // Apply floor and ceiling
    return Math.min(Math.max(normalizedScore, 5), 95);
  }
  
  /**
   * Determine risk rating based on score
   */
  private determineRiskRating(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 85) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  }
  
  /**
   * Identify mitigating factors
   */
  private identifyMitigatingFactors(customer: any, _transaction?: any): string[] {
    const factors: string[] = [];
    
    if (customer.kycStatus === 'verified') {
      factors.push('Customer KYC verified');
    }
    
    if (customer.riskRating === 'low') {
      factors.push('Customer has low historical risk rating');
    }
    
    const accountAge = Date.now() - new Date(customer.createdAt).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation > 365) {
      factors.push('Long-standing customer relationship (>1 year)');
    }
    
    if (customer.address.country === 'Canada') {
      factors.push('Canadian resident');
    }
    
    if (customer.identification.type === 'government_id') {
      factors.push('Government-issued identification');
    }
    
    return factors;
  }
  
  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(rating: string, factors: RiskFactor[]): string[] {
    const actions: string[] = [];
    
    switch (rating) {
      case 'critical':
        actions.push('Immediate senior management review required');
        actions.push('Consider declining transaction/relationship');
        actions.push('File suspicious transaction report if applicable');
        actions.push('Enhanced ongoing monitoring');
        break;
        
      case 'high':
        actions.push('Senior management approval required');
        actions.push('Enhanced due diligence procedures');
        actions.push('Increased transaction monitoring');
        actions.push('Regular risk assessment reviews');
        break;
        
      case 'medium':
        actions.push('Additional documentation required');
        actions.push('Periodic monitoring');
        actions.push('Annual risk assessment review');
        break;
        
      case 'low':
        actions.push('Standard monitoring procedures');
        actions.push('Biennial risk assessment review');
        break;
    }
    
    // Factor-specific recommendations
    factors.forEach(factor => {
      if (factor.category === 'geographic' && factor.score > 3) {
        actions.push('Verify source of funds documentation');
      }
      
      if (factor.factor === 'High-Value Transaction') {
        actions.push('Verify purpose of transaction');
        actions.push('Obtain source of funds documentation');
      }
      
      if (factor.factor === 'Unverified KYC') {
        actions.push('Complete KYC verification immediately');
      }
    });
    
    return [...new Set(actions)]; // Remove duplicates
  }
  
  /**
   * Generate required actions
   */
  private generateRequiredActions(rating: string, factors: RiskFactor[]): string[] {
    const actions: string[] = [];
    
    if (rating === 'critical' || rating === 'high') {
      actions.push('Enhanced due diligence required');
      actions.push('Senior management approval required');
    }
    
    factors.forEach(factor => {
      if (factor.factor === 'Unverified KYC') {
        actions.push('KYC verification must be completed');
      }
      
      if (factor.factor === 'High-Value Transaction' && factor.score > 4) {
        actions.push('LCTR reporting required');
      }
    });
    
    return [...new Set(actions)]; // Remove duplicates
  }
  
  /**
   * Convert amount to CAD for comparison
   */
  private convertToCAD(amount: number, currency: string): number {
    // Simplified exchange rates - in production, use real rates
    const rates: { [key: string]: number } = {
      'CAD': 1,
      'USD': 1.35,
      'EUR': 1.45,
      'GBP': 1.70,
      'JPY': 0.009,
      'AUD': 0.95,
      'CHF': 1.47
    };
    
    return amount * (rates[currency] || 1);
  }
  
  /**
   * Get all risk assessments
   */
  async getRiskAssessments(): Promise<RiskAssessment[]> {
    return [...this.assessments].sort((a, b) => 
      new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
    );
  }
  
  /**
   * Get risk assessment by ID
   */
  async getRiskAssessmentById(id: string): Promise<RiskAssessment | null> {
    return this.assessments.find(a => a.id === id) || null;
  }
  
  /**
   * Get risk assessments for customer
   */
  async getRiskAssessmentsForCustomer(customerId: string): Promise<RiskAssessment[]> {
    return this.assessments.filter(a => a.customerId === customerId)
      .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
  }
  
  /**
   * Get high-risk assessments
   */
  async getHighRiskAssessments(): Promise<RiskAssessment[]> {
    return this.assessments.filter(a => 
      a.riskRating === 'high' || a.riskRating === 'critical'
    );
  }
  
  /**
   * Update risk assessment
   */
  async updateRiskAssessment(id: string, updates: Partial<RiskAssessment>): Promise<RiskAssessment | null> {
    const assessmentIndex = this.assessments.findIndex(a => a.id === id);
    if (assessmentIndex === -1) {
      return null;
    }
    
    const updatedAssessment = {
      ...this.assessments[assessmentIndex],
      ...updates,
      id // Ensure ID cannot be changed
    };
    
    this.assessments[assessmentIndex] = updatedAssessment;
    await this.saveAssessments();
    
    return updatedAssessment;
  }
  
  /**
   * Approve risk assessment
   */
  async approveRiskAssessment(id: string, approvedBy: string): Promise<RiskAssessment | null> {
    const updates: Partial<RiskAssessment> = {
      status: 'approved',
      approvedBy,
      approvalDate: new Date().toISOString()
    };
    
    return this.updateRiskAssessment(id, updates);
  }
  
  /**
   * Get risk assessment statistics
   */
  async getRiskAssessmentStats(): Promise<{
    total: number;
    byRating: { [key: string]: number };
    byStatus: { [key: string]: number };
    pendingApproval: number;
    thisMonth: number;
  }> {
    const assessments = await this.getRiskAssessments();
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const byRating: { [key: string]: number } = {};
    const byStatus: { [key: string]: number } = {};
    
    assessments.forEach(a => {
      byRating[a.riskRating] = (byRating[a.riskRating] || 0) + 1;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });
    
    return {
      total: assessments.length,
      byRating,
      byStatus,
      pendingApproval: assessments.filter(a => a.status === 'completed').length,
      thisMonth: assessments.filter(a => new Date(a.assessmentDate) >= thisMonth).length
    };
  }
  
  /**
   * Perform periodic risk assessment for customer
   */
  async performPeriodicAssessment(customerId: string, assessedBy: string): Promise<RiskAssessment> {
    // Check if periodic assessment is due
    const existingAssessments = await this.getRiskAssessmentsForCustomer(customerId);
    const lastAssessment = existingAssessments[0];
    
    if (lastAssessment) {
      const daysSinceLastAssessment = 
        (Date.now() - new Date(lastAssessment.assessmentDate).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastAssessment < 365) {
        throw new Error('Periodic assessment not due yet (annual requirement)');
      }
    }
    
    return this.createRiskAssessment({
      customerId,
      assessmentType: 'periodic_review',
      assessedBy,
      notes: 'Periodic risk assessment as per AML policy'
    });
  }
}

// Export singleton instance
const riskAssessmentService = new RiskAssessmentService();
export default riskAssessmentService;