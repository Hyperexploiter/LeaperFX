import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import formService from '../../services/formService';
import { validateCanadianPostalCode, validateCanadianPhone, validateEmail, sanitizeInput, FINTRACValidation } from '../../utils/security';

interface DocumentCapture {
  id: string;
  type: 'photo_id' | 'proof_of_address' | 'selfie';
  file: File;
  preview: string;
  extracted?: any;
}

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  occupation: string;
  
  // Contact Information
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  
  // ID Information
  idType: string;
  idNumber: string;
  idExpiryDate: string;
  idIssuingCountry: string;
  
  // FINTRAC Fields
  purposeOfTransaction: string;
  sourceOfFunds: string;
  thirdPartyInfo?: {
    isThirdParty: boolean;
    name?: string;
    relationship?: string;
  };
}

const EnhancedCustomerForm: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    occupation: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: 'ON',
    postalCode: '',
    country: 'Canada',
    idType: 'drivers_license',
    idNumber: '',
    idExpiryDate: '',
    idIssuingCountry: 'Canada',
    purposeOfTransaction: '',
    sourceOfFunds: '',
    thirdPartyInfo: {
      isThirdParty: false
    }
  });
  
  const [documents, setDocuments] = useState<DocumentCapture[]>([]);
  const [currentCapture, setCurrentCapture] = useState<'photo_id' | 'selfie' | 'proof_of_address' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [complianceFlags, setComplianceFlags] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  const steps = [
    { number: 1, title: 'Personal Information', icon: '👤' },
    { number: 2, title: 'Contact Details', icon: '📍' },
    { number: 3, title: 'ID Documents', icon: '📄' },
    { number: 4, title: 'Transaction Info', icon: '💰' },
    { number: 5, title: 'Review & Submit', icon: '✓' }
  ];

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId || !token) {
        setSessionValid(false);
        return;
      }

      try {
        const isValid = await formService.validateQRSession(sessionId, token);
        setSessionValid(isValid);
      } catch (error) {
        console.error('Session validation error:', error);
        setSessionValid(false);
      }
    };

    void validateSession();
  }, [sessionId, token]);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCapturing(true);
      } else {
        setCameraSupported(false);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraSupported(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !currentCapture) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${currentCapture}-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const preview = URL.createObjectURL(blob);
          
          const newDocument: DocumentCapture = {
            id: `${currentCapture}-${Date.now()}`,
            type: currentCapture,
            file,
            preview
          };
          
          setDocuments(prev => [...prev.filter(d => d.type !== currentCapture), newDocument]);
          stopCamera();
          setCurrentCapture(null);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCapture) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setValidationErrors(prev => ({ ...prev, file: 'Please upload a JPEG or PNG image' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors(prev => ({ ...prev, file: 'File size must be less than 5MB' }));
      return;
    }

    const preview = URL.createObjectURL(file);
    const newDocument: DocumentCapture = {
      id: `${currentCapture}-${Date.now()}`,
      type: currentCapture,
      file,
      preview
    };

    setDocuments(prev => [...prev.filter(d => d.type !== currentCapture), newDocument]);
    setCurrentCapture(null);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        if (!formData.occupation.trim()) errors.occupation = 'Occupation is required';
        break;

      case 2:
        if (!validateEmail(formData.email)) errors.email = 'Valid email is required';
        if (!validateCanadianPhone(formData.phone)) errors.phone = 'Valid Canadian phone number is required';
        if (!formData.address.trim()) errors.address = 'Address is required';
        if (!formData.city.trim()) errors.city = 'City is required';
        if (!validateCanadianPostalCode(formData.postalCode)) errors.postalCode = 'Valid Canadian postal code is required (A1A 1A1)';
        break;

      case 3:
        if (!formData.idNumber.trim()) errors.idNumber = 'ID number is required';
        if (!formData.idExpiryDate) errors.idExpiryDate = 'ID expiry date is required';
        
        const hasPhotoId = documents.some(d => d.type === 'photo_id');
        const hasSelfie = documents.some(d => d.type === 'selfie');
        
        if (!hasPhotoId) errors.photoId = 'Photo ID is required';
        if (!hasSelfie) errors.selfie = 'Selfie is required for verification';
        break;

      case 4:
        if (!formData.purposeOfTransaction.trim()) errors.purposeOfTransaction = 'Purpose of transaction is required';
        if (!formData.sourceOfFunds.trim()) errors.sourceOfFunds = 'Source of funds is required';
        
        if (formData.thirdPartyInfo?.isThirdParty) {
          if (!formData.thirdPartyInfo.name?.trim()) errors.thirdPartyName = 'Third party name is required';
          if (!formData.thirdPartyInfo.relationship?.trim()) errors.thirdPartyRelationship = 'Relationship is required';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Check for compliance flags
      const flags: string[] = [];
      
      if (FINTRACValidation.isHighRiskOccupation(formData.occupation)) {
        flags.push('HIGH_RISK_OCCUPATION');
      }
      
      if (formData.country !== 'Canada' && FINTRACValidation.isHighRiskCountry(formData.country)) {
        flags.push('HIGH_RISK_COUNTRY');
      }
      
      setComplianceFlags(flags);
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !sessionId) return;

    setIsSubmitting(true);

    try {
      // Sanitize all input data
      const sanitizedData = {
        ...formData,
        firstName: sanitizeInput(formData.firstName),
        lastName: sanitizeInput(formData.lastName),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        address: sanitizeInput(formData.address),
        city: sanitizeInput(formData.city),
        occupation: sanitizeInput(formData.occupation)
      };

      await formService.submitCustomerForm({
        sessionId,
        customerData: sanitizedData,
        documents: documents.map(d => d.file),
        submissionSource: 'mobile_self_service'
      });

      // Show success and redirect
      alert('Form submitted successfully! Please wait for the store owner to process your information.');
      navigate('/form-submitted');
      
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 px-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
            currentStep >= step.number 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {currentStep > step.number ? '✓' : step.number}
          </div>
          {index < steps.length - 1 && (
            <div className={`hidden sm:block w-12 h-0.5 mx-2 ${
              currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your first name"
          />
          {validationErrors.firstName && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your last name"
          />
          {validationErrors.lastName && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {validationErrors.dateOfBirth && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
        <input
          type="text"
          value={formData.occupation}
          onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.occupation ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your occupation"
        />
        {validationErrors.occupation && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.occupation}</p>
        )}
        {FINTRACValidation.isHighRiskOccupation(formData.occupation) && (
          <div className="flex items-center mt-1 text-amber-600 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            This occupation may require additional verification
          </div>
        )}
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your email address"
        />
        {validationErrors.email && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="(123) 456-7890"
        />
        {validationErrors.phone && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your street address"
        />
        {validationErrors.address && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="City"
          />
          {validationErrors.city && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
          <select
            value={formData.province}
            onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
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
            <option value="NT">Northwest Territories</option>
            <option value="NU">Nunavut</option>
            <option value="YT">Yukon</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value.toUpperCase() }))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.postalCode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="A1A 1A1"
            maxLength={7}
          />
          {validationErrors.postalCode && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.postalCode}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDocumentCapture = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">ID Documents</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Type *</label>
          <select
            value={formData.idType}
            onChange={(e) => setFormData(prev => ({ ...prev, idType: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="drivers_license">Driver's License</option>
            <option value="passport">Passport</option>
            <option value="provincial_id">Provincial ID</option>
            <option value="health_card">Health Card</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
          <input
            type="text"
            value={formData.idNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.idNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter ID number"
          />
          {validationErrors.idNumber && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.idNumber}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ID Expiry Date *</label>
        <input
          type="date"
          value={formData.idExpiryDate}
          onChange={(e) => setFormData(prev => ({ ...prev, idExpiryDate: e.target.value }))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.idExpiryDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {validationErrors.idExpiryDate && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.idExpiryDate}</p>
        )}
      </div>

      {/* Document Capture Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photo ID */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Photo ID *</h4>
              
              {documents.find(d => d.type === 'photo_id') ? (
                <div className="space-y-2">
                  <img 
                    src={documents.find(d => d.type === 'photo_id')?.preview} 
                    alt="Photo ID" 
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => setCurrentCapture('photo_id')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Retake Photo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {cameraSupported ? (
                    <button
                      onClick={() => {
                        setCurrentCapture('photo_id');
                        void initializeCamera();
                      }}
                      className="flex items-center justify-center w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </button>
                  ) : null}
                  
                  <label className="flex items-center justify-center w-full px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setCurrentCapture('photo_id');
                        handleFileUpload(e);
                      }}
                    />
                  </label>
                  
                  {validationErrors.photoId && (
                    <p className="text-red-500 text-xs">{validationErrors.photoId}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selfie */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <div className="text-2xl mb-2">🤳</div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Selfie *</h4>
              
              {documents.find(d => d.type === 'selfie') ? (
                <div className="space-y-2">
                  <img 
                    src={documents.find(d => d.type === 'selfie')?.preview} 
                    alt="Selfie" 
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => setCurrentCapture('selfie')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Retake Selfie
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {cameraSupported ? (
                    <button
                      onClick={() => {
                        setCurrentCapture('selfie');
                        void initializeCamera();
                      }}
                      className="flex items-center justify-center w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Selfie
                    </button>
                  ) : null}
                  
                  <label className="flex items-center justify-center w-full px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setCurrentCapture('selfie');
                        handleFileUpload(e);
                      }}
                    />
                  </label>
                  
                  {validationErrors.selfie && (
                    <p className="text-red-500 text-xs">{validationErrors.selfie}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Transaction *</label>
        <select
          value={formData.purposeOfTransaction}
          onChange={(e) => setFormData(prev => ({ ...prev, purposeOfTransaction: e.target.value }))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.purposeOfTransaction ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select purpose</option>
          <option value="personal">Personal Use</option>
          <option value="business">Business</option>
          <option value="investment">Investment</option>
          <option value="family_support">Family Support</option>
          <option value="travel">Travel</option>
          <option value="other">Other</option>
        </select>
        {validationErrors.purposeOfTransaction && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.purposeOfTransaction}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source of Funds *</label>
        <select
          value={formData.sourceOfFunds}
          onChange={(e) => setFormData(prev => ({ ...prev, sourceOfFunds: e.target.value }))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.sourceOfFunds ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select source</option>
          <option value="employment">Employment Income</option>
          <option value="business">Business Income</option>
          <option value="investment">Investment</option>
          <option value="savings">Savings</option>
          <option value="sale_of_assets">Sale of Assets</option>
          <option value="loan">Loan</option>
          <option value="gift">Gift</option>
          <option value="other">Other</option>
        </select>
        {validationErrors.sourceOfFunds && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.sourceOfFunds}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.thirdPartyInfo?.isThirdParty || false}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              thirdPartyInfo: {
                ...prev.thirdPartyInfo,
                isThirdParty: e.target.checked
              }
            }))}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">This transaction is on behalf of a third party</span>
        </label>

        {formData.thirdPartyInfo?.isThirdParty && (
          <div className="pl-6 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Third Party Name *</label>
              <input
                type="text"
                value={formData.thirdPartyInfo?.name || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  thirdPartyInfo: {
                    ...(prev.thirdPartyInfo ?? { isThirdParty: false }),
                    name: e.target.value
                  }
                }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.thirdPartyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter third party name"
              />
              {validationErrors.thirdPartyName && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.thirdPartyName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
              <input
                type="text"
                value={formData.thirdPartyInfo?.relationship || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  thirdPartyInfo: {
                    ...(prev.thirdPartyInfo ?? { isThirdParty: false }),
                    relationship: e.target.value
                  }
                }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.thirdPartyRelationship ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Family member, Business partner"
              />
              {validationErrors.thirdPartyRelationship && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.thirdPartyRelationship}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {complianceFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
            <span className="text-sm font-medium text-amber-800">Compliance Notice</span>
          </div>
          <p className="text-sm text-amber-700">
            Your transaction may require additional verification due to regulatory requirements.
          </p>
        </div>
      )}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Information</h3>
      
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
          <p className="text-sm text-gray-600">
            {formData.firstName} {formData.lastName}<br />
            Born: {formData.dateOfBirth}<br />
            Occupation: {formData.occupation}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
          <p className="text-sm text-gray-600">
            {formData.email}<br />
            {formData.phone}<br />
            {formData.address}, {formData.city}, {formData.province} {formData.postalCode}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
          <div className="grid grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="text-center">
                <img src={doc.preview} alt={doc.type} className="w-full h-24 object-cover rounded mb-1" />
                <p className="text-xs text-gray-600 capitalize">{doc.type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>

        {complianceFlags.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3">
            <p className="text-sm text-amber-800">
              ⚠️ This form has been flagged for additional compliance review
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          By submitting this form, you confirm that all information provided is accurate and complete.
          This information will be used for FINTRAC compliance purposes.
        </p>
      </div>
    </div>
  );

  // Camera capture modal
  if (currentCapture && isCapturing) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-lg"
            >
              📸 Capture
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Session</h1>
          <p className="text-gray-600 mb-4">
            This form link has expired or is invalid. Please scan the QR code again or contact the store.
          </p>
        </div>
      </div>
    );
  }

  if (sessionValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Customer Information Form</h1>
            <p className="text-gray-600 mt-2">
              Please provide your information for FINTRAC compliance verification
            </p>
          </div>

          {renderStepIndicator()}

          <div className="mb-8">
            {currentStep === 1 && renderPersonalInfo()}
            {currentStep === 2 && renderContactInfo()}
            {currentStep === 3 && renderDocumentCapture()}
            {currentStep === 4 && renderTransactionInfo()}
            {currentStep === 5 && renderReview()}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Form
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Security notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Info className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Secure & Private</span>
          </div>
          <p className="text-xs text-blue-700">
            Your information is encrypted and handled in accordance with FINTRAC regulations and privacy laws.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCustomerForm;