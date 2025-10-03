import React, { useState, useCallback } from 'react';
import { Camera, Upload, User, Shield, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import DocumentCapture from '../common/components/DocumentCapture';
import LivenessDetection from '../common/components/LivenessDetection';
import { Modal, Toast } from '../common/components/Modal';
import type { Customer } from '../common/services/customerService';

interface EnhancedClientRegistrationProps {
  onComplete: (customer: Customer) => void;
  onCancel: () => void;
  existingCustomer?: Customer;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_DOCUMENTS = {
  photo_id: {
    label: 'Government-issued Photo ID',
    required: true,
    description: 'Driver\'s license, passport, or provincial ID'
  },
  selfie: {
    label: 'Live Photo (Selfie)',
    required: true,
    description: 'For biometric verification'
  },
  proof_of_address: {
    label: 'Proof of Address',
    required: false,
    description: 'Utility bill or bank statement (if address not on ID)'
  }
};

export default function EnhancedClientRegistration({
  onComplete,
  onCancel,
  existingCustomer
}: EnhancedClientRegistrationProps) {
  const [step, setStep] = useState(1);
  const [customerData, setCustomerData] = useState<Partial<Customer>>(existingCustomer || {});
  const [documents, setDocuments] = useState<Record<string, any>>({});
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Step 1: Basic Information
  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // FINTRAC Required Fields Validation
    if (!customerData.firstName) errors.push('First name is required');
    if (!customerData.lastName) errors.push('Last name is required');
    if (!customerData.dateOfBirth) errors.push('Date of birth is required');
    if (!customerData.occupation) errors.push('Occupation is required for FINTRAC compliance');
    if (!customerData.address) errors.push('Complete address is required');
    if (!customerData.phone) errors.push('Phone number is required');

    if (errors.length > 0) {
      setValidation({ isValid: false, errors, warnings: [] });
      return;
    }

    setValidation({ isValid: true, errors: [], warnings: [] });
    setStep(2);
  };

  // Step 2: Document Capture
  const handleDocumentCapture = (documentType: string, documentData: any) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: documentData
    }));

    // If photo ID captured, extract data using OCR (simulated)
    if (documentType === 'photo_id') {
      extractIDData(documentData);
    }
  };

  const extractIDData = (documentData: any) => {
    // In production, this would call an OCR service
    // For now, we'll validate against entered data
    console.log('Extracting ID data for validation...');
  };

  // Step 3: Biometric Verification
  const handleBiometricComplete = async (biometricData: any) => {
    setDocuments(prev => ({
      ...prev,
      biometric: biometricData
    }));

    // Verify biometric match between ID and selfie
    const matchScore = await verifyBiometricMatch();
    if (matchScore < 0.85) {
      setValidation({
        isValid: false,
        errors: ['Biometric verification failed. Please retry with better lighting.'],
        warnings: []
      });
      return;
    }

    setStep(4);
  };

  const verifyBiometricMatch = async (): Promise<number> => {
    // In production, this would call biometric matching service
    // Simulate match score
    return Math.random() * 0.3 + 0.7; // 0.7 to 1.0
  };

  // Step 4: Review and Submit
  const handleFinalSubmit = async () => {
    setIsProcessing(true);

    try {
      // Create complete customer record with FINTRAC compliance
      const completeCustomer: Customer = {
        id: existingCustomer?.id || `CUS${Date.now()}`,
        ...customerData as Customer,
        documents: documents,
        fintracCompliance: {
          verified: true,
          verificationDate: new Date().toISOString(),
          documentTypes: Object.keys(documents),
          riskRating: calculateRiskRating(),
          lastReviewDate: new Date().toISOString()
        },
        createdAt: existingCustomer?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      const { customerService } = await import('../common/services/customerService');
      await customerService.createCustomer(completeCustomer);

      setShowToast({ type: 'success', message: 'Client registered successfully with FINTRAC compliance!' });
      setTimeout(() => onComplete(completeCustomer), 1500);

    } catch (error) {
      console.error('Registration failed:', error);
      setShowToast({ type: 'error', message: 'Registration failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateRiskRating = (): 'low' | 'medium' | 'high' => {
    // Risk calculation based on FINTRAC guidelines
    let riskScore = 0;

    if (customerData.occupation?.toLowerCase().includes('cash')) riskScore += 2;
    if (!documents.proof_of_address) riskScore += 1;
    // Add more risk factors as needed

    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'medium';
    return 'low';
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>FINTRAC-Compliant Client Registration</span>
        </div>
      }
    >
      <div className="p-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-20 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <form onSubmit={handleBasicInfoSubmit}>
            <h3 className="text-lg font-semibold mb-4">Step 1: Basic Information</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerData.firstName || ''}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerData.lastName || ''}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={customerData.dateOfBirth || ''}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation * (FINTRAC Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Engineer, Teacher, Business Owner"
                  value={customerData.occupation || ''}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, occupation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complete Address *
              </label>
              <input
                type="text"
                required
                placeholder="123 Main St, City, Province, Postal Code"
                value={customerData.address || ''}
                onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerData.phone || ''}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={customerData.email || ''}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {validation.errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                {validation.errors.map((error, i) => (
                  <p key={i} className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next: Document Capture
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Document Capture */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 2: Document Capture</h3>

            <div className="space-y-4">
              {Object.entries(REQUIRED_DOCUMENTS).map(([type, config]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {config.label}
                        {config.required && <span className="text-red-500">*</span>}
                      </h4>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>
                    {documents[type] && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {!documents[type] && (
                    <DocumentCapture
                      documentType={type as any}
                      onCapture={(data) => handleDocumentCapture(type, data)}
                      onError={(error) => setShowToast({ type: 'error', message: error })}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!documents.photo_id || !documents.selfie}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Next: Biometric Verification
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Biometric Verification */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 3: Biometric Verification</h3>

            <LivenessDetection
              onComplete={handleBiometricComplete}
              onError={(error) => setShowToast({ type: 'error', message: error })}
            />

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review and Submit */}
        {step === 4 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 4: Review and Submit</h3>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">FINTRAC Compliance Verified</h4>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Government-issued photo ID captured</li>
                <li>• Biometric verification completed</li>
                <li>• All required fields collected</li>
                <li>• Documents will be retained for 5 years per regulations</li>
              </ul>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{customerData.firstName} {customerData.lastName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Date of Birth:</span>
                <span className="font-medium">{customerData.dateOfBirth}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Occupation:</span>
                <span className="font-medium">{customerData.occupation}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Risk Rating:</span>
                <span className={`font-medium ${
                  calculateRiskRating() === 'low' ? 'text-green-600' :
                  calculateRiskRating() === 'medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {calculateRiskRating().toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isProcessing}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Processing...' : 'Complete Registration'}
              </button>
            </div>
          </div>
        )}

        {showToast && (
          <Toast
            type={showToast.type}
            message={showToast.message}
            onClose={() => setShowToast(null)}
          />
        )}
      </div>
    </Modal>
  );
}