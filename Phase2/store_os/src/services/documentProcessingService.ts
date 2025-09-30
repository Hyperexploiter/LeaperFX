// Document Processing Service for ID Validation
// Handles OCR text extraction, document authenticity verification, and data validation

import { 
  DocumentType, 
  ExtractedDocumentData, 
  DocumentAuthenticity, 
  DocumentFile,
  ValidationWorkflowConfig 
} from '../models/idValidationModels';

/**
 * OCR Results from different providers
 */
interface OCRResult {
  success: boolean;
  confidence: number;
  text: string;
  structuredData: { [key: string]: any };
  boundingBoxes: Array<{
    text: string;
    confidence: number;
    coordinates: { x: number; y: number; width: number; height: number };
  }>;
  error?: string;
}

/**
 * Template for document type recognition
 */
interface DocumentTemplate {
  type: DocumentType;
  country: string;
  province?: string;
  version: string;
  
  // Expected fields and their patterns
  fields: {
    [fieldName: string]: {
      pattern: RegExp;
      required: boolean;
      position?: { x: number; y: number; width: number; height: number };
    };
  };
  
  // Security features to look for
  securityFeatures: string[];
  
  // Layout characteristics
  layout: {
    backgroundColor: string;
    expectedDimensions: { width: number; height: number };
    logoPosition?: { x: number; y: number };
    expectedColors: string[];
  };
}

/**
 * Document Processing Service
 * 
 * Provides OCR text extraction, authenticity verification, and structured data extraction
 * from government-issued identification documents for FINTRAC compliance.
 */
class DocumentProcessingService {
  private config: ValidationWorkflowConfig;
  private templates: Map<string, DocumentTemplate> = new Map();

  constructor(config: ValidationWorkflowConfig) {
    this.config = config;
    this.initializeTemplates();
    this._touchPublicAPI();
  }

  /**
   * Initialize document templates for different ID types
   */
  private initializeTemplates(): void {
    // Ontario Driver's License Template
    this.templates.set('drivers_license_ontario', {
      type: 'drivers_license',
      country: 'Canada',
      province: 'Ontario',
      version: '2023',
      fields: {
        licenseNumber: { pattern: /^[A-Z]\d{4}-\d{5}-\d{5}$/, required: true },
        firstName: { pattern: /^[A-Za-z\s'-]+$/, required: true },
        lastName: { pattern: /^[A-Za-z\s'-]+$/, required: true },
        dateOfBirth: { pattern: /^\d{2}\/\d{2}\/\d{4}$/, required: true },
        address: { pattern: /.+/, required: true },
        expiryDate: { pattern: /^\d{2}\/\d{2}\/\d{4}$/, required: true },
        sex: { pattern: /^[MFX]$/, required: true },
        height: { pattern: /^\d{3}\s?cm$/, required: false },
        eyeColor: { pattern: /^(BLU|BRO|GRN|HAZ|GRY|BLK)$/, required: false }
      },
      securityFeatures: ['hologram', 'magnetic_stripe', 'ghost_image', 'tactile_features'],
      layout: {
        backgroundColor: '#E8F4F8',
        expectedDimensions: { width: 856, height: 540 },
        logoPosition: { x: 50, y: 50 },
        expectedColors: ['#003366', '#0066CC', '#E8F4F8']
      }
    });

    // Canadian Passport Template
    this.templates.set('passport_canada', {
      type: 'passport',
      country: 'Canada',
      version: '2023',
      fields: {
        passportNumber: { pattern: /^[A-Z]{2}\d{6}$/, required: true },
        surname: { pattern: /^[A-Za-z\s'-]+$/, required: true },
        givenNames: { pattern: /^[A-Za-z\s'-]+$/, required: true },
        dateOfBirth: { pattern: /^\d{2}[A-Z]{3}\d{4}$/, required: true },
        placeOfBirth: { pattern: /.+/, required: true },
        dateOfIssue: { pattern: /^\d{2}[A-Z]{3}\d{4}$/, required: true },
        dateOfExpiry: { pattern: /^\d{2}[A-Z]{3}\d{4}$/, required: true },
        sex: { pattern: /^[MFX]$/, required: true }
      },
      securityFeatures: ['watermark', 'security_thread', 'intaglio_printing', 'rfid_chip'],
      layout: {
        backgroundColor: '#FFFFFF',
        expectedDimensions: { width: 800, height: 1120 },
        expectedColors: ['#8B0000', '#000080', '#FFFFFF']
      }
    });

    // Add more templates as needed...
  }

  /**
   * Internal: prevent unused method warnings in demo build; these are part of the public API.
   */
  private _touchPublicAPI(): void {
    // No-op references to mark these as used for static analyzers
    void this.processDocument;
    void this.verifyAuthenticity;
  }

  /**
   * Process document using OCR and extract structured data
   */
  async processDocument(documentFile: DocumentFile): Promise<ExtractedDocumentData> {
    try {
      console.log(`Starting document processing for file: ${documentFile.filename}`);
      
      // Step 1: Perform OCR
      const ocrResult = await this.performOCR(documentFile);
      if (!ocrResult.success) {
        throw new Error(`OCR failed: ${ocrResult.error}`);
      }

      // Step 2: Determine document type
      const documentType = await this.identifyDocumentType(ocrResult, documentFile);
      
      // Step 3: Extract structured data
      const extractedData = await this.extractStructuredData(ocrResult, documentType);
      
      // Step 4: Validate extracted data
      const validatedData = await this.validateExtractedData(extractedData, documentType);
      
      console.log('Document processing completed successfully');
      return validatedData;

    } catch (error) {
      console.error('Document processing failed:', error);
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform OCR using configured provider
   */
  private async performOCR(documentFile: DocumentFile): Promise<OCRResult> {
    const provider = this.config.ocrProvider;
    
    try {
      switch (provider) {
        case 'azure':
          return await this.performAzureOCR(documentFile);
        case 'aws':
          return await this.performAWSTextract(documentFile);
        case 'google':
          return await this.performGoogleVision(documentFile);
        case 'tesseract':
        default:
          return await this.performTesseractOCR(documentFile);
      }
    } catch (error) {
      console.error(`OCR processing failed with ${provider}:`, error);
      return {
        success: false,
        confidence: 0,
        text: '',
        structuredData: {},
        boundingBoxes: [],
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }

  /**
   * Azure Computer Vision OCR
   */
  private async performAzureOCR(documentFile: DocumentFile): Promise<OCRResult> {
    // Simulate Azure OCR API call
    // In production, this would integrate with Azure Computer Vision API
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    return {
      success: true,
      confidence: 0.92,
      text: this.generateMockOCRText(documentFile),
      structuredData: this.generateMockStructuredData(documentFile),
      boundingBoxes: this.generateMockBoundingBoxes(),
      error: undefined
    };
  }

  /**
   * AWS Textract OCR
   */
  private async performAWSTextract(documentFile: DocumentFile): Promise<OCRResult> {
    // Simulate AWS Textract API call
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    return {
      success: true,
      confidence: 0.89,
      text: this.generateMockOCRText(documentFile),
      structuredData: this.generateMockStructuredData(documentFile),
      boundingBoxes: this.generateMockBoundingBoxes(),
      error: undefined
    };
  }

  /**
   * Google Vision OCR
   */
  private async performGoogleVision(documentFile: DocumentFile): Promise<OCRResult> {
    // Simulate Google Vision API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      confidence: 0.94,
      text: this.generateMockOCRText(documentFile),
      structuredData: this.generateMockStructuredData(documentFile),
      boundingBoxes: this.generateMockBoundingBoxes(),
      error: undefined
    };
  }

  /**
   * Tesseract OCR (local processing)
   */
  private async performTesseractOCR(documentFile: DocumentFile): Promise<OCRResult> {
    // Simulate Tesseract processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      confidence: 0.78,
      text: this.generateMockOCRText(documentFile),
      structuredData: this.generateMockStructuredData(documentFile),
      boundingBoxes: this.generateMockBoundingBoxes(),
      error: undefined
    };
  }

  /**
   * Identify document type from OCR results
   */
  private async identifyDocumentType(ocrResult: OCRResult, _documentFile: DocumentFile): Promise<DocumentType> {
    const text = ocrResult.text.toLowerCase();
    
    // Driver's License Detection
    if (text.includes('driver') || text.includes('licence') || text.includes('license')) {
      if (text.includes('ontario') || text.includes('ont')) return 'drivers_license';
    }
    
    // Passport Detection
    if (text.includes('passport') || text.includes('canada') || text.includes('passeport')) {
      return 'passport';
    }
    
    // Provincial ID Detection
    if (text.includes('identification') && text.includes('card')) {
      return 'provincial_id';
    }
    
    // Health Card Detection
    if (text.includes('health') && text.includes('card')) {
      return 'health_card';
    }
    
    // Citizenship Detection
    if (text.includes('citizen') || text.includes('citoyenneté')) {
      return 'citizenship_card';
    }
    
    // Default fallback
    return 'other_government_id';
  }

  /**
   * Extract structured data from OCR results
   */
  private async extractStructuredData(ocrResult: OCRResult, documentType: DocumentType): Promise<ExtractedDocumentData> {
    const template = this.getTemplateForDocument(documentType);
    const extractedFields = new Map<string, string>();
    const lowConfidenceFields: string[] = [];
    
    // Extract using template patterns
    if (template) {
      for (const [fieldName, fieldConfig] of Object.entries(template.fields)) {
        const extracted = this.extractField(ocrResult.text, fieldConfig.pattern);
        if (extracted) {
          extractedFields.set(fieldName, extracted);
        } else if (fieldConfig.required) {
          lowConfidenceFields.push(fieldName);
        }
      }
    }
    
    // Build structured data
    const dateOfBirth = extractedFields.get('dateOfBirth') || extractedFields.get('dob') || '';
    const age = dateOfBirth ? this.calculateAge(dateOfBirth) : 0;
    const expiryDate = extractedFields.get('expiryDate') || extractedFields.get('expiry') || '';
    
    return {
      firstName: extractedFields.get('firstName') || extractedFields.get('givenNames') || '',
      lastName: extractedFields.get('lastName') || extractedFields.get('surname') || '',
      fullName: `${extractedFields.get('firstName') || ''} ${extractedFields.get('lastName') || ''}`.trim(),
      dateOfBirth,
      age,
      
      documentType,
      documentNumber: extractedFields.get('licenseNumber') || extractedFields.get('passportNumber') || extractedFields.get('documentNumber') || '',
      issuingAuthority: this.getIssuingAuthority(documentType, extractedFields.get('province') || 'Ontario'),
      issuingProvince: extractedFields.get('province') || 'Ontario',
      issuingCountry: 'Canada',
      issueDate: extractedFields.get('issueDate') || extractedFields.get('dateOfIssue') || '',
      expiryDate,
      isExpired: this.isDocumentExpired(expiryDate),
      
      address: extractedFields.get('address'),
      city: extractedFields.get('city'),
      province: extractedFields.get('province'),
      postalCode: extractedFields.get('postalCode'),
      
      gender: (extractedFields.get('sex') || extractedFields.get('gender')) as 'M' | 'F' | 'X',
      height: extractedFields.get('height'),
      eyeColor: extractedFields.get('eyeColor'),
      restrictions: this.parseRestrictions(extractedFields.get('restrictions') || ''),
      
      extractionConfidence: ocrResult.confidence * 100,
      fieldsExtracted: Array.from(extractedFields.keys()),
      fieldsWithLowConfidence: lowConfidenceFields
    };
  }

  /**
   * Validate extracted data for accuracy and completeness
   */
  private async validateExtractedData(data: ExtractedDocumentData, documentType: DocumentType): Promise<ExtractedDocumentData> {
    // Validation rules
    const validationErrors: string[] = [];
    
    // Required field validation
    if (!data.firstName.trim()) validationErrors.push('firstName');
    if (!data.lastName.trim()) validationErrors.push('lastName');
    if (!data.dateOfBirth) validationErrors.push('dateOfBirth');
    if (!data.documentNumber) validationErrors.push('documentNumber');
    
    // Format validation
    if (data.dateOfBirth && !this.isValidDate(data.dateOfBirth)) {
      validationErrors.push('dateOfBirth');
    }
    
    if (data.expiryDate && !this.isValidDate(data.expiryDate)) {
      validationErrors.push('expiryDate');
    }
    
    // Age validation
    if (data.age < 16 || data.age > 120) {
      validationErrors.push('age');
    }
    
    // Document-specific validation
    if (documentType === 'drivers_license' && data.age < 16) {
      validationErrors.push('age_for_license');
    }
    
    // Update confidence based on validation
    const validationPenalty = validationErrors.length * 10;
    const adjustedConfidence = Math.max(0, data.extractionConfidence - validationPenalty);
    
    return {
      ...data,
      extractionConfidence: adjustedConfidence,
      fieldsWithLowConfidence: [...data.fieldsWithLowConfidence, ...validationErrors]
    };
  }

  /**
   * Verify document authenticity using multiple techniques
   */
  async verifyAuthenticity(documentFile: DocumentFile, extractedData: ExtractedDocumentData): Promise<DocumentAuthenticity> {
    try {
      console.log('Starting document authenticity verification');
      
      // Get template for comparison
      const template = this.getTemplateForDocument(extractedData.documentType);
      
      // Perform various authenticity checks
      const securityFeatures = await this.checkSecurityFeatures(documentFile, template);
      const qualityChecks = await this.performQualityChecks(documentFile);
      const templateMatch = await this.performTemplateMatching(documentFile, template);
      const redFlags = this.identifyRedFlags(extractedData, securityFeatures, qualityChecks);
      const warningFlags = this.identifyWarningFlags(extractedData, qualityChecks);
      
      // Calculate overall authenticity score
      const authenticityScore = this.calculateAuthenticityScore(securityFeatures, qualityChecks, templateMatch, redFlags);
      
      console.log(`Document authenticity verification completed with score: ${authenticityScore}`);
      
      return {
        isAuthentic: authenticityScore >= 70 && redFlags.length === 0,
        confidenceScore: authenticityScore,
        securityFeatures,
        qualityChecks,
        templateMatch,
        redFlags,
        warningFlags
      };

    } catch (error) {
      console.error('Authenticity verification failed:', error);
      return {
        isAuthentic: false,
        confidenceScore: 0,
        securityFeatures: {
          hologram: { present: false, authentic: false, confidence: 0 },
          watermark: { present: false, authentic: false, confidence: 0 },
          microtext: { present: false, authentic: false, confidence: 0 },
          uvFeatures: { present: false, authentic: false, confidence: 0 },
          barcodeQR: { present: false, valid: false, dataMatches: false },
          magneticStripe: { present: false, valid: false }
        },
        qualityChecks: {
          imageQuality: 0,
          lighting: 'poor',
          blur: 100,
          glare: 100,
          completeness: 0
        },
        templateMatch: {
          matched: false,
          templateVersion: '',
          similarityScore: 0,
          expectedFeatures: [],
          missingFeatures: []
        },
        redFlags: ['Verification process failed'],
        warningFlags: []
      };
    }
  }

  // Helper methods for mock data generation and processing

  private generateMockOCRText(_documentFile: DocumentFile): string {
    return `
      ONTARIO
      DRIVER'S LICENCE
      
      Licence No: D1234-56789-01234
      
      SMITH, JOHN MICHAEL
      
      123 MAIN STREET
      TORONTO ON M5V 3A8
      
      DOB: 15/03/1985
      SEX: M
      HEIGHT: 175 cm
      EYES: BLU
      
      Expires: 15/03/2028
      
      Class: G
      Conditions: None
    `;
  }

  private generateMockStructuredData(_documentFile: DocumentFile): { [key: string]: any } {
    return {
      licenseNumber: 'D1234-56789-01234',
      firstName: 'JOHN',
      lastName: 'SMITH',
      address: '123 MAIN STREET TORONTO ON M5V 3A8',
      dateOfBirth: '15/03/1985',
      sex: 'M',
      height: '175 cm',
      eyeColor: 'BLU',
      expiryDate: '15/03/2028'
    };
  }

  private generateMockBoundingBoxes() {
    return [
      { text: 'ONTARIO', confidence: 0.98, coordinates: { x: 200, y: 50, width: 100, height: 25 } },
      { text: 'D1234-56789-01234', confidence: 0.95, coordinates: { x: 150, y: 120, width: 200, height: 20 } },
      { text: 'SMITH, JOHN MICHAEL', confidence: 0.97, coordinates: { x: 100, y: 180, width: 250, height: 22 } }
    ];
  }

  private getTemplateForDocument(documentType: DocumentType): DocumentTemplate | undefined {
    // Simple template matching - in production this would be more sophisticated
    for (const [_key, template] of this.templates.entries()) {
      if (template.type === documentType) {
        return template;
      }
    }
    return undefined;
  }

  private extractField(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[0] : null;
  }

  private calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private isDocumentExpired(expiryDate: string): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    return expiry < new Date();
  }

  private getIssuingAuthority(documentType: DocumentType, province: string): string {
    switch (documentType) {
      case 'drivers_license':
        return `${province} Ministry of Transportation`;
      case 'passport':
        return 'Passport Canada';
      case 'health_card':
        return `${province} Ministry of Health`;
      default:
        return `${province} Government`;
    }
  }

  private parseRestrictions(restrictions: string): string[] {
    if (!restrictions.trim()) return [];
    return restrictions.split(',').map(r => r.trim()).filter(r => r.length > 0);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private async checkSecurityFeatures(_documentFile: DocumentFile, _template?: DocumentTemplate): Promise<any> {
    // Mock security feature detection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      hologram: { present: true, authentic: true, confidence: 0.85 },
      watermark: { present: true, authentic: true, confidence: 0.78 },
      microtext: { present: true, authentic: true, confidence: 0.82 },
      uvFeatures: { present: false, authentic: false, confidence: 0 },
      barcodeQR: { present: true, valid: true, dataMatches: true },
      magneticStripe: { present: true, valid: true }
    };
  }

  private async performQualityChecks(_documentFile: DocumentFile): Promise<any> {
    // Mock quality assessment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      imageQuality: 85,
      lighting: 'good' as const,
      blur: 15,
      glare: 10,
      completeness: 95
    };
  }

  private async performTemplateMatching(_documentFile: DocumentFile, template?: DocumentTemplate): Promise<any> {
    // Mock template matching
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      matched: true,
      templateVersion: template?.version || 'unknown',
      similarityScore: 88,
      expectedFeatures: template?.securityFeatures || [],
      missingFeatures: []
    };
  }

  private identifyRedFlags(extractedData: ExtractedDocumentData, securityFeatures: any, qualityChecks: any): string[] {
    const redFlags: string[] = [];
    
    if (extractedData.isExpired) redFlags.push('Document expired');
    if (qualityChecks.imageQuality < 50) redFlags.push('Poor image quality');
    if (!securityFeatures.hologram.authentic) redFlags.push('Invalid hologram');
    if (extractedData.age < 16) redFlags.push('Invalid age for document type');
    
    return redFlags;
  }

  private identifyWarningFlags(extractedData: ExtractedDocumentData, qualityChecks: any): string[] {
    const warningFlags: string[] = [];
    
    if (qualityChecks.blur > 30) warningFlags.push('Image may be blurry');
    if (qualityChecks.glare > 25) warningFlags.push('Glare detected');
    if (extractedData.extractionConfidence < 80) warningFlags.push('Low OCR confidence');
    
    return warningFlags;
  }

  private calculateAuthenticityScore(securityFeatures: any, qualityChecks: any, templateMatch: any, redFlags: string[]): number {
    let score = 0;
    
    // Security features score (40% weight)
    const securityScore = [
      securityFeatures.hologram.confidence,
      securityFeatures.watermark.confidence,
      securityFeatures.microtext.confidence,
      securityFeatures.barcodeQR.valid ? 1 : 0
    ].reduce((sum, val) => sum + val, 0) / 4 * 40;
    
    // Quality score (30% weight)
    const qualityScore = qualityChecks.imageQuality * 0.3;
    
    // Template match score (30% weight)
    const templateScore = templateMatch.similarityScore * 0.3;
    
    score = securityScore + qualityScore + templateScore;
    
    // Apply red flag penalties
    score -= redFlags.length * 20;
    
    return Math.max(0, Math.min(100, score));
  }
}

export default DocumentProcessingService;