import React, { useState, useCallback } from 'react';
import { FileText, Loader, Check, AlertCircle, Eye, Copy } from 'lucide-react';

export interface ExtractedData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  idNumber?: string;
  expiryDate?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  documentType?: 'drivers_license' | 'passport' | 'health_card' | 'provincial_id';
  issuingAuthority?: string;
  confidence: number;
  rawText: string;
}

export interface OCRResult {
  success: boolean;
  data: ExtractedData;
  processingTime: number;
  error?: string;
}

export interface OCRExtractionProps {
  imageFile: File;
  imageDataUrl: string;
  onExtraction: (result: OCRResult) => void;
  onDataApply: (data: Partial<ExtractedData>) => void;
  className?: string;
  autoApply?: boolean;
}

const OCRExtraction: React.FC<OCRExtractionProps> = ({
  imageFile,
  imageDataUrl,
  onExtraction,
  onDataApply,
  className = '',
  autoApply = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  // Simulate OCR processing (in production, you'd use a real OCR service like Tesseract.js, Google Vision API, etc.)
  const processOCR = useCallback(async () => {
    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a mock OCR result based on image analysis
      // In production, this would be replaced with actual OCR
      const mockData = await simulateOCRExtraction(imageFile);
      
      const processingTime = Date.now() - startTime;
      
      const result: OCRResult = {
        success: true,
        data: mockData,
        processingTime
      };

      setExtractedData(mockData);
      onExtraction(result);

      // Auto-apply if enabled and confidence is high
      if (autoApply && mockData.confidence > 0.8) {
        handleApplyAllData();
      }

    } catch (error) {
      console.error('OCR processing error:', error);
      const result: OCRResult = {
        success: false,
        data: {
          confidence: 0,
          rawText: ''
        },
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
      onExtraction(result);
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, onExtraction, autoApply, onDataApply]);

  // Simulate OCR extraction with realistic Canadian document patterns
  const simulateOCRExtraction = async (file: File): Promise<ExtractedData> => {
    const fileName = file.name.toLowerCase();
    let documentType: ExtractedData['documentType'] = 'provincial_id';
    
    // Determine document type from filename/content
    if (fileName.includes('license') || fileName.includes('dl')) {
      documentType = 'drivers_license';
    } else if (fileName.includes('passport')) {
      documentType = 'passport';
    } else if (fileName.includes('health')) {
      documentType = 'health_card';
    }

    // Mock extracted text patterns based on document type
    const mockExtractedData: ExtractedData = {
      confidence: 0.85 + Math.random() * 0.1, // Random confidence between 0.85-0.95
      rawText: generateMockRawText(documentType),
      documentType
    };

    // Parse mock data based on document type
    switch (documentType) {
      case 'drivers_license':
        mockExtractedData.firstName = 'JOHN';
        mockExtractedData.lastName = 'SMITH';
        mockExtractedData.fullName = 'JOHN SMITH';
        mockExtractedData.dateOfBirth = '1990-05-15';
        mockExtractedData.idNumber = 'D1234567890123';
        mockExtractedData.expiryDate = '2028-05-15';
        mockExtractedData.address = '123 MAIN ST';
        mockExtractedData.city = 'TORONTO';
        mockExtractedData.province = 'ON';
        mockExtractedData.postalCode = 'M5V 3A3';
        mockExtractedData.country = 'CANADA';
        mockExtractedData.issuingAuthority = 'ONTARIO MINISTRY OF TRANSPORTATION';
        break;
        
      case 'passport':
        mockExtractedData.firstName = 'JOHN';
        mockExtractedData.lastName = 'SMITH';
        mockExtractedData.fullName = 'JOHN SMITH';
        mockExtractedData.dateOfBirth = '1990-05-15';
        mockExtractedData.idNumber = 'AB123456';
        mockExtractedData.expiryDate = '2030-12-01';
        mockExtractedData.country = 'CANADA';
        mockExtractedData.issuingAuthority = 'PASSPORT CANADA';
        break;
        
      case 'provincial_id':
        mockExtractedData.firstName = 'JOHN';
        mockExtractedData.lastName = 'SMITH';
        mockExtractedData.fullName = 'JOHN SMITH';
        mockExtractedData.dateOfBirth = '1990-05-15';
        mockExtractedData.idNumber = 'ON123456789';
        mockExtractedData.expiryDate = '2027-05-15';
        mockExtractedData.address = '123 MAIN ST';
        mockExtractedData.city = 'TORONTO';
        mockExtractedData.province = 'ON';
        mockExtractedData.postalCode = 'M5V 3A3';
        mockExtractedData.country = 'CANADA';
        mockExtractedData.issuingAuthority = 'ONTARIO PHOTO CARD';
        break;
    }

    return mockExtractedData;
  };

  const generateMockRawText = (docType: ExtractedData['documentType']): string => {
    switch (docType) {
      case 'drivers_license':
        return `ONTARIO
DRIVER'S LICENCE
SMITH
JOHN
123 MAIN ST
TORONTO ON M5V 3A3
DOB: 15/05/1990
EXPIRES: 15/05/2028
DL: D1234567890123
CLASS: G`;
        
      case 'passport':
        return `PASSPORT
CANADA
SMITH
JOHN
PASSPORT NO: AB123456
DATE OF BIRTH: 15 MAY 1990
DATE OF EXPIRY: 01 DEC 2030
PLACE OF BIRTH: TORONTO, ON, CAN`;
        
      default:
        return `ONTARIO
PHOTO CARD
SMITH, JOHN
123 MAIN ST
TORONTO ON M5V 3A3
DOB: 15/05/1990
EXPIRES: 15/05/2027
ID: ON123456789`;
    }
  };

  // Apply specific field to form
  const handleApplyField = useCallback((field: string, value: string) => {
    const dataToApply = { [field]: value };
    onDataApply(dataToApply);
    setAppliedFields(prev => new Set([...prev, field]));
  }, [onDataApply]);

  // Apply all extracted data to form
  const handleApplyAllData = useCallback(() => {
    if (!extractedData) return;
    
    const fieldsToApply = [
      'firstName', 'lastName', 'dateOfBirth', 'idNumber', 'expiryDate',
      'address', 'city', 'province', 'postalCode', 'country'
    ];
    
    const dataToApply: Partial<ExtractedData> = {};
    fieldsToApply.forEach(field => {
      if (extractedData[field as keyof ExtractedData]) {
        dataToApply[field as keyof ExtractedData] = extractedData[field as keyof ExtractedData];
      }
    });

    onDataApply(dataToApply);
    setAppliedFields(new Set(fieldsToApply));
  }, [extractedData, onDataApply]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatFieldValue = (value: any) => {
    if (typeof value === 'string') {
      return value.length > 50 ? value.substring(0, 50) + '...' : value;
    }
    return String(value);
  };

  const renderExtractedField = (label: string, field: string, value: any) => {
    if (!value) return null;
    
    const isApplied = appliedFields.has(field);
    
    return (
      <div key={field} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-sm text-gray-600 truncate">{formatFieldValue(value)}</div>
        </div>
        <div className="ml-3 flex items-center space-x-2">
          {isApplied && (
            <Check className="h-4 w-4 text-green-600" />
          )}
          <button
            onClick={() => handleApplyField(field, value)}
            disabled={isApplied}
            className={`p-1 rounded ${
              isApplied 
                ? 'text-green-600 bg-green-100 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-100'
            }`}
            title={isApplied ? 'Already applied' : 'Apply to form'}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Document Text Extraction
        </h3>
        <p className="text-sm text-gray-600">
          Extract information from your ID document to auto-fill the form
        </p>
      </div>

      {/* Document preview */}
      <div className="mb-6">
        <img
          src={imageDataUrl}
          alt="Document to process"
          className="w-full max-w-sm mx-auto rounded-lg shadow-md"
        />
      </div>

      {/* Processing button */}
      {!extractedData && !isProcessing && (
        <div className="text-center mb-6">
          <button
            onClick={processOCR}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-5 w-5 mr-2" />
            Extract Information
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Loader className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-600">Processing document...</p>
          <p className="text-sm text-gray-500 mt-2">
            Analyzing text and extracting information
          </p>
        </div>
      )}

      {/* Extracted data */}
      {extractedData && !isProcessing && (
        <div className="space-y-4">
          {/* Confidence indicator */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Extraction Complete</span>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(extractedData.confidence)}`}>
              {Math.round(extractedData.confidence * 100)}% confidence
            </div>
          </div>

          {/* Document type */}
          {extractedData.documentType && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Document Type</div>
              <div className="text-sm text-gray-600 capitalize">
                {extractedData.documentType.replace('_', ' ')}
              </div>
            </div>
          )}

          {/* Extracted fields */}
          <div className="space-y-3">
            {renderExtractedField('First Name', 'firstName', extractedData.firstName)}
            {renderExtractedField('Last Name', 'lastName', extractedData.lastName)}
            {renderExtractedField('Date of Birth', 'dateOfBirth', extractedData.dateOfBirth)}
            {renderExtractedField('ID Number', 'idNumber', extractedData.idNumber)}
            {renderExtractedField('Expiry Date', 'expiryDate', extractedData.expiryDate)}
            {renderExtractedField('Address', 'address', extractedData.address)}
            {renderExtractedField('City', 'city', extractedData.city)}
            {renderExtractedField('Province', 'province', extractedData.province)}
            {renderExtractedField('Postal Code', 'postalCode', extractedData.postalCode)}
            {renderExtractedField('Country', 'country', extractedData.country)}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleApplyAllData}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Copy className="h-5 w-5 mr-2" />
              Apply All Information
            </button>

            <button
              onClick={() => setShowRawText(!showRawText)}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showRawText ? 'Hide' : 'Show'} Raw Text
            </button>
          </div>

          {/* Raw extracted text */}
          {showRawText && (
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-sm font-medium text-gray-900 mb-2">Raw Extracted Text:</div>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                {extractedData.rawText}
              </pre>
            </div>
          )}

          {/* Low confidence warning */}
          {extractedData.confidence < 0.7 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">
                    Low Confidence Detection
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Please verify the extracted information carefully before applying it to the form.
                    Consider retaking the photo with better lighting or clearer focus.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OCRExtraction;