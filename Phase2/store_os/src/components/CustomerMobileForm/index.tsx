import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, User, MapPin, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';

// Field interface definitions
interface FormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string; }[];
  pattern?: string;
  dependsOn?: string;
  dependsValue?: string;
}

interface FormStep {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  fields: FormField[];
  condition?: () => boolean;
}

// Customer Mobile Form - What customers see when they scan the QR code
const CustomerMobileForm: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  // const navigate = useNavigate(); // Commented out as not currently used
  
  const [currentStep, setCurrentStep] = useState<number | 'success'>(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transactionInfo, setTransactionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch transaction info when component mounts
  useEffect(() => {
    const fetchTransactionInfo = async () => {
      setIsLoading(true);
      try {
        // Import the transaction service dynamically to avoid circular dependencies
        const { default: transactionService } = await import('../../services/transactionService');
        
        if (!transactionId) {
          throw new Error('Transaction ID is required');
        }
        
        // Fetch the transaction from the real service
        const transaction = await transactionService.getTransactionById(transactionId);
        
        if (!transaction) {
          throw new Error('Transaction not found');
        }
        
        // Add storeName for display purposes
        const transactionWithStore = {
          ...transaction,
          storeName: 'Saadat Currency Exchange'
        };
        
        setTransactionInfo(transactionWithStore);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        // Show an error message to the user
        setTransactionInfo(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactionInfo();
  }, [transactionId]);

  // Form steps with FINTRAC-compliant fields
  const formSteps: FormStep[] = [
    {
      title: 'Personal Information',
      subtitle: 'Basic details required by law',
      icon: <User className="h-6 w-6" />,
      fields: [
        {
          key: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your first name'
        },
        {
          key: 'lastName',
          label: 'Last Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your last name'
        },
        {
          key: 'dateOfBirth',
          label: 'Date of Birth',
          type: 'date',
          required: true
        },
        {
          key: 'occupation',
          label: 'Occupation',
          type: 'text',
          required: true,
          placeholder: 'e.g., Teacher, Engineer, Student'
        }
      ]
    },
    {
      title: 'Address Information',
      subtitle: 'Your current residential address',
      icon: <MapPin className="h-6 w-6" />,
      fields: [
        {
          key: 'streetAddress',
          label: 'Street Address',
          type: 'text',
          required: true,
          placeholder: '123 Main Street'
        },
        {
          key: 'city',
          label: 'City',
          type: 'text',
          required: true,
          placeholder: 'Montreal'
        },
        {
          key: 'province',
          label: 'Province',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select Province' },
            { value: 'AB', label: 'Alberta' },
            { value: 'BC', label: 'British Columbia' },
            { value: 'MB', label: 'Manitoba' },
            { value: 'NB', label: 'New Brunswick' },
            { value: 'NL', label: 'Newfoundland and Labrador' },
            { value: 'NS', label: 'Nova Scotia' },
            { value: 'NT', label: 'Northwest Territories' },
            { value: 'NU', label: 'Nunavut' },
            { value: 'ON', label: 'Ontario' },
            { value: 'PE', label: 'Prince Edward Island' },
            { value: 'QC', label: 'Quebec' },
            { value: 'SK', label: 'Saskatchewan' },
            { value: 'YT', label: 'Yukon' }
          ]
        },
        {
          key: 'postalCode',
          label: 'Postal Code',
          type: 'text',
          required: true,
          placeholder: 'H1A 0A1',
          pattern: '[A-Za-z]\\d[A-Za-z] \\d[A-Za-z]\\d'
        }
      ]
    },
    {
      title: 'Identification',
      subtitle: 'Valid government-issued ID',
      icon: <CreditCard className="h-6 w-6" />,
      fields: [
        {
          key: 'idType',
          label: 'ID Type',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select ID Type' },
            { value: 'drivers_license', label: "Driver's License" },
            { value: 'passport', label: 'Passport' },
            { value: 'provincial_id', label: 'Provincial ID Card' },
            { value: 'other_government', label: 'Other Government ID' }
          ]
        },
        {
          key: 'idNumber',
          label: 'ID Number',
          type: 'text',
          required: true,
          placeholder: 'Enter your ID number'
        },
        {
          key: 'photoId',
          label: 'Photo ID',
          type: 'text',
          required: !!(transactionInfo && (transactionInfo.requiresLCTR || transactionInfo.requiresEnhancedRecords)),
          placeholder: 'Photo ID reference or number'
        },
        {
          key: 'idExpiry',
          label: 'ID Expiry Date',
          type: 'date',
          required: true
        }
      ]
    },
    {
      title: 'Transaction Details',
      subtitle: 'Additional information for large transactions',
      icon: <Shield className="h-6 w-6" />,
      condition: () => transactionInfo && transactionInfo.toAmount >= 10000,
      fields: [
        {
          key: 'actingForThirdParty',
          label: 'Are you conducting this transaction on behalf of someone else?',
          type: 'radio',
          required: true,
          options: [
            { value: 'no', label: 'No, this is for myself' },
            { value: 'yes', label: 'Yes, for someone else' }
          ]
        },
        {
          key: 'thirdPartyName',
          label: 'Name of person/organization',
          type: 'text',
          required: false,
          dependsOn: 'actingForThirdParty',
          dependsValue: 'yes',
          placeholder: 'Full name or company name'
        },
        {
          key: 'relationshipToThirdParty',
          label: 'Your relationship to them',
          type: 'text',
          required: false,
          dependsOn: 'actingForThirdParty',
          dependsValue: 'yes',
          placeholder: 'e.g., Employee, Family member, Agent'
        },
        {
          key: 'sourceOfFunds',
          label: 'Source of these funds',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select source' },
            { value: 'employment', label: 'Employment Income' },
            { value: 'business', label: 'Business Income' },
            { value: 'investment', label: 'Investment Income' },
            { value: 'sale_of_asset', label: 'Sale of Asset' },
            { value: 'gift', label: 'Gift' },
            { value: 'other', label: 'Other' }
          ]
        },
        {
          key: 'sourceDescription',
          label: 'Please describe (if Other selected)',
          type: 'textarea',
          required: false,
          dependsOn: 'sourceOfFunds',
          dependsValue: 'other',
          placeholder: 'Briefly describe the source of funds'
        }
      ]
    }
  ];

  // Get visible steps based on conditions
  const visibleSteps = formSteps.filter(step => !step.condition || step.condition());
  const totalSteps = visibleSteps.length;

  const validateStep = (stepIndex: number) => {
    const step = visibleSteps[stepIndex];
    const stepErrors: Record<string, string> = {};

    step.fields.forEach(field => {
      if (field.required) {
        // Check dependencies
        if (field.dependsOn && formData[field.dependsOn] !== field.dependsValue) {
          return; // Field is not required due to dependency
        }

        if (!formData[field.key] || formData[field.key] === '') {
          stepErrors[field.key] = `${field.label} is required`;
        }
      }

      // Validate postal code pattern if provided
      if (field.key === 'postalCode' && formData[field.key] && field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(formData[field.key])) {
          stepErrors[field.key] = 'Please enter a valid Canadian postal code (A1A 1A1)';
        }
      }
    });

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (typeof currentStep === 'number' && validateStep(currentStep)) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (typeof currentStep === 'number' && currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Import the customer service dynamically to avoid circular dependencies
      const { default: customerService } = await import('../../services/customerService');
      
      if (!transactionInfo?.id) {
        throw new Error('Transaction ID is required');
      }
      
      // Create or update customer with the form data
      const customer = await customerService.createCustomer({
        ...formData,
        transactions: [transactionInfo.id]
      });
      
      // Associate customer with transaction
      const { default: transactionService } = await import('../../services/transactionService');
      await transactionService.linkCustomerToTransaction(transactionInfo.id, customer.id);
      

      // Show success state
      setCurrentStep('success');
    } catch (error) {
      console.error('Submission error:', error);
      alert('There was an error submitting your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error for this field when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction information...</p>
        </div>
      </div>
    );
  }

  // Error state - transaction not found
  if (!transactionInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the transaction you're looking for. Please check the QR code and try again.</p>
          <button
            onClick={() => { window.location.hash = '#/'; }}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Success screen
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Information Submitted!</h1>
            <p className="text-gray-600">Thank you for providing your information.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Your Transaction</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>ID: {transactionInfo.id}</div>
              <div>{transactionInfo.fromAmount} {transactionInfo.fromCurrency} → {transactionInfo.toAmount} {transactionInfo.toCurrency}</div>
              <div>Commission: ${transactionInfo.commission}</div>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-6">
            <p>Your transaction is now ready to be completed by the store staff.</p>
            <p className="mt-2">Please return to the counter.</p>
          </div>

          <button
            onClick={() => window.close()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Only process form steps when currentStep is a number (not 'success')
  if (typeof currentStep !== 'number') {
    return null; // This case is handled above by the success screen check
  }

  const currentStepData = visibleSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="mr-3 p-1 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {transactionInfo.storeName}
                </h1>
                <p className="text-sm text-gray-600">Customer Information Form</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">Step {currentStep + 1} of {totalSteps}</div>
              <div className="flex mt-1">
                {visibleSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4">
        {/* Transaction Summary */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Your Transaction
          </h2>
          <div className="bg-blue-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Exchange:</span>
              <span className="font-medium">
                {transactionInfo.fromAmount} {transactionInfo.fromCurrency} → {transactionInfo.toAmount} {transactionInfo.toCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Commission:</span>
              <span className="font-medium">${transactionInfo.commission}</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction ID:</span>
              <span className="font-medium">{transactionInfo.id}</span>
            </div>
          </div>
        </div>

        {/* Why We Need This Info */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Why do we need this information?
          </h3>
          <p className="text-sm text-gray-600">
            Canadian law requires us to collect customer information for currency exchanges.
            This helps prevent money laundering and keeps our financial system safe.
          </p>
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <Shield className="h-3 w-3 mr-1" />
            Your information is protected and only shared as required by law
          </div>
        </div>

        {/* Current Step Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                {currentStepData.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentStepData.title}
                </h2>
                <p className="text-sm text-gray-600">{currentStepData.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {currentStepData.fields.map(field => {
              // Check if field should be shown based on dependencies
              if (field.dependsOn && formData[field.dependsOn] !== field.dependsValue) {
                return null;
              }

              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => updateFormData(field.key, e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors[field.key] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {field.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-2">
                      {field.options?.map(option => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name={field.key}
                            value={option.value}
                            checked={formData[field.key] === option.value}
                            onChange={(e) => updateFormData(field.key, e.target.value)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => updateFormData(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                        errors[field.key] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => updateFormData(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors[field.key] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  )}

                  {errors[field.key] && (
                    <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-medium ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : currentStep === totalSteps - 1 ? (
              'Submit Information'
            ) : (
              'Next Step'
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>This information is collected in compliance with Canadian anti-money laundering laws.</p>
          <p className="mt-1">All data is encrypted and securely stored.</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerMobileForm;